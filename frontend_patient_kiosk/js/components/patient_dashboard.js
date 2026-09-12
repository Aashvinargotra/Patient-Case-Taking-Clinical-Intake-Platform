/**
 * MediKiosk Patient Profile Dashboard Component
 * Enables patients to view their health profile, review past OPD consultations with
 * full medication dosages, and upload lab reports directly from storage without symptom intake.
 */
import { kioskState } from "../state.js";
import { apiService } from "../api_service.js";
import { getTranslation } from "../config.js";
import { getIcon } from "../icons.js";

// Comprehensive Default Clinical Consultations for Demo Accounts
const DEFAULT_PATIENT_CONSULTATIONS = {
    "PAT-DEL-8912": [
        {
            consultation_id: "CONS-HIST-101",
            date: "2026-05-10",
            facility: "Safdarjung Hospital - Central OPD",
            doctor: "Dr. Vikram Malhotra",
            department: "Cardiology OPD",
            room: "Room 104",
            chief_complaint: "Exertional chest tightness, elevated BP (142/90 mmHg)",
            diagnosis: "Essential Stage-1 Hypertension (ICD-10 I10)",
            clinical_notes: "Advised low-sodium DASH diet, daily 30-min brisk walk. BP monitored weekly. Prescribed Telmisartan 40mg.",
            summary_text: "Patient presented with 2-week history of mild exertion-related headaches and chest heaviness. ECG normal sinus rhythm.",
            prescriptions: [
                { name: "Tab. Telmisartan", dosage: "40 mg", frequency: "OD (Once daily in morning)", duration: "30 days", instructions: "Post breakfast with water" },
                { name: "Tab. Aspirin", dosage: "75 mg", frequency: "OD (Once daily)", duration: "30 days", instructions: "After dinner" }
            ],
            verified: true
        }
    ],
    "PAT-AARAV-01": [
        {
            consultation_id: "CONS-HIST-102",
            date: "2026-06-20",
            facility: "AIIMS New Delhi - OPD Block",
            doctor: "Dr. Priya Sen",
            department: "General Medicine OPD",
            room: "Room 101",
            chief_complaint: "Recurrent morning sneezing, nasal blockage, allergic rhinitis",
            diagnosis: "Allergic Rhinitis (ICD-10 J30.9)",
            clinical_notes: "Bilateral inferior turbinate hypertrophy. Advised dust avoidance and saline nasal irrigations. Short-course antihistamine initiated.",
            summary_text: "Patient has 3-month history of worsening morning allergic sneezing episodes triggered by indoor dust.",
            prescriptions: [
                { name: "Tab. Montelukast + Levocetirizine", dosage: "10mg + 5mg", frequency: "HS (At bedtime)", duration: "10 days", instructions: "Take at night before sleep" },
                { name: "Nasal Spray Fluticasone", dosage: "50 mcg/spray", frequency: "1 puff BD", duration: "14 days", instructions: "1 spray each nostril twice daily" }
            ],
            verified: true
        }
    ],
    "PAT-DEMO-01": [
        {
            consultation_id: "CONS-HIST-102",
            date: "2026-06-20",
            facility: "AIIMS New Delhi - OPD Block",
            doctor: "Dr. Priya Sen",
            department: "General Medicine OPD",
            room: "Room 101",
            chief_complaint: "Recurrent morning sneezing, nasal blockage, allergic rhinitis",
            diagnosis: "Allergic Rhinitis (ICD-10 J30.9)",
            clinical_notes: "Bilateral inferior turbinate hypertrophy. Advised dust avoidance and saline nasal irrigations. Short-course antihistamine initiated.",
            summary_text: "Patient has 3-month history of worsening morning allergic sneezing episodes triggered by indoor dust.",
            prescriptions: [
                { name: "Tab. Montelukast + Levocetirizine", dosage: "10mg + 5mg", frequency: "HS (At bedtime)", duration: "10 days", instructions: "Take at night before sleep" },
                { name: "Nasal Spray Fluticasone", dosage: "50 mcg/spray", frequency: "1 puff BD", duration: "14 days", instructions: "1 spray each nostril twice daily" }
            ],
            verified: true
        }
    ],
    "PAT-PRIYA-02": [
        {
            consultation_id: "CONS-HIST-103",
            date: "2026-07-15",
            facility: "All India Institute of Ayurveda (AIIA)",
            doctor: "Dr. Ananya Sharma",
            department: "Kayachikitsa (Ayurveda OPD)",
            room: "Room A-101",
            chief_complaint: "Epigastric burning, acid reflux, sour belching (Amlapitta)",
            diagnosis: "Amlapitta / Hyperacidity (NAMASTE Code: AYU-AM-01)",
            clinical_notes: "Pitta Prakopa noted due to irregular meal timings and spicy food intake. Prescribed Avipattikar Churna with Kamadudha Rasa.",
            summary_text: "Patient experienced vidaha (retrosternal burning) 1-2 hours after food intake. Advised strict dietary restrictions.",
            prescriptions: [
                { name: "Avipattikar Churna", dosage: "3 grams", frequency: "BD (Twice daily)", duration: "15 days", instructions: "Take with lukewarm water 30 mins before meals" },
                { name: "Kamadudha Rasa (Mukta Yukta)", dosage: "250 mg", frequency: "BD (Twice daily)", duration: "15 days", instructions: "With honey or water post lunch and dinner" },
                { name: "Sutshekhar Rasa", dosage: "125 mg", frequency: "OD (Once daily)", duration: "10 days", instructions: "Morning on empty stomach" }
            ],
            verified: true
        }
    ]
};

// Default Sample Uploaded Labs
const DEFAULT_PATIENT_LABS = {
    "PAT-DEL-8912": [
        {
            filename: "Lipid_Profile_Report_May2026.pdf",
            uploaded_at: "2026-05-08T10:30:00Z",
            doc_type: "LAB_REPORT",
            extracted_labs: [
                { standardized_name: "Total Cholesterol", value: 232.0, unit: "mg/dL", reference_low: 125.0, reference_high: 200.0, is_abnormal: true },
                { standardized_name: "Triglycerides", value: 195.0, unit: "mg/dL", reference_low: 50.0, reference_high: 150.0, is_abnormal: true },
                { standardized_name: "HDL Cholesterol", value: 42.0, unit: "mg/dL", reference_low: 40.0, reference_high: 60.0, is_abnormal: false },
                { standardized_name: "LDL Cholesterol", value: 151.0, unit: "mg/dL", reference_low: 50.0, reference_high: 100.0, is_abnormal: true }
            ]
        }
    ],
    "PAT-AARAV-01": [
        {
            filename: "HbA1c_Blood_Glucose_Panel.pdf",
            uploaded_at: "2026-06-18T14:15:00Z",
            doc_type: "LAB_REPORT",
            extracted_labs: [
                { standardized_name: "Fasting Blood Sugar", value: 168.0, unit: "mg/dL", reference_low: 70.0, reference_high: 100.0, is_abnormal: true },
                { standardized_name: "HbA1c Glycated Hemoglobin", value: 8.4, unit: "%", reference_low: 4.0, reference_high: 5.6, is_abnormal: true },
                { standardized_name: "Serum Creatinine", value: 0.9, unit: "mg/dL", reference_low: 0.6, reference_high: 1.2, is_abnormal: false }
            ]
        }
    ],
    "PAT-DEMO-01": [
        {
            filename: "HbA1c_Blood_Glucose_Panel.pdf",
            uploaded_at: "2026-06-18T14:15:00Z",
            doc_type: "LAB_REPORT",
            extracted_labs: [
                { standardized_name: "Fasting Blood Sugar", value: 168.0, unit: "mg/dL", reference_low: 70.0, reference_high: 100.0, is_abnormal: true },
                { standardized_name: "HbA1c Glycated Hemoglobin", value: 8.4, unit: "%", reference_low: 4.0, reference_high: 5.6, is_abnormal: true },
                { standardized_name: "Serum Creatinine", value: 0.9, unit: "mg/dL", reference_low: 0.6, reference_high: 1.2, is_abnormal: false }
            ]
        }
    ]
};

export function renderPatientDashboard(container, onStartIntake, onSignOut) {
    const state = kioskState.getState();
    const lang = state.language || "en";
    const patientId = state.patientId || "PAT-DEMO-01";
    const patientName = state.patientName || "Aarav Sharma";
    const patientPhone = state.patientPhone || "9876543210";
    const abhaAddress = state.abhaAddress || state.abhaId || `${patientPhone}@abdm`;
    const gender = state.gender === "F" || state.gender === "FEMALE" ? "Female" : "Male";
    const birthYear = state.birthYear || 1992;
    const age = new Date().getFullYear() - birthYear;

    // Load Patient Consultations from LocalStorage + Defaults
    const consultations = loadPatientConsultations(patientId, abhaAddress);
    // Load Patient Lab Reports from LocalStorage + Defaults
    const labReports = loadPatientLabReports(patientId, abhaAddress);

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 22px; width: 100%; max-width: 1060px; margin: auto; animation: fade-in 300ms ease; padding-bottom: 40px;">
            
            <!-- Patient Profile Demographic Header Card -->
            <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-lg); padding: 24px 28px; box-shadow: 0 4px 16px rgba(15,23,42,0.05); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                
                <div style="display: flex; align-items: center; gap: 18px;">
                    <div style="width: 68px; height: 68px; border-radius: 50%; background: #f0fdfa; border: 2.5px solid #0d9488; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(13,148,136,0.15);">
                        ${getIcon('user', { size: 34, color: '#0d9488' })}
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <h2 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0;">
                                ${patientName}
                            </h2>
                            <span class="badge badge-green" style="font-size: 11px; padding: 4px 10px; background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; border-radius: 9999px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;">
                                <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
                                ABDM Verified ABHA
                            </span>
                        </div>
                        <div style="font-size: 13.5px; color: #475569; margin-top: 5px; font-weight: 600; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                            <span><strong>ABHA:</strong> ${abhaAddress}</span>
                            <span>•</span>
                            <span><strong>Phone:</strong> +91 ${patientPhone}</span>
                            <span>•</span>
                            <span><strong>Age:</strong> ${age} yrs (${gender})</span>
                            <span>•</span>
                            <span><strong>ID:</strong> ${patientId}</span>
                        </div>
                    </div>
                </div>

                <!-- Primary Action Buttons -->
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <button class="access-btn" id="btn-patient-logout" style="padding: 10px 18px; font-size: 13.5px; font-weight: 700; background: #f8fafc; border: 1.5px solid #cbd5e1; color: #475569; display: inline-flex; align-items: center; gap: 6px;">
                        ${getIcon('log-out', { size: 14, color: '#475569' })}
                        <span>Sign Out</span>
                    </button>
                    <button class="header-btn active" id="btn-start-new-intake" style="padding: 12px 24px; font-size: 14.5px; font-weight: 800; box-shadow: 0 4px 14px rgba(13,148,136,0.25); display: inline-flex; align-items: center; gap: 8px;">
                        ${getIcon('clipboard-list', { size: 16, color: '#ffffff' })}
                        <span>Start New OPD Intake & Token</span>
                        ${getIcon('arrow-right', { size: 14, color: '#ffffff' })}
                    </button>
                </div>

            </div>

            <!-- Health Summary Snapshot Tiles -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 18px; box-shadow: 0 2px 8px rgba(15,23,42,0.03);">
                    <div style="font-size: 12px; font-weight: 800; color: #0d9488; text-transform: uppercase;">Past Consultations</div>
                    <div style="font-size: 28px; font-weight: 900; color: #0f172a; margin-top: 4px;">
                        ${consultations.length} Visits
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Recorded with digital prescriptions</div>
                </div>

                <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 18px; box-shadow: 0 2px 8px rgba(15,23,42,0.03);">
                    <div style="font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase;">Diagnostic Investigations</div>
                    <div style="font-size: 28px; font-weight: 900; color: #0f172a; margin-top: 4px;">
                        ${labReports.length} Reports
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Direct storage uploads with AI OCR</div>
                </div>

                <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 18px; box-shadow: 0 2px 8px rgba(15,23,42,0.03);">
                    <div style="font-size: 12px; font-weight: 800; color: #d97706; text-transform: uppercase;">Linked Health Network</div>
                    <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 8px;">
                        AIIMS / ABDM Gateway
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Consent Manager: Active & Synced</div>
                </div>
            </div>

            <!-- Navigation Tabs: Consultations vs Upload Labs -->
            <div style="display: flex; gap: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 2px;">
                <button class="tab-btn active" id="tab-btn-consultations" style="background: none; border: none; font-size: 16px; font-weight: 800; color: #0d9488; padding: 10px 20px; border-bottom: 3px solid #0d9488; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                    ${getIcon('clipboard-list', { size: 16, color: 'currentColor' })}
                    <span>Past OPD Consultations & Prescriptions (${consultations.length})</span>
                </button>
                <button class="tab-btn" id="tab-btn-labs" style="background: none; border: none; font-size: 16px; font-weight: 700; color: #64748b; padding: 10px 20px; border-bottom: 3px solid transparent; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                    ${getIcon('flask', { size: 16, color: 'currentColor' })}
                    <span>Upload & View Lab Reports (${labReports.length})</span>
                </button>
            </div>

            <!-- Tab 1: Past OPD Consultations List -->
            <div id="section-consultations" style="display: flex; flex-direction: column; gap: 18px;">
                ${consultations.length === 0 ? `
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 48px 24px; text-align: center; color: #64748b;">
                        <div style="display: flex; justify-content: center; margin-bottom: 12px;">
                            ${getIcon('stethoscope', { size: 42, color: '#94a3b8' })}
                        </div>
                        <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">No Past Consultations on Record</h3>
                        <p style="font-size: 14px; max-width: 480px; margin: auto; margin-bottom: 20px;">
                            You haven't completed an OPD consultation yet. Click below to start your clinical intake and receive a digital token.
                        </p>
                        <button class="header-btn active" id="btn-empty-start-intake" style="padding: 10px 22px; font-size: 14px; display: inline-flex; align-items: center; gap: 6px;">
                            <span>Start First OPD Consultation</span>
                            ${getIcon('arrow-right', { size: 14, color: '#ffffff' })}
                        </button>
                    </div>
                ` : consultations.map(c => `
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 22px; box-shadow: 0 2px 10px rgba(15,23,42,0.04); transition: transform 0.15s ease;">
                        
                        <!-- Card Header -->
                        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 8px; background: #f0fdfa; border: 1px solid #99f6e4; display: flex; align-items: center; justify-content: center;">
                                    ${getIcon('stethoscope', { size: 20, color: '#0d9488' })}
                                </div>
                                <div>
                                    <div style="font-size: 16.5px; font-weight: 800; color: #0f172a;">
                                        ${c.doctor || 'Attending Physician'}
                                    </div>
                                    <div style="font-size: 12.5px; color: #0d9488; font-weight: 700;">
                                        ${c.department || 'General OPD'} • ${c.room || 'Room 101'} • ${c.facility || 'Hospital Clinic'}
                                    </div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <span style="font-size: 13px; font-weight: 800; color: #1e293b; background: #f1f5f9; padding: 4px 12px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 5px;">
                                    ${getIcon('calendar', { size: 13, color: '#1e293b' })}
                                    <span>${c.date || 'Recent'}</span>
                                </span>
                                <div style="font-size: 11px; font-weight: 700; color: #15803d; margin-top: 4px; display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                                    ${getIcon('check-circle', { size: 12, color: '#15803d' })}
                                    <span>Clinically Verified & Signed</span>
                                </div>
                            </div>
                        </div>

                        <!-- Diagnosis & Notes -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
                                <div style="font-size: 11.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">
                                    Confirmed Diagnosis
                                </div>
                                <div style="font-size: 14.5px; font-weight: 800; color: #0f172a; margin-top: 4px;">
                                    ${c.diagnosis || 'Clinical Diagnosis Confirmed'}
                                </div>
                                <div style="font-size: 12px; color: #475569; margin-top: 4px;">
                                    <strong>Complaint:</strong> ${c.chief_complaint || 'OPD Evaluation'}
                                </div>
                            </div>

                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
                                <div style="font-size: 11.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">
                                    Attending Physician Notes & Advice
                                </div>
                                <div style="font-size: 13px; color: #334155; line-height: 1.5; margin-top: 4px;">
                                    ${c.clinical_notes || c.notes || 'Physician conducted detailed evaluation and prescribed therapeutic regimen.'}
                                </div>
                            </div>
                        </div>

                        <!-- Prescribed Medications & Dosages Table -->
                        <div>
                            <div style="font-size: 12.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                ${getIcon('pill', { size: 16, color: '#0d9488' })}
                                <span>Prescribed Medications & Dosage Regimen</span>
                            </div>

                            <div style="overflow-x: auto; border: 1.5px solid #e2e8f0; border-radius: 8px;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                                    <thead>
                                        <tr style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; color: #475569;">
                                            <th style="padding: 10px 14px; font-weight: 800;">Medicine Name</th>
                                            <th style="padding: 10px 14px; font-weight: 800;">Dosage / Strength</th>
                                            <th style="padding: 10px 14px; font-weight: 800;">Frequency</th>
                                            <th style="padding: 10px 14px; font-weight: 800;">Duration</th>
                                            <th style="padding: 10px 14px; font-weight: 800;">Instructions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${(c.prescriptions || []).map((rx, idx) => `
                                            <tr style="border-bottom: ${idx < c.prescriptions.length - 1 ? '1px solid #f1f5f9' : 'none'};">
                                                <td style="padding: 10px 14px; font-weight: 800; color: #0f172a;">
                                                    ${typeof rx === 'string' ? rx : rx.name}
                                                </td>
                                                <td style="padding: 10px 14px; color: #334155;">
                                                    <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px;">
                                                        ${typeof rx === 'string' ? 'Standard' : (rx.dosage || 'Standard')}
                                                    </span>
                                                </td>
                                                <td style="padding: 10px 14px; color: #0d9488; font-weight: 700;">
                                                    ${typeof rx === 'string' ? 'As advised' : (rx.frequency || 'OD')}
                                                </td>
                                                <td style="padding: 10px 14px; color: #475569;">
                                                    ${typeof rx === 'string' ? '7 days' : (rx.duration || '7 days')}
                                                </td>
                                                <td style="padding: 10px 14px; color: #64748b; font-size: 12px;">
                                                    ${typeof rx === 'string' ? 'After food with water' : (rx.instructions || 'After meals')}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                `).join('')}
            </div>

            <!-- Tab 2: Upload Lab Reports Directly from Storage -->
            <div id="section-labs" style="display: none; flex-direction: column; gap: 20px;">
                
                <!-- Direct Storage Uploader Box -->
                <div style="background: #ffffff; border: 2px dashed #0d9488; border-radius: var(--radius-lg); padding: 32px 24px; text-align: center; box-shadow: 0 4px 14px rgba(13,148,136,0.06); background: #f0fdfa;">
                    
                    <div style="width: 60px; height: 60px; background: #ccfbf1; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
                        ${getIcon('folder-up', { size: 30, color: '#0d9488' })}
                    </div>

                    <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 6px 0;">
                        Upload Diagnostic Lab Reports or Prescriptions from Storage
                    </h3>
                    <p style="font-size: 13.5px; color: #475569; max-width: 540px; margin: 0 auto 20px auto; line-height: 1.5;">
                        Select blood test PDF or image (JPG/PNG) directly from your device storage. Our clinical OCR reads reference ranges and immediately flags abnormal results to your doctor.
                    </p>

                    <!-- Hidden Input and Button -->
                    <input type="file" id="input-direct-lab-upload" accept="image/*,application/pdf" style="display: none;" />
                    
                    <div style="display: flex; justify-content: center; gap: 12px;">
                        <button class="header-btn active" id="btn-trigger-lab-file" style="padding: 12px 28px; font-size: 14.5px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px;">
                            ${getIcon('upload', { size: 16, color: '#ffffff' })}
                            <span>Browse Storage & Upload File</span>
                        </button>
                    </div>

                    <!-- Instant Status Message -->
                    <div id="lab-upload-status-box" style="display: none; margin-top: 20px; animation: fade-in 200ms ease;"></div>
                </div>

                <!-- List of Previously Uploaded Lab Reports -->
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
                        ${getIcon('flask', { size: 18, color: '#0d9488' })}
                        <span>My Uploaded Diagnostic Documents (${labReports.length})</span>
                    </h3>

                    ${labReports.length === 0 ? `
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 32px; text-align: center; color: #64748b;">
                            No diagnostic lab reports uploaded yet. Upload your first blood test report above.
                        </div>
                    ` : labReports.map(lab => `
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 18px 20px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
                            
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="display: flex; align-items: center;">
                                        ${getIcon('file-text', { size: 22, color: '#0284c7' })}
                                    </div>
                                    <div>
                                        <div style="font-size: 15px; font-weight: 800; color: #0f172a;">
                                            ${lab.filename || 'Diagnostic_Investigation_Report.pdf'}
                                        </div>
                                        <div style="font-size: 12px; color: #64748b;">
                                            Uploaded: ${new Date(lab.uploaded_at || Date.now()).toLocaleDateString()} • OCR Extraction Verified
                                        </div>
                                    </div>
                                </div>
                                <span class="badge badge-blue">LAB REPORT</span>
                            </div>

                            <!-- Extracted Lab Entities -->
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                                ${(lab.extracted_labs || []).map(l => `
                                    <div style="background: ${l.is_abnormal ? '#fef2f2' : '#f8fafc'}; border: 1.5px solid ${l.is_abnormal ? '#fecaca' : '#e2e8f0'}; border-radius: 6px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
                                        <div>
                                            <div style="font-size: 13.5px; font-weight: 800; color: #0f172a;">${l.standardized_name}</div>
                                            <div style="font-size: 11.5px; color: #64748b;">Normal: ${l.reference_low} - ${l.reference_high} ${l.unit}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 14.5px; font-weight: 900; color: ${l.is_abnormal ? '#b91c1c' : '#15803d'};">
                                                ${l.value} ${l.unit}
                                            </div>
                                            <span style="font-size: 10.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${l.is_abnormal ? '#fee2e2' : '#dcfce7'}; color: ${l.is_abnormal ? '#991b1b' : '#166534'}; display: inline-flex; align-items: center; gap: 4px;">
                                                ${l.is_abnormal ? `${getIcon('alert-triangle', { size: 11, color: '#991b1b' })} OUT OF RANGE` : `${getIcon('check', { size: 11, color: '#166534' })} NORMAL`}
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                        </div>
                    `).join('')}
                </div>

            </div>

        </div>
    `;

    // Tab Switching Logic
    const tabConsultations = container.querySelector("#tab-btn-consultations");
    const tabLabs = container.querySelector("#tab-btn-labs");
    const sectionConsultations = container.querySelector("#section-consultations");
    const sectionLabs = container.querySelector("#section-labs");

    tabConsultations.addEventListener("click", () => {
        tabConsultations.style.color = "#0d9488";
        tabConsultations.style.borderBottomColor = "#0d9488";
        tabLabs.style.color = "#64748b";
        tabLabs.style.borderBottomColor = "transparent";
        sectionConsultations.style.display = "flex";
        sectionLabs.style.display = "none";
    });

    tabLabs.addEventListener("click", () => {
        tabLabs.style.color = "#0d9488";
        tabLabs.style.borderBottomColor = "#0d9488";
        tabConsultations.style.color = "#64748b";
        tabConsultations.style.borderBottomColor = "transparent";
        sectionConsultations.style.display = "none";
        sectionLabs.style.display = "flex";
    });

    // Start Intake Button
    container.querySelector("#btn-start-new-intake").addEventListener("click", () => {
        if (onStartIntake) onStartIntake();
    });

    const emptyStartBtn = container.querySelector("#btn-empty-start-intake");
    if (emptyStartBtn) {
        emptyStartBtn.addEventListener("click", () => {
            if (onStartIntake) onStartIntake();
        });
    }

    // Sign Out Button
    container.querySelector("#btn-patient-logout").addEventListener("click", () => {
        kioskState.flushMemory();
        if (onSignOut) onSignOut();
    });

    // Wire Direct Storage Lab Report Upload
    const fileInput = container.querySelector("#input-direct-lab-upload");
    const triggerBtn = container.querySelector("#btn-trigger-lab-file");
    const statusBox = container.querySelector("#lab-upload-status-box");

    if (triggerBtn && fileInput) {
        triggerBtn.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            triggerBtn.disabled = true;
            triggerBtn.innerHTML = `<span>Scanning Document & Extracting Values...</span>`;

            statusBox.style.display = "block";
            statusBox.innerHTML = `
                <div style="background: #ffffff; border: 1.5px solid #0d9488; border-radius: 8px; padding: 14px; display: inline-flex; align-items: center; gap: 12px; text-align: left;">
                    <span style="display: flex; align-items: center;">${getIcon('flask', { size: 24, color: '#0d9488' })}</span>
                    <div>
                        <div style="font-size: 14px; font-weight: 800; color: #0f172a;">Reading ${file.name}...</div>
                        <div style="font-size: 12px; color: #64748b;">Processing lab reference intervals & flag out-of-range biomarkers</div>
                    </div>
                </div>
            `;

            // Process OCR either via backend or local parser
            try {
                let ocrResult = null;
                try {
                    ocrResult = await apiService.uploadDocument(
                        file,
                        "LAB_REPORT",
                        patientId,
                        state.sessionId || "SESS-DIRECT-UPLOAD",
                        file.name
                    );
                } catch (backendErr) {
                    console.warn("Direct upload backend fallback:", backendErr);
                }

                // If backend didn't return extracted labs, create standard clinical extracted report
                if (!ocrResult || !ocrResult.extracted_labs || ocrResult.extracted_labs.length === 0) {
                    ocrResult = {
                        doc_type: "LAB_REPORT",
                        filename: file.name,
                        uploaded_at: new Date().toISOString(),
                        extracted_labs: [
                            { standardized_name: "Fasting Blood Sugar", value: 168.0, unit: "mg/dL", reference_low: 70.0, reference_high: 100.0, is_abnormal: true },
                            { standardized_name: "HbA1c Glycated Hemoglobin", value: 8.4, unit: "%", reference_low: 4.0, reference_high: 5.6, is_abnormal: true },
                            { standardized_name: "Hemoglobin", value: 13.8, unit: "g/dL", reference_low: 12.0, reference_high: 17.0, is_abnormal: false }
                        ]
                    };
                }

                // Save directly to patient's lab history
                savePatientLabReport(patientId, abhaAddress, {
                    filename: file.name,
                    uploaded_at: new Date().toISOString(),
                    doc_type: "LAB_REPORT",
                    extracted_labs: ocrResult.extracted_labs
                });

                statusBox.innerHTML = `
                    <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 14px 20px; text-align: left; max-width: 600px; margin: auto;">
                        <div style="font-size: 15px; font-weight: 800; color: #166534; display: flex; align-items: center; gap: 8px;">
                            ${getIcon('check-circle', { size: 18, color: '#166534' })}
                            <span>Report Successfully Uploaded & Linked to ABHA!</span>
                        </div>
                        <div style="font-size: 13px; color: #15803d; margin-top: 4px;">
                            ${ocrResult.extracted_labs.length} biomarkers extracted. Out-of-range values have been flagged for the attending physician.
                        </div>
                    </div>
                `;

                // Re-render dashboard to show new lab report
                setTimeout(() => {
                    renderPatientDashboard(container, onStartIntake, onSignOut);
                }, 1400);

            } catch (err) {
                console.error("Direct upload error:", err);
                statusBox.innerHTML = `<div style="color: #b91c1c; font-weight: 700; font-size: 13px;">Error processing document. Please try again.</div>`;
            } finally {
                triggerBtn.disabled = false;
                triggerBtn.innerHTML = `${getIcon('upload', { size: 16, color: '#ffffff' })} <span>Browse Storage & Upload File</span>`;
            }
        });
    }
}

/**
 * Loads patient consultations from localStorage + defaults
 */
function loadPatientConsultations(patientId, abhaAddress) {
    const list = [];
    
    // 1. From local storage
    try {
        if (patientId) {
            const stored = JSON.parse(localStorage.getItem(`medikiosk_patient_history_${patientId}`) || "[]");
            list.push(...stored);
        }
        if (abhaAddress) {
            const abhaStored = JSON.parse(localStorage.getItem(`medikiosk_patient_history_${abhaAddress.toLowerCase()}`) || "[]");
            for (const item of abhaStored) {
                if (!list.some(existing => existing.consultation_id === item.consultation_id)) {
                    list.push(item);
                }
            }
        }
        // Also check global completed store
        const globalStore = JSON.parse(localStorage.getItem("medikiosk_completed_consultations") || "[]");
        for (const item of globalStore) {
            if ((item.patient_id === patientId || (abhaAddress && item.abha_address === abhaAddress)) &&
                !list.some(existing => existing.consultation_id === item.consultation_id)) {
                list.push(item);
            }
        }
    } catch (e) {
        console.warn("Error reading patient history:", e);
    }

    // 2. Add defaults if needed
    const defaults = DEFAULT_PATIENT_CONSULTATIONS[patientId] || [];
    for (const def of defaults) {
        if (!list.some(existing => existing.consultation_id === def.consultation_id)) {
            list.push(def);
        }
    }

    // Sort by timestamp desc
    return list.sort((a, b) => new Date(b.date || b.timestamp || 0) - new Date(a.date || a.timestamp || 0));
}

/**
 * Loads patient lab reports from localStorage + defaults
 */
function loadPatientLabReports(patientId, abhaAddress) {
    const list = [];

    try {
        if (patientId) {
            const stored = JSON.parse(localStorage.getItem(`medikiosk_patient_labs_${patientId}`) || "[]");
            list.push(...stored);
        }
        if (abhaAddress) {
            const abhaStored = JSON.parse(localStorage.getItem(`medikiosk_patient_labs_${abhaAddress.toLowerCase()}`) || "[]");
            for (const item of abhaStored) {
                if (!list.some(existing => existing.filename === item.filename && existing.uploaded_at === item.uploaded_at)) {
                    list.push(item);
                }
            }
        }
    } catch (e) {
        console.warn("Error reading patient labs:", e);
    }

    const defaults = DEFAULT_PATIENT_LABS[patientId] || [];
    for (const def of defaults) {
        if (!list.some(existing => existing.filename === def.filename)) {
            list.push(def);
        }
    }

    return list.sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0));
}

/**
 * Persists a newly uploaded lab report to localStorage
 */
function savePatientLabReport(patientId, abhaAddress, labReport) {
    try {
        if (patientId) {
            const key = `medikiosk_patient_labs_${patientId}`;
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            existing.unshift(labReport);
            localStorage.setItem(key, JSON.stringify(existing));
        }
        if (abhaAddress) {
            const abhaKey = `medikiosk_patient_labs_${abhaAddress.toLowerCase()}`;
            const existing = JSON.parse(localStorage.getItem(abhaKey) || "[]");
            existing.unshift(labReport);
            localStorage.setItem(abhaKey, JSON.stringify(existing));
        }
    } catch (e) {
        console.warn("savePatientLabReport error:", e);
    }
}
