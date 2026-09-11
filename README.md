# MediKiosk (SIH26047) — Multilingual OPD Case-Taking & Clinical Intake Platform

> **AI-Powered Pre-Consultation Intake, Dynamic Slot-Filler & Decision-Support System**  
> *Developed for All India Institute of Ayurveda (AIIA) & Allopathic OPDs — Smart India Hackathon 2026.*

---

## 🌟 Key Architectural Pillars

- **Decision-Support Guardrail:** AI is strictly a pre-consultation structured slot-filler and drafting engine. Summaries remain `is_draft = TRUE` until authenticated physician verification and sign-off.
- **Modern Medicine & AYUSH Parity (50/50):** Full support for Allopathic **SOCRATES** symptom exploration and Ayurvedic **Dashavidha Pariksha** (*Prakriti, Vikriti, Sara, Samhanana, Pramana, Satmya, Sattva, Ahara Shakti, Vyayama Shakti, Vaya, Ahara-Vihara/Agni*).
- **Two-Tier Red-Flag Triage:** Real-time detection of Tier 1 RED critical emergencies (ACS, Stroke FAST, Severe Dyspnea, Anaphylaxis) with WebSocket audio buzzers and department-scoped emergency SMS dispatch.
- **Multilingual Speech & Touch Pipeline:** 8 Indian regional languages (`hi`, `pa`, `en`, `bn`, `ta`, `te`, `mr`, `gu`) with energy-based Voice Activity Detection (VAD) and touch fallback.
- **Document AI & OCR:** Prescription digitization with NLEM drug fuzzy matching and lab biological reference range evaluation.
- **HL7 FHIR R4 & Open Standards:** Instant serialization of intake bundles ready for ABDM (HIP/HIU) and Public HAPI FHIR R4 server exchange.
- **Military-Grade Cryptography:** AES-256 Fernet envelope encryption for patient PII, HMAC-SHA256 blind indexing for query search without decryption, and 64-bit HMAC-signed anti-tamper QR tokens.

---

## 🏗️ Repository Structure

```
SIH2026/
├── backend/                  # FastAPI Core Backend & AI Engines
│   ├── app/
│   │   ├── api/              # Auth, OPD, Tokens, WebSockets, Admin Endpoints
│   │   ├── core/             # Config, Security, Crypto & Envelope Encryption
│   │   ├── engines/          # Dialogue, Speech, Triage, OCR, Timeline, FHIR Engines
│   │   └── models/           # PostgreSQL Schemas (10 Tables) & Data Seeders
│   └── tests/                # 60 Automated Unit & Integration Tests (100% Passing)
├── frontend_patient_kiosk/   # Touch-First Multilingual Kiosk App
├── frontend_web_apps/        # Physician Review Console & Admin Triage Analytics
└── docker-compose.yml        # PostgreSQL, Redis & App Container Stack
```

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Test Suite
```bash
pytest -v
```

### 3. Start Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
