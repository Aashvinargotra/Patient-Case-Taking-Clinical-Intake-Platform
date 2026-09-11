import pytest
import pyotp
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db
from app.core.security import hash_password, verify_totp_mfa

# Mock user data records
MOCK_PATIENT = MagicMock()
MOCK_PATIENT.patient_id = "PAT-1001"
MOCK_PATIENT.password_hash = hash_password("PatientPass2026!")
MOCK_PATIENT.mpin_hash = hash_password("1234")
MOCK_PATIENT.failed_mpin_attempts = 0
MOCK_PATIENT.mpin_locked_until = None
MOCK_PATIENT.is_temporary = False
MOCK_PATIENT.is_archived = False
MOCK_PATIENT.abha_address = "ramesh.kumar@abdm"

MOCK_DOCTOR = MagicMock()
MOCK_DOCTOR.doctor_id = "DOC-CARDIO-01"
MOCK_DOCTOR.password_hash = hash_password("DoctorPass2026!")
MOCK_DOCTOR.department_id = "CARDIOLOGY"
MOCK_DOCTOR.mfa_secret = "JBSWY3DPEHPK3PXP"
MOCK_DOCTOR.is_active = True

MOCK_STAFF = MagicMock()
MOCK_STAFF.staff_id = "STAFF-NURSE-01"
MOCK_STAFF.password_hash = hash_password("StaffPass2026!")
MOCK_STAFF.role = "TRIAGE_NURSE"
MOCK_STAFF.department_id = "EMERGENCY"
MOCK_STAFF.mfa_secret = "JBSWY3DPEHPK3PXP"
MOCK_STAFF.is_active = True

MOCK_ADMIN = MagicMock()
MOCK_ADMIN.staff_id = "ADMIN-SUPER-01"
MOCK_ADMIN.role = "SUPER_ADMIN"
MOCK_ADMIN.mfa_secret = "JBSWY3DPEHPK3PXP"
MOCK_ADMIN.sso_subject_id = "sso-super-admin-001"
MOCK_ADMIN.is_active = True

@pytest.fixture
def auth_client():
    mock_db = AsyncMock()
    
    async def mock_get_db_override():
        yield mock_db

    app.dependency_overrides[get_db] = mock_get_db_override
    client = TestClient(app)
    yield client, mock_db
    app.dependency_overrides.pop(get_db, None)

def test_patient_password_login_success(auth_client):
    client, mock_db = auth_client
    res_mock = MagicMock()
    res_mock.fetchone.return_value = MOCK_PATIENT
    mock_db.execute.return_value = res_mock

    resp = client.post("/api/v1/auth/login", json={
        "auth_type": "PATIENT_PASSWORD",
        "identifier": "PAT-1001",
        "secret": "PatientPass2026!"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "PATIENT"
    assert data["patient_id"] == "PAT-1001"
    assert "access_token" in data

def test_patient_password_login_invalid_password(auth_client):
    client, mock_db = auth_client
    res_mock = MagicMock()
    res_mock.fetchone.return_value = MOCK_PATIENT
    mock_db.execute.return_value = res_mock

    resp = client.post("/api/v1/auth/login", json={
        "auth_type": "PATIENT_PASSWORD",
        "identifier": "PAT-1001",
        "secret": "WrongPassword!"
    })
    assert resp.status_code == 401
    assert "Invalid patient credentials" in resp.json()["detail"]

def test_patient_mpin_login_success(auth_client):
    client, mock_db = auth_client
    res_mock = MagicMock()
    res_mock.fetchone.return_value = MOCK_PATIENT
    mock_db.execute.return_value = res_mock

    resp = client.post("/api/v1/auth/login", json={
        "auth_type": "PATIENT_MPIN",
        "identifier": "PAT-1001",
        "secret": "1234"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "PATIENT"
    assert data["patient_id"] == "PAT-1001"

def test_temp_walkin_login(auth_client):
    client, mock_db = auth_client
    resp = client.post("/api/v1/auth/login", json={
        "auth_type": "TEMP_WALKIN"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "PATIENT"
    assert data["is_temporary"] is True
    assert data["patient_id"].startswith("TEMP-")

def test_doctor_login_with_valid_totp_mfa(auth_client):
    client, mock_db = auth_client
    res_mock = MagicMock()
    res_mock.fetchone.return_value = MOCK_DOCTOR
    mock_db.execute.return_value = res_mock

    totp = pyotp.TOTP(MOCK_DOCTOR.mfa_secret)
    valid_code = totp.now()

    resp = client.post("/api/v1/auth/login", json={
        "auth_type": "DOCTOR_ID",
        "identifier": "DOC-CARDIO-01",
        "secret": "DoctorPass2026!",
        "mfa_code": valid_code
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "DOCTOR"
    assert data["department_id"] == "CARDIOLOGY"

def test_doctor_login_invalid_mfa(auth_client):
    client, mock_db = auth_client
    res_mock = MagicMock()
    res_mock.fetchone.return_value = MOCK_DOCTOR
    mock_db.execute.return_value = res_mock

    resp = client.post("/api/v1/auth/login", json={
        "auth_type": "DOCTOR_ID",
        "identifier": "DOC-CARDIO-01",
        "secret": "DoctorPass2026!",
        "mfa_code": "000000"
    })
    assert resp.status_code == 401
    assert "Invalid or missing TOTP MFA code" in resp.json()["detail"]

def test_admin_sso_assertion_with_mfa(auth_client):
    client, mock_db = auth_client
    res_mock = MagicMock()
    res_mock.fetchone.return_value = MOCK_ADMIN
    mock_db.execute.return_value = res_mock

    totp = pyotp.TOTP(MOCK_ADMIN.mfa_secret)
    valid_code = totp.now()

    resp = client.post("/api/v1/auth/login", json={
        "auth_type": "ADMIN_SSO",
        "identifier": "sso-super-admin-001",
        "mfa_code": valid_code
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "ADMIN"
    assert data["staff_role"] == "SUPER_ADMIN"
