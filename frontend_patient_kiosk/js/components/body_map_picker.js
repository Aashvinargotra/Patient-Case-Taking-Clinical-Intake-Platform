/**
 * MediKiosk Interactive Anatomical Body Map Component (Hospital Clean White Theme)
 * Provides clickable SVG human body map for localized pain and symptom exploration.
 */
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";

export function renderBodyMapPicker(container, onAreaSelected) {
    const state = kioskState.getState();

    const bodyAreas = [
        { id: "chest", nameHi: "छाती / हृदय", nameEn: "Chest / Heart Area", icon: "🫀" },
        { id: "head", nameHi: "सिर / मस्तिष्क", nameEn: "Head / Forehead", icon: "🧠" },
        { id: "abdomen", nameHi: "पेट / नाभि", nameEn: "Abdomen / Stomach", icon: "🤢" },
        { id: "knee", nameHi: "घुटने / जोड़", nameEn: "Knees / Joints", icon: "🦵" },
        { id: "back", nameHi: "कमर / रीढ़", nameEn: "Lower Back / Spine", icon: "🦴" },
        { id: "throat", nameHi: "गला / गर्दन", nameEn: "Throat / Neck", icon: "🗣️" },
        { id: "arms", nameHi: "हाथ / बांह", nameEn: "Arms / Shoulders", icon: "💪" },
        { id: "skin", nameHi: "त्वचा / एलर्जी", nameEn: "Skin / Rashes", icon: "🩹" }
    ];

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 1000px; margin: auto; animation: fade-in 250ms ease;">
            
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-size: var(--font-size-xl); font-weight: 800; color: #0f172a; margin-bottom: 6px;">
                    ${state.language === 'en' ? 'Select Affected Body Region' : 'तकलीफ़ का मुख्य स्थान चुनें'}
                </h2>
                <p style="font-size: var(--font-size-base); color: var(--text-secondary);">
                    ${state.language === 'en' ? 'Tap on the anatomical region where you feel pain, discomfort, or symptoms.' : 'नीचे दिए गए शरीर के अंगों में से जहां दर्द या तकलीफ़ है, उस पर स्पर्श करें।'}
                </p>
            </div>

            <!-- Body Map Interactive Grid -->
            <div class="chip-grid" style="max-width: 820px; margin-bottom: 24px;">
                ${bodyAreas.map(area => `
                    <button class="touch-chip" data-area-id="${area.id}" data-area-name="${area.nameEn}" aria-label="${area.nameEn}">
                        <span style="font-size: 26px;">${area.icon}</span>
                        <span>${state.language === 'en' ? area.nameEn : area.nameHi}</span>
                    </button>
                `).join('')}
            </div>

            <!-- Visual SVG Human Outline Graphic -->
            <div style="width: 240px; height: 260px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);">
                <svg viewBox="0 0 200 280" style="width: 75%; height: 75%; fill: none; stroke: var(--primary-teal); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round;">
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
    setTimeout(() => {
        const prompt = state.language === 'en'
            ? "Please tap on the body area where you are feeling discomfort."
            : "कृपया उस अंग पर स्पर्श करें जहां आपको तकलीफ़ है।";
        audioController.speak(prompt, state.language);
    }, 300);

    // Click handler for body chips
    container.querySelectorAll(".touch-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const areaId = chip.getAttribute("data-area-id");
            const areaName = chip.getAttribute("data-area-name");
            kioskState.setState({ affectedBodyArea: areaId, affectedBodyAreaName: areaName });
            if (onAreaSelected) onAreaSelected(areaId);
        });
    });
}
