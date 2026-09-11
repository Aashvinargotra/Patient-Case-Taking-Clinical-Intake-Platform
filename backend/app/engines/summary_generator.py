from typing import Dict, Any, List, Optional

def generate_bilingual_draft_summary(
    discipline: str,
    patient_name: str,
    slots: Dict[str, Any],
    extracted_investigations: Optional[List[Dict[str, Any]]] = None,
    language: str = "hi"
) -> Dict[str, Any]:
    """
    Generates bilingual clinical intake outputs:
    1. Patient Vernacular Confirmation Text (for audio playback / on-screen review)
    2. Structured Physician Draft Summary (in English clinical ontology format)
    Strictly sets is_draft = TRUE.
    """
    chief_complaint = slots.get("chief_complaint", "Unspecified symptoms")
    
    # 1. Patient Audio/Screen Confirmation Script
    if language == "hi":
        patient_confirmation_text = f"श्री/श्रीमती {patient_name}, आपकी मुख्य तकलीफ़ '{chief_complaint}' के रूप में दर्ज की गई है। कृपया डॉक्टर से मिलने से पहले स्क्रीन पर विवरण जांच लें।"
    elif language == "pa":
        patient_confirmation_text = f"{patient_name} ਜੀ, ਤੁਹਾਡੀ ਮੁੱਖ ਸਮੱਸਿਆ '{chief_complaint}' ਦਰਜ ਕਰ ਲਈ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਕ੍ਰੀਨ 'ਤੇ ਪੁਸ਼ਟੀ ਕਰੋ।"
    else:
        patient_confirmation_text = f"Patient {patient_name}, your chief complaint has been recorded as '{chief_complaint}'. Please verify before your consultation."

    # 2. Structured Physician Draft Summary (Clinical Markdown)
    if discipline.upper() == "AYUSH":
        draft_summary_text = (
            f"### AYUSH / AYURVEDA CLINICAL INTAKE DRAFT SUMMARY (PATIENT-REPORTED)\n\n"
            f"**Patient Name:** {patient_name}\n"
            f"**Discipline:** Ayurveda (Dashavidha Pariksha & Ahara-Vihara Assessment)\n\n"
            f"#### 1. Roga & Rogi Pariksha Findings:\n"
            f"- **Chief Complaint / Roga Lakshana:** {chief_complaint}\n"
            f"- **Prakriti (Innate Constitution):** {slots.get('prakriti', 'Not assessed')}\n"
            f"- **Vikriti (Doshic Imbalance):** {slots.get('vikriti', 'Not assessed')}\n"
            f"- **Sara (Tissue Vitality):** {slots.get('sara', 'Not assessed')}\n"
            f"- **Samhanana (Body Compactness):** {slots.get('samhanana', 'Not assessed')}\n"
            f"- **Sattva (Mental Resilience):** {slots.get('sattva', 'Not assessed')}\n"
            f"- **Ahara Shakti (Digestion Capacity):** {slots.get('ahara_shakti', 'Not assessed')}\n"
            f"- **Agni & Ahara-Vihara:** {slots.get('ahara_vihara_and_agni', 'Not assessed')}\n\n"
            f"#### 2. Digitized Lab & Historical Entities:\n"
            f"{format_investigations_markdown(extracted_investigations)}\n\n"
            f"> [!NOTE]\n"
            f"> **PHYSICIAN SIGN-OFF REQUIRED:** This summary is an AI-structured, patient-reported draft. Physician must clinically verify before finalizing the official OPD case sheet."
        )
    else:
        draft_summary_text = (
            f"### ALLOPATHIC OPD CLINICAL INTAKE DRAFT SUMMARY (PATIENT-REPORTED)\n\n"
            f"**Patient Name:** {patient_name}\n"
            f"**Discipline:** Modern Medicine (SOCRATES Framework)\n\n"
            f"#### 1. History of Presenting Illness (HPI):\n"
            f"- **Chief Complaint:** {chief_complaint}\n"
            f"- **Site & Radiation:** {slots.get('site_and_radiation', 'Not specified')}\n"
            f"- **Onset & Timing:** {slots.get('onset_and_timing', 'Not specified')}\n"
            f"- **Character & Severity:** {slots.get('character_and_severity', 'Not specified')}\n"
            f"- **Associated Symptoms:** {slots.get('associated_symptoms', 'None reported')}\n\n"
            f"#### 2. Past Medical History & Current Medications:\n"
            f"- **Past History:** {slots.get('past_medical_and_meds', 'None reported')}\n\n"
            f"#### 3. Digitized Lab & Diagnostic Findings:\n"
            f"{format_investigations_markdown(extracted_investigations)}\n\n"
            f"> [!NOTE]\n"
            f"> **PHYSICIAN SIGN-OFF REQUIRED:** Draft record generated via MediKiosk pre-consultation intake. Requires attending doctor verification and digital signature."
        )

    return {
        "is_draft": True,
        "patient_confirmation_text": patient_confirmation_text,
        "draft_summary_text": draft_summary_text,
        "structured_history": slots,
        "extracted_investigations": extracted_investigations or []
    }

def format_investigations_markdown(investigations: Optional[List[Dict[str, Any]]]) -> str:
    if not investigations:
        return "- No prior investigations or uploaded reports attached to this session."
    
    lines = []
    for inv in investigations:
        abnormal_flag = "⚠️ **ABNORMAL**" if inv.get("is_abnormal") else "Normal"
        lines.append(f"- **{inv.get('standardized_name', 'Lab Test')}:** {inv.get('value')} {inv.get('unit', '')} (Ref: {inv.get('reference_low')}-{inv.get('reference_high')}) ➔ {abnormal_flag}")
    return "\n".join(lines)
