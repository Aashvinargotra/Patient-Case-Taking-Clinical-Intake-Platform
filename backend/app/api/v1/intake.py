import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, insert, func

from app.db.session import get_db
from app.models.schemas import (
    hospitals,
    patients,
    visit_sessions,
    consent_records,
    clinical_summaries,
    token_records,
    triage_alerts
)
from app.engines.speech_pipeline import transcribe_audio, synthesize_speech
from app.engines.dialogue_engine import AllopathicDialogueEngine, AyushDialogueEngine
from app.engines.red_flag_engine import evaluate_slot_scoped_triage, triage_ws_manager, send_scoped_emergency_sms
from app.engines.summary_generator import generate_bilingual_draft_summary
from app.engines.routing_engine import determine_department
from app.core.security import generate_signed_qr_token

router = APIRouter(prefix="/intake", tags=["Kiosk Clinical Intake"])

@router.get("/hospitals")
async def get_linked_hospitals(db: AsyncSession = Depends(get_db)):
    """
    Returns list of all active linked network hospitals for OPD registration and parchi generation.
    """
    q = select(hospitals).where(hospitals.c.is_active == True)
    rows = (await db.execute(q)).fetchall()
    return [dict(r._mapping) for r in rows]

class StartSessionRequest(BaseModel):
    patient_id: str
    hospital_id: Optional[str] = "HOSP-AIIA-ND"
    discipline: str = Field(default="ALLOPATHY", description="ALLOPATHY | AYUSH")
    language: str = Field(default="hi", description="hi, en, pa, ta, te, bn, mr, gu")
    kiosk_terminal_id: str = "KIOSK-TERMINAL-01"

class IntakeTurnRequest(BaseModel):
    session_id: str
    current_step: Optional[str] = None
    input_mode: str = Field(default="VOICE", description="VOICE | TOUCH")
    audio_base64: Optional[str] = None
    selected_option_value: Optional[str] = None
    extracted_slot_value: Optional[str] = None

class FinalizeIntakeRequest(BaseModel):
    session_id: str
    hospital_id: Optional[str] = "HOSP-AIIA-ND"
    discipline: str = "ALLOPATHY"
    slots: Dict[str, Any]
    language: str = "hi"
    save_mode: str = "GENERATE_PARCHI" # GENERATE_PARCHI | ACCOUNT_ONLY

@router.post("/session/start")
async def start_intake_session(req: StartSessionRequest, db: AsyncSession = Depends(get_db)):
    """
    Initializes an OPD clinical intake session and registers DPDP-compliant consent.
    """
    # Verify patient exists
    p_row = (await db.execute(select(patients).where(patients.c.patient_id == req.patient_id))).fetchone()
    if not p_row:
        raise HTTPException(status_code=404, detail="Patient record not found")

    session_id = str(uuid.uuid4())
    consent_id = str(uuid.uuid4())

    # 1. Create Visit Session
    await db.execute(visit_sessions.insert().values(
        session_id=session_id,
        patient_id=req.patient_id,
        intake_language=req.language,
        status="IN_PROGRESS",
        intake_channel="KIOSK"
    ))

    # 2. Register Vernacular Consent
    await db.execute(consent_records.insert().values(
        consent_id=consent_id,
        patient_id=req.patient_id,
        session_id=session_id,
        consent_type="CLINICAL_INTAKE",
        vernacular_language=req.language,
        kiosk_terminal_id=req.kiosk_terminal_id
    ))

    await db.commit()

    # Get first prompt
    engine = AyushDialogueEngine if req.discipline.upper() == "AYUSH" else AllopathicDialogueEngine
    first_step = engine.get_next_prompt(None, language=req.language)

    return {
        "session_id": session_id,
        "patient_id": req.patient_id,
        "patient_name": p_row.full_name,
        "discipline": req.discipline,
        "language": req.language,
        "current_step": first_step
    }

@router.post("/session/turn")
async def process_intake_turn(req: IntakeTurnRequest, db: AsyncSession = Depends(get_db)):
    """
    Processes a single conversational turn (Voice or Touch), extracting slots and returning the next prompt.
    """
    session = (await db.execute(select(visit_sessions).where(visit_sessions.c.session_id == req.session_id))).fetchone()
    if not session or session.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Active intake session not found")

    language = session.intake_language
    transcript = None
    slot_val = req.selected_option_value or req.extracted_slot_value

    if req.input_mode == "VOICE" and req.audio_base64:
        asr_res = await transcribe_audio(req.audio_base64, language_code=language)
        transcript = asr_res.get("transcript")
        slot_val = slot_val or transcript

    # Advance state machine
    # Check if this session is AYUSH or Allopathy
    engine = AllopathicDialogueEngine
    next_step = engine.get_next_prompt(req.current_step, language=language)

    return {
        "session_id": req.session_id,
        "transcript": transcript,
        "extracted_value": slot_val,
        "next_step": next_step
    }

@router.post("/finalize")
@router.post("/session/finalize")
async def finalize_intake_session(req: FinalizeIntakeRequest, db: AsyncSession = Depends(get_db)):
    """
    Finalizes the intake session:
    1. Evaluates slot-scoped red flags (Tier 1 RED / Tier 2 AMBER).
    2. Broadcasts desktop buzzer to emergency staff if RED.
    3. Synthesizes bilingual draft summary (is_draft = TRUE).
    4. Deterministically routes patient and issues cryptographically signed token slip.
    """
    session = (await db.execute(select(visit_sessions).where(visit_sessions.c.session_id == req.session_id))).fetchone()
    
    patient_id = None
    if session:
        patient_id = session.patient_id
    else:
        # Resilient auto-creation for 1-tap walk-in / direct kiosk sessions
        patient_id = f"PAT-WALK-{str(uuid.uuid4())[:6].upper()}"
        patient_name = "Walk-in Patient"
        if req.slots and isinstance(req.slots, dict):
            if req.slots.get("patient_name"):
                patient_name = req.slots["patient_name"]
            elif req.slots.get("full_name"):
                patient_name = req.slots["full_name"]

        await db.execute(patients.insert().values(
            patient_id=patient_id,
            full_name=patient_name,
            gender="MALE",
            birth_year=1990,
            is_temporary=True
        ))

        await db.execute(visit_sessions.insert().values(
            session_id=req.session_id,
            patient_id=patient_id,
            intake_language=req.language or "hi",
            status="IN_PROGRESS",
            intake_channel="KIOSK"
        ))
        await db.flush()
        session = (await db.execute(select(visit_sessions).where(visit_sessions.c.session_id == req.session_id))).fetchone()

    patient = (await db.execute(select(patients).where(patients.c.patient_id == patient_id))).fetchone()
    patient_name = patient.full_name if patient else "Walk-in Patient"

    chief_complaint = req.slots.get("chief_complaint", "General consultation") if req.slots else "General consultation"
    if not chief_complaint or chief_complaint == "General consultation":
        for k in ["symptom", "pain_area", "primary_concern", "complaint"]:
            if req.slots and req.slots.get(k):
                chief_complaint = str(req.slots[k])
                break

    # 1. Red-Flag Evaluation
    triage_result = evaluate_slot_scoped_triage(req.slots or {})
    priority_tier = "NORMAL"
    is_emergency = False

    if triage_result:
        priority_tier = triage_result["tier"]
        is_emergency = (priority_tier == "RED")

        alert_id = str(uuid.uuid4())
        await db.execute(triage_alerts.insert().values(
            alert_id=alert_id,
            session_id=req.session_id,
            patient_id=patient_id,
            severity_tier=priority_tier,
            trigger_rule=triage_result["rule_id"],
            trigger_slots=triage_result["trigger_slots"],
            status="ACTIVE"
        ))

        # Real-time WebSocket desktop buzzer broadcast
        await triage_ws_manager.broadcast_alert({
            "event": "RED_FLAG_ALERT",
            "tier": priority_tier,
            "session_id": req.session_id,
            "patient_name": patient_name,
            "rule": triage_result["description"]
        })

    # 2. Department & Room Routing
    dept_info = determine_department(chief_complaint, discipline=req.discipline, is_emergency=is_emergency)

    # 3. Hospital Name Lookup
    hosp_name = "All India Institute of Ayurveda (AIIA), New Delhi"
    if req.hospital_id:
        h_row = (await db.execute(select(hospitals).where(hospitals.c.hospital_id == req.hospital_id))).fetchone()
        if h_row:
            hosp_name = h_row.name

    # 4. Generate Sequential Token Number & Signed QR Token (if generating Parchi)
    max_tok = (await db.execute(select(func.max(token_records.c.token_number)))).scalar()
    token_number = int(max_tok + 1) if (max_tok is not None and max_tok >= 100) else 104
    signed_qr = generate_signed_qr_token(req.session_id, patient_id, token_number)

    if req.save_mode != "ACCOUNT_ONLY":
        await db.execute(token_records.insert().values(
            token_id=str(uuid.uuid4()),
            session_id=req.session_id,
            patient_id=patient_id,
            hospital_id=req.hospital_id,
            token_number=token_number,
            department_id=dept_info["dept_id"],
            priority_tier=priority_tier,
            signed_qr_token=signed_qr,
            queue_status="WAITING"
        ))

    # 5. Generate Bilingual Draft Summary
    summary_data = generate_bilingual_draft_summary(
        discipline=req.discipline,
        patient_name=patient_name,
        slots=req.slots or {},
        language=req.language
    )

    summary_id = str(uuid.uuid4())
    await db.execute(clinical_summaries.insert().values(
        summary_id=summary_id,
        session_id=req.session_id,
        patient_id=patient_id,
        chief_complaint=chief_complaint,
        structured_history=summary_data["structured_history"],
        draft_summary_text=summary_data["draft_summary_text"],
        is_draft=True
    ))

    # 6. Update Visit Session
    await db.execute(
        update(visit_sessions)
        .where(visit_sessions.c.session_id == req.session_id)
        .values(
            hospital_id=req.hospital_id,
            department_id=dept_info["dept_id"],
            assigned_room=dept_info["room"],
            status="READY_FOR_DR" if req.save_mode != "ACCOUNT_ONLY" else "COMPLETED",
            completion_time=datetime.now(timezone.utc)
        )
    )

    # If Red flag, send scoped SMS to duty doctor & triage nurse
    sms_dispatched = []
    if is_emergency:
        sms_dispatched = await send_scoped_emergency_sms(
            db,
            department_id=dept_info["dept_id"],
            alert_info={"tier": "RED", "token_number": token_number}
        )

    await db.commit()

    return {
        "status": "SUCCESS",
        "save_mode": req.save_mode,
        "session_id": req.session_id,
        "hospital_id": req.hospital_id,
        "hospital_name": hosp_name,
        "token_number": token_number if req.save_mode != "ACCOUNT_ONLY" else None,
        "department": dept_info["name"],
        "assigned_room": dept_info["room"],
        "room": dept_info["room"],
        "assigned_doctor_id": dept_info.get("assigned_doctor_id", "DOC-GENMED-01"),
        "assigned_doctor_name": dept_info.get("assigned_doctor_name", "Attending Duty Physician"),
        "priority_tier": priority_tier,
        "signed_qr_token": signed_qr,
        "signed_qr_payload": signed_qr,
        "estimated_wait_mins": 15,
        "patient_confirmation_text": summary_data["patient_confirmation_text"],
        "draft_summary_text": summary_data["draft_summary_text"],
        "sms_dispatched_count": len(sms_dispatched)
    }
