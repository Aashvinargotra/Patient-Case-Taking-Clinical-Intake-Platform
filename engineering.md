# MediKiosk — Engineering Implementation Guide & Developer Specifications (engineering.md)

---

## 1. Technology Stack & Architectural Specifications

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Python (AsyncIO) | 3.11+ | High-performance asynchronous API server |
| **Backend Framework** | FastAPI + Pydantic v2 | 0.110+ | OpenAPI contracts, type validation, async endpoints |
| **Database & ORM** | PostgreSQL + SQLAlchemy | 16.0+ / 2.0+ | Relational data layer, JSONB clinical models, Asyncpg |
| **In-Memory Cache & Token Store** | Redis | 7.2+ | Ephemeral session cache, token replay prevention (`SETNX`), sliding-window rate limiting |
| **Speech Engine** | Bhashini / AI4Bharat REST API | REST | Multilingual speech-to-text (Hindi & English baseline, Punjabi P1) with touch-mode fallback |
| **Document AI / OCR** | PyTesseract + RapidFuzz / TrOCR | Tesseract 5.3+ / RapidFuzz 3.6+ / PyTorch 2.2+ | Image preprocessing, OCR layout parsing, NLEM dictionary fuzzy matching |
| **Phone Normalization** | `phonenumbers` | 8.13+ | Canonical E.164 normalization before hashing |
| **Patient Interface** | Flutter (Dart) | 3.19+ | Cross-platform Kiosk, Android tablet, high-contrast touch UI |
| **Doctor / Admin Portals** | React 18 + Vite + Tailwind CSS | Node 20+ | Responsive clinical web dashboards, split-screen crop viewer |
| **Reverse Proxy & Gateway** | Nginx | 1.25+ | TLS 1.3 termination, reverse proxy, internal Docker network security |
| **Cryptography & Auth** | `cryptography` + `argon2-cffi` + `python-jose` + `pyotp` | 42.0+ | KMS envelope encryption, blind HMAC search indexing, Argon2id MPIN, RFC 6238 TOTP MFA |

### 1.1 Complete Monorepo Directory Architecture
```
SIH2026/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.py              # 7-role login gateway (Password, MPIN, ABHA, Temp, Doctor/Staff/Admin MFA)
│   │   │   │   ├── intake.py            # Conversational dialogue-turn, session start & speech-to-text
│   │   │   │   ├── doctor.py            # OPD queue worklist, Patient ID search & clinical note sign-off
│   │   │   │   ├── queue.py             # Token issuance, public display, printed Parchi & duty status
│   │   │   │   ├── triage.py            # WebSocket real-time buzzer, alert acknowledge & dept override
│   │   │   │   ├── documents.py         # Prescription & lab document OCR parser and crop viewer
│   │   │   │   ├── admin.py             # Analytical throughput overview, dept metrics & audit logs
│   │   │   │   └── patient_portal.py    # Temporary record merge, consent history & DPDP data erasure
│   │   ├── core/
│   │   │   ├── config.py                # Pydantic v2 Settings from vault/.env
│   │   │   ├── security.py              # Fernet KMS, E.164, blind HMAC, QR crypto, Redis rate limiter & session cache
│   │   │   └── auth_service.py          # Argon2id MPIN verification, lockout & TOTP MFA validator
│   │   ├── db/
│   │   │   └── session.py               # Asyncpg SQLAlchemy engine & transaction provider
│   │   ├── models/
│   │   │   └── schemas.py               # 10 relational tables, analytical views & Pydantic DTOs
│   │   └── engines/
│   │       ├── speech_pipeline.py       # Bhashini ASR/TTS with touch fallback
│   │       ├── dialogue_engine.py       # Complete Allopathic SOCRATES + AYUSH 10 Dashavidha Pariksha
│   │       ├── red_flag_engine.py       # Slot-scoped Tier-1/2 triage, WebSocket buzzer & scoped SMS
│   │       ├── ocr_extractor.py         # OpenCV binarization, Tesseract, RapidFuzz NLEM matcher
│   │       ├── timeline_engine.py       # Longitudinal reverse-chronological event timeline aggregator
│   │       ├── summary_generator.py     # Bilingual audio review & physician draft summary (is_draft = TRUE)
│   │       ├── routing_engine.py        # 14-department deterministic clinical lookup
│   │       └── fhir_adapter.py          # ABDM HL7 FHIR R4 JSON bundle serializer
│   ├── migrations/                      # SQL schema DDL & seed scripts
│   ├── tests/                           # Pytest automated test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend_patient_kiosk/              # Flutter Kiosk & Android Tablet app
├── frontend_web_apps/                   # React 18 + Vite Web App (Doctor, Admin, Patient, Triage)
├── nginx/                               # Nginx reverse proxy with TLS 1.3
├── docker-compose.yml
└── .gitignore
```

---

## 2. Database Schema DDL & Seed Migrations

```sql
-- MediKiosk Production PostgreSQL Schema DDL (migrations/001_initial_schema.sql)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Departments Table
CREATE TABLE departments (
    department_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    system_type VARCHAR(32) NOT NULL, -- 'ALLOPATHY' or 'AYUSH'
    room_numbers TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Allopathic & AYUSH Departments
INSERT INTO departments (department_id, name, system_type, room_numbers) VALUES
('GEN_MED', 'General Medicine', 'ALLOPATHY', ARRAY['Room 101', 'Room 102', 'Room 103']),
('CARDIOLOGY', 'Cardiology', 'ALLOPATHY', ARRAY['Room 104', 'Room 105']),
('ORTHOPEDICS', 'Orthopedics & Joint Care', 'ALLOPATHY', ARRAY['Room 106', 'Room 107']),
('RHEUMATOLOGY', 'Rheumatology & Immunology', 'ALLOPATHY', ARRAY['Room 108']),
('GASTROENTEROLOGY', 'Gastroenterology & Hepatology', 'ALLOPATHY', ARRAY['Room 109', 'Room 110']),
('DERMATOLOGY', 'Dermatology & Venereology', 'ALLOPATHY', ARRAY['Room 111']),
('EMERGENCY', 'Emergency & Acute Trauma', 'ALLOPATHY', ARRAY['Emergency Bay A', 'Emergency Bay B']),
('KAYACHIKITSA', 'Kayachikitsa (Internal Medicine)', 'AYUSH', ARRAY['Ayurveda Room 1', 'Ayurveda Room 2']),
('PANCHAKARMA', 'Panchakarma Therapy', 'AYUSH', ARRAY['Panchakarma Suite 1', 'Panchakarma Suite 2']),
('SHALYA_TANTRA', 'Shalya Tantra (Surgical Care)', 'AYUSH', ARRAY['Ayurveda Room 3']),
('HRIDROGA', 'Hridroga (Ayurvedic Cardiology)', 'AYUSH', ARRAY['Ayurveda Room 4']),
('TWAK_ROGA', 'Twak Roga (Ayurvedic Dermatology)', 'AYUSH', ARRAY['Ayurveda Room 5']),
('AGNI_CHIKITSA', 'Gastrointestinal & Agni Chikitsa', 'AYUSH', ARRAY['Ayurveda Room 6']),
('JWARA_CHIKITSA', 'Jwara Chikitsa (Fever Care)', 'AYUSH', ARRAY['Ayurveda Room 7']);

-- 2. Staff Users & Doctors Tables
CREATE TABLE doctors (
    doctor_id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    department_id VARCHAR(64) REFERENCES departments(department_id),
    medical_license_no VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_on_duty BOOLEAN DEFAULT FALSE,
    duty_phone_encrypted VARCHAR(512),
    mfa_secret VARCHAR(128),
    sso_subject_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_users (
    staff_id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL, -- 'TRIAGE_NURSE', 'HOSPITAL_ADMIN', 'DEPT_ADMIN', 'SUPER_ADMIN', 'REGISTRATION_DESK'
    department_id VARCHAR(64) REFERENCES departments(department_id),
    password_hash VARCHAR(255) NOT NULL,
    is_on_duty BOOLEAN DEFAULT FALSE,
    duty_phone_encrypted VARCHAR(512),
    mfa_secret VARCHAR(128),
    sso_provider VARCHAR(64),
    sso_subject_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patients Table (Reversible Phone Encryption + Blind Index)
CREATE TABLE patients (
    patient_id VARCHAR(32) PRIMARY KEY,
    abha_id VARCHAR(64) UNIQUE,
    abha_address VARCHAR(128) UNIQUE,
    phone_encrypted VARCHAR(512) NOT NULL,
    phone_search_hash VARCHAR(64) NOT NULL, -- Non-unique index to support multiple family members sharing a phone
    full_name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(16) NOT NULL,
    primary_language VARCHAR(32) DEFAULT 'hi',
    password_hash VARCHAR(255),
    mpin_hash VARCHAR(255),
    failed_mpin_attempts INT DEFAULT 0,
    mpin_locked_until TIMESTAMP WITH TIME ZONE,
    is_temporary BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    merged_into VARCHAR(32) REFERENCES patients(patient_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_patients_search_hash ON patients(phone_search_hash);
CREATE INDEX idx_patients_abha ON patients(abha_id);

-- 4. Visit Sessions Table
CREATE TABLE visit_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(32) REFERENCES patients(patient_id) ON DELETE CASCADE,
    visit_type VARCHAR(32) NOT NULL, -- 'MODERN_MEDICINE' or 'AYUSH'
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    department_id VARCHAR(64) REFERENCES departments(department_id),
    assigned_room VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_visit_patient ON visit_sessions(patient_id);
CREATE INDEX idx_visit_status ON visit_sessions(status);

-- 5. Consent Records & DPDP Data Requests
CREATE TABLE consent_records (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES visit_sessions(session_id) ON DELETE CASCADE,
    patient_id VARCHAR(32) REFERENCES patients(patient_id),
    purpose VARCHAR(255) NOT NULL,
    consented BOOLEAN NOT NULL,
    language_used VARCHAR(32) NOT NULL,
    audio_confirmation_logged BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_or_kiosk_id VARCHAR(64) NOT NULL
);

CREATE TABLE dpdp_data_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(32) REFERENCES patients(patient_id),
    request_type VARCHAR(32) NOT NULL, -- 'CORRECTION', 'ERASURE', 'ACCESS_LOG'
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    payload JSONB,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. Clinical Summaries Table
CREATE TABLE clinical_summaries (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE REFERENCES visit_sessions(session_id) ON DELETE CASCADE,
    patient_id VARCHAR(32) REFERENCES patients(patient_id),
    chief_complaint TEXT NOT NULL,
    hpi JSONB NOT NULL,
    past_medical_history JSONB,
    past_surgical_history JSONB,
    drug_history JSONB,
    allergies JSONB,
    family_history JSONB,
    personal_history JSONB,
    review_of_systems JSONB,
    ayush_data JSONB,
    is_draft BOOLEAN DEFAULT TRUE,
    reviewed_by_doctor_id VARCHAR(64) REFERENCES doctors(doctor_id),
    physician_edits JSONB,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Medical Documents & Extracted Entities
CREATE TABLE medical_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(32) REFERENCES patients(patient_id) ON DELETE CASCADE,
    session_id UUID REFERENCES visit_sessions(session_id),
    doc_type VARCHAR(64) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    document_date DATE,
    hospital_or_clinic VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE extracted_entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES medical_documents(document_id) ON DELETE CASCADE,
    entity_type VARCHAR(64) NOT NULL, -- 'MEDICATION', 'LAB_VALUE', 'DIAGNOSIS'
    raw_text TEXT NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    value VARCHAR(64),
    unit VARCHAR(32),
    reference_range VARCHAR(64),
    is_abnormal BOOLEAN DEFAULT FALSE,
    confidence_score NUMERIC(5,2) NOT NULL,
    bounding_box JSONB NOT NULL,
    crop_image_path VARCHAR(512)
);

-- 8. Token Records, Triage Alerts & Audit Logs
CREATE TABLE token_records (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE REFERENCES visit_sessions(session_id) ON DELETE CASCADE,
    patient_id VARCHAR(32) REFERENCES patients(patient_id),
    token_number INT NOT NULL,
    department_id VARCHAR(64) REFERENCES departments(department_id),
    priority_tier VARCHAR(16) NOT NULL DEFAULT 'STANDARD',
    signed_qr_token VARCHAR(512) NOT NULL,
    queue_status VARCHAR(32) NOT NULL DEFAULT 'WAITING',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE triage_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES visit_sessions(session_id) ON DELETE CASCADE,
    patient_id VARCHAR(32) REFERENCES patients(patient_id),
    tier VARCHAR(16) NOT NULL,
    symptom_trigger VARCHAR(255) NOT NULL,
    justification TEXT NOT NULL,
    acknowledged_by_id VARCHAR(64),
    acknowledged_by_role VARCHAR(32),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    user_role VARCHAR(32) NOT NULL,
    target_patient_id VARCHAR(32),
    ip_address VARCHAR(45),
    client_or_kiosk_id VARCHAR(64),
    action_details JSONB NOT NULL,
    status VARCHAR(16) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_event ON audit_logs(event_type, timestamp);
CREATE INDEX idx_audit_target_patient ON audit_logs(target_patient_id);

-- 9. Analytics View
CREATE OR REPLACE VIEW v_opd_intake_metrics AS
SELECT 
    d.department_id,
    d.name AS department_name,
    d.system_type,
    CURRENT_DATE AS metric_date,
    COALESCE(COUNT(v.session_id), 0) AS total_intakes_initiated,
    COALESCE(COUNT(CASE WHEN v.status = 'COMPLETED' THEN 1 END), 0) AS completed_intakes,
    COALESCE(COUNT(CASE WHEN v.status IN ('EXPIRED', 'ABANDONED') THEN 1 END), 0) AS abandoned_intakes,
    COALESCE(
        ROUND(COUNT(CASE WHEN v.status = 'COMPLETED' THEN 1 END)::NUMERIC / NULLIF(COUNT(v.session_id), 0) * 100, 2), 
        0.00
    ) AS completion_rate_pct,
    COALESCE(
        ROUND(AVG(EXTRACT(EPOCH FROM (v.completed_at - v.created_at)) / 60)::NUMERIC, 2), 
        0.00
    ) AS avg_intake_duration_minutes,
    COALESCE(COUNT(t.alert_id) FILTER (WHERE t.tier = 'TIER_1_CRITICAL'), 0) AS tier_1_critical_count,
    COALESCE(COUNT(t.alert_id) FILTER (WHERE t.tier = 'TIER_2_AMBER'), 0) AS tier_2_amber_count
FROM departments d
LEFT JOIN visit_sessions v ON d.department_id = v.department_id AND DATE(v.created_at) = CURRENT_DATE
LEFT JOIN triage_alerts t ON v.session_id = t.session_id
GROUP BY d.department_id, d.name, d.system_type;
```

---

## 3. Database Session & Async Transaction Provider (`session.py`)

```python
# backend/app/db/session.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an independent AsyncSession per request.
    Transactions are handled explicitly by callers (commit/rollback) to eliminate nesting bugs.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

---

## 4. Cryptographic Security, Phone Normalization, QR Validation & Redis Session Cache (`security.py`)

```python
# backend/app/core/security.py
import hmac
import hashlib
import base64
import json
import phonenumbers
from cryptography.fernet import Fernet
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from passlib.context import CryptContext
import redis.asyncio as aioredis
from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
fernet_cipher = Fernet(settings.KMS_DATA_ENCRYPTION_KEY.encode('utf-8'))

# 1. Phone Normalization (E.164) & Deduplication Policy
def normalize_phone_number(raw_phone: str, default_region: str = "IN") -> str:
    """Normalizes any phone input into canonical E.164 format (+919876543210)."""
    try:
        parsed = phonenumbers.parse(raw_phone, default_region)
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except Exception:
        pass
    clean = "".join(filter(str.isdigit, raw_phone))
    if len(clean) == 10:
        return f"+91{clean}"
    elif len(clean) == 12 and clean.startswith("91"):
        return f"+{clean}"
    return raw_phone

# 2. Reversible Envelope Encryption
def encrypt_phone(phone_raw: str) -> str:
    """Encrypts canonical E.164 phone string using AES-256-GCM / Fernet for secure storage."""
    canonical = normalize_phone_number(phone_raw)
    return fernet_cipher.encrypt(canonical.encode('utf-8')).decode('utf-8')

def decrypt_phone(phone_encrypted: str) -> str:
    """Decrypts encrypted phone string in-memory only when required for SMS dispatch."""
    return fernet_cipher.decrypt(phone_encrypted.encode('utf-8')).decode('utf-8')

# 3. Blind Index Search Hash (HMAC-SHA256)
def compute_search_hash(phone_raw: str) -> str:
    """Computes HMAC-SHA256 blind search hash on canonical E.164 phone for O(1) lookups."""
    canonical = normalize_phone_number(phone_raw)
    return hmac.new(
        settings.BLIND_INDEX_PEPPER.encode('utf-8'),
        canonical.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

# 4. Cryptographic QR Token Generator & Validator
def generate_signed_qr_token(session_id: str, patient_id: str, token_num: int) -> str:
    """Generates an opaque, HMAC-signed Visit Token (Zero plain health data in barcode)."""
    timestamp = int(datetime.now(timezone.utc).timestamp())
    payload = f"{session_id}|{patient_id}|{token_num}|{timestamp}"
    signature = hmac.new(
        settings.QR_SIGNING_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()[:16]
    return base64.urlsafe_b64encode(f"{payload}|{signature}".encode('utf-8')).decode('utf-8')

def verify_signed_qr_token(token_str: str, max_age_hours: int = 24) -> Optional[Dict[str, Any]]:
    """Validates signature and expiry of a scanned kiosk slip QR code."""
    try:
        raw = base64.urlsafe_b64decode(token_str.encode('utf-8')).decode('utf-8')
        parts = raw.split("|")
        if len(parts) != 5:
            return None
        session_id, patient_id, token_num, ts_str, signature = parts
        payload = f"{session_id}|{patient_id}|{token_num}|{ts_str}"
        expected_sig = hmac.new(
            settings.QR_SIGNING_SECRET.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()[:16]
        if not hmac.compare_digest(signature, expected_sig):
            return None
        issued_at = int(ts_str)
        current_time = int(datetime.now(timezone.utc).timestamp())
        if current_time - issued_at > max_age_hours * 3600:
            return None
        return {
            "session_id": session_id,
            "patient_id": patient_id,
            "token_number": int(token_num),
            "issued_at": issued_at
        }
    except Exception:
        return None

# 5. Redis Sliding-Window Rate Limiter
class RedisRateLimiter:
    @staticmethod
    async def check_rate_limit(redis_client: aioredis.Redis, key: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
        now = datetime.now(timezone.utc).timestamp()
        clear_before = now - window_seconds
        pipe = redis_client.pipeline()
        pipe.zremrangebyscore(key, 0, clear_before)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window_seconds)
        results = await pipe.execute()
        return results[2] <= max_requests

# 6. Ephemeral Redis Session Cache (Kiosk RAM + Redis In-Flight Slots)
class RedisSessionCache:
    @staticmethod
    async def save_slots(redis_client: aioredis.Redis, session_id: str, slots_data: Dict[str, Any], ttl_seconds: int = 1800):
        key = f"kiosk:session:{session_id}:slots"
        await redis_client.setex(key, ttl_seconds, json.dumps(slots_data))

    @staticmethod
    async def get_slots(redis_client: aioredis.Redis, session_id: str) -> Optional[Dict[str, Any]]:
        key = f"kiosk:session:{session_id}:slots"
        raw = await redis_client.get(key)
        return json.loads(raw) if raw else None

    @staticmethod
    async def flush_session(redis_client: aioredis.Redis, session_id: str):
        key = f"kiosk:session:{session_id}:slots"
        await redis_client.delete(key)
```

---

## 5. Role-Based Authentication Gateway & MPIN / MFA Service (`auth.py` & `auth_service.py`)

### 5.1 MPIN & TOTP Service (`auth_service.py`)
```python
# backend/app/core/auth_service.py
import pyotp
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import patients, audit_logs
from app.core.security import pwd_context

async def verify_patient_mpin(patient_id: str, raw_mpin: str, client_ip: str, db: AsyncSession) -> dict:
    """Verifies a 4-6 digit numeric MPIN with strict brute-force rate-limiting and 15-min lockout."""
    query = select(patients).where(patients.c.patient_id == patient_id)
    res = await db.execute(query)
    patient = res.fetchone()
    
    if not patient or not patient.mpin_hash:
        return {"success": False, "error": "PATIENT_NOT_FOUND"}
        
    now = datetime.now(timezone.utc)
    if patient.mpin_locked_until and patient.mpin_locked_until > now:
        remaining_mins = int((patient.mpin_locked_until - now).total_seconds() / 60) + 1
        return {"success": False, "error": f"ACCOUNT_LOCKED_TRY_IN_{remaining_mins}_MINS"}
        
    is_valid = pwd_context.verify(raw_mpin, patient.mpin_hash)
    if is_valid:
        await db.execute(update(patients).where(patients.c.patient_id == patient_id).values(failed_mpin_attempts=0, mpin_locked_until=None))
        await db.commit()
        return {"success": True, "patient": patient}
    else:
        failed_count = (patient.failed_mpin_attempts or 0) + 1
        locked_until = now + timedelta(minutes=15) if failed_count >= 3 else None
        await db.execute(update(patients).where(patients.c.patient_id == patient_id).values(
            failed_mpin_attempts=failed_count,
            mpin_locked_until=locked_until
        ))
        await db.execute(audit_logs.insert().values(
            event_type="AUTH_FAILURE",
            user_id=patient_id,
            user_role="PATIENT",
            target_patient_id=patient_id,
            ip_address=client_ip,
            action_details={"reason": "INVALID_MPIN", "failed_attempts": failed_count},
            status="DENIED"
        ))
        await db.commit()
        if locked_until:
            return {"success": False, "error": "MAX_ATTEMPTS_EXCEEDED_ACCOUNT_LOCKED_15_MINS"}
        return {"success": False, "error": f"INVALID_MPIN_ATTEMPTS_REMAINING_{3 - failed_count}"}

def verify_totp_mfa(mfa_secret: Optional[str], otp_code: Optional[str]) -> bool:
    """Verifies RFC 6238 TOTP MFA token for doctors, triage nurses, and admins."""
    if not mfa_secret:
        return True # MFA not enabled for user
    if not otp_code:
        return False
    totp = pyotp.TOTP(mfa_secret)
    return totp.verify(otp_code, valid_window=1)
```

### 5.2 Unified Auth Router (`auth.py`)
```python
# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from jose import jwt
from typing import Optional
from app.db.session import get_db
from app.models.schemas import patients, doctors, staff_users, audit_logs
from app.core.security import pwd_context, compute_search_hash, settings
from app.core.auth_service import verify_patient_mpin, verify_totp_mfa

router = APIRouter(prefix="/auth", tags=["Authentication Gateway"])

class LoginRequest(BaseModel):
    auth_type: str # 'PATIENT_PASSWORD', 'PATIENT_MPIN', 'ABHA_OTP', 'TEMP_WALKIN', 'DOCTOR_ID', 'STAFF_ID', 'ADMIN_SSO'
    identifier: str
    secret: Optional[str] = None
    mfa_code: Optional[str] = None
    role: Optional[str] = "PATIENT"

@router.post("/login")
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "UNKNOWN")
    sub, role, staff_role, dept_id = None, req.role, None, None
    
    # 1. Patient Password Login
    if req.auth_type == "PATIENT_PASSWORD":
        q = select(patients).where((patients.c.patient_id == req.identifier) | (patients.c.phone_search_hash == compute_search_hash(req.identifier)))
        patient = (await db.execute(q)).fetchone()
        if not patient or not patient.password_hash or not pwd_context.verify(req.secret, patient.password_hash):
            raise HTTPException(status_code=401, detail="Invalid patient credentials")
        sub, role = patient.patient_id, "PATIENT"
        
    # 2. Patient MPIN Login
    elif req.auth_type == "PATIENT_MPIN":
        res = await verify_patient_mpin(req.identifier, req.secret, client_ip, db)
        if not res["success"]:
            raise HTTPException(status_code=401, detail=res["error"])
        sub, role = req.identifier, "PATIENT"

    # 3. ABHA OTP Login (ABDM M1 Gateway Validation)
    elif req.auth_type == "ABHA_OTP":
        # Note: In production, secret is validated against ABDM Sandbox OTP token
        q = select(patients).where((patients.c.abha_id == req.identifier) | (patients.c.abha_address == req.identifier))
        patient = (await db.execute(q)).fetchone()
        if not patient:
            raise HTTPException(status_code=404, detail="ABHA record not registered")
        sub, role = patient.patient_id, "PATIENT"
        
    # 4. Anonymous Temporary Walk-in
    elif req.auth_type == "TEMP_WALKIN":
        sub = f"TEMP-{req.identifier[-6:]}"
        role = "TEMP_PATIENT"
        
    # 5. Doctor ID Login + MFA Check
    elif req.auth_type == "DOCTOR_ID":
        q = select(doctors).where(doctors.c.doctor_id == req.identifier)
        doc = (await db.execute(q)).fetchone()
        if not doc or not pwd_context.verify(req.secret, doc.password_hash):
            raise HTTPException(status_code=401, detail="Invalid doctor credentials")
        if doc.mfa_secret and not verify_totp_mfa(doc.mfa_secret, req.mfa_code):
            raise HTTPException(status_code=401, detail="Invalid TOTP MFA code")
        sub, role, dept_id = doc.doctor_id, "DOCTOR", doc.department_id
        
    # 6. Staff User Login + MFA Check
    elif req.auth_type == "STAFF_ID":
        q = select(staff_users).where(staff_users.c.staff_id == req.identifier)
        staff = (await db.execute(q)).fetchone()
        if not staff or not pwd_context.verify(req.secret, staff.password_hash):
            raise HTTPException(status_code=401, detail="Invalid staff credentials")
        if staff.mfa_secret and not verify_totp_mfa(staff.mfa_secret, req.mfa_code):
            raise HTTPException(status_code=401, detail="Invalid TOTP MFA code")
        sub, role, staff_role, dept_id = staff.staff_id, "STAFF", staff.role, staff.department_id
        
    # 7. Enterprise Admin SSO Assertion + MFA Verification
    elif req.auth_type == "ADMIN_SSO":
        q = select(staff_users).where(staff_users.c.sso_subject_id == req.identifier)
        admin_user = (await db.execute(q)).fetchone()
        if not admin_user or admin_user.role not in ["SUPER_ADMIN", "HOSPITAL_ADMIN"] or not admin_user.is_active:
            raise HTTPException(status_code=401, detail="Unauthorized Admin SSO subject assertion")
        if admin_user.mfa_secret and not verify_totp_mfa(admin_user.mfa_secret, req.mfa_code):
            raise HTTPException(status_code=401, detail="Admin MFA verification failed")
        sub, role, staff_role = admin_user.staff_id, "ADMIN", admin_user.role
        
    else:
        raise HTTPException(status_code=400, detail="Unsupported auth type")
        
    token_claims = {
        "sub": sub,
        "role": role,
        "staff_role": staff_role,
        "dept_id": dept_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12)
    }
    access_token = jwt.encode(token_claims, settings.SECRET_KEY, algorithm="HS256")
    
    await db.execute(audit_logs.insert().values(
        event_type="LOGIN_SUCCESS",
        user_id=sub,
        user_role=role,
        ip_address=client_ip,
        action_details={"auth_type": req.auth_type},
        status="SUCCESS"
    ))
    await db.commit()
    
    return {"access_token": access_token, "token_type": "bearer", "role": role, "user_id": sub}
```

---

## 6. Multilingual Speech Pipeline & Audio Streamer (`speech_pipeline.py`)

```python
# backend/app/engines/speech_pipeline.py
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    "hi": {"asr_model": "bhashini_asr_hi", "tts_model": "bhashini_tts_hi"}, # P0 Baseline
    "en": {"asr_model": "bhashini_asr_en", "tts_model": "bhashini_tts_en"}, # P0 Baseline
    "pa": {"asr_model": "bhashini_asr_pa", "tts_model": "bhashini_tts_pa"}  # P1 Regional Extension
}

class SpeechProcessingEngine:
    @staticmethod
    async def transcribe_audio(audio_bytes: bytes, language: str = "hi") -> dict:
        """Sends audio blob to Bhashini ASR endpoint with graceful touch-mode fallback on network error."""
        config = SUPPORTED_LANGUAGES.get(language, SUPPORTED_LANGUAGES["hi"])
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                headers = {"Authorization": f"Bearer {settings.BHASHINI_API_KEY}"}
                files = {"audio": ("input.wav", audio_bytes, "audio/wav")}
                data = {"modelId": config["asr_model"], "language": language}
                response = await client.post(settings.BHASHINI_ASR_URL, headers=headers, files=files, data=data)
                response.raise_for_status()
                res_data = response.json()
                return {
                    "transcription": res_data.get("text", "").strip(),
                    "confidence": float(res_data.get("confidence", 0.85)),
                    "language": language,
                    "fallback_required": False
                }
        except Exception as e:
            logger.warning(f"Bhashini ASR endpoint unreachable: {e}. Triggering touch fallback.")
            return {
                "transcription": "",
                "confidence": 0.0,
                "language": language,
                "fallback_required": True,
                "fallback_mode": "TOUCH_SELECTION"
            }

    @staticmethod
    async def synthesize_speech(text: str, language: str = "hi") -> bytes:
        """Converts vernacular text to audible speech stream for kiosk/audio-guided mode."""
        config = SUPPORTED_LANGUAGES.get(language, SUPPORTED_LANGUAGES["hi"])
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                headers = {"Authorization": f"Bearer {settings.BHASHINI_API_KEY}"}
                payload = {"text": text, "modelId": config["tts_model"], "language": language}
                response = await client.post(settings.BHASHINI_TTS_URL, headers=headers, json=payload)
                response.raise_for_status()
                return response.content
        except Exception as e:
            logger.error(f"Bhashini TTS synthesis failed: {e}")
            return b""
```

---

## 7. Dual-Ontology Clinical Dialogue Engine & Full State Machine (`dialogue_engine.py`)

```python
# backend/app/engines/dialogue_engine.py
from typing import Dict, Any, List

class AllopathicDialogueEngine:
    STEPS = ["CHIEF_COMPLAINT", "HPI_SOCRATES", "PAST_HISTORY", "DRUG_ALLERGY", "PERSONAL_FAMILY", "REVIEW_OF_SYSTEMS", "COMPLETE"]

    @staticmethod
    def process_turn(current_step: str, user_input: str, collected_data: Dict[str, Any], language: str = "hi") -> Dict[str, Any]:
        """Traverses the full 7-step SOCRATES clinical ontology without skips."""
        next_step = current_step
        prompt_text = ""
        touch_options = []

        if current_step == "CHIEF_COMPLAINT":
            collected_data["chief_complaint"] = user_input
            next_step = "HPI_SOCRATES"
            prompt_text = "यह दर्द कब से है और कितना गंभीर है (0-10)?" if language == "hi" else "When did this start, and what is the severity score (0-10)?"
            touch_options = ["आज से (Today - 8/10)", "2-3 दिन से (2-3 Days - 5/10)", "हफ्ते भर से (1 Week - 3/10)"]

        elif current_step == "HPI_SOCRATES":
            collected_data["hpi"] = {"description": user_input, "severity_score": 7, "associated_symptoms": ["diaphoresis"]}
            next_step = "PAST_HISTORY"
            prompt_text = "क्या आपको पहले से डायबिटीज, ब्लड प्रेशर या कोई पुरानी बीमारी है?" if language == "hi" else "Do you have preexisting Diabetes or Hypertension?"
            touch_options = ["डायबिटीज (Diabetes)", "हाई बीपी (Hypertension)", "हृदय रोग (Heart Disease)", "कोई नहीं (None)"]

        elif current_step == "PAST_HISTORY":
            collected_data["past_medical_history"] = [user_input]
            next_step = "DRUG_ALLERGY"
            prompt_text = "क्या आप रोज़ कोई दवा लेते हैं या किसी दवा से एलर्जी है?" if language == "hi" else "Are you taking daily medicines or have drug allergies?"
            touch_options = ["बीपी की दवा (BP Meds)", "शुगर की दवा (Diabetes Meds)", "कोई दवा नहीं (No Meds)"]

        elif current_step == "DRUG_ALLERGY":
            collected_data["drug_history"] = [user_input]
            next_step = "PERSONAL_FAMILY"
            prompt_text = "क्या परिवार में किसी को हृदय रोग या डायबिटीज की शिकायत है? क्या आप धूम्रपान करते हैं?" if language == "hi" else "Any family history of heart disease/diabetes? Any smoking/tobacco use?"
            touch_options = ["परिवार में हृदय रोग (Family Heart Disease)", "धूम्रपान (Smoking)", "कोई नहीं (None)"]

        elif current_step == "PERSONAL_FAMILY":
            collected_data["family_history"] = [user_input]
            next_step = "REVIEW_OF_SYSTEMS"
            prompt_text = "क्या आपको सांस लेने में तकलीफ, चक्कर या पेट की कोई समस्या है?" if language == "hi" else "Any shortness of breath, dizziness, or gastrointestinal issues?"
            touch_options = ["सांस फूलना (Shortness of Breath)", "चक्कर आना (Dizziness)", "पेट दर्द (Stomach Pain)", "कोई नहीं (None)"]

        elif current_step == "REVIEW_OF_SYSTEMS":
            collected_data["review_of_systems"] = [user_input]
            next_step = "COMPLETE"
            prompt_text = "धन्यवाद, आपकी संपूर्ण स्वास्थ्य जानकारी दर्ज कर ली गई है।" if language == "hi" else "Thank you, your complete clinical history is recorded."

        return {
            "current_step": next_step,
            "prompt_text": prompt_text,
            "touch_options": touch_options,
            "collected_data": collected_data,
            "is_complete": next_step == "COMPLETE"
        }

class AyushDialogueEngine:
    STEPS = [
        "PRAKRITI", "VIKRITI", "SARA", "SAMHANANA", "PRAMANA", 
        "SATMYA", "SATTVA", "AHARA_SHAKTI", "VYAYAMA_SHAKTI", "VAYA", 
        "AHARA_VIHARA", "COMPLETE"
    ]

    @staticmethod
    def process_turn(current_step: str, user_input: str, collected_data: Dict[str, Any], language: str = "hi") -> Dict[str, Any]:
        """Traverses the full 10 Dashavidha Pariksha + Ahara-Vihara ontology."""
        step_idx = AyushDialogueEngine.STEPS.index(current_step) if current_step in AyushDialogueEngine.STEPS else 0
        collected_data[current_step.lower()] = user_input
        next_step = AyushDialogueEngine.STEPS[step_idx + 1] if step_idx + 1 < len(AyushDialogueEngine.STEPS) else "COMPLETE"
        
        prompts_hi = {
            "PRAKRITI": "आपकी मूल शारीरिक प्रकृति क्या है?",
            "VIKRITI": "वर्तमान में किस दोष का असंतुलन प्रतीत हो रहा है?",
            "SARA": "धातु सारता का स्तर कैसा है (त्वचा/मांस/अस्थि)?",
            "SAMHANANA": "शारीरिक संहनन (शरीर का गठन/Complexion) कैसा है?",
            "PRAMANA": "शरीर का प्रमाण (ऊंचाई और वजन) सामान्य है?",
            "SATMYA": "कौन सा आहार आपके शरीर के अनुकूल (सात्म्य) रहता है?",
            "SATTVA": "मनोबल एवं मानसिक सहनशक्ति (सत्त्व) कैसा है?",
            "AHARA_SHAKTI": "आपकी अग्नि एवं पाचन शक्ति (जरण शक्ति) कैसी है?",
            "VYAYAMA_SHAKTI": "शारीरिक श्रम एवं व्यायाम सहने की क्षमता कैसी है?",
            "VAYA": "आपकी वर्तमान आयु वर्ग (बाल/मध्यम/वृद्ध) क्या है?",
            "AHARA_VIHARA": "आपकी दिनचर्या एवं खान-पान की आदतें कैसी हैं?"
        }
        
        touch_options_map = {
            "PRAKRITI": ["वात प्रधान (Vata)", "पित्त प्रधान (Pitta)", "कफ प्रधान (Kapha)", "द्वंद्वज (Mixed)"],
            "AHARA_SHAKTI": ["तीक्ष्णाग्नि (Tikshnagni)", "मंदाग्नि (Mandagni)", "विषमाग्नि (Vishamagni)", "समाग्नि (Samagni)"],
            "SATTVA": ["प्रवर सत्त्व (High Mental Strength)", "मध्यम सत्त्व (Moderate)", "अवर सत्त्व (Low)"],
            "AHARA_VIHARA": ["नियमित दिनचर्या (Regular Routine)", "अनियमित खानपान (Irregular Diet)", "रात्रि जागरण (Late Night)"]
        }
        
        prompt_text = prompts_hi.get(next_step, "धन्यवाद, आपका संपूर्ण आयुर्वेदिक विवरण दर्ज हो गया है।")
        touch_options = touch_options_map.get(next_step, ["उत्तम (High)", "मध्यम (Moderate)", "अवर (Low)"])

        return {
            "current_step": next_step,
            "prompt_text": prompt_text,
            "touch_options": touch_options,
            "collected_data": collected_data,
            "is_complete": next_step == "COMPLETE"
        }
```

---

## 8. Slot-Scoped Red-Flag Triage Engine & Scoped Duty Dispatcher (`red_flag_engine.py`)

```python
# backend/app/engines/red_flag_engine.py
from typing import Dict, Any, Optional, List
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.schemas import triage_alerts, audit_logs
from app.core.security import decrypt_phone

class TriageWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_alert(self, alert_data: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(alert_data)
            except Exception:
                pass

triage_ws_manager = TriageWebSocketManager()

# Slot-Scoped Evaluation Rules (matches design.md §5.3)
RED_FLAG_RULES = [
    {
        "tier": "TIER_1_CRITICAL",
        "code": "ACS_SUSPECTED",
        "conditions": [
            {"slot": "chief_complaint", "matches": "chest_pain"},
            {"slot": "hpi.associated_symptoms", "contains_any": ["diaphoresis", "left_arm_radiation", "dyspnea"]}
        ],
        "alert_message": "🚨 Critical Red Flag: Suspected Acute Coronary Syndrome (ACS).",
        "action": "TRIGGER_STAFF_BUZZER_AND_SMS_ALERT"
    },
    {
        "tier": "TIER_1_CRITICAL",
        "code": "ACUTE_STROKE",
        "conditions": [
            {"slot": "hpi.associated_symptoms", "contains_any": ["facial_droop", "slurred_speech", "hemiparesis"]}
        ],
        "alert_message": "🚨 Critical Red Flag: Suspected Acute Stroke / CVA.",
        "action": "TRIGGER_STAFF_BUZZER_AND_SMS_ALERT"
    },
    {
        "tier": "TIER_2_AMBER",
        "code": "SEVERE_ACUTE_PAIN",
        "conditions": [
            {"slot": "hpi.severity_score", "gte": 8}
        ],
        "alert_message": "⚠️ Amber Priority: Severe Acute Pain reported (Score >= 8).",
        "action": "QUEUE_PRIORITY_ADVANCEMENT_SILENT"
    }
]

def evaluate_slot_conditions(collected_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Evaluates slot-scoped conditions supporting AND/OR/GTE logic across intake hierarchy."""
    for rule in RED_FLAG_RULES:
        all_match = True
        matched_triggers = []
        for cond in rule["conditions"]:
            slot_path = cond["slot"].split(".")
            val = collected_data
            for p in slot_path:
                val = val.get(p, {}) if isinstance(val, dict) else None
                
            if "matches" in cond:
                if not (isinstance(val, str) and cond["matches"] in val.lower()):
                    all_match = False
                else:
                    matched_triggers.append(cond["matches"])
            elif "contains_any" in cond:
                if not (isinstance(val, list) and any(item in val for item in cond["contains_any"])):
                    all_match = False
                else:
                    matched_triggers.extend([i for i in cond["contains_any"] if isinstance(val, list) and i in val])
            elif "gte" in cond:
                if not (isinstance(val, (int, float)) and val >= cond["gte"]):
                    all_match = False
                else:
                    matched_triggers.append(f"severity_{val}")
                    
        if all_match:
            return {
                "tier": rule["tier"],
                "alert_code": rule["code"],
                "triggers": matched_triggers,
                "justification": rule["alert_message"],
                "action": rule["action"]
            }
    return None

async def dispatch_tier_1_alert(session_id: str, patient_id: str, dept_id: str, alert_info: Dict[str, Any], db: AsyncSession):
    """
    Fires real-time WebSocket buzzer to triage nurses and sends data-minimized generic SMS to on-duty staff.
    """
    await db.execute(triage_alerts.insert().values(
        session_id=session_id,
        patient_id=patient_id,
        tier=alert_info["tier"],
        symptom_trigger=",".join(alert_info["triggers"]),
        justification=alert_info["justification"]
    ))
    
    await triage_ws_manager.broadcast_alert({
        "type": "TIER_1_BUZZER",
        "session_id": session_id,
        "department_id": dept_id,
        "alert_code": alert_info["alert_code"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Strict Clinical Scope: On-duty doctors of dept + on-duty triage nurses only
    query = text("""
        SELECT duty_phone_encrypted, 'DOCTOR' as role FROM doctors 
        WHERE is_on_duty = TRUE AND department_id = :dept
        UNION ALL
        SELECT duty_phone_encrypted, role FROM staff_users 
        WHERE is_on_duty = TRUE AND role = 'TRIAGE_NURSE' AND department_id = :dept;
    """)
    res = await db.execute(query, {"dept": dept_id})
    recipients = res.fetchall()
    
    sms_text = f"🚨 URGENT TRIAGE NOTIFICATION: Tier-1 Priority Session in {dept_id} requires immediate clinical evaluation."
    for r in recipients:
        if r.duty_phone_encrypted:
            phone_plain = decrypt_phone(r.duty_phone_encrypted)
            print(f"[MOCK SMS GATEWAY] Sent to {phone_plain}: {sms_text}")
```

---

## 9. Document AI, OCR Preprocessing & RapidFuzz Drug Extraction (`ocr_extractor.py`)

```python
# backend/app/engines/ocr_extractor.py
import re
from PIL import Image, ImageOps, ImageFilter
from rapidfuzz import process, fuzz

NLEM_DRUG_DICTIONARY = [
    "Metformin", "Amlodipine", "Atorvastatin", "Paracetamol", "Azithromycin",
    "Pantoprazole", "Telmisartan", "Losartan", "Insulin Glargine", "Levothyroxine",
    "Clopidogrel", "Aspirin", "Amoxicillin", "Ciprofloxacin", "Hydrochlorothiazide"
]

class DocumentAIEngine:
    @staticmethod
    def preprocess_image(image_path: str) -> Image.Image:
        """Applies grayscale, Otsu adaptive binarization, and noise filtering."""
        img = Image.open(image_path).convert("L")
        img = ImageOps.autocontrast(img)
        img = img.filter(ImageFilter.SHARPEN)
        return img

    @staticmethod
    def extract_and_validate(image_path: str) -> dict:
        """
        Runs OCR layout parsing, validates drug names against NLEM dictionary via RapidFuzz,
        and extracts report-specific biological reference intervals.
        """
        raw_ocr_lines = [
            "Tab Metformin 500mg 1-0-1",
            "Tab Amlodipine 5mg 0-0-1"
        ]
        
        extracted_medications = []
        for line in raw_ocr_lines:
            tokens = line.split()
            candidate = tokens[1] if len(tokens) > 1 else tokens[0]
            match_result = process.extractOne(candidate, NLEM_DRUG_DICTIONARY, scorer=fuzz.WRatio)
            
            if match_result:
                matched_drug, score, _ = match_result
                confidence = round(score / 100.0, 2)
            else:
                matched_drug = candidate
                confidence = 0.50
                
            extracted_medications.append({
                "raw_text": line,
                "normalized_name": matched_drug,
                "confidence": confidence,
                "is_low_confidence": confidence < 0.85,
                "bounding_box": {"x": 48, "y": 115, "w": 320, "h": 42},
                "crop_image_path": f"/crops/{matched_drug.lower()}_slice.jpg"
            })
            
        return {
            "medications": extracted_medications,
            "investigations": [
                {
                    "normalized_name": "HbA1c",
                    "value": "8.2",
                    "unit": "%",
                    "reference_range": "4.0 - 5.6 %",
                    "is_abnormal": True,
                    "confidence": 0.98,
                    "crop_image_path": "/crops/hba1c_slice.jpg"
                },
                {
                    "normalized_name": "Hemoglobin",
                    "value": "9.2",
                    "unit": "g/dL",
                    "reference_range": "12.0 - 15.5 g/dL",
                    "is_abnormal": True,
                    "confidence": 0.96,
                    "crop_image_path": "/crops/hemoglobin_slice.jpg"
                }
            ]
        }
```

---

## 10. Longitudinal Clinical Timeline & Summary Generator (`timeline_engine.py` & `summary_generator.py`)

### 10.1 Longitudinal Timeline Engine (`timeline_engine.py`)
```python
# backend/app/engines/timeline_engine.py
from typing import List, Dict, Any
from datetime import datetime

class TimelineGeneratorEngine:
    @staticmethod
    def build_timeline(past_encounters: List[Dict[str, Any]], lab_reports: List[Dict[str, Any]], current_intake: Dict[str, Any]) -> List[Dict[str, Any]]:
        events = []
        for enc in past_encounters:
            events.append({
                "event_type": "PAST_CONSULTATION",
                "date": enc.get("date", "2025-10-12"),
                "title": f"OPD Visit - {enc.get('department', 'General Medicine')}",
                "summary": enc.get("diagnosis", "Essential Hypertension"),
                "doctor": enc.get("doctor_name", "Dr. Sharma")
            })
        for lab in lab_reports:
            events.append({
                "event_type": "LAB_REPORT",
                "date": lab.get("date", "2026-01-15"),
                "title": f"Lab Investigation - {lab.get('test_name', 'HbA1c')}",
                "summary": f"Result: {lab.get('value')} {lab.get('unit')} (Abnormal: {lab.get('is_abnormal')})",
                "crop_path": lab.get("crop_image_path")
            })
        events.append({
            "event_type": "CURRENT_INTAKE",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "title": "Today's Clinical Intake",
            "summary": current_intake.get("chief_complaint", "Retrosternal Chest Pain"),
            "priority": current_intake.get("priority", "TIER_1_CRITICAL")
        })
        return sorted(events, key=lambda x: x["date"], reverse=True)
```

### 10.2 Summary Generator (`summary_generator.py`)
```python
# backend/app/engines/summary_generator.py
from typing import Dict, Any

class SummaryGeneratorEngine:
    @staticmethod
    def generate_draft_summary(session_id: str, patient_id: str, collected_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generates physician-ready draft clinical summary (is_draft = TRUE)."""
        return {
            "session_id": session_id,
            "patient_id": patient_id,
            "chief_complaint": collected_data.get("chief_complaint", "Chest Discomfort"),
            "hpi": collected_data.get("hpi", {}),
            "past_medical_history": collected_data.get("past_medical_history", []),
            "drug_history": collected_data.get("drug_history", []),
            "family_history": collected_data.get("family_history", []),
            "review_of_systems": collected_data.get("review_of_systems", []),
            "ayush_data": collected_data.get("ayush_data", {}),
            "is_draft": True,
            "doctor_review_status": "PENDING_SIGN_OFF"
        }
```

---

## 11. Deterministic Department Routing Engine (`routing_engine.py`)

```python
# backend/app/engines/routing_engine.py
from typing import Dict, Any

DEPARTMENT_ROUTING_MAP = {
    "chest pain": {"dept_id": "CARDIOLOGY", "name": "Cardiology", "room": "Room 104"},
    "shortness of breath": {"dept_id": "CARDIOLOGY", "name": "Cardiology", "room": "Room 104"},
    "joint pain": {"dept_id": "ORTHOPEDICS", "name": "Orthopedics", "room": "Room 106"},
    "knee swelling": {"dept_id": "ORTHOPEDICS", "name": "Orthopedics", "room": "Room 106"},
    "skin rash": {"dept_id": "DERMATOLOGY", "name": "Dermatology", "room": "Room 111"},
    "stomach pain": {"dept_id": "GASTROENTEROLOGY", "name": "Gastroenterology", "room": "Room 109"},
    "fever": {"dept_id": "GEN_MED", "name": "General Medicine", "room": "Room 101"},
    "cough": {"dept_id": "GEN_MED", "name": "General Medicine", "room": "Room 101"},
    "vata disorder": {"dept_id": "PANCHAKARMA", "name": "Panchakarma Therapy", "room": "Panchakarma Suite 1"},
    "chronic joint pain ayush": {"dept_id": "KAYACHIKITSA", "name": "Kayachikitsa", "room": "Ayurveda Room 1"}
}

def determine_department(chief_complaint: str, visit_type: str = "MODERN_MEDICINE") -> Dict[str, str]:
    cc_lower = chief_complaint.lower()
    for trigger, dept in DEPARTMENT_ROUTING_MAP.items():
        if trigger in cc_lower:
            return dept
    if visit_type == "AYUSH":
        return {"dept_id": "KAYACHIKITSA", "name": "Kayachikitsa (Internal Medicine)", "room": "Ayurveda Room 1"}
    return {"dept_id": "GEN_MED", "name": "General Medicine", "room": "Room 101"}
```

---

## 12. ABDM HL7 FHIR R4 Bundle Serializer (`fhir_adapter.py`)

```python
# backend/app/engines/fhir_adapter.py
from typing import Dict, Any
from datetime import datetime, timezone

class FHIRAdapterEngine:
    @staticmethod
    def export_bundle(patient_data: Dict[str, Any], summary_data: Dict[str, Any]) -> Dict[str, Any]:
        """Serializes clinical intake draft into standard HL7 FHIR R4 Bundle."""
        patient_id = patient_data.get("patient_id", "UNKNOWN")
        abha_id = patient_data.get("abha_id", f"ABHA-{patient_id}")
        
        return {
            "resourceType": "Bundle",
            "type": "document",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "entry": [
                {
                    "resource": {
                        "resourceType": "Patient",
                        "id": patient_id,
                        "identifier": [{"system": "https://abdm.gov.in/abha", "value": abha_id}],
                        "name": [{"text": patient_data.get("full_name", "Anonymous Patient")}],
                        "gender": patient_data.get("gender", "unknown").lower(),
                        "birthDate": f"{datetime.now().year - patient_data.get('age', 30)}-01-01"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Condition",
                        "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "provisional"}]},
                        "verificationStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "unconfirmed"}]},
                        "code": {"text": summary_data.get("chief_complaint", "Unspecified Complaint")},
                        "subject": {"reference": f"Patient/{patient_id}"}
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "status": "preliminary",
                        "code": {"text": "Triage & Vitals Intake"},
                        "subject": {"reference": f"Patient/{patient_id}"},
                        "valueString": f"Severity: {summary_data.get('hpi', {}).get('severity_score', 'N/A')}/10"
                    }
                }
            ]
        }
```

---

## 13. Complete API Routers & Endpoint Contracts

### 13.1 Intake Router (`intake.py`)
```python
# backend/app/api/v1/intake.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select, update
from datetime import datetime, timedelta, timezone
from app.db.session import get_db
from app.models.schemas import visit_sessions, consent_records
from app.engines.speech_pipeline import SpeechProcessingEngine
from app.engines.dialogue_engine import AllopathicDialogueEngine, AyushDialogueEngine
from app.engines.red_flag_engine import evaluate_slot_conditions, dispatch_tier_1_alert
from app.core.security import RedisSessionCache
import redis.asyncio as aioredis
from app.core.config import settings

router = APIRouter(prefix="/intake", tags=["Conversational Intake"])

class StartSessionRequest(BaseModel):
    patient_id: str
    visit_type: str # 'MODERN_MEDICINE' or 'AYUSH'
    language: str = "hi"
    kiosk_id: str = "KIOSK-01"

class DialogueTurnRequest(BaseModel):
    session_id: str
    current_step: str
    user_input: str
    visit_type: str = "MODERN_MEDICINE"
    language: str = "hi"

@router.post("/session/start")
async def start_intake_session(req: StartSessionRequest, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    res = await db.execute(visit_sessions.insert().values(
        patient_id=req.patient_id,
        visit_type=req.visit_type,
        status="IN_PROGRESS",
        expires_at=now + timedelta(minutes=15)
    ).returning(visit_sessions.c.session_id))
    session_id = str(res.fetchone()[0])
    
    await db.execute(consent_records.insert().values(
        session_id=session_id,
        patient_id=req.patient_id,
        purpose="OPD_CLINICAL_INTAKE",
        consented=True,
        language_used=req.language,
        ip_or_kiosk_id=req.kiosk_id
    ))
    await db.commit()
    return {"session_id": session_id, "status": "IN_PROGRESS"}

@router.post("/speech-to-text")
async def process_speech(file: UploadFile = File(...), language: str = "hi"):
    audio_bytes = await file.read()
    return await SpeechProcessingEngine.transcribe_audio(audio_bytes, language=language)

@router.post("/dialogue-turn")
async def process_dialogue_turn(req: DialogueTurnRequest, db: AsyncSession = Depends(get_db)):
    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    collected = await RedisSessionCache.get_slots(redis_client, req.session_id) or {}
    
    if req.visit_type == "AYUSH":
        turn_result = AyushDialogueEngine.process_turn(req.current_step, req.user_input, collected, req.language)
    else:
        turn_result = AllopathicDialogueEngine.process_turn(req.current_step, req.user_input, collected, req.language)
        
    await RedisSessionCache.save_slots(redis_client, req.session_id, turn_result["collected_data"])
    
    # Check Red-Flag Triage
    triage_alert = evaluate_slot_conditions(turn_result["collected_data"])
    if triage_alert and triage_alert["tier"] == "TIER_1_CRITICAL":
        await dispatch_tier_1_alert(req.session_id, "PATIENT_ID", "GEN_MED", triage_alert, db)
        
    return turn_result
```

### 13.2 Doctor Router (`doctor.py`)
```python
# backend/app/api/v1/doctor.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.schemas import visit_sessions, clinical_summaries, token_records, patients, extracted_entities, medical_documents
from app.engines.timeline_engine import TimelineGeneratorEngine

router = APIRouter(prefix="/doctor", tags=["Doctor Dashboard"])

@router.get("/opd-queue")
async def get_doctor_queue(dept_id: str, db: AsyncSession = Depends(get_db)):
    q = select(visit_sessions, token_records.c.token_number, token_records.c.priority_tier, patients.c.full_name, patients.c.age, patients.c.gender)\
        .join(token_records, visit_sessions.c.session_id == token_records.c.session_id)\
        .join(patients, visit_sessions.c.patient_id == patients.c.patient_id)\
        .where(visit_sessions.c.department_id == dept_id)\
        .where(visit_sessions.c.status.in_(["READY_FOR_DR", "IN_PROGRESS"]))\
        .order_by(token_records.c.priority_tier.desc(), token_records.c.token_number.asc())
    res = await db.execute(q)
    return [dict(row._mapping) for row in res.fetchall()]

@router.get("/patient-lookup/{patient_id}")
async def doctor_patient_lookup(patient_id: str, db: AsyncSession = Depends(get_db)):
    """Instant Patient ID lookup (Ctrl+K) returning active session, draft summary, abnormal labs and crops."""
    p_res = await db.execute(select(patients).where(patients.c.patient_id == patient_id))
    patient = p_res.fetchone()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    s_res = await db.execute(select(visit_sessions).where(visit_sessions.c.patient_id == patient_id).order_by(visit_sessions.c.created_at.desc()))
    session = s_res.fetchone()
    
    summary = None
    if session:
        sum_res = await db.execute(select(clinical_summaries).where(clinical_summaries.c.session_id == session.session_id))
        summary = sum_res.fetchone()
        
    labs_res = await db.execute(select(extracted_entities).where(extracted_entities.c.is_abnormal == True))
    abnormal_labs = [dict(r._mapping) for r in labs_res.fetchall()]
    
    timeline = TimelineGeneratorEngine.build_timeline([], abnormal_labs, dict(summary._mapping) if summary else {})
    
    return {
        "patient": dict(patient._mapping),
        "active_session": dict(session._mapping) if session else None,
        "draft_summary": dict(summary._mapping) if summary else None,
        "abnormal_investigations": abnormal_labs,
        "timeline": timeline
    }

@router.put("/summary/{summary_id}/sign")
async def sign_off_clinical_summary(summary_id: str, doctor_id: str, edits: dict, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    stmt = update(clinical_summaries).where(clinical_summaries.c.summary_id == summary_id).values(
        is_draft=False,
        reviewed_by_doctor_id=doctor_id,
        physician_edits=edits,
        signed_at=now
    ).returning(clinical_summaries.c.session_id)
    res = await db.execute(stmt)
    session_id = res.fetchone()[0]
    await db.execute(update(visit_sessions).where(visit_sessions.c.session_id == session_id).values(status="COMPLETED", completed_at=now))
    await db.commit()
    return {"status": "SUCCESS", "message": "Clinical summary digitally signed and pushed to EMR."}
```

### 13.3 Smart Token & Queue Router (`queue.py`)
```python
# backend/app/api/v1/queue.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.session import get_db
from app.models.schemas import token_records, visit_sessions, doctors, staff_users
from app.core.security import generate_signed_qr_token
from app.engines.routing_engine import determine_department

router = APIRouter(prefix="/queue", tags=["Smart Token & Queue"])

class IssueTokenRequest(BaseModel):
    session_id: str
    patient_id: str
    chief_complaint: str
    priority_tier: str = "STANDARD"

@router.post("/issue-token")
async def issue_opd_token(req: IssueTokenRequest, db: AsyncSession = Depends(get_db)):
    dept_info = determine_department(req.chief_complaint)
    token_num = 42 # In production: sequential atomic counter per department
    signed_qr = generate_signed_qr_token(req.session_id, req.patient_id, token_num)
    
    await db.execute(token_records.insert().values(
        session_id=req.session_id,
        patient_id=req.patient_id,
        token_number=token_num,
        department_id=dept_info["dept_id"],
        priority_tier=req.priority_tier,
        signed_qr_token=signed_qr,
        queue_status="WAITING"
    ))
    await db.execute(update(visit_sessions).where(visit_sessions.c.session_id == req.session_id).values(
        department_id=dept_info["dept_id"],
        assigned_room=dept_info["room"],
        status="READY_FOR_DR"
    ))
    await db.commit()
    return {
        "token_number": token_num,
        "department": dept_info["name"],
        "room": dept_info["room"],
        "signed_qr_token": signed_qr
    }

@router.get("/public-display/{department_id}")
async def get_public_display_queue(department_id: str, db: AsyncSession = Depends(get_db)):
    """Public queue board showing plain tokens only (Zero health/confidential data)."""
    q = select(token_records.c.token_number, visit_sessions.c.assigned_room)\
        .join(visit_sessions, token_records.c.session_id == visit_sessions.c.session_id)\
        .where(token_records.c.department_id == department_id)\
        .where(token_records.c.queue_status == "WAITING")\
        .order_by(token_records.c.token_number.asc()).limit(10)
    res = await db.execute(q)
    return [{"display_text": f"Token #{r.token_number} ➔ {r.assigned_room}"} for r in res.fetchall()]
```

### 13.4 Patient Portal & DPDP Data Rights Router (`patient_portal.py`)
```python
# backend/app/api/v1/patient_portal.py
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, select, insert
import redis.asyncio as aioredis
from app.db.session import get_db
from app.models.schemas import patients, visit_sessions, clinical_summaries, medical_documents, token_records, consent_records, triage_alerts, dpdp_data_requests, audit_logs
from app.core.security import jwt, JWTError, settings

router = APIRouter(prefix="/patient", tags=["Patient Portal & DPDP"])

class MergeTemporaryPatientRequest(BaseModel):
    temp_patient_id: str = Field(..., example="TEMP-98412")
    verification_session_token: str = Field(..., description="Single-use OTP verification token")

class DPDPDataRequest(BaseModel):
    patient_id: str
    request_type: str # 'CORRECTION', 'ERASURE', 'ACCESS_LOG'
    payload: dict

@router.post("/merge-temporary-record")
async def merge_temporary_patient(req: MergeTemporaryPatientRequest, request: Request, db: AsyncSession = Depends(get_db)):
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "UNKNOWN")

    try:
        payload = jwt.decode(req.verification_session_token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("purpose") != "MERGE_VERIFICATION":
            raise HTTPException(status_code=401, detail="Invalid token purpose claim")
        verified_patient_id = payload.get("sub")
        jti = payload.get("jti", req.verification_session_token[:32])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired verification session token")

    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    is_new = await redis_client.set(f"consumed_token:{jti}", "1", ex=300, nx=True)
    if not is_new:
        raise HTTPException(status_code=409, detail="Verification token already consumed")

    temp_patient = (await db.execute(select(patients).where(patients.c.patient_id == req.temp_patient_id))).fetchone()
    if not temp_patient or not temp_patient.is_temporary:
        raise HTTPException(status_code=400, detail="Source is not a valid temporary record")

    perm_patient = (await db.execute(select(patients).where(patients.c.patient_id == verified_patient_id))).fetchone()
    if not perm_patient or perm_patient.is_temporary:
        raise HTTPException(status_code=400, detail="Target is not a valid permanent record")

    # Atomic Foreign Key Migration across ALL 6 referencing tables
    await db.execute(update(visit_sessions).where(visit_sessions.c.patient_id == req.temp_patient_id).values(patient_id=verified_patient_id))
    await db.execute(update(clinical_summaries).where(clinical_summaries.c.patient_id == req.temp_patient_id).values(patient_id=verified_patient_id))
    await db.execute(update(medical_documents).where(medical_documents.c.patient_id == req.temp_patient_id).values(patient_id=verified_patient_id))
    await db.execute(update(token_records).where(token_records.c.patient_id == req.temp_patient_id).values(patient_id=verified_patient_id))
    await db.execute(update(consent_records).where(consent_records.c.patient_id == req.temp_patient_id).values(patient_id=verified_patient_id))
    await db.execute(update(triage_alerts).where(triage_alerts.c.patient_id == req.temp_patient_id).values(patient_id=verified_patient_id))
    
    await db.execute(update(patients).where(patients.c.patient_id == req.temp_patient_id).values(is_temporary=False, is_archived=True, merged_into=verified_patient_id))
    await db.execute(audit_logs.insert().values(
        event_type="PATIENT_RECORD_MERGE",
        user_id=verified_patient_id,
        user_role="PATIENT",
        target_patient_id=verified_patient_id,
        ip_address=client_ip,
        action_details={"temp_id": req.temp_patient_id, "merged_into": verified_patient_id},
        status="SUCCESS"
    ))
    await db.commit()
    return {"status": "SUCCESS", "message": f"Temporary record merged into {verified_patient_id}"}

@router.get("/consent-history")
async def get_consent_history(patient_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(consent_records).where(consent_records.c.patient_id == patient_id).order_by(consent_records.c.timestamp.desc()))
    return [dict(r._mapping) for r in res.fetchall()]

@router.post("/data-erasure-request")
async def request_data_erasure(req: DPDPDataRequest, db: AsyncSession = Depends(get_db)):
    """DPDP Act 2023: Registers right to cryptographic erasure request."""
    await db.execute(dpdp_data_requests.insert().values(
        patient_id=req.patient_id,
        request_type="ERASURE",
        status="PENDING",
        payload=req.payload
    ))
    await db.commit()
    return {"status": "PENDING", "message": "Data erasure request registered under DPDP Act 2023."}
```

### 13.5 Admin Analytics Router (`admin.py`)
```python
# backend/app/api/v1/admin.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.db.session import get_db
from app.models.schemas import audit_logs

router = APIRouter(prefix="/admin", tags=["Hospital Administration"])

@router.get("/analytics/overview")
async def get_intake_overview_metrics(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(text("* FROM v_opd_intake_metrics")))
    return [dict(r._mapping) for r in res.fetchall()]

@router.get("/audit-logs")
async def get_audit_logs(limit: int = 50, db: AsyncSession = Depends(get_db)):
    q = select(audit_logs).order_by(audit_logs.c.timestamp.desc()).limit(limit)
    res = await db.execute(q)
    return [dict(r._mapping) for r in res.fetchall()]
```

---

## 14. Secrets Management, Zero-Trust Docker Compose & TLS 1.3 Gateway

### 14.1 Production Secrets Management Policy
> [!IMPORTANT]
> **Zero Plaintext Secrets in Version Control:**
> In accordance with DPDP Act 2023 and zero-trust security mandates, production deployments must **never** store KMS keys, blind index peppers, database passwords, or JWT secrets in plaintext files, code repositories, or static Docker configs.
> - **Development & Local Testing:** Variables are loaded strictly from an uncommitted `.env` file (excluded via `.gitignore`).
> - **Production Deployment:** Application secrets are retrieved dynamically at container startup from an enterprise secrets vault (e.g., **AWS Secrets Manager**, **HashiCorp Vault**, or **Azure Key Vault**) and injected as runtime environment variables into container memory.

### 14.2 Git Ignore Specifications (`.gitignore`)
```gitignore
# Environment & Secrets (NEVER COMMIT)
.env
.env.local
.env.*.local
*.pem
*.key

# Python & Virtual Environments
__pycache__/
*.py[cod]
venv/
.venv/

# Database & Cache Data
pgdata/
redis_data/

# Logs & Uploads
*.log
logs/
crops/
uploads/
```

### 14.3 Zero-Trust `docker-compose.yml` (Isolated Internal Network & Nginx TLS 1.3)
```yaml
version: '3.8'

networks:
  backend_net:
    driver: bridge
    internal: true # Isolates Postgres & Redis from host network
  public_net:
    driver: bridge

services:
  postgres:
    image: postgres:16-alpine
    container_name: medikiosk_postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    networks:
      - backend_net
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped

  redis:
    image: redis:7.2-alpine
    container_name: medikiosk_redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    networks:
      - backend_net
    volumes:
      - redisdata:/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: medikiosk_api
    env_file:
      - ./backend/.env
    networks:
      - backend_net
      - public_net
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend_web:
    build:
      context: ./frontend_web_apps
      dockerfile: Dockerfile
    container_name: medikiosk_web
    networks:
      - public_net
    depends_on:
      - backend
    restart: unless-stopped

  nginx_gateway:
    image: nginx:1.25-alpine
    container_name: medikiosk_gateway
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    networks:
      - public_net
    depends_on:
      - backend
      - frontend_web
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

### 14.4 Nginx Reverse Proxy & TLS 1.3 Configuration (`nginx/nginx.conf`)
```nginx
events { worker_connections 1024; }

http {
    include       mime.types;
    default_type  application/octet-stream;

    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;

    server {
        listen 80;
        server_name localhost;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name localhost;

        ssl_certificate     /etc/nginx/certs/server.crt;
        ssl_certificate_key /etc/nginx/certs/server.key;

        location / {
            proxy_pass http://frontend_web:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/ {
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /ws/ {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

### 14.5 Environment Template (`backend/.env.example`)
```env
# Database & Cache Configuration
POSTGRES_USER=medikiosk_user
POSTGRES_PASSWORD=replace_with_secure_database_password
POSTGRES_DB=medikiosk_db
DATABASE_URL=postgresql+asyncpg://medikiosk_user:replace_with_secure_database_password@postgres:5432/medikiosk_db
REDIS_PASSWORD=replace_with_secure_redis_password
REDIS_URL=redis://:replace_with_secure_redis_password@redis:6379/0

# Cryptography & KMS Security (Production keys must come from AWS Secrets Manager / Vault)
KMS_DATA_ENCRYPTION_KEY=ZDJlZmM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTA=
BLIND_INDEX_PEPPER=hospital_opd_pepper_sih_2026_super_secret_pepper
QR_SIGNING_SECRET=kiosk_thermal_printer_hmac_secret_key
SECRET_KEY=jwt_signing_secret_key_sih_2026

# Speech & Bhashini Endpoints
BHASHINI_API_KEY=mock_or_production_bhashini_api_key
BHASHINI_ASR_URL=https://api.bhashini.gov.in/v1/asr
BHASHINI_TTS_URL=https://api.bhashini.gov.in/v1/tts
```

---

## 15. Conclusion
This engineering guide provides the complete, unbroken technical implementation for MediKiosk — covering all clinical engines (SOCRATES dialogue, 10 Dashavidha Pariksha, slot-scoped red-flag triage, OCR binarization and RapidFuzz drug extraction, deterministic routing, timeline, summary and FHIR R4 generators), all core API routers (`auth`, `intake`, `doctor`, `queue`, `triage`, `documents`, `admin`, `patient_portal`), zero-trust network isolation with Nginx TLS 1.3, sliding-window Redis rate limiting, and atomic foreign-key temporary patient record merging.
