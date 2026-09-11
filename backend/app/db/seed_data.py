from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schemas import departments, doctors, staff_users, patients
from app.core.security import hash_password, encrypt_phone, compute_search_hash

# 1. 14 Standardized Allopathic and AYUSH Departments
INITIAL_DEPARTMENTS = [
    # Allopathic
    {"department_id": "EMERGENCY", "name": "Emergency & Trauma Triage", "clinical_discipline": "ALLOPATHY", "floor_room": "Red Zone / Room E-01"},
    {"department_id": "CARDIOLOGY", "name": "Cardiology OPD", "clinical_discipline": "ALLOPATHY", "floor_room": "Room 104 (1st Floor)"},
    {"department_id": "GEN_MED", "name": "General Medicine OPD", "clinical_discipline": "ALLOPATHY", "floor_room": "Room 101 (Ground Floor)"},
    {"department_id": "ORTHOPEDICS", "name": "Orthopedics OPD", "clinical_discipline": "ALLOPATHY", "floor_room": "Room 108 (Ground Floor)"},
    {"department_id": "GASTROENTEROLOGY", "name": "Gastroenterology OPD", "clinical_discipline": "ALLOPATHY", "floor_room": "Room 202 (2nd Floor)"},
    {"department_id": "DERMATOLOGY", "name": "Dermatology OPD", "clinical_discipline": "ALLOPATHY", "floor_room": "Room 205 (2nd Floor)"},
    {"department_id": "RHEUMATOLOGY", "name": "Rheumatology OPD", "clinical_discipline": "ALLOPATHY", "floor_room": "Room 206 (2nd Floor)"},
    
    # AYUSH / Ayurveda (AIIA Standard)
    {"department_id": "KAYACHIKITSA", "name": "Kayachikitsa (Internal Medicine)", "clinical_discipline": "AYUSH", "floor_room": "Room A-101"},
    {"department_id": "PANCHAKARMA", "name": "Panchakarma Department", "clinical_discipline": "AYUSH", "floor_room": "Room A-102"},
    {"department_id": "SHALYA_TANTRA", "name": "Shalya Tantra (Surgery & Marma)", "clinical_discipline": "AYUSH", "floor_room": "Room A-105"},
    {"department_id": "HRIDROGA", "name": "Hridroga (Ayurvedic Cardiology)", "clinical_discipline": "AYUSH", "floor_room": "Room A-106"},
    {"department_id": "TWAK_ROGA", "name": "Twak Roga (Dermatology)", "clinical_discipline": "AYUSH", "floor_room": "Room A-108"},
    {"department_id": "AGNI_CHIKITSA", "name": "Agni & Metabolic Health", "clinical_discipline": "AYUSH", "floor_room": "Room A-110"},
    {"department_id": "JWARA_CHIKITSA", "name": "Jwara & Acute Fevers", "clinical_discipline": "AYUSH", "floor_room": "Room A-112"}
]

# 2. Default Hospital Doctors
INITIAL_DOCTORS = [
    {
        "doctor_id": "DOC-CARDIO-01",
        "full_name": "Dr. Vikram Malhotra",
        "medical_registration_number": "MCI-48912-DL",
        "department_id": "CARDIOLOGY",
        "is_on_duty": True,
        "duty_phone_encrypted": encrypt_phone("+919870000001"),
        "password_hash": hash_password("DoctorPass2026!"),
        "mfa_secret": "JBSWY3DPEHPK3PXP", # Standard TOTP secret for demo testing
        "sso_subject_id": "sso-doc-malhotra-001",
        "is_active": True
    },
    {
        "doctor_id": "DOC-AYUSH-01",
        "full_name": "Dr. Ananya Sharma",
        "medical_registration_number": "AYUSH-99214-ND",
        "department_id": "KAYACHIKITSA",
        "is_on_duty": True,
        "duty_phone_encrypted": encrypt_phone("+919870000002"),
        "password_hash": hash_password("DoctorPass2026!"),
        "mfa_secret": "JBSWY3DPEHPK3PXP",
        "sso_subject_id": "sso-doc-sharma-002",
        "is_active": True
    },
    {
        "doctor_id": "DOC-ORTHO-01",
        "full_name": "Dr. Rajesh Verma",
        "medical_registration_number": "MCI-55102-DL",
        "department_id": "ORTHOPEDICS",
        "is_on_duty": True,
        "duty_phone_encrypted": encrypt_phone("+919870000003"),
        "password_hash": hash_password("DoctorPass2026!"),
        "mfa_secret": "JBSWY3DPEHPK3PXP",
        "sso_subject_id": "sso-doc-verma-003",
        "is_active": True
    }
]

# 3. Default Clinical Staff & Administrators
INITIAL_STAFF = [
    {
        "staff_id": "STAFF-NURSE-01",
        "full_name": "Sister Priya Patel",
        "role": "TRIAGE_NURSE",
        "department_id": "EMERGENCY",
        "duty_phone_encrypted": encrypt_phone("+919870000010"),
        "password_hash": hash_password("StaffPass2026!"),
        "mfa_secret": "JBSWY3DPEHPK3PXP",
        "is_active": True
    },
    {
        "staff_id": "STAFF-DESK-01",
        "full_name": "Amit Kumar (Desk Operator)",
        "role": "REGISTRATION_DESK",
        "department_id": "GEN_MED",
        "duty_phone_encrypted": encrypt_phone("+919870000011"),
        "password_hash": hash_password("StaffPass2026!"),
        "mfa_secret": None,
        "is_active": True
    },
    {
        "staff_id": "ADMIN-SUPER-01",
        "full_name": "Hospital Super Administrator",
        "role": "SUPER_ADMIN",
        "department_id": None,
        "duty_phone_encrypted": encrypt_phone("+919870000099"),
        "password_hash": hash_password("AdminPass2026!"),
        "mfa_secret": "JBSWY3DPEHPK3PXP",
        "sso_subject_id": "sso-super-admin-001",
        "is_active": True
    }
]

# 4. Default Demonstration Patients
INITIAL_PATIENTS = [
    {
        "patient_id": "PAT-DEMO-01",
        "full_name": "Aarav Sharma",
        "gender": "MALE",
        "birth_year": 1988,
        "is_temporary": False,
        "phone_search_hash": compute_search_hash("+919876543200"),
        "phone_encrypted": encrypt_phone("+919876543200"),
        "password_hash": hash_password("PatientPass2026!"),
        "mpin_hash": hash_password("1234"),
        "abha_address": "aarav.sharma@abdm"
    },
    {
        "patient_id": "PAT-1001",
        "full_name": "Ramesh Kumar",
        "gender": "MALE",
        "birth_year": 1978,
        "is_temporary": False,
        "phone_search_hash": compute_search_hash("+919876543210"),
        "phone_encrypted": encrypt_phone("+919876543210"),
        "password_hash": hash_password("PatientPass2026!"),
        "mpin_hash": hash_password("1234"),
        "abha_address": "ramesh.kumar@abdm"
    },
    {
        "patient_id": "PAT-1002",
        "full_name": "Sunita Devi",
        "gender": "FEMALE",
        "birth_year": 1965,
        "is_temporary": False,
        "phone_search_hash": compute_search_hash("+919812345678"),
        "phone_encrypted": encrypt_phone("+919812345678"),
        "password_hash": hash_password("PatientPass2026!"),
        "mpin_hash": hash_password("5678"),
        "abha_address": "sunita.devi@abdm"
    },
    {
        "patient_id": "TEMP-WALK01",
        "full_name": "Walk-in Anonymous Patient",
        "gender": "UNKNOWN",
        "birth_year": 1990,
        "is_temporary": True,
        "phone_search_hash": None,
        "phone_encrypted": None,
        "password_hash": None,
        "mpin_hash": None,
        "abha_address": None
    }
]

async def seed_database(db: AsyncSession):
    """
    Idempotently seeds all core departments, clinical doctors, staff, and test patients.
    """
    # 1. Seed Departments
    for dept in INITIAL_DEPARTMENTS:
        q = select(departments).where(departments.c.department_id == dept["department_id"])
        existing = (await db.execute(q)).fetchone()
        if not existing:
            await db.execute(departments.insert().values(**dept))

    # 2. Seed Doctors
    for doc in INITIAL_DOCTORS:
        q = select(doctors).where(doctors.c.doctor_id == doc["doctor_id"])
        existing = (await db.execute(q)).fetchone()
        if not existing:
            await db.execute(doctors.insert().values(**doc))

    # 3. Seed Staff
    for staff in INITIAL_STAFF:
        q = select(staff_users).where(staff_users.c.staff_id == staff["staff_id"])
        existing = (await db.execute(q)).fetchone()
        if not existing:
            await db.execute(staff_users.insert().values(**staff))

    # 4. Seed Patients
    for p in INITIAL_PATIENTS:
        q = select(patients).where(patients.c.patient_id == p["patient_id"])
        existing = (await db.execute(q)).fetchone()
        if not existing:
            await db.execute(patients.insert().values(**p))

    await db.commit()
