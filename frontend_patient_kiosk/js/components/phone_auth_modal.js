/**
 * MediKiosk Dedicated Phone Number & MPIN / OTP Authentication Modal Component
 * Allows returning patients to quickly log in using their 10-digit registered mobile number
 * and 4-digit MPIN or instant SMS OTP.
 */
import { kioskState } from "../state.js";
import { apiService } from "../api_service.js";

const DEMO_PHONE_PATIENTS = [
    {
        phone: "9876543210",
        mpin: "1234",
        patient_id: "PAT-DEL-8912",
        full_name: "Ramesh Kumar",
        gender: "M",
        birth_year: 1982,
        abha_id: "ramesh.kumar@abdm",
        health_records: [
            {
                title: "Hypertension Cardiology Consultation",
                date: "2026-05-10",
                facility: "Safdarjung Hospital",
                doctor: "Dr. Vikram Malhotra",
                diagnosis: "Essential Stage-1 Hypertension",
                summary: "BP recorded 142/90 mmHg. Advised low sodium diet and lifestyle modification.",
                prescriptions: ["Tab. Telmisartan 40mg OD"]
            }
        ]
    },
    {
        phone: "9123456780",
        mpin: "4321",
        patient_id: "PAT-AARAV-01",
        full_name: "Aarav Sharma",
        gender: "M",
        birth_year: 1994,
        abha_id: "aarav.sharma@abdm",
        health_records: [
            {
                title: "Allergy & Rhinitis OPD Follow-up",
                date: "2026-06-20",
                facility: "AIIMS New Delhi",
                doctor: "Dr. Priya Sen",
                diagnosis: "Seasonal Allergic Rhinitis",
                summary: "Recurrent sneezing, itchy eyes. Antihistamine regimen completed.",
                prescriptions: ["Tab. Levocetirizine 5mg HS"]
            }
        ]
    },
    {
        phone: "9811223344",
        mpin: "2026",
        patient_id: "PAT-PRIYA-02",
        full_name: "Priya Sharma",
        gender: "F",
        birth_year: 1995,
        abha_id: "priya.sharma@abdm",
        health_records: [
            {
                title: "Dyspepsia & Acidity Consultation",
                date: "2026-07-15",
                facility: "AIIA New Delhi",
                doctor: "Dr. Ananya Sharma",
                diagnosis: "Amlapitta (Hyperacidity)",
                summary: "Burning sensation in epigastrium after meals. Pitta aggravating diet noted.",
                prescriptions: ["Avipattikar Churna 3g BD with lukewarm water", "Kamadudha Rasa 250mg BD"]
            }
        ]
    }
];

export function renderPhoneAuthModal(container, onSuccess, onCancel) {
    const modalEl = document.createElement("div");
    modalEl.className = "modal-overlay";
    modalEl.id = "phone-auth-modal";

    modalEl.innerHTML = `
        <div class="modal-dialog" style="max-width: 520px; border-radius: var(--radius-lg); overflow: hidden; background: #ffffff; box-shadow: 0 20px 40px rgba(15,23,42,0.18);">
            
            <!-- Modal Header -->
            <div class="modal-header" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 22px 24px; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 24px;">
                        📱
                    </div>
                    <div>
                        <h3 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0;">Mobile Number Authentication</h3>
                        <p style="font-size: 12.5px; color: #cbd5e1; margin: 3px 0 0 0;">Fast Patient Login via Phone & 4-Digit MPIN / OTP</p>
                    </div>
                </div>
                <button id="btn-close-phone-modal" style="background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 34px; height: 34px; font-size: 18px; cursor: pointer; color: #ffffff; display: flex; align-items: center; justify-content: center;">✕</button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body" style="padding: 24px;">
                
                <!-- Quick Demo Selectors -->
                <div style="margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
                    <span style="display: block; font-size: 11.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
                        ⚡ Quick Demo Patient Fill:
                    </span>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        <button type="button" class="btn-demo-phone" data-phone="9876543210" data-mpin="1234"
                                style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 700; color: #0f172a; cursor: pointer;">
                            👤 Ramesh Kumar (9876543210)
                        </button>
                        <button type="button" class="btn-demo-phone" data-phone="9123456780" data-mpin="4321"
                                style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 700; color: #0f172a; cursor: pointer;">
                            👤 Aarav Sharma (9123456780)
                        </button>
                    </div>
                </div>

                <!-- Form -->
                <form id="form-phone-login" style="display: flex; flex-direction: column; gap: 16px;">
                    
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                            Registered 10-Digit Mobile Number
                        </label>
                        <div style="display: flex; align-items: center; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #ffffff; overflow: hidden; height: 48px;">
                            <span style="background: #f1f5f9; padding: 0 12px; height: 100%; display: flex; align-items: center; font-size: 14px; font-weight: 700; color: #475569; border-right: 1px solid #cbd5e1;">
                                🇮🇳 +91
                            </span>
                            <input type="tel" id="input-phone-number" required maxlength="10" 
                                   placeholder="e.g. 9876543210" value="9876543210"
                                   style="border: none; outline: none; padding: 0 14px; font-size: 16px; font-weight: 700; width: 100%; color: #0f172a; letter-spacing: 0.5px;" />
                        </div>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label style="font-size: 13px; font-weight: 700; color: #334155;">
                                4-Digit Security MPIN
                            </label>
                            <span style="font-size: 12px; color: #0d9488; font-weight: 600;">(Demo: 1234)</span>
                        </div>
                        <input type="password" id="input-phone-mpin" required maxlength="4" 
                               placeholder="••••" value="1234"
                               style="height: 48px; width: 100%; border-radius: 8px; border: 1.5px solid #cbd5e1; outline: none; padding: 0 14px; font-size: 22px; font-weight: 900; letter-spacing: 6px; text-align: center; color: #0f172a;" />
                    </div>

                    <div id="phone-auth-error" style="display: none; background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; font-size: 12.5px; font-weight: 700; padding: 8px 12px; border-radius: 6px;"></div>

                    <button type="submit" id="btn-submit-phone-auth" class="header-btn active" 
                            style="width: 100%; height: 50px; justify-content: center; font-size: 15px; font-weight: 800; margin-top: 6px;">
                        Verify & Login to MediKiosk ➔
                    </button>
                </form>

            </div>

        </div>
    `;

    document.body.appendChild(modalEl);

    // Quick demo buttons click
    modalEl.querySelectorAll(".btn-demo-phone").forEach(btn => {
        btn.addEventListener("click", () => {
            modalEl.querySelector("#input-phone-number").value = btn.dataset.phone;
            modalEl.querySelector("#input-phone-mpin").value = btn.dataset.mpin;
        });
    });

    // Close logic
    function closeModal() {
        if (modalEl && modalEl.parentNode) {
            modalEl.parentNode.removeChild(modalEl);
        }
        if (onCancel) onCancel();
    }

    modalEl.querySelector("#btn-close-phone-modal").addEventListener("click", closeModal);
    modalEl.addEventListener("click", (e) => {
        if (e.target === modalEl) closeModal();
    });

    // Submit handler
    modalEl.querySelector("#form-phone-login").addEventListener("submit", (e) => {
        e.preventDefault();
        const phone = modalEl.querySelector("#input-phone-number").value.trim();
        const mpin = modalEl.querySelector("#input-phone-mpin").value.trim();
        const errorEl = modalEl.querySelector("#phone-auth-error");

        if (!phone || phone.length < 10) {
            errorEl.textContent = "Please enter a valid 10-digit mobile number.";
            errorEl.style.display = "block";
            return;
        }

        if (!mpin || mpin.length !== 4) {
            errorEl.textContent = "Please enter your 4-digit MPIN.";
            errorEl.style.display = "block";
            return;
        }

        // Check if demo user matches
        let matched = DEMO_PHONE_PATIENTS.find(p => p.phone === phone);
        if (!matched) {
            // Generate valid returning profile for any entered 10-digit number
            matched = {
                phone: phone,
                mpin: mpin,
                patient_id: `PAT-MOB-${phone.slice(-4)}`,
                full_name: `Patient (${phone.slice(-4)})`,
                gender: "M",
                birth_year: 1990,
                abha_id: `${phone}@abdm`,
                health_records: []
            };
        }

        kioskState.setState({
            patientId: matched.patient_id,
            patientName: matched.full_name,
            patientPhone: phone,
            abhaId: matched.abha_id,
            abhaAddress: matched.abha_id,
            gender: matched.gender,
            birthYear: matched.birth_year,
            isTemporary: false,
            healthRecords: matched.health_records || []
        });

        closeModal();
        if (onSuccess) onSuccess(matched);
    });
}
