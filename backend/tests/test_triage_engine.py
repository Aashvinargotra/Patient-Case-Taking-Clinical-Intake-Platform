import pytest
from unittest.mock import AsyncMock, MagicMock
from app.engines.red_flag_engine import evaluate_slot_scoped_triage, send_scoped_emergency_sms
from app.core.security import encrypt_phone

def test_triage_acs_suspicion_tier1():
    slots = {
        "chief_complaint": "chest_pain",
        "associated_symptoms": ["diaphoresis", "palpitations"],
        "character_and_severity": "crushing_pressure"
    }
    res = evaluate_slot_scoped_triage(slots)
    assert res is not None
    assert res["tier"] == "RED"
    assert res["rule_id"] == "ACS_SUSPICION_TIER1"

def test_triage_stroke_fast_tier1():
    slots = {
        "chief_complaint": "facial_droop",
        "onset_and_timing": "sudden_recent"
    }
    res = evaluate_slot_scoped_triage(slots)
    assert res is not None
    assert res["tier"] == "RED"
    assert res["rule_id"] == "ACUTE_STROKE_TIER1"

def test_triage_severe_dyspnea_tier1():
    slots = {
        "chief_complaint": "shortness_of_breath",
        "onset_and_timing": "sudden_recent"
    }
    res = evaluate_slot_scoped_triage(slots)
    assert res is not None
    assert res["tier"] == "RED"
    assert res["rule_id"] == "SEVERE_DYSPNEA_TIER1"

def test_triage_anaphylaxis_tier1():
    slots = {
        "chief_complaint": "rash",
        "associated_symptoms": ["shortness_of_breath"],
        "onset_and_timing": "sudden_recent"
    }
    res = evaluate_slot_scoped_triage(slots)
    assert res is not None
    assert res["tier"] == "RED"
    assert res["rule_id"] == "ANAPHYLAXIS_ACUTE_TIER1"

def test_triage_isolated_chest_pain_tier2_amber():
    slots = {
        "chief_complaint": "chest_pain",
        "associated_symptoms": ["none"],
        "character_and_severity": "dull"
    }
    res = evaluate_slot_scoped_triage(slots)
    assert res is not None
    assert res["tier"] == "AMBER"
    assert res["rule_id"] == "ISOLATED_CHEST_PAIN_TIER2"

def test_triage_acute_abdomen_tier2_amber():
    slots = {
        "chief_complaint": "abdominal_pain"
    }
    res = evaluate_slot_scoped_triage(slots)
    assert res is not None
    assert res["tier"] == "AMBER"
    assert res["rule_id"] == "ACUTE_ABDOMEN_TIER2"

def test_triage_normal_complaint_no_alert():
    slots = {
        "chief_complaint": "mild skin itching for 2 weeks",
        "associated_symptoms": ["none"],
        "onset_and_timing": "chronic"
    }
    res = evaluate_slot_scoped_triage(slots)
    assert res is None

@pytest.mark.asyncio
async def test_scoped_emergency_sms_dispatch():
    mock_db = AsyncMock()
    
    # Mock duty nurse & doctor records
    nurse_mock = MagicMock()
    nurse_mock.duty_phone_encrypted = encrypt_phone("+919870000010")
    nurse_mock.full_name = "Sister Priya Patel"

    doc_mock = MagicMock()
    doc_mock.duty_phone_encrypted = encrypt_phone("+919870000001")
    doc_mock.full_name = "Dr. Vikram Malhotra"

    res_mock = MagicMock()
    res_mock.fetchall.side_effect = [[nurse_mock], [doc_mock]]
    mock_db.execute.return_value = res_mock

    dispatched = await send_scoped_emergency_sms(
        mock_db,
        department_id="CARDIOLOGY",
        alert_info={"tier": "RED", "token_number": 105}
    )

    assert len(dispatched) == 2
    recipients = [d["recipient"] for d in dispatched]
    assert "Sister Priya Patel" in recipients
    assert "Dr. Vikram Malhotra" in recipients
    for d in dispatched:
        assert d["phone"] in ["+919870000010", "+919870000001"]
        assert "Priority RED alert" in d["message"]
