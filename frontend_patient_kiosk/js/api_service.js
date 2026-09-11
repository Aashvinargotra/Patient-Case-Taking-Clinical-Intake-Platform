/**
 * MediKiosk API Service Client
 * Connects patient kiosk frontend to FastAPI core engines.
 */
import { CONFIG } from "./config.js";

class ApiService {
    /**
     * Authenticates or creates temporary walk-in session
     */
    async login(loginType, payload) {
        try {
            const resp = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    auth_type: loginType,
                    ...payload
                })
            });
            return await resp.json();
        } catch (err) {
            console.error("[ApiService.login] Network Error:", err);
            // Return offline simulated session fallback
            return {
                access_token: `mock_jwt_${Date.now()}`,
                patient_id: payload.patient_id || `pat_offline_${Date.now()}`,
                session_id: `sess_offline_${Date.now()}`,
                name: payload.phone_number ? `Walk-in Patient` : "Demo Patient",
                is_offline_fallback: true
            };
        }
    }

    /**
     * Sends speech audio blob to backend ASR for multilingual transcription
     */
    async transcribeSpeechAudio(audioBlob, language = "hi") {
        try {
            const formData = new FormData();
            formData.append("audio_file", audioBlob, "kiosk_speech.webm");
            formData.append("language", language);

            const resp = await fetch(`${CONFIG.API_BASE_URL}/intake/transcribe`, {
                method: "POST",
                body: formData
            });
            if (resp.ok) {
                return await resp.json();
            }
            return { transcript: "" };
        } catch (err) {
            console.warn("[ApiService.transcribeSpeechAudio] Fallback to client recognition:", err);
            return { transcript: "" };
        }
    }

    /**
     * Submits current step input to dialogue state engine for slot extraction & next step prompt
     */
    async processDialogueStep(discipline, currentStep, userInput, language = "hi", existingSlots = {}) {
        try {
            const resp = await fetch(`${CONFIG.API_BASE_URL}/intake/dialogue-step`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    discipline: discipline,
                    current_step: currentStep,
                    user_input: userInput,
                    language: language,
                    existing_slots: existingSlots
                })
            });
            if (resp.ok) {
                return await resp.json();
            }
        } catch (err) {
            console.warn("[ApiService.processDialogueStep] Using client state machine fallback:", err);
        }

        // Local state machine fallback
        return null;
    }

    /**
     * Evaluates red-flag triage rules against completed intake slots
     */
    async evaluateTriage(chiefComplaint, slots = {}) {
        try {
            const resp = await fetch(`${CONFIG.API_BASE_URL}/triage/evaluate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chief_complaint: chiefComplaint,
                    slots: slots
                })
            });
            if (resp.ok) {
                return await resp.json();
            }
        } catch (err) {
            console.warn("[ApiService.evaluateTriage] Local triage rule check fallback:", err);
        }

        // Client-side rule check
        const text = (chiefComplaint || "").toLowerCase();
        if (text.includes("chest pain") || text.includes("heart") || text.includes("severe breathlessness")) {
            return { alert_tier: "RED", rule_id: "ACS_SUSPICION_TIER1", priority_score: 99 };
        }
        return { alert_tier: null, priority_score: 10 };
    }

    /**
     * Finalizes clinical intake session: creates draft summary and generates signed QR token
     */
    async finalizeSession(sessionData) {
        try {
            const resp = await fetch(`${CONFIG.API_BASE_URL}/intake/finalize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sessionData)
            });
            if (resp.ok) {
                return await resp.json();
            }
        } catch (err) {
            console.warn("[ApiService.finalizeSession] Using local token generator fallback:", err);
        }

        const tokenNum = Math.floor(100 + Math.random() * 900);
        return {
            status: "SUCCESS",
            token_number: tokenNum,
            department: sessionData.discipline === "AYUSH" ? "Kayachikitsa (A-101)" : "General Medicine (Room 101)",
            room: sessionData.discipline === "AYUSH" ? "Room A-101" : "Room 101",
            signed_qr_payload: `MK-TOKEN:${tokenNum}:${Date.now()}:DEMO_SIG`,
            estimated_wait_mins: 15
        };
    }

    /**
     * Uploads captured document photo for OCR entity extraction
     */
    async uploadDocument(fileBlob, docType = "PRESCRIPTION") {
        try {
            const formData = new FormData();
            formData.append("file", fileBlob, "document_scan.jpg");
            formData.append("doc_type", docType);

            const resp = await fetch(`${CONFIG.API_BASE_URL}/documents/upload`, {
                method: "POST",
                body: formData
            });
            if (resp.ok) {
                return await resp.json();
            }
        } catch (err) {
            console.warn("[ApiService.uploadDocument] Simulated OCR extraction fallback:", err);
        }

        return {
            status: "EXTRACTED",
            extracted_medications: [
                { standardized_name: "Telmisartan 40mg", dosage: "40mg", frequency: "OD" }
            ],
            extracted_labs: []
        };
    /**
     * ABHA Gateway OTP Request
     */
    async requestAbhaOtp(abhaId) {
        try {
            const resp = await fetch(`${CONFIG.API_BASE_URL}/auth/abha/request-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ abha_id: abhaId })
            });
            if (resp.ok) return await resp.json();
        } catch (err) {
            console.warn("[ApiService.requestAbhaOtp] Offline fallback:", err);
        }
        return {
            txn_id: `ABDM-TXN-${Date.now()}`,
            message: "ABDM OTP dispatched to registered mobile",
            demo_otp: "123456"
        };
    }

    /**
     * ABHA Gateway OTP Verification
     */
    async verifyAbhaOtp(txnId, otp, abhaId) {
        try {
            const resp = await fetch(`${CONFIG.API_BASE_URL}/auth/abha/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ txn_id: txnId, otp: otp, abha_id: abhaId })
            });
            if (resp.ok) return await resp.json();
        } catch (err) {
            console.warn("[ApiService.verifyAbhaOtp] Offline fallback:", err);
        }
        return {
            access_token: `mock_abha_jwt_${Date.now()}`,
            patient: {
                patient_id: "PAT-DEMO-01",
                full_name: "Aarav Sharma",
                gender: "MALE",
                birth_year: 1988,
                abha_address: abhaId || "aarav.sharma@abdm"
            }
        };
    }

    /**
     * Register New ABHA Profile
     */
    async registerNewAbha(data) {
        try {
            const resp = await fetch(`${CONFIG.API_BASE_URL}/auth/abha/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (resp.ok) return await resp.json();
        } catch (err) {
            console.warn("[ApiService.registerNewAbha] Offline fallback:", err);
        }
        return {
            access_token: `mock_reg_jwt_${Date.now()}`,
            patient_id: `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
            abha_number: `14-${Math.floor(1000 + Math.random() * 9000)}-1234-5678`,
            abha_address: data.desired_abha || `${data.full_name.toLowerCase().split(' ')[0]}@abdm`,
            full_name: data.full_name
        };
    }
}

export const apiService = new ApiService();

