import pytest
from app.engines.dialogue_engine import AllopathicDialogueEngine, AyushDialogueEngine
from app.engines.red_flag_engine import evaluate_slot_scoped_triage
from app.engines.ocr_extractor import match_nlem_drug, parse_reference_range
from app.engines.summary_generator import generate_bilingual_draft_summary
from app.engines.routing_engine import determine_department
from app.engines.fhir_adapter import serialize_to_fhir_r4_bundle

def test_allopathic_dialogue_engine_traversal():
    step = None
    steps_traversed = []

    for _ in range(7):
        prompt_info = AllopathicDialogueEngine.get_next_prompt(step, language="hi")
        step = prompt_info["step"]
        steps_traversed.append(step)

    assert len(steps_traversed) == 7
    assert steps_traversed[0] == "CHIEF_COMPLAINT"
    assert steps_traversed[-1] == "REVIEW_AND_CONFIRM"

def test_ayush_dialogue_engine_traversal():
    step = None
    steps_traversed = []

    for _ in range(12):
        prompt_info = AyushDialogueEngine.get_next_prompt(step, language="hi")
        step = prompt_info["step"]
        steps_traversed.append(step)

    assert len(steps_traversed) == 12
    assert steps_traversed[0] == "PRAKRITI"
    assert "AHARA_VIHARA_AND_AGNI" in steps_traversed
    assert steps_traversed[-1] == "REVIEW_AND_CONFIRM"

def test_slot_scoped_red_flag_triage():
    # ACS Suspicion (Tier 1 RED)
    critical_slots = {
        "chief_complaint": "chest_pain",
        "associated_symptoms": ["diaphoresis", "palpitations"],
        "character_and_severity": "crushing_pressure"
    }
    res_red = evaluate_slot_scoped_triage(critical_slots)
    assert res_red is not None
    assert res_red["tier"] == "RED"
    assert res_red["rule_id"] == "ACS_SUSPICION_TIER1"

    # Isolated chest pain without instability (Tier 2 AMBER)
    amber_slots = {
        "chief_complaint": "chest_pain",
        "associated_symptoms": ["none"],
        "character_and_severity": "dull"
    }
    res_amber = evaluate_slot_scoped_triage(amber_slots)
    assert res_amber is not None
    assert res_amber["tier"] == "AMBER"

def test_nlem_drug_matcher():
    match_1 = match_nlem_drug("Tab Telmisartan 40mg once a day")
    assert match_1 is not None
    assert match_1["matched_drug"] == "Telmisartan 40mg"
    assert match_1["confidence"] >= 0.75

    match_2 = match_nlem_drug("Metformin 500 mg tab")
    assert match_2 is not None
    assert match_2["matched_drug"] == "Metformin 500mg"

def test_reference_range_evaluator():
    normal_lab = parse_reference_range("Fasting Blood Sugar", 85.0)
    assert normal_lab["is_abnormal"] is False

    high_lab = parse_reference_range("Fasting Blood Sugar", 168.0)
    assert high_lab["is_abnormal"] is True

def test_bilingual_draft_summary():
    slots = {
        "chief_complaint": "Chest pain with radiation to left arm",
        "site_and_radiation": "Left chest radiating to left arm",
        "character_and_severity": "Crushing, 8/10",
        "associated_symptoms": "Diaphoresis, breathlessness"
    }
    summary = generate_bilingual_draft_summary(
        discipline="ALLOPATHY",
        patient_name="Ramesh Kumar",
        slots=slots,
        language="hi"
    )

    assert summary["is_draft"] is True
    assert "Ramesh Kumar" in summary["patient_confirmation_text"]
    assert "PHYSICIAN SIGN-OFF REQUIRED" in summary["draft_summary_text"]
    assert "ALLOPATHIC OPD CLINICAL INTAKE DRAFT SUMMARY" in summary["draft_summary_text"]

def test_department_routing():
    cardio = determine_department("Chest pain and palpitation")
    assert cardio["dept_id"] == "CARDIOLOGY"

    ortho = determine_department("Severe knee joint pain after falling")
    assert ortho["dept_id"] == "ORTHOPEDICS"

    ayush_panchakarma = determine_department("Panchakarma detox consultation", discipline="AYUSH")
    assert ayush_panchakarma["dept_id"] == "PANCHAKARMA"

def test_fhir_r4_adapter():
    bundle = serialize_to_fhir_r4_bundle(
        patient_id="PAT-101",
        patient_name="Sunita Sharma",
        session_id="SESS-202",
        chief_complaint="Severe headache and dizziness",
        summary_text="Patient reported acute headache for 2 days."
    )
    assert bundle["resourceType"] == "Bundle"
    assert len(bundle["entry"]) >= 4
    resource_types = [e["resource"]["resourceType"] for e in bundle["entry"]]
    assert "Patient" in resource_types
    assert "Encounter" in resource_types
    assert "Condition" in resource_types
    assert "DocumentReference" in resource_types

@pytest.mark.asyncio
async def test_slot_normalization_deterministic():
    from app.engines.dialogue_engine import normalize_input_to_slot, AllopathicDialogueEngine, AyushDialogueEngine

    # Test Allopathic option matching
    options = AllopathicDialogueEngine.OPTIONS["CHIEF_COMPLAINT"]
    norm_1 = await normalize_input_to_slot("CHIEF_COMPLAINT", "सीने में बहुत तेज़ दर्द हो रहा है", options)
    assert norm_1 == "chest_pain"

    # Test AYUSH Prakriti keyword matching
    ayush_options = AyushDialogueEngine.OPTIONS["PRAKRITI"]
    norm_2 = await normalize_input_to_slot("PRAKRITI", "मेरी वात और पित्त प्रकृति है", ayush_options)
    assert norm_2 == "vata"
