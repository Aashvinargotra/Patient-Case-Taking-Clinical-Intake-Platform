/**
 * MediKiosk Header & Status Bar Component
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
                    <span>${currentLangObj.name}</span>
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

    container.querySelector("#btn-language").addEventListener("click", () => {
        // Cycle through languages or trigger modal
        const currentIndex = CONFIG.LANGUAGES.findIndex(l => l.code === kioskState.getState().language);
        const nextIndex = (currentIndex + 1) % CONFIG.LANGUAGES.length;
        const nextLang = CONFIG.LANGUAGES[nextIndex];
        kioskState.setState({ language: nextLang.code });
        
        const announceText = {
            hi: "भाषा हिन्दी चुनी गई है।",
            pa: "ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਚੁਣੀ ਗਈ ਹੈ।",
            en: "Language set to English."
        }[nextLang.code] || `Language set to ${nextLang.name}`;
        
        audioController.speak(announceText, nextLang.code);
    });
}
