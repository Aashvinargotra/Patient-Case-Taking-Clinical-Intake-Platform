/**
 * MediKiosk Patient Kiosk Main Application Coordinator (Restructured Flow + 100% I18N Parity)
 * Flow:
 * 1. AUTH_GATEWAY (First Screen: Login / Register / Walk-in)
 * 2. DISCIPLINE_SELECT (Screen 2: Post-login greeting + Ayurveda vs Allopathy)
 * 3. BODY_MAP (Screen 3: Pain / Symptom body region)
 * 4. VOICE_INTAKE (Screen 4: Spoken Dialogue + Live Translation)
 * 5. DOC_SCANNER (Screen 5: Prescription / Lab OCR Scanner)
 * 6. COMPLETION_HOSPITAL (Screen 6 & 7: Save to Account vs Generate Parchi + Linked Hospital)
 * 7. SLIP_SUMMARY (Screen 8: Digital OPD Parchi with selected hospital name and room)
 */
import { getTranslation } from "./config.js";
import { kioskState } from "./state.js";
import { audioController } from "./audio_controller.js";
import { inactivityTimer } from "./inactivity_timer.js";
import { apiService } from "./api_service.js";
import { getIcon } from "./icons.js";

// Components
import { renderHeaderBar } from "./components/header_bar.js";
import { renderAuthScreen } from "./components/auth_screen.js";
import { renderDisciplineScreen } from "./components/discipline_screen.js";
import { renderBodyMapPicker } from "./components/body_map_picker.js";
import { renderVoiceLoop } from "./components/voice_loop_modal.js";
import { renderCameraScanner } from "./components/camera_scanner.js";
import { renderCompletionHospitalFlow } from "./components/completion_hospital_modal.js";
import { renderSlipGenerator } from "./components/slip_generator.js";
import { renderPatientDashboard } from "./components/patient_dashboard.js";

class MediKioskApp {
    constructor() {
        this.appContainer = document.getElementById("app-root");
        this.headerContainer = document.getElementById("header-root");
        this.viewportContainer = document.getElementById("viewport-root");
        this.footerContainer = document.getElementById("footer-root");
        this.modalContainer = document.getElementById("modal-root");
        this.currentScreen = "AUTH";
        this.tokenData = null;
    }

    init() {
        console.log("Initializing MediKiosk Hospital Kiosk with Multilingual Engine...");
        
        // Render persistent header
        renderHeaderBar(this.headerContainer, (newLang) => {
            this.onLanguageChange(newLang);
        });

        // Render persistent accessibility footer
        this.renderFooter();

        // Initialize Inactivity Timer with 2.5 min warning modal & 3.0 min timeout wipe
        inactivityTimer.init(
            (warningPrompt) => this.showInactivityModal(warningPrompt),
            () => this.navigateTo("AUTH")
        );

        // State Subscription
        kioskState.subscribe((state) => {
            if (state.currentScreen === "AUTH") {
                this.modalContainer.innerHTML = "";
            }
        });

        // Start at AUTH (Screen 1)
        this.navigateTo("AUTH");
    }

    onLanguageChange(lang) {
        this.renderFooter();
        this.renderCurrentScreen();
    }

    renderFooter() {
        const state = kioskState.getState();
        const t = getTranslation(state.language);
        const isVoiceScreen = this.currentScreen === "VOICE_INTAKE";

        this.footerContainer.innerHTML = `
            <footer class="kiosk-footer-accessibility" role="contentinfo">
                <div class="access-btn-group">
                    ${isVoiceScreen ? `
                        <button class="access-btn" id="btn-repeat-audio" aria-label="${t.repeatQuestion}">
                            <span style="display: flex; align-items: center;">${getIcon('volume-2', { size: 16, color: 'currentColor' })}</span>
                            <span>${t.repeatQuestion}</span>
                        </button>
                    ` : ''}
                    
                    <button class="access-btn ${state.slowSpeechMode ? 'active' : ''}" id="btn-slow-speech" aria-label="${t.slowSpeech}">
                        <span style="display: flex; align-items: center;">${getIcon('gauge', { size: 16, color: 'currentColor' })}</span>
                        <span>${t.slowSpeech}</span>
                    </button>

                    <button class="access-btn" id="btn-pause-time" aria-label="${t.needMoreTime}">
                        <span style="display: flex; align-items: center;">${getIcon('pause', { size: 16, color: 'currentColor' })}</span>
                        <span>${t.needMoreTime}</span>
                    </button>
                </div>

                <div class="access-btn-group">
                    <button class="access-btn emergency-btn" id="btn-emergency-help" aria-label="${t.emergencyHelp}">
                        <span style="display: flex; align-items: center;">${getIcon('alert-circle', { size: 16, color: '#ffffff' })}</span>
                        <span>${t.emergencyHelp}</span>
                    </button>
                </div>
            </footer>
        `;

        // Bind Repeat Button only if present
        const repeatBtn = this.footerContainer.querySelector("#btn-repeat-audio");
        if (repeatBtn) {
            repeatBtn.addEventListener("click", () => {
                const curState = kioskState.getState();
                const repeatPrompt = curState.language === 'en'
                    ? "Please listen to the questions on screen and select or speak your answer."
                    : "कृपया स्क्रीन पर दिए गए प्रश्नों को सुनें और अपना उत्तर बोलें या चुनें।";
                audioController.speak(repeatPrompt, curState.language);
            });
        }

        this.footerContainer.querySelector("#btn-slow-speech").addEventListener("click", (e) => {
            const next = !kioskState.getState().slowSpeechMode;
            kioskState.setState({ slowSpeechMode: next });
            e.currentTarget.classList.toggle("active", next);
            const ann = next 
                ? (kioskState.getState().language === 'hi' ? 'धीमी आवाज़ सक्रिय' : 'Slow speech enabled')
                : (kioskState.getState().language === 'hi' ? 'सामान्य आवाज़' : 'Normal speech enabled');
            audioController.speak(ann, kioskState.getState().language);
        });

        this.footerContainer.querySelector("#btn-pause-time").addEventListener("click", () => {
            inactivityTimer.pauseTimer();
            alert(kioskState.getState().language === 'hi' ? "समय सीमा रोक दी गई है। आराम से पूरा करें।" : "Timer paused. Take your time.");
        });

        this.footerContainer.querySelector("#btn-emergency-help").addEventListener("click", () => {
            this.triggerEmergencyHelp();
        });
    }

    navigateTo(screen) {
        this.currentScreen = screen;
        kioskState.setState({ currentScreen: screen });
        this.renderFooter();
        this.renderCurrentScreen();
    }

    renderCurrentScreen() {
        this.viewportContainer.innerHTML = "";

        switch (this.currentScreen) {
            case "AUTH":
                renderAuthScreen(this.viewportContainer, (patient) => {
                    // Authenticated users go to their Patient Profile Dashboard;
                    // Temporary walk-in patients proceed directly to DISCIPLINE intake
                    if (patient && patient.is_temporary) {
                        this.navigateTo("DISCIPLINE");
                    } else {
                        this.navigateTo("PATIENT_DASHBOARD");
                    }
                });
                break;

            case "PATIENT_DASHBOARD":
                renderPatientDashboard(
                    this.viewportContainer,
                    () => {
                        this.navigateTo("DISCIPLINE");
                    },
                    () => {
                        this.navigateTo("AUTH");
                    }
                );
                break;

            case "DISCIPLINE":
                renderDisciplineScreen(this.viewportContainer, (discipline) => {
                    this.navigateTo("BODY_MAP");
                });
                break;

            case "BODY_MAP":
                renderBodyMapPicker(this.viewportContainer, (bodyArea) => {
                    this.navigateTo("VOICE_INTAKE");
                });
                break;

            case "VOICE_INTAKE":
                renderVoiceLoop(this.viewportContainer, () => {
                    this.navigateTo("DOC_SCANNER");
                });
                break;

            case "DOC_SCANNER":
                renderCameraScanner(this.viewportContainer, () => {
                    this.navigateTo("COMPLETION_HOSPITAL");
                });
                break;

            case "COMPLETION_HOSPITAL":
                renderCompletionHospitalFlow(this.viewportContainer, (tokenData) => {
                    this.tokenData = tokenData;
                    this.navigateTo("SLIP_SUMMARY");
                });
                break;

            case "SLIP_SUMMARY":
                renderSlipGenerator(this.viewportContainer, this.tokenData, () => {
                    // Reset and return to start
                    kioskState.flushMemory();
                    this.navigateTo("AUTH");
                });
                break;

            default:
                this.navigateTo("AUTH");
        }
    }

    showInactivityModal(promptText) {
        const state = kioskState.getState();
        const t = getTranslation(state.language);

        this.modalContainer.innerHTML = `
            <div class="modal-overlay" role="alertdialog" aria-modal="true">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3 style="color: var(--amber-warning); font-size: 22px; display: flex; align-items: center; gap: 8px;">
                            ${getIcon('clock', { size: 22, color: 'var(--amber-warning)' })}
                            <span>${promptText}</span>
                        </h3>
                    </div>
                    <div class="modal-body">
                        <p style="font-size: var(--font-size-base); color: var(--text-secondary);">
                            ${state.language === 'en' 
                                ? 'For your privacy and security, this session will reset automatically if no input is detected.'
                                : 'आपकी गोपनीयता और सुरक्षा के लिए, यदि कोई गतिविधि नहीं होती है तो यह सत्र रीसेट हो जाएगा।'
                            }
                        </p>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 16px; justify-content: flex-end;">
                        <button class="access-btn" id="btn-modal-exit" style="background: var(--bg-surface-elevated);">
                            ${state.language === 'en' ? 'Exit Now' : 'अभी समाप्त करें'}
                        </button>
                        <button class="header-btn active" id="btn-modal-continue" style="padding: 0 28px;">
                            ${state.language === 'en' ? 'I Am Still Here' : 'मैं अभी भी यहाँ हूँ'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.modalContainer.querySelector("#btn-modal-continue").addEventListener("click", () => {
            inactivityTimer.resetTimer();
            this.modalContainer.innerHTML = "";
        });

        this.modalContainer.querySelector("#btn-modal-exit").addEventListener("click", () => {
            inactivityTimer.onTimeoutTrigger();
        });
    }

    triggerEmergencyHelp() {
        const state = kioskState.getState();
        const lang = state.language;
        const msg = lang === 'en' 
            ? "Emergency Assistance Alerted! An orderly is on their way." 
            : "आपातकालीन सहायता सतर्क! कर्मचारी आपकी सहायता के लिए आ रहे हैं।";
        
        audioController.speak(msg, lang);
        alert(`[EMERGENCY ALERT] ${msg}`);
    }
}

// Instantiate and Mount Kiosk App on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    window.kioskApp = new MediKioskApp();
    window.kioskApp.init();
});
