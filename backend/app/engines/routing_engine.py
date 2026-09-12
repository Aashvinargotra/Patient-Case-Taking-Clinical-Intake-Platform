from typing import Dict, Any

DEPARTMENT_MAP = {
    # Allopathic Departments
    "EMERGENCY": {
        "dept_id": "EMERGENCY", 
        "name": "Emergency & Trauma Triage", 
        "room": "Red Zone / Room E-01", 
        "discipline": "ALLOPATHY",
        "assigned_doctor_id": "DOC-EMERGENCY-01",
        "assigned_doctor_name": "Dr. Siddharth Rao"
    },
    "CARDIOLOGY": {
        "dept_id": "CARDIOLOGY", 
        "name": "Cardiology OPD", 
        "room": "Room 104 (1st Floor)", 
        "discipline": "ALLOPATHY",
        "assigned_doctor_id": "DOC-CARDIO-01",
        "assigned_doctor_name": "Dr. Vikram Malhotra"
    },
    "GEN_MED": {
        "dept_id": "GEN_MED", 
        "name": "General Medicine OPD", 
        "room": "Room 101 (Ground Floor)", 
        "discipline": "ALLOPATHY",
        "assigned_doctor_id": "DOC-GENMED-01",
        "assigned_doctor_name": "Dr. Priya Sen"
    },
    "ORTHOPEDICS": {
        "dept_id": "ORTHOPEDICS", 
        "name": "Orthopedics OPD", 
        "room": "Room 108 (Ground Floor)", 
        "discipline": "ALLOPATHY",
        "assigned_doctor_id": "DOC-ORTHO-01",
        "assigned_doctor_name": "Dr. Rajesh Verma"
    },
    "GASTROENTEROLOGY": {
        "dept_id": "GASTROENTEROLOGY", 
        "name": "Gastroenterology OPD", 
        "room": "Room 202 (2nd Floor)", 
        "discipline": "ALLOPATHY",
        "assigned_doctor_id": "DOC-GENMED-01",
        "assigned_doctor_name": "Dr. Priya Sen"
    },
    "DERMATOLOGY": {
        "dept_id": "DERMATOLOGY", 
        "name": "Dermatology OPD", 
        "room": "Room 205 (2nd Floor)", 
        "discipline": "ALLOPATHY",
        "assigned_doctor_id": "DOC-DERMA-01",
        "assigned_doctor_name": "Dr. Neha Gupta"
    },
    "RHEUMATOLOGY": {
        "dept_id": "RHEUMATOLOGY", 
        "name": "Rheumatology OPD", 
        "room": "Room 206 (2nd Floor)", 
        "discipline": "ALLOPATHY",
        "assigned_doctor_id": "DOC-ORTHO-01",
        "assigned_doctor_name": "Dr. Rajesh Verma"
    },
    
    # AYUSH / Ayurveda Departments (AIIA Standard)
    "KAYACHIKITSA": {
        "dept_id": "KAYACHIKITSA", 
        "name": "Kayachikitsa (Internal Medicine)", 
        "room": "Room A-101", 
        "discipline": "AYUSH",
        "assigned_doctor_id": "DOC-AYUSH-01",
        "assigned_doctor_name": "Dr. Ananya Sharma"
    },
    "PANCHAKARMA": {
        "dept_id": "PANCHAKARMA", 
        "name": "Panchakarma Department", 
        "room": "Room A-102", 
        "discipline": "AYUSH",
        "assigned_doctor_id": "DOC-PANCHAKARMA-01",
        "assigned_doctor_name": "Dr. Harpreet Kaur"
    },
    "SHALYA_TANTRA": {
        "dept_id": "SHALYA_TANTRA", 
        "name": "Shalya Tantra (Surgery & Marma)", 
        "room": "Room A-105", 
        "discipline": "AYUSH",
        "assigned_doctor_id": "DOC-AYUSH-01",
        "assigned_doctor_name": "Dr. Ananya Sharma"
    },
    "HRIDROGA": {
        "dept_id": "HRIDROGA", 
        "name": "Hridroga (Ayurvedic Cardiology)", 
        "room": "Room A-106", 
        "discipline": "AYUSH",
        "assigned_doctor_id": "DOC-AYUSH-01",
        "assigned_doctor_name": "Dr. Ananya Sharma"
    },
    "TWAK_ROGA": {
        "dept_id": "TWAK_ROGA", 
        "name": "Twak Roga (Dermatology)", 
        "room": "Room A-108", 
        "discipline": "AYUSH",
        "assigned_doctor_id": "DOC-AYUSH-01",
        "assigned_doctor_name": "Dr. Ananya Sharma"
    },
    "AGNI_CHIKITSA": {
        "dept_id": "AGNI_CHIKITSA", 
        "name": "Agni & Metabolic Health", 
        "room": "Room A-110", 
        "discipline": "AYUSH",
        "assigned_doctor_id": "DOC-AYUSH-01",
        "assigned_doctor_name": "Dr. Ananya Sharma"
    },
    "JWARA_CHIKITSA": {
        "dept_id": "JWARA_CHIKITSA", 
        "name": "Jwara & Acute Fevers", 
        "room": "Room A-112", 
        "discipline": "AYUSH",
        "assigned_doctor_id": "DOC-AYUSH-01",
        "assigned_doctor_name": "Dr. Ananya Sharma"
    }
}

def determine_department(chief_complaint: str, discipline: str = "ALLOPATHY", is_emergency: bool = False) -> Dict[str, Any]:
    """
    Deterministically routes patient intake to the optimal department and assigned consultation room.
    Respects clinical discipline choice (Allopathy vs AYUSH) and smart doctor assignment.
    """
    if is_emergency:
        return DEPARTMENT_MAP["EMERGENCY"]

    text = (chief_complaint or "").lower().replace("_", " ")

    # Check for general malaise / not sure / whole body
    is_general = any(k in text for k in ["general", "not sure", "not_sure", "whole body", "malaise", "weakness", "thakan", "kamzori", "poore shareer"])

    if discipline.upper() == "AYUSH":
        if is_general:
            return DEPARTMENT_MAP["KAYACHIKITSA"]
        elif any(k in text for k in ["joint", "sandhi", "amavata", "pain", "vata", "knee", "back"]):
            return DEPARTMENT_MAP["KAYACHIKITSA"]
        elif any(k in text for k in ["detox", "shodhana", "panchakarma", "massage", "basti"]):
            return DEPARTMENT_MAP["PANCHAKARMA"]
        elif any(k in text for k in ["heart", "hrid", "palpitation"]):
            return DEPARTMENT_MAP["HRIDROGA"]
        elif any(k in text for k in ["skin", "twak", "kushtha", "itching", "rash"]):
            return DEPARTMENT_MAP["TWAK_ROGA"]
        elif any(k in text for k in ["digestion", "acidity", "agni", "gas", "constipation", "stomach"]):
            return DEPARTMENT_MAP["AGNI_CHIKITSA"]
        elif any(k in text for k in ["fever", "jwara", "tapa"]):
            return DEPARTMENT_MAP["JWARA_CHIKITSA"]
        else:
            return DEPARTMENT_MAP["KAYACHIKITSA"]

    # Allopathy routing
    if is_general:
        return DEPARTMENT_MAP["GEN_MED"]
    elif any(k in text for k in ["chest pain", "heart", "angina", "palpitation", "breathlessness"]):
        return DEPARTMENT_MAP["CARDIOLOGY"]
    elif any(k in text for k in ["bone", "fracture", "knee", "back pain", "joint", "shoulder"]):
        return DEPARTMENT_MAP["ORTHOPEDICS"]
    elif any(k in text for k in ["stomach", "vomiting", "diarrhea", "abdomen", "liver", "constipation"]):
        return DEPARTMENT_MAP["GASTROENTEROLOGY"]
    elif any(k in text for k in ["skin", "rash", "itching", "allergy", "hair"]):
        return DEPARTMENT_MAP["DERMATOLOGY"]
    elif any(k in text for k in ["arthritis", "lupus", "rheumatism"]):
        return DEPARTMENT_MAP["RHEUMATOLOGY"]
    else:
        return DEPARTMENT_MAP["GEN_MED"]
