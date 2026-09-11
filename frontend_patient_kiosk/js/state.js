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
            
            // Intake Configurations
            discipline: null,         // 'ALLOPATHY' | 'AYUSH'
            language: "hi",           // Default Hindi
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
            
            // Accessibility Toggles
            highContrastMode: false,
            largeTextMode: false,
            slowSpeechMode: false,
            audioMuted: false,
            isRecording: false,
            isSpeaking: false,
            
            // Screen Navigation
            currentScreen: "HOME",    // HOME, AUTH, DISCIPLINE, INTAKE, BODY_MAP, DOC_SCAN, CONFIRMATION, TOKEN_SLIP
            
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
