/**
 * MediKiosk Ephemeral State Management Store
 * Strictly destroys patient health data from memory upon session exit or timeout.
 */

class KioskStateStore {
    constructor() {
        this.listeners = new Set();
        this.resetState();
    }

    resetState() {
        this.state = {
            // Patient Identification & Session
            sessionId: null,
            patientId: null,
            patientName: "",
            patientPhone: "",
            abhaAddress: "",
            authType: null,
            
            // Intake Configurations - English as Default
            discipline: null,         // 'ALLOPATHY' | 'AYUSH'
            language: "en",           // Default English
            intakeMode: "VOICE",      // 'VOICE' | 'TOUCH'
            currentStepIndex: 0,
            
            // Clinical Slots Filled
            slots: {},
            extractedInvestigations: [],
            
            // Triage & Routing Results
            triageAlert: null,        // 'RED' | 'AMBER' | null
            assignedDepartment: null,
            assignedRoom: null,
            tokenNumber: null,
            signedQrData: null,
            
            // Accessibility Toggles & Text Size Scale
            fontScale: 1.0,           // 0.85, 1.0, 1.15, 1.30
            highContrastMode: false,
            slowSpeechMode: false,
            audioMuted: false,
            isRecording: false,
            isSpeaking: false,
            
            // Screen Navigation
            currentScreen: "AUTH",    // AUTH, DISCIPLINE, BODY_MAP, VOICE_INTAKE, DOC_SCANNER, COMPLETION_HOSPITAL, SLIP_SUMMARY
            
            // Inactivity Paused
            isPaused: false
        };
    }

    getState() {
        return { ...this.state };
    }

    setState(partialState) {
        this.state = { ...this.state, ...partialState };
        this.notifyListeners();
    }

    updateSlot(slotName, value) {
        this.state.slots = { ...this.state.slots, [slotName]: value };
        this.notifyListeners();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.getState());
        }
    }

    /**
     * Complete Ephemeral Memory Flush:
     * Erases all cached PII, audio recordings, OCR texts, and slots from browser RAM.
     */
    flushMemory() {
        console.warn("[MediKiosk Memory Flush] Wiping all ephemeral patient data from RAM.");
        this.resetState();
        this.notifyListeners();
    }
}

export const kioskState = new KioskStateStore();
