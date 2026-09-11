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
        this.recognition = null;
        this.isRecognitionActive = false;
        this.voices = [];
        this.isUnlocked = false;

        // Initialize voices when available
        this.loadVoices();
        if (this.synth && this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => {
                this.loadVoices();
            };
        }

        // Auto unlock AudioContext and SpeechSynthesis on first user interaction anywhere
        const unlockAudio = () => {
            if (!this.isUnlocked) {
                this.isUnlocked = true;
                this.initAudioContext();
                if (this.synth) {
                    this.synth.resume();
                }
            }
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("touchstart", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
        };
        window.addEventListener("click", unlockAudio);
        window.addEventListener("touchstart", unlockAudio);
        window.addEventListener("keydown", unlockAudio);
    }

    loadVoices() {
        if (!this.synth) return;
        this.voices = this.synth.getVoices();
    }

    /**
     * Initializes Web Audio API analyzer & synthesizes feedback tones
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
            try {
                await this.audioCtx.resume();
            } catch (e) {
                console.warn("[AudioController] Could not resume AudioContext:", e);
            }
        }
    }

    /**
     * Plays a pleasant, subtle hospital acoustic chime before prompts
     */
    playChime(type = "prompt") {
        try {
            if (!this.audioCtx || this.audioCtx.state === "suspended") {
                this.initAudioContext();
            }
            if (!this.audioCtx) return;

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            const now = this.audioCtx.currentTime;
            if (type === "prompt") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === "tap") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(440, now);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            }
        } catch (e) {
            // Non-blocking fallback
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
            this.startLiveRecognition(kioskState.getState().language, onLiveTranscript);
            return false;
        }
    }

    /**
     * Starts continuous live Web Speech API recognition for real-time streaming to UI
     */
    startLiveRecognition(lang = "en", onLiveTranscript = null) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("[AudioController] Web Speech Recognition not supported in this browser.");
            return;
        }

        const langMap = {
            en: "en-IN",
            hi: "hi-IN",
            pa: "pa-IN",
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
            this.recognition.lang = langMap[lang] || "en-IN";

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
            try { this.mediaRecorder.stop(); } catch (e) {}
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
     * Text-To-Speech (TTS) synthesizer with multilingual voice selection and Chromium fix
     */
    speak(text, lang = "en", onComplete = null) {
        if (!text) {
            if (onComplete) onComplete();
            return;
        }

        const state = kioskState.getState();
        if (state.audioMuted) {
            if (onComplete) onComplete();
            return;
        }

        // Play gentle introductory chime
        this.playChime("prompt");

        if (!this.synth && !window.speechSynthesis) {
            console.warn("[AudioController] SpeechSynthesis not supported by this browser.");
            if (onComplete) onComplete();
            return;
        }

        const synth = this.synth || window.speechSynthesis;

        // Cancel previous utterances to avoid queuing delay
        try {
            synth.cancel();
            if (synth.paused) {
                synth.resume();
            }
        } catch (e) {}

        const utterance = new SpeechSynthesisUtterance(text);

        const langMap = {
            en: "en-IN",
            hi: "hi-IN",
            pa: "pa-IN",
            bn: "bn-IN",
            ta: "ta-IN",
            te: "te-IN",
            mr: "mr-IN",
            gu: "gu-IN"
        };

        const targetLang = langMap[lang] || "en-IN";
        utterance.lang = targetLang;

        let voices = synth.getVoices();
        if (!voices || voices.length === 0) {
            voices = this.voices || [];
        }

        // Find voice: 1. exact match, 2. prefix match, 3. Indian English, 4. default system voice
        let matchedVoice = voices.find(v => v.lang === targetLang || v.lang.replace('_', '-') === targetLang);
        if (!matchedVoice) {
            matchedVoice = voices.find(v => v.lang.startsWith(lang));
        }
        if (!matchedVoice) {
            matchedVoice = voices.find(v => v.lang.includes("IN") || v.lang.includes("en-"));
        }
        if (!matchedVoice && voices.length > 0) {
            matchedVoice = voices[0];
        }

        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }

        utterance.rate = state.slowSpeechMode ? 0.75 : 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            kioskState.setState({ isSpeaking: true });
        };
        utterance.onend = () => {
            kioskState.setState({ isSpeaking: false });
            if (onComplete) onComplete();
        };
        utterance.onerror = (e) => {
            console.warn("[TTS Utterance Warning]", e);
            kioskState.setState({ isSpeaking: false });
            if (onComplete) onComplete();
        };

        // Retain global reference to avoid Chromium GC bug
        window.__medikioskCurrentUtterance = utterance;

        // Small delay to ensure clean state transition in Chrome
        setTimeout(() => {
            try {
                synth.resume();
                synth.speak(utterance);
            } catch (err) {
                console.error("[TTS speak error]", err);
                kioskState.setState({ isSpeaking: false });
                if (onComplete) onComplete();
            }
        }, 60);
    }

    stopSpeaking() {
        const synth = this.synth || window.speechSynthesis;
        if (synth) {
            try {
                synth.cancel();
            } catch (e) {}
            kioskState.setState({ isSpeaking: false });
        }
    }
}

export const audioController = new AudioController();
