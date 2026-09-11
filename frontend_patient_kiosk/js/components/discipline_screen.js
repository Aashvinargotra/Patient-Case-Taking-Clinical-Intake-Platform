/**
 * MediKiosk Second Screen: Clinical Discipline Selection (Ayurveda & AYUSH vs Modern Medicine Allopathy)
 */
import { getTranslation } from "../config.js";
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";

export function renderDisciplineScreen(container, onDisciplineSelect) {
    const state = kioskState.getState();
    const t = getTranslation(state.language);
    const patientName = state.patientName || (state.isTemporary ? "Walk-in Guest" : "Aarav Sharma");

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 1200px; margin: auto; animation: fade-in 300ms ease;">
            
            <!-- Patient Profile & Welcome Header -->
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-flex; align-items: center; gap: 8px; background: #f0fdf4; border: 1.5px solid #bbf7d0; padding: 6px 18px; border-radius: 9999px; margin-bottom: 12px;">
                    <span style="color: #166534; font-weight: 800; font-size: 14px;">✓ ${t.welcomePatient}, ${patientName}</span>
                    ${state.abhaAddress ? `<span style="font-size: 12px; color: #059669; font-weight: 600;">(${state.abhaAddress})</span>` : ''}
                </div>
                <h2 style="font-size: var(--font-size-2xl); font-weight: 800; color: #0f172a; margin-bottom: 6px;">${t.disciplineSelectTitle}</h2>
                <p style="font-size: var(--font-size-lg); color: var(--text-secondary); max-width: 800px; margin: auto;">${t.disciplineSelectSub}</p>
            </div>

            <!-- 50/50 Dual Discipline Cards Grid -->
            <div class="discipline-grid" role="region" aria-label="Clinical Discipline Selection">
                
                <!-- 1. Modern Medicine (Allopathy) Card -->
                <div class="discipline-card allopathy" id="card-allopathy" tabindex="0" role="button" aria-label="${t.allopathyTitle}">
                    <div class="discipline-icon">🩺</div>
                    <div class="discipline-title">${t.allopathyTitle}</div>
                    <div class="discipline-subtitle">${t.allopathyDesc}</div>
                    <div class="discipline-badge" style="color: #0369a1; background: #f0f9ff; border-color: #bae6fd;">
                        ${t.allopathyBadge}
                    </div>
                </div>

                <!-- 2. AYUSH / Ayurveda Card -->
                <div class="discipline-card ayush" id="card-ayush" tabindex="0" role="button" aria-label="${t.ayushTitle}">
                    <div class="discipline-icon">🌿</div>
                    <div class="discipline-title">${t.ayushTitle}</div>
                    <div class="discipline-subtitle">${t.ayushDesc}</div>
                    <div class="discipline-badge" style="color: #b45309; background: #fffbeb; border-color: #fde68a;">
                        ${t.ayushBadge}
                    </div>
                </div>

            </div>

        </div>
    `;

    // Speak audio prompt in selected language
    setTimeout(() => {
        const promptText = state.language === 'en'
            ? `Welcome ${patientName}. Please select your clinical consultation discipline — Modern Medicine or Ayurveda OPD.`
            : `${t.welcomePatient} ${patientName}। कृपया अपनी परामर्श प्रणाली चुनें — आधुनिक चिकित्सा या आयुर्वेद ओपीडी।`;
        audioController.speak(promptText, state.language);
    }, 300);

    // Event handlers
    container.querySelector("#card-allopathy").addEventListener("click", () => {
        kioskState.setState({ discipline: "ALLOPATHY" });
        if (onDisciplineSelect) onDisciplineSelect("ALLOPATHY");
    });

    container.querySelector("#card-ayush").addEventListener("click", () => {
        kioskState.setState({ discipline: "AYUSH" });
        if (onDisciplineSelect) onDisciplineSelect("AYUSH");
    });
}
