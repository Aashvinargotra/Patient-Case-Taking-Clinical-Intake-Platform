/**
 * MediKiosk Home Screen Component (50/50 Dual Discipline Selection)
 */
import { CONFIG } from "../config.js";
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";

export function renderHomeScreen(container, onDisciplineSelect) {
    const state = kioskState.getState();

    const welcomeTexts = {
        hi: {
            title: "अखिल भारतीय आयुर्वेद संस्थान में आपका स्वागत है",
            subtitle: "कृपया अपनी परामर्श प्रणाली चुनें — आधुनिक चिकित्सा या आयुर्वेद ओपीडी",
            walkinTitle: "त्वरित वॉक-इन पर्ची",
            phonePlaceholder: "अपना 10-अंकीय मोबाइल नंबर दर्ज करें (वैकल्पिक)",
            startBtn: "ओपीडी परामर्श प्रारंभ करें ➔",
            audioPrompt: "अखिल भारतीय आयुर्वेद संस्थान में आपका स्वागत है। कृपया आधुनिक चिकित्सा या आयुर्वेद ओपीडी का चयन करें।"
        },
        pa: {
            title: "ਆਲ ਇੰਡੀਆ ਇੰਸਟੀਚਿਊਟ ਆਫ਼ ਆਯੁਰਵੇਦ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
            subtitle: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਓ.ਪੀ.ਡੀ. ਸਿਸਟਮ ਚੁਣੋ — ਐਲੋਪੈਥੀ ਜਾਂ ਆਯੁਰਵੇਦ",
            walkinTitle: "ਤੁਰੰਤ ਵਾਕ-ਇਨ ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
            phonePlaceholder: "10-ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ",
            startBtn: "ਓ.ਪੀ.ਡੀ. ਸ਼ੁਰੂ ਕਰੋ ➔",
            audioPrompt: "ਜੀ ਆਇਆਂ ਨੂੰ। ਕਿਰਪਾ ਕਰਕੇ ਐਲੋਪੈਥੀ ਜਾਂ ਆਯੁਰਵੇਦ ਓਪੀਡੀ ਦੀ ਚੋਣ ਕਰੋ।"
        },
        en: {
            title: "Welcome to All India Institute of Ayurveda & Associated Hospitals",
            subtitle: "Please select your clinical consultation discipline to begin pre-consultation intake",
            walkinTitle: "Quick Walk-in Registration",
            phonePlaceholder: "Enter 10-digit mobile number (Optional)",
            startBtn: "Start Clinical Intake ➔",
            audioPrompt: "Welcome to MediKiosk. Please select Modern Medicine or Ayurveda OPD to begin."
        }
    };

    const text = welcomeTexts[state.language] || welcomeTexts.hi;

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 1200px; margin: auto; animation: fade-in 300ms ease;">
            
            <div style="text-align: center; margin-bottom: 36px;">
                <h2 style="font-size: var(--font-size-2xl); font-weight: 800; margin-bottom: 8px;">${text.title}</h2>
                <p style="font-size: var(--font-size-lg); color: var(--text-secondary); max-width: 800px; margin: auto;">${text.subtitle}</p>
            </div>

            <!-- 50/50 Dual Discipline Cards -->
            <div class="discipline-grid" role="region" aria-label="Clinical Discipline Selection">
                
                <!-- Modern Medicine (Allopathy) Card -->
                <div class="discipline-card allopathy" id="card-allopathy" tabindex="0" role="button" aria-label="Select Modern Medicine (Allopathy) OPD. SOCRATES Framework.">
                    <div class="discipline-icon">🩺</div>
                    <div class="discipline-title">${CONFIG.DISCIPLINES.ALLOPATHY.title}</div>
                    <div class="discipline-subtitle">
                        General Medicine, Cardiology, Orthopedics, Gastro, Dermatology.
                        Structured 7-step SOCRATES pain & symptom exploration.
                    </div>
                    <div class="discipline-badge" style="color: #38bdf8;">${CONFIG.DISCIPLINES.ALLOPATHY.framework}</div>
                </div>

                <!-- AYUSH / Ayurveda Card -->
                <div class="discipline-card ayush" id="card-ayush" tabindex="0" role="button" aria-label="Select Ayurveda & AYUSH OPD. Dashavidha Pariksha Framework.">
                    <div class="discipline-icon">🌿</div>
                    <div class="discipline-title">${CONFIG.DISCIPLINES.AYUSH.title}</div>
                    <div class="discipline-subtitle">
                        Kayachikitsa, Panchakarma, Shalya Tantra, Agni Chikitsa.
                        Standard Dashavidha Pariksha & Ahara-Vihara holistic evaluation.
                    </div>
                    <div class="discipline-badge" style="color: #fbbf24;">${CONFIG.DISCIPLINES.AYUSH.framework}</div>
                </div>

            </div>

            <!-- Quick Walk-in Phone Number / Guest Input -->
            <div style="margin-top: 36px; width: 100%; max-width: 600px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; text-align: center;">
                <h3 style="font-size: var(--font-size-base); font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">${text.walkinTitle}</h3>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <input type="tel" id="walkin-phone-input" placeholder="${text.phonePlaceholder}" maxlength="10" 
                           style="flex: 1; height: var(--tap-target-min); border-radius: var(--radius-md); border: 2px solid var(--border-subtle); background: var(--bg-surface-elevated); color: #fff; font-size: var(--font-size-base); padding: 0 16px; text-align: center;" />
                </div>
            </div>

        </div>
    `;

    // Speak introductory greeting
    setTimeout(() => {
        audioController.speak(text.audioPrompt, state.language);
    }, 400);

    // Event handlers
    const phoneInput = container.querySelector("#walkin-phone-input");

    container.querySelector("#card-allopathy").addEventListener("click", () => {
        kioskState.setState({ discipline: "ALLOPATHY", patientPhone: phoneInput.value });
        if (onDisciplineSelect) onDisciplineSelect("ALLOPATHY");
    });

    container.querySelector("#card-ayush").addEventListener("click", () => {
        kioskState.setState({ discipline: "AYUSH", patientPhone: phoneInput.value });
        if (onDisciplineSelect) onDisciplineSelect("AYUSH");
    });
}
