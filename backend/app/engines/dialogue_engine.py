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
    AYUSH / Ayurveda Prashna & Dashavidha Pariksha State Machine (Full 11-Step Traversal).
    Translates classical Ayurvedic assessment into practical clinical interrogation:
    Prakriti, Vikriti (Doshic Imbalance), Sara (Vitality), Samhanana (Build),
    Pramana, Satmya (Adaptation), Sattva (Mental Resilience), Ahara Shakti (Appetite & Digestion),
    Vyayama Shakti, Vaya, and Ahara-Vihara & Agni-Koshtha.
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
            "hi": "शारीरिक प्रवृत्ति (प्रकृति): आपकी स्वाभाविक शारीरिक प्रकृति और त्वचा कैसी है? (वात: रूखी त्वचा व ठंड लगना, पित्त: गर्मी अधिक लगना व पसीना, कफ: भारीपन व तैलीय त्वचा)",
            "en": "Innate Constitution (Prakriti): What is your natural physical tendency? (Vata: dry skin, cold sensitivity; Pitta: heat sensitivity, quick hunger; Kapha: calm, oily skin, heaviness)",
            "pa": "ਤੁਹਾਡੀ ਕੁਦਰਤੀ ਸਰੀਰਕ ਪ੍ਰਕ੍ਰਿਤੀ (Prakriti) ਕੀ ਹੈ?"
        },
        "VIKRITI": {
            "hi": "दोष असंतुलन (विकृति): वर्तमान में आपकी बीमारी में किस दोष का मुख्य प्रभाव महसूस हो रहा है? (वात: तीव्र दर्द, जकड़न व वायु; पित्त: सीने में जलन, एसिडिटी व गर्माहट; कफ: बलगम, सुस्ती व भारीपन)",
            "en": "Current Imbalance (Vikriti): What is the main character of your discomfort? (Vata: sharp pain, joint stiffness, gas; Pitta: burning, acidity, feverishness; Kapha: heaviness, mucus, sluggishness)",
            "pa": "ਮੌਜੂਦਾ ਸਮੇਂ ਕਿਹੜਾ ਦੋਸ਼ ਅਸੰਤੁਲਿਤ ਲੱਗ ਰਿਹਾ ਹੈ?"
        },
        "SARA": {
            "hi": "धातु सारता (शारीरिक बल): आपकी शारीरिक ऊर्जा, मांसपेशियों की दृढ़ता और स्फूर्ति कैसी रहती है?",
            "en": "Tissue Vitality (Sara): How would you describe your overall physical stamina, muscle tone, and vital energy?",
            "pa": "ਤੁਹਾਡੀ ਧਾਤੂ ਸਾਰਤਾ ਅਤੇ ਊਰਜਾ ਕਿਵੇਂ ਹੈ?"
        },
        "SAMHANANA": {
            "hi": "शरीर गठन (संहनन): आपके शरीर का ढांचा और संहनन कैसा है? (सुगठित व मजबूत, सामान्य मध्यम, या कृश व कमजोर)",
            "en": "Body Compactness (Samhanana): What is your musculoskeletal compactness? (Compact & well-built, moderate, or lean & fragile)",
            "pa": "ਸਰੀਰਕ ਗਠਨ (Samhanana) ਕਿਵੇਂ ਹੈ?"
        },
        "PRAMANA": {
            "hi": "शारीरिक प्रमाण (ऊंचाई और वजन): क्या आपका वजन आपकी ऊंचाई के अनुसार संतुलित है या अधिक/कम है?",
            "en": "Physical Proportions (Pramana): Is your height-to-weight proportion balanced, overweight, or underweight?",
            "pa": "ਕੱਦ ਅਤੇ ਭਾਰ ਦਾ ਸੰਤੁਲਨ ਕਿਵੇਂ ਹੈ?"
        },
        "SATMYA": {
            "hi": "सात्म्यता (अनुकूलन): क्या बदलते मौसम या खान-पान में बदलाव से आपको तुरंत सर्दी, एलर्जी या पेट की तकलीफ़ हो जाती है?",
            "en": "Adaptability (Satmya): How easily do you adapt to weather changes, seasonal shifts, and varying diets without falling ill?",
            "pa": "ਖਾਣ-ਪੀਣ ਅਤੇ ਮੌਸਮ ਦੀ ਅਨੁਕੂਲਤਾ (Satmya) ਕਿਵੇਂ ਹੈ?"
        },
        "SATTVA": {
            "hi": "मानसिक बल (सत्व): आपकी मानसिक सहनशक्ति और तनाव सहने की क्षमता कैसी है? (धैर्यवान, मध्यम, या जल्दी चिंतित/उद्विग्न)",
            "en": "Mental Resilience (Sattva): How is your psychological strength and stress tolerance? (Calm & resilient, moderate, or easily anxious/irritable)",
            "pa": "ਮਾਨਸਿਕ ਸ਼ਕਤੀ (Sattva) ਕਿਵੇਂ ਹੈ?"
        },
        "AHARA_SHAKTI": {
            "hi": "आहार शक्ति (भूख व पाचन): भोजन के प्रति आपकी रुचि और भोजन पचने की गति कैसी है?",
            "en": "Digestive Intake Capacity (Ahara Shakti): How is your appetite intake capacity and ease of digestion after regular meals?",
            "pa": "ਭੁੱਖ ਅਤੇ ਹਜ਼ਮ ਕਰਨ ਦੀ ਸ਼ਕਤੀ (Ahara Shakti) ਕਿਵੇਂ ਹੈ?"
        },
        "VYAYAMA_SHAKTI": {
            "hi": "व्यायाम शक्ति (परिश्रम क्षमता): सीढ़ियां चढ़ने या तेज़ चलने पर आपकी सांस फूलने या थकने की क्या स्थिति है?",
            "en": "Physical Exertion Capacity (Vyayama Shakti): What is your endurance when climbing stairs or engaging in physical labor?",
            "pa": "ਕਸਰਤ ਅਤੇ ਮਿਹਨਤ ਦੀ ਸਮਰੱਥਾ ਕਿਵੇਂ ਹੈ?"
        },
        "VAYA": {
            "hi": "आयु वर्ग (वय): आप किस आयु वर्ग में आते हैं? (बाल्यावस्था, मध्यमावस्था, वृद्धावस्था)",
            "en": "Age Stage (Vaya): Which age demographic represents you? (Balya <16, Madhyama 16-60, Vriddha >60)?",
            "pa": "ਤੁਹਾਡੀ ਉਮਰ ਵਰਗ (Vaya) ਕੀ ਹੈ?"
        },
        "AHARA_VIHARA_AND_AGNI": {
            "hi": "जठराग्नि व कोष्ठ (पाचन, नींद व पेट की स्थिति): क्या आपको खट्टी डकारें, गैस, कब्ज या अनिद्रा की शिकायत रहती है?",
            "en": "Agni, Koshtha & Nidra: Do you experience acid reflux, bloating, hard/irregular stools, or poor sleep quality?",
            "pa": "ਤੁਹਾਡੀ ਅਗਨੀ (Agni), ਨੀਂਦ ਅਤੇ ਪੇਟ ਸਾਫ਼ ਹੋਣ ਦੀ ਸਥਿਤੀ ਕਿਵੇਂ ਹੈ?"
        },
        "REVIEW_AND_CONFIRM": {
            "hi": "धन्यवाद! आयुर्वेदिक रोग एवं दशविध परीक्षा का पूर्ण विवरण दर्ज कर लिया गया है।",
            "en": "Thank you! The complete clinical Ayurvedic Prashna & Dashavidha Pariksha is recorded.",
            "pa": "ਧੰਨਵਾਦ! ਦਸ਼ਵਿਧ ਪ੍ਰੀਖਿਆ ਦਾ ਵੇਰਵਾ ਦਰਜ ਕਰ ਲਿਆ ਗਿਆ ਹੈ।"
        }
    }

    OPTIONS = {
        "PRAKRITI": [
            {"label": "वातज (रूखी त्वचा, ठंड लगना, चंचल गति / Vata)", "value": "vata"},
            {"label": "पित्तज (अधिक गर्मी, लालिमा, तीक्ष्ण भूख / Pitta)", "value": "pitta"},
            {"label": "कफज (तैलीय त्वचा, शांत मन, भारीपन / Kapha)", "value": "kapha"},
            {"label": "द्विदोषज (वात-पित्त / कफ-वात / Dual Dosha)", "value": "dvidohaja"},
            {"label": "समदोषज (संतुलित त्रिदोष / Tridoshic)", "value": "samadosha"}
        ],
        "VIKRITI": [
            {"label": "वात प्रकोप (जोड़ों में दर्द, जकड़न, सूखापन व गैस)", "value": "vata_vikriti"},
            {"label": "पित्त प्रकोप (सीने में जलन, एसिडिटी, पित्त व गर्माहट)", "value": "pitta_vikriti"},
            {"label": "कफ प्रकोप (भारीपन, बलगम, आलस्य व सुस्ती)", "value": "kapha_vikriti"},
            {"label": "आमवात / त्रिदोषज (सूजन, तीव्र जकड़न व भारीपन)", "value": "sannipatika"}
        ],
        "SARA": [
            {"label": "प्रवर सार (उत्तम शारीरिक स्फूर्ति व बल / High Vitality)", "value": "pravara"},
            {"label": "मध्यम सार (सामान्य ऊर्जा / Moderate Vitality)", "value": "madhyama"},
            {"label": "अवर सार (थकान, कमजोरी व शिथिलता / Low Vitality)", "value": "avara"}
        ],
        "SAMHANANA": [
            {"label": "सुसंहत (सुगठित व संतुलित शरीर / Well-built)", "value": "su_samhanana"},
            {"label": "मध्यम (सामान्य गठन / Moderate build)", "value": "madhyama"},
            {"label": "हीन (कमजोर व पतला गठन / Lean & fragile)", "value": "heena"}
        ],
        "SATTVA": [
            {"label": "प्रवर सत्व (धैर्यवान व तनाव सहने में सक्षम / High Resilience)", "value": "pravara_sattva"},
            {"label": "मध्यम सत्व (सामान्य मनोबल / Moderate)", "value": "madhyama_sattva"},
            {"label": "अवर सत्व (जल्दी घबराने वाला / Low Resilience)", "value": "avara_sattva"}
        ],
        "AHARA_SHAKTI": [
            {"label": "उत्तम भूख और समय पर पाचन / Excellent Digestion", "value": "pravara_ahara"},
            {"label": "मध्यम भूख (हल्का भोजन सुपाच्य) / Moderate Digestion", "value": "madhyama_ahara"},
            {"label": "मंद भूख (भूख न लगना व भारीपन) / Sluggish Digestion", "value": "avara_ahara"}
        ],
        "AHARA_VIHARA_AND_AGNI": [
            {"label": "समागिन (संतुलित पाचन व प्रतिदिन सामान्य पेट साफ़)", "value": "sama_agni"},
            {"label": "विषमाग्नि व क्रूर कोष्ठ (अनियमित भूख, गैस, पेट फूलना व कब्ज)", "value": "vishama_agni"},
            {"label": "तीक्ष्णाग्नि व मृदु कोष्ठ (अति-भूख, सीने में जलन व दस्त की प्रवृत्ति)", "value": "teekshna_agni"},
            {"label": "मंदाग्नि व साम अवस्था (भूख न लगना, पेट भारी व चिकना मल)", "value": "manda_agni"}
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
