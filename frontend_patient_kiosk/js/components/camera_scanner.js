/**
 * MediKiosk Document Scanner Component (Camera Capture & OCR Preview)
 */
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";
import { apiService } from "../api_service.js";
import { getTranslation } from "../config.js";

export function renderCameraScanner(container, onFinished) {
    const state = kioskState.getState();
    const lang = state.language || "hi";
    const t = getTranslation(lang);

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 900px; margin: auto;">
            
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-size: var(--font-size-xl); font-weight: 800; margin-bottom: 8px; color: #0f172a;">
                    ${t.ocrTitle || 'Scan Previous Prescription or Lab Report (Optional)'}
                </h2>
                <p style="font-size: var(--font-size-base); color: var(--text-secondary);">
                    ${t.ocrSub || 'Hold your document in front of the camera and tap Capture.'}
                </p>
            </div>

            <!-- Video Camera Viewport -->
            <div style="width: 100%; max-width: 640px; height: 380px; background: #000; border-radius: var(--radius-lg); border: 2px solid var(--primary-teal); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);">
                <video id="kiosk-cam-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                <canvas id="kiosk-cam-canvas" style="display: none;"></canvas>
                
                <!-- Target Reticle Overlay -->
                <div style="position: absolute; width: 85%; height: 80%; border: 2px dashed rgba(56, 189, 248, 0.6); border-radius: var(--radius-md); pointer-events: none; display: flex; align-items: center; justify-content: center;">
                    <span style="background: rgba(0,0,0,0.6); padding: 6px 16px; border-radius: 9999px; font-size: var(--font-size-sm); color: #38bdf8;">
                        ${t.ocrSub || 'Align Document Here'}
                    </span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 20px; margin-top: 24px;">
                <button class="access-btn" id="btn-skip-scan">
                    ${t.skipOcr || 'Skip Document Upload'}
                </button>
                <button class="header-btn active" id="btn-capture-scan" style="padding: 0 36px; height: var(--tap-target-min);">
                    ${t.captureBtn || '📸 Capture & Extract'}
                </button>
            </div>

            <!-- Extraction Status Box -->
            <div id="ocr-results-box" style="margin-top: 20px; width: 100%; max-width: 640px; display: none; background: var(--bg-surface); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: left;">
                <h4 style="color: var(--primary-teal); font-weight: 700;">✅ Extracted Entities / निकाली गई जानकारी:</h4>
                <div id="ocr-details-text" style="font-size: var(--font-size-sm); margin-top: 8px; color: var(--text-primary);"></div>
            </div>

        </div>
    `;

    // Speak audio prompt
    const prompt = t.ocrSub || "You can hold any prior prescription or lab report in front of the camera.";
    audioController.speak(prompt, lang);

    // Initialize Camera Stream
    const videoEl = container.querySelector("#kiosk-cam-video");
    const canvasEl = container.querySelector("#kiosk-cam-canvas");
    let stream = null;

    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
        .then(s => {
            stream = s;
            videoEl.srcObject = s;
        })
        .catch(err => {
            console.warn("[CameraScanner] Camera unavailable:", err);
        });

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
    }

    // Capture Scan
    const captureBtn = container.querySelector("#btn-capture-scan");
    captureBtn.addEventListener("click", async () => {
        canvasEl.width = videoEl.videoWidth || 640;
        canvasEl.height = videoEl.videoHeight || 480;
        const ctx = canvasEl.getContext("2d");
        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

        canvasEl.toBlob(async (blob) => {
            captureBtn.disabled = true;
            captureBtn.textContent = "Extracting OCR...";
            
            const ocrRes = await apiService.uploadDocument(blob, "PRESCRIPTION");
            const resBox = container.querySelector("#ocr-results-box");
            const detailsText = container.querySelector("#ocr-details-text");
            
            resBox.style.display = "block";
            const meds = ocrRes.extracted_medications ? ocrRes.extracted_medications.map(m => `💊 ${m.standardized_name} (${m.dosage})`).join(", ") : "";
            detailsText.textContent = meds || "Document digitized successfully.";
            
            kioskState.setState({ extractedInvestigations: ocrRes.extracted_medications || [] });

            setTimeout(() => {
                stopCamera();
                if (onFinished) onFinished();
            }, 2000);
        }, "image/jpeg");
    });

    container.querySelector("#btn-skip-scan").addEventListener("click", () => {
        stopCamera();
        if (onFinished) onFinished();
    });
}
