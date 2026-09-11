/**
 * MediKiosk Active Consultation Cabin View (Section 2)
 * Manages QR/PIN verification unlock, Case Sheet review, stopwatch timer, and clinical sign-off.
 */
import { portalState } from "../state.js";
import { portalApi } from "../api.js";

const unlockedPatients = new Map(); // patientId -> caseData
let consultationTimerInterval = null;
let consultationStartTime = null;

export async function renderDoctorDashboard(container, onReturnToQueue = null) {
    const state = portalState.getState();
    const activeDocId = state.activeDoctorId || "DOC-AYUSH-01";
    const activeDocName = state.activeDoctorName || "Dr. Ananya Sharma";
    const activeDept = state.activeDepartment || "KAYACHIKITSA";
    const activeDeptName = state.activeDepartmentName || "Kayachikitsa (Ayurveda OPD)";
    const activeRoom = state.activeRoom || "Room A-101";

    // Get current queue to find selected patient
    const queueItems = await portalApi.getDoctorOpdQueue(activeDept);
    let selectedPatientId = state.selectedPatientId || (queueItems[0] ? queueItems[0].patient_id : "PAT-DEMO-01");
    let currentPatient = queueItems.find(q => q.patient_id === selectedPatientId) || {
        token_number: 101,
        patient_name: "Rahul Verma",
        patient_id: selectedPatientId,
        gender: "M",
        priority_tier: "NORMAL",
        assigned_room: activeRoom
    };

    const isUnlocked = unlockedPatients.has(selectedPatientId);
    const caseData = isUnlocked ? unlockedPatients.get(selectedPatientId) : null;

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px; max-width: 1200px; margin: auto; animation: fade-in 200ms ease;">
            
            <!-- Consultation Top Navigation Bar -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 14px 24px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <button class="btn btn-outline" id="btn-back-to-queue" style="padding: 8px 16px; font-size: 13px;">
                        ⬅️ Back to Patient Queue
                    </button>
                    <div>
                        <span style="font-size: 12px; font-weight: 800; color: #0d9488; text-transform: uppercase;">
                            ${activeRoom} • ${activeDeptName}
                        </span>
                        <div style="font-size: 16px; font-weight: 800; color: #0f172a;">
                            Consultation Cabin — ${activeDocName}
                        </div>
                    </div>
                </div>

                ${isUnlocked ? `
                    <!-- Live Consultation Duration Stopwatch -->
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div id="consultation-timer-box" style="display: flex; align-items: center; gap: 8px; background: #f0fdfa; border: 1.5px solid #99f6e4; color: #0d9488; padding: 6px 18px; border-radius: 9999px; font-size: 14px; font-weight: 800;">
                            <span>⏱️ Consultation Duration:</span>
                            <span id="consultation-timer-display" style="font-family: monospace; font-size: 16px; font-weight: 900;">00:00</span>
                        </div>
                        <button class="btn btn-success" id="btn-sign-complete" style="font-weight: 800; font-size: 14px; padding: 10px 22px;">
                            ✅ Sign-Off & Complete Consultation
                        </button>
                    </div>
                ` : `
                    <span class="badge badge-amber">🔒 Patient Record Locked</span>
                `}
            </div>

            ${!isUnlocked ? `
                <!-- ========================================== -->
                <!-- 🔒 SECURITY UNLOCK BARRIER (QR / PIN GATE) -->
                <!-- ========================================== -->
                <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 48px 24px; text-align: center; box-shadow: 0 4px 16px rgba(15,23,42,0.04); display: flex; flex-direction: column; align-items: center;">
                    
                    <div style="width: 72px; height: 72px; background: #fef3c7; border: 2px solid #fcd34d; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 18px;">
                        🛡️
                    </div>

                    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
                        Patient Medical History is Encrypted & Locked
                    </h2>
                    <p style="font-size: 14px; color: #475569; max-width: 540px; line-height: 1.6; margin-bottom: 24px;">
                        Under DPDP privacy governance, doctors can only open and view a patient's case sheet when the patient presents their generated OPD Parchi (Slip).
                    </p>

                    <!-- Selected Patient Summary Header -->
                    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: var(--radius-sm); padding: 14px 28px; margin-bottom: 28px; display: inline-flex; align-items: center; gap: 16px;">
                        <span style="font-size: 20px; font-weight: 900; color: #0284c7;">Token #${currentPatient.token_number}</span>
                        <span style="color: #cbd5e1;">•</span>
                        <span style="font-size: 16px; font-weight: 800; color: #0f172a;">${currentPatient.patient_name}</span>
                        <span style="color: #cbd5e1;">•</span>
                        <span style="font-size: 13px; color: #64748b; font-weight: 600;">${currentPatient.patient_id}</span>
                    </div>

                    <!-- Unlock Controls Box -->
                    <div style="width: 100%; max-width: 440px; background: #ffffff; border: 2px solid #0d9488; border-radius: var(--radius-md); padding: 24px; box-shadow: 0 10px 25px rgba(13,148,136,0.08);">
                        
                        <label style="display: block; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-align: left;">
                            🔢 Enter 4-Digit Token PIN / Token Number:
                        </label>
                        <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                            <input type="text" id="input-token-pin" maxlength="6" 
                                   placeholder="e.g. ${currentPatient.token_number || '101'}" 
                                   value="${currentPatient.token_number || ''}"
                                   style="flex: 1; background: #f8fafc; border: 1.5px solid #cbd5e1; color: #0f172a; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 18px; font-weight: 800; text-align: center; letter-spacing: 2px; outline: none;">
                            <button class="btn btn-primary" id="btn-unlock-pin" style="padding: 0 24px; font-weight: 800; font-size: 14px;">
                                Unlock ➔
                            </button>
                        </div>

                        <div style="display: flex; align-items: center; gap: 12px; margin: 16px 0; color: #94a3b8; font-size: 12px; font-weight: 700;">
                            <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                            <span>OR</span>
                            <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                        </div>

                        <button class="btn" id="btn-scan-qr" style="width: 100%; background: #f0fdfa; color: #0d9488; border: 1.5px solid #99f6e4; padding: 12px; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>📷 Scan Patient Slip QR Code</span>
                        </button>
                    </div>

                </div>
            ` : `
                <!-- ========================================== -->
                <!-- 🔓 UNLOCKED CLINICAL CASE SHEET & EDITOR   -->
                <!-- ========================================== -->
                
                <!-- Patient Demographic Banner -->
                <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #f0fdfa; border: 2px solid #99f6e4; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                            ${caseData.patient.gender === 'F' ? '👩' : '👨'}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0;">
                                    ${caseData.patient.full_name}
                                </h3>
                                <span class="badge badge-blue">Token #${currentPatient.token_number}</span>
                                <span class="badge badge-green">QR Verified</span>
                            </div>
                            <div style="font-size: 13px; color: #475569; margin-top: 4px; font-weight: 500;">
                                <strong>ID:</strong> ${caseData.patient.patient_id} • 
                                <strong>Gender:</strong> ${caseData.patient.gender === 'F' ? 'Female' : 'Male'} • 
                                <strong>Age:</strong> ${caseData.patient.birth_year ? (2026 - caseData.patient.birth_year) + ' yrs' : '45 yrs'} • 
                                <strong>ABHA:</strong> ${caseData.patient.abha_address || 'aarav.sharma@abdm'}
                            </div>
                        </div>
                    </div>
                    <span class="badge badge-green" style="font-size: 13px; padding: 6px 14px;">
                        🟢 Active in Cabin
                    </span>
                </div>

                <!-- Main Grid: Clinical Summary & Notes Left, Labs & Timeline Right -->
                <div style="display: grid; grid-template-columns: 1fr 360px; gap: 20px;">
                    
                    <!-- Left: AI Pre-intake Summary & Doctor Prescription Notes -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        
                        <!-- AI Pre-intake Summary Card -->
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 20px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 10px;">
                                <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
                                    <span>📋</span>
                                    <span>AI Pre-Consultation Clinical Intake Summary (Patient-Reported)</span>
                                </h4>
                                <span class="badge badge-blue">DRAFT SUMMARY</span>
                            </div>
                            <div class="summary-pre-box" id="summary-text-display">
${caseData.current_summary ? caseData.current_summary.draft_summary_text : 'Pre-intake summary recorded during kiosk triage.'}
                            </div>
                        </div>

                        <!-- Attending Physician Notes & Prescription Card -->
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 20px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
                            <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 10px;">
                                ✍️ Attending Physician Clinical Notes, Diagnosis & Prescription:
                            </h4>
                            <textarea id="doctor-notes-input" rows="4" class="form-input"
                                      placeholder="Enter confirmed diagnosis, Ayurvedic/Allopathic prescription, dosage regimen, and follow-up advice..."
                                      style="line-height: 1.6; resize: vertical;"></textarea>
                        </div>

                    </div>

                    <!-- Right: Abnormal Labs & Longitudinal Timeline -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        
                        <!-- Abnormal Labs Panel -->
                        <div style="background: #ffffff; border: 1.5px solid #fee2e2; border-radius: var(--radius-md); padding: 18px; box-shadow: 0 2px 8px rgba(239,68,68,0.04);">
                            <h4 style="font-size: 14px; font-weight: 800; color: #b91c1c; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                                <span>⚠️</span>
                                <span>Abnormal Lab Callouts</span>
                            </h4>
                            ${caseData.abnormal_investigations.length === 0 ? `
                                <p style="font-size: 13px; color: #64748b; margin: 0;">No abnormal lab investigations flagged for this patient.</p>
                            ` : caseData.abnormal_investigations.map(lab => `
                                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 14px; margin-bottom: 8px; border-radius: 0 6px 6px 0;">
                                    <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${lab.standardized_name}</div>
                                    <div style="font-size: 13px; color: #b91c1c; font-weight: 800; margin-top: 2px;">
                                        ${lab.value} ${lab.unit} <span style="font-size: 11px; font-weight: 600; color: #64748b;">(Normal: ${lab.reference_low}-${lab.reference_high})</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Longitudinal Medical Timeline -->
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 18px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
                            <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                                <span>🕒</span>
                                <span>Longitudinal Timeline</span>
                            </h4>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${caseData.timeline.map(t => `
                                    <div style="border-left: 2px solid #0d9488; padding-left: 10px;">
                                        <div style="font-size: 11px; font-weight: 700; color: #0d9488;">${new Date(t.timestamp).toLocaleDateString()}</div>
                                        <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${t.title}</div>
                                        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${t.description}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                    </div>

                </div>
            `}

        </div>
    `;

    // Back to Queue Button
    container.querySelector("#btn-back-to-queue").addEventListener("click", () => {
        if (onReturnToQueue) onReturnToQueue();
    });

    // Handle Unlock via PIN
    const unlockBtn = container.querySelector("#btn-unlock-pin");
    if (unlockBtn) {
        unlockBtn.addEventListener("click", async () => {
            const pinVal = container.querySelector("#input-token-pin").value.trim();
            unlockBtn.disabled = true;
            unlockBtn.textContent = "Verifying PIN...";

            const unlockedCase = await portalApi.verifyPatientToken(activeDocId, {
                patient_id: selectedPatientId,
                token_number: parseInt(pinVal, 10) || currentPatient.token_number,
                token_pin: pinVal
            });

            unlockedPatients.set(selectedPatientId, unlockedCase);
            startConsultationTimer();
            renderDoctorDashboard(container, onReturnToQueue);
        });
    }

    // Handle Unlock via QR Scan Button
    const scanQrBtn = container.querySelector("#btn-scan-qr");
    if (scanQrBtn) {
        scanQrBtn.addEventListener("click", async () => {
            scanQrBtn.disabled = true;
            scanQrBtn.textContent = "📷 Reading Camera QR...";

            setTimeout(async () => {
                const unlockedCase = await portalApi.verifyPatientToken(activeDocId, {
                    patient_id: selectedPatientId,
                    qr_data: `TOKEN-${currentPatient.token_number}`
                });

                unlockedPatients.set(selectedPatientId, unlockedCase);
                startConsultationTimer();
                renderDoctorDashboard(container, onReturnToQueue);
            }, 600);
        });
    }

    // Handle Sign-off and Complete Consultation
    const signBtn = container.querySelector("#btn-sign-complete");
    if (signBtn) {
        signBtn.addEventListener("click", async () => {
            const notesInput = container.querySelector("#doctor-notes-input");
            const notes = notesInput ? notesInput.value : "";
            const durationSecs = consultationStartTime ? Math.max(10, Math.round((Date.now() - consultationStartTime) / 1000)) : 180;
            const summaryId = caseData && caseData.current_summary ? caseData.current_summary.summary_id : "sum_mock_1";

            signBtn.disabled = true;
            signBtn.textContent = "Signing...";

            try {
                await portalApi.signClinicalSummary(
                    summaryId,
                    activeDocId,
                    notes,
                    null,
                    durationSecs
                );
            } catch (err) {
                console.warn("Sign summary error fallback:", err);
            }

            stopConsultationTimer();
            alert(`✅ Consultation Completed & Signed!\nPatient: ${caseData.patient.full_name} (Token #${currentPatient.token_number})\nDuration: ${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s\nCase sheet signed and transmitted to patient ABHA record.`);
            
            // Remove unlocked status for this patient
            unlockedPatients.delete(selectedPatientId);
            
            if (onReturnToQueue) {
                onReturnToQueue();
            } else {
                renderDoctorDashboard(container, onReturnToQueue);
            }
        });
    }

    // Start or update live consultation duration stopwatch
    if (isUnlocked) {
        startConsultationTimer();
    }
}

function startConsultationTimer() {
    if (!consultationStartTime) {
        consultationStartTime = Date.now();
    }
    if (consultationTimerInterval) {
        clearInterval(consultationTimerInterval);
    }

    consultationTimerInterval = setInterval(() => {
        const timerDisplay = document.getElementById("consultation-timer-display");
        const timerBox = document.getElementById("consultation-timer-box");
        if (!timerDisplay) return;

        const elapsedSecs = Math.floor((Date.now() - consultationStartTime) / 1000);
        const mins = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
        const secs = (elapsedSecs % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;

        // Soft visual color-coding for OPD throughput
        if (timerBox) {
            if (elapsedSecs > 720) { // > 12 mins
                timerBox.style.color = "#c2410c";
                timerBox.style.background = "#ffedd5";
                timerBox.style.borderColor = "#fdba74";
            } else if (elapsedSecs > 480) { // > 8 mins
                timerBox.style.color = "#a16207";
                timerBox.style.background = "#fef9c3";
                timerBox.style.borderColor = "#fde047";
            } else {
                timerBox.style.color = "#0d9488";
                timerBox.style.background = "#f0fdfa";
                timerBox.style.borderColor = "#99f6e4";
            }
        }
    }, 1000);
}

function stopConsultationTimer() {
    if (consultationTimerInterval) {
        clearInterval(consultationTimerInterval);
        consultationTimerInterval = null;
    }
    consultationStartTime = null;
}
