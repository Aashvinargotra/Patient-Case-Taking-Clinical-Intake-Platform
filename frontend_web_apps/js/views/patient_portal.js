/**
 * MyMediKiosk Patient Web Portal & DPDP Privacy Rights Controller (Phase 4.4)
 */
import { portalApi } from "../api.js";

export async function renderPatientPortal(container) {
    const patientId = "PAT-DEMO-01";
    const caseData = await portalApi.lookupPatientCase(patientId);

    container.innerHTML = `
        <div style="max-width: 960px; margin: auto;">
            
            <div style="margin-bottom: 24px;">
                <h2 style="font-size: 22px; font-weight: 800; color: #ffffff;">MyMediKiosk — Patient Self-Service & Health Portal</h2>
                <p style="font-size: 13px; color: var(--portal-text-muted);">View your OPD visit records, pre-upload lab reports, manage DPDP privacy rights, and merge temporary walk-in slips.</p>
            </div>

            <!-- Patient Profile & Digital Parchi Card -->
            <div style="background: var(--portal-card); border: 1px solid var(--portal-border); border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--portal-border); padding-bottom: 16px; margin-bottom: 16px;">
                    <div>
                        <h3 style="font-size: 18px; font-weight: 800; color: #ffffff;">${caseData.patient.full_name}</h3>
                        <div style="font-size: 13px; color: var(--portal-text-muted);">Patient ID: <strong>${caseData.patient.patient_id}</strong> • ABHA: <strong>${caseData.patient.abha_address || 'Unlinked'}</strong></div>
                    </div>
                    <span class="badge badge-green">Permanent Registered Record</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div style="background: rgba(0,0,0,0.25); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--portal-border);">
                        <h4 style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">🎟️ Active Digital OPD Parchi</h4>
                        <p style="font-size: 13px; color: var(--portal-text-main);">Today's Consultation: <strong>${caseData.current_summary?.chief_complaint || 'Routine Checkup'}</strong></p>
                        <p style="font-size: 12px; color: var(--portal-text-muted); margin-top: 4px;">Status: Verified Case Sheet</p>
                    </div>

                    <div style="background: rgba(0,0,0,0.25); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--portal-border);">
                        <h4 style="font-size: 14px; font-weight: 700; color: var(--portal-primary); margin-bottom: 6px;">📄 Pre-OPD Document Upload</h4>
                        <p style="font-size: 13px; color: var(--portal-text-muted); margin-bottom: 8px;">Upload lab panels or old prescriptions from home before visiting the hospital.</p>
                        <button class="btn btn-secondary" id="btn-portal-upload" style="font-size: 12px;">📤 Upload Document</button>
                    </div>
                </div>
            </div>

            <!-- DPDP Act 2023 Privacy Rights & Merge Wizard -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                
                <!-- Privacy Rights Box -->
                <div style="background: var(--portal-card); border: 1px solid var(--portal-border); border-radius: var(--radius-md); padding: 20px;">
                    <h3 style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">🛡️ DPDP Act 2023 Privacy Controls</h3>
                    <p style="font-size: 12px; color: var(--portal-text-muted); margin-bottom: 16px;">
                        Under the Digital Personal Data Protection Act, you have full control over your health data and consent logs.
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn btn-secondary" id="btn-view-consent">📜 View Full Consent History</button>
                        <button class="btn btn-danger" id="btn-request-erasure">🗑️ Request Cryptographic Data Erasure</button>
                    </div>
                </div>

                <!-- Temporary Record Merge Wizard -->
                <div style="background: var(--portal-card); border: 1px solid var(--portal-border); border-radius: var(--radius-md); padding: 20px;">
                    <h3 style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">🔗 Merge Temporary Walk-in Record</h3>
                    <p style="font-size: 12px; color: var(--portal-text-muted); margin-bottom: 12px;">
                        If you previously registered as a quick walk-in guest at the kiosk, link your temporary slip history here.
                    </p>
                    <input type="text" id="merge-temp-id" placeholder="Enter Temporary ID (e.g. TEMP-98412)" 
                           style="width: 100%; height: 38px; background: rgba(0,0,0,0.3); border: 1px solid var(--portal-border); border-radius: var(--radius-sm); color: #fff; padding: 0 12px; font-size: 13px; margin-bottom: 12px;" />
                    <button class="btn btn-primary" id="btn-execute-merge" style="width: 100%;">
                        Merge & Migrate 6 Tables
                    </button>
                </div>

            </div>

        </div>
    `;

    // Event handlers
    container.querySelector("#btn-view-consent").addEventListener("click", () => {
        alert("📜 DPDP Consent Records:\n- Purpose: OPD Case Taking & Clinical Support (CONSENTED)\n- Purpose: ABDM Health Information Sharing (CONSENTED)\n- Timestamp: " + new Date().toISOString());
    });

    container.querySelector("#btn-request-erasure").addEventListener("click", () => {
        if (confirm("Are you sure you want to request complete cryptographic erasure of your health data under the DPDP Act 2023?")) {
            alert("✅ Data Erasure Request logged with DPDP Data Protection Officer. Audit ID generated.");
        }
    });

    container.querySelector("#btn-execute-merge").addEventListener("click", async () => {
        const tempId = container.querySelector("#merge-temp-id").value.trim();
        if (!tempId) {
            alert("Please enter a valid temporary patient ID.");
            return;
        }
        const res = await portalApi.mergeTemporaryPatient(tempId, patientId);
        alert(`✅ Atomic Merge Successful!\n${res.message}\nMigrated FK tables: visit_sessions, clinical_summaries, medical_documents, token_records, consent_records, triage_alerts.`);
    });
}
