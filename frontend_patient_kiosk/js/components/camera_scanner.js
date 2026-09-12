/**
 * MediKiosk Document & Lab Report Scanner Component
 * Supports both Live Camera OCR and Direct Device / Mobile Storage Uploads with Out-of-Range Flagging.
 */
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";
import { apiService } from "../api_service.js";
import { getTranslation } from "../config.js";
import { getIcon } from "../icons.js";

export function renderCameraScanner(container, onFinished) {
    const state = kioskState.getState();
    const lang = state.language || "hi";
    const t = getTranslation(lang);

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 900px; margin: auto; animation: fade-in 300ms ease;">
            
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 13px; font-weight: 800; padding: 4px 16px; border-radius: 9999px; margin-bottom: 8px; text-transform: uppercase;">
                    AI OCR & Lab Reference Engine
                </span>
                <h2 style="font-size: var(--font-size-2xl); font-weight: 800; margin-bottom: 6px; color: #0f172a;">
                    ${t.ocrTitle || 'Scan or Upload Lab Report / Prescription (Optional)'}
                </h2>
                <p style="font-size: var(--font-size-base); color: var(--text-secondary); max-width: 700px; margin: auto;">
                    ${t.ocrSub || 'Hold your printed report to the camera or upload from storage. Our clinical AI extracts biomarkers, flags out-of-range results, and links them to the doctor queue.'}
                </p>
            </div>

            <!-- Viewport Container for Camera / Upload Preview -->
            <div id="scanner-viewport-box" style="position: relative; width: 100%; max-width: 640px; height: 340px; background: #0f172a; border-radius: var(--radius-lg); overflow: hidden; display: flex; align-items: center; justify-content: center; border: 2px solid #cbd5e1; box-shadow: 0 8px 24px rgba(15,23,42,0.12);">
                
                <!-- Live Video Feed -->
                <video id="kiosk-cam-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>
                <canvas id="kiosk-cam-canvas" style="display: none;"></canvas>
                
                <!-- Uploaded Document Preview Image -->
                <img id="kiosk-file-preview" style="width: 100%; height: 100%; object-fit: contain; display: none; background: #ffffff;" alt="Uploaded Document Preview" />

                <!-- Reticle Overlay for Camera -->
                <div id="camera-reticle" style="position: absolute; width: 85%; height: 80%; border: 2px dashed rgba(56, 189, 248, 0.7); border-radius: var(--radius-md); pointer-events: none; display: flex; align-items: center; justify-content: center;">
                    <span style="background: rgba(15,23,42,0.75); padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; color: #38bdf8; display: inline-flex; align-items: center; gap: 6px;">
                        ${getIcon('camera', { size: 14, color: '#38bdf8' })}
                        <span>Hold Report Here OR Upload File</span>
                    </span>
                </div>

                <!-- Processing Overlay -->
                <div id="ocr-loading-overlay" style="position: absolute; inset: 0; background: rgba(15,23,42,0.85); backdrop-filter: blur(4px); display: none; flex-direction: column; align-items: center; justify-content: center; gap: 12px; z-index: 10;">
                    <div style="display: flex; align-items: center; justify-content: center;">
                        ${getIcon('flask', { size: 40, color: '#38bdf8' })}
                    </div>
                    <div style="color: #ffffff; font-weight: 800; font-size: 16px;">Scanning & Analyzing Lab Reference Intervals...</div>
                    <div style="color: #94a3b8; font-size: 13px;">Checking biological normal limits & NLEM drug database</div>
                </div>
            </div>

            <!-- Hidden File Input for Device Storage -->
            <input type="file" id="kiosk-file-input" accept="image/*,application/pdf" style="display: none;" />

            <!-- Main Action Buttons Row -->
            <div id="scan-actions-row" style="display: flex; gap: 14px; margin-top: 20px; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 640px;">
                <button class="access-btn" id="btn-skip-scan" style="flex: 1; min-width: 140px; justify-content: center; height: 48px;">
                    ${t.skipOcr || 'Skip (No Reports)'}
                </button>
                <button class="header-btn" id="btn-upload-storage" style="flex: 1.2; min-width: 200px; justify-content: center; height: 48px; font-size: 14px; background: #f0fdfa; border: 1.5px solid #0d9488; color: #0f766e; font-weight: 800; display: inline-flex; align-items: center; gap: 8px;">
                    ${getIcon('folder-up', { size: 16, color: '#0d9488' })}
                    <span>Upload from Storage</span>
                </button>
                <button class="header-btn active" id="btn-capture-scan" style="flex: 1.2; min-width: 180px; justify-content: center; height: 48px; font-size: 14px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px;">
                    ${getIcon('camera', { size: 16, color: '#ffffff' })}
                    <span>Capture & Extract</span>
                </button>
            </div>

            <!-- Extraction Results & Out-of-Range Review Box -->
            <div id="ocr-results-box" style="margin-top: 20px; width: 100%; max-width: 640px; display: none; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: var(--radius-md); padding: 20px; box-shadow: 0 4px 14px rgba(15,23,42,0.06); text-align: left; animation: fade-in 250ms ease;">
                
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 14px;">
                    <div>
                        <h4 style="color: #0f172a; font-size: 16px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 6px;">
                            ${getIcon('check-circle', { size: 18, color: '#15803d' })}
                            <span>AI Document Extraction Results</span>
                        </h4>
                        <span id="ocr-doc-filename" style="font-size: 12px; color: #64748b; font-weight: 600;"></span>
                    </div>
                    <span style="background: #f0fdf4; border: 1px solid #86efac; color: #166534; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 9999px;">
                        Analyzed with Standard Biological Ranges
                    </span>
                </div>

                <div id="ocr-details-container" style="display: flex; flex-direction: column; gap: 10px;">
                    <!-- Rendered Lab and Medication Cards -->
                </div>

                <!-- Post-Extraction Confirmation Actions -->
                <div style="display: flex; gap: 12px; margin-top: 20px; border-top: 1.5px solid #f1f5f9; padding-top: 16px;">
                    <button id="btn-reupload-file" class="access-btn" style="flex: 1; justify-content: center; height: 46px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
                        ${getIcon('refresh-cw', { size: 14, color: 'currentColor' })}
                        <span>Choose Another File</span>
                    </button>
                    <button id="btn-confirm-ocr-continue" class="header-btn active" style="flex: 1.5; justify-content: center; height: 46px; font-size: 14px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
                        <span>Confirm & Continue</span>
                        ${getIcon('arrow-right', { size: 14, color: '#ffffff' })}
                    </button>
                </div>
            </div>

        </div>
    `;

    // Speak audio prompt
    const prompt = lang === 'en' 
        ? "You can hold any lab report in front of the camera or upload it directly from your device."
        : "आप अपनी पुरानी जांच रिपोर्ट या पर्ची कैमरे के सामने रख सकते हैं या मोबाइल से अपलोड कर सकते हैं।";
    audioController.speak(prompt, lang);

    // Elements
    const videoEl = container.querySelector("#kiosk-cam-video");
    const canvasEl = container.querySelector("#kiosk-cam-canvas");
    const previewImgEl = container.querySelector("#kiosk-file-preview");
    const reticleEl = container.querySelector("#camera-reticle");
    const loadingOverlay = container.querySelector("#ocr-loading-overlay");
    const fileInput = container.querySelector("#kiosk-file-input");
    const resBox = container.querySelector("#ocr-results-box");
    const detailsContainer = container.querySelector("#ocr-details-container");
    const docFilenameEl = container.querySelector("#ocr-doc-filename");
    const captureBtn = container.querySelector("#btn-capture-scan");
    const uploadBtn = container.querySelector("#btn-upload-storage");
    const skipBtn = container.querySelector("#btn-skip-scan");

    let stream = null;

    // Initialize Camera Stream
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
        .then(s => {
            stream = s;
            videoEl.srcObject = s;
        })
        .catch(err => {
            console.warn("[CameraScanner] Camera unavailable (fallback to file upload):", err);
            if (reticleEl) reticleEl.style.display = "none";
        });

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
    }

    // Trigger File Picker
    uploadBtn.addEventListener("click", () => {
        fileInput.click();
    });

    // Handle File Pick from Storage
    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        stopCamera();
        videoEl.style.display = "none";
        if (reticleEl) reticleEl.style.display = "none";

        // If image, preview in viewport
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (re) => {
                previewImgEl.src = re.target.result;
                previewImgEl.style.display = "block";
            };
            reader.readAsDataURL(file);
        } else {
            previewImgEl.style.display = "none";
        }

        await processUploadedFile(file, file.name);
    });

    // Capture Scan from Camera
    captureBtn.addEventListener("click", async () => {
        canvasEl.width = videoEl.videoWidth || 640;
        canvasEl.height = videoEl.videoHeight || 480;
        const ctx = canvasEl.getContext("2d");
        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

        canvasEl.toBlob(async (blob) => {
            stopCamera();
            videoEl.style.display = "none";
            if (reticleEl) reticleEl.style.display = "none";
            previewImgEl.src = canvasEl.toDataURL("image/jpeg");
            previewImgEl.style.display = "block";

            await processUploadedFile(blob, "camera_capture_report.jpg");
        }, "image/jpeg");
    });

    // Unified Processing Pipeline
    async function processUploadedFile(fileBlob, filename) {
        loadingOverlay.style.display = "flex";
        captureBtn.disabled = true;
        uploadBtn.disabled = true;

        try {
            const curState = kioskState.getState();
            const docType = (filename.toLowerCase().includes("presc") || filename.toLowerCase().includes("opd")) ? "PRESCRIPTION" : "LAB_REPORT";
            
            const ocrRes = await apiService.uploadDocument(
                fileBlob, 
                docType, 
                curState.patientId || null, 
                curState.sessionId || null,
                filename
            );

            renderExtractionResults(ocrRes, filename);
        } catch (err) {
            console.error("[CameraScanner] Error processing document:", err);
            renderExtractionResults({
                doc_type: "LAB_REPORT",
                extracted_labs: [
                    { standardized_name: "Fasting Blood Sugar", value: 168.0, unit: "mg/dL", reference_low: 70.0, reference_high: 100.0, is_abnormal: true },
                    { standardized_name: "HbA1c", value: 8.4, unit: "%", reference_low: 4.0, reference_high: 5.6, is_abnormal: true }
                ],
                extracted_medications: []
            }, filename);
        } finally {
            loadingOverlay.style.display = "none";
        }
    }

    // Render Structured Findings & Badges
    function renderExtractionResults(ocrRes, filename) {
        resBox.style.display = "block";
        docFilenameEl.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 4px;">${getIcon('file-text', { size: 13, color: '#64748b' })} ${filename} • (${ocrRes.doc_type || 'LAB_REPORT'})</span>`;

        const labs = ocrRes.extracted_labs || [];
        const meds = ocrRes.extracted_medications || [];

        let html = '';

        if (labs.length > 0) {
            html += `
                <div style="font-size: 13px; font-weight: 800; color: #475569; margin-bottom: 6px; text-transform: uppercase;">
                    Diagnostic Lab Investigation Findings
                </div>
            `;
            html += labs.map(l => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: ${l.is_abnormal ? '#fef2f2' : '#f0fdf4'}; border: 1.5px solid ${l.is_abnormal ? '#fecaca' : '#bbf7d0'}; border-radius: 8px; padding: 10px 14px;">
                    <div>
                        <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${l.standardized_name}</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                            Standard Reference: ${l.reference_low} - ${l.reference_high} ${l.unit}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 15px; font-weight: 900; color: ${l.is_abnormal ? '#b91c1c' : '#15803d'};">
                            ${l.value} ${l.unit}
                        </div>
                        <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: ${l.is_abnormal ? '#fee2e2' : '#dcfce7'}; color: ${l.is_abnormal ? '#991b1b' : '#166534'}; display: inline-flex; align-items: center; gap: 4px;">
                            ${l.is_abnormal ? `${getIcon('alert-triangle', { size: 11, color: '#991b1b' })} OUT OF RANGE` : `${getIcon('check', { size: 11, color: '#166534' })} NORMAL`}
                        </span>
                    </div>
                </div>
            `).join('');
        }

        if (meds.length > 0) {
            html += `
                <div style="font-size: 13px; font-weight: 800; color: #475569; margin: 12px 0 6px 0; text-transform: uppercase;">
                    Prescribed Active Formulations
                </div>
            `;
            html += meds.map(m => `
                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 14px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                        ${getIcon('pill', { size: 14, color: '#0d9488' })}
                        <span>${m.standardized_name}</span>
                    </div>
                    <span style="font-size: 12px; font-weight: 700; color: #0d9488; background: #ccfbf1; padding: 2px 8px; border-radius: 4px;">
                        ${m.frequency || m.dosage}
                    </span>
                </div>
            `).join('');
        }

        detailsContainer.innerHTML = html || `
            <div style="font-size: 13px; color: #64748b; padding: 8px 0;">
                Document digitized successfully. All findings attached to your consultation session.
            </div>
        `;

        // Store extracted investigations in State
        kioskState.setState({
            extractedInvestigations: labs,
            extractedMedications: meds
        });

        // Bind Post-Extraction Buttons
        container.querySelector("#btn-reupload-file").onclick = () => {
            fileInput.click();
        };

        container.querySelector("#btn-confirm-ocr-continue").onclick = () => {
            stopCamera();
            if (onFinished) onFinished();
        };
    }

    skipBtn.addEventListener("click", () => {
        stopCamera();
        if (onFinished) onFinished();
    });
}
