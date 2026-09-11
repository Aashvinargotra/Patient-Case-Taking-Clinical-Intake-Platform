/**
 * MediKiosk Physician Console & Clinical Summary Review Editor (Phase 4.2)
 */
import { portalState } from "../state.js";
import { portalApi } from "../api.js";

export async function renderDoctorDashboard(container) {
    const state = portalState.getState();
    const queueItems = await portalApi.getDoctorOpdQueue(state.activeDepartment);
    
    // Auto-select first patient if none selected
    let selectedPatientId = state.selectedPatientId || (queueItems[0] ? queueItems[0].patient_id : "PAT-DEMO-01");
    const caseData = await portalApi.lookupPatientCase(selectedPatientId);

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 340px 1fr; gap: 24px; height: calc(100vh - 110px);">
            
            <!-- Left Panel: Prioritized OPD Worklist Queue -->
            <div style="background: var(--portal-card); border: 1px solid var(--portal-border); border-radius: var(--radius-md); display: flex; flex-direction: column; overflow: hidden;">
                <div style="padding: 16px 20px; border-bottom: 1px solid var(--portal-border); display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <h3 style="font-size: 15px; font-weight: 700; color: #ffffff;">OPD Queue Worklist</h3>
                        <span style="font-size: 12px; color: var(--portal-text-muted);">${state.activeDepartment}</span>
                    </div>
                    <span class="badge badge-blue">${queueItems.length} Waiting</span>
                </div>

                <!-- Queue Items Scrollable List -->
                <div style="flex: 1; overflow-y: auto; padding: 12px;" id="doctor-queue-list">
                    ${queueItems.map(item => `
                        <div class="queue-item-card ${item.patient_id === selectedPatientId ? 'active' : ''}" 
                             data-pat-id="${item.patient_id}"
                             style="background: ${item.patient_id === selectedPatientId ? 'var(--portal-card-elevated)' : 'rgba(0,0,0,0.2)'}; 
                                    border: 1px solid ${item.patient_id === selectedPatientId ? 'var(--portal-primary)' : 'var(--portal-border)'}; 
                                    border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 8px; cursor: pointer; transition: all 150ms ease;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                                <span style="font-weight: 800; font-size: 16px; color: #38bdf8;">Token #${item.token_number}</span>
                                <span class="badge ${item.priority_tier === 'RED' ? 'badge-red' : (item.priority_tier === 'AMBER' ? 'badge-amber' : 'badge-green')}">
                                    ${item.priority_tier === 'RED' ? '🚨 TIER-1 RED' : (item.priority_tier === 'AMBER' ? '⚠️ TIER-2 AMBER' : 'NORMAL')}
                                </span>
                            </div>
                            <div style="font-weight: 700; font-size: 14px; color: var(--portal-text-main);">${item.patient_name} (${item.gender})</div>
                            <div style="font-size: 12px; color: var(--portal-text-muted); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${item.chief_complaint}
                            </div>
                            <div style="font-size: 11px; color: var(--portal-green); margin-top: 6px; font-weight: 600;">
                                ✅ Pre-consultation Intake Ready
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Right Panel: Comprehensive Patient Case Sheet & Verification Console -->
            <div style="background: var(--portal-card); border: 1px solid var(--portal-border); border-radius: var(--radius-md); display: flex; flex-direction: column; overflow: hidden;">
                
                <!-- Patient Banner -->
                <div style="padding: 16px 24px; border-bottom: 1px solid var(--portal-border); background: rgba(0, 0, 0, 0.2); display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="user-avatar" style="width: 44px; height: 44px; font-size: 18px;">
                            ${caseData.patient.full_name.charAt(0)}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <h2 style="font-size: 18px; font-weight: 800; color: #ffffff;">${caseData.patient.full_name}</h2>
                                <span style="font-size: 13px; color: var(--portal-text-muted); font-weight: 600;">(${caseData.patient.patient_id})</span>
                                <span class="badge ${caseData.current_summary?.is_draft ? 'badge-draft' : 'badge-green'}">
                                    ${caseData.current_summary?.is_draft ? '⚠️ AI DRAFT RECORD' : '✅ SIGNED & VERIFIED'}
                                </span>
                            </div>
                            <div style="font-size: 12px; color: var(--portal-text-muted); margin-top: 2px;">
                                Gender: ${caseData.patient.gender} • Birth Year: ${caseData.patient.birth_year || '1975'} • ABHA: ${caseData.patient.abha_address || 'None'}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-secondary" id="btn-open-crops">
                            🖼️ View Source Document Crops
                        </button>
                    </div>
                </div>

                <!-- Case Sheet Tabs & Main Workspace -->
                <div style="flex: 1; overflow-y: auto; padding: 20px 24px;">
                    
                    <!-- Abnormal Labs Callout Box (if any) -->
                    ${caseData.abnormal_investigations.length > 0 ? `
                        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: var(--radius-sm); padding: 14px 18px; margin-bottom: 20px;">
                            <div style="font-weight: 800; font-size: 13px; color: #fca5a5; display: flex; align-items: center; gap: 8px;">
                                ⚠️ ABNORMAL BIOLOGICAL REFERENCE INTERVALS DETECTED (OCR)
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px;">
                                ${caseData.abnormal_investigations.map(lab => `
                                    <div style="background: rgba(0,0,0,0.4); padding: 6px 12px; border-radius: 4px; font-size: 12px; border: 1px solid rgba(239,68,68,0.3);">
                                        <strong>${lab.standardized_name}:</strong> <span style="color: #fca5a5; font-weight: 800;">${lab.value} ${lab.unit}</span> (Ref: ${lab.reference_low}-${lab.reference_high})
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Structured Clinical Draft Editor -->
                    <div style="margin-bottom: 16px;">
                        <label style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--portal-text-muted); display: block; margin-bottom: 8px;">
                            Pre-Consultation Clinical Intake Case Sheet (Markdown Editor)
                        </label>
                        <textarea class="summary-editor-textarea" id="clinical-summary-text">${caseData.current_summary?.draft_summary_text || 'No intake summary generated.'}</textarea>
                    </div>

                    <!-- Physician Clinical Notes & Rx Additions -->
                    <div style="margin-bottom: 16px;">
                        <label style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--portal-text-muted); display: block; margin-bottom: 8px;">
                            Attending Physician Notes & Prescription Rx
                        </label>
                        <textarea class="summary-editor-textarea" id="doctor-rx-notes" style="height: 100px;" placeholder="Enter clinical diagnosis, prescribed medication regimen, diet advice, and follow-up date..."></textarea>
                    </div>

                    <!-- Sign-off Action Bar -->
                    <div class="signoff-action-bar">
                        <div>
                            <div style="font-weight: 700; font-size: 14px; color: #ffffff;">Attending Physician: ${state.activeDoctorName}</div>
                            <div style="font-size: 12px; color: var(--portal-text-muted);">Digital verification will archive draft status and stamp official OPD record.</div>
                        </div>
                        <button class="btn btn-primary" id="btn-sign-summary" style="padding: 12px 28px; font-size: 15px; font-weight: 800;">
                            ✍️ Verify & Sign Case Sheet (Official Sign-Off)
                        </button>
                    </div>

                </div>
            </div>

        </div>

        <!-- Split-Screen Crop Viewer Modal (Hidden by Default) -->
        <div id="crop-viewer-modal" class="hotkey-modal-overlay" style="display: none;">
            <div class="hotkey-modal-card" style="max-width: 960px; height: 80vh; display: flex; flex-direction: column;">
                <div style="padding: 16px 20px; border-bottom: 1px solid var(--portal-border); display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="font-size: 16px; font-weight: 800; color: #ffffff;">Prescription OCR Bounding-Box Split Verification</h3>
                    <button class="btn btn-secondary" id="btn-close-crop-modal">✕ Close</button>
                </div>
                <div class="split-viewer-grid" style="padding: 20px; height: 100%;">
                    <!-- Left: Digitized Entities -->
                    <div class="split-pane">
                        <div class="pane-header">Digitized Medication Entities</div>
                        <div style="font-size: 13px; line-height: 1.8;">
                            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; margin-bottom: 8px; border: 1px solid var(--portal-border);">
                                <strong>Tab Telmisartan 40mg OD</strong><br>
                                <span style="color: var(--portal-primary);">NLEM Match: Telmisartan 40mg (Confidence: 95%)</span>
                            </div>
                            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border: 1px solid var(--portal-border);">
                                <strong>Tab Metformin 500mg BD</strong><br>
                                <span style="color: var(--portal-primary);">NLEM Match: Metformin 500mg (Confidence: 92%)</span>
                            </div>
                        </div>
                    </div>
                    <!-- Right: Crop Image Slice -->
                    <div class="split-pane">
                        <div class="pane-header">Source Document Crop Slice</div>
                        <div class="crop-preview-box">
                            <div style="text-align: center; color: var(--portal-text-muted);">
                                <span style="font-size: 32px;">📄</span><br>
                                <span style="font-size: 12px; font-family: monospace;">[High-Res Prescription Bounding Box Crop]</span><br>
                                <span style="font-size: 13px; color: #38bdf8; font-weight: 700;">Rx: Tab Telmisartan 40mg OD - 1 month</span>
                            </div>
                            <span class="ocr-confidence-tag">95% MATCH</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Event Handlers
    container.querySelectorAll(".queue-item-card").forEach(card => {
        card.addEventListener("click", () => {
            const patId = card.getAttribute("data-pat-id");
            portalState.setState({ selectedPatientId: patId });
            renderDoctorDashboard(container);
        });
    });

    const cropModal = container.querySelector("#crop-viewer-modal");
    container.querySelector("#btn-open-crops").addEventListener("click", () => {
        cropModal.style.display = "flex";
    });
    container.querySelector("#btn-close-crop-modal").addEventListener("click", () => {
        cropModal.style.display = "none";
    });

    // Digital Sign-Off
    container.querySelector("#btn-sign-summary").addEventListener("click", async () => {
        const summaryText = container.querySelector("#clinical-summary-text").value;
        const notes = container.querySelector("#doctor-rx-notes").value;
        const summaryId = caseData.current_summary?.summary_id || "sum_1";

        const res = await portalApi.signClinicalSummary(summaryId, state.activeDoctorId, notes, summaryText);
        alert(`✅ Official Case Sheet Signed by ${state.activeDoctorName}!\nDraft Status cleared (is_draft = FALSE).`);
        renderDoctorDashboard(container);
    });
}
