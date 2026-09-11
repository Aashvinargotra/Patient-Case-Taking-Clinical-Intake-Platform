/**
 * MediKiosk Secure Physician Authentication Gateway
 * Requires Doctor ID / Medical Registration Number and Password verification.
 */
import { portalState } from "../state.js";
import { portalApi } from "../api.js";

export function renderDoctorLogin(container, onLoginSuccess) {
    container.innerHTML = `
        <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fade-in 250ms ease;">
            <div style="width: 100%; max-width: 480px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-lg); box-shadow: 0 10px 30px rgba(15,23,42,0.08); overflow: hidden;">
                
                <!-- Clinical Header Banner -->
                <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 32px 28px; color: #ffffff; text-align: center;">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 14px auto;">
                        🩺
                    </div>
                    <h2 style="font-size: 22px; font-weight: 800; margin: 0; color: #ffffff;">Physician Clinical Console</h2>
                    <p style="margin: 6px 0 0 0; font-size: 13.5px; opacity: 0.95;">All India Institute of Ayurveda & Associated Hospitals</p>
                </div>

                <!-- Secure Authentication Form -->
                <div style="padding: 32px 28px;">
                    
                    <form id="form-doc-login" style="display: flex; flex-direction: column; gap: 18px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                                Doctor ID / Medical Registration Number
                            </label>
                            <input type="text" id="input-doc-id" required 
                                   placeholder="e.g. DOC-AYUSH-01 or MCI-48912-DL"
                                   value="DOC-AYUSH-01"
                                   style="width: 100%; background: #f8fafc; border: 1.5px solid #cbd5e1; color: #0f172a; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; outline: none;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                                Password
                            </label>
                            <input type="password" id="input-doc-pass" required 
                                   placeholder="Enter your clinical password"
                                   value="DoctorPass2026!"
                                   style="width: 100%; background: #f8fafc; border: 1.5px solid #cbd5e1; color: #0f172a; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; outline: none;">
                        </div>

                        <div id="login-error-msg" style="display: none; background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 6px;"></div>

                        <button type="submit" id="btn-submit-doc-login" class="btn btn-primary"
                                style="padding: 14px 20px; font-size: 15px; font-weight: 800; margin-top: 6px;">
                            <span>Sign In to Clinical Console ➔</span>
                        </button>
                    </form>

                    <!-- Credentials Reference Note -->
                    <div style="margin-top: 24px; padding: 12px 16px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: var(--radius-sm); font-size: 12px; color: #0f766e; line-height: 1.5;">
                        <strong>🔑 Authorized Doctor Logins:</strong><br>
                        • <strong>Dr. Ananya Sharma:</strong> <code>DOC-AYUSH-01</code> (Kayachikitsa OPD)<br>
                        • <strong>Dr. Vikram Malhotra:</strong> <code>DOC-CARDIO-01</code> (Cardiology OPD)<br>
                        • <em>Password:</em> <code>DoctorPass2026!</code>
                    </div>

                </div>

            </div>
        </div>
    `;

    container.querySelector("#form-doc-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const docId = container.querySelector("#input-doc-id").value.trim();
        const password = container.querySelector("#input-doc-pass").value;
        const submitBtn = container.querySelector("#btn-submit-doc-login");
        const errorMsg = container.querySelector("#login-error-msg");

        submitBtn.disabled = true;
        submitBtn.textContent = "Authenticating Doctor...";
        errorMsg.style.display = "none";

        try {
            const res = await portalApi.doctorLogin(docId, password);
            portalState.setState({
                activeDoctorId: res.doctor_id,
                activeDoctorName: res.full_name,
                activeDepartment: res.department_id,
                activeDepartmentName: res.department_name,
                activeRoom: res.floor_room,
                isLoggedIn: true
            });

            if (onLoginSuccess) onLoginSuccess(res);
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign In to Clinical Console ➔";
            errorMsg.textContent = "Invalid Doctor ID or password. Please check your credentials.";
            errorMsg.style.display = "block";
        }
    });
}
