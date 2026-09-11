/**
 * MediKiosk Patient Kiosk Configuration
 */
export const CONFIG = {
    APP_NAME: "MediKiosk",
    HOSPITAL_NAME: "All India Institute of Ayurveda & Associated Hospitals",
    API_BASE_URL: "http://localhost:8000/api/v1",
    WS_TRIAGE_URL: "ws://localhost:8000/api/v1/triage/ws",
    
    // Inactivity Timers (in milliseconds)
    INACTIVITY_WARN_MS: 150000,    // 2.5 Minutes: Audio Warning Check-in
    INACTIVITY_TIMEOUT_MS: 180000, // 3.0 Minutes: Memory Flush & Return to Home
    
    // Supported Regional Languages
    LANGUAGES: [
        { code: "hi", name: "हिन्दी", script: "Devanagari", nativeVoice: "hi-IN" },
        { code: "pa", name: "ਪੰਜਾਬੀ", script: "Gurmukhi", nativeVoice: "pa-IN" },
        { code: "en", name: "English", script: "Latin", nativeVoice: "en-IN" },
        { code: "bn", name: "বাংলা", script: "Bengali", nativeVoice: "bn-IN" },
        { code: "ta", name: "தமிழ்", script: "Tamil", nativeVoice: "ta-IN" },
        { code: "te", name: "తెలుగు", script: "Telugu", nativeVoice: "te-IN" },
        { code: "mr", name: "मराठी", script: "Devanagari", nativeVoice: "mr-IN" },
        { code: "gu", name: "ગુજરાતી", script: "Gujarati", nativeVoice: "gu-IN" }
    ],

    // Department Quick References
    DISCIPLINES: {
        ALLOPATHY: {
            id: "ALLOPATHY",
            title: "Modern Medicine (Allopathy)",
            titleHi: "एलोपैथी (आधुनिक चिकित्सा)",
            titlePa: "ਐਲੋਪੈਥੀ (ਆਧੁਨਿਕ ਦਵਾਈ)",
            badgeColor: "#0284c7",
            framework: "SOCRATES 7-Step Clinical Intake"
        },
        AYUSH: {
            id: "AYUSH",
            title: "Ayurveda & AYUSH OPD",
            titleHi: "आयुर्वेद एवं आयुष ओपीडी",
            titlePa: "ਆਯੁਰਵੇਦ ਅਤੇ ਆਯੁਸ਼ ਓ.ਪੀ.ਡੀ.",
            badgeColor: "#d97706",
            framework: "Dashavidha Pariksha & Ahara-Vihara Intake"
        }
    }
};
