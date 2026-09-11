/**
 * MediKiosk Header & Status Bar Component (Hospital Clean White Theme + 100% Dynamic Translation)
 */
import { CONFIG, getTranslation } from "../config.js";
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";

export function renderHeaderBar(container, onLanguageChanged = null) {
    const state = kioskState.getState();
    const t = getTranslation(state.language);
    const currentLangObj = CONFIG.LANGUAGES.find(l => l.code === state.language) || CONFIG.LANGUAGES[0];

    const fontScales = [0.85, 1.0, 1.15, 1.30];
    const currentScale = state.fontScale || 1.0;
    const currentScalePercent = Math.round(currentScale * 100);

    // Apply current font scale to root
    document.documentElement.style.setProperty("--font-scale", currentScale.toString());

    container.innerHTML = `
        <header class="kiosk-header" role="banner">
            <div class="kiosk-branding">
                <div class="kiosk-logo-badge" aria-hidden="true">🏥</div>
                <div class="kiosk-title-group">
                    <h1>${t.appName}</h1>
                    <p>${t.hospitalName}</p>
                </div>
            </div>

            <div class="kiosk-header-actions">
                <div class="clock-badge" id="live-clock" aria-label="Current Time">--:--:--</div>
                
                <!-- Language Selector -->
                <button class="header-btn active" id="btn-language" aria-label="Change Language. Current is ${currentLangObj.name}" style="font-weight: 800; border-color: #0d9488;">
                    <span>🌐</span>
                    <span>${currentLangObj.name} (${currentLangObj.code.toUpperCase()})</span>
                </button>

                <!-- High Contrast Toggle -->
                <button class="header-btn ${state.highContrastMode ? 'active' : ''}" id="btn-contrast" aria-label="Toggle High Contrast Mode">
                    <span>👁️</span>
                    <span>${t.contrast}</span>
                </button>

                <!-- Precise Text Size Stepper (Decrease / Reset / Increase) -->
                <div class="header-stepper-group" style="display: inline-flex; align-items: center; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: var(--radius-full); padding: 2px 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <button class="stepper-btn" id="btn-text-decrease" aria-label="Decrease Text Size" style="border: none; background: none; font-size: 15px; font-weight: 800; color: #0f172a; padding: 4px 10px; cursor: pointer; border-radius: 9999px;">
                        A-
                    </button>
                    <span id="label-text-scale" style="font-size: 13px; font-weight: 700; color: #0d9488; padding: 0 4px; min-width: 44px; text-align: center;">
                        ${currentScalePercent}%
                    </span>
                    <button class="stepper-btn" id="btn-text-increase" aria-label="Increase Text Size" style="border: none; background: none; font-size: 16px; font-weight: 800; color: #0f172a; padding: 4px 10px; cursor: pointer; border-radius: 9999px;">
                        A+
                    </button>
                </div>

                <!-- Audio Mute Toggle -->
                <button class="header-btn ${state.audioMuted ? 'active' : ''}" id="btn-audio-mute" aria-label="Toggle Audio Sound">
                    <span>${state.audioMuted ? '🔇' : '🔊'}</span>
                    <span>${state.audioMuted ? t.soundOff : t.soundOn}</span>
                </button>
            </div>
        </header>
    `;

    // Live Clock Update
    const clockEl = container.querySelector("#live-clock");
    const updateClock = () => {
        if (clockEl) {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    };
    updateClock();
    setInterval(updateClock, 1000);

    // High Contrast Toggle
    container.querySelector("#btn-contrast").addEventListener("click", () => {
        const next = !kioskState.getState().highContrastMode;
        document.body.classList.toggle("high-contrast", next);
        kioskState.setState({ highContrastMode: next });
    });

    // Text Size Decrease
    container.querySelector("#btn-text-decrease").addEventListener("click", () => {
        const cur = kioskState.getState().fontScale || 1.0;
        const curIdx = fontScales.findIndex(s => Math.abs(s - cur) < 0.05);
        const nextIdx = Math.max(0, (curIdx !== -1 ? curIdx : 1) - 1);
        const newScale = fontScales[nextIdx];
        kioskState.setState({ fontScale: newScale });
        document.documentElement.style.setProperty("--font-scale", newScale.toString());
        audioController.playChime("tap");
        renderHeaderBar(container, onLanguageChanged);
    });

    // Text Size Increase
    container.querySelector("#btn-text-increase").addEventListener("click", () => {
        const cur = kioskState.getState().fontScale || 1.0;
        const curIdx = fontScales.findIndex(s => Math.abs(s - cur) < 0.05);
        const nextIdx = Math.min(fontScales.length - 1, (curIdx !== -1 ? curIdx : 1) + 1);
        const newScale = fontScales[nextIdx];
        kioskState.setState({ fontScale: newScale });
        document.documentElement.style.setProperty("--font-scale", newScale.toString());
        audioController.playChime("tap");
        renderHeaderBar(container, onLanguageChanged);
    });

    // Audio Mute Toggle
    container.querySelector("#btn-audio-mute").addEventListener("click", () => {
        const next = !kioskState.getState().audioMuted;
        kioskState.setState({ audioMuted: next });
        if (next) audioController.stopSpeaking();
        renderHeaderBar(container, onLanguageChanged);
    });

    // Language Selector Modal
    container.querySelector("#btn-language").addEventListener("click", () => {
        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 540px;">
                <div class="modal-header">
                    <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0;">🌐 Select Language / भाषा चुनें</h3>
                    <button id="btn-close-lang-modal" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #64748b;">✕</button>
                </div>
                <div class="modal-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px;">
                    ${CONFIG.LANGUAGES.map(l => `
                        <button class="touch-chip ${l.code === state.language ? 'selected' : ''}" data-lang-code="${l.code}" style="justify-content: center; font-size: 16px; padding: 14px 10px; font-weight: 700;">
                            ${l.name} (${l.code.toUpperCase()})
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector("#btn-close-lang-modal").addEventListener("click", () => modal.remove());

        modal.querySelectorAll("[data-lang-code]").forEach(btn => {
            btn.addEventListener("click", () => {
                const code = btn.getAttribute("data-lang-code");
                kioskState.setState({ language: code });
                modal.remove();

                const chosenObj = CONFIG.LANGUAGES.find(l => l.code === code);
                const announceText = {
                    en: "Language set to English.",
                    hi: "भाषा हिन्दी चुनी गई है।",
                    pa: "ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਚੁਣੀ ਗਈ ਹੈ।",
                    bn: "ভাষা বাংলা নির্বাচন করা হয়েছে।",
                    ta: "மொழி தமிழ் தேர்ந்தெடுக்கப்பட்டது.",
                    te: "భాష తెలుగు ఎంపిక చేయబడింది.",
                    mr: "भाषा मराठी निवडली आहे.",
                    gu: "ભાષા ગુજરાતી પસંદ કરેલ છે."
                }[code] || `Language set to ${chosenObj.name}`;

                audioController.speak(announceText, code);
                renderHeaderBar(container, onLanguageChanged);
                if (onLanguageChanged) onLanguageChanged(code);
            });
        });
    });
}
