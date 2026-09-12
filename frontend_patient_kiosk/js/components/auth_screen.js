/**
 * MediKiosk First Screen: Dedicated Patient Authentication & Registration Gateway
 */
import { CONFIG, getTranslation } from "../config.js";
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";
import { renderAbhaAuthModal } from "./abha_auth_modal.js";
import { renderPhoneAuthModal } from "./phone_auth_modal.js";
import { apiService } from "../api_service.js";

export function renderAuthScreen(container, onAuthSuccess) {
    const state = kioskState.getState();
    const t = getTranslation(state.language);

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 1000px; margin: auto; animation: fade-in 300ms ease;">
            
            ${state.sessionTimedOut ? `
                <!-- Session Timed Out Notice Banner -->
                <div id="session-timeout-banner" style="width: 100%; max-width: 900px; background: #fffbeb; border: 2px solid #f59e0b; border-radius: var(--radius-md); padding: 16px 22px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 4px 14px rgba(245,158,11,0.12); animation: fade-in 300ms ease;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span style="font-size: 28px;">⏱️</span>
                        <div>
                            <div style="font-size: 15.5px; font-weight: 800; color: #92400e;">
                                ${state.language === 'hi' ? 'सत्र समाप्त हो गया - कृपया पुनः लॉगिन करें' : 'Session Timed Out Due to Inactivity'}
                            </div>
                            <div style="font-size: 13px; color: #b45309; margin-top: 2px;">
                                ${state.language === 'hi' ? 'आपकी सुरक्षा और गोपनीयता के लिए निष्क्रियता के कारण सत्र रीसेट हो गया है। कृपया आगे बढ़ने के लिए पुनः लॉगिन करें।' : 'For your privacy and security, your previous session was reset. Please log in again to continue.'}
                            </div>
                        </div>
                    </div>
                    <button id="btn-dismiss-timeout-banner" title="Dismiss" style="background: none; border: none; font-size: 20px; color: #92400e; cursor: pointer; padding: 4px 8px; font-weight: 800; border-radius: 4px;">
                        ✕
                    </button>
                </div>
            ` : ''}

            <div style="text-align: center; margin-bottom: 28px;">
                <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 13px; font-weight: 800; padding: 4px 16px; border-radius: 9999px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${t.govtTag}
                </span>
                <h2 style="font-size: var(--font-size-2xl); font-weight: 800; color: #0f172a; margin-bottom: 6px;">${t.authTitle}</h2>
                <p style="font-size: var(--font-size-lg); color: var(--text-secondary); max-width: 800px; margin: auto;">${t.authSub}</p>
            </div>

            <!-- Authentication Selection Cards Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; max-width: 900px; margin-bottom: 24px;">
                
                <!-- 1. ABHA ID Digital Health Card (Primary) -->
                <div class="discipline-card allopathy" id="card-auth-abha" tabindex="0" role="button" style="padding: 28px 24px; text-align: left; align-items: flex-start; border-color: #99f6e4; background: #ffffff;">
                    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
                        <div style="width: 60px; height: 60px; border-radius: 12px; background: #f0fdfa; border: 1.5px solid #0d9488; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                            🪪
                        </div>
                        <div>
                            <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${t.abhaLoginBtn}</div>
                            <span style="font-size: 12px; font-weight: 700; color: #0d9488; background: #ccfbf1; padding: 2px 8px; border-radius: 4px;">ABDM Gateway</span>
                        </div>
                    </div>
                    <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
                        14-digit ABHA Number, @abdm address, OTP verification, or physical ABHA card scan with instant EHR sync.
                    </p>
                    <button class="header-btn active" style="width: 100%; justify-content: center; height: 44px; font-size: 14px;">
                        ${t.abhaLoginBtn} ➔
                    </button>
                </div>

                <!-- 2. Phone + MPIN / Password -->
                <div class="discipline-card" id="card-auth-phone" tabindex="0" role="button" style="padding: 28px 24px; text-align: left; align-items: flex-start; border-color: #cbd5e1; background: #ffffff;">
                    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
                        <div style="width: 60px; height: 60px; border-radius: 12px; background: #f1f5f9; border: 1.5px solid #64748b; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                            📱
                        </div>
                        <div>
                            <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${t.phoneLoginBtn}</div>
                            <span style="font-size: 12px; font-weight: 700; color: #475569; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">Returning Patient</span>
                        </div>
                    </div>
                    <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
                        Login using registered mobile number and 4-digit MPIN or hospital patient portal password.
                    </p>
                    <button class="header-btn" style="width: 100%; justify-content: center; height: 44px; font-size: 14px; background: #f8fafc; border-color: #cbd5e1;">
                        ${t.phoneLoginBtn} ➔
                    </button>
                </div>

            </div>

            <!-- 3. Quick 1-Tap Guest Walk-in Registration -->
            <div style="width: 100%; max-width: 900px; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: var(--radius-lg); padding: 22px 28px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04); display: flex; align-items: center; justify-content: space-between; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 52px; height: 52px; border-radius: 12px; background: #fffbeb; border: 1.5px solid #d97706; display: flex; align-items: center; justify-content: center; font-size: 28px;">
                        ⚡
                    </div>
                    <div>
                        <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">${t.walkinBtn}</h3>
                        <p style="font-size: 13px; color: #64748b; margin: 0;">${t.walkinSub}</p>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="tel" id="walkin-phone-input" placeholder="${t.enterPhonePlaceholder}" maxlength="10" 
                           style="height: 46px; width: 220px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; color: #0f172a; font-size: 14px; padding: 0 12px; text-align: center;" />
                    <button id="btn-submit-walkin" class="header-btn active" style="height: 46px; padding: 0 24px; font-size: 14px; white-space: nowrap;">
                        ${t.startWalkinBtn}
                    </button>
                </div>
            </div>

        </div>
    `;

    // Speak introductory welcome
    setTimeout(() => {
        const welcomeSpeech = state.language === 'en'
            ? "Welcome to MediKiosk. Please authenticate with your ABHA ID or proceed with quick registration."
            : "मेडीकियोस्क में आपका स्वागत है। कृपया अपनी आभा आईडी से लॉगिन करें या सीधे वॉक-इन शुरू करें।";
        audioController.speak(welcomeSpeech, state.language);
    }, 400);

    // Dismiss session timeout banner
    const dismissBtn = container.querySelector("#btn-dismiss-timeout-banner");
    if (dismissBtn) {
        dismissBtn.addEventListener("click", () => {
            kioskState.setState({ sessionTimedOut: false });
            const banner = container.querySelector("#session-timeout-banner");
            if (banner) banner.remove();
        });
    }

    // Event Listeners
    container.querySelector("#card-auth-abha").addEventListener("click", () => {
        kioskState.setState({ sessionTimedOut: false });
        renderAbhaAuthModal(container, (patient) => {
            if (onAuthSuccess) onAuthSuccess(patient);
        });
    });

    container.querySelector("#card-auth-phone").addEventListener("click", () => {
        kioskState.setState({ sessionTimedOut: false });
        renderPhoneAuthModal(container, (patient) => {
            if (onAuthSuccess) onAuthSuccess(patient);
        });
    });

    container.querySelector("#btn-submit-walkin").addEventListener("click", async () => {
        kioskState.setState({ sessionTimedOut: false });
        const phone = container.querySelector("#walkin-phone-input").value.trim();
        const walkinPatient = {
            patient_id: `TEMP-${Math.floor(1000 + Math.random() * 9000)}`,
            full_name: phone ? `Walk-in (${phone.slice(-4)})` : "Walk-in Patient",
            phone: phone || null,
            is_temporary: true
        };
        kioskState.setState({
            patientId: walkinPatient.patient_id,
            patientName: walkinPatient.full_name,
            patientPhone: phone || null,
            isTemporary: true
        });
        if (onAuthSuccess) onAuthSuccess(walkinPatient);
    });
}
