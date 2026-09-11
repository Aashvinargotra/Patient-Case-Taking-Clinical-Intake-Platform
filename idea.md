# MediKiosk — AI-Powered Patient Case-Taking & Clinical Intake Platform

## 1. Solution Overview

MediKiosk is an AI-powered, multilingual clinical intake platform designed for high-volume Indian hospital OPDs (Allopathic & AYUSH).

Instead of making the doctor collect the entire patient history manually within a 2–5 minute consultation, MediKiosk collects the patient's history before the consultation through an accessible kiosk, tablet, or web interface.

### The patient can:
- Authenticate using a **Personal Patient ID & Password / MPIN**, **ABHA ID**, or temporary registration
- Speak naturally in their preferred language (Hindi, English, Punjabi, and regional languages)
- Answer questions through high-contrast touchscreen buttons or a dedicated **audio-guided mode for visually impaired users**
- Scan/upload old prescriptions, lab reports, and discharge summaries
- Give informed consent through an audio-guided vernacular process
- Review and confirm the collected information via spoken audio and visual summaries
- Receive a **printed token slip** directly from the kiosk (with an optional **Digital OPD Parchi** accessible via SMS/portal for smartphone users)

### The system then:
- Automatically routes users based on role: **Patient Interface** vs. **Doctor Interface**
- Conducts an adaptive clinical interview (Modern Medicine & AYUSH / Dashavidha Pariksha)
- Converts speech into text using noise-aware, multi-accent semantic parsing
- Structures patient responses into a standardized clinical ontology
- Runs a **two-tier red-flag detection engine** (Critical Red Alerts vs. Amber Priority routing)
- Routes the patient to the correct department via a transparent, rule-based clinical lookup
- OCRs previous medical documents with confidence scoring and side-by-side verification crops
- Extracts medications, diagnoses, and lab values, highlighting abnormal investigation ranges
- Builds a chronological medical timeline across past visits
- Generates a physician-ready bilingual summary (vernacular audio for patient, structured English/Hindi for clinician)
- Issues an OPD token (with privacy-preserving public display) and generates a persistent **Digital OPD Parchi**
- Delivers the full intake record to the physician dashboard the instant the doctor looks up the **Patient ID** or selects the patient from the queue
- Prepares structured FHIR R4 resources for ABDM and hospital HIS integration

> **Core Principle:** The physician remains the final clinical authority. MediKiosk does not autonomously diagnose or prescribe. An in-person consultation takes place for every patient — MediKiosk streamlines the intake process so the doctor can dedicate consultation time to physical examination, clinical reasoning, and counseling.

---

## 2. Problems Being Solved

| Problem in the Statement | MediKiosk Solution |
| :--- | :--- |
| Doctors have very little consultation time (2–5 mins) | Clinical history is collected and structured before consultation |
| History is often rushed or incomplete | AI follows a standardized clinical history ontology (CC $\rightarrow$ HPI $\rightarrow$ PMH $\rightarrow$ Meds $\rightarrow$ ROS) |
| Patients uncomfortable with typing or illiterate | Multilingual voice-first interaction + audio prompts + large iconographic buttons |
| Visually impaired patients cannot navigate touch screens | Dedicated audio-guided conversational mode (zero screen-touch reliance) |
| Elderly patients struggle with complex smartphones | Simple high-contrast kiosk/tablet interface with slow audio, repeat controls, and printed slips |
| Non-smartphone rural patients excluded by app-only systems | Dual output: auto-printed physical thermal slip at kiosk + optional digital Parchi on phone |
| Premature kiosk timeouts frustrate elderly users | Accessible 3–5 min inactivity window with spoken "still there?" check-in and pause button |
| Indian patients speak diverse languages and accents | Multilingual ASR with semantic intent parsing over verbatim phonemes (Hindi, English, Punjabi) |
| Hospital OPDs are loud (80–90 dB) | Directional noise-aware processing + explicit audio-visual confirmation loop |
| Patients carry loose paper reports | High-speed document scanner/uploader integrated into kiosk workflow |
| Handwritten Indian prescriptions are illegible | OCR with drug dictionary validation (NLEM/CDSCO) + confidence scoring + side-by-side crops |
| Previous records are disorganized | Automatic chronological medical timeline across all historical visits |
| Critical abnormal lab values are missed | Automated reference-range comparison and high/low abnormal highlighting |
| Medication information is scattered | Extraction into a structured, active medication schedule |
| AYUSH history is extensive and domain-specific | Dedicated P0 AYUSH workflow with full Dashavidha Pariksha and Ahara-Vihara parameters |
| Emergency symptoms get lost in routine queues | Two-tier red-flag triage engine with instant alert and privacy-preserving priority queue routing |
| Public triage alerts violate patient privacy | Public boards show only plain token numbers; medical alerts visible strictly on staff screens |
| Dropped paper slips risk data exposure | Barcode/QR contains only an opaque signed token, decryptable solely inside authenticated staff portals |
| Doctors and patients share confusing interfaces | Single platform with automatic role-based routing (Patient Interface vs. Doctor Interface) |
| Doctors waste time searching paper files | Instant Patient ID search bar pulling up current symptoms, full summary, timeline, and reports |
| Patients lose or damage physical OPD paper slips | Persistent Digital OPD Parchi accessible via Patient ID and SMS/portal without requiring app download |
| Patient health data is sensitive | Consent-first architecture, ephemeral kiosk memory clearing, and DPDP Act 2023 compliance |
| Digital health infrastructure has a first-mile gap | MediKiosk acts as the structured intake layer feeding hospital HIS and ABDM/FHIR |

---

## 3. Target Users

### 1. Patients
- Government hospital and AYUSH OPD attendees
- Elderly, rural, and non-smartphone users (supported via physical printed token slips)
- Low-literacy and first-time hospital visitors
- Visually impaired individuals requiring audio-guided navigation

### 2. Doctors (Allopathic & Ayurvedic)
- Receives structured chief complaints, HPI, past history, active medications, allergies, family/personal history, review of systems, abnormal labs, and chronological timeline instantly upon selecting a Patient ID.

### 3. Triage & Nursing Staff
- Receives real-time notifications for Tier-1 emergency red-flag cases and manages priority queue routing.

### 4. Hospital Administrators
- Monitors OPD intake throughput, department queue distribution, completion rates, and triage readiness.

---

## 4. Role-Based Architecture: One App, Two Specialized Interfaces

MediKiosk operates as a unified platform with a single entry point, dynamically resolving permissions and views based on authentication credentials.

```
                 ┌──────────────────────────────────────┐
                 │       MediKiosk Authentication       │
                 └──────────────────┬───────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
      Patient Logs In                             Doctor Logs In
  (Patient ID + Password /                     (Hospital Doctor ID +
   ABHA OTP / Temp ID)                                Password/OTP)
              │                                           │
              ▼                                           ▼
   ┌──────────────────────┐                    ┌──────────────────────┐
   │  PATIENT INTERFACE   │                    │   DOCTOR INTERFACE   │
   │ (Kiosk/Tablet/Mobile)│                    │   (Web Dashboard)    │
   └──────────────────────┘                    └──────────────────────┘
```

### 4.1 Patient Interface
Opens automatically for patients. Contains only patient-facing intake and review components:
- Language selection (Hindi, English, Punjabi, regional) & Accessibility mode (Standard / High-Contrast / Visually Impaired Audio-Guided)
- Vernacular audio-guided consent screen
- Conversational voice + touch history intake (Modern Medicine or AYUSH)
- Document scan and upload
- Spoken audio confirmation of collected facts
- Live queue position, printed kiosk slip, and optional Digital OPD Parchi

### 4.2 Doctor Interface (Physician Dashboard)
Opens automatically when a clinician authenticates with their Hospital Doctor ID:
- **OPD Queue / Worklist:** Displays incoming patients, queue numbers, priority flags, and intake readiness.
- **Universal Patient ID Search Bar:** Allows instant retrieval of any patient's complete file.
- **Recent Intake Symptoms:** Displays today's chief complaint, HPI, and red-flag status prominently.
- **Structured Clinical Summary:** Editable, verifiable clinical sections.
- **Medical Timeline & Lab Matrix:** Chronological history and abnormal lab highlights.
- **Side-by-Side Document Crop Viewer:** Inspects original scanned prescriptions with confidence scores.

### 4.3 Authentication Credential Matrix

| Role | Primary Credential | Fallback / Alternative | Interface Opened |
| :--- | :--- | :--- | :--- |
| **Patient** | Patient ID + Password / MPIN | ABHA ID (OTP) / Mobile OTP / Temp ID | Patient Interface |
| **Doctor** | Hospital Doctor ID + Password | Secure Biometric / 2FA OTP | Doctor Interface (OPD Queue + Search) |
| **Triage Staff** | Staff ID + Password | Department Security Token | Triage Alert & Priority Queue Monitor |
| **Administrator** | Admin ID + MFA | Hospital SSO | Administrative Dashboard |

---

## 5. Dual-Mode Clinical Intake (Modern Medicine & AYUSH)

To serve multidisciplinary institutes like the All India Institute of Ayurveda (AIIA), MediKiosk provides equal primary (P0) weighting to both clinical traditions on the home screen:

```
┌────────────────────────────────────────────────────────┐
│               SELECT CLINICAL DEPARTMENT               │
├───────────────────────────┬────────────────────────────┤
│   [ 🩺 Modern Medicine ]   │   [ 🌿 AYUSH / Ayurveda ]  │
└───────────────────────────┴────────────────────────────┘
```

### 5.1 Modern Medicine Workflow
Organized according to the standard clinical history ontology:
- **Chief Complaint (CC):** Presenting symptom and duration.
- **History of Present Illness (HPI):** SOCRATES framework (Site, Onset, Character, Radiation, Associations, Time/Periodicity, Exacerbating/Relieving factors, Severity).
- **Past Medical & Surgical History:** Chronic illnesses, previous hospitalizations, past surgeries.
- **Medication & Allergy History:** Ongoing allopathic drugs, adverse drug reactions.
- **Personal & Family History:** Diet, sleep, smoking, alcohol, occupational factors, familial diseases.
- **Review of Systems (ROS):** Cardiorespiratory, GI, CNS, musculoskeletal, genitourinary.

### 5.2 AYUSH Workflow (Dashavidha Pariksha & Ahara-Vihara)
Captures the complete 10-fold clinical assessment (*Dashavidha Pariksha*) and Ayurvedic lifestyle etiology:
1. **Prakriti** (Constitutional assessment — Vata, Pitta, Kapha dominance)
2. **Vikriti** (Current state of dosha imbalance / pathology)
3. **Sara** (Tissue essence / metabolic vitality — Dhatu sarata)
4. **Samhanana** (Body compactness / structural built)
5. **Pramana** (Anthropometric measurements / proportion)
6. **Satmya** (Habituation / adaptability to diet and environmental factors)
7. **Sattva** (Mental strength / psychological endurance — Pravara, Madhyama, Avara)
8. **Ahara Shakti** (Digestive power / Agni & metabolic assimilation capacity)
9. **Vyayama Shakti** (Physical endurance / capacity for exertion)
10. **Vaya** (Age category and age-specific biological susceptibility)

**Additional AYUSH Parameters:**
- **Ahara:** Dietary habits, Rasa preferences, meal timings, Agni status (*Manda, Vishama, Tikshna, Sama*), and Koshta (*Krura, Mridu, Madhyama*).
- **Vihara:** Daily routine (*Dinacharya*), sleep quality (*Nidra*), exercise, seasonal adaptations (*Ritucharya*).
- **Nidana & Purvaroopa:** Etiological factors, prodromal symptoms, and previous Ayurvedic morbidity (*Roga*).

---

## 6. Multilingual Conversational AI & Speech Processing

MediKiosk acts as an adaptive clinical interviewer rather than a rigid questionnaire.

```
Patient Speaks (Hindi/Punjabi/English/Regional)
      ↓
Directional Noise Suppression & VAD
      ↓
Acoustic Processing (Bhashini / AI4Bharat ASR Engine)
      ↓
Semantic Intent Parsing (Meaning over verbatim phonemes)
      ↓
Confidence-Gated Validation
      ↓
Adaptive Follow-Up Selection
```

### 6.1 Multi-Accent & Dialect Robustness
- Instead of requiring exact phonetic matches, the NLP layer maps colloquial expressions and regional dialects to standardized clinical intents:
  - *"Chaati me dabav aur dard ho raha hai"* $\rightarrow$ `Chief Complaint: Retrosternal Chest Pain`
  - *"Kal shaam se saah lena aukha ho reha"* $\rightarrow$ `Associated Symptom: Dyspnea (Onset: 24h)`
- **Graceful Disambiguation:** If acoustic confidence is $<0.75$, the system triggers a quick spoken confirmation: *"Did you mean chest pain? Tap Yes or No."*

### 6.2 Dual-Mode Interaction (Voice + Touch)
Every clinical question is answerable via two parallel modalities:
- **Voice:** Natural speech in the user's native tongue.
- **Touch Fallback:** Large iconographic chips, visual body maps, and 0–10 numeric pain scales for noisy environments or dysphonic users.

---

## 7. Accessibility & Universal Design

### 7.1 Audio-Guided Mode for Visually Impaired Users (PS Requirement)
- **Zero-Screen Dependency:** Operates as a completely voice-guided conversational loop.
- **Spoken Prompts & VAD Turn-Taking:** The kiosk speaks options clearly and listens via Voice Activity Detection without requiring any physical screen touches:  
  *Audio Prompt:* *"Please describe what brought you to the hospital today, or say 'Menu' to hear the main options."*
- **Spoken Menu Selection:** *"Say 1 for Chest Pain, 2 for Fever, 3 for Abdominal Pain."*
- **Standard Accessibility Compliance:** Built to be 100% compatible with Android TalkBack and WCAG 2.1 AA screen-reader standards on off-the-shelf accessible kiosk hardware.

### 7.2 Low-Literacy & Elderly-Friendly Features
- Visual icon prompts (🫀 Chest, 🤕 Pain, 🤒 Fever, 🤢 Stomach, 🫁 Breathing).
- Extra-large high-contrast buttons, slow-speech audio playback option, `[ 🔊 REPEAT ]` button, and breadcrumb back navigation.
- **Accessible Timeout with Spoken Check-in:** Inactivity window is calibrated to 3–5 minutes. At 2.5 minutes, an audio-visual check-in asks *"Are you still there? Tap or speak to continue"*, paired with a prominent `[ ⏸ I need more time ]` pause button to prevent sudden session loss.
- **Physical Slip Guarantee:** Automatic printing of physical thermal token slips ensures elderly and illiterate patients have an unlosable, tangible physical record without needing to operate a smartphone.

---

## 8. Two-Tier Red-Flag Detection & Triage Engine

MediKiosk continuously evaluates patient responses against clinical emergency algorithms to prevent critical delays without triggering alarm fatigue.

```
                    Patient Response Evaluated
                                │
             ┌──────────────────┴──────────────────┐
             │                                     │
    Tier-1 Critical Emergency?            Tier-2 Priority Symptom?
  (e.g., Chest Pain + Diaphoresis      (e.g., High Fever > 103°F,
   + Left Arm Radiation / Stroke)        Severe Pain 8/10, Hemoptysis)
             │                                     │
             ▼                                     ▼
   [ TIER 1: RED ALERT ]                 [ TIER 2: AMBER NOTICE ]
   • Emergency buzzer/SMS to Staff       • Priority Queue Assignment
   • Kiosk displays urgent staff alert   • Highlighted in Doctor Queue
   • Immediate triage intervention       • Silent priority advance (no alarm)
```

### 8.1 Privacy-Preserving Triage Display (DPDP Aligned)
- **Public Waiting-Room Board:** Displays **only** plain token numbers and room allocations (e.g., `Token #47 ➔ Room 12`). Priority tokens are silently sequenced ahead in the queue without public medical badges.
- **Staff & Doctor Dashboard (Confidential):** The `🚨 Tier-1 Critical Red Alert` badge, vital warning tags, and clinical justifications are visible **strictly** to authenticated medical personnel.

> **Safety Disclaimer:** Red-flag notices are explicitly presented as *triage prioritization alerts*, never as definitive diagnostic declarations.

---

## 9. Medical Document Digitization & Clinical Extraction

Patients can scan paper documents (prescriptions, lab tests, discharge summaries, imaging reports) at the kiosk.

```
Scan Document → Preprocessing → OCR → Drug/Lab Entity Extraction → Confidence Scoring → Timeline
```

### 9.1 Confidence-Scored Extraction & Side-by-Side Crop Viewer
- **Drug Dictionary Validation:** Extracted medicine names are fuzzy-matched against the Indian Pharmacopoeia, CDSCO, and NLEM drug databases.
- **Confidence Scoring:**
  - `Metformin 500mg (Confidence: 97%)` $\rightarrow$ Displayed normally.
  - `Amlodipine 5mg (Confidence: 68% ⚠ Verify)` $\rightarrow$ Flagged in amber for clinician review.
- **Side-by-Side Verification Crop:** The Doctor Interface renders the high-resolution crop of the original document directly adjacent to the extracted text for instant 1-second visual verification.

### 9.2 Abnormal Investigation Detection
Lab parameters are parsed and cross-referenced against standard and report-specific biological reference intervals:
```
⚠ Abnormal Lab Highlights
• HbA1c:        8.2 %     (Ref: 4.0 - 5.6 %)    [ HIGH ]
• Hemoglobin:   9.2 g/dL  (Ref: 12.0 - 15.5 g/dL) [ LOW ]
• S. Creatinine:1.1 mg/dL (Ref: 0.7 - 1.3 mg/dL) [ NORMAL ]
```

---

## 10. Longitudinal Medical Timeline

Scanned records and prior visit summaries are assembled into an interactive chronological timeline:

```
2024
 ├── Feb 10 — Type 2 Diabetes diagnosed (Prescription: Metformin 500mg)
 │
2025
 ├── Aug 18 — Acute Gastritis admission (Discharge Summary)
 └── Nov 04 — Routine Lab Panel (HbA1c: 7.8% HIGH)
 │
2026
 └── Sep 11 — Current OPD Visit: Chest pain & breathlessness (Tier-1 Red Flag)
```

---

## 11. Smart Token, Queue Routing & Digital OPD Parchi

*(Value-Added Clinical Logistics Bridge: Connects clinical intake directly to OPD room execution).*

```
Clinical Intake Completed
            ↓
Department Mapped (Deterministic Rule-Based Lookup from Chief Complaint)
            ↓
Triage Tier Evaluated (Standard vs. Priority)
            ↓
Token Issued (Printed Thermal Slip + Optional Digital OPD Parchi)
            ↓
Queue Position Updated (Privacy-Preserving Public Board + Doctor Worklist)
```

### 11.1 Deterministic Department Routing
- Department routing operates via a **deterministic, rule-based clinical lookup matrix** mapped directly from the confirmed Chief Complaint:
  - *Chest Pain $\rightarrow$ General Medicine / Cardiology*
  - *Joint Pain / Sandhivata $\rightarrow$ Kayachikitsa / Panchakarma*
  - *Trauma / Acute Wounds $\rightarrow$ Shalya Tantra (Surgery)*
- **Patient & Staff Verification:** The patient is shown a 1-tap confirmation card (*"Assigned Department: General Medicine — Tap to Change"*), with manual override capability for triage staff.

### 11.2 Multimodal Token & Parchi Delivery with Barcode Security
1. **Printed Thermal Slip (Kiosk Default — Zero Smartphone Dependency):**
   - Automatically printed by the kiosk hardware.
   - Contains: Token Number, Department, Room Number, Patient ID, and a **secure, cryptographically signed QR/barcode**.
   - **Barcode Privacy Guard:** The QR code contains *only an opaque Visit Reference ID* with zero plain-text medical data. Scanning it with an unauthorized mobile camera reveals no health information; it unlocks the patient record **only** when scanned within an *authenticated Doctor or Hospital Staff portal*.
2. **Digital OPD Parchi (Digital Convenience via SMS/PWA):**
   - For smartphone owners, an SMS link or PWA view provides a persistent digital card tied to the Patient ID without requiring app downloads.

```
┌──────────────────────────────────────────┐
│           DIGITAL OPD PARCHI             │
├──────────────────────────────────────────┤
│ Patient ID:   MK-10452                   │
│ Visit ID:     V-2026-0911                │
│ Department:   General Medicine (Room 12) │
│ Token Number: 47                         │
│ Intake:       ✅ Complete (Verified)     │
│ Queue Status: Next in Line               │
└──────────────────────────────────────────┘
```

---

## 12. Standardized Physician Summary & Verification

The intake generates a structured clinical draft organized in standard medical sequence:

```
PATIENT: Ramesh Kumar (MK-10452) | AGE: 54 | GENDER: Male | DEPT: General Medicine
LANGUAGE: Hindi (Audio Confirmed) | TRIAGE STATUS: 🚨 TIER-1 PRIORITY

CHIEF COMPLAINT
Retrosternal chest pain for 1 day, worsening on exertion.

HISTORY OF PRESENT ILLNESS
Onset: Yesterday morning while walking.
Character: Constricting, radiating to left shoulder. Severity: 7/10.
Associated Symptoms: Breathlessness, diaphoresis. No loss of consciousness.

PAST MEDICAL & SURGICAL HISTORY
- Type 2 Diabetes Mellitus (6 years)
- Systemic Hypertension (4 years)
- No prior surgeries reported.

CURRENT MEDICATIONS (Extracted from Prescriptions)
1. Tab. Metformin 500 mg — 1-0-1 (Confidence: 96%)
2. Tab. Amlodipine 5 mg — 0-0-1 (Confidence: 94%)

ALLERGIES
No known drug allergies reported.

AYUSH / CONSTITUTIONAL NOTES (If AYUSH Mode Selected)
Prakriti: Pitta-Kapha | Agni: Manda | Ahara: Katu/Amla Pradhana

ABNORMAL INVESTIGATIONS
- HbA1c: 8.2% [HIGH] | Hemoglobin: 9.2 g/dL [LOW]

PHYSICIAN ACTIONS: [ EDIT ]  [ ADD CLINICAL NOTE ]  [ REJECT ITEM ]  [ CONFIRM & SIGN ]
```

> **Physician Sign-Off:** The record remains an unconfirmed draft until the doctor reviews, edits, and digitally signs the clinical note.

---

## 13. Data Privacy, DPDP Act 2023 & ABDM Integration

### 13.1 Consent & DPDP Act 2023 Compliance
- **Audio-Visual Consent:** Clear explanation of data collection purpose in vernacular audio before intake starts.
- **Data Principal Rights:** Patients can view consent logs, request corrections, or trigger data erasure via their patient dashboard.
- **Ephemeral Kiosk Architecture with Accessible Inactivity Window:** Kiosk terminals store zero patient health data locally; sessions are held in encrypted RAM. The session buffer is cleared upon deliberate session submission or after **3–5 minutes of unresponded inactivity** (following an explicit spoken check-in at 2.5 minutes), protecting unattended terminals without rushing elderly patients.

### 13.2 ABDM & FHIR Interoperability
- Information is mapped into standard **FHIR R4 resources**:
  - `Patient`, `Condition`, `Observation`, `MedicationStatement`, `AllergyIntolerance`, `DiagnosticReport`, `DocumentReference`.
- Architecture aligns with ABDM M1 (ABHA creation/linking), M2 (HIP record generation), and M3 (HIU data view) milestones.

---

## 14. Technical Architecture & Component Stack

```
                              ┌─────────────────────────────┐
                              │       MediKiosk Auth        │
                              │   (Role-Based Resolution)   │
                              └──────────────┬──────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             ┌───────────────────┐                       ┌───────────────────┐
             │ PATIENT INTERFACE │                       │ DOCTOR INTERFACE  │
             │  (Kiosk/PWA/App)  │                       │  (React Dashboard)│
             └─────────┬─────────┘                       └─────────┬─────────┘
                       │                                           │
         Voice / Touch / Documents                        Patient ID Search
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             ▼
                              ┌─────────────────────────────┐
                              │   FastAPI Backend Server    │
                              └──────────────┬──────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             ▼                               ▼                               ▼
      ┌─────────────┐                 ┌─────────────┐                 ┌─────────────┐
      │  Voice/ASR  │                 │ Document AI │                 │ Red-Flag &  │
      │   Engine    │                 │ (OCR + NLP) │                 │ Queue Engine│
      └──────┬──────┘                 └──────┬──────┘                 └──────┬──────┘
             └───────────────────────────────┼───────────────────────────────┘
                                             ▼
                              ┌─────────────────────────────┐
                              │   Clinical Data Layer &     │
                              │    PostgreSQL Database      │
                              └──────────────┬──────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             ┌───────────────────┐                       ┌───────────────────┐
             │ Hospital HIS / EMR│                       │ ABDM / FHIR Server│
             └───────────────────┘                       └───────────────────┘
```

### Technology Stack Specifications
- **Patient Interface:** Flutter (Cross-platform for Android kiosks, tablets, and Web PWA).
- **Doctor Dashboard:** React.js + Tailwind CSS with accessibility tokens.
- **Backend API:** FastAPI (Python 3.11 asynchronous architecture).
- **Database:** PostgreSQL (Encrypted at rest with role-based access control).
- **Speech & Language AI:** Bhashini / AI4Bharat-compatible Indian language ASR models + Medically constrained ontology parser.
- **Document OCR:** Multilingual OCR engine with dictionary fuzzy-matching.
- **Interoperability Standard:** HL7 FHIR R4 JSON schemas.

---

## 15. Prototype vs. Production Roadmap

| Dimension | Hackathon Prototype | Production Hospital Deployment |
| :--- | :--- | :--- |
| **Patient Interface** | Fully interactive Flutter kiosk & Web/PWA + printed thermal slip mock | Certified physical ruggedized OPD kiosks + built-in thermal printers + mobile app |
| **Voice Languages** | Hindi, English, Punjabi (Active functional demo) | 22 Official Indian languages via national Bhashini APIs |
| **AYUSH Intake** | Complete 10 Dashavidha Pariksha + Ahara/Vihara structured assessment fields | Ayurvedic diagnoses/Nidana findings mapped against NAMASTE / ICD-11 TM2; Dashavidha Pariksha parameters preserved as structured constitutional observation attributes |
| **Document OCR** | Sample printed & standard prescriptions + crops | High-throughput GPU OCR with deep handwriting models |
| **Red-Flag Engine** | Rule-based 2-tier clinical triage matrix with privacy-preserving queue sequencing | Clinically validated AI triage models integrated with ER alarm systems and HIS |
| **Token & Queue** | In-memory priority queue, thermal slip generator & Digital Parchi generator | Full bidirectional integration with hospital physical Queue Management Systems (QMS) |
| **ABDM / HIS** | Mock FHIR R4 server & ABDM sandbox flow | Production ABDM Gateway certified integration |
| **Security & Privacy** | TLS 1.3, ephemeral session memory clearing, RBAC | Complete CERT-In security audit, HIPAA & DPDP compliance |

---

## 16. MVP Feature Priorities

### P0 — Must-Have Core (Hackathon Showcase)
- Role-based login (Patient Interface vs. Doctor Interface with Patient ID search)
- Multilingual voice intake (Hindi & English) with touch fallback
- Audio-guided conversational mode for visually impaired users
- Full Allopathic clinical history ontology (CC $\rightarrow$ HPI $\rightarrow$ PMH $\rightarrow$ Meds $\rightarrow$ Allergies $\rightarrow$ ROS)
- Dedicated AYUSH Dashavidha Pariksha & Ahara-Vihara intake mode
- Two-tier red-flag detection (Critical Red Alert vs. Amber Notice) with privacy-preserving queue displays
- Document scan & OCR with confidence scores, abnormal lab highlighting, and side-by-side crops
- Chronological medical timeline
- Editable physician dashboard with draft sign-off workflow
- Consent screen with audio explanation and accessible ephemeral session memory clearance

### P1 — Strong Value Additions
- Punjabi language ASR/TTS voice flow
- Deterministic department routing & printed token slip / Digital OPD Parchi generator with signed QR security
- Patient Web Portal (MyMediKiosk) for pre-visit report uploads and DPDP consent management
- Mock ABDM FHIR R4 resource exporter

### P2 — Production / Stretch Goals
- Sign-language animated avatar assistance
- Advanced complex handwriting neural decoders
- Automated hospital QMS hardware integration
- Advanced drug-drug interaction warning service

---

## 17. Suggested Live Demonstration Scenario

1. **Patient Arrival (Patient Interface):** Patient logs in with Patient ID / ABHA or continues as New Patient. Selects **Hindi** and **AYUSH / Modern Medicine** mode.
2. **Audio-Guided Consent:** Listens to vernacular audio explanation and taps `[ I CONSENT ]`.
3. **Conversational Voice Intake:** Patient speaks: *"Mujhe kal se seene mein tej dard aur ghabrahat ho rahi hai."*
4. **Adaptive Follow-Up & Red Flag:** AI asks about radiation and sweating $\rightarrow$ Triggers **Tier-1 Critical Red Alert** $\rightarrow$ Kiosk silently tags priority token and alerts triage staff without public alarm exposure.
5. **Document OCR & Timeline:** Patient uploads a prior prescription and lab report $\rightarrow$ OCR extracts Metformin and flags `HbA1c: 8.2% HIGH` $\rightarrow$ Medical timeline is generated.
6. **Token & Parchi Issuance:** Kiosk prints physical Token `#12` with secure signed QR (and generates Digital OPD Parchi). Public board displays clean `Token #12 ➔ Room 12`.
7. **Doctor Login (Doctor Interface):** Physician logs in with Doctor ID, sees Token `#12` in priority queue, enters Patient ID $\rightarrow$ Instantly views today's recent symptoms, structured clinical summary, abnormal labs, and side-by-side prescription crop.
8. **Clinical Sign-Off:** Doctor reviews, edits one medication dosage, and confirms the note $\rightarrow$ Ready for in-person consultation in under 30 seconds.

---

## 18. Recommended 6-Member Team Distribution

- **Member 1 (Patient UI & Accessibility):** Flutter kiosk, touch flows, high-contrast UI, visually impaired audio-first mode, accessible timeouts, printed slip template.
- **Member 2 (AI/ML & Conversational Engine):** ASR integration, semantic intent parsing, adaptive question engine, red-flag logic.
- **Member 3 (Document AI & OCR):** OCR pipeline, drug dictionary validation, confidence scoring, crop generator.
- **Member 4 (Backend & Core Services):** FastAPI, PostgreSQL, role-based auth, session management, deterministic department router, token engine, signed QR generator.
- **Member 5 (Doctor Interface):** React dashboard, OPD worklist, Patient ID search, clinical summary editor, timeline view.
- **Member 6 (Interoperability & Compliance):** FHIR R4 schema mapping, mock ABDM gateway, consent logs, DPDP data erasure endpoints.

---

## 19. One-Line Project Pitch

> *MediKiosk is a multilingual, accessible AI clinical intake platform that captures patient history, digitizes medical records, structures Allopathic and AYUSH assessments, detects critical red flags, and delivers an instant, verified clinical summary to the physician before the consultation begins — preserving every second of doctor-patient consultation time.*
