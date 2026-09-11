# Master Implementation Plan — MediKiosk Clinical Intake & Decision-Support Platform

MediKiosk is an AI-powered, multilingual, accessibility-first clinical intake and triage platform engineered for high-volume Indian hospital OPDs (Allopathic & AYUSH). This master implementation plan outlines the granular engineering steps, architectural components, database schemas, API routes, frontend modules, and testing milestones required to build and verify the complete solution.

---

## User Review & Architectural Mandates

> **1. Non-Diagnostic Decision Support Gatekeeper:** MediKiosk never diagnoses or prescribes autonomously. It functions as an ontology-constrained slot filler creating draft records (`is_draft = TRUE`). Clinical records only become official after authenticated physician verification and digital sign-off.

> **2. Equal P0 Status for Modern Medicine & AYUSH:** Home screen provides a 50/50 dual-mode selection between **Modern Medicine** and **AYUSH / Ayurveda (10 Dashavidha Pariksha + Ahara-Vihara)** to fulfill AIIA / Ministry of AYUSH institutional requirements.

> **3. Universal Accessibility & Non-Smartphone Inclusion:** Complete support for non-smartphone users via auto-printed thermal kiosk slips, alongside a dedicated zero-screen-touch conversational voice loop for visually impaired users.

---

## Phased Implementation Structure

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MEDIKIOSK MASTER ROADMAP                                       │
├────────────────────┬────────────────────┬────────────────────┬──────────────────┬────────────────┤
│      PHASE 1       │      PHASE 2       │      PHASE 3       │     PHASE 4      │    PHASE 5     │
│   Backend Core,    │    Clinical AI     │   Flutter Kiosk    │  React Portals   │  ABDM / FHIR,  │
│   Database Schema  │     Engines &      │    & Universal     │  (Doctor, Admin, │   DPDP Audit   │
│   & Auth Gateway   │   State Machines   │   Accessibility    │  Patient Portal) │  & Test Suite  │
└────────────────────┴────────────────────┴────────────────────┴──────────────────┴────────────────┘
```

---

## Phase 1: Backend Core, Database Layer & Cryptographic Auth Gateway

### Phase 1.1: Project Scaffolding & Docker Infrastructure
- **Directory Layout:** Monorepo structure (`backend/`, `frontend_patient_kiosk/`, `frontend_web_apps/`).
- **Dependencies (`backend/requirements.txt`):** FastAPI, Uvicorn, SQLAlchemy 2.0, Asyncpg, Pydantic v2, PyJWT, Cryptography, Argon2-cffi, PyTesseract, Torch, RapidFuzz, phonenumbers, Redis, HTTPX, Jinja2.
- **Docker Compose Setup (`docker-compose.yml`):** Multi-container setup with environment secret interpolations (`${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${POSTGRES_DB}`, `${KMS_DATA_ENCRYPTION_KEY}`, `${BLIND_INDEX_PEPPER}`, `${QR_SIGNING_SECRET}`).
- **Secrets Management Policy:** `.env` excluded via `.gitignore`; zero plaintext credentials in Git. Production environments fetch secrets dynamically from enterprise key vaults (AWS Secrets Manager / Vault).

#### [backend/app/core/config.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/core/config.py)
- Configuration management using `pydantic-settings` reading from `.env`.
- Database connection strings, KMS encryption keys, Bhashini API credentials, blind index peppers, and QR signing secrets.

### Phase 1.2: Relational Database Schema & Migrations

#### [backend/app/db/session.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/db/session.py)
- Asyncpg database engine, sessionmaker, and dependency provider `get_db()`.

#### [backend/app/models/schemas.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/models/schemas.py)
- **10 Core Relational Tables:**
  1. `departments`: 14 standardized Allopathic (`GEN_MED`, `CARDIOLOGY`, `ORTHOPEDICS`, `RHEUMATOLOGY`, `GASTROENTEROLOGY`, `DERMATOLOGY`, `EMERGENCY`) and AYUSH (`KAYACHIKITSA`, `PANCHAKARMA`, `SHALYA_TANTRA`, `HRIDROGA`, `TWAK_ROGA`, `AGNI_CHIKITSA`, `JWARA_CHIKITSA`) departments.
  2. `doctors`: Medical license, on-duty status, encrypted duty phone, MFA secret, SSO subject ID.
  3. `staff_users`: Role enum (`TRIAGE_NURSE`, `HOSPITAL_ADMIN`, `DEPT_ADMIN`, `SUPER_ADMIN`, `REGISTRATION_DESK`), duty phone, TOTP MFA, enterprise SSO.
  4. `patients`: Reversible `phone_encrypted` (AES-256-GCM), non-unique blind search index `phone_search_hash` (HMAC-SHA256 supporting multi-generational shared family phones), `mpin_hash`, lockout counters (`failed_mpin_attempts`, `mpin_locked_until`), `is_temporary`, and `merged_into` foreign key.
  5. `visit_sessions`: Status lifecycle (`IN_PROGRESS`, `READY_FOR_DR`, `IN_CONSULTATION`, `COMPLETED`, `EXPIRED`, `ABANDONED`).
  6. `consent_records`: Vernacular audio consent logs, purpose, timestamp, kiosk terminal ID.
  7. `dpdp_data_requests`: Right to correction, erasure, and access request logs.
  8. `clinical_summaries`: JSONB ontology models for Allopathic and AYUSH assessments, physician edits, draft flag.
  9. `medical_documents` & `extracted_entities`: Document metadata, extracted medicines, lab reference intervals, abnormal flags, bounding-box crop coordinates.
  10. `token_records`, `triage_alerts`, `audit_logs`: Signed QR tokens, two-tier triage alerts, immutable audit logs with real client IP extraction (`X-Forwarded-For`).
- **SQL Materialized / Reporting View:** `v_opd_intake_metrics` (zero-filled throughput, completion rate %, avg duration, triage counts).

### Phase 1.3: Cryptographic Security Subsystem

#### [backend/app/core/security.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/core/security.py)
- **Phone Normalization (`normalize_phone_number`):** Canonical E.164 normalization before hashing/encryption to ensure deterministic indexing.
- **Envelope Encryption Worker (`encrypt_phone` / `decrypt_phone`):** AES-256-GCM / Fernet encryption for patient phone numbers.
- **Blind Index Generator (`compute_search_hash`):** Constant-time $O(1)$ search hash generator using HMAC-SHA256 with hospital-scoped secret pepper.
- **Signed QR Tokenizer & Validator (`generate_signed_qr_token` & `verify_signed_qr_token`):** Cryptographically signed Visit Tokens with 64-bit anti-tamper signature and 24-hour expiration check.
- **Argon2id MPIN Rate Limiter (`verify_patient_mpin`):** 4–6 digit numeric MPIN verification with strict 3-attempt rate-limiting and 15-minute lockout.

### Phase 1.4: Role-Based Authentication Gateway & JWT Issuer

#### [backend/app/api/v1/auth.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/api/v1/auth.py)
- Unified login endpoint (`POST /api/v1/auth/login`) supporting all 7 credential types with TOTP MFA:
  1. `PATIENT_PASSWORD`: Patient ID / phone search hash + Argon2id password verification.
  2. `PATIENT_MPIN`: Patient ID / Mobile + 4-digit MPIN with 3-attempt brute-force lockout.
  3. `ABHA_OTP`: ABDM-integrated OTP authentication token verification.
  4. `TEMP_WALKIN`: Anonymous/Walk-in kiosk intake generating temporary `TEMP-xxxx` ID.
  5. `DOCTOR_ID`: Hospital Doctor ID + Password + RFC 6238 TOTP MFA validation (`pyotp`).
  6. `STAFF_ID`: Triage nurse / desk credential + TOTP MFA validation.
  7. `ADMIN_SSO`: Enterprise OIDC / SAML SSO token assertion + TOTP MFA validation (zero unauthenticated bypass).
- Issues signed JWT with hierarchical claims (`sub`, `role`, `staff_role`, `dept_id`, `exp`).

---

## Phase 2: Core Clinical AI Engines & Decision Support Pipeline

### Phase 2.1: Multilingual Speech Pipeline & Audio Streamer

#### [backend/app/engines/speech_pipeline.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/engines/speech_pipeline.py)
- **Bhashini / AI4Bharat REST Client:** Integrated models for Hindi (`bhashini_asr_hi`), English (`bhashini_asr_en`), and Punjabi (`bhashini_asr_pa`).
- **Network Drop Graceful Degradation:** Automatic catch on HTTP/network errors returning a `"fallback_mode": "TOUCH_SELECTION"` signal.
- **Voice Activity Detection (VAD) & Noise Filtering:** WebRTC-VAD integration filtering background hospital ambient noise (80–90 dB thresholding).
- **TTS Synthesizer:** Real-time audio stream generator for kiosk voice prompts and audio-guided accessibility.

### Phase 2.2: Dual-Ontology Clinical Dialogue Engine & State Machine

#### [backend/app/engines/dialogue_engine.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/engines/dialogue_engine.py)
- **Modern Medicine Intake State Machine (Full 7-Step Traversal):**
  - `CHIEF_COMPLAINT` $\rightarrow$ `HPI_SOCRATES` (Site, Onset, Character, Radiation, Associations, Timing, Exacerbating/Relieving, Severity 0–10) $\rightarrow$ `PAST_HISTORY` (Diabetes, Hypertension) $\rightarrow$ `DRUG_ALLERGY` (Daily meds & ADRs) $\rightarrow$ `PERSONAL_FAMILY` (Family heart/diabetes, tobacco/smoking) $\rightarrow$ `REVIEW_OF_SYSTEMS` (Cardiorespiratory, GI, CNS) $\rightarrow$ `COMPLETE`.
- **AYUSH Dashavidha Pariksha State Machine (Full 11-Step Traversal):**
  - Full 10-fold clinical assessment: *Prakriti*, *Vikriti*, *Sara*, *Samhanana*, *Pramana*, *Satmya*, *Sattva*, *Ahara Shakti*, *Vyayama Shakti*, *Vaya*.
  - *Ahara-Vihara & Nidana:* Agni status (*Tikshnagni, Mandagni, Vishamagni, Samagni*), Koshta, Dinacharya, and dietary habits.
- **Multi-Accent Semantic Classifier:** Extracts structured clinical entities regardless of phonetic dialect variations, triggering confidence-gated spoken disambiguation when confidence $<0.75$.

### Phase 2.3: Slot-Scoped Red-Flag Triage Engine & Duty Dispatcher

#### [backend/app/engines/red_flag_engine.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/engines/red_flag_engine.py)
- **Slot-Scoped Triage Rules:** Multi-condition evaluation (`matches`, `contains_any`, `gte`) across the intake slot hierarchy.
- **Tier-1 Critical Emergency Evaluator:**
  - Rules: ACS (Chest Pain + Diaphoresis / Left Arm Radiation / Dyspnea), Acute Stroke (Facial Droop / Slurred Speech / Hemiparesis).
  - Actions: Fires WebSocket buzzer to on-duty triage nurses, marks priority token silently, executes strictly scoped SQL roster lookup (`DOCTOR` and `TRIAGE_NURSE` of that department), and dispatches generic data-minimized SMS alert.
- **Tier-2 Amber Priority Evaluator:**
  - Rules: Severe Acute Pain ($\ge 8/10$), High-Grade Febrile illness with rigors.
  - Actions: Silently sequences patient ahead in queue worklist without sounding audible alarms.
- **Privacy Enforcement:** Public waiting room screens show plain token numbers only (`Token #12 ➔ Room 101`); diagnostic justifications remain strictly confidential on staff screens.

### Phase 2.4: Document AI, OCR & Bounding Crop Generator

#### [backend/app/engines/ocr_extractor.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/engines/ocr_extractor.py)
- **Image Preprocessing:** Grayscale conversion, adaptive Otsu binarization, deskewing, and noise removal.
- **OCR Engine:** PyTesseract / TrOCR layout analyzer producing bounding boxes and normalized text tokens.
- **RapidFuzz Drug Dictionary Validator:** Fast Levenshtein distance matching against the Indian Pharmacopoeia, CDSCO, and NLEM drug database (confidence threshold: $\ge 85\%$ clean, $<85\%$ amber flag).
- **Biological Reference Range Extractor:** Directly extracts printed normal ranges from lab reports (e.g., `Hb: 9.2 g/dL | Ref: 12.0 - 15.5 g/dL` $\rightarrow$ `Status: LOW`), falling back to adult population baseline norms if omitted.
- **Crop Slice Generator:** Crops high-resolution bounding-box image slices for side-by-side doctor verification.

### Phase 2.5: Longitudinal Timeline & Summary Generator

#### [backend/app/engines/timeline_engine.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/engines/timeline_engine.py)
- Aggregates past hospital encounters, scanned lab panels, extracted prescriptions, and today's intake.
- Normalizes dates into ISO-8601, groups co-temporal events, and outputs reverse-chronological timeline.

#### [backend/app/engines/summary_generator.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/engines/summary_generator.py)
- Compiles bilingual output: Spoken vernacular audio review for patient confirmation + structured English/Hindi summary for the physician (`is_draft = TRUE`).

### Phase 2.6: Deterministic Department Router & Queue Engine

#### [backend/app/engines/routing_engine.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/engines/routing_engine.py)
- Deterministic clinical routing table mapping confirmed chief complaints to 14 Allopathic and AYUSH departments with 1-tap patient confirmation and triage nurse override.

### Phase 2.7: ABDM HL7 FHIR R4 Bundle Serializer

#### [backend/app/engines/fhir_adapter.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/app/engines/fhir_adapter.py)
- Serializes clinical intake records into standard HL7 FHIR R4 JSON bundles (`Patient`, `Condition`, `Observation`, `MedicationStatement`, `DocumentReference`).

---

## Phase 3: Flutter Patient Kiosk & Universal Accessibility

### Phase 3.1: Kiosk Core Shell & Riverpod State Architecture

#### [frontend_patient_kiosk/lib/main.dart](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/frontend_patient_kiosk/lib/main.dart)
- App initialization, Riverpod providers, router configuration, and fullscreen kiosk mode lock.

#### [frontend_patient_kiosk/lib/core/accessibility/audio_controller.dart](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/frontend_patient_kiosk/lib/core/accessibility/audio_controller.dart)
- Audio playback queue, microphone streaming, VAD state controller, and TTS cache with touch fallback trigger.

### Phase 3.2: Universal Accessibility & Voice Navigation Engine
- **Audio-Guided Mode for Visually Impaired Users:**
  - Completely voice-navigated conversational turn-taking loop (zero physical screen touches required).
  - Spoken numbered menu selections and audio prompts.
  - 100% Android TalkBack and WCAG 2.1 AA screen-reader compliance.

### Phase 3.3: Patient Interactive UI & High-Contrast Touch Views
- **Touch Navigation Components:**
  - Extra-large 48px+ touch chips with iconographic visual prompts (🫀 Chest, 🤕 Pain, 🤒 Fever, 🤢 Stomach).
  - Interactive visual body map selector for localized pain and radiation.
  - 0–10 numeric visual pain severity scale with color gradients.
  - High-contrast toggle for elderly patients, slow-speech audio toggle, and `[ 🔊 REPEAT ]` button.

### Phase 3.4: Accessible Inactivity Lifecycle & Ephemeral Memory
- **Inactivity Timer Controller:**
  - Configurable 3–5 minute timeout window.
  - Spoken audio check-in at 2.5 minutes: *"Are you still there? Tap or speak to continue."*
  - Prominent `[ ⏸ I need more time ]` pause button.
  - Memory Flush Worker: Immediately wipes RAM buffer and Redis session cache upon session completion or timeout, storing zero patient data on physical kiosk hardware.

### Phase 3.5: Document Scanning & Preview Module
- High-speed camera preview with auto-edge detection, perspective correction, multi-page document aggregation, and upload pipeline.

### Phase 3.6: Parchi Ticket View & Thermal Printer Driver
- **Thermal Slip ESC/POS Formatter:** Generates printable binary commands for 80mm/58mm kiosk thermal printers (Token Number, Department, Room, Patient ID, and HMAC-signed QR code).

---

## Phase 4: React Doctor, Admin, Queue & Patient Web Portals

### Phase 4.1: Web App Monorepo Architecture
- Next.js / Vite + React 18 + Tailwind CSS with React Router, TanStack Query, and Lucide React icons.

### Phase 4.2: Doctor Interface (Physician Dashboard)

#### [frontend_web_apps/src/doctor/DoctorDashboard.jsx](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/frontend_web_apps/src/doctor/DoctorDashboard.jsx)
- **OPD Queue Worklist (`GET /api/v1/doctor/opd-queue`):** Live-updating patient queue prioritized by Tier-1 Red $\rightarrow$ Tier-2 Amber $\rightarrow$ Standard, displaying intake completion status (`✅ Ready for Doctor`).
- **Universal Hotkey Search Bar (`Ctrl+K` - `GET /api/v1/doctor/patient-lookup/{patient_id}`):** Instant Patient ID search querying patient demographics, active session, draft summary, abnormal investigations, and reverse-chronological timeline.

#### [frontend_web_apps/src/doctor/components/SideBySideCropViewer.jsx](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/frontend_web_apps/src/doctor/components/SideBySideCropViewer.jsx)
- Split-screen verification viewer displaying extracted prescription text and confidence scores on the left, and high-res source document crops on the right for instant 1-second visual verification.

#### [frontend_web_apps/src/doctor/components/ClinicalSummaryEditor.jsx](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/frontend_web_apps/src/doctor/components/ClinicalSummaryEditor.jsx)
- Editable structured form covering Chief Complaint, HPI, PMH, Medications, Allergies, AYUSH Dashavidha Pariksha, and Abnormal Labs.
- Inline edit chips, rejection buttons, additional notes input, and digital signature sign-off action (`PUT /api/v1/doctor/summary/{summary_id}/sign`).

### Phase 4.3: Smart Token, Queue Routing & Public Display Portal

#### [frontend_web_apps/src/queue/PublicQueueDisplay.jsx](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/frontend_web_apps/src/queue/PublicQueueDisplay.jsx)
- Public waiting-room queue display (`GET /api/v1/queue/public-display/{department_id}`) showing plain token callouts (`Token #47 ➔ Room 104`) with zero confidential health text.
- Digital OPD Parchi viewer (`GET /api/v1/queue/parchi/{patient_id}`).

### Phase 4.4: MyMediKiosk Patient Web/PWA Portal

#### [frontend_web_apps/src/patient_portal/PatientPortal.jsx](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/frontend_web_apps/src/patient_portal/PatientPortal.jsx)
- Pre-OPD document upload from home (`POST /api/v1/documents/upload-and-parse`).
- Verified visit history and Digital OPD Parchi viewer.
- **DPDP Act 2023 Controls:** Consent History viewer (`GET /api/v1/patient/consent-history`), Data Correction request form, and Cryptographic Data Erasure request trigger (`POST /api/v1/patient/data-erasure-request`).
- **Dual-Path Temporary Record Merge (Request Body Model):** Step-by-step merge wizard sending `MergeTemporaryPatientRequest` body with JWT `purpose: MERGE_VERIFICATION`, single-use Redis `SETNX` anti-replay validation, source `is_temporary == TRUE` state check, target permanent record verification, migration across all 6 FK tables, and client IP audit logging.

### Phase 4.5: Administrator Dashboard

#### [frontend_web_apps/src/admin/AdminDashboard.jsx](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/frontend_web_apps/src/admin/AdminDashboard.jsx)
- Real-time OPD throughput KPIs and department analytics overview (`GET /api/v1/admin/analytics/overview`), department queue depth, completion vs. abandonment rate metrics (`v_opd_intake_metrics`).
- Queryable, tamper-evident audit log explorer (`GET /api/v1/admin/audit-logs`) with actor, client IP, kiosk ID, and timestamp filtering.

### Phase 4.6: Triage Staff Real-Time Monitor

#### [frontend_web_apps/src/triage/TriageMonitor.jsx](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/frontend_web_apps/src/triage/TriageMonitor.jsx)
- Real-time WebSocket listener (`/ws/triage-alerts`) with desktop audio buzzer and flashing modal for Tier-1 emergency alerts.
- Alert acknowledgment (`PUT /api/v1/triage/alert/{alert_id}/acknowledge`) and department override modal allowing triage staff to re-route patients with logged justifications.

---

## Phase 5: Interoperability, DPDP Compliance & Automated Verification

### Phase 5.1: ABDM & FHIR R4 Serialization Layer
- Serializes clinical intake records into standard HL7 FHIR R4 JSON bundles via `FHIRAdapterEngine`.

### Phase 5.2: DPDP Ephemeral Memory & Automated Data Shredding
- Scheduled Celery / Redis background worker running every 5 minutes to expire abandoned sessions (`status = 'ABANDONED'`), detach draft fragments, and wipe temporary memory buffers and Redis session caches.

### Phase 5.3: Automated Test Suite (`pytest`)

#### [backend/tests/test_auth_and_crypto.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/tests/test_auth_and_crypto.py)
- Unit tests for all 7 authentication types (Password, MPIN, ABHA OTP, Walk-in, Doctor, Staff, Admin SSO) including TOTP MFA enforcement.
- Verification of canonical E.164 phone normalization, AES-256 KMS envelope encryption, and blind HMAC search index lookups.
- Argon2id MPIN brute-force lockout tests (3 failed attempts $\rightarrow$ 15 min lock).
- QR code HMAC signature generation and `verify_signed_qr_token` validation tests (verifies 64-bit anti-tamper signature and 24-hour expiration window).
- Redis sliding-window rate limiting tests.

#### [backend/tests/test_clinical_engines.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/tests/test_clinical_engines.py)
- Full 7-step SOCRATES state machine and 11-step AYUSH Dashavidha Pariksha traversal test cases.
- Slot-scoped red-flag rule evaluation tests (ACS, Stroke, Severe Pain) and scoped SMS dispatch tests.
- OCR RapidFuzz NLEM drug dictionary matching and biological reference range calculation tests.
- Speech network failure fallback to touch-mode tests (`fallback_mode: TOUCH_SELECTION`).
- FHIR R4 JSON bundle validation tests.

#### [backend/tests/test_merge_and_dpdp.py](file:///c:/Users/aashv/OneDrive/Desktop/PROJECTS/SIH2026/backend/tests/test_merge_and_dpdp.py)
- Atomic merge transaction verification migrating all 6 referencing tables (`visit_sessions`, `clinical_summaries`, `medical_documents`, `token_records`, `consent_records`, `triage_alerts`).
- Single-use verification token Redis anti-replay rejection tests (`SETNX` duplicate token call fails with 409).
- Token purpose claim validation tests (rejects tokens without `purpose: MERGE_VERIFICATION`).
- Pre-condition validation tests (rejects merge if source is not temporary or target does not exist).
- DPDP consent history retrieval and cryptographic data erasure request logging verification.

### Phase 5.4: End-to-End Clinical Scenario Simulation
- **Scenario 1 (ACS Emergency Hindi Flow):** 54M presenting with chest pain and diaphoresis $\rightarrow$ Tier-1 Red Alert $\rightarrow$ Silent priority token $\rightarrow$ Triage buzzer & operational SMS strictly to on-duty cardiology doctor/nurse $\rightarrow$ Doctor reviews highlighted ACS alert, abnormal labs, and prescription crop in $<30$s via `GET /patient-lookup/{patient_id}`.
- **Scenario 2 (AYUSH Panchakarma Punjabi Flow):** 48F with chronic Sandhivata in Punjabi $\rightarrow$ Complete 11-step AYUSH Dashavidha Pariksha captures *Pitta-Vata* & *Tikshnagni* $\rightarrow$ Deterministic routing to Panchakarma $\rightarrow$ Printed thermal slip.
- **Scenario 3 (Visually Impaired Zero-Touch Flow):** 100% voice-guided conversational interview without touching screen.
- **Scenario 4 (DPDP Walk-in Merge Flow):** Anonymous walk-in session merged into permanent ABHA record via OTP verification, migrating all consent and triage records without data loss.
