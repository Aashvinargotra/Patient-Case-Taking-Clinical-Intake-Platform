import json
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

class AllopathicDialogueEngine:
    """
    Modern Medicine SOCRATES State Machine (Full 7-Step Traversal).
    Deterministic slot-filling engine ensuring strict clinical ontology constraints.
    """
    STEPS = [
        "CHIEF_COMPLAINT",
        "SITE_AND_RADIATION",
        "ONSET_AND_TIMING",
        "CHARACTER_AND_SEVERITY",
        "ASSOCIATED_SYMPTOMS",
        "PAST_MEDICAL_AND_MEDS",
        "REVIEW_AND_CONFIRM"
    ]

    PROMPTS = {
        "CHIEF_COMPLAINT": {
            "hi": "नमस्ते! आज आपको अस्पताल आने की मुख्य वजह क्या है? कृपया अपनी परेशानी बताएं।",
            "en": "Hello! What is the main reason for your visit today? Please describe your chief complaint.",
            "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਤੁਹਾਡੀ ਮੁੱਖ ਸਮੱਸਿਆ ਕੀ ਹੈ? ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ।"
        },
        "SITE_AND_RADIATION": {
            "hi": "यह दर्द या तकलीफ़ शरीर के किस हिस्से में है? क्या यह कहीं और (जैसे बांह, जबड़े या पीठ) फैल रहा है?",
            "en": "Where exactly is the discomfort located? Does it radiate or spread anywhere else (e.g., arm, jaw, back)?",
            "pa": "ਇਹ ਦਰਦ ਸਰੀਰ ਦੇ ਕਿਸ ਹਿੱਸੇ ਵਿੱਚ ਹੈ? ਕੀ ਇਹ ਕਿਤੇ ਹੋਰ ਫੈਲ ਰਿਹਾ ਹੈ?"
        },
        "ONSET_AND_TIMING": {
            "hi": "यह समस्या कब शुरू हुई? क्या यह अचानक हुई या धीरे-धीरे? क्या यह लगातार बनी रहती है?",
            "en": "When did this issue start? Was the onset sudden or gradual? Is it constant or intermittent?",
            "pa": "ਇਹ ਸਮੱਸਿਆ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਈ? ਕੀ ਇਹ ਅਚਾਨਕ ਸ਼ੁਰੂ ਹੋਈ ਸੀ?"
        },
        "CHARACTER_AND_SEVERITY": {
            "hi": "दर्द का अहसास कैसा है (चुभने वाला, भारीपन, जलन)? 0 से 10 के पैमाने पर दर्द का स्तर क्या है?",
            "en": "How would you describe the pain (crushing, sharp, burning)? On a scale of 0 to 10, how severe is it?",
            "pa": "ਦਰਦ ਕਿਸ ਤਰ੍ਹਾਂ ਦਾ ਹੈ? 0 ਤੋਂ 10 ਦੇ ਪੈਮਾਨੇ 'ਤੇ ਦਰਦ ਕਿੰਨਾ ਹੈ?"
        },
        "ASSOCIATED_SYMPTOMS": {
            "hi": "क्या इसके साथ पसीना आना, घबराहट, सांस फूलना, उल्टी या बुखार जैसी अन्य तकलीफ़ें भी हैं?",
            "en": "Are you experiencing any associated symptoms such as sweating, palpitations, breathlessness, nausea, or fever?",
            "pa": "ਕੀ ਇਸਦੇ ਨਾਲ ਪਸੀਨਾ, ਸਾਹ ਚੜ੍ਹਨਾ ਜਾਂ ਉਲਟੀ ਵਰਗੇ ਲੱਛਣ ਵੀ ਹਨ?"
        },
        "PAST_MEDICAL_AND_MEDS": {
            "hi": "क्या आपको पहले से शुगर, बीपी, थायराइड या दिल की बीमारी है? आप वर्तमान में कौन सी दवाएं ले रहे हैं?",
            "en": "Do you have any existing conditions like Diabetes, Hypertension, or Heart disease? What medications do you take?",
            "pa": "ਕੀ ਤੁਹਾਨੂੰ ਸ਼ੂਗਰ ਜਾਂ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਦੀ ਸਮੱਸਿਆ ਹੈ? ਤੁਸੀਂ ਕਿਹੜੀਆਂ ਦਵਾਈਆਂ ਲੈ ਰਹੇ ਹੋ?"
        },
        "REVIEW_AND_CONFIRM": {
            "hi": "धन्यवाद! हमने आपकी पूरी जानकारी दर्ज कर ली है। कृपया पुष्टि करें ताकि हम डॉक्टर के लिए पर्ची तैयार कर सकें।",
            "en": "Thank you! We have structured your intake information. Please review and confirm for the doctor.",
            "pa": "ਧੰਨਵਾਦ! ਅਸੀਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਦਰਜ ਕਰ ਲਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਕਰੋ।"
        }
    }

    OPTIONS = {
        "CHIEF_COMPLAINT": [
            {"label": "सीने में दर्द / Chest Pain", "value": "chest_pain"},
            {"label": "बुखार / Fever", "value": "fever"},
            {"label": "सांस लेने में तकलीफ़ / Dyspnea", "value": "shortness_of_breath"},
            {"label": "पेट दर्द / Abdominal Pain", "value": "abdominal_pain"},
            {"label": "जोड़ों में दर्द / Joint Pain", "value": "joint_pain"},
            {"label": "सिरदर्द या चक्कर / Headache", "value": "headache"}
        ],
        "SITE_AND_RADIATION": [
            {"label": "बाएं सीने में ➔ बाईं बांह में / Left Chest to Left Arm", "value": "left_chest_to_left_arm"},
            {"label": "छाती के बीच में / Substernal / Central Chest", "value": "central_chest"},
            {"label": "ऊपरी पेट / Epigastric", "value": "epigastric"},
            {"label": "पीठ / Back", "value": "back"},
            {"label": "कहीं नहीं फैलता / No Radiation", "value": "none"}
        ],
        "ONSET_AND_TIMING": [
            {"label": "अचानक (पिछले 2 घंटे में) / Sudden (<2 hrs)", "value": "sudden_recent"},
            {"label": "आज सुबह से / Since morning", "value": "today_morning"},
            {"label": "पिछले 2-3 दिनों से / Past 2-3 days", "value": "past_few_days"},
            {"label": "1 महीने से ज़्यादा / > 1 month", "value": "chronic"}
        ],
        "CHARACTER_AND_SEVERITY": [
            {"label": "भारीपन / दबाव (Crushing / Pressure)", "value": "crushing_pressure"},
            {"label": "तेज़ चुभन (Sharp / Stabbing)", "value": "sharp"},
            {"label": "जलन (Burning)", "value": "burning"},
            {"label": "धीमा दर्द (Dull Ache)", "value": "dull"}
        ],
        "ASSOCIATED_SYMPTOMS": [
            {"label": "ठंडा पसीना आना / Cold Sweats (Diaphoresis)", "value": "diaphoresis"},
            {"label": "सांस फूलना / Shortness of Breath", "value": "dyspnea"},
            {"label": "घबराहट / Palpitations", "value": "palpitations"},
            {"label": "उल्टी / Nausea / Vomiting", "value": "nausea"},
            {"label": "कोई नहीं / None", "value": "none"}
        ],
        "PAST_MEDICAL_AND_MEDS": [
            {"label": "शुगर (Diabetes Mellitus)", "value": "diabetes"},
            {"label": "उच्च रक्तचाप (Hypertension)", "value": "hypertension"},
            {"label": "दिल की पुरानी बीमारी (CAD / Prior MI)", "value": "cad"},
            {"label": "कोई पुरानी बीमारी नहीं / No prior illness", "value": "none"}
        ]
    }

    @classmethod
    def get_next_prompt(cls, current_step: Optional[str], language: str = "hi") -> Dict[str, Any]:
        if not current_step:
            step = cls.STEPS[0]
        else:
            try:
                idx = cls.STEPS.index(current_step)
                step = cls.STEPS[idx + 1] if idx + 1 < len(cls.STEPS) else "REVIEW_AND_CONFIRM"
            except ValueError:
                step = cls.STEPS[0]

        return {
            "step": step,
            "step_index": cls.STEPS.index(step) + 1,
            "total_steps": len(cls.STEPS),
            "prompt_text": cls.PROMPTS[step].get(language, cls.PROMPTS[step]["en"]),
            "options": cls.OPTIONS.get(step, []),
            "is_last_step": (step == "REVIEW_AND_CONFIRM")
        }


class AyushDialogueEngine:
    """
    AYUSH / Ayurveda Dashavidha Pariksha State Machine (Full 11-Step Traversal).
    Captures: Prakriti, Vikriti, Sara, Samhanana, Pramana, Satmya, Sattva,
    Ahara Shakti, Vyayama Shakti, Vaya, and Ahara-Vihara / Agni.
    """
    STEPS = [
        "PRAKRITI",
        "VIKRITI",
        "SARA",
        "SAMHANANA",
        "PRAMANA",
        "SATMYA",
        "SATTVA",
        "AHARA_SHAKTI",
        "VYAYAMA_SHAKTI",
        "VAYA",
        "AHARA_VIHARA_AND_AGNI",
        "REVIEW_AND_CONFIRM"
    ]

    PROMPTS = {
        "PRAKRITI": {
            "hi": "आपकी स्वाभाविक शारीरिक प्रकृति क्या है? (वात - चंचल/हल्की, पित्त - उष्ण/तेज, कफ - शांत/दृढ़)",
            "en": "What is your primary innate constitution (Prakriti)? (Vata - dynamic/light, Pitta - sharp/warm, Kapha - calm/sturdy)",
            "pa": "ਤੁਹਾਡੀ ਕੁਦਰਤੀ ਪ੍ਰਕ੍ਰਿਤੀ (Prakriti) ਕੀ ਹੈ?"
        },
        "VIKRITI": {
            "hi": "वर्तमान में किस दोष का असंतुलन या विकृति महसूस हो रही है?",
            "en": "Which Doshic morbidity or imbalance (Vikriti) are you currently experiencing?",
            "pa": "ਮੌਜੂਦਾ ਸਮੇਂ ਕਿਹੜਾ ਦੋਸ਼ ਅਸੰਤੁਲਿਤ ਲੱਗ ਰਿਹਾ ਹੈ?"
        },
        "SARA": {
            "hi": "आपकी धातु सारता (टिश्यू उत्तमता: रस, रक्त, मांस, मेद, अस्थि, मज्जा, शुक्र) का स्तर कैसा है?",
            "en": "How would you rate your tissue essence/vitality (Sara: Rasa, Rakta, Mamsa, Meda, Asthi, Majja, Shukra)?",
            "pa": "ਤੁਹਾਡੀ ਧਾਤੂ ਸਾਰਤਾ ਕਿਵੇਂ ਹੈ?"
        },
        "SAMHANANA": {
            "hi": "शरीर की संहनन (शरीर का गठन/कॉम्पैक्टनेस) कैसी है?",
            "en": "What is your body compactness and musculoskeletal build (Samhanana)?",
            "pa": "ਸਰੀਰਕ ਗਠਨ (Samhanana) ਕਿਵੇਂ ਹੈ?"
        },
        "PRAMANA": {
            "hi": "शारीरिक प्रमाण (ऊंचाई और वजन का अनुपात) कैसा है?",
            "en": "What is your anthropometric proportion (Pramana: Height-to-Weight balance)?",
            "pa": "ਕੱਦ ਅਤੇ ਭਾਰ ਦਾ ਸੰਤੁਲਨ ਕਿਵੇਂ ਹੈ?"
        },
        "SATMYA": {
            "hi": "आपकी सात्म्यता (खान-पान और मौसम के प्रति अनुकूलन क्षमता) कैसी है?",
            "en": "What is your dietary and environmental habituation adaptability (Satmya)?",
            "pa": "ਖਾਣ-ਪੀਣ ਦੀ ਅਨੁਕੂਲਤਾ (Satmya) ਕਿਵੇਂ ਹੈ?"
        },
        "SATTVA": {
            "hi": "आपकी मानसिक शक्ति और तनाव सहने की क्षमता (सत्व) कैसी है?",
            "en": "What is your mental resilience and psychological strength (Sattva: Pravara/Madhyama/Avara)?",
            "pa": "ਮਾਨਸਿਕ ਸ਼ਕਤੀ (Sattva) ਕਿਵੇਂ ਹੈ?"
        },
        "AHARA_SHAKTI": {
            "hi": "आपकी आहार शक्ति (भूख/अभ्यवहरण शक्ति और पाचन/जरण शक्ति) कैसी है?",
            "en": "How is your digestive intake capacity (Abhyavaharana) and digestive power (Jarana Shakti)?",
            "pa": "ਭੁੱਖ ਅਤੇ ਹਜ਼ਮ ਕਰਨ ਦੀ ਸ਼ਕਤੀ (Ahara Shakti) ਕਿਵੇਂ ਹੈ?"
        },
        "VYAYAMA_SHAKTI": {
            "hi": "आपकी व्यायाम शक्ति (शारीरिक परिश्रम और सहनशक्ति) कैसी है?",
            "en": "What is your physical endurance and capacity for exertion (Vyayama Shakti)?",
            "pa": "ਕਸਰਤ ਅਤੇ ਮਿਹਨਤ ਦੀ ਸਮਰੱਥਾ ਕਿਵੇਂ ਹੈ?"
        },
        "VAYA": {
            "hi": "आप किस आयु वर्ग में आते हैं? (बाल्यावस्था, मध्यमावस्था, वृद्धावस्था)",
            "en": "What is your age stage (Vaya: Balya <16, Madhyama 16-60, Vriddha >60)?",
            "pa": "ਤੁਹਾਡੀ ਉਮਰ ਵਰਗ (Vaya) ਕੀ ਹੈ?"
        },
        "AHARA_VIHARA_AND_AGNI": {
            "hi": "आपकी जठराग्नि (समागिन/विषमाग्नि/तीक्ष्णाग्नि/मंदाग्नि), निद्रा और मल-मूत्र विसर्जन की स्थिति कैसी है?",
            "en": "How is your digestive fire (Agni: Sama/Visham/Teekshna/Manda), sleep pattern, and bowel habits?",
            "pa": "ਤੁਹਾਡੀ ਅਗਨੀ (Agni), ਨੀਂਦ ਅਤੇ ਪੇਟ ਸਾਫ਼ ਹੋਣ ਦੀ ਸਥਿਤੀ ਕਿਵੇਂ ਹੈ?"
        },
        "REVIEW_AND_CONFIRM": {
            "hi": "धन्यवाद! दशविध परीक्षा और आहार-विहार का विवरण सुरक्षित कर लिया गया है।",
            "en": "Thank you! The complete Dashavidha Pariksha assessment is recorded.",
            "pa": "ਧੰਨਵਾਦ! ਦਸ਼ਵਿਧ ਪ੍ਰੀਖਿਆ ਦਾ ਵੇਰਵਾ ਦਰਜ ਕਰ ਲਿਆ ਗਿਆ ਹੈ।"
        }
    }

    OPTIONS = {
        "PRAKRITI": [
            {"label": "वातज (Vataja)", "value": "vata"},
            {"label": "पित्तज (Pittaja)", "value": "pitta"},
            {"label": "कफज (Kaphaja)", "value": "kapha"},
            {"label": "द्विदोषज (Vata-Pitta / Pitta-Kapha)", "value": "dvidohaja"},
            {"label": "समदोषज (Tridoshic)", "value": "samadosha"}
        ],
        "VIKRITI": [
            {"label": "वात प्रकोप (Vata Aggravation: Joint pain, dryness)", "value": "vata_vikriti"},
            {"label": "पित्त प्रकोप (Pitta Aggravation: Burning, acidity, fever)", "value": "pitta_vikriti"},
            {"label": "कफ प्रकोप (Kapha Aggravation: Heaviness, congestion)", "value": "kapha_vikriti"},
            {"label": "सान्निपातिक (Complex Tridoshic)", "value": "sannipatika"}
        ],
        "SARA": [
            {"label": "प्रवर सार (High tissue vitality)", "value": "pravara"},
            {"label": "मध्यम सार (Moderate tissue vitality)", "value": "madhyama"},
            {"label": "अवर सार (Low tissue vitality)", "value": "avara"}
        ],
        "SAMHANANA": [
            {"label": "सुसंहत (Compact & Well-built)", "value": "su_samhanana"},
            {"label": "मध्यम (Moderate build)", "value": "madhyama"},
            {"label": "हीन (Poor / Fragile build)", "value": "heena"}
        ],
        "SATTVA": [
            {"label": "प्रवर सत्व (High mental resilience)", "value": "pravara_sattva"},
            {"label": "मध्यम सत्व (Moderate mental resilience)", "value": "madhyama_sattva"},
            {"label": "अवर सत्व (Low mental resilience)", "value": "avara_sattva"}
        ],
        "AHARA_SHAKTI": [
            {"label": "उत्तम भूख और पाचन / Excellent Intake & Digestion", "value": "pravara_ahara"},
            {"label": "मध्यम भूख / Moderate Digestion", "value": "madhyama_ahara"},
            {"label": "अवर भूख / Poor Appetite & Digestion", "value": "avara_ahara"}
        ],
        "AHARA_VIHARA_AND_AGNI": [
            {"label": "समागिन (Balanced Agni)", "value": "sama_agni"},
            {"label": "विषमाग्नि (Irregular Digestion / Bloating)", "value": "vishama_agni"},
            {"label": "तीक्ष्णाग्नि (Hyperactive / Acidic Agni)", "value": "teekshna_agni"},
            {"label": "मंदाग्नि (Sluggish Digestion / Heaviness)", "value": "manda_agni"}
        ]
    }

    @classmethod
    def get_next_prompt(cls, current_step: Optional[str], language: str = "hi") -> Dict[str, Any]:
        if not current_step:
            step = cls.STEPS[0]
        else:
            try:
                idx = cls.STEPS.index(current_step)
                step = cls.STEPS[idx + 1] if idx + 1 < len(cls.STEPS) else "REVIEW_AND_CONFIRM"
            except ValueError:
                step = cls.STEPS[0]

        return {
            "step": step,
            "step_index": cls.STEPS.index(step) + 1,
            "total_steps": len(cls.STEPS),
            "prompt_text": cls.PROMPTS[step].get(language, cls.PROMPTS[step]["en"]),
            "options": cls.OPTIONS.get(step, []),
            "is_last_step": (step == "REVIEW_AND_CONFIRM")
        }


# 3. Deterministic & LLM Slot Normalization Helper
KEYWORD_SLOT_MAP = {
    "chest": "chest_pain",
    "सीने": "chest_pain",
    "छाती": "chest_pain",
    "fever": "fever",
    "बुखार": "fever",
    "सांस": "shortness_of_breath",
    "breath": "shortness_of_breath",
    "वात": "vata",
    "पित्त": "pitta",
    "कफ": "kapha",
    "pitta": "pitta",
    "vata": "vata",
    "kapha": "kapha",
    "crushing": "crushing_pressure",
    "भारी": "crushing_pressure",
    "पसीना": "diaphoresis",
    "sweat": "diaphoresis",
    "sugar": "diabetes",
    "मधुमेह": "diabetes",
    "bp": "hypertension",
    "रक्तचाप": "hypertension"
}

async def normalize_input_to_slot(step: str, raw_text: str, options: List[Dict[str, str]]) -> str:
    """
    Normalizes unstructured speech transcript to standardized slot value:
    1. Direct match with defined options
    2. Deterministic keyword matching
    3. Google Gemini fallback normalization if available
    """
    cleaned = raw_text.strip().lower()

    # 1. Direct option match
    for opt in options:
        if opt["value"].lower() in cleaned or opt["label"].lower() in cleaned:
            return opt["value"]

    # 2. Deterministic keyword matching
    for kw, val in KEYWORD_SLOT_MAP.items():
        if kw in cleaned:
            return val

    # 3. Gemini API Fallback if available
    if settings.GEMINI_API_KEY and len(options) > 0:
        try:
            valid_values = [o["value"] for o in options]
            prompt = f"Map the patient's statement '{raw_text}' for clinical step '{step}' into one of these exact values: {valid_values}. Return only the exact value string."
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            async with httpx.AsyncClient(timeout=3.0) as client:
                r = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
                if r.status_code == 200:
                    text_out = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if text_out in valid_values:
                        return text_out
        except Exception:
            pass

    return raw_text
