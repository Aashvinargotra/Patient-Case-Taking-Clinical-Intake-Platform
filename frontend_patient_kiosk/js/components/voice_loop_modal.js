/**
 * MediKiosk Clinical Dialogue & Conversational Voice Turn-Taking Component
 */
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";
import { apiService } from "../api_service.js";

export function renderVoiceLoop(container, onCompleteIntake) {
    const state = kioskState.getState();
    const isAyush = state.discipline === "AYUSH";

    // Step sequence configuration
    const allopathySteps = [
        {
            key: "chief_complaint",
            stepNum: 1,
            titleHi: "आपकी मुख्य तकलीफ़ क्या है?",
            titleEn: "What is your main health complaint?",
            audioPromptHi: "कृपया बताएं कि आज आपको क्या मुख्य तकलीफ़ या बीमारी है?",
            chips: ["छाती में दर्द", "तेज़ बुखार", "सिरदर्द", "घुटनों में दर्द", "पेट में दर्द", "खांसी व ज़ुकाम"]
        },
        {
            key: "onset_and_timing",
            stepNum: 2,
            titleHi: "यह समस्या कब और कैसे शुरू हुई?",
            titleEn: "When and how did these symptoms start?",
            audioPromptHi: "यह तकलीफ़ कितने दिनों से है और अचानक शुरू हुई या धीरे-धीरे?",
            chips: ["आज अचानक", "2-3 दिन से", "1 सप्ताह से", "1 महीने से अधिक"]
        },
        {
            key: "character_and_severity",
            stepNum: 3,
            titleHi: "तकलीफ़ की गंभीरता और प्रकार कैसा है?",
            titleEn: "How would you describe the character & severity?",
            audioPromptHi: "दर्द का प्रकार कैसा है — चुभने वाला, भारीपन, या जलन जैसा?",
            chips: ["भारीपन व दबाव", "तीव्र चुभन", "जलन", "हल्का दर्द", "लगातार बना रहता है"]
        },
        {
            key: "associated_symptoms",
            stepNum: 4,
            titleHi: "क्या कोई अन्य लक्षण भी हैं?",
            titleEn: "Are there any associated symptoms?",
            audioPromptHi: "क्या पसीना आना, घबराहट, चक्कर या उल्टी जैसा कोई अन्य लक्षण है?",
            chips: ["पसीना व घबराहट", "सांस फूलना", "उल्टी व मितली", "कोई अन्य लक्षण नहीं"]
        },
        {
            key: "past_medical_and_meds",
            stepNum: 5,
            titleHi: "पूर्व बीमारी या वर्तमान दवाएं",
            titleEn: "Past medical history & ongoing medications",
            audioPromptHi: "क्या आपको पहले से ब्लड प्रेशर, शुगर या हृदय रोग की समस्या है?",
            chips: ["डायबिटीज (शुगर)", "हाई बीपी", "थायराइड", "कोई पूर्व बीमारी नहीं"]
        }
    ];

    const ayushSteps = [
        {
            key: "chief_complaint",
            stepNum: 1,
            titleHi: "आपकी मुख्य व्याधि या रोग लक्षण क्या हैं?",
            titleEn: "What are your primary symptoms / Roga Lakshana?",
            audioPromptHi: "कृपया बताएं कि आप किस रोग या तकलीफ़ के लिए परामर्श लेना चाहते हैं?",
            chips: ["संधिवात (जोड़ों का दर्द)", "अम्लपित्त (एसिडिटी/गैस)", "कब्ज व मंदाग्नि", "त्वचा रोग व खुजली", "पुराना ज्वर (बुखार)"]
        },
        {
            key: "prakriti_vikriti",
            stepNum: 2,
            titleHi: "दोष व प्रकृति लक्षण (वात, पित्त, कफ)",
            titleEn: "Doshic Predominance & Constitution",
            audioPromptHi: "क्या आपको शरीर में रूखापन, अत्यधिक गर्मी/जलन, या भारीपन महसूस होता है?",
            chips: ["वात प्रकोप (रूखापन/दर्द)", "पित्त प्रकोप (गर्मी/जलन)", "कफ प्रकोप (भारीपन/कफ)", "मिश्रित"]
        },
        {
            key: "ahara_vihara_and_agni",
            stepNum: 3,
            titleHi: "आहार, विहार एवं जठराग्नि (पाचन शक्ति)",
            titleEn: "Dietary Habits, Lifestyle & Digestion Capacity",
            audioPromptHi: "आपकी भूख और पाचन शक्ति कैसी है? क्या भोजन समय पर पचता है?",
            chips: ["मंदाग्नि (धीमा पाचन)", "तीक्ष्णाग्नि (अत्यधिक भूख/जलन)", "समाग्नि (उत्तम पाचन)", "अनियमित भूख"]
        },
        {
            key: "sattva_balam",
            stepNum: 4,
            titleHi: "सत्त्व व मानसिक स्थिति (सत्त्व परीक्षा)",
            titleEn: "Mental Resilience & Sleep Quality",
            audioPromptHi: "आपकी नींद और मानसिक स्थिति कैसी है? क्या तनाव या अनिद्रा रहती है?",
            chips: ["उत्तम निद्रा", "अनिद्रा व बेचैनी", "अधिक तनाव", "सामान्य"]
        }
    ];

    const steps = isAyush ? ayushSteps : allopathySteps;
    let currentStepIdx = state.currentStepIndex || 0;

    function renderCurrentStep() {
        const step = steps[currentStepIdx];
        const isHi = state.language === "hi";

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 900px; margin: auto; animation: fade-in 250ms ease;">
                
                <!-- Progress Dots -->
                <div class="step-progress-bar" role="progressbar" aria-valuenow="${currentStepIdx + 1}" aria-valuemin="1" aria-valuemax="${steps.length}">
                    ${steps.map((s, idx) => `
                        <div class="progress-dot ${idx === currentStepIdx ? 'active' : (idx < currentStepIdx ? 'completed' : '')}"></div>
                    `).join('')}
                </div>

                <!-- Step Title & Spoken Question -->
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: var(--font-size-sm); color: var(--primary-teal); font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                        Step ${currentStepIdx + 1} of ${steps.length} • ${isAyush ? 'AYUSH Dashavidha' : 'SOCRATES Intake'}
                    </span>
                    <h2 style="font-size: var(--font-size-xl); font-weight: 800; margin-top: 8px;">
                        ${isHi ? step.titleHi : step.titleEn}
                    </h2>
                </div>

                <!-- Voice Turn-Taking Pulse Sphere -->
                <div class="voice-sphere-container">
                    <div class="voice-sphere" id="mic-sphere" role="button" tabindex="0" aria-label="Microphone speaking sphere. Tap to speak or stop.">
                        🎙️
                    </div>
                    <div class="audio-waveform" id="waveform-container">
                        <div class="waveform-bar" style="height: 14px;"></div>
                        <div class="waveform-bar" style="height: 24px;"></div>
                        <div class="waveform-bar" style="height: 36px;"></div>
                        <div class="waveform-bar" style="height: 20px;"></div>
                        <div class="waveform-bar" style="height: 12px;"></div>
                    </div>
                    <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: 12px;" id="voice-status-label">
                        ${isHi ? 'माइक पर बोलें या नीचे दिए गए विकल्पों को स्पर्श करें' : 'Speak into the mic or tap the quick options below'}
                    </p>
                </div>

                <!-- Quick Touch Chips -->
                <div class="chip-grid" style="margin-top: 16px;">
                    ${step.chips.map(chip => `
                        <button class="touch-chip" data-chip-val="${chip}">
                            <span>${chip}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Navigation Controls -->
                <div style="display: flex; justify-content: space-between; width: 100%; max-width: 700px; margin-top: 36px;">
                    <button class="header-btn" id="btn-prev-step" ${currentStepIdx === 0 ? 'disabled style="opacity: 0.4;"' : ''}>
                        ⬅️ ${isHi ? 'पिछला' : 'Previous'}
                    </button>
                    <button class="header-btn active" id="btn-next-step" style="padding: 0 32px; font-weight: 800;">
                        ${currentStepIdx === steps.length - 1 ? (isHi ? 'पुष्टि करें एवं पर्ची बनाएं ➔' : 'Confirm & Generate Token ➔') : (isHi ? 'अगला ➔' : 'Next ➔')}
                    </button>
                </div>

            </div>
        `;

        // Automatically speak step question
        const prompt = isHi ? step.audioPromptHi : step.titleEn;
        audioController.speak(prompt, state.language);

        // Bind Microphone Sphere click
        const micSphere = container.querySelector("#mic-sphere");
        const statusLabel = container.querySelector("#voice-status-label");
        let isRec = false;

        micSphere.addEventListener("click", async () => {
            if (!isRec) {
                isRec = true;
                micSphere.classList.add("recording");
                statusLabel.textContent = isHi ? "सुन रहे हैं... बोलिए" : "Listening... please speak now";
                await audioController.startRecording((freqData) => {
                    // Update visualizer bars
                    const bars = container.querySelectorAll(".waveform-bar");
                    bars.forEach((b, i) => {
                        const val = freqData[i * 2] || 10;
                        b.style.height = `${Math.max(8, val / 4)}px`;
                    });
                }, async (audioBlob) => {
                    const res = await apiService.transcribeSpeechAudio(audioBlob, state.language);
                    if (res && res.transcript) {
                        statusLabel.textContent = `"${res.transcript}"`;
                        kioskState.updateSlot(step.key, res.transcript);
                    }
                });
            } else {
                isRec = false;
                micSphere.classList.remove("recording");
                audioController.stopRecording();
                statusLabel.textContent = isHi ? "रिकॉर्डिंग पूर्ण" : "Recording complete";
            }
        });

        // Touch chip selection
        container.querySelectorAll(".touch-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                const val = chip.getAttribute("data-chip-val");
                kioskState.updateSlot(step.key, val);
                advanceStep();
            });
        });

        // Prev / Next button bindings
        container.querySelector("#btn-prev-step").addEventListener("click", () => {
            if (currentStepIdx > 0) {
                currentStepIdx--;
                kioskState.setState({ currentStepIndex: currentStepIdx });
                renderCurrentStep();
            }
        });

        container.querySelector("#btn-next-step").addEventListener("click", () => {
            advanceStep();
        });
    }

    function advanceStep() {
        if (currentStepIdx < steps.length - 1) {
            currentStepIdx++;
            kioskState.setState({ currentStepIndex: currentStepIdx });
            renderCurrentStep();
        } else {
            if (onCompleteIntake) onCompleteIntake();
        }
    }

    renderCurrentStep();
}
