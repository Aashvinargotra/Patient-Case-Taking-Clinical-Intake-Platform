from datetime import datetime, timezone
from sqlalchemy import (
    MetaData,
    Table,
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    Text,
    Numeric,
    ForeignKey,
    Index,
    JSON,
)
from sqlalchemy.dialects.postgresql import JSONB

# Dialect-agnostic JSON type supporting both Postgres JSONB and SQLite JSON
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")

metadata = MetaData()

# 1. Departments Table
departments = Table(
    "departments",
    metadata,
    Column("department_id", String(32), primary_key=True),
    Column("name", String(128), nullable=False),
    Column("clinical_discipline", String(32), nullable=False), # 'ALLOPATHY' | 'AYUSH'
    Column("is_active", Boolean, nullable=False, default=True),
    Column("floor_room", String(64), nullable=True),
)

# 2. Doctors Table
doctors = Table(
    "doctors",
    metadata,
    Column("doctor_id", String(32), primary_key=True),
    Column("full_name", String(128), nullable=False),
    Column("medical_registration_number", String(64), nullable=False, unique=True),
    Column("department_id", String(32), ForeignKey("departments.department_id"), nullable=False),
    Column("is_on_duty", Boolean, nullable=False, default=False),
    Column("duty_phone_encrypted", String(512), nullable=True),
    Column("password_hash", String(255), nullable=True),
    Column("mfa_secret", String(64), nullable=True),
    Column("sso_subject_id", String(128), nullable=True),
    Column("is_active", Boolean, nullable=False, default=True),
)

# 3. Staff Users Table
staff_users = Table(
    "staff_users",
    metadata,
    Column("staff_id", String(32), primary_key=True),
    Column("full_name", String(128), nullable=False),
    Column("role", String(32), nullable=False), # 'TRIAGE_NURSE', 'HOSPITAL_ADMIN', 'DEPT_ADMIN', 'SUPER_ADMIN', 'REGISTRATION_DESK'
    Column("department_id", String(32), ForeignKey("departments.department_id"), nullable=True),
    Column("duty_phone_encrypted", String(512), nullable=True),
    Column("password_hash", String(255), nullable=True),
    Column("mfa_secret", String(64), nullable=True),
    Column("sso_subject_id", String(128), nullable=True),
    Column("is_active", Boolean, nullable=False, default=True),
)

# 4. Patients Table
patients = Table(
    "patients",
    metadata,
    Column("patient_id", String(32), primary_key=True),
    Column("full_name", String(128), nullable=False),
    Column("gender", String(16), nullable=False),
    Column("birth_year", Integer, nullable=True),
    Column("is_temporary", Boolean, nullable=False, default=False),
    Column("merged_into", String(32), ForeignKey("patients.patient_id"), nullable=True),
    Column("is_archived", Boolean, nullable=False, default=False),
    Column("phone_search_hash", String(64), nullable=True), # Non-unique blind index
    Column("phone_encrypted", String(512), nullable=True), # Reversible Fernet envelope
    Column("password_hash", String(255), nullable=True),
    Column("mpin_hash", String(255), nullable=True),
    Column("failed_mpin_attempts", Integer, nullable=False, default=0),
    Column("mpin_locked_until", DateTime(timezone=True), nullable=True),
    Column("abha_address", String(64), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
    Column("updated_at", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
    Index("idx_patients_phone_search_hash", "phone_search_hash"),
    Index("idx_patients_abha_address", "abha_address"),
)

# 5. Visit Sessions Table
visit_sessions = Table(
    "visit_sessions",
    metadata,
    Column("session_id", String(36), primary_key=True),
    Column("patient_id", String(32), ForeignKey("patients.patient_id"), nullable=False),
    Column("department_id", String(32), ForeignKey("departments.department_id"), nullable=True),
    Column("assigned_room", String(64), nullable=True),
    Column("intake_language", String(8), nullable=False, default="hi"),
    Column("status", String(32), nullable=False, default="IN_PROGRESS"), # IN_PROGRESS, READY_FOR_DR, IN_CONSULTATION, COMPLETED, ABANDONED
    Column("intake_channel", String(32), nullable=False, default="KIOSK"), # KIOSK, WEB_PORTAL, ASHA_TABLET
    Column("start_time", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
    Column("completion_time", DateTime(timezone=True), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
    Index("idx_visit_sessions_status", "status"),
    Index("idx_visit_sessions_patient", "patient_id"),
)

# 6. Consent Records Table
consent_records = Table(
    "consent_records",
    metadata,
    Column("consent_id", String(36), primary_key=True),
    Column("patient_id", String(32), ForeignKey("patients.patient_id"), nullable=False),
    Column("session_id", String(36), ForeignKey("visit_sessions.session_id"), nullable=False),
    Column("consent_type", String(32), nullable=False), # CLINICAL_INTAKE, OCR_EXTRACTION, ABDM_SHARE
    Column("vernacular_language", String(8), nullable=False, default="hi"),
    Column("timestamp", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
    Column("kiosk_terminal_id", String(64), nullable=False),
    Column("is_revoked", Boolean, nullable=False, default=False),
    Column("revoked_at", DateTime(timezone=True), nullable=True),
)

# 7. DPDP Data Requests Table
dpdp_data_requests = Table(
    "dpdp_data_requests",
    metadata,
    Column("request_id", String(36), primary_key=True),
    Column("patient_id", String(32), ForeignKey("patients.patient_id"), nullable=False),
    Column("request_type", String(32), nullable=False), # CORRECTION, ERASURE, ACCESS_LOG
    Column("status", String(32), nullable=False, default="PENDING"), # PENDING, APPROVED, COMPLETED, REJECTED
    Column("requested_at", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
    Column("completed_at", DateTime(timezone=True), nullable=True),
    Column("payload", JSON_TYPE, nullable=True),
)

# 8. Clinical Summaries Table
clinical_summaries = Table(
    "clinical_summaries",
    metadata,
    Column("summary_id", String(36), primary_key=True),
    Column("session_id", String(36), ForeignKey("visit_sessions.session_id"), nullable=False),
    Column("patient_id", String(32), ForeignKey("patients.patient_id"), nullable=False),
    Column("chief_complaint", Text, nullable=False),
    Column("structured_history", JSON_TYPE, nullable=False), # SOCRATES or AYUSH Pariksha
    Column("extracted_investigations", JSON_TYPE, nullable=True),
    Column("draft_summary_text", Text, nullable=False),
    Column("doctor_notes", Text, nullable=True),
    Column("is_draft", Boolean, nullable=False, default=True),
    Column("verified_by_doctor_id", String(32), ForeignKey("doctors.doctor_id"), nullable=True),
    Column("verified_at", DateTime(timezone=True), nullable=True),
    Column("generated_at", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
    Index("idx_summaries_patient", "patient_id"),
    Index("idx_summaries_session", "session_id"),
)

# 9. Medical Documents Table
medical_documents = Table(
    "medical_documents",
    metadata,
    Column("doc_id", String(36), primary_key=True),
    Column("patient_id", String(32), ForeignKey("patients.patient_id"), nullable=False),
    Column("session_id", String(36), ForeignKey("visit_sessions.session_id"), nullable=False),
    Column("original_filename", String(255), nullable=False),
    Column("file_path", String(512), nullable=False),
    Column("doc_type", String(32), nullable=False), # PRESCRIPTION, LAB_REPORT, DISCHARGE_SUMMARY
    Column("mime_type", String(64), nullable=False, default="image/jpeg"),
    Column("processing_status", String(32), nullable=False, default="PENDING"), # PENDING, PROCESSED, FAILED
    Column("uploaded_at", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
)

# 10. Extracted Entities Table
extracted_entities = Table(
    "extracted_entities",
    metadata,
    Column("entity_id", String(36), primary_key=True),
    Column("doc_id", String(36), ForeignKey("medical_documents.doc_id"), nullable=False),
    Column("entity_type", String(32), nullable=False), # MEDICATION, LAB_VALUE, DIAGNOSIS
    Column("raw_text", Text, nullable=False),
    Column("standardized_code", String(64), nullable=True),
    Column("standardized_name", String(255), nullable=True),
    Column("value", String(64), nullable=True),
    Column("unit", String(32), nullable=True),
    Column("reference_range_low", Numeric(10, 2), nullable=True),
    Column("reference_range_high", Numeric(10, 2), nullable=True),
    Column("is_abnormal", Boolean, nullable=False, default=False),
    Column("confidence_score", Numeric(4, 3), nullable=False, default=1.0),
    Column("bbox_coordinates", JSON_TYPE, nullable=True),
)

# 11. Token Records Table
token_records = Table(
    "token_records",
    metadata,
    Column("token_id", String(36), primary_key=True),
    Column("session_id", String(36), ForeignKey("visit_sessions.session_id"), nullable=False),
    Column("patient_id", String(32), ForeignKey("patients.patient_id"), nullable=False),
    Column("token_number", Integer, nullable=False),
    Column("department_id", String(32), ForeignKey("departments.department_id"), nullable=False),
    Column("priority_tier", String(16), nullable=False, default="NORMAL"), # NORMAL, AMBER, RED
    Column("signed_qr_token", Text, nullable=False),
    Column("queue_status", String(32), nullable=False, default="WAITING"), # WAITING, CALLED, IN_ROOM, COMPLETED, NO_SHOW
    Column("issued_at", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
    Column("called_at", DateTime(timezone=True), nullable=True),
    Column("completed_at", DateTime(timezone=True), nullable=True),
    Index("idx_token_records_queue", "department_id", "queue_status"),
)

# 12. Triage Alerts Table
triage_alerts = Table(
    "triage_alerts",
    metadata,
    Column("alert_id", String(36), primary_key=True),
    Column("session_id", String(36), ForeignKey("visit_sessions.session_id"), nullable=False),
    Column("patient_id", String(32), ForeignKey("patients.patient_id"), nullable=False),
    Column("severity_tier", String(16), nullable=False), # RED, AMBER
    Column("trigger_rule", String(128), nullable=False),
    Column("trigger_slots", JSON_TYPE, nullable=False),
    Column("status", String(32), nullable=False, default="ACTIVE"), # ACTIVE, ACKNOWLEDGED, RESOLVED
    Column("resolved_by_staff_id", String(32), ForeignKey("staff_users.staff_id"), nullable=True),
    Column("resolved_at", DateTime(timezone=True), nullable=True),
    Column("created_at", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
)

# 13. Immutable Audit Logs Table
audit_logs = Table(
    "audit_logs",
    metadata,
    Column("log_id", String(36), primary_key=True),
    Column("event_type", String(64), nullable=False),
    Column("user_id", String(64), nullable=False),
    Column("user_role", String(32), nullable=False),
    Column("target_patient_id", String(32), nullable=True),
    Column("ip_address", String(64), nullable=True),
    Column("action_details", JSON_TYPE, nullable=True),
    Column("status", String(32), nullable=False, default="SUCCESS"),
    Column("timestamp", DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)),
    Index("idx_audit_logs_event", "event_type", "timestamp"),
)
