/**
 * MediKiosk Audio Controller & Web Speech Recognition Streamer
 * Manages Multilingual Speech Synthesis (TTS), Microphone Capture, Real-Time Speech Recognition & Waveform Visualizer.
 */
import { kioskState } from "./state.js";

class AudioController {
    constructor() {
        this.audioCtx = null;
        this.analyser = null;
        this.mediaStream = null;
        this.dataArray = null;
        this.animationFrameId = null;
        this.synth = window.speechSynthesis || null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentUtterance = null;
        this.recognition = null;
        this.isRecognitionActive = false;

        // Initialize voices when available
        if (this.synth && this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => {
                this.voices = this.synth.getVoices();
            };
        }
    }

    /**
     * Initializes Web Audio API analyzer
     */
    async initAudioContext() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
                this.analyser = this.audioCtx.createAnalyser();
                this.analyser.fftSize = 64;
                const bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(bufferLength);
            }
        }
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            await this.audioCtx.resume();
        }
    }

    /**
     * Starts microphone recording and live speech-to-text recognition
     */
    async startRecording(onVisualizerTick, onAudioDataAvailable, onLiveTranscript) {
        try {
            await this.initAudioContext();
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
                if (onAudioDataAvailable) onAudioDataAvailable(audioBlob);
            };

            this.mediaRecorder.start();
            kioskState.setState({ isRecording: true });

            // Animate waveform
            const renderFrame = () => {
                if (!kioskState.getState().isRecording) return;
                this.analyser.getByteFrequencyData(this.dataArray);
                if (onVisualizerTick) {
                    onVisualizerTick(this.dataArray);
                }
                this.animationFrameId = requestAnimationFrame(renderFrame);
            };
            renderFrame();

            // Start Live Web Speech Recognition if available in browser
            this.startLiveRecognition(kioskState.getState().language, onLiveTranscript);

            return true;
        } catch (err) {
            console.error("[AudioController] Microphone permission or device error:", err);
            // Fallback to client recognition or touch
            this.startLiveRecognition(kioskState.getState().language, onLiveTranscript);
            return false;
        }
    }

    /**
     * Starts continuous live Web Speech API recognition for real-time streaming to UI
     */
    startLiveRecognition(lang = "hi", onLiveTranscript = null) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("[AudioController] Web Speech Recognition not supported in this browser.");
            return;
        }

        const langMap = {
            hi: "hi-IN",
            pa: "pa-IN",
            en: "en-IN",
            bn: "bn-IN",
            ta: "ta-IN",
            te: "te-IN",
            mr: "mr-IN",
            gu: "gu-IN"
        };

        try {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = langMap[lang] || "hi-IN";

            this.recognition.onresult = (event) => {
                let interimTranscript = "";
                let finalTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                const currentText = finalTranscript || interimTranscript;
                if (onLiveTranscript && currentText) {
                    onLiveTranscript(currentText, Boolean(finalTranscript));
                }
            };

            this.recognition.onerror = (e) => {
                console.warn("[AudioController] SpeechRecognition error:", e.error);
            };

            this.recognition.start();
            this.isRecognitionActive = true;
        } catch (e) {
            console.warn("[AudioController] Failed to initialize SpeechRecognition:", e);
        }
    }

    /**
     * Stops microphone recording and speech recognition
     */
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
            this.mediaRecorder.stop();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.recognition && this.isRecognitionActive) {
            try {
                this.recognition.stop();
            } catch (e) {}
            this.isRecognitionActive = false;
        }
        kioskState.setState({ isRecording: false });
    }

    /**
     * Text-To-Speech (TTS) synthesizer with multilingual voice selection
     */
    speak(text, lang = "hi", onComplete = null) {
        if (!this.synth) {
            if (onComplete) onComplete();
            return;
        }

        this.synth.cancel(); // Stop any ongoing speech

        const state = kioskState.getState();
        if (state.audioMuted) {
            if (onComplete) onComplete();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        const langMap = {
            hi: "hi-IN",
            pa: "pa-IN",
            en: "en-IN",
            bn: "bn-IN",
            ta: "ta-IN",
            te: "te-IN",
            mr: "mr-IN",
            gu: "gu-IN"
        };

        const targetLang = langMap[lang] || "hi-IN";
        utterance.lang = targetLang;

        const voices = this.synth.getVoices();
        const matchedVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(lang));
        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }

        utterance.rate = state.slowSpeechMode ? 0.75 : 0.92;
        utterance.pitch = 1.0;

        utterance.onstart = () => kioskState.setState({ isSpeaking: true });
        utterance.onend = () => {
            kioskState.setState({ isSpeaking: false });
            if (onComplete) onComplete();
        };
        utterance.onerror = (e) => {
            console.warn("[TTS Exception]", e);
            kioskState.setState({ isSpeaking: false });
            if (onComplete) onComplete();
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }

    stopSpeaking() {
        if (this.synth) {
            this.synth.cancel();
            kioskState.setState({ isSpeaking: false });
        }
    }
}

export const audioController = new AudioController();
