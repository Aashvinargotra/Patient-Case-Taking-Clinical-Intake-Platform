/**
 * MediKiosk Audio Controller & Web Audio API Visualizer
 * Manages Speech Synthesis (TTS), Microphone Capture, Waveform Analyzer, and Fallback Handlers.
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
    }

    /**
     * Initializes the Web Audio API context and visualizer analyzer.
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
     * Starts microphone recording and attaches analyzer stream to animate visual waves.
     */
    async startRecording(onVisualizerTick, onAudioDataAvailable) {
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
            return true;
        } catch (err) {
            console.error("[AudioController] Microphone permission denied or unavailable:", err);
            // Graceful fallback to Touch mode
            kioskState.setState({ intakeMode: "TOUCH", isRecording: false });
            return false;
        }
    }

    /**
     * Stops microphone recording and audio visualizer loop.
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
        kioskState.setState({ isRecording: false });
    }

    /**
     * Text-To-Speech (TTS) synthesizer with multilingual voice selection and slow-speech toggle.
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
        const voices = this.synth.getVoices();

        // Language-specific voice selection
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

        const matchedVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(lang));
        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }

        // Adjust speed based on accessibility settings
        utterance.rate = state.slowSpeechMode ? 0.75 : 0.95;
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
