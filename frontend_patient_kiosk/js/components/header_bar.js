/**
 * MediKiosk Header & Status Bar Component (Hospital Clean White Theme)
 */
import { CONFIG } from "../config.js";
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";

export function renderHeaderBar(container) {
    const state = kioskState.getState();
    const currentLangObj = CONFIG.LANGUAGES.find(l => l.code === state.language) || CONFIG.LANGUAGES[0];

    container.innerHTML = `
        <header class="kiosk-header" role="banner">
            <div class="kiosk-branding">
                <div class="kiosk-logo-badge" aria-hidden="true">🏥</div>
                <div class="kiosk-title-group">
                    <h1>${CONFIG.APP_NAME}</h1>
                    <p>${CONFIG.HOSPITAL_NAME}</p>
                </div>
            </div>

            <div class="kiosk-header-actions">
                <div class="clock-badge" id="live-clock" aria-label="Current Time">--:--:--</div>
                
                <!-- Language Selector -->
                <button class="header-btn" id="btn-language" aria-label="Change Language. Current is ${currentLangObj.name}">
                    <span>🌐</span>
                    <span>${currentLangObj.name} (${currentLangObj.code.toUpperCase()})</span>
                </button>

                <!-- High Contrast Toggle -->
                <button class="header-btn ${state.highContrastMode ? 'active' : ''}" id="btn-contrast" aria-label="Toggle High Contrast Mode">
                    <span>👁️</span>
                    <span>High Contrast</span>
                </button>

                <!-- Large Text Toggle -->
                <button class="header-btn ${state.largeTextMode ? 'active' : ''}" id="btn-large-text" aria-label="Toggle Large Text Size">
                    <span>🔤</span>
                    <span>Text Size</span>
                </button>

                <!-- Audio Mute Toggle -->
                <button class="header-btn ${state.audioMuted ? 'active' : ''}" id="btn-audio-mute" aria-label="Toggle Audio Sound">
                    <span>${state.audioMuted ? '🔇' : '🔊'}</span>
                    <span>${state.audioMuted ? 'Muted' : 'Sound ON'}</span>
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

    // Event Listeners
    container.querySelector("#btn-contrast").addEventListener("click", () => {
        const next = !kioskState.getState().highContrastMode;
        document.body.classList.toggle("high-contrast", next);
        kioskState.setState({ highContrastMode: next });
    });

    container.querySelector("#btn-large-text").addEventListener("click", () => {
        const next = !kioskState.getState().largeTextMode;
        document.body.classList.toggle("large-text", next);
        kioskState.setState({ largeTextMode: next });
    });

    container.querySelector("#btn-audio-mute").addEventListener("click", () => {
        const next = !kioskState.getState().audioMuted;
        kioskState.setState({ audioMuted: next });
        if (next) audioController.stopSpeaking();
    });

    // Language Selector Dialog
    container.querySelector("#btn-language").addEventListener("click", () => {
        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0;">🌐 Select Regional Language</h3>
                    <button id="btn-close-lang-modal" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #64748b;">✕</button>
                </div>
                <div class="modal-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    ${CONFIG.LANGUAGES.map(l => `
                        <button class="touch-chip ${l.code === state.language ? 'selected' : ''}" data-lang-code="${l.code}" style="justify-content: center; font-size: 16px; padding: 14px 10px;">
                            ${l.name} (${l.script})
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
                    hi: "भाषा हिन्दी चुनी गई है।",
                    pa: "ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਚੁਣੀ ਗਈ ਹੈ।",
                    bn: "ভাষা বাংলা নির্বাচন করা হয়েছে।",
                    ta: "மொழி தமிழ் தேர்ந்தெடுக்கப்பட்டது.",
                    te: "భాష తెలుగు ఎంపిక చేయబడింది.",
                    mr: "भाषा मराठी निवडली आहे.",
                    gu: "ભાષા ગુજરાતી પસંદ કરેલ છે.",
                    en: "Language set to English."
                }[code] || `Language set to ${chosenObj.name}`;

                audioController.speak(announceText, code);
                renderHeaderBar(container);
            });
        });
    });
}
