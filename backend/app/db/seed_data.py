from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schemas import hospitals, departments, doctors, staff_users, patients
from app.core.security import hash_password, encrypt_phone, compute_search_hash

# 0. Top Linked Healthcare Institutes
INITIAL_HOSPITALS = [
    {
        "hospital_id": "HOSP-AIIA-ND",
        "name": "All India Institute of Ayurveda (AIIA), New Delhi",
        "name_vernacular": {
            "hi": "अखिल भारतीय आयुर्वेद संस्थान (AIIA), नई दिल्ली",
            "pa": "ਆਲ ਇੰਡੀਆ ਇੰਸਟੀਚਿਊਟ ਆਫ਼ ਆਯੁਰਵੇਦ, ਨਵੀਂ ਦਿੱਲੀ",
            "bn": "অল ইন্ডিয়া ইনস্টিটিউট অফ আয়ুর্বেদ, নতুন দিল্লি",
            "ta": "அகில இந்திய ஆயுர்வேத நிறுவனம், புது தில்லி",
            "te": "ఆల్ ఇండియా ఇన్స్టిట్యూట్ ఆఫ్ ఆయుర్వేద, న్యూఢిల్లీ",
            "mr": "अखिल भारतीय आयुर्वेद संस्थान, नवी दिल्ली",
            "gu": "ઓલ ઇન્ડિયા ઇન્સ્ટિટ્યૂટ ઓફ આયુર્વેદ, નવી દિલ્હી",
            "en": "All India Institute of Ayurveda (AIIA), New Delhi"
        },
        "city": "New Delhi",
        "state": "Delhi",
        "hospital_type": "AYUSH_CENTRAL",
        "badge": "Apex AYUSH Institute • MoA",
        "is_active": True
    },
    {
        "hospital_id": "HOSP-AIIMS-ND",
        "name": "All India Institute of Medical Sciences (AIIMS), New Delhi",
        "name_vernacular": {
            "hi": "अखिल भारतीय आयुर्विज्ञान संस्थान (एम्स), नई दिल्ली",
            "pa": "ਏਮਜ਼ (AIIMS), ਨਵੀਂ ਦਿੱਲੀ",
            "bn": "এইমস (AIIMS), নতুন দিল্লি",
            "ta": "எய்ம்ஸ் (AIIMS), புது தில்லி",
            "te": "ఎయిమ్స్ (AIIMS), న్యూఢిల్లీ",
            "mr": "एम्स (AIIMS), नवी दिल्ली",
            "gu": "એઈમ્સ (AIIMS), નવી દિલ્હી",
            "en": "All India Institute of Medical Sciences (AIIMS), New Delhi"
        },
        "city": "New Delhi",
        "state": "Delhi",
        "hospital_type": "AIIMS_ALLOPATHIC",
        "badge": "Apex Modern Medical Center • MoHFW",
        "is_active": True
    },
    {
        "hospital_id": "HOSP-SAF-ND",
        "name": "Safdarjung Hospital & VMMC, New Delhi",
        "name_vernacular": {
            "hi": "सफदरजंग अस्पताल एवं वीएमएमसी, नई दिल्ली",
            "en": "Safdarjung Hospital & VMMC, New Delhi"
        },
        "city": "New Delhi",
        "state": "Delhi",
        "hospital_type": "CENTRAL_GOVT",
        "badge": "Central Govt Multi-Speciality",
        "is_active": True
    },
    {
        "hospital_id": "HOSP-RML-ND",
        "name": "Dr. Ram Manohar Lohia Hospital, New Delhi",
        "name_vernacular": {
            "hi": "डॉ. राम मनोहर लोहिया अस्पताल (RML), नई दिल्ली",
            "en": "Dr. Ram Manohar Lohia Hospital, New Delhi"
        },
        "city": "New Delhi",
        "state": "Delhi",
        "hospital_type": "CENTRAL_GOVT",
        "badge": "Central Govt Hospital",
        "is_active": True
    },
    {
        "hospital_id": "HOSP-NIA-JP",
        "name": "National Institute of Ayurveda (NIA), Jaipur",
        "name_vernacular": {
            "hi": "राष्ट्रीय आयुर्वेद संस्थान (NIA), जयपुर",
            "en": "National Institute of Ayurveda (NIA), Jaipur"
        },
        "city": "Jaipur",
        "state": "Rajasthan",
        "hospital_type": "AYUSH_CENTRAL",
        "badge": "National Institute • Deemed University",
        "is_active": True
    },
    {
        "hospital_id": "HOSP-ITRA-GJ",
        "name": "Institute of Teaching and Research in Ayurveda (ITRA), Jamnagar",
        "name_vernacular": {
            "hi": "आयुर्वेद शिक्षण एवं अनुसंधान संस्थान (ITRA), जामनगर",
            "gu": "આયુર્વેદ શિક્ષણ અને સંશોધન સંસ્થા (ITRA), જામનગર",
            "en": "Institute of Teaching and Research in Ayurveda (ITRA), Jamnagar"
        },
        "city": "Jamnagar",
        "state": "Gujarat",
        "hospital_type": "AYUSH_CENTRAL",
        "badge": "Institute of National Importance (INI)",
        "is_active": True
    }
]

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
        "doctor_id": "DOC-GENMED-01",
        "full_name": "Dr. Priya Sen",
        "medical_registration_number": "MCI-61024-DL",
        "department_id": "GEN_MED",
        "is_on_duty": True,
        "duty_phone_encrypted": encrypt_phone("+919870000004"),
        "password_hash": hash_password("DoctorPass2026!"),
        "mfa_secret": "JBSWY3DPEHPK3PXP",
        "sso_subject_id": "sso-doc-sen-004",
        "is_active": True
    },
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
        "doctor_id": "DOC-PANCHAKARMA-01",
        "full_name": "Dr. Harpreet Kaur",
        "medical_registration_number": "AYUSH-88120-PB",
        "department_id": "PANCHAKARMA",
        "is_on_duty": True,
        "duty_phone_encrypted": encrypt_phone("+919870000005"),
        "password_hash": hash_password("DoctorPass2026!"),
        "mfa_secret": "JBSWY3DPEHPK3PXP",
        "sso_subject_id": "sso-doc-kaur-005",
        "is_active": True
    },
    {
        "doctor_id": "DOC-DERMA-01",
        "full_name": "Dr. Neha Gupta",
        "medical_registration_number": "MCI-77301-DL",
        "department_id": "DERMATOLOGY",
        "is_on_duty": True,
        "duty_phone_encrypted": encrypt_phone("+919870000006"),
        "password_hash": hash_password("DoctorPass2026!"),
        "mfa_secret": "JBSWY3DPEHPK3PXP",
        "sso_subject_id": "sso-doc-gupta-006",
        "is_active": True
    },
    {
        "doctor_id": "DOC-EMERGENCY-01",
        "full_name": "Dr. Siddharth Rao",
        "medical_registration_number": "MCI-33419-DL",
        "department_id": "EMERGENCY",
        "is_on_duty": True,
        "duty_phone_encrypted": encrypt_phone("+919870000007"),
        "password_hash": hash_password("DoctorPass2026!"),
        "mfa_secret": "JBSWY3DPEHPK3PXP",
        "sso_subject_id": "sso-doc-rao-007",
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
    Idempotently seeds all core linked hospitals, departments, clinical doctors, staff, and test patients.
    """
    # 0. Seed Linked Hospitals
    for hosp in INITIAL_HOSPITALS:
        q = select(hospitals).where(hospitals.c.hospital_id == hosp["hospital_id"])
        existing = (await db.execute(q)).fetchone()
        if not existing:
            await db.execute(hospitals.insert().values(**hosp))

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
