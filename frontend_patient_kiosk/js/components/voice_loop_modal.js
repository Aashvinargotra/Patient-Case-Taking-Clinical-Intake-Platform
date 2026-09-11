/**
 * MediKiosk Multimodal Clinical Dialogue & Conversational Voice Loop Component
 * Includes:
 * 1. Multilingual Audio Playback for Allopathy & Ayurveda Dashavidha Pariksha
 * 2. Live On-Screen Real-Time Speech-to-Text Transcription & Translation
 * 3. Hospital-Friendly Clean Clinical White Aesthetic
 */
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";
import { apiService } from "../api_service.js";

export function renderVoiceLoop(container, onCompleteIntake) {
    const state = kioskState.getState();
    const isAyush = state.discipline === "AYUSH";
    const lang = state.language || "hi";

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
            chips: ["छाती में दर्द", "तेज़ बुखार", "सिरदर्द", "घुटनों में दर्द", "पेट में दर्द", "खांसी व ज़ुकाम"]
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
            chips: ["आज अचानक", "2-3 दिन से", "1 सप्ताह से", "1 महीने से अधिक"]
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
            chips: ["भारीपन व दबाव", "तीव्र चुभन", "जलन", "हल्का दर्द", "लगातार बना रहता है"]
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
            chips: ["पसीना व घबराहट", "सांस फूलना", "उल्टी व मितली", "कोई अन्य लक्षण नहीं"]
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
            chips: ["डायबिटीज (शुगर)", "हाई बीपी", "थायराइड", "कोई पूर्व बीमारी नहीं"]
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
                hi: "कृपया बताएं कि आप किस मुख्य रोग, दर्द या व्याधि के लिए आयुर्वेदिक परामर्श लेना चाहते हैं?",
                pa: "ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਤੁਸੀਂ ਕਿਸ ਰੋਗ ਜਾਂ ਦਰਦ ਲਈ ਆਯੁਰਵੇਦ ਸਲਾਹ ਲੈਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
                bn: "দয়া করে বলুন আপনি কোন রোগের জন্য আয়ুর্বেদিক পরামর্শ নিতে চান?",
                ta: "எந்த நோய் அல்லது பிரச்சினைக்காக ஆயுர்வேத ஆலோசனை பெற விரும்புகிறீர்கள்?",
                te: "మీరు ఏ సమస్య కోసం ఆయుర్వేద సంప్రదింపులను పొందాలనుకుంటున్నారు?",
                mr: "कृपया सांगा की आपण कोणत्या मुख्य रोगासाठी आयुर्वेदिक सल्ला घेऊ इच्छिता?",
                gu: "કૃપા કરીને જણાવો કે તમે કયા મુખ્ય રોગ માટે આયુર્વેદિક સલાહ લેવા માંગો છો?",
                en: "Please describe the primary health complaint or condition for your Ayurvedic consultation."
            },
            chips: ["संधिवात (जोड़ों का दर्द)", "अम्लपित्त (एसिडिटी/गैस)", "कब्ज व मंदाग्नि", "त्वचा रोग व खुजली", "पुराना ज्वर (बुखार)", "अनिद्रा व तनाव"]
        },
        {
            key: "prakriti_vikriti",
            stepNum: 2,
            title: {
                hi: "दोष प्रकोप व प्रकृति लक्षण (वात, पित्त, कफ)",
                pa: "ਦੋਸ਼ ਤੇ ਪ੍ਰਕ੍ਰਿਤੀ ਲੱਛਣ (ਵਾਤ, ਪਿੱਤ, ਕਫ਼)",
                bn: "দোষ ও প্রকৃতি লক্ষণ (বাত, পিত্ত, কফ)",
                ta: "தோஷ மற்றும் பிரகிருதி அறிகுறிகள் (வாதம், பித்தம், கபம்)",
                te: "దోష మరియు ప్రకృతి లక్షణాలు (వాతం, పిత్తం, కఫం)",
                mr: "दोष व प्रकृती लक्षणे (वात, पित्त, कफ)",
                gu: "દોષ અને પ્રકૃતિના લક્ષણો (વાત, પિત્ત, કફ)",
                en: "Doshic Imbalance & Constitution (Vata, Pitta, Kapha)"
            },
            audioPrompt: {
                hi: "क्या आपको शरीर में रूखापन व दर्द, अत्यधिक गर्मी व जलन, या भारीपन व कफ महसूस होता है?",
                pa: "ਕੀ ਤੁਹਾਨੂੰ ਸਰੀਰ ਵਿੱਚ ਰੁੱਖਾਪਨ, ਬਹੁਤ ਗਰਮੀ ਜਾਂ ਜਲਣ, ਜਾਂ ਭਾਰੀਪਨ ਮਹਿਸੂਸ ਹੁੰਦਾ ਹੈ?",
                bn: "আপনার কি শরীরে শুষ্কতা ও ব্যথা, অতিরিক্ত গরম ও জ্বালা, নাকি ভারী ভাব ও কফ অনুভূত হয়?",
                ta: "உடலில் வறட்சி மற்றும் வலி, அதிக உஷ்ணம் மற்றும் எரிச்சல், அல்லது பாரம் உள்ளதா?",
                te: "శరీరంలో పొడిబారడం, అధిక వేడి లేదా మంట, లేదా బరువుగా అనిపిస్తుందా?",
                mr: "शरीरात कोरडेपणा व वेदना, अति उष्णता व जळजळ, की जडपणा जाणवतो?",
                gu: "શું તમને શરીરમાં શુષ્કતા, વધુ ગરમી અથવા બળતરા, કે ભારેપણું લાગે છે?",
                en: "Do you experience body dryness and pain (Vata), burning heat (Pitta), or heaviness and congestion (Kapha)?"
            },
            chips: ["वात प्रकोप (रूखापन/दर्द)", "पित्त प्रकोप (गर्मी/जलन)", "कफ प्रकोप (भारीपन/कफ)", "द्विदोषज / मिश्रित"]
        },
        {
            key: "ahara_vihara_and_agni",
            stepNum: 3,
            title: {
                hi: "आहार, विहार एवं जठराग्नि (पाचन शक्ति व कोष्ठ)",
                pa: "ਖਾਣ-ਪੀਣ ਅਤੇ ਪਾਚਨ ਸ਼ਕਤੀ (ਜਠਰਾਗਨੀ)",
                bn: "খাদ্যাভ্যাস এবং পরিপাক ক্ষমতা (জঠরাগ্নি ও কোষ্ঠ)",
                ta: "உணவு பழக்கம் மற்றும் செரிமான சக்தி (அக்னி)",
                te: "ఆహారపు అలవాట్లు మరియు జీర్ణశక్తి (జఠరాగ్ని)",
                mr: "आहार, विहार आणि पचनशक्ती (अग्नी व कोष्ठ)",
                gu: "આહાર, વિહાર અને પાચન શક્તિ (જઠરાગ્નિ)",
                en: "Dietary Habits, Lifestyle & Digestive Fire (Agni / Kostha)"
            },
            audioPrompt: {
                hi: "आपकी भूख और पाचन शक्ति कैसी है? क्या भोजन समय पर पचता है और पेट साफ़ रहता है?",
                pa: "ਤੁਹਾਡੀ ਭੁੱਖ ਅਤੇ ਪਾਚਨ ਸ਼ਕਤੀ ਕਿਹੋ ਜਿਹੀ ਹੈ? ਕੀ ਭੋਜਨ ਠੀਕ ਪਚਦਾ ਹੈ?",
                bn: "আপনার ক্ষুধা এবং হজম ক্ষমতা কেমন? পেট কি নিয়মিত পরিষ্কার হয়?",
                ta: "உங்கள் பசி மற்றும் செரிமான சக்தி எவ்வாறு உள்ளது? வயிறு சரியாக சுத்தமாகிறதா?",
                te: "మీ ఆకలి మరియు జీర్ణక్రియ ఎలా ఉన్నాయి? ఆహారం సరిగ్గా జీర్ణమవుతుందా?",
                mr: "आपली भूक आणि पचनशक्ती कशी आहे? अन्न वेळेवर पचते का?",
                gu: "તમારી ભૂખ અને પાચન શક્તિ કેવી છે? શું પેટ સાફ રહે છે?",
                en: "How is your appetite and digestion? Is bowel evacuation regular?"
            },
            chips: ["मंदाग्नि (धीमा पाचन)", "तीक्ष्णाग्नि (अत्यधिक भूख/जलन)", "समाग्नि (उत्तम पाचन)", "विषमाग्नि (अनियमित पाचन)", "क्रूर कोष्ठ (कब्ज)"]
        },
        {
            key: "sattva_balam",
            stepNum: 4,
            title: {
                hi: "सत्त्व, शारीरिक बल एवं निद्रा (सत्त्व व बल परीक्षा)",
                pa: "ਮਾਨਸਿਕ ਸ਼ਾਂਤੀ, ਨੀਂਦ ਅਤੇ ਸਰੀਰਕ ਤਾਕਤ (ਸੱਤਵ ਪ੍ਰੀਖਿਆ)",
                bn: "মানসিক স্থিতি, ঘুম এবং শারীরিক বল (সত্ত্ব ও বল পরীক্ষা)",
                ta: "மன உறுதி, தூக்கம் மற்றும் உடல் பலம் (சத்துவ பரீக்ஷா)",
                te: "మానసిక స్థితి, నిద్ర మరియు శారీరక బలం (సత్త్వ పరీక్ష)",
                mr: "मानसिक स्थिती, झोप आणि शारीरिक ताकद (सत्त्व परीक्षा)",
                gu: "માનસિક સ્થિતિ, ઊંઘ અને શારીરિક શક્તિ (સત્ત્વ પરીક્ષા)",
                en: "Mental Resilience, Sleep Quality & Physical Strength (Sattva / Bala)"
            },
            audioPrompt: {
                hi: "आपकी नींद और मानसिक स्थिति कैसी है? क्या अनिद्रा, तनाव या थकावट रहती है?",
                pa: "ਤੁਹਾਡੀ ਨੀਂਦ ਅਤੇ ਮਾਨਸਿਕ ਸਥਿਤੀ ਕਿਹੋ ਜਿਹੀ ਹੈ? ਕੀ ਤਣਾਅ ਜਾਂ ਥਕਾਵਟ ਰਹਿੰਦੀ ਹੈ?",
                bn: "আপনার ঘুম এবং মানসিক স্থিতি কেমন? অনিদ্রা বা মানসিক চাপ আছে কি?",
                ta: "உங்கள் தூக்கம் மற்றும் மனநிலை எப்படி உள்ளது? தூக்கமின்மை அல்லது மன அழுத்தம் உள்ளதா?",
                te: "మీ నిద్ర మరియు మానసిక స్థితి ఎలా ఉంది? నిద్రలేమి లేదా ఒత్తిడి ఉందా?",
                mr: "आपली झोप आणि मानसिक स्थिती कशी आहे? निद्रानाश किंवा तणाव आहे का?",
                gu: "તમારી ઊંઘ અને માનસિક સ્થિતિ કેવી છે? તણાવ કે થાક રહે છે?",
                en: "How is your sleep pattern and mental energy? Do you experience stress or insomnia?"
            },
            chips: ["उत्तम निद्रा (प्रसन्न मन)", "अनिद्रा व बेचैनी", "अधिक तनाव व चिंता", "मध्यम बल (थकावट)"]
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
                        <span>Step ${currentStepIdx + 1} of ${steps.length}</span>
                        <span>•</span>
                        <span>${isAyush ? '🌿 AYUSH Dashavidha Pariksha' : '🩺 Modern Medicine SOCRATES'}</span>
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
                        ${lang === 'en' ? 'Tap microphone to speak or choose quick options below' : 'माइक पर बोलें या नीचे दिए गए विकल्पों को स्पर्श करें'}
                    </p>
                </div>

                <!-- Live Voice-to-Text Transcription & On-Screen Translation Stream Box -->
                <div class="live-speech-box" id="live-speech-container">
                    <div class="live-speech-header">
                        <span style="font-size: 13px; font-weight: 700; color: #64748b; display: flex; align-items: center; gap: 6px;">
                            💬 Live Vernacular Speech Recognition (${lang.toUpperCase()})
                        </span>
                        <span class="live-indicator-badge" id="live-indicator" style="display: none;">
                            <span class="live-dot"></span> LIVE STREAMING
                        </span>
                    </div>
                    <div class="live-transcription-text" id="live-transcript-display">
                        <span style="color: #94a3b8; font-style: italic;">(Waiting for voice input...)</span>
                    </div>
                    <div class="live-translation-text" id="live-translation-display" style="display: none;"></div>
                </div>

                <!-- Quick Touch Selection Chips -->
                <div class="chip-grid">
                    ${step.chips.map(chip => `
                        <button class="touch-chip" data-chip-val="${chip}">
                            <span>${chip}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Navigation Controls -->
                <div style="display: flex; justify-content: space-between; width: 100%; max-width: 800px; margin-top: 24px;">
                    <button class="header-btn" id="btn-prev-step" ${currentStepIdx === 0 ? 'disabled style="opacity: 0.4;"' : ''}>
                        ⬅️ ${lang === 'en' ? 'Previous' : 'पिछला'}
                    </button>
                    <button class="header-btn" id="btn-replay-audio" style="background: #f8fafc; border-color: #cbd5e1;">
                        🔊 ${lang === 'en' ? 'Repeat Question' : 'प्रश्न दोबारा सुनें'}
                    </button>
                    <button class="header-btn active" id="btn-next-step" style="padding: 0 32px; font-weight: 800;">
                        ${currentStepIdx === steps.length - 1 ? (lang === 'en' ? 'Confirm & Generate Token ➔' : 'पुष्टि करें एवं पर्ची बनाएं ➔') : (lang === 'en' ? 'Next ➔' : 'अगला ➔')}
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
                statusLabel.textContent = lang === 'en' ? "Listening... please speak now" : "सुन रहे हैं... बोलिए";
                transcriptDisplay.innerHTML = `<span style="color: #0d9488; font-weight: 600;">Listening to speech...</span>`;

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
                statusLabel.textContent = lang === 'en' ? "Recording complete" : "रिकॉर्डिंग पूर्ण";
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
