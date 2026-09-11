import pytest
import pytest_asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import insert
from app.models.schemas import (
    metadata, patients, visit_sessions, clinical_summaries, medical_documents, extracted_entities
)
from app.engines.summary_generator import generate_bilingual_draft_summary
from app.engines.routing_engine import determine_department
from app.engines.fhir_adapter import serialize_to_fhir_r4_bundle, post_bundle_to_hapi_fhir, get_patient_fhir_record
from app.engines.timeline_engine import build_patient_timeline

from unittest.mock import AsyncMock, MagicMock


def test_generate_bilingual_draft_summary_allopathy():
    slots = {
        "chief_complaint": "Persistent headache and neck stiffness",
        "site_and_radiation": "Frontal forehead radiating to occiput",
        "onset_and_timing": "Started 3 days ago, throbbing in morning",
        "character_and_severity": "Severe throbbing 7/10",
        "associated_symptoms": "Mild photophobia, no nausea",
        "past_medical_and_meds": "Hypertension on Amlodipine 5mg"
    }
    extracted_labs = [
        {
            "standardized_name": "Fasting Blood Sugar",
            "value": 142.0,
            "unit": "mg/dL",
            "reference_low": 70.0,
            "reference_high": 100.0,
            "is_abnormal": True
        }
    ]

    res_hi = generate_bilingual_draft_summary("ALLOPATHY", "राहुल वर्मा", slots, extracted_labs, language="hi")
    assert res_hi["is_draft"] is True
    assert "राहुल वर्मा" in res_hi["patient_confirmation_text"]
    assert "Persistent headache" in res_hi["patient_confirmation_text"]
    assert "ALLOPATHIC OPD CLINICAL INTAKE DRAFT SUMMARY" in res_hi["draft_summary_text"]
    assert "PHYSICIAN SIGN-OFF REQUIRED" in res_hi["draft_summary_text"]
    assert "⚠️ **ABNORMAL**" in res_hi["draft_summary_text"]

def test_generate_bilingual_draft_summary_ayush():
    slots = {
        "chief_complaint": "Joint stiffness and indigestion",
        "prakriti": "Vata-Kapha",
        "vikriti": "Vata aggravated with Ama accumulation",
        "sara": "Madhyama Sara",
        "samhanana": "Madhyama Samhanana",
        "sattva": "Pravara Sattva",
        "ahara_shakti": "Mandagni (sluggish digestion)",
        "ahara_vihara_and_agni": "Irregular meal timings, heavy dairy intake"
    }

    res_pa = generate_bilingual_draft_summary("AYUSH", "ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ", slots, language="pa")
    assert res_pa["is_draft"] is True
    assert "ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ" in res_pa["patient_confirmation_text"]
    assert "AYUSH / AYURVEDA CLINICAL INTAKE DRAFT SUMMARY" in res_pa["draft_summary_text"]
    assert "Prakriti (Innate Constitution):** Vata-Kapha" in res_pa["draft_summary_text"]
    assert "PHYSICIAN SIGN-OFF REQUIRED" in res_pa["draft_summary_text"]

def test_determine_department_routing():
    # Emergency routing override
    assert determine_department("Severe chest pain", is_emergency=True)["dept_id"] == "EMERGENCY"

    # Allopathy routing
    assert determine_department("Chest pain with palpitations", discipline="ALLOPATHY")["dept_id"] == "CARDIOLOGY"
    assert determine_department("Fractured right knee and severe back pain", discipline="ALLOPATHY")["dept_id"] == "ORTHOPEDICS"
    assert determine_department("Severe stomach pain and loose diarrhea", discipline="ALLOPATHY")["dept_id"] == "GASTROENTEROLOGY"
    assert determine_department("Skin rash with red itching patches", discipline="ALLOPATHY")["dept_id"] == "DERMATOLOGY"
    assert determine_department("General fatigue and mild weakness", discipline="ALLOPATHY")["dept_id"] == "GEN_MED"

    # AYUSH routing
    assert determine_department("Joint pain with amavata and sandhi vata", discipline="AYUSH")["dept_id"] == "KAYACHIKITSA"
    assert determine_department("Body detox and panchakarma shodhana", discipline="AYUSH")["dept_id"] == "PANCHAKARMA"
    assert determine_department("Severe acidity, gas and mandagni", discipline="AYUSH")["dept_id"] == "AGNI_CHIKITSA"
    assert determine_department("High fever, jwara and bodily heat", discipline="AYUSH")["dept_id"] == "JWARA_CHIKITSA"
    assert determine_department("Twak kushtha and skin allergy", discipline="AYUSH")["dept_id"] == "TWAK_ROGA"

def test_serialize_to_fhir_r4_bundle():
    extracted_labs = [
        {
            "standardized_name": "HbA1c",
            "value": 7.8,
            "unit": "%",
            "is_abnormal": True
        }
    ]
    bundle = serialize_to_fhir_r4_bundle(
        patient_id="pat_test_123",
        patient_name="Anjali Gupta",
        session_id="sess_test_456",
        chief_complaint="Uncontrolled diabetes screening",
        summary_text="Draft summary text for physician",
        extracted_labs=extracted_labs
    )

    assert bundle["resourceType"] == "Bundle"
    assert bundle["type"] == "document"
    assert len(bundle["entry"]) == 5  # Patient, Encounter, Condition, DocumentReference, Observation

    resource_types = [entry["resource"]["resourceType"] for entry in bundle["entry"]]
    assert "Patient" in resource_types
    assert "Encounter" in resource_types
    assert "Condition" in resource_types
    assert "DocumentReference" in resource_types
    assert "Observation" in resource_types

@pytest.mark.asyncio
async def test_hapi_fhir_adapter_resilience():
    # Verify fallback handling when network fails or with simulated test bundle
    dummy_bundle = {"resourceType": "Bundle", "id": "test-b-1", "entry": []}
    resp = await post_bundle_to_hapi_fhir(dummy_bundle, fhir_base_url="http://invalid-fhir-domain-12345.xyz")
    assert resp["success"] is False
    assert resp["offline_queued"] is True

    record_resp = await get_patient_fhir_record("nonexistent_pat", fhir_base_url="http://invalid-fhir-domain-12345.xyz")
    assert record_resp["found"] is False

@pytest.mark.asyncio
async def test_timeline_engine_aggregation():
    from collections import namedtuple
    pat_id = "pat_test_123"
    now = datetime.now(timezone.utc)

    # Define namedtuples to mimic SQLAlchemy result rows
    SummaryRow = namedtuple("SummaryRow", ["summary_id", "generated_at", "chief_complaint", "draft_summary_text", "is_draft", "verified_by_doctor_id", "assigned_room"])
    DocRow = namedtuple("DocRow", ["doc_id", "uploaded_at", "doc_type", "original_filename", "file_path", "processing_status"])
    EntityRow = namedtuple("EntityRow", ["standardized_name", "value", "unit"])

    summary_mock = SummaryRow(
        summary_id="sum_1",
        generated_at=now,
        chief_complaint="Chest congestion and cough",
        draft_summary_text="Patient reported 4-day cough with congestion.",
        is_draft=True,
        verified_by_doctor_id=None,
        assigned_room="Room 101"
    )

    doc_mock = DocRow(
        doc_id="doc_1",
        uploaded_at=now,
        doc_type="LAB_REPORT",
        original_filename="lab_blood_test.pdf",
        file_path="uploads/lab1.pdf",
        processing_status="EXTRACTED"
    )

    entity_mock = EntityRow(
        standardized_name="Hemoglobin",
        value=10.2,
        unit="g/dL"
    )

    # Set up AsyncMock db
    mock_db = AsyncMock()
    
    mock_res_summaries = MagicMock()
    mock_res_summaries.fetchall.return_value = [summary_mock]

    mock_res_docs = MagicMock()
    mock_res_docs.fetchall.return_value = [doc_mock]

    mock_res_entities = MagicMock()
    mock_res_entities.fetchall.return_value = [entity_mock]

    mock_db.execute.side_effect = [
        mock_res_summaries,
        mock_res_docs,
        mock_res_entities
    ]

    # 5. Execute Timeline Builder
    timeline = await build_patient_timeline(pat_id, mock_db)
    assert len(timeline) == 2
    event_types = [ev["event_type"] for ev in timeline]
    assert "OPD_CONSULTATION" in event_types
    assert "LAB_REPORT" in event_types
    lab_event = next(ev for ev in timeline if ev["event_type"] == "LAB_REPORT")
    assert "Hemoglobin (10.2 g/dL)" in lab_event["description"]

