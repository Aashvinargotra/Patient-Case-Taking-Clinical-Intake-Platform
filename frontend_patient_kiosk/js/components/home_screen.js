/**
 * MediKiosk Home Screen Component (Hospital Clean White Theme + ABHA Auth Gateway)
 */
import { CONFIG } from "../config.js";
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";
import { renderAbhaAuthModal } from "./abha_auth_modal.js";

export function renderHomeScreen(container, onDisciplineSelect) {
    const state = kioskState.getState();

    const welcomeTexts = {
        hi: {
            title: "अखिल भारतीय आयुर्वेद संस्थान (AIIA) एवं संबद्ध अस्पताल",
            subtitle: "कृपया अपनी परामर्श प्रणाली चुनें — आधुनिक चिकित्सा या आयुर्वेद ओपीडी",
            abhaBtn: "🪪 आभा (ABHA) आईडी से लॉगिन / पंजीकरण करें",
            abhaLinked: "आभा आईडी लिंक है:",
            walkinTitle: "त्वरित वॉक-इन पर्ची (वैकल्पिक मोबाइल)",
            phonePlaceholder: "अपना 10-अंकीय मोबाइल नंबर दर्ज करें",
            audioPrompt: "अखिल भारतीय आयुर्वेद संस्थान में आपका स्वागत है। कृपया आधुनिक चिकित्सा या आयुर्वेद ओपीडी का चयन करें।"
        },
        pa: {
            title: "ਆਲ ਇੰਡੀਆ ਇੰਸਟੀਚਿਊਟ ਆਫ਼ ਆਯੁਰਵੇਦ ਅਤੇ ਸੰਬੰਧਿਤ ਹਸਪਤਾਲ",
            subtitle: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਓ.ਪੀ.ਡੀ. ਸਿਸਟਮ ਚੁਣੋ — ਐਲੋਪੈਥੀ ਜਾਂ ਆਯੁਰਵੇਦ",
            abhaBtn: "🪪 ਆਭਾ (ABHA) ਆਈ.ਡੀ. ਨਾਲ ਲੌਗਇਨ / ਰਜਿਸਟਰ ਕਰੋ",
            abhaLinked: "ਆਭਾ ਆਈ.ਡੀ. ਲਿੰਕ ਹੈ:",
            walkinTitle: "ਤੁਰੰਤ ਵਾਕ-ਇਨ ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
            phonePlaceholder: "10-ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ",
            audioPrompt: "ਜੀ ਆਇਆਂ ਨੂੰ। ਕਿਰਪਾ ਕਰਕੇ ਐਲੋਪੈਥੀ ਜਾਂ ਆਯੁਰਵੇਦ ਓਪੀਡੀ ਦੀ ਚੋਣ ਕਰੋ।"
        },
        bn: {
            title: "অল ইন্ডিয়া ইনস্টিটিউট অফ আয়ুর্বেদ ও সংশ্লিষ্ট হাসপাতাল",
            subtitle: "আপনার পরামর্শ ব্যবস্থা নির্বাচন করুন — এলোপ্যাথি বা আয়ুর্বেদ ওপিডি",
            abhaBtn: "🪪 আভা (ABHA) আইডি দিয়ে লগইন / নিবন্ধন করুন",
            abhaLinked: "আভা আইডি সংযুক্ত:",
            walkinTitle: "দ্রুত ওয়াক-ইন রেজিস্ট্রেশন",
            phonePlaceholder: "১০-সংখ্যার মোবাইল নম্বর লিখুন",
            audioPrompt: "মেডিকিয়স্কে স্বাগতম। আধুনিক চিকিৎসা অথবা আয়ুর্বেদ ওপিডি নির্বাচন করুন।"
        },
        ta: {
            title: "அகில இந்திய ஆயுர்வேத நிறுவனம் மற்றும் தொடர்புடைய மருத்துவமனைகள்",
            subtitle: "உங்கள் ஆலோசனை முறையைத் தேர்ந்தெடுக்கவும் — அலோபதி அல்லது ஆயுர்வேதம்",
            abhaBtn: "🪪 ஆபா (ABHA) ஐடி மூலம் உள்நுழைவு / பதிவு",
            abhaLinked: "ஆபா ஐடி இணைக்கப்பட்டுள்ளது:",
            walkinTitle: "விரைவான வாக்-இன் பதிவு",
            phonePlaceholder: "10 இலக்க மொபைல் எண்",
            audioPrompt: "வணக்கம். அலோபதி அல்லது ஆயுர்வேத ஓபிடியைத் தேர்ந்தெடுக்கவும்."
        },
        te: {
            title: "ఆల్ ఇండియా ఇన్స్టిట్యూట్ ఆఫ్ ఆయుర్వేద మరియు అనుబంధ ఆసుపత్రులు",
            subtitle: "మీ సంప్రదింపు వ్యవస్థను ఎంచుకోండి — అలోపతి లేదా ఆయుర్వేదం",
            abhaBtn: "🪪 ఆభా (ABHA) IDతో లాగిన్ / నమోదు",
            abhaLinked: "ఆభా ID లింక్ చేయబడింది:",
            walkinTitle: "త్వరిత వాక్-ఇన్ నమోదు",
            phonePlaceholder: "10 అంకెల మొబైల్ నంబర్",
            audioPrompt: "స్వాగతం. దయచేసి ఆధునిక వైద్యం లేదా ఆయుర్వేద ఓపీడీని ఎంచుకోండి."
        },
        mr: {
            title: "अखिल भारतीय आयुर्वेद संस्थान आणि संलग्न रुग्णालये",
            subtitle: "कृपया आपली सल्लामसलत प्रणाली निवडा — आधुनिक औषधोपचार किंवा आयुर्वेद ओपीडी",
            abhaBtn: "🪪 आभा (ABHA) आयडीने लॉगिन / नोंदणी करा",
            abhaLinked: "आभा आयडी जोडला आहे:",
            walkinTitle: "त्वरित वॉक-इन नोंदणी",
            phonePlaceholder: "१० अंकी मोबाईल नंबर",
            audioPrompt: "स्वागत आहे. कृपया आधुनिक औषधोपचार किंवा आयुर्वेद ओपीडी निवडा."
        },
        gu: {
            title: "ઓલ ઇન્ડિયા ઇન્સ્ટિટ્યૂટ ઓફ આયુર્વેદ અને સંલગ્ન હોસ્પિટલો",
            subtitle: "કૃપા કરીને તમારી કન્સલ્ટેશન સિસ્ટમ પસંદ કરો — એલોપેથી અથવા આયુર્વેદ ઓપીડી",
            abhaBtn: "🪪 આભા (ABHA) આઈડીથી લૉગિન / નોંધણી કરો",
            abhaLinked: "આભા આઈડી લિંક થયેલ છે:",
            walkinTitle: "ઝડપી વૉક-ઇન નોંધણી",
            phonePlaceholder: "૧૦ અંકનો મોબાઇલ નંબર",
            audioPrompt: "સ્વાગત છે. કૃપા કરીને આધુનિક દવા અથવા આયુર્વેદ ઓપીડી પસંદ કરો."
        },
        en: {
            title: "All India Institute of Ayurveda & Associated Hospitals",
            subtitle: "Please select your clinical consultation discipline to begin pre-consultation intake",
            abhaBtn: "🪪 Login / Register with ABHA ID (ABDM)",
            abhaLinked: "ABHA Linked Patient:",
            walkinTitle: "Quick Walk-in Registration (Optional Mobile)",
            phonePlaceholder: "Enter 10-digit mobile number",
            audioPrompt: "Welcome to MediKiosk. Please select Modern Medicine or Ayurveda OPD to begin."
        }
    };

    const text = welcomeTexts[state.language] || welcomeTexts.hi;

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 1200px; margin: auto; animation: fade-in 300ms ease;">
            
            <div style="text-align: center; margin-bottom: 28px;">
                <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 13px; font-weight: 800; padding: 4px 14px; border-radius: 9999px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    Ministry of Ayush & MoHFW • Government of India
                </span>
                <h2 style="font-size: var(--font-size-2xl); font-weight: 800; color: #0f172a; margin-bottom: 6px;">${text.title}</h2>
                <p style="font-size: var(--font-size-lg); color: var(--text-secondary); max-width: 850px; margin: auto;">${text.subtitle}</p>
            </div>

            <!-- ABHA Authentication & Patient Identity Banner -->
            <div style="width: 100%; max-width: 800px; margin-bottom: 28px; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: var(--radius-md); padding: 16px 20px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 8px; background: #f0fdfa; border: 1px solid #99f6e4; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                        🪪
                    </div>
                    <div>
                        ${state.abhaAddress ? `
                            <div style="font-size: 13px; color: #059669; font-weight: 800;">✓ ${text.abhaLinked}</div>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${state.patientName || 'Aarav Sharma'} (${state.abhaAddress})</div>
                        ` : `
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">Ayushman Bharat Digital Health Account (ABDM)</div>
                            <div style="font-size: 13px; color: #64748b;">Instant EHR sync, historical prescription linking & fast-track token</div>
                        `}
                    </div>
                </div>
                <button id="btn-open-abha" class="header-btn active" style="padding: 0 20px; font-size: 14px; white-space: nowrap;">
                    ${state.abhaAddress ? 'Change ABHA ID ➔' : text.abhaBtn}
                </button>
            </div>

            <!-- 50/50 Dual Discipline Cards -->
            <div class="discipline-grid" role="region" aria-label="Clinical Discipline Selection">
                
                <!-- Modern Medicine (Allopathy) Card -->
                <div class="discipline-card allopathy" id="card-allopathy" tabindex="0" role="button" aria-label="Select Modern Medicine (Allopathy) OPD. SOCRATES Framework.">
                    <div class="discipline-icon">🩺</div>
                    <div class="discipline-title">${CONFIG.DISCIPLINES.ALLOPATHY.title}</div>
                    <div class="discipline-subtitle">
                        General Medicine, Cardiology, Orthopedics, Gastroenterology, Dermatology.
                        Standard 7-step SOCRATES pain & clinical exploration protocol.
                    </div>
                    <div class="discipline-badge" style="color: #0369a1; background: #f0f9ff; border-color: #bae6fd;">
                        ${CONFIG.DISCIPLINES.ALLOPATHY.framework}
                    </div>
                </div>

                <!-- AYUSH / Ayurveda Card -->
                <div class="discipline-card ayush" id="card-ayush" tabindex="0" role="button" aria-label="Select Ayurveda & AYUSH OPD. Dashavidha Pariksha Framework.">
                    <div class="discipline-icon">🌿</div>
                    <div class="discipline-title">${CONFIG.DISCIPLINES.AYUSH.title}</div>
                    <div class="discipline-subtitle">
                        Kayachikitsa, Panchakarma, Shalya Tantra, Agni & Twak Roga.
                        Standard Dashavidha Pariksha & Ahara-Vihara holistic evaluation.
                    </div>
                    <div class="discipline-badge" style="color: #b45309; background: #fffbeb; border-color: #fde68a;">
                        ${CONFIG.DISCIPLINES.AYUSH.framework}
                    </div>
                </div>

            </div>

            <!-- Quick Walk-in Phone Number / Guest Input -->
            <div style="margin-top: 28px; width: 100%; max-width: 650px; background: #ffffff; border: 1.5px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px 24px; text-align: center; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
                <h3 style="font-size: var(--font-size-base); font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">${text.walkinTitle}</h3>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <input type="tel" id="walkin-phone-input" placeholder="${text.phonePlaceholder}" maxlength="10" 
                           value="${state.patientPhone || ''}"
                           style="flex: 1; height: var(--tap-target-min); border-radius: var(--radius-md); border: 1.5px solid #cbd5e1; background: #f8fafc; color: #0f172a; font-size: var(--font-size-base); padding: 0 16px; text-align: center;" />
                </div>
            </div>

        </div>
    `;

    // Speak introductory greeting in selected vernacular language
    setTimeout(() => {
        audioController.speak(text.audioPrompt, state.language);
    }, 300);

    // Event handlers
    const phoneInput = container.querySelector("#walkin-phone-input");

    // Open ABHA Modal
    container.querySelector("#btn-open-abha").addEventListener("click", () => {
        renderAbhaAuthModal(container, (patient) => {
            renderHomeScreen(container, onDisciplineSelect);
        });
    });

    container.querySelector("#card-allopathy").addEventListener("click", () => {
        kioskState.setState({ discipline: "ALLOPATHY", patientPhone: phoneInput.value });
        if (onDisciplineSelect) onDisciplineSelect("ALLOPATHY");
    });

    container.querySelector("#card-ayush").addEventListener("click", () => {
        kioskState.setState({ discipline: "AYUSH", patientPhone: phoneInput.value });
        if (onDisciplineSelect) onDisciplineSelect("AYUSH");
    });
}
