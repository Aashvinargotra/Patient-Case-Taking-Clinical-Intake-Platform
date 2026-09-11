import pytest
from app.models.schemas import metadata
from app.db.seed_data import INITIAL_DEPARTMENTS, INITIAL_DOCTORS, INITIAL_STAFF, INITIAL_PATIENTS

def test_database_table_schemas_count():
    """Verifies that all 10 core relational tables + triage/audit tables are defined."""
    table_names = set(metadata.tables.keys())
    expected_tables = {
        "departments",
        "doctors",
        "staff_users",
        "patients",
        "visit_sessions",
        "consent_records",
        "dpdp_data_requests",
        "clinical_summaries",
        "medical_documents",
        "extracted_entities",
        "token_records",
        "triage_alerts",
        "audit_logs"
    }
    assert expected_tables.issubset(table_names), f"Missing tables: {expected_tables - table_names}"

def test_initial_departments_seeding_structure():
    """Verifies that all 14 standard Allopathy and AYUSH departments are configured."""
    assert len(INITIAL_DEPARTMENTS) == 14
    dept_ids = [d["department_id"] for d in INITIAL_DEPARTMENTS]
    
    # 7 Allopathic departments
    allopathic_expected = ["EMERGENCY", "CARDIOLOGY", "GEN_MED", "ORTHOPEDICS", "GASTROENTEROLOGY", "DERMATOLOGY", "RHEUMATOLOGY"]
    for d in allopathic_expected:
        assert d in dept_ids

    # 7 AYUSH departments
    ayush_expected = ["KAYACHIKITSA", "PANCHAKARMA", "SHALYA_TANTRA", "HRIDROGA", "TWAK_ROGA", "AGNI_CHIKITSA", "JWARA_CHIKITSA"]
    for d in ayush_expected:
        assert d in dept_ids

def test_initial_doctors_and_staff_integrity():
    """Verifies that doctors and staff have required encrypted fields, departments, and MFA secrets."""
    for doc in INITIAL_DOCTORS:
        assert doc["doctor_id"].startswith("DOC-")
        assert doc["department_id"] in [d["department_id"] for d in INITIAL_DEPARTMENTS]
        assert doc["password_hash"].startswith("$argon2")
        assert doc["duty_phone_encrypted"] is not None
        assert doc["mfa_secret"] == "JBSWY3DPEHPK3PXP"

    for staff in INITIAL_STAFF:
        assert staff["staff_id"].startswith("STAFF-") or staff["staff_id"].startswith("ADMIN-")
        assert staff["password_hash"].startswith("$argon2")

def test_initial_patients_demographics_and_auth():
    """Verifies that permanent and temporary walk-in patients are correctly configured."""
    assert len(INITIAL_PATIENTS) >= 3
    perm_patients = [p for p in INITIAL_PATIENTS if not p["is_temporary"]]
    temp_patients = [p for p in INITIAL_PATIENTS if p["is_temporary"]]

    assert len(perm_patients) >= 2
    assert len(temp_patients) == 1

    for p in perm_patients:
        assert p["phone_search_hash"] is not None
        assert len(p["phone_search_hash"]) == 64
        assert p["phone_encrypted"] is not None
        assert p["mpin_hash"].startswith("$argon2")

    temp_p = temp_patients[0]
    assert temp_p["patient_id"] == "TEMP-WALK01"
    assert temp_p["phone_search_hash"] is None
