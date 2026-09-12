/**
 * MediKiosk Screen 6 & 7: Intake Completion Decision & Linked Hospital Selection Component
 * Allows user to choose between "Save to Health Account Only" or "Generate Digital OPD Parchi with Linked Hospital".
 */
import { getTranslation } from "../config.js";
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";
import { apiService } from "../api_service.js";
import { getIcon } from "../icons.js";

export function renderCompletionHospitalFlow(container, onFinished) {
    const state = kioskState.getState();
    const t = getTranslation(state.language);

    let selectedSaveMode = "GENERATE_PARCHI";
    let selectedHospitalId = "HOSP-AIIA-ND";
    let linkedHospitals = [];

    async function loadHospitals() {
        try {
            linkedHospitals = await apiService.getLinkedHospitals();
        } catch (e) {
            linkedHospitals = [
                { hospital_id: "HOSP-AIIA-ND", name: "All India Institute of Ayurveda (AIIA), New Delhi", badge: "Apex AYUSH Institute • MoA", city: "New Delhi" },
                { hospital_id: "HOSP-AIIMS-ND", name: "All India Institute of Medical Sciences (AIIMS), New Delhi", badge: "Apex Medical Center • MoHFW", city: "New Delhi" },
                { hospital_id: "HOSP-SAF-ND", name: "Safdarjung Hospital & VMMC, New Delhi", badge: "Central Govt Multi-Speciality", city: "New Delhi" },
                { hospital_id: "HOSP-RML-ND", name: "Dr. Ram Manohar Lohia Hospital, New Delhi", badge: "Central Govt Hospital", city: "New Delhi" },
                { hospital_id: "HOSP-NIA-JP", name: "National Institute of Ayurveda (NIA), Jaipur", badge: "National Institute", city: "Jaipur" },
                { hospital_id: "HOSP-ITRA-GJ", name: "Institute of Teaching and Research in Ayurveda (ITRA), Jamnagar", badge: "Institute of National Importance", city: "Jamnagar" }
            ];
        }
    }

    function renderDecisionView() {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 950px; margin: auto; animation: fade-in 300ms ease;">
                
                <div style="text-align: center; margin-bottom: 28px;">
                    <div style="display: flex; justify-content: center; margin-bottom: 12px;">
                        ${getIcon('clipboard-list', { size: 48, color: '#0d9488' })}
                    </div>
                    <h2 style="font-size: var(--font-size-2xl); font-weight: 800; color: #0f172a; margin-bottom: 6px;">
                        ${t.completionTitle}
                    </h2>
                    <p style="font-size: var(--font-size-lg); color: var(--text-secondary); max-width: 800px; margin: auto;">
                        ${t.completionSub}
                    </p>
                </div>

                <!-- Decision Cards Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; max-width: 900px; margin-bottom: 28px;">
                    
                    <!-- Choice 1: Save to Account Only -->
                    <div class="discipline-card" id="choice-account-only" tabindex="0" role="button" 
                         style="padding: 28px 24px; text-align: left; align-items: flex-start; border-color: #cbd5e1; background: #ffffff; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
                            <div style="width: 52px; height: 52px; border-radius: 12px; background: #f1f5f9; display: flex; align-items: center; justify-content: center;">
                                ${getIcon('lock', { size: 26, color: '#64748b' })}
                            </div>
                            <div>
                                <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0;">${t.choiceAccountOnlyTitle}</h3>
                                <span style="font-size: 12px; color: #64748b; font-weight: 600;">ABDM Personal Health Locker</span>
                            </div>
                        </div>
                        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
                            ${t.choiceAccountOnlyDesc}
                        </p>
                        <div style="margin-top: auto; width: 100%;">
                            <button class="header-btn" style="width: 100%; justify-content: center; height: 44px; font-size: 14px; background: #f8fafc; border-color: #cbd5e1;">
                                ${t.choiceAccountOnlyTitle}
                            </button>
                        </div>
                    </div>

                    <!-- Choice 2: Save & Generate Digital Parchi -->
                    <div class="discipline-card allopathy" id="choice-parchi" tabindex="0" role="button" 
                         style="padding: 28px 24px; text-align: left; align-items: flex-start; border-color: #0d9488; background: #ffffff; cursor: pointer; box-shadow: 0 10px 25px rgba(13, 148, 136, 0.12);">
                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
                            <div style="width: 52px; height: 52px; border-radius: 12px; background: #f0fdfa; border: 1.5px solid #0d9488; display: flex; align-items: center; justify-content: center;">
                                ${getIcon('file-text', { size: 26, color: '#0d9488' })}
                            </div>
                            <div>
                                <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0;">${t.choiceParchiTitle}</h3>
                                <span style="font-size: 12px; color: #0d9488; font-weight: 700; background: #ccfbf1; padding: 2px 8px; border-radius: 4px;">Recommended</span>
                            </div>
                        </div>
                        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
                            ${t.choiceParchiDesc}
                        </p>
                        <div style="margin-top: auto; width: 100%;">
                            <button class="header-btn active" style="width: 100%; justify-content: center; height: 44px; font-size: 14px; display: inline-flex; align-items: center; gap: 6px;">
                                <span>${t.choiceParchiTitle}</span>
                                ${getIcon('arrow-right', { size: 14, color: '#ffffff' })}
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        `;

        // Speak decision prompt
        setTimeout(() => {
            const prompt = state.language === 'en'
                ? "Your health evaluation is complete. Would you like to save it to your account only, or generate an OPD token slip?"
                : "आपका स्वास्थ्य मूल्यांकन पूर्ण हुआ। क्या आप इसे केवल खाते में सहेजना चाहते हैं, या अस्पताल ओपीडी पर्ची बनाना चाहते हैं?";
            audioController.speak(prompt, state.language);
        }, 300);

        // Bindings
        container.querySelector("#choice-account-only").addEventListener("click", async () => {
            selectedSaveMode = "ACCOUNT_ONLY";
            await finalizeAndProceed();
        });

        container.querySelector("#choice-parchi").addEventListener("click", () => {
            selectedSaveMode = "GENERATE_PARCHI";
            renderHospitalSelectionView();
        });
    }

    function renderHospitalSelectionView() {
        const langCode = state.language;

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 1050px; margin: auto; animation: fade-in 300ms ease;">
                
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                        ${getIcon('hospital', { size: 42, color: '#0d9488' })}
                    </div>
                    <h2 style="font-size: var(--font-size-2xl); font-weight: 800; color: #0f172a; margin-bottom: 6px;">
                        ${t.selectHospitalTitle}
                    </h2>
                    <p style="font-size: var(--font-size-lg); color: var(--text-secondary); max-width: 800px; margin: auto;">
                        ${t.selectHospitalSub}
                    </p>
                </div>

                <!-- Linked Hospitals Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; max-width: 950px; margin-bottom: 24px;">
                    ${linkedHospitals.map(h => {
                        const isSelected = h.hospital_id === selectedHospitalId;
                        const hospName = (h.name_vernacular && h.name_vernacular[langCode]) || h.name;
                        return `
                            <div class="discipline-card ${isSelected ? 'allopathy' : ''}" data-hosp-id="${h.hospital_id}" tabindex="0" role="button"
                                 style="padding: 20px 22px; text-align: left; align-items: flex-start; border-color: ${isSelected ? '#0d9488' : '#cbd5e1'}; background: #ffffff; cursor: pointer;">
                                <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start; margin-bottom: 8px;">
                                    <span style="font-size: 12px; font-weight: 800; color: #0369a1; background: #e0f2fe; padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                                        ${getIcon('map-pin', { size: 12, color: '#0369a1' })}
                                        <span>${h.city || 'Delhi'}</span>
                                    </span>
                                    <span style="font-size: 11px; font-weight: 700; color: #0d9488; background: #ccfbf1; padding: 2px 8px; border-radius: 4px;">
                                        ${h.badge || 'Linked Network'}
                                    </span>
                                </div>
                                <h4 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; line-height: 1.4;">
                                    ${hospName}
                                </h4>
                                <div style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: ${isSelected ? '#0d9488' : '#64748b'}; font-weight: 700;">
                                    <span>${isSelected ? '● Selected Hospital' : '○ Tap to Select'}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Actions -->
                <div style="display: flex; justify-content: space-between; width: 100%; max-width: 950px; margin-top: 12px;">
                    <button class="header-btn" id="btn-back-decision">
                        ⬅️ ${t.prevBtn}
                    </button>
                    <button class="header-btn active" id="btn-confirm-hospital" style="padding: 0 36px; height: var(--tap-target-min); font-size: 16px; font-weight: 800;">
                        ${t.confirmHospitalBtn}
                    </button>
                </div>

            </div>
        `;

        // Speak hospital prompt
        setTimeout(() => {
            const prompt = state.language === 'en'
                ? "Please choose the hospital you are visiting to generate your token."
                : "कृपया वह अस्पताल चुनें जिसमें आप उपस्थित हैं।";
            audioController.speak(prompt, state.language);
        }, 300);

        // Hospital card selection
        container.querySelectorAll("[data-hosp-id]").forEach(card => {
            card.addEventListener("click", () => {
                selectedHospitalId = card.getAttribute("data-hosp-id");
                renderHospitalSelectionView();
            });
        });

        // Navigation
        container.querySelector("#btn-back-decision").addEventListener("click", () => {
            renderDecisionView();
        });

        container.querySelector("#btn-confirm-hospital").addEventListener("click", async () => {
            await finalizeAndProceed();
        });
    }

    async function finalizeAndProceed() {
        const slots = state.slots || {};
        const chosenHosp = linkedHospitals.find(h => h.hospital_id === selectedHospitalId);
        const hospName = chosenHosp ? ((chosenHosp.name_vernacular && chosenHosp.name_vernacular[state.language]) || chosenHosp.name) : "All India Institute of Ayurveda (AIIA)";

        const payload = {
            session_id: state.sessionId || `sess_${Date.now()}`,
            hospital_id: selectedHospitalId,
            discipline: state.discipline || "ALLOPATHY",
            slots: slots,
            language: state.language || "hi",
            save_mode: selectedSaveMode
        };

        const res = await apiService.finalizeSession(payload);
        
        // Notify doctor console immediately across tabs/windows
        try {
            if (typeof BroadcastChannel !== "undefined") {
                const bc = new BroadcastChannel("medikiosk_opd_sync");
                bc.postMessage({
                    type: "NEW_PATIENT_TOKEN",
                    token_number: res.token_number,
                    patient_id: res.patient_id,
                    department_id: res.assigned_department_id,
                    timestamp: Date.now()
                });
                bc.close();
            }
            localStorage.setItem("medikiosk_last_token_sync", JSON.stringify({
                time: Date.now(),
                token: res.token_number,
                dept: res.assigned_department_id
            }));
        } catch (e) {
            console.warn("[Kiosk] Cross-window sync trigger error:", e);
        }

        kioskState.setState({
            selectedHospitalId: selectedHospitalId,
            selectedHospitalName: hospName,
            saveMode: selectedSaveMode,
            finalTokenData: res
        });

        if (onFinished) onFinished(res);
    }

    loadHospitals().then(() => {
        renderDecisionView();
    });
}
