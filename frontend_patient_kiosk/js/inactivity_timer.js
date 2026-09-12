/**
 * MediKiosk Accessible Inactivity Lifecycle Controller
 * Provides 2.5-minute spoken audio check-in and 3.0-minute ephemeral memory flush.
 */
import { CONFIG } from "./config.js";
import { kioskState } from "./state.js";
import { audioController } from "./audio_controller.js";

class InactivityTimer {
    constructor() {
        this.warnTimer = null;
        this.timeoutTimer = null;
        this.isShowingModal = false;
        this.onWarningCallback = null;
        this.onTimeoutCallback = null;
        this.bindUserActivity();
    }

    init(onWarning, onTimeout) {
        this.onWarningCallback = onWarning;
        this.onTimeoutCallback = onTimeout;
        this.resetTimer();
    }

    bindUserActivity() {
        const resetHandler = () => {
            const state = kioskState.getState();
            if (!state.isPaused && state.currentScreen !== "HOME") {
                this.resetTimer();
            }
        };

        window.addEventListener("pointerdown", resetHandler);
        window.addEventListener("keydown", resetHandler);
        window.addEventListener("touchstart", resetHandler);
    }

    resetTimer() {
        this.clearTimers();
        const state = kioskState.getState();
        if (state.currentScreen === "HOME" || state.isPaused) return;

        // Schedule 2.5-minute warning
        this.warnTimer = setTimeout(() => {
            this.triggerWarning();
        }, CONFIG.INACTIVITY_WARN_MS);

        // Schedule 3.0-minute timeout
        this.timeoutTimer = setTimeout(() => {
            this.triggerTimeout();
        }, CONFIG.INACTIVITY_TIMEOUT_MS);
    }

    clearTimers() {
        if (this.warnTimer) clearTimeout(this.warnTimer);
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        this.warnTimer = null;
        this.timeoutTimer = null;
    }

    triggerWarning() {
        this.isShowingModal = true;
        const state = kioskState.getState();
        
        // Multilingual audio check-in prompt
        const checkinPrompts = {
            hi: "क्या आप अभी भी स्क्रीन पर हैं? जारी रखने के लिए स्क्रीन पर स्पर्श करें या बोलें।",
            pa: "ਕੀ ਤੁਸੀਂ ਅਜੇ ਵੀ ਇੱਥੇ ਹੋ? ਜਾਰੀ ਰੱਖਣ ਲਈ ਸਕ੍ਰੀਨ ਛੂਹੋ।",
            en: "Are you still there? Please tap the screen or speak to continue your consultation."
        };
        const promptText = checkinPrompts[state.language] || checkinPrompts.hi;
        audioController.speak(promptText, state.language);

        if (this.onWarningCallback) {
            this.onWarningCallback(promptText);
        }
    }

    triggerTimeout() {
        this.clearTimers();
        this.isShowingModal = false;
        
        // Wipe all memory and flag session timed out
        kioskState.flushMemory();
        kioskState.setState({ sessionTimedOut: true });
        
        if (this.onTimeoutCallback) {
            this.onTimeoutCallback();
        }
    }

    onTimeoutTrigger() {
        this.triggerTimeout();
    }

    pauseTimer() {
        this.clearTimers();
        kioskState.setState({ isPaused: true });
    }

    resumeTimer() {
        kioskState.setState({ isPaused: false });
        this.resetTimer();
    }
}

export const inactivityTimer = new InactivityTimer();
