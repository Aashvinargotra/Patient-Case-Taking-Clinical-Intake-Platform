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

    // 2. Comprehensive AYUSH / Ayurveda Steps (Authentic Clinical Prashna Pariksha) with 8 Languages
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
                en: "What is your primary clinical complaint? (Roga Pariksha)"
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
                hi: ["संधिवात (जोड़ों में दर्द व जकड़न)", "अम्लपित्त (सीने में जलन व खट्टी डकारें)", "मंदाग्नि (भूख न लगना व पेट फूलना)", "अनिद्रा, सिरदर्द व तनाव", "त्वचा रोग / खुजली", "श्वास व कास (दमा व खांसी)"],
                pa: ["ਸੰਧੀਵਾਤ (ਜੋੜਾਂ ਦਾ ਦਰਦ)", "ਤੇਜ਼ਾਬ / ਗੈਸ", "ਮੰਦਾਗਨੀ (ਭੁੱਖ ਨਾ ਲੱਗਣਾ)", "ਨੀਂਦ ਨਾ ਆਉਣਾ ਤੇ ਸਿਰਦਰਦ", "ਚਮੜੀ ਰੋਗ", "ਦਮਾ ਤੇ ਖੰਘ"],
                bn: ["গাঁটের ব্যথা ও টান", "অম্বল ও টক ঢেকুর", "ক্ষুধামান্দ্য ও পেট ফাঁপা", "অনিদ্রা ও মানসিক চাপ", "চর্মরোগ", "হাঁপানি ও কাশি"],
                ta: ["மூட்டு வலி மற்றும் இறுக்கம்", "அசிடிட்டி மற்றும் நெஞ்செரிச்சல்", "பசியின்மை", "தூக்கமின்மை மற்றும் தலைவலி", "தோல் நோய்", "ஆஸ்துமா இருமல்"],
                te: ["కీళ్ళ వాతం మరియు బిగుతు", "ఎసిడిటీ మరియు గుండెల్లో మంట", "ఆకలి లేకపోవడం", "నిద్రలేమి మరియు తలనొప్పి", "చర్మ వ్యాధులు", "ఉబ్బసం దగ్గు"],
                mr: ["संधिवात (सांधेदुखी)", "आम्लपित्त (जळजळ व आंबट ढेकर)", "भूक मंदावणे व पोट फुगणे", "निद्रानाश व डोकेदुखी", "त्वचारोग", "दमा व खोकला"],
                gu: ["સંધિવાત (સાંધાનો દુખાવો)", "એસિડિટી અને બળતરા", "ભૂખ ન લાગવી", "ઊંઘ ન આવવી અને માથાનો દુખાવો", "ચામડીના રોગ", "દમ અને ખાંસી"],
                en: ["Sandhivata (Joint Pain & Stiffness)", "Amlapitta (Hyperacidity & Heartburn)", "Mandagni (Indigestion & Bloating)", "Insomnia, Headache & Stress", "Twak Roga (Skin Allergy)", "Shwasa-Kasa (Asthma & Cough)"]
            }
        },
        {
            key: "dosha_prakriti",
            stepNum: 2,
            title: {
                hi: "तकलीफ़ या दर्द का अनुभव कैसा होता है? (वेदना स्वरूप परीक्षा)",
                pa: "ਦਰਦ ਜਾਂ ਤਕਲੀਫ਼ ਦਾ ਅਨੁਭਵ ਕਿਹੋ ਜਿਹਾ ਹੈ? (ਵੇਦਨਾ ਪ੍ਰੀਖਿਆ)",
                bn: "ব্যথা বা কষ্টের অনুভূতি কেমন? (বেদনা পরীক্ষা)",
                ta: "வலியின் அனுபவம் எப்படி உள்ளது? (வேதனா பரீக்ஷா)",
                te: "నొప్పి లేదా అసౌకర్య అనుభవం ఎలా ఉంది? (వేదనా పరీక్ష)",
                mr: "त्रासाचा किंवा दुखण्याचा अनुभव कसा आहे? (वेदना परीक्षा)",
                gu: "તકલીફ કે દુખાવાનો અનુભવ કેવો છે? (વેદના પરીક્ષા)",
                en: "What is the sensation of pain or discomfort? (Vedana Svarupa)"
            },
            audioPrompt: {
                hi: "तकलीफ़ कैसी महसूस होती है — तीव्र चुभन व खिंचाव (वात), जलन व तपन (पित्त), या भारीपन व जकड़न (कफ)?",
                pa: "ਤਕਲੀਫ਼ ਕਿਸ ਤਰ੍ਹਾਂ ਦੀ ਹੈ — ਤਿੱਖੀ ਚੁਭਣ ਤੇ ਖਿਚਾਅ (ਵਾਤ), ਜਲਣ (ਪਿੱਤ), ਜਾਂ ਭਾਰੀਪਨ ਤੇ ਜਕੜਨ (ਕਫ਼)?",
                bn: "কষ্ট কেমন লাগে — তীব্র খোঁচা ও টান (বাত), জ্বালা ও তাপ (পিত্ত), নাকি ভারী ভাব ও শক্ত ভাব (কফ)?",
                ta: "வலி எப்படி உள்ளது — கடுமையான குத்துதல் (வாதம்), எரிச்சல் (பித்தம்), அல்லது கனம் மற்றும் இறுக்கம் (கபம்)?",
                te: "నొప్పి ఎలా ఉంది — తీవ్ర పొడుపు & లాగడం (వాతం), మంట (పిత్తం), లేదా బరువు & బిగుతు (కఫం)?",
                mr: "त्रास कसा वाटतो — तीव्र टोचणे व ताण (वात), जळजळ (पित्त), की जडपणा व ताठरता (कफ)?",
                gu: "તકલીફ કેવી લાગે છે — તીવ્ર ખૂંચવું અને ખેંચાણ (વાત), બળતરા (પિત્ત), કે ભારેપણું અને જકડાઈ જવું (કફ)?",
                en: "How does the discomfort feel — sharp stabbing or stretching pain (Vata), burning heat (Pitta), or heaviness and stiffness (Kapha)?"
            },
            chips: {
                hi: ["तीव्र चुभन, खिंचाव व सूखापन (वात)", "जलन, तपन व खट्टापन (पित्त)", "भारीपन, जकड़न व सुस्ती (कफ)", "मिश्रित लक्षण (वात-पित्त / कफ)"],
                pa: ["ਤਿੱਖੀ ਚੁਭਣ ਤੇ ਸੁੱਕਾਪਨ (ਵਾਤ)", "ਜਲਣ ਤੇ ਤਪਸ਼ (ਪਿੱਤ)", "ਭਾਰੀਪਨ ਤੇ ਸੁਸਤੀ (ਕਫ਼)", "ਮਿਲੇ-ਜੁਲੇ ਲੱਛਣ"],
                bn: ["তীব্র খোঁচা ও শুষ্কতা (বাত)", "জ্বালাপোড়া ও গরম ভাব (পিত্ত)", "ভারী ভাব ও জড়তা (কফ)", "মিশ্র লক্ষণ"],
                ta: ["குத்துதல் மற்றும் வறட்சி (வாதம்)", "எரிச்சல் மற்றும் தாகம் (பித்தம்)", "பாரம் மற்றும் சோம்பல் (கபம்)", "கலப்பு அறிகுறிகள்"],
                te: ["తీవ్ర పొడుపు & పొడిబారడం (వాతం)", "మంట & వేడి (పిత్తం)", "బరువు & మందకొడితనం (కఫం)", "మిశ్రమ లక్షణాలు"],
                mr: ["तीव्र टोचणे व कोरडेपणा (वात)", "जळजळ व उष्णता (पित्त)", "जडपणा व आळस (कफ)", "मिश्र लक्षणे"],
                gu: ["તીવ્ર ખૂંચવું અને શુષ્કતા (વાત)", "બળતરા અને ઉષ્ણતા (પિત્ત)", "ભારેપણું અને આળસ (કફ)", "મિશ્ર લક્ષણો"],
                en: ["Sharp Stabbing, Pulling or Dry Pain (Vata)", "Burning Sensation & Intense Heat (Pitta)", "Heaviness, Stiffness & Lethargy (Kapha)", "Mixed Dosha Symptoms (Sannipata)"]
            }
        },
        {
            key: "agni_ahara",
            stepNum: 3,
            title: {
                hi: "तकलीफ़ किस समय या किन कारणों से अधिक बढ़ती है? (काल व वेग परीक्षा)",
                pa: "ਤਕਲੀਫ਼ ਕਿਸ ਸਮੇਂ ਜਾਂ ਕਾਰਨਾਂ ਕਰਕੇ ਵੱਧਦੀ ਹੈ? (ਕਾਲ ਪ੍ਰੀਖਿਆ)",
                bn: "কষ্ট কোন সময় বা কি কারণে বাড়ে? (কাল পরীক্ষা)",
                ta: "தொல்லை எந்த நேரத்தில் அல்லது எதனால் அதிகரிக்கிறது? (கால பரீக்ஷா)",
                te: "సమస్య ఏ సమయంలో లేదా ఏ కారణాల వల్ల పెరుగుతుంది? (కాల పరీక్ష)",
                mr: "त्रास कोणत्या वेळी किंवा कारणाने जास्त वाढतो? (काळ परीक्षा)",
                gu: "તકલીફ કયા સમયે કે કારણોથી વધુ વધે છે? (કાળ પરીક્ષા)",
                en: "When or due to what triggers does the condition worsen? (Kala & Trigger)"
            },
            audioPrompt: {
                hi: "क्या तकलीफ़ शाम को व ठंड में बढ़ती है, दोपहर व मसालेदार खाने से, या सुबह व मीठा खाने से?",
                pa: "ਕੀ ਤਕਲੀਫ਼ ਸ਼ਾਮ ਨੂੰ ਤੇ ਠੰਢ ਵਿੱਚ ਵੱਧਦੀ ਹੈ, ਦੁਪਹਿਰ ਨੂੰ ਮਸਾਲੇਦਾਰ ਖਾਣੇ ਨਾਲ, ਜਾਂ ਸਵੇਰੇ?",
                bn: "কষ্ট কি সন্ধ্যায় ও ঠান্ডায় বাড়ে, দুপুরে মশলাদার খাবারে, নাকি সকালে?",
                ta: "தொல்லை மாலையிலும் குளிரிலும் அதிகரிக்கிறதா, மதிய வெயிலில் அல்லது காரமான உணவால் அதிகரிக்கிறதா?",
                te: "సాయంత్రం మరియు చలిలో పెరుగుతుందా, మధ్యాహ్నం లేదా కారమైన ఆహారంతోనా?",
                mr: "त्रास संध्याकाळी व थंडीत वाढतो, दुपारी तिखट खाल्ल्याने, की सकाळी?",
                gu: "શું તકલીફ સાંજે અને ઠંડીમાં વધે છે, બપોરે મસાલેદાર ખાવાથી, કે સવારે?",
                en: "Does the symptom aggravate in evenings and cold (Vata), afternoons and spicy food (Pitta), or mornings and heavy meals (Kapha)?"
            },
            chips: {
                hi: ["शाम के समय व ठंड में अधिक (वात वृद्धि)", "दोपहर व मसालेदार भोजन से (पित्त वृद्धि)", "प्रातःकाल व खाने के तुरंत बाद (कफ वृद्धि)", "मौसम बदलने व परिश्रम के बाद"],
                pa: ["ਸ਼ਾਮ ਨੂੰ ਤੇ ਠੰਢ ਵਿੱਚ (ਵਾਤ)", "ਦੁਪਹਿਰ ਤੇ ਮਸਾਲੇਦਾਰ ਖਾਣੇ ਨਾਲ (ਪਿੱਤ)", "ਸਵੇਰੇ ਖਾਣ ਤੋਂ ਬਾਅਦ (ਕਫ਼)", "ਮੌਸਮ ਬਦਲਣ ਤੇ"],
                bn: ["সন্ধ্যায় ও ঠান্ডায় বেশি (বাত)", "দুপুরে ও ঝাল খাবারে (পিত্ত)", "সকালে ও খাবারের পর (কফ)", "ঋতু পরিবর্তনে"],
                ta: ["மாலையில் மற்றும் குளிரில் (வாதம்)", "மதியத்திலும் கார உணவிலும் (பித்தம்)", "காலையில் மற்றும் சாப்பிட்டதும் (கபம்)", "பருவநிலை மாற்றத்தில்"],
                te: ["సాయంత్రం మరియు చలిలో (వాతం)", "మధ్యాహ్నం మరియు కారంతో (పిత్తం)", "ఉదయం మరియు తిన్న వెంటనే (కఫం)", "వాతావరణ మార్పులో"],
                mr: ["संध्याकाळी व थंडीत जास्त (वात)", "दुपारी व मसालेदार अन्नाने (पित्त)", "सकाळी व जेवल्यानंतर लगेच (कफ)", "हवामान बदलताना"],
                gu: ["સાંજે અને ઠંડીમાં વધુ (વાત)", "બપોરે અને તીખા ખોરાકથી (પિત્ત)", "સવારે અને જમ્યા પછી (કફ)", "હવામાન બદલાવ વખતે"],
                en: ["Aggravates in Evenings & Cold (Vata)", "Aggravates in Afternoons & Spicy Food (Pitta)", "Aggravates Early Mornings & After Meals (Kapha)", "Triggered by Weather Change & Exertion"]
            }
        },
        {
            key: "koshtha_mala",
            stepNum: 4,
            title: {
                hi: "आपकी भूख, पाचन और पेट साफ़ होने की क्या स्थिति है? (अग्नि व कोष्ठ परीक्षा)",
                pa: "ਤੁਹਾਡੀ ਭੁੱਖ, ਹਾਜ਼ਮਾ ਅਤੇ ਪੇਟ ਸਾਫ਼ ਹੋਣਾ ਕਿਹੋ ਜਿਹਾ ਹੈ? (ਅਗਨੀ ਤੇ ਕੋਸ਼ਠ)",
                bn: "আপনার ক্ষুধা, হজম এবং পেট পরিষ্কার কেমন? (অগ্নি ও কোষ্ঠ পরীক্ষা)",
                ta: "உங்கள் பசி, செரிமானம் மற்றும் வயிறு கழிவு நிலை எப்படி உள்ளது?",
                te: "మీ ఆకలి, జీర్ణక్రియ మరియు ప్రేగుల శుభ్రత ఎలా ఉన్నాయి?",
                mr: "तुमची भूक, पचन आणि पोट साफ होण्याची स्थिती काय आहे? (अग्नी व कोष्ठ)",
                gu: "તમારી ભૂખ, પાચન અને પેટ સાફ થવાની સ્થિતિ કેવી છે? (અગ્નિ અને કોષ્ઠ)",
                en: "How is your appetite, digestion & bowel evacuation? (Agni & Koshtha)"
            },
            audioPrompt: {
                hi: "क्या खाना देर से पचता है, भूख कम लगती है, खट्टी डकारें आती हैं, या कब्ज / पेट साफ़ न होने की तकलीफ़ है?",
                pa: "ਕੀ ਖਾਣਾ ਦੇਰ ਨਾਲ ਪਚਦਾ ਹੈ, ਭੁੱਖ ਘੱਟ ਲੱਗਦੀ ਹੈ, ਜਾਂ ਕਬਜ਼ ਦੀ ਸਮੱਸਿਆ ਹੈ?",
                bn: "হজম দেরিতে হয়, ক্ষুধা কম পায়, টক ঢেকুর ওঠে বা কোষ্ঠকাঠিন্য আছে কি?",
                ta: "செரிமானம் தாமதமாகிறதா, பசி குறைவாக உள்ளதா அல்லது மலச்சிக்கல் உள்ளதா?",
                te: "జీర్ణం ఆలస్యమవుతుందా, ఆకలి తక్కువగా ఉందా లేదా మలబద్ధకం ఉందా?",
                mr: "अन्न उशिरा पचते, भूक मंदावली आहे की बद्धकोष्ठतेचा त्रास आहे?",
                gu: "શું ખોરાક મોડો પચે છે, ભૂખ ઓછી લાગે છે કે કબજિયાતની તકલીફ છે?",
                en: "Do you have sluggish digestion (Mandagni), hyperacidity (Tikshnagni), or constipation / irregular bowels (Krura Koshtha)?"
            },
            chips: {
                hi: ["मंदाग्नि (पेट में भारीपन व भूख कम लगना)", "तीक्ष्णाग्नि (तुरंत भूख लगना व सीने में जलन)", "क्रूर कोष्ठ (कब्ज व सूखा मल)", "साम लक्षण (जीभ पर सफ़ेद मैल व सुस्ती)"],
                pa: ["ਮੰਦਾਗਨੀ (ਭਾਰੀਪਨ ਤੇ ਘੱਟ ਭੁੱਖ)", "ਤੀਖਣ ਅਗਨੀ (ਜਲਣ ਤੇ ਤੇਜ਼ ਭੁੱਖ)", "ਕਬਜ਼ ਦੀ ਸਮੱਸਿਆ", "ਜੀਭ 'ਤੇ ਚਿੱਟਾ ਮੈਲ"],
                bn: ["মৃদু হজম ও ক্ষুধা কম", "তীব্র ক্ষুধা ও বুকে জ্বালা", "কোষ্ঠকাঠিন্য", "জিভে সাদা প্রলেপ ও আলস্য"],
                ta: ["மந்தமான பசி மற்றும் பாரம்", "அதிக பசி மற்றும் நெஞ்செரிச்சல்", "மலச்சிக்கல்", "நாக்கில் வெண்படலம்"],
                te: ["మందగించిన ఆకలి & బరువు", "తీవ్ర ఆకలి & గుండెల్లో మంట", "మలబద్ధకం", "నాలుకపై తెల్లని పూత"],
                mr: ["मंद पचन व पोटात जडपणा", "तीव्र भूक व छातीत जळजळ", "बद्धकोष्ठता", "जीभेवर पांढरा थर व सुस्ती"],
                gu: ["ધીમી પાચનશક્તિ અને ભારેપણું", "તીવ્ર ભૂખ અને છાતીમાં બળતરા", "કબજિયાત", "જીભ પર સફેદ છારી"],
                en: ["Mandagni (Sluggish Digestion & Fullness)", "Tikshnagni (Excessive Appetite & Heartburn)", "Krura Koshtha (Hard Bowel / Constipation)", "Ama Lakshana (Coated Tongue & Malaise)"]
            }
        },
        {
            key: "nidra_satva",
            stepNum: 5,
            title: {
                hi: "आपकी नींद, मानसिक स्थिति एवं खान-पान की दिनचर्या कैसी है? (निद्रा व सत्व परीक्षा)",
                pa: "ਤੁਹਾਡੀ ਨੀਂਦ, ਮਾਨਸਿਕ ਸਥਿਤੀ ਅਤੇ ਰੁਟੀਨ ਕਿਹੋ ਜਿਹਾ ਹੈ? (ਨਿਦ੍ਰਾ ਤੇ ਸਤਵ)",
                bn: "আপনার ঘুম, মানসিক অবস্থা ও খাদ্যাভ্যাস কেমন? (নিদ্রা ও সত্ত্ব পরীক্ষা)",
                ta: "உங்கள் தூக்கம், மனநிலை மற்றும் உணவு பழக்கம் எப்படி உள்ளது?",
                te: "మీ నిద్ర, మానసిక స్థితి మరియు ఆహారపు అలవాట్లు ఎలా ఉన్నాయి?",
                mr: "तुमची झोप, मानसिक स्थिती आणि दिनचर्या कशी आहे? (निद्रा व सत्व)",
                gu: "તમારી ઊંઘ, માનસિક સ્થિતિ અને દિનચર્યા કેવી છે? (નિદ્રા અને સત્વ)",
                en: "How is your sleep quality, mental wellbeing & lifestyle routine? (Nidra & Satva)"
            },
            audioPrompt: {
                hi: "क्या रात में नींद ठीक से नहीं आती, तनाव रहता है, या भोजन का समय अनियमित है?",
                pa: "ਕੀ ਰਾਤ ਨੂੰ ਨੀਂਦ ਠੀਕ ਨਹੀਂ ਆਉਂਦੀ, ਤਣਾਅ ਰਹਿੰਦਾ ਹੈ ਜਾਂ ਖਾਣੇ ਦਾ ਸਮਾਂ ਬੇਨੇਮ ਹੈ?",
                bn: "রাতে ঘুম ঠিকমতো হয় না, দুশ্চিন্তা থাকে বা খাওয়ার সময় অনিয়মিত কি?",
                ta: "இரவில் தூக்கம் சரியாக வருவதில்லையா, மன அழுத்தம் உள்ளதா அல்லது சீரற்ற உணவு நேரமா?",
                te: "రాత్రి నిద్ర సరిగా పట్టడం లేదా, ఒత్తిడి ఉందా లేదా సమయానికి తినడం లేదా?",
                mr: "रात्री झोप व्यवस्थित लागत नाही, तणाव असतो की जेवणाची वेळ अनियमित आहे?",
                gu: "શું રાત્રે ઊંઘ બરાબર આવતી નથી, તણાવ રહે છે કે જમવાનો સમય અનિયમિત છે?",
                en: "Do you experience disturbed sleep, high mental stress or irregular meal timings?"
            },
            chips: {
                hi: ["गाढ़ व समय पर नींद (प्राकृत)", "खंडित या देर से नींद (अनिद्रा)", "अत्यधिक मानसिक तनाव व चिंता", "अनियमित दिनचर्या व देर रात भोजन"],
                pa: ["ਚੰਗੀ ਨੀਂਦ", "ਨੀਂਦ ਨਾ ਆਉਣਾ (ਅਨਿਦ੍ਰਾ)", "ਮਾਨਸਿਕ ਤਣਾਅ ਤੇ ਚਿੰਤਾ", "ਦੇਰ ਰਾਤ ਖਾਣਾ"],
                bn: ["ভালো ও সময়মতো ঘুম", "অনিদ্রা ও বারবার ভাঙা", "অতিরিক্ত মানসিক চাপ", "অনিয়মিত খাওয়ার সময়"],
                ta: ["நல்ல தூக்கம்", "தூக்கமின்மை", "அதிக மன உளைச்சல்", "முறையற்ற உணவு முறை"],
                te: ["మంచి నిద్ర", "నిద్రలేమి", "తీవ్ర మానసిక ఒత్తిడి", "సమయం తప్పిన ఆహారం"],
                mr: ["शांत व वेळेवर झोप", "अपुऱ्या झोपेचा त्रास", "अति मानसिक ताणतणाव", "अनियमित जेवणाच्या वेळा"],
                gu: ["સારી ઊંઘ", "ઊંઘ ન આવવી (અનિદ્રા)", "વધુ પડતો માનસિક તણાવ", "અનિયમિત દિનચર્યા"],
                en: ["Sound & Timely Sleep (Prakrita)", "Fragmented / Delayed Sleep (Anidra)", "High Mental Stress & Anxiety", "Irregular Routine & Late Night Meals"]
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


                <!-- Custom Freeform Typing Input Bar -->
                <div style="width: 100%; max-width: 800px; margin: 8px 0 16px 0;">
                    <div style="display: flex; gap: 8px; align-items: center; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: var(--radius-md); padding: 6px 10px; box-shadow: 0 2px 6px rgba(15,23,42,0.05);">
                        <span style="font-size: 20px; color: #64748b; padding-left: 4px;">⌨️</span>
                        <input type="text" id="input-custom-text-answer" 
                               placeholder="${{
                                   hi: 'या यहाँ अपनी तकलीफ़ लिखकर दर्ज करें...',
                                   pa: 'ਜਾਂ ਇੱਥੇ ਆਪਣੀ ਸਮੱਸਿਆ ਟਾਈਪ ਕਰੋ...',
                                   bn: 'বা এখানে আপনার সমস্যা টাইপ করুন...',
                                   ta: 'அல்லது உங்கள் பதிலை இங்கே தட்டச்சு செய்யவும்...',
                                   te: 'లేదా మీ సమాధానాన్ని ఇక్కడ టైప్ చేయండి...',
                                   mr: 'किंवा येथे तुमचे उत्तर टाइप करा...',
                                   gu: 'અથવા અહીં તમારો જવાબ ટાઈપ કરો...',
                                   en: 'Or type your symptoms / answer here...'
                               }[lang] || 'Or type your answer here...'}"
                               value="${(state.slots && state.slots[step.key]) || ''}"
                               style="flex: 1; border: none; outline: none; font-size: 14.5px; font-weight: 600; color: #0f172a; background: transparent; padding: 6px 4px;" />
                        <button type="button" id="btn-submit-typed-answer" class="btn btn-primary" 
                                style="padding: 9px 18px; font-size: 13.5px; font-weight: 800; border-radius: 6px; white-space: nowrap;">
                            ${{
                                hi: 'दर्ज करें ➔',
                                pa: 'ਦਰਜ ਕਰੋ ➔',
                                bn: 'জমা দিন ➔',
                                ta: 'சமர்ப்பி ➔',
                                te: 'సమర్పించు ➔',
                                mr: 'नोंदवा ➔',
                                gu: 'સબમિટ ➔',
                                en: 'Submit ➔'
                            }[lang] || 'Submit ➔'}
                        </button>
                    </div>
                    <div style="font-size: 11.5px; color: #64748b; margin-top: 4px; padding-left: 8px;">
                        💡 <em>Tip: You can speak into the mic, tap any chip below, or type in your own words.</em>
                    </div>
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


        // Custom Freeform Typing Input Submission
        const textInput = container.querySelector("#input-custom-text-answer");
        const submitTextBtn = container.querySelector("#btn-submit-typed-answer");

        function submitCustomTypedText() {
            if (!textInput) return;
            const val = textInput.value.trim();
            if (!val) return;
            transcriptDisplay.textContent = `"${val}"`;
            translationDisplay.textContent = translateLiveSpeech(val);
            translationDisplay.style.display = "block";
            kioskState.updateSlot(step.key, val);
            setTimeout(() => advanceStep(), 400);
        }

        if (submitTextBtn) {
            submitTextBtn.addEventListener("click", submitCustomTypedText);
        }
        if (textInput) {
            textInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    submitCustomTypedText();
                }
            });
        }

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
