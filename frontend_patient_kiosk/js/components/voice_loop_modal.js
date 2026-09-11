/**
 * MediKiosk Multimodal Clinical Dialogue & Conversational Voice Loop Component
 * Includes:
 * 1. Multilingual Audio Playback for Allopathy & Ayurveda Dashavidha Pariksha
 * 2. Live On-Screen Real-Time Speech-to-Text Transcription & Translation
 * 3. 100% Consistent UI Translation for all 8 Indian Languages
 * 4. Hospital-Friendly Clean Clinical White Aesthetic
 */
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";
import { apiService } from "../api_service.js";
import { getTranslation } from "../config.js";

export function renderVoiceLoop(container, onCompleteIntake) {
    const state = kioskState.getState();
    const isAyush = state.discipline === "AYUSH";
    const lang = state.language || "hi";
    const t = getTranslation(lang);

    // 1. Comprehensive Allopathic Steps (SOCRATES Framework) with 8 Languages
    const allopathySteps = [
        {
            key: "chief_complaint",
            stepNum: 1,
            title: {
                hi: "आपकी मुख्य तकलीफ़ या बीमारी क्या है?",
                pa: "ਤੁਹਾਡੀ ਮੁੱਖ ਤਕਲੀਫ਼ ਜਾਂ ਬਿਮਾਰੀ ਕੀ ਹੈ?",
                bn: "আপনার প্রধান শারীরিক সমস্যা কি?",
                ta: "உங்கள் முக்கிய உடல்நலப் பிரச்சினை என்ன?",
                te: "మీ ప్రధాన ఆరోగ్య సమస్య ఏమిటి?",
                mr: "तुमचा मुख्य त्रास किंवा आजार काय आहे?",
                gu: "તમારી મુખ્ય તકલીફ અથવા બીમારી શું છે?",
                en: "What is your chief medical complaint today?"
            },
            audioPrompt: {
                hi: "कृपया बताएं कि आज आपको क्या मुख्य तकलीफ़ या बीमारी है?",
                pa: "ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਅੱਜ ਤੁਹਾਨੂੰ ਕੀ ਮੁੱਖ ਤਕਲੀਫ਼ ਜਾਂ ਬਿਮਾਰੀ ਹੈ?",
                bn: "দয়া করে বলুন আজকে আপনার প্রধান শারীরিক সমস্যা কি?",
                ta: "இன்று உங்களுக்கு இருக்கும் முக்கிய உடல்நலப் பிரச்சினையைக் கூறுங்கள்.",
                te: "దయచేసి ఈ రోజు మీ ప్రధాన ఆరోగ్య సమస్యను తెలియజేయండి.",
                mr: "कृपया सांगा की आज तुम्हाला कोणता मुख्य त्रास किंवा आजार आहे?",
                gu: "કૃપા કરીને જણાવો કે આજે તમને શું મુખ્ય તકલીફ છે?",
                en: "Please tell us what your primary symptom or health issue is today."
            },
            chips: {
                hi: ["छाती में दर्द", "तेज़ बुखार", "सिरदर्द", "घुटनों में दर्द", "पेट में दर्द", "खांसी व ज़ुकाम"],
                pa: ["ਛਾਤੀ ਵਿੱਚ ਦਰਦ", "ਤੇਜ਼ ਬੁਖਾਰ", "ਸਿਰਦਰਦ", "ਗੋਡਿਆਂ ਵਿੱਚ ਦਰਦ", "ਢਿੱਡ ਦਰਦ", "ਖੰਘ ਤੇ ਜ਼ੁਕਾਮ"],
                bn: ["বুকে ব্যথা", "তীব্র জ্বর", "মাথাব্যথা", "হাঁটুতে ব্যথা", "পেটে ব্যথা", "কাশি ও সর্দি"],
                ta: ["மார்பு வலி", "கடுமையான காய்ச்சல்", "தலைவலி", "மூட்டு வலி", "வயிற்று வலி", "இருமல் சளி"],
                te: ["ఛాతీ నొప్పి", "తీవ్ర జ్వరం", "తలనొప్పి", "కీళ్ల నొప్పులు", "కడుపు నొప్పి", "దగ్గు జలుబు"],
                mr: ["छातीत दुखणे", "तीव्र ताप", "डोकेदुखी", "गुडघेदुखी", "पोटदुखी", "खोकला आणि सर्दी"],
                gu: ["છાતીમાં દુખાવો", "તીવ્ર તાવ", "માથાનો દુખાવો", "ઘૂંટણમાં દુખાવો", "પેટમાં દુખાવો", "ખાંસી શરદી"],
                en: ["Chest Pain", "High Fever", "Headache", "Knee & Joint Pain", "Stomach Pain", "Cough & Cold"]
            }
        },
        {
            key: "onset_and_timing",
            stepNum: 2,
            title: {
                hi: "यह समस्या कब और कैसे शुरू हुई?",
                pa: "ਇਹ ਸਮੱਸਿਆ ਕਦੋਂ ਅਤੇ ਕਿਵੇਂ ਸ਼ੁਰੂ ਹੋਈ?",
                bn: "এই সমস্যাটি কখন এবং কীভাবে শুরু হয়েছিল?",
                ta: "இந்த பிரச்சினை எப்போது, எப்படி தொடங்கியது?",
                te: "ఈ సమస్య ఎప్పుడు మరియు ఎలా ప్రారంభమైంది?",
                mr: "हा त्रास कधी आणि कसा सुरू झाला?",
                gu: "આ સમસ્યા ક્યારે અને કેવી રીતે શરૂ થઈ?",
                en: "When and how did these symptoms start?"
            },
            audioPrompt: {
                hi: "यह तकलीफ़ कितने दिनों से है और अचानक शुरू हुई या धीरे-धीरे?",
                pa: "ਇਹ ਤਕਲੀਫ਼ ਕਿੰਨੇ ਦਿਨਾਂ ਤੋਂ ਹੈ ਅਤੇ ਅਚਾਨਕ ਸ਼ੁਰੂ ਹੋਈ ਜਾਂ ਹੌਲੀ-ਹੌਲੀ?",
                bn: "এই সমস্যা কতদিন ধরে এবং হঠাৎ শুরু হয়েছিল নাকি ধীরে ধীরে?",
                ta: "இந்த பிரச்சினை எத்தனை நாட்களாக உள்ளது, திடீரென தொடங்கியதா அல்லது மெதுவாகவா?",
                te: "ఈ సమస్య ఎన్ని రోజులుగా ఉంది మరియు అకస్మాత్తుగా ప్రారంభమైందా?",
                mr: "हा त्रास किती दिवसांपासून आहे आणि अचानक सुरू झाला का हळूहळू?",
                gu: "આ તકલીફ કેટલા દિવસથી છે અને અચાનક શરૂ થઈ કે ધીમે ધીમે?",
                en: "How long have you had these symptoms, and did they start suddenly or gradually?"
            },
            chips: {
                hi: ["आज अचानक", "2-3 दिन से", "1 सप्ताह से", "1 महीने से अधिक"],
                pa: ["ਅੱਜ ਅਚਾਨਕ", "2-3 ਦਿਨਾਂ ਤੋਂ", "1 ਹਫ਼ਤੇ ਤੋਂ", "1 ਮਹੀਨੇ ਤੋਂ ਵੱਧ"],
                bn: ["আজ হঠাৎ", "২-৩ দিন ধরে", "১ সপ্তাহ ধরে", "১ মাসের বেশি"],
                ta: ["இன்று திடீரென", "2-3 நாட்களாக", "1 வாரமாக", "1 மாதத்திற்கும் மேலாக"],
                te: ["ఈ రోజు అకస్మాత్తుగా", "2-3 రోజులుగా", "1 వారంగా", "1 నెలకు పైగా"],
                mr: ["आज अचानक", "२-३ दिवसांपासून", "१ आठवड्यापासून", "१ महिन्यापेक्षा जास्त"],
                gu: ["આજે અચાનક", "૨-૩ દિવસથી", "૧ અઠવાડિયાથી", "૧ મહિનાથી વધુ"],
                en: ["Suddenly Today", "For 2-3 Days", "For 1 Week", "More than 1 Month"]
            }
        },
        {
            key: "character_and_severity",
            stepNum: 3,
            title: {
                hi: "तकलीफ़ की तीव्रता और प्रकार कैसा है?",
                pa: "ਦਰਦ ਦਾ ਪ੍ਰਕਾਰ ਅਤੇ ਗੰਭੀਰਤਾ ਕਿਹੋ ਜਿਹੀ ਹੈ?",
                bn: "ব্যথার তীব্রতা এবং ধরন কেমন?",
                ta: "வலியின் தீவிரம் மற்றும் தன்மை எப்படி உள்ளது?",
                te: "నొప్పి తీవ్రత మరియు స్వభావం ఎలా ఉంది?",
                mr: "त्रासाची तीव्रता आणि प्रकार कसा आहे?",
                gu: "તકલીફની તીવ્રતા અને પ્રકાર કેવો છે?",
                en: "How would you describe the character & severity?"
            },
            audioPrompt: {
                hi: "दर्द का प्रकार कैसा है — भारीपन, तीव्र चुभन, या जलन जैसा?",
                pa: "ਦਰਦ ਕਿਸ ਤਰ੍ਹਾਂ ਦਾ ਹੈ — ਭਾਰੀਪਨ, ਤਿੱਖੀ ਚੁਭਣ ਜਾਂ ਜਲਣ ਵਰਗਾ?",
                bn: "ব্যথা কেমন — ভারী ভাব, তীব্র খোঁচা নাকি জ্বালাপোড়া?",
                ta: "வலி எப்படி இருக்கிறது — பாரம், குத்துதல் அல்லது எரிச்சல் போன்றதா?",
                te: "నొప్పి ఎలా ఉంది — బరువుగా, తీవ్రంగా పొడుస్తున్నట్లు లేదా మంటగా ఉందా?",
                mr: "दुखणे कसे आहे — जडपणा, तीव्र टोचणे की जळजळ?",
                gu: "દુખાવો કેવો છે — ભારેપણું, તીવ્ર ખૂંચવું કે બળતરા?",
                en: "Is the discomfort heavy, sharp, stabbing, or burning?"
            },
            chips: {
                hi: ["भारीपन व दबाव", "तीव्र चुभन", "जलन", "हल्का दर्द", "लगातार बना रहता है"],
                pa: ["ਭਾਰੀਪਨ ਤੇ ਦਬਾਅ", "ਤਿੱਖੀ ਚੁਭਣ", "ਜਲਣ", "ਹਲਕਾ ਦਰਦ", "ਲਗਾਤਾਰ ਬਣਿਆ ਰਹਿੰਦਾ ਹੈ"],
                bn: ["ভারী ভাব ও চাপ", "তীব্র খোঁচা", "জ্বালাপোড়া", "হালকা ব্যথা", "ক্রমাগত থাকে"],
                ta: ["பாரம் மற்றும் அழுத்தம்", "கடுமையான குத்துதல்", "எரிச்சல்", "லேசான வலி", "தொடர்ந்து உள்ளது"],
                te: ["బరువు & ఒత్తిడి", "తీవ్ర పొడుపు", "మంట", "తేలికపాటి నొప్పి", "నిరంతరం ఉంటుంది"],
                mr: ["जडपणा आणि दाब", "तीव्र टोचणे", "जळजळ", "हलके दुखणे", "सतत राहते"],
                gu: ["ભારેપણું અને દબાણ", "તીવ્ર ખૂંચવું", "બળતરા", "હળવો દુખાવો", "સતત રહે છે"],
                en: ["Heavy Pressure", "Sharp / Stabbing", "Burning", "Mild Ache", "Constant Pain"]
            }
        },
        {
            key: "associated_symptoms",
            stepNum: 4,
            title: {
                hi: "क्या कोई अन्य लक्षण भी हैं (पसीना, घबराहट, सांस फूलना)?",
                pa: "ਕੀ ਕੋਈ ਹੋਰ ਲੱਛਣ ਹਨ (ਪਸੀਨਾ, ਘਬਰਾਹਟ, ਸਾਹ ਚੜ੍ਹਨਾ)?",
                bn: "অন্য কোন লক্ষণ আছে কি (ঘাম, অস্বস্তি, শ্বাসকষ্ট)?",
                ta: "வேறு ஏதேனும் அறிகுறிகள் உள்ளதா (வியர்வை, படபடப்பு, மூச்சுத்திணறல்)?",
                te: "ఇతర లక్షణాలు ఏమైనా ఉన్నాయా (చెమటలు, దడ, శ్వాస తీసుకోవడంలో ఇబ్బంది)?",
                mr: "इतर काही लक्षणे आहेत का (घाम, अस्वस्थता, दम लागणे)?",
                gu: "શું અન્ય કોઈ લક્ષણો છે (પરસેવો, ગભરાટ, શ્વાસ ચડવો)?",
                en: "Are there any associated symptoms like sweating or shortness of breath?"
            },
            audioPrompt: {
                hi: "क्या पसीना आना, घबराहट, चक्कर या सांस फूलने जैसे लक्षण हैं?",
                pa: "ਕੀ ਪਸੀਨਾ ਆਉਣਾ, ਘਬਰਾਹਟ, ਚੱਕਰ ਜਾਂ ਸਾਹ ਫੁੱਲਣ ਵਰਗੇ ਲੱਛਣ ਹਨ?",
                bn: "ঘাম, ঘাবড়ানি, মাথা ঘোরা বা শ্বাসকষ্ট আছে কি?",
                ta: "அதிக வியர்வை, படபடப்பு, மயக்கம் அல்லது மூச்சுத்திணறல் உள்ளதா?",
                te: "చెమట, దడ, తలతిరగడం లేదా ఆయాసం వంటి లక్షణాలు ఉన్నాయా?",
                mr: "घाम येणे, अस्वस्थता, चक्कर किंवा दम लागणे अशी लक्षणे आहेत का?",
                gu: "પરસેવો, ગભરાટ, ચક્કર અથવા શ્વાસ ચડવા જેવા લક્ષણો છે?",
                en: "Are you experiencing profuse sweating, dizziness, nausea, or breathing difficulty?"
            },
            chips: {
                hi: ["पसीना व घबराहट", "सांस फूलना", "उल्टी व मितली", "कोई अन्य लक्षण नहीं"],
                pa: ["ਪਸੀਨਾ ਤੇ ਘਬਰਾਹਟ", "ਸਾਹ ਚੜ੍ਹਨਾ", "ਉਲਟੀ ਤੇ ਮਤਲੀ", "ਕੋਈ ਹੋਰ ਲੱਛਣ ਨਹੀਂ"],
                bn: ["ঘাম ও অস্বস্তি", "শ্বাসকষ্ট", "বমি ভাব", "অন্য কোন লক্ষণ নেই"],
                ta: ["வியர்வை மற்றும் படபடப்பு", "மூச்சுத்திணறல்", "வாந்தி உணர்வு", "வேறு அறிகுறிகள் இல்லை"],
                te: ["చెమట & దడ", "ఆయాసం", "వాంతులు", "ఇతర లక్షణాలు లేవు"],
                mr: ["घाम व अस्वस्थता", "दम लागणे", "उलटी व मळमळ", "इतर काही लक्षण नाही"],
                gu: ["પરસેવો અને ગભરાટ", "શ્વાસ ચડવો", "ઊલટી અને ઉબકા", "અન્ય કોઈ લક્ષણ નથી"],
                en: ["Sweating & Palpitations", "Shortness of Breath", "Nausea & Vomiting", "No Other Symptoms"]
            }
        },
        {
            key: "past_medical_and_meds",
            stepNum: 5,
            title: {
                hi: "पूर्व बीमारी या वर्तमान दवाएं",
                pa: "ਪਿਛਲੀ ਬਿਮਾਰੀ ਜਾਂ ਚੱਲ ਰਹੀਆਂ ਦਵਾਈਆਂ",
                bn: "পূর্ববর্তী রোগ বা বর্তমান ওষুধ",
                ta: "முந்தைய நோய்கள் அல்லது தற்போதைய மருந்துகள்",
                te: "గత వైద్య చరిత్ర లేదా వాడుతున్న మందులు",
                mr: "मागील आजार किंवा सध्याची औषधे",
                gu: "અગાઉની બીમારી અથવા ચાલુ દવાઓ",
                en: "Past medical history & ongoing medications"
            },
            audioPrompt: {
                hi: "क्या आपको पहले से ब्लड प्रेशर, शुगर, थायराइड या दिल की बीमारी है?",
                pa: "ਕੀ ਤੁਹਾਨੂੰ ਪਹਿਲਾਂ ਤੋਂ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ, ਸ਼ੂਗਰ ਜਾਂ ਦਿਲ ਦੀ ਬਿਮਾਰੀ ਹੈ?",
                bn: "আপনার কি আগে থেকেই উচ্চ রক্তচাপ, ডায়াবেটিস বা হৃদরোগ আছে?",
                ta: "உங்களுக்கு ரத்த அழுத்தம், சர்க்கரை அல்லது இதய நோய் உள்ளதா?",
                te: "మీకు బీపీ, షుగర్ లేదా గుండె సంబంధిత సమస్యలు ఉన్నాయా?",
                mr: "तुम्हाला पूर्वीपासून बीपी, मधुमेह किंवा हृदयाचा त्रास आहे का?",
                gu: "શું તમને પહેલાથી બ્લડ પ્રેશર, ડાયાબિટીસ અથવા હૃદયની બીમારી છે?",
                en: "Do you have a history of hypertension, diabetes, or heart conditions?"
            },
            chips: {
                hi: ["डायबिटीज (शुगर)", "हाई बीपी", "थायराइड", "कोई पूर्व बीमारी नहीं"],
                pa: ["ਸ਼ੂਗਰ (ਡਾਇਬਟੀਜ਼)", "ਹਾਈ ਬੀ.ਪੀ.", "ਥਾਈਰੋਇਡ", "ਕੋਈ ਪਿਛਲੀ ਬਿਮਾਰੀ ਨਹੀਂ"],
                bn: ["ডায়াবেটিস", "উচ্চ রক্তচাপ", "থাইরয়েড", "কোন পূর্ববর্তী রোগ নেই"],
                ta: ["சர்க்கரை நோய்", "உயர் ரத்த அழுத்தம்", "தைராய்டு", "முந்தைய நோய்கள் இல்லை"],
                te: ["డయాబెటిస్", "హై బీపీ", "థైరాయిడ్", "మునుపటి వ్యాధులు లేవు"],
                mr: ["मधुमेह", "उच्च रक्तदाब", "थायरॉईड", "मागील कोणताही आजार नाही"],
                gu: ["ડાયાબિટીસ", "હાઈ બ્લડ પ્રેશર", "થાઈરોઈડ", "અગાઉની કોઈ બીમારી નથી"],
                en: ["Diabetes Mellitus", "Hypertension (High BP)", "Thyroid Disorder", "No Prior Conditions"]
            }
        }
    ];

    // 2. Comprehensive AYUSH / Ayurveda Steps (Dashavidha Pariksha) with 8 Languages
    const ayushSteps = [
        {
            key: "chief_complaint",
            stepNum: 1,
            title: {
                hi: "आपकी मुख्य व्याधि या रोग लक्षण क्या हैं? (रोग परीक्षा)",
                pa: "ਤੁਹਾਡੀ ਮੁੱਖ ਬਿਮਾਰੀ ਜਾਂ ਰੋਗ ਲੱਛਣ ਕੀ ਹਨ? (ਰੋਗ ਪ੍ਰੀਖਿਆ)",
                bn: "আপনার প্রধান রোগ বা রোগের লক্ষণ কি? (রোগ পরীক্ষা)",
                ta: "உங்கள் முக்கிய நோய் அல்லது அறிகுறிகள் என்ன? (ரோக பரீக்ஷா)",
                te: "మీ ప్రధాన వ్యాధి లేదా రోగ లక్షణాలు ఏమిటి? (రోగ పరీక్ష)",
                mr: "तुमचा मुख्य आजार किंवा रोगाची लक्षणे काय आहेत? (रोग परीक्षा)",
                gu: "તમારી મુખ્ય વ્યાધિ અથવા રોગના લક્ષણો શું છે? (રોગ પરીક્ષા)",
                en: "What are your primary symptoms / Roga Lakshana?"
            },
            audioPrompt: {
                hi: "कृपया बताएं कि आपको क्या मुख्य शारीरिक या मानसिक तकलीफ़ है?",
                pa: "ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਤੁਹਾਨੂੰ ਕੀ ਮੁੱਖ ਸਰੀਰਕ ਜਾਂ ਮਾਨਸਿਕ ਤਕਲੀਫ਼ ਹੈ?",
                bn: "দয়া করে বলুন আপনার প্রধান শারীরিক বা মানসিক কষ্ট কি?",
                ta: "உங்களுக்கு இருக்கும் முக்கிய உடல் அல்லது மனரீதியான தொல்லைகளைக் கூறுங்கள்.",
                te: "దయచేసి మీ ప్రధాన శారీరక లేదా మానసిక సమస్యను చెప్పండి.",
                mr: "कृपया सांगा की तुम्हाला कोणता मुख्य शारीरिक किंवा मानसिक त्रास आहे?",
                gu: "કૃપા કરીને જણાવો કે તમને શું મુખ્ય શારીરિક કે માનસિક તકલીફ છે?",
                en: "Please state your primary clinical complaint according to Ayurvedic Roga Pariksha."
            },
            chips: {
                hi: ["संधिवात (जोड़ों का दर्द)", "अम्लपित्त (गैस / एसिडिटी)", "मंदाग्नि (भूख न लगना)", "अनिद्रा व तनाव", "त्वचा रोग / खुजली", "श्वास व कास (दमा)"],
                pa: ["ਸੰਧੀਵਾਤ (ਜੋੜਾਂ ਦਾ ਦਰਦ)", "ਤੇਜ਼ਾਬ / ਗੈਸ", "ਮੰਦਾਗਨੀ (ਭੁੱਖ ਨਾ ਲੱਗਣਾ)", "ਨੀਂਦ ਨਾ ਆਉਣਾ", "ਚਮੜੀ ਰੋਗ", "ਦਮਾ ਤੇ ਖੰਘ"],
                bn: ["গাঁটের ব্যথা", "অম্বল ও গ্যাস", "ক্ষুধামান্দ্য", "অনিদ্রা ও মানসিক চাপ", "চর্মরোগ", "হাঁপানি ও কাশি"],
                ta: ["மூட்டு வலி (வாத நோய்)", "அமிலத்தன்மை (அசிடிட்டி)", "பசியின்மை", "தூக்கமின்மை", "தோல் நோய்", "ஆஸ்துமா இருமல்"],
                te: ["కీళ్ళ వాతం", "ఎసిడిటీ / గ్యాస్", "ఆకలి లేకపోవడం", "నిద్రలేమి", "చర్మ వ్యాధులు", "ఉబ్బసం దగ్గు"],
                mr: ["संधिवात", "आम्लपित्त (ॲसिडिटी)", "भूक मंदावणे", "निद्रानाश", "त्वचारोग", "दमा व खोकला"],
                gu: ["સંધિવાત (સાંધાનો દુખાવો)", "એસિડિટી", "ભૂખ ન લાગવી", "ઊંઘ ન આવવી", "ચામડીના રોગ", "દમ અને ખાંસી"],
                en: ["Sandhivata (Joint Pain)", "Amlapitta (Hyperacidity)", "Mandagni (Indigestion)", "Insomnia & Stress", "Twak Roga (Skin Allergy)", "Shwasa-Kasa (Asthma)"]
            }
        },
        {
            key: "dosha_prakriti",
            stepNum: 2,
            title: {
                hi: "आपकी शारीरिक प्रकृति और दोष प्रवृत्ति क्या है? (प्रकृति परीक्षा)",
                pa: "ਤੁਹਾਡੀ ਸਰੀਰਕ ਪ੍ਰਕ੍ਰਿਤੀ ਅਤੇ ਦੋਸ਼ ਪ੍ਰਵਿਰਤੀ ਕੀ ਹੈ? (ਪ੍ਰਕ੍ਰਿਤੀ ਪਰੀਖਿਆ)",
                bn: "আপনার শারীরিক প্রকৃতি ও দোষের প্রবণতা কি? (প্রকৃতি পরীক্ষা)",
                ta: "உங்கள் பிரகிருதி மற்றும் தோஷ நிலை என்ன? (பிரகிருதி பரீக்ஷா)",
                te: "మీ శరీర ప్రకృతి మరియు దోష లక్షణాలు ఏమిటి? (ప్రకృతి పరీక్ష)",
                mr: "तुमची शारीरिक प्रकृती आणि दोष कल काय आहे? (प्रकृती परीक्षा)",
                gu: "તમારી શારીરિક પ્રકૃતિ અને દોષ પ્રવૃત્તિ શું છે? (પ્રકૃતિ પરીક્ષા)",
                en: "What is your primary Dosha constitution / Prakriti Pariksha?"
            },
            audioPrompt: {
                hi: "क्या आपको अधिक ठंड लगती है, गर्मी सहन नहीं होती, या शरीर भारी रहता है?",
                pa: "ਕੀ ਤੁਹਾਨੂੰ ਜ਼ਿਆਦਾ ਠੰਢ ਲੱਗਦੀ ਹੈ, ਗਰਮੀ ਬਰਦਾਸ਼ਤ ਨਹੀਂ ਹੁੰਦੀ ਜਾਂ ਸਰੀਰ ਭਾਰੀ ਰਹਿੰਦਾ ਹੈ?",
                bn: "আপনার কি বেশি ঠান্ডা লাগে, গরম সহ্য হয় না নাকি শরীর ভারী লাগে?",
                ta: "உங்களுக்கு அதிக குளிர் பிடிக்காதா, வெப்பம் தாங்க முடியாதா அல்லது உடல் கனமாக உள்ளதா?",
                te: "మీకు చలి ఎక్కువగా అనిపిస్తుందా, వేడి తట్టుకోలేరా లేదా శరీరం బరువుగా ఉంటుందా?",
                mr: "तुम्हाला जास्त थंडी वाजते, उष्णता सहन होत नाही की शरीर जड वाटते?",
                gu: "તમને વધુ ઠંડી લાગે છે, ગરમી સહન થતી નથી કે શરીર ભારે રહે છે?",
                en: "Do you experience cold sensitivity (Vata), heat intolerance (Pitta), or heaviness/sluggishness (Kapha)?"
            },
            chips: {
                hi: ["वात (ठंड लगना, सूखापन, जोड़ों में दर्द)", "पित्त (जलन, अत्यधिक पसीना, गुस्सा)", "कफ (भारीपन, आलस्य, बलगम)", "द्विदोषज (वात-पित्त / कफ-वात)"],
                pa: ["ਵਾਤ (ਠੰਢ ਲੱਗਣਾ, ਸੁੱਕਾਪਨ)", "ਪਿੱਤ (ਜਲਣ, ਜ਼ਿਆਦਾ ਪਸੀਨਾ)", "ਕਫ਼ (ਭਾਰੀਪਨ, ਸੁਸਤੀ)", "ਦੋਵੇਂ ਦੋਸ਼"],
                bn: ["বাত (ঠান্ডা লাগা, শুষ্কতা)", "পিত্ত (জ্বালা, অতিরিক্ত ঘাম)", "কফ (ভারী ভাব, আলস্য)", "মিশ্র দোষ"],
                ta: ["வாதம் (குளிர், வறட்சி, வலி)", "பித்தம் (எரிச்சல், அதிக வியர்வை)", "கபம் (கனம், மந்தம்)", "இரட்டை தோஷம்"],
                te: ["వాతం (చలి, పొడిబారడం)", "పిత్తం (మంట, అధిక చెమట)", "కఫం (బరువు, బద్ధకం)", "ద్విదోషాలు"],
                mr: ["वात (थंडी वाजणे, कोरडेपणा)", "पित्त (जळजळ, घाम)", "कफ (जडपणा, आळस)", "द्विदोषज"],
                gu: ["વાત (ઠંડી લાગવી, શુષ્કતા)", "પિત્ત (બળતરા, પરસેવો)", "કફ (ભારેપણું, આળસ)", "મિશ્ર દોષ"],
                en: ["Vata (Cold sensitivity, Dryness, Pain)", "Pitta (Burning sensation, Acidity, Heat)", "Kapha (Heaviness, Lethargy, Congestion)", "Dual Dosha (Vata-Pitta / Kapha-Vata)"]
            }
        },
        {
            key: "agni_ahara",
            stepNum: 3,
            title: {
                hi: "आपकी पाचन शक्ति (अग्नि) और आहार कैसा है? (अग्नि परीक्षा)",
                pa: "ਤੁਹਾਡੀ ਪਾਚਨ ਸ਼ਕਤੀ (ਅਗਨੀ) ਅਤੇ ਖੁਰਾਕ ਕਿਹੋ ਜਿਹੀ ਹੈ? (ਅਗਨੀ ਪਰੀਖਿਆ)",
                bn: "আপনার হজম ক্ষমতা (অগ্নি) এবং খাদ্যাভ্যাস কেমন? (অগ্নি পরীক্ষা)",
                ta: "உங்கள் செரிமான சக்தி (அக்னி) மற்றும் உணவு முறை எப்படி உள்ளது?",
                te: "మీ జీర్ణశక్తి (అగ్ని) మరియు ఆహారపు అలవాట్లు ఎలా ఉన్నాయి?",
                mr: "तुमची पचनशक्ती (अग्नी) आणि आहार कसा आहे? (अग्नी परीक्षा)",
                gu: "તમારી પાચનશક્તિ (અગ્નિ) અને આહાર કેવો છે? (અગ્નિ પરીક્ષા)",
                en: "How is your digestive capacity & dietary habit / Agni Pariksha?"
            },
            audioPrompt: {
                hi: "आपकी भूख कैसी है — मंद, तीक्ष्ण (अत्यधिक भूख), विषम (अनियमित) या सामान्य?",
                pa: "ਤੁਹਾਡੀ ਭੁੱਖ ਕਿਹੋ ਜਿਹੀ ਹੈ — ਘੱਟ, ਬਹੁਤ ਜ਼ਿਆਦਾ ਜਾਂ ਬੇਨੇਮ?",
                bn: "আপনার ক্ষুধা কেমন — কম, খুব বেশি নাকি অনিয়মিত?",
                ta: "உங்கள் பசி எப்படி உள்ளது — மந்தமான, கடுமையான அல்லது சீரற்ற பசியா?",
                te: "మీ ఆకలి ఎలా ఉంది — తక్కువగా, విపరీతంగా లేదా క్రమం తప్పి ఉందా?",
                mr: "तुमची भूक कशी आहे — मंद, अतिशय जास्त की अनियमित?",
                gu: "તમારી ભૂખ કેવી છે — મંદ, ખૂબ વધારે કે અનિયમિત?",
                en: "How is your digestion and appetite: Mandagni (slow), Tikshnagni (hyperactive), or Vishamagni (irregular)?"
            },
            chips: {
                hi: ["समागिन (उत्तम पाचन)", "मंदाग्नि (भारीपन व धीमी पाचन)", "तीक्ष्णाग्नि (तुरंत भूख व जलन)", "विषमाग्नि (अनियमित भूख ও गैस)"],
                pa: ["ਸਮਅਗਨੀ (ਚੰਗਾ ਹਾਜ਼ਮਾ)", "ਮੰਦਾਗਨੀ (ਧੀਮਾ ਹਾਜ਼ਮਾ)", "ਤੀਖਣ ਅਗਨੀ (ਬਹੁਤ ਭੁੱਖ)", "ਵਿਸ਼ਮ ਅਗਨੀ (ਗੈਸ)"],
                bn: ["উত্তম হজম", "মৃদু হজম ও ভারী ভাব", "তীব্র ক্ষুধা ও জ্বালা", "অনিয়মিত ক্ষুধা ও গ্যাস"],
                ta: ["சீரான செரிமானம்", "மந்தமான செரிமானம்", "அதிக பசி மற்றும் எரிச்சல்", "முறையற்ற பசி மற்றும் வாயு"],
                te: ["మంచి జీర్ణశక్తి", "మందగించిన జీర్ణం", "అధిక ఆకలి", "క్రమం లేని ఆకలి"],
                mr: ["चांगली पचनशक्ती", "मंद पचन", "तीव्र भूक व जळजळ", "अनियमित भूक"],
                gu: ["સારી પાચનશક્તિ", "ધીમી પાચનશક્તિ", "તીવ્ર ભૂખ", "અનિયમિત ભૂખ"],
                en: ["Samagni (Balanced Digestion)", "Mandagni (Sluggish / Low Appetite)", "Tikshnagni (Intense Hunger / Acidity)", "Vishamagni (Irregular / Bloating)"]
            }
        },
        {
            key: "koshtha_mala",
            stepNum: 4,
            title: {
                hi: "पेट साफ़ होना एवं मल-मूत्र विसर्जन (कोष्ठ व मल परीक्षा)",
                pa: "ਪੇਟ ਸਾਫ਼ ਹੋਣਾ ਅਤੇ ਮਲ-ਮੂਤਰ (ਕੋਸ਼ਠ ਪਰੀਖਿਆ)",
                bn: "পেট পরিষ্কার হওয়া ও মলত্যাগ (কোষ্ঠ পরীক্ষা)",
                ta: "வயிற்றுப் போக்கு மற்றும் மலம் வெளியேற்றம் (கோஷ்ட பரீக்ஷா)",
                te: "మలవిసర్జన మరియు ప్రేగుల పనితీరు (కోష్ఠ పరీక్ష)",
                mr: "पोट साफ होणे आणि मलोत्सर्जन (कोष्ठ परीक्षा)",
                gu: "પેટ સાફ થવું અને મળત્યાગ (કોષ્ઠ પરીક્ષા)",
                en: "Bowel evacuation & metabolic excretion / Koshtha Pariksha"
            },
            audioPrompt: {
                hi: "क्या पेट साफ़ रहने में तकलीफ़ (कब्ज) है या दस्त / बार-बार जाना पड़ता है?",
                pa: "ਕੀ ਕਬਜ਼ ਦੀ ਸਮੱਸਿਆ ਹੈ ਜਾਂ ਵਾਰ-ਵਾਰ ਜਾਣਾ ਪੈਂਦਾ ਹੈ?",
                bn: "কোষ্ঠকাঠিন্য আছে নাকি পাতলা পায়খানা হয়?",
                ta: "மலச்சிக்கல் உள்ளதா அல்லது அடிக்கடி மலம் கழிக்க வேண்டுமா?",
                te: "మలబద్ధకం ఉందా లేదా విరేచనాలు అవుతున్నాయా?",
                mr: "बद्धकोष्ठतेचा त्रास आहे की जुलाब / वारंवार जावे लागते?",
                gu: "શું કબજિયાત છે કે ઝાડા / વારંવાર જવું પડે છે?",
                en: "Do you experience Krura Koshtha (constipation) or Mridu Koshtha (loose/frequent motions)?"
            },
            chips: {
                hi: ["मध्यम कोष्ठ (प्रतिदिन सामान्य)", "क्रूर कोष्ठ (कब्ज व सूखा मल)", "मृदु कोष्ठ (अतिसार / बार-बार)", "मूत्र में जलन या रुकावट"],
                pa: ["ਰੋਜ਼ਾਨਾ ਆਮ", "ਕਬਜ਼ ਦੀ ਤਕਲੀਫ਼", "ਪਤਲਾ ਮਲ", "ਪਿਸ਼ਾਬ ਵਿੱਚ ਜਲਣ"],
                bn: ["প্রতিদিন স্বাভাবিক", "কোষ্ঠকাঠিন্য", "পাতলা পায়খানা", "প্রস্রাবে জ্বালা"],
                ta: ["வழக்கமான இயல்பு", "மலச்சிக்கல்", "வயிற்றுப்போக்கு", "சிறுநீரில் எரிச்சல்"],
                te: ["రోజూ సాధారణం", "మలబద్ధకం", "విరేచనాలు", "మూత్రంలో మంట"],
                mr: ["नियमित सामान्य", "बद्धकोष्ठता", "जुलाब", "लघवी करताना जळजळ"],
                gu: ["નિયમિત સામાન્ય", "કબજિયાત", "ઝાડા", "પેશાબમાં બળતરા"],
                en: ["Madhyama Koshtha (Normal Daily)", "Krura Koshtha (Hard Stool / Constipation)", "Mridu Koshtha (Loose Motions)", "Mutrakrichra (Burning Micturition)"]
            }
        },
        {
            key: "nidra_satva",
            stepNum: 5,
            title: {
                hi: "नींद, मानसिक स्थिति एवं दैनिक दिनचर्या (निद्रा व सत्व परीक्षा)",
                pa: "ਨੀਂਦ, ਮਾਨਸਿਕ ਸਥਿਤੀ ਅਤੇ ਰੁਟੀਨ (ਨਿਦ੍ਰਾ ਪਰੀਖਿਆ)",
                bn: "ঘুম, মানসিক অবস্থা ও জীবনযাত্রা (নিদ্রা পরীক্ষা)",
                ta: "தூக்கம், மனநிலை மற்றும் வாழ்க்கை முறை (நித்ரா பரீக்ஷா)",
                te: "నిద్ర, మానసిక స్థితి మరియు జీవనశైలి (నిద్ర పరీక్ష)",
                mr: "झोप, मानसिक स्थिती आणि दिनचर्या (निद्रा परीक्षा)",
                gu: "ઊંઘ, માનસિક સ્થિતિ અને દિનચર્યા (નિદ્રા પરીક્ષા)",
                en: "Sleep quality, mental resilience & daily routine / Nidra & Satva"
            },
            audioPrompt: {
                hi: "आपको रात में कैसी नींद आती है और क्या तनाव, चिंता या बेचैनी रहती है?",
                pa: "ਤੁਹਾਨੂੰ ਰਾਤ ਨੂੰ ਨੀਂਦ ਕਿਵੇਂ ਆਉਂਦੀ ਹੈ ਅਤੇ ਕੀ ਤਣਾਅ ਜਾਂ ਚਿੰਤਾ ਰਹਿੰਦੀ ਹੈ?",
                bn: "রাতে ঘুম কেমন হয় এবং কোন মানসিক চাপ বা উদ্বেগ আছে কি?",
                ta: "இரவில் தூக்கம் எப்படி வருகிறது மற்றும் மன அழுத்தம் அல்லது கவலை உள்ளதா?",
                te: "రాత్రి నిద్ర ఎలా పడుతుంది మరియు ఒత్తిడి, ఆందోళన ఉన్నాయా?",
                mr: "रात्री झोप कशी लागते आणि काही ताणतणाव किंवा चिंता आहे का?",
                gu: "રાત્રે ઊંઘ કેવી આવે છે અને શું તણાવ કે ચિંતા રહે છે?",
                en: "How is your sleep pattern and are you experiencing stress, anxiety, or restlessness?"
            },
            chips: {
                hi: ["गाढ़ निद्रा (उत्तम व गहरी नींद)", "अनिद्रा (देर से नींद आना)", "खंडित निद्रा (बार-बार आंख खुलना)", "मानसिक तनाव व अवसाद"],
                pa: ["ਚੰਗੀ ਤੇ ਗੂੜ੍ਹੀ ਨੀਂਦ", "ਨੀਂਦ ਨਾ ਆਉਣਾ (ਅਨਿਦ੍ਰਾ)", "ਵਾਰ-ਵਾਰ ਜਾਗ ਖੁੱਲ੍ਹਣਾ", "ਮਾਨਸਿਕ ਤਣਾਅ"],
                bn: ["গভীর ভালো ঘুম", "অনিদ্রা", "মাঝে মাঝে ঘুম ভাঙা", "মানসিক চাপ"],
                ta: ["ஆழ்ந்த நல்ல தூக்கம்", "தூக்கமின்மை", "இடையிடையே விழிப்பு", "மன அழுத்தம்"],
                te: ["మంచి గాఢ నిద్ర", "నిద్రలేమి", "తరచుగా మెలకువ రావడం", "మానసిక ఒత్తిడి"],
                mr: ["शांत व गाढ झोप", "निद्रानाश", "वारंवार जाग येणे", "मानसिक ताण"],
                gu: ["સારી ઊંઘ", "ઊંઘ ન આવવી", "વારંવાર જાગવું", "માનસિક તણાવ"],
                en: ["Deep Restful Sleep", "Anidra (Difficulty Falling Asleep)", "Fragmented Sleep (Waking Frequently)", "High Stress & Anxiety (Satva Parihani)"]
            }
        }
    ];

    const steps = isAyush ? ayushSteps : allopathySteps;
    let currentStepIdx = state.currentStepIndex || 0;

    // Real-Time Vernacular to English Clinical Term Dictionary
    const clinicalTranslations = {
        "छाती में दर्द": "Chest pain / Angina pectoris",
        "पसीना": "Diaphoresis / Sweating (Acute Ischemia Risk)",
        "घबराहट": "Palpitations / Tachycardia",
        "सांस फूलना": "Dyspnea / Shortness of breath",
        "बुखार": "Pyrexia / Fever",
        "संधिवात": "Osteoarthritis / Rheumatoid Sandhivata",
        "अम्लपित्त": "Gastroesophageal reflux / Amlapitta (Hyperacidity)",
        "मंदाग्नि": "Impaired digestive fire / Dyspepsia",
        "वात": "Vata Dosha imbalance (Neurological / Musculoskeletal pain)",
        "पित्त": "Pitta Dosha imbalance (Inflammation / Burning)",
        "कफ": "Kapha Dosha imbalance (Mucus congestion / Heaviness)",
        "अनिद्रा": "Insomnia / Sleep disturbance",
        "कब्ज": "Constipation / Krura Kostha"
    };

    function translateLiveSpeech(text) {
        let matched = [];
        for (const [k, v] of Object.entries(clinicalTranslations)) {
            if (text.includes(k)) {
                matched.push(v);
            }
        }
        if (matched.length > 0) {
            return `Clinical Terms: ${matched.join(" • ")}`;
        }
        return `Transcribed Input: "${text}"`;
    }

    function renderCurrentStep() {
        const step = steps[currentStepIdx];
        const stepTitle = step.title[lang] || step.title.hi;
        const stepPrompt = step.audioPrompt[lang] || step.audioPrompt.hi;
        const stepChips = step.chips[lang] || step.chips.hi || [];

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 950px; margin: auto; animation: fade-in 250ms ease;">
                
                <!-- Progress Dots -->
                <div class="step-progress-bar" role="progressbar" aria-valuenow="${currentStepIdx + 1}" aria-valuemin="1" aria-valuemax="${steps.length}">
                    ${steps.map((s, idx) => `
                        <div class="progress-dot ${idx === currentStepIdx ? 'active' : (idx < currentStepIdx ? 'completed' : '')}"></div>
                    `).join('')}
                </div>

                <!-- Step Title & Audio Playback Indicator -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: #f0fdfa; border: 1px solid #99f6e4; color: #0d9488; font-size: 13px; font-weight: 800; padding: 4px 16px; border-radius: 9999px; text-transform: uppercase;">
                        <span>${t.stepLabel || 'Step'} ${currentStepIdx + 1} ${t.ofLabel || 'of'} ${steps.length}</span>
                        <span>•</span>
                        <span>${isAyush ? (t.ayushBadge || '🌿 AYUSH Dashavidha Pariksha') : (t.allopathyBadge || '🩺 Modern Medicine SOCRATES')}</span>
                    </div>
                    <h2 style="font-size: var(--font-size-xl); font-weight: 800; color: #0f172a; margin-top: 10px;">
                        ${stepTitle}
                    </h2>
                </div>

                <!-- Voice Turn-Taking Pulse Sphere -->
                <div class="voice-sphere-container">
                    <div class="voice-sphere" id="mic-sphere" role="button" tabindex="0" aria-label="Microphone sphere. Tap to speak.">
                        🎙️
                    </div>
                    <div class="audio-waveform" id="waveform-container">
                        <div class="waveform-bar" style="height: 12px;"></div>
                        <div class="waveform-bar" style="height: 22px;"></div>
                        <div class="waveform-bar" style="height: 32px;"></div>
                        <div class="waveform-bar" style="height: 18px;"></div>
                        <div class="waveform-bar" style="height: 10px;"></div>
                    </div>
                    <p style="font-size: var(--font-size-sm); color: #475569; margin-top: 8px; font-weight: 600;" id="voice-status-label">
                        ${t.speakOrTap || 'Speak into the microphone or tap the quick options below'}
                    </p>
                </div>

                <!-- Live Voice-to-Text Transcription & On-Screen Translation Stream Box -->
                <div class="live-speech-box" id="live-speech-container">
                    <div class="live-speech-header">
                        <span style="font-size: 13px; font-weight: 700; color: #64748b; display: flex; align-items: center; gap: 6px;">
                            💬 ${t.liveStreaming || 'Live Vernacular Speech Recognition'} (${lang.toUpperCase()})
                        </span>
                        <span class="live-indicator-badge" id="live-indicator" style="display: none;">
                            <span class="live-dot"></span> ${t.liveStreaming || 'LIVE STREAMING'}
                        </span>
                    </div>
                    <div class="live-transcription-text" id="live-transcript-display">
                        <span style="color: #94a3b8; font-style: italic;">(${t.listening || 'Waiting for voice input...'})</span>
                    </div>
                    <div class="live-translation-text" id="live-translation-display" style="display: none;"></div>
                </div>

                <!-- Quick Touch Selection Chips -->
                <div class="chip-grid">
                    ${stepChips.map(chip => `
                        <button class="touch-chip" data-chip-val="${chip}">
                            <span>${chip}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Navigation Controls -->
                <div style="display: flex; justify-content: space-between; width: 100%; max-width: 800px; margin-top: 24px;">
                    <button class="header-btn" id="btn-prev-step" ${currentStepIdx === 0 ? 'disabled style="opacity: 0.4;"' : ''}>
                        ${t.prevBtn || '⬅️ Previous'}
                    </button>
                    <button class="header-btn" id="btn-replay-audio" style="background: #f8fafc; border-color: #cbd5e1;">
                        🔊 ${t.repeatQuestion || 'Repeat Question'}
                    </button>
                    <button class="header-btn active" id="btn-next-step" style="padding: 0 32px; font-weight: 800;">
                        ${currentStepIdx === steps.length - 1 ? (t.confirmBtn || 'Confirm & Proceed ➔') : (t.nextBtn || 'Next ➔')}
                    </button>
                </div>

            </div>
        `;

        // Automatically speak step question in the patient's selected language
        setTimeout(() => {
            audioController.speak(stepPrompt, lang);
        }, 300);

        // Bind Microphone & Live Streaming Voice Engine
        const micSphere = container.querySelector("#mic-sphere");
        const statusLabel = container.querySelector("#voice-status-label");
        const liveIndicator = container.querySelector("#live-indicator");
        const transcriptDisplay = container.querySelector("#live-transcript-display");
        const translationDisplay = container.querySelector("#live-translation-display");
        let isRec = false;

        micSphere.addEventListener("click", async () => {
            if (!isRec) {
                isRec = true;
                micSphere.classList.add("recording");
                liveIndicator.style.display = "inline-flex";
                statusLabel.textContent = t.listening || "Listening... please speak now";
                transcriptDisplay.innerHTML = `<span style="color: #0d9488; font-weight: 600;">${t.listening || 'Listening to speech...'}</span>`;

                await audioController.startRecording(
                    (freqData) => {
                        // Update visualizer bars
                        const bars = container.querySelectorAll(".waveform-bar");
                        bars.forEach((b, i) => {
                            const val = freqData[i * 2] || 10;
                            b.style.height = `${Math.max(8, val / 4)}px`;
                        });
                    },
                    async (audioBlob) => {
                        // Server-side fallback transcription
                        const res = await apiService.transcribeSpeechAudio(audioBlob, lang);
                        if (res && res.transcript) {
                            transcriptDisplay.textContent = `"${res.transcript}"`;
                            translationDisplay.textContent = translateLiveSpeech(res.transcript);
                            translationDisplay.style.display = "block";
                            kioskState.updateSlot(step.key, res.transcript);
                        }
                    },
                    (liveText, isFinal) => {
                        // Live Streaming Client Callback
                        transcriptDisplay.textContent = `"${liveText}"`;
                        translationDisplay.textContent = translateLiveSpeech(liveText);
                        translationDisplay.style.display = "block";
                        kioskState.updateSlot(step.key, liveText);
                    }
                );
            } else {
                isRec = false;
                micSphere.classList.remove("recording");
                liveIndicator.style.display = "none";
                audioController.stopRecording();
                statusLabel.textContent = t.recordingDone || "Recording complete";
            }
        });

        // Replay Question Audio
        container.querySelector("#btn-replay-audio").addEventListener("click", () => {
            audioController.speak(stepPrompt, lang);
        });

        // Touch chip selection
        container.querySelectorAll(".touch-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                const val = chip.getAttribute("data-chip-val");
                transcriptDisplay.textContent = `"${val}"`;
                translationDisplay.textContent = translateLiveSpeech(val);
                translationDisplay.style.display = "block";
                kioskState.updateSlot(step.key, val);
                setTimeout(() => advanceStep(), 400);
            });
        });

        // Prev / Next button bindings
        container.querySelector("#btn-prev-step").addEventListener("click", () => {
            if (currentStepIdx > 0) {
                currentStepIdx--;
                kioskState.setState({ currentStepIndex: currentStepIdx });
                renderCurrentStep();
            }
        });

        container.querySelector("#btn-next-step").addEventListener("click", () => {
            advanceStep();
        });
    }

    function advanceStep() {
        audioController.stopSpeaking();
        audioController.stopRecording();
        if (currentStepIdx < steps.length - 1) {
            currentStepIdx++;
            kioskState.setState({ currentStepIndex: currentStepIdx });
            renderCurrentStep();
        } else {
            if (onCompleteIntake) onCompleteIntake();
        }
    }

    renderCurrentStep();
}
