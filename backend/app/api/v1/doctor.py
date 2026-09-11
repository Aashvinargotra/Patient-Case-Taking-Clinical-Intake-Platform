from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import get_db
from app.models.schemas import (
    patients,
    visit_sessions,
    clinical_summaries,
    token_records,
    medical_documents,
    extracted_entities,
    doctors,
    audit_logs
)
from app.engines.timeline_engine import build_patient_timeline

router = APIRouter(prefix="/doctor", tags=["Physician Clinical Console"])

class SignSummaryRequest(BaseModel):
    doctor_id: str
    doctor_notes: Optional[str] = None
    amended_summary_text: Optional[str] = None

@router.get("/opd-queue")
async def get_doctor_opd_queue(department_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns prioritized department worklist for the attending physician.
    High-priority (RED / AMBER) tokens appear first.
    """
    q = select(
        token_records.c.token_id,
        token_records.c.token_number,
        token_records.c.priority_tier,
        token_records.c.queue_status,
        token_records.c.issued_at,
        visit_sessions.c.session_id,
        visit_sessions.c.patient_id,
        visit_sessions.c.assigned_room,
        patients.c.full_name.label("patient_name"),
        patients.c.gender,
        clinical_summaries.c.chief_complaint,
        clinical_summaries.c.summary_id
    ).join(visit_sessions, token_records.c.session_id == visit_sessions.c.session_id)\
     .join(patients, token_records.c.patient_id == patients.c.patient_id)\
     .outerjoin(clinical_summaries, token_records.c.session_id == clinical_summaries.c.session_id)\
     .where(token_records.c.department_id == department_id)\
     .where(token_records.c.queue_status.in_(["WAITING", "CALLED"]))\
     .order_by(
         # Priority order: RED -> AMBER -> NORMAL, then token_number asc
         token_records.c.priority_tier == "RED",
         token_records.c.priority_tier == "AMBER",
         token_records.c.token_number.asc()
     )

    rows = (await db.execute(q)).fetchall()
    return [dict(r._mapping) for r in rows]

@router.get("/patient-lookup/{patient_id}")
async def lookup_patient_case(patient_id: str, db: AsyncSession = Depends(get_db)):
    """
    Comprehensive physician lookup: loads current draft clinical intake summary,
    recent chief complaint, longitudinal timeline, and OCR extracted abnormal labs.
    """
    # 1. Patient Demographics
    q_p = select(patients).where(patients.c.patient_id == patient_id).where(patients.c.is_archived == False)
    patient = (await db.execute(q_p)).fetchone()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    # 2. Latest Clinical Summary (Draft or Verified)
    q_sum = select(clinical_summaries).where(clinical_summaries.c.patient_id == patient_id)\
        .order_by(clinical_summaries.c.generated_at.desc()).limit(1)
    summary = (await db.execute(q_sum)).fetchone()

    # 3. Longitudinal Medical Timeline
    timeline = await build_patient_timeline(patient_id, db)

    # 4. Abnormal Investigation Values
    q_abnormal = select(extracted_entities, medical_documents.c.original_filename)\
        .join(medical_documents, extracted_entities.c.doc_id == medical_documents.c.doc_id)\
        .where(medical_documents.c.patient_id == patient_id)\
        .where(extracted_entities.c.is_abnormal == True)
    abnormal_rows = (await db.execute(q_abnormal)).fetchall()

    return {
        "patient": {
            "patient_id": patient.patient_id,
            "full_name": patient.full_name,
            "gender": patient.gender,
            "birth_year": patient.birth_year,
            "is_temporary": patient.is_temporary,
            "abha_address": patient.abha_address
        },
        "current_summary": dict(summary._mapping) if summary else None,
        "timeline": timeline,
        "abnormal_investigations": [dict(r._mapping) for r in abnormal_rows]
    }

@router.put("/summary/{summary_id}/sign")
async def sign_clinical_summary(summary_id: str, req: SignSummaryRequest, db: AsyncSession = Depends(get_db)):
    """
    Physician digital verification and sign-off.
    Converts draft record (is_draft = TRUE) to official signed medical case sheet (is_draft = FALSE).
    """
    q = select(clinical_summaries).where(clinical_summaries.c.summary_id == summary_id)
    summary = (await db.execute(q)).fetchone()
    if not summary:
        raise HTTPException(status_code=404, detail="Clinical summary not found")

    # Verify doctor exists
    q_doc = select(doctors).where(doctors.c.doctor_id == req.doctor_id)
    doc = (await db.execute(q_doc)).fetchone()
    if not doc:
        raise HTTPException(status_code=400, detail="Invalid doctor ID for sign-off")

    now = datetime.now(timezone.utc)
    updates = {
        "is_draft": False,
        "verified_by_doctor_id": req.doctor_id,
        "verified_at": now,
        "doctor_notes": req.doctor_notes
    }
    if req.amended_summary_text:
        updates["draft_summary_text"] = req.amended_summary_text

    await db.execute(
        update(clinical_summaries)
        .where(clinical_summaries.c.summary_id == summary_id)
        .values(**updates)
    )

    # Mark visit session COMPLETED
    await db.execute(
        update(visit_sessions)
        .where(visit_sessions.c.session_id == summary.session_id)
        .values(status="COMPLETED")
    )

    # Audit log entry
    await db.execute(audit_logs.insert().values(
        event_type="CLINICAL_SUMMARY_SIGNED",
        user_id=req.doctor_id,
        user_role="DOCTOR",
        target_patient_id=summary.patient_id,
        action_details={"summary_id": summary_id, "verified_at": now.isoformat()},
        status="SUCCESS"
    ))

    await db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Summary {summary_id} verified and signed by Dr. {doc.full_name}",
        "is_draft": False,
        "verified_at": now.isoformat()
    }
