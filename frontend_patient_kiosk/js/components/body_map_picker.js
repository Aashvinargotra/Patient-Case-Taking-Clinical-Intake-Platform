/**
 * MediKiosk Interactive Anatomical Body Map Component
 * Provides clickable SVG human body map for localized pain and radiation exploration.
 */
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";

export function renderBodyMapPicker(container, onAreaSelected) {
    const state = kioskState.getState();

    const bodyAreas = [
        { id: "head", nameHi: "सिर / मस्तिष्क", nameEn: "Head / Forehead", icon: "🧠" },
        { id: "chest", nameHi: "छाती / हृदय", nameEn: "Chest / Heart Area", icon: "🫀" },
        { id: "abdomen", nameHi: "पेट / नाभि", nameEn: "Abdomen / Stomach", icon: "🤢" },
        { id: "back", nameHi: "कमर / रीढ़ की हड्डी", nameEn: "Lower Back / Spine", icon: "🦴" },
        { id: "throat", nameHi: "गला / गर्दन", nameEn: "Throat / Neck", icon: "🗣️" },
        { id: "knee", nameHi: "घुटने / जोड़", nameEn: "Knees / Joints", icon: "🦵" },
        { id: "arms", nameHi: "हाथ / बांह", nameEn: "Arms / Shoulders", icon: "💪" },
        { id: "skin", nameHi: "त्वचा / एलर्जी", nameEn: "Skin / Whole Body", icon: "🩹" }
    ];

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 1000px; margin: auto;">
            
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-size: var(--font-size-xl); font-weight: 800; margin-bottom: 8px;">
                    ${state.language === 'hi' ? 'तकलीफ़ का मुख्य स्थान चुनें' : 'Select Affected Body Area'}
                </h2>
                <p style="font-size: var(--font-size-base); color: var(--text-secondary);">
                    ${state.language === 'hi' ? 'नीचे दिए गए शरीर के अंगों में से जहां दर्द या तकलीफ़ है, उस पर स्पर्श करें।' : 'Tap on the body area or icon where you feel pain or discomfort.'}
                </p>
            </div>

            <!-- Body Map Interactive Grid -->
            <div class="chip-grid" style="max-width: 800px; margin-bottom: 32px;">
                ${bodyAreas.map(area => `
                    <button class="touch-chip" data-area-id="${area.id}" data-area-name="${area.nameEn}" aria-label="${area.nameEn}">
                        <span style="font-size: 28px;">${area.icon}</span>
                        <span>${state.language === 'hi' ? area.nameHi : area.nameEn}</span>
                    </button>
                `).join('')}
            </div>

            <!-- Visual SVG Human Outline Graphic -->
            <div style="width: 280px; height: 320px; background: rgba(255, 255, 255, 0.03); border: 2px dashed var(--border-subtle); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; position: relative;">
                <svg viewBox="0 0 200 280" style="width: 80%; height: 80%; fill: none; stroke: var(--primary-teal); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round;">
                    <!-- Head -->
                    <circle cx="100" cy="35" r="22" />
                    <!-- Neck -->
                    <line x1="100" y1="57" x2="100" y2="70" />
                    <!-- Torso -->
                    <path d="M 70 70 L 130 70 L 120 160 L 80 160 Z" />
                    <!-- Arms -->
                    <line x1="70" y1="70" x2="35" y2="140" />
                    <line x1="130" y1="70" x2="165" y2="140" />
                    <!-- Legs -->
                    <line x1="85" y1="160" x2="80" y2="250" />
                    <line x1="115" y1="160" x2="120" y2="250" />
                </svg>
            </div>

        </div>
    `;

    // Speak prompt
    const promptText = state.language === 'hi' 
        ? "कृपया स्क्रीन पर उस अंग का चयन करें जहां आपको तकलीफ़ या दर्द है।" 
        : "Please tap on the body area where you are experiencing pain.";
    audioController.speak(promptText, state.language);

    // Event listeners
    container.querySelectorAll(".touch-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            const areaName = btn.getAttribute("data-area-name");
            kioskState.updateSlot("site_and_radiation", areaName);
            if (onAreaSelected) onAreaSelected(areaName);
        });
    });
}
