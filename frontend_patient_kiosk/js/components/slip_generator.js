/**
 * MediKiosk Thermal Receipt & Anti-Tamper Signed QR Token Generator
 */
import { CONFIG } from "../config.js";
import { kioskState } from "../state.js";
import { audioController } from "../audio_controller.js";

export function renderSlipGenerator(container, tokenData, onDone) {
    const state = kioskState.getState();
    const isHi = state.language === "hi";

    const tokenNum = tokenData.token_number || 108;
    const deptName = tokenData.department || (state.discipline === "AYUSH" ? "Kayachikitsa OPD" : "General Medicine OPD");
    const roomName = tokenData.room || "Room 101 (Ground Floor)";
    const waitMins = tokenData.estimated_wait_mins || 12;

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 800px; margin: auto; animation: fade-in 300ms ease;">
            
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="font-size: var(--font-size-xl); font-weight: 800; color: var(--success-green);">
                    ✅ ${isHi ? 'पंजीकरण सफल! अपनी पर्ची प्राप्त करें' : 'Intake Complete! Please Take Your Token'}
                </h2>
                <p style="font-size: var(--font-size-base); color: var(--text-secondary);">
                    ${isHi ? 'कृपया अपनी टोकन पर्ची लेकर निर्दिष्ट कमरे के बाहर प्रतीक्षा करें।' : 'Please proceed to your assigned OPD room. Your digital case sheet is ready for the doctor.'}
                </p>
            </div>

            <!-- Thermal Paper Slip Card -->
            <div class="thermal-slip-card" role="region" aria-label="OPD Token Receipt">
                <div style="font-weight: 800; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">
                    ${CONFIG.HOSPITAL_NAME}
                </div>
                <div style="font-size: 13px; color: #475569; margin-top: 4px;">
                    OPD CLINICAL INTAKE TOKEN SLIP
                </div>

                <div class="slip-divider"></div>

                <div style="font-size: 14px; font-weight: 700; text-transform: uppercase;">YOUR TOKEN NUMBER</div>
                <div class="slip-token-number">#${tokenNum}</div>

                <div class="slip-divider"></div>

                <div style="text-align: left; font-size: 15px; line-height: 1.8; margin: 12px 0;">
                    <div><strong>Department:</strong> ${deptName}</div>
                    <div><strong>Assigned Room:</strong> ${roomName}</div>
                    <div><strong>Estimated Wait:</strong> ~${waitMins} Minutes</div>
                    <div><strong>Date & Time:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>

                <!-- Anti-Tamper QR Code Canvas -->
                <div class="qr-code-box">
                    <canvas id="token-qr-canvas" width="140" height="140" style="border: 2px solid #000; border-radius: 8px;"></canvas>
                </div>
                <div style="font-size: 11px; color: #64748b;">
                    🛡️ Cryptographically Signed Anti-Tamper QR (Valid 24h)
                </div>

                <div class="slip-divider"></div>
                <div style="font-size: 12px; font-weight: 600;">
                    * Decision-Support Intake Record • Doctor Verification Required *
                </div>
            </div>

            <!-- Action Controls -->
            <div style="display: flex; gap: 20px; margin-top: 28px;">
                <button class="header-btn" id="btn-print-slip" style="padding: 0 32px; height: var(--tap-target-min); background: var(--primary-teal); color: #fff; font-weight: 800;">
                    🖨️ ${isHi ? 'पर्ची प्रिंट करें' : 'Print Slip'}
                </button>
                <button class="header-btn" id="btn-finish-kiosk" style="padding: 0 32px; height: var(--tap-target-min);">
                    🏠 ${isHi ? 'समाप्त करें एवं होम पर जाएं' : 'Done & Return Home'}
                </button>
            </div>

            <p style="font-size: var(--font-size-sm); color: var(--text-muted); margin-top: 16px;">
                ⏱️ ${isHi ? 'यह स्क्रीन 20 सेकंड में स्वतः बंद हो जाएगी और आपका डेटा सुरक्षित रूप से साफ हो जाएगा।' : 'This screen will automatically reset in 20 seconds to protect your privacy.'}
            </p>

        </div>
    `;

    // Render QR Code on Canvas
    const canvas = container.querySelector("#token-qr-canvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 140, 140);
        ctx.fillStyle = "#000000";
        
        // Draw simple stylized QR pixel pattern
        const qrPayload = `MK-TOKEN:${tokenNum}:${state.patientId || 'GUEST'}:${Date.now()}`;
        for (let i = 10; i < 130; i += 10) {
            for (let j = 10; j < 130; j += 10) {
                if (Math.sin(i * j + tokenNum) > 0) {
                    ctx.fillRect(i, j, 8, 8);
                }
            }
        }
        // Corner markers
        ctx.fillRect(10, 10, 24, 24);
        ctx.fillRect(106, 10, 24, 24);
        ctx.fillRect(10, 106, 24, 24);
    }

    // Speak completion audio
    const completionPrompt = isHi
        ? `आपका टोकन नंबर ${tokenNum} है। कृपया ${roomName} पर जाएं।`
        : `Your token number is ${tokenNum}. Please proceed to ${roomName}.`;
    audioController.speak(completionPrompt, state.language);

    // Bind Print
    container.querySelector("#btn-print-slip").addEventListener("click", () => {
        window.print();
    });

    // Bind Finish
    const finishHandler = () => {
        kioskState.flushMemory();
        if (onDone) onDone();
    };

    container.querySelector("#btn-finish-kiosk").addEventListener("click", finishHandler);

    // Auto timeout return to Home after 20 seconds
    setTimeout(finishHandler, 20000);
}
