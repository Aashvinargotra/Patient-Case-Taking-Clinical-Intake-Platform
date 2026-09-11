/**
 * MediKiosk Patient Kiosk Main Application Coordinator
 */
import { kioskState } from "./state.js";
import { audioController } from "./audio_controller.js";
import { inactivityTimer } from "./inactivity_timer.js";
import { apiService } from "./api_service.js";

// Components
import { renderHeaderBar } from "./components/header_bar.js";
import { renderHomeScreen } from "./components/home_screen.js";
import { renderBodyMapPicker } from "./components/body_map_picker.js";
import { renderVoiceLoop } from "./components/voice_loop_modal.js";
import { renderCameraScanner } from "./components/camera_scanner.js";
import { renderSlipGenerator } from "./components/slip_generator.js";

class MediKioskApp {
    constructor() {
        this.appContainer = document.getElementById("app-root");
        this.headerContainer = document.getElementById("header-root");
        this.viewportContainer = document.getElementById("viewport-root");
        this.footerContainer = document.getElementById("footer-root");
        this.modalContainer = document.getElementById("modal-root");
        this.lastSpokenText = "";
    }

    init() {
        console.log("Initializing MediKiosk Universal Patient Kiosk...");
        
        // Render persistent header
        renderHeaderBar(this.headerContainer);

        // Render persistent accessibility footer
        this.renderFooter();

        // Initialize Inactivity Timer with 2.5 min warning modal & 3.0 min timeout wipe
        inactivityTimer.init(
            (warningPrompt) => this.showInactivityModal(warningPrompt),
            () => this.navigateTo("HOME")
        );

        // State Subscription
        kioskState.subscribe((state) => {
            if (state.currentScreen === "HOME") {
                this.modalContainer.innerHTML = "";
            }
        });

        // Start at HOME screen
        this.navigateTo("HOME");
    }

    renderFooter() {
        this.footerContainer.innerHTML = `
            <footer class="kiosk-footer-accessibility" role="contentinfo">
                <div class="access-btn-group">
                    <button class="access-btn" id="btn-repeat-audio" aria-label="Repeat last spoken audio question">
                        <span>🔊</span>
                        <span>Repeat Question</span>
                    </button>
                    
                    <button class="access-btn" id="btn-slow-speech" aria-label="Toggle Slow Speech Playback">
                        <span>🐢</span>
                        <span>Slow Speech</span>
                    </button>

                    <button class="access-btn" id="btn-pause-time" aria-label="Pause Inactivity Timer for Extra Time">
                        <span>⏸️</span>
                        <span>I Need More Time</span>
                    </button>
                </div>

                <div class="access-btn-group">
                    <button class="access-btn emergency-btn" id="btn-emergency-help" aria-label="Emergency Immediate Medical Assistance">
                        <span>🚨</span>
                        <span>EMERGENCY HELP</span>
                    </button>
                </div>
            </footer>
        `;

        // Bind Footer Buttons
        this.footerContainer.querySelector("#btn-repeat-audio").addEventListener("click", () => {
            const state = kioskState.getState();
            const repeatText = state.language === 'hi' ? "कृपया स्क्रीन पर दिए गए निर्देशों को सुनें।" : "Please listen to the instructions on screen.";
            audioController.speak(repeatText, state.language);
        });

        this.footerContainer.querySelector("#btn-slow-speech").addEventListener("click", (e) => {
            const next = !kioskState.getState().slowSpeechMode;
            kioskState.setState({ slowSpeechMode: next });
            e.currentTarget.classList.toggle("active", next);
            const ann = next ? (kioskState.getState().language === 'hi' ? 'धीमी आवाज़ सक्रिय' : 'Slow speech enabled') : 'Normal speech';
            audioController.speak(ann, kioskState.getState().language);
        });

        this.footerContainer.querySelector("#btn-pause-time").addEventListener("click", () => {
            inactivityTimer.pauseTimer();
            alert(kioskState.getState().language === 'hi' ? "समय सीमा रोक दी गई है। आराम से पूरा करें।" : "Timer paused. Take your time.");
        });

        this.footerContainer.querySelector("#btn-emergency-help").addEventListener("click", async () => {
            audioController.speak("आपातकालीन टीम को सूचित किया जा रहा है।", "hi");
            await apiService.evaluateTriage("Severe Emergency Help Button Pressed");
            alert("🚨 EMERGENCY ALERT DISPATCHED TO RED ZONE TRIAGE DESK! A nurse is on the way.");
        });
    }

    navigateTo(screenName, extraData = {}) {
        kioskState.setState({ currentScreen: screenName, ...extraData });
        inactivityTimer.resetTimer();
        this.viewportContainer.innerHTML = "";

        switch (screenName) {
            case "HOME":
                renderHomeScreen(this.viewportContainer, (discipline) => {
                    this.navigateTo("BODY_MAP");
                });
                break;

            case "BODY_MAP":
                renderBodyMapPicker(this.viewportContainer, (selectedArea) => {
                    this.navigateTo("VOICE_INTAKE");
                });
                break;

            case "VOICE_INTAKE":
                renderVoiceLoop(this.viewportContainer, () => {
                    this.navigateTo("DOC_SCAN");
                });
                break;

            case "DOC_SCAN":
                renderCameraScanner(this.viewportContainer, async () => {
                    // Finalize session and trigger triage & routing
                    const state = kioskState.getState();
                    const chiefComplaint = state.slots.chief_complaint || "Routine consultation";
                    
                    // Evaluate triage
                    const triageRes = await apiService.evaluateTriage(chiefComplaint, state.slots);
                    
                    // Finalize
                    const finalizeRes = await apiService.finalizeSession({
                        patient_id: state.patientId,
                        discipline: state.discipline,
                        slots: state.slots,
                        triage_tier: triageRes.alert_tier
                    });

                    this.navigateTo("TOKEN_SLIP", { tokenResult: finalizeRes });
                });
                break;

            case "TOKEN_SLIP":
                const state = kioskState.getState();
                renderSlipGenerator(this.viewportContainer, state.tokenResult || {}, () => {
                    this.navigateTo("HOME");
                });
                break;

            default:
                renderHomeScreen(this.viewportContainer);
        }
    }

    showInactivityModal(promptText) {
        this.modalContainer.innerHTML = `
            <div class="kiosk-modal-overlay" role="dialog" aria-modal="true">
                <div class="kiosk-modal-card">
                    <div style="font-size: 56px; margin-bottom: 16px;">⏱️</div>
                    <h2 style="font-size: var(--font-size-xl); font-weight: 800; margin-bottom: 12px; color: var(--amber-warning);">
                        Are you still there? / क्या आप अभी भी यहां हैं?
                    </h2>
                    <p style="font-size: var(--font-size-base); color: var(--text-secondary); margin-bottom: 28px;">
                        ${promptText}
                    </p>
                    <div style="display: flex; gap: 16px; justify-content: center;">
                        <button class="header-btn active" id="btn-stay-active" style="padding: 0 40px; height: var(--tap-target-min); font-weight: 800;">
                            Yes, I am here / हां, जारी रखें
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.modalContainer.querySelector("#btn-stay-active").addEventListener("click", () => {
            this.modalContainer.innerHTML = "";
            inactivityTimer.resumeTimer();
        });
    }
}

// Instantiate on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    const app = new MediKioskApp();
    app.init();
});
