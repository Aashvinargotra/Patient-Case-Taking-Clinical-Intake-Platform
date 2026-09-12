/**
 * MediKiosk ABHA ID Login & Registration Modal Component
 * Supports ABDM 14-digit ABHA Number, @abdm address, OTP Verification, and Instant Registration.
 */
import { kioskState } from "../state.js";
import { apiService } from "../api_service.js";

export function renderAbhaAuthModal(container, onSuccess, onCancel) {
    const modalEl = document.createElement("div");
    modalEl.className = "modal-overlay";
    modalEl.id = "abha-modal";

    modalEl.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-header">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 28px;">🪪</span>
                    <div>
                        <h3 style="font-size: var(--font-size-lg); font-weight: 800; color: #0f172a; margin: 0;">ABDM Ayushman Bharat Digital Mission</h3>
                        <p style="font-size: 13px; color: #64748b; margin: 0;">ABHA ID Authentication & Instant Registration Gateway</p>
                    </div>
                </div>
                <button id="btn-close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b; padding: 4px 8px;">✕</button>
            </div>

            <div class="modal-body">
                <!-- Tabs -->
                <div class="tab-nav">
                    <button class="tab-btn active" id="tab-login">Login with ABHA</button>
                    <button class="tab-btn" id="tab-register">Register New ABHA</button>
                    <button class="tab-btn" id="tab-scan">Scan ABHA Card</button>
                </div>

                <!-- 1. ABHA Login Pane -->
                <div id="pane-login" style="display: block;">
                    <div id="step-abha-input">
                        <label style="display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px;">
                            Enter 14-Digit ABHA Number or ABHA Address
                        </label>
                        <input type="text" id="input-abha-id" placeholder="e.g. 14-8912-4521-7789 or aarav.sharma@abdm" 
                               value="aarav.sharma@abdm"
                               style="width: 100%; height: 50px; border-radius: 8px; border: 1.5px solid #cbd5e1; font-size: 16px; padding: 0 16px; margin-bottom: 12px; font-family: inherit;" />
                        
                        <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                            <button type="button" class="touch-chip" style="font-size: 12px; padding: 6px 12px; min-height: 32px;" id="btn-quick-demo-1">
                                Demo: aarav.sharma@abdm
                            </button>
                            <button type="button" class="touch-chip" style="font-size: 12px; padding: 6px 12px; min-height: 32px;" id="btn-quick-demo-2">
                                Demo: ramesh.kumar@abdm
                            </button>
                        </div>

                        <button id="btn-send-otp" class="header-btn active" style="width: 100%; height: 50px; justify-content: center; font-size: 16px;">
                            Send ABDM Mobile OTP ➔
                        </button>
                    </div>

                    <!-- OTP Input Box (Hidden initially) -->
                    <div id="step-otp-verify" style="display: none; animation: fade-in 200ms ease;">
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">📩</span>
                            <span style="font-size: 14px; color: #166534; font-weight: 600;" id="otp-status-msg">
                                OTP sent to mobile ending with **78 (Demo OTP: 123456)
                            </span>
                        </div>

                        <label style="display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px;">
                            Enter 6-Digit Verification Code
                        </label>
                        <input type="text" id="input-otp" placeholder="123456" maxlength="6" value="123456"
                               style="width: 100%; height: 50px; border-radius: 8px; border: 2px solid #0d9488; font-size: 22px; letter-spacing: 8px; text-align: center; font-weight: 800; margin-bottom: 16px;" />

                        <button id="btn-verify-otp" class="header-btn active" style="width: 100%; height: 50px; justify-content: center; font-size: 16px;">
                            Verify & Proceed to Intake ➔
                        </button>
                    </div>
                </div>

                <!-- 2. ABHA Registration Pane -->
                <div id="pane-register" style="display: none;">
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Full Name (As per Aadhaar)</label>
                            <input type="text" id="reg-name" placeholder="e.g. Priya Sharma" value="Priya Sharma"
                                   style="width: 100%; height: 44px; border-radius: 8px; border: 1.5px solid #cbd5e1; padding: 0 14px; font-size: 15px;" />
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Gender</label>
                                <select id="reg-gender" style="width: 100%; height: 44px; border-radius: 8px; border: 1.5px solid #cbd5e1; padding: 0 10px; font-size: 15px; background: #fff;">
                                    <option value="FEMALE">Female</option>
                                    <option value="MALE">Male</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Birth Year</label>
                                <input type="number" id="reg-birth-year" placeholder="1995" value="1995"
                                       style="width: 100%; height: 44px; border-radius: 8px; border: 1.5px solid #cbd5e1; padding: 0 14px; font-size: 15px;" />
                            </div>
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Mobile Number</label>
                            <input type="tel" id="reg-mobile" placeholder="9876543210" maxlength="10" value="9876543210"
                                   style="width: 100%; height: 44px; border-radius: 8px; border: 1.5px solid #cbd5e1; padding: 0 14px; font-size: 15px;" />
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Desired ABHA Address</label>
                            <input type="text" id="reg-abha-addr" placeholder="priya.sharma95@abdm" value="priya.sharma95@abdm"
                                   style="width: 100%; height: 44px; border-radius: 8px; border: 1.5px solid #cbd5e1; padding: 0 14px; font-size: 15px;" />
                        </div>
                        <button id="btn-submit-register" class="header-btn active" style="width: 100%; height: 48px; justify-content: center; font-size: 15px; margin-top: 8px;">
                            Create ABHA & Start Consultation ➔
                        </button>
                    </div>
                </div>

                <!-- 3. ABHA QR Scanner Pane -->
                <div id="pane-scan" style="display: none; text-align: center; padding: 12px 0;">
                    <div style="width: 200px; height: 200px; border: 3px dashed #0d9488; border-radius: 16px; margin: 0 auto 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f0fdfa; position: relative;">
                        <span style="font-size: 64px;">📷</span>
                        <div style="position: absolute; width: 100%; height: 2px; background: #ef4444; top: 50%; animation: scan-line 2s infinite ease-in-out;"></div>
                    </div>
                    <p style="font-size: 14px; color: #475569; margin-bottom: 16px;">
                        Align physical ABHA Card QR code in front of the kiosk optical scanner
                    </p>
                    <button id="btn-simulate-qr" class="header-btn active" style="width: 100%; height: 48px; justify-content: center; font-size: 15px;">
                        ⚡ Simulate ABHA QR Scan ➔
                    </button>
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(modalEl);

    // Tab Switching Logic
    const tabLogin = modalEl.querySelector("#tab-login");
    const tabRegister = modalEl.querySelector("#tab-register");
    const tabScan = modalEl.querySelector("#tab-scan");
    const paneLogin = modalEl.querySelector("#pane-login");
    const paneRegister = modalEl.querySelector("#pane-register");
    const paneScan = modalEl.querySelector("#pane-scan");

    function setActiveTab(activeBtn, activePane) {
        [tabLogin, tabRegister, tabScan].forEach(b => b.classList.remove("active"));
        [paneLogin, paneRegister, paneScan].forEach(p => p.style.display = "none");
        activeBtn.classList.add("active");
        activePane.style.display = "block";
    }

    tabLogin.addEventListener("click", () => setActiveTab(tabLogin, paneLogin));
    tabRegister.addEventListener("click", () => setActiveTab(tabRegister, paneRegister));
    tabScan.addEventListener("click", () => setActiveTab(tabScan, paneScan));

    // Demo quick prefill
    const inputAbhaId = modalEl.querySelector("#input-abha-id");
    modalEl.querySelector("#btn-quick-demo-1").addEventListener("click", () => {
        inputAbhaId.value = "aarav.sharma@abdm";
    });
    modalEl.querySelector("#btn-quick-demo-2").addEventListener("click", () => {
        inputAbhaId.value = "ramesh.kumar@abdm";
    });

    // Close Modal
    modalEl.querySelector("#btn-close-modal").addEventListener("click", () => {
        modalEl.remove();
        if (onCancel) onCancel();
    });

    // Send OTP
    let currentTxnId = "ABDM-TXN-1001";
    const btnSendOtp = modalEl.querySelector("#btn-send-otp");
    const stepAbhaInput = modalEl.querySelector("#step-abha-input");
    const stepOtpVerify = modalEl.querySelector("#step-otp-verify");

    btnSendOtp.addEventListener("click", async () => {
        const val = inputAbhaId.value.trim();
        if (!val) {
            alert("Please enter ABHA ID or Address");
            return;
        }
        btnSendOtp.disabled = true;
        btnSendOtp.textContent = "Requesting ABDM OTP...";
        try {
            const res = await apiService.requestAbhaOtp(val);
            currentTxnId = res.txn_id || currentTxnId;
            stepAbhaInput.style.display = "none";
            stepOtpVerify.style.display = "block";
        } catch (err) {
            // Fallback for offline demo
            stepAbhaInput.style.display = "none";
            stepOtpVerify.style.display = "block";
        }
    });

    // Verify OTP
    const btnVerifyOtp = modalEl.querySelector("#btn-verify-otp");
    const inputOtp = modalEl.querySelector("#input-otp");

    btnVerifyOtp.addEventListener("click", async () => {
        const otpVal = inputOtp.value.trim();
        const abhaVal = inputAbhaId.value.trim();
        btnVerifyOtp.disabled = true;
        btnVerifyOtp.textContent = "Verifying...";
        try {
            const res = await apiService.verifyAbhaOtp(currentTxnId, otpVal, abhaVal);
            if (res && res.patient) {
                kioskState.setState({
                    patientId: res.patient.patient_id,
                    patientName: res.patient.full_name,
                    abhaAddress: res.patient.abha_address,
                    gender: res.patient.gender || "M",
                    birthYear: res.patient.birth_year || 1992,
                    patientPhone: res.patient.phone || "9876543210",
                    isTemporary: false,
                    token: res.access_token
                });
                modalEl.remove();
                if (onSuccess) onSuccess(res.patient);
            }
        } catch (err) {
            // Offline fallback
            const isPriya = abhaVal.toLowerCase().includes("priya");
            const isRamesh = abhaVal.toLowerCase().includes("ramesh");
            const fallbackPatient = isPriya ? {
                patient_id: "PAT-PRIYA-02",
                full_name: "Priya Sharma",
                gender: "FEMALE",
                birth_year: 1995,
                phone: "9811223344",
                abha_address: abhaVal || "priya.sharma@abdm"
            } : (isRamesh ? {
                patient_id: "PAT-DEL-8912",
                full_name: "Ramesh Kumar",
                gender: "MALE",
                birth_year: 1982,
                phone: "9876543210",
                abha_address: abhaVal || "ramesh.kumar@abdm"
            } : {
                patient_id: "PAT-DEMO-01",
                full_name: "Aarav Sharma",
                gender: "MALE",
                birth_year: 1994,
                phone: "9123456780",
                abha_address: abhaVal || "aarav.sharma@abdm"
            });
            kioskState.setState({
                patientId: fallbackPatient.patient_id,
                patientName: fallbackPatient.full_name,
                abhaAddress: fallbackPatient.abha_address,
                gender: fallbackPatient.gender,
                birthYear: fallbackPatient.birth_year,
                patientPhone: fallbackPatient.phone,
                isTemporary: false
            });
            modalEl.remove();
            if (onSuccess) onSuccess(fallbackPatient);
        }
    });

    // Register New ABHA
    modalEl.querySelector("#btn-submit-register").addEventListener("click", async () => {
        const name = modalEl.querySelector("#reg-name").value.trim();
        const gender = modalEl.querySelector("#reg-gender").value;
        const birthYear = parseInt(modalEl.querySelector("#reg-birth-year").value) || 1995;
        const mobile = modalEl.querySelector("#reg-mobile").value.trim();
        const desiredAbha = modalEl.querySelector("#reg-abha-addr").value.trim();

        if (!name) {
            alert("Please enter patient name");
            return;
        }

        try {
            const res = await apiService.registerNewAbha({
                full_name: name,
                gender,
                birth_year: birthYear,
                mobile,
                desired_abha: desiredAbha
            });
            kioskState.setState({
                patientId: res.patient_id,
                patientName: res.full_name,
                abhaAddress: res.abha_address,
                gender,
                birthYear,
                patientPhone: mobile,
                isTemporary: false,
                token: res.access_token
            });
            modalEl.remove();
            if (onSuccess) onSuccess({ patient_id: res.patient_id, full_name: res.full_name, abha_address: res.abha_address });
        } catch (err) {
            const fallbackPatient = {
                patient_id: `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
                full_name: name,
                gender,
                birth_year: birthYear,
                phone: mobile,
                abha_address: desiredAbha
            };
            kioskState.setState({
                patientId: fallbackPatient.patient_id,
                patientName: fallbackPatient.full_name,
                abhaAddress: fallbackPatient.abha_address,
                gender,
                birthYear,
                patientPhone: mobile,
                isTemporary: false
            });
            modalEl.remove();
            if (onSuccess) onSuccess(fallbackPatient);
        }
    });

    // QR Scan Simulation
    modalEl.querySelector("#btn-simulate-qr").addEventListener("click", () => {
        const qrPatient = {
            patient_id: "PAT-DEMO-01",
            full_name: "Aarav Sharma",
            gender: "MALE",
            birth_year: 1994,
            phone: "9123456780",
            abha_address: "aarav.sharma@abdm"
        };
        kioskState.setState({
            patientId: qrPatient.patient_id,
            patientName: qrPatient.full_name,
            abhaAddress: qrPatient.abha_address,
            gender: qrPatient.gender,
            birthYear: qrPatient.birth_year,
            patientPhone: qrPatient.phone,
            isTemporary: false
        });
        modalEl.remove();
        if (onSuccess) onSuccess(qrPatient);
    });
}
