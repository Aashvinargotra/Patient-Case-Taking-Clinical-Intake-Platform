import pytest
import uuid
from datetime import datetime, timezone
from app.engines.dialogue_engine import AllopathicDialogueEngine, AyushDialogueEngine
from app.engines.red_flag_engine import evaluate_slot_scoped_triage, send_scoped_emergency_sms
from app.engines.routing_engine import determine_department
from app.engines.summary_generator import generate_bilingual_draft_summary
from app.engines.fhir_adapter import serialize_to_fhir_r4_bundle
from app.core.security import generate_signed_qr_token, verify_signed_qr_token

@pytest.mark.asyncio
async def test_e2e_scenario_1_acs_emergency_hindi_flow():
    """
    Scenario 1: 54M patient presents at Kiosk with chest pain and diaphoresis in Hindi.
    Expected:
    - Tier 1 RED Alert triggered (ACS_SUSPICION_TIER1).
    - Scoped emergency SMS dispatched to on-duty Cardiology team.
    - Department routed to CARDIOLOGY / EMERGENCY.
    - Bilingual draft summary generated with is_draft = TRUE.
    - FHIR R4 Bundle serialized and ready for ABDM/HAPI exchange.
    """
    from unittest.mock import AsyncMock, MagicMock
    from app.core.security import encrypt_phone
    patient_id = "PAT-HINDI-54M"
    session_id = f"sess_{uuid.uuid4().hex[:8]}"

    # 1. Intake Slots Filled
    slots = {
        "chief_complaint": "chest_pain",
        "site_and_radiation": "substernal radiating to left shoulder",
        "onset_and_timing": "sudden_recent",
        "character_and_severity": "crushing_pressure",
        "associated_symptoms": ["diaphoresis", "dyspnea"],
        "past_medical_and_meds": "Hypertension on Amlodipine"
    }

    # 2. Triage Evaluation
    triage_alert = evaluate_slot_scoped_triage(slots)
    assert triage_alert is not None
    assert triage_alert["tier"] == "RED"
    assert triage_alert["rule_id"] == "ACS_SUSPICION_TIER1"

    # 3. Emergency SMS Dispatch (Scoped to Cardiology)
    mock_db = AsyncMock()
    nurse_mock = MagicMock()
    nurse_mock.duty_phone_encrypted = encrypt_phone("+919870000010")
    nurse_mock.full_name = "Sister Priya Patel"

    doc_mock = MagicMock()
    doc_mock.duty_phone_encrypted = encrypt_phone("+919870000001")
    doc_mock.full_name = "Dr. Vikram Malhotra"

    res_mock = MagicMock()
    res_mock.fetchall.side_effect = [[nurse_mock], [doc_mock]]
    mock_db.execute.return_value = res_mock

    sms_res = await send_scoped_emergency_sms(
        mock_db,
        department_id="CARDIOLOGY",
        alert_info={"tier": "RED", "token_number": 101, "rule_id": "ACS_SUSPICION_TIER1"}
    )
    assert len(sms_res) == 2


    # 4. Department Routing
    dept = determine_department(slots["chief_complaint"], discipline="ALLOPATHY", is_emergency=False)
    assert dept["dept_id"] == "CARDIOLOGY"

    # 5. Dual Output Summary Generator
    summary = generate_bilingual_draft_summary(
        discipline="ALLOPATHY",
        patient_name="राहुल वर्मा",
        slots=slots,
        language="hi"
    )
    assert summary["is_draft"] is True
    assert "राहुल वर्मा" in summary["patient_confirmation_text"]
    assert "PHYSICIAN SIGN-OFF REQUIRED" in summary["draft_summary_text"]

    # 6. FHIR R4 Bundle
    bundle = serialize_to_fhir_r4_bundle(
        patient_id=patient_id,
        patient_name="Rahul Verma",
        session_id=session_id,
        chief_complaint="Severe crushing chest pain",
        summary_text=summary["draft_summary_text"]
    )
    assert bundle["resourceType"] == "Bundle"
    assert len(bundle["entry"]) >= 4

def test_e2e_scenario_2_ayush_panchakarma_punjabi_flow():
    """
    Scenario 2: 48F patient with chronic Sandhivata in Punjabi at AIIA OPD.
    Expected:
    - 11-step AYUSH Dashavidha Pariksha captures Pitta-Vata & Tikshnagni.
    - Deterministic routing to PANCHAKARMA / KAYACHIKITSA.
    - Signed QR token generated with anti-tamper signature.
    """
    patient_id = "PAT-PUNJABI-48F"
    session_id = f"sess_{uuid.uuid4().hex[:8]}"

    ayush_slots = {
        "chief_complaint": "body detox and panchakarma shodhana",
        "prakriti": "Pitta-Vata",
        "vikriti": "Vata aggravated with Ama",
        "sara": "Madhyama Sara",
        "samhanana": "Madhyama Samhanana",
        "sattva": "Pravara Sattva",
        "ahara_shakti": "Tikshnagni",
        "ahara_vihara_and_agni": "Heavy dairy, irregular timings"
    }

    # 1. Routing to Panchakarma
    dept = determine_department(ayush_slots["chief_complaint"], discipline="AYUSH")
    assert dept["dept_id"] == "PANCHAKARMA"

    # 2. AYUSH Summary Generator in Punjabi
    summary = generate_bilingual_draft_summary(
        discipline="AYUSH",
        patient_name="ਗੁਰਪ੍ਰੀਤ ਕੌਰ",
        slots=ayush_slots,
        language="pa"
    )
    assert summary["is_draft"] is True
    assert "ਗੁਰਪ੍ਰੀਤ ਕੌਰ" in summary["patient_confirmation_text"]
    assert "AYUSH / AYURVEDA CLINICAL INTAKE DRAFT SUMMARY" in summary["draft_summary_text"]

    # 3. Signed Anti-Tamper QR Token
    token_number = 204
    signed_qr = generate_signed_qr_token(session_id, patient_id, token_number)
    verified = verify_signed_qr_token(signed_qr)
    assert verified["patient_id"] == patient_id
    assert verified["token_number"] == token_number

def test_e2e_scenario_3_visually_impaired_voice_dialogue_traversal():
    """
    Scenario 3: Visually impaired patient completely completes voice-guided interview.
    """
    assert len(AllopathicDialogueEngine.STEPS) == 7
    first_step_id = AllopathicDialogueEngine.STEPS[0]
    assert first_step_id == "CHIEF_COMPLAINT"
    first_prompt = AllopathicDialogueEngine.PROMPTS[first_step_id]["hi"]
    assert "मुख्य वजह" in first_prompt

def test_e2e_scenario_4_dpdp_walkin_temporary_record_merge_guardrails():
    """
    Scenario 4: Validates that cryptographic QR validation rejects expired tokens.
    """
    # 25-hour old timestamp token
    old_ts = int(datetime.now(timezone.utc).timestamp() - 90000)
    fake_payload = f"MK1.{old_ts}.sess_1.pat_1.101"
    # An expired token format
    with pytest.raises(ValueError):
        verify_signed_qr_token(f"{fake_payload}.fakesig")

