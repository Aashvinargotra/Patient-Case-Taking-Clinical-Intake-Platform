/**
 * MediKiosk Secure Physician Authentication Gateway
 * Requires Doctor ID / Medical Registration Number and Password verification.
 */
import { portalState } from "../state.js";
import { portalApi } from "../api.js";
import { getIcon } from "../icons.js";

export function renderDoctorLogin(container, onLoginSuccess) {
    container.innerHTML = `
        <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fade-in 250ms ease;">
            <div style="width: 100%; max-width: 480px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-lg); box-shadow: 0 10px 30px rgba(15,23,42,0.08); overflow: hidden;">
                
                <!-- Clinical Header Banner -->
                <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 32px 28px; color: #ffffff; text-align: center;">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
                        ${getIcon('stethoscope', { size: 30, color: '#ffffff' })}
                    </div>
                    <h2 style="font-size: 22px; font-weight: 800; margin: 0; color: #ffffff;">Physician Clinical Console</h2>
                    <p style="margin: 6px 0 0 0; font-size: 13.5px; opacity: 0.95;">All India Institute of Ayurveda & Associated Hospitals</p>
                </div>

                <!-- Secure Authentication Form -->
                <div style="padding: 32px 28px;">
                    
                    <!-- Quick Switcher Doctor Pills -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px;">
                            ${getIcon('zap', { size: 14, color: '#0d9488' })} Quick Switch Doctor:
                        </label>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="doctor-quick-pills">
                            <button type="button" class="btn-quick-doc" data-id="DOC-GENMED-01" data-pass="DoctorPass2026!" style="background: #e0f2fe; border: 1px solid #7dd3fc; color: #0369a1; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                ${getIcon('stethoscope', { size: 13, color: '#0369a1' })} Dr. Priya Sen (Gen Med)
                            </button>
                            <button type="button" class="btn-quick-doc" data-id="DOC-AYUSH-01" data-pass="DoctorPass2026!" style="background: #f0fdf4; border: 1px solid #86efac; color: #15803d; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                ${getIcon('leaf', { size: 13, color: '#15803d' })} Dr. Ananya Sharma (Ayush)
                            </button>
                            <button type="button" class="btn-quick-doc" data-id="DOC-CARDIO-01" data-pass="DoctorPass2026!" style="background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                ${getIcon('activity', { size: 13, color: '#be123c' })} Dr. Vikram Malhotra (Cardio)
                            </button>
                            <button type="button" class="btn-quick-doc" data-id="DOC-ORTHO-01" data-pass="DoctorPass2026!" style="background: #fefce8; border: 1px solid #fef08a; color: #a16207; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                ${getIcon('user', { size: 13, color: '#a16207' })} Dr. Rajesh Verma (Ortho)
                            </button>
                            <button type="button" class="btn-quick-doc" data-id="DOC-DERMA-01" data-pass="DoctorPass2026!" style="background: #fdf2f8; border: 1px solid #fbcfe8; color: #9d174d; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                ${getIcon('user', { size: 13, color: '#9d174d' })} Dr. Neha Gupta (Derma)
                            </button>
                            <button type="button" class="btn-quick-doc" data-id="DOC-PANCHAKARMA-01" data-pass="DoctorPass2026!" style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                ${getIcon('leaf', { size: 13, color: '#047857' })} Dr. Harpreet Kaur (Panchakarma)
                            </button>
                        </div>
                    </div>

                    <form id="form-doc-login" style="display: flex; flex-direction: column; gap: 18px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                                Doctor ID / Medical Registration Number
                            </label>
                            <input type="text" id="input-doc-id" required 
                                   placeholder="e.g. DOC-GENMED-01 or DOC-AYUSH-01"
                                   value="DOC-GENMED-01"
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
                                style="padding: 14px 20px; font-size: 15px; font-weight: 800; margin-top: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>Sign In to Clinical Console</span>
                            ${getIcon('arrow-right', { size: 16, color: '#ffffff' })}
                        </button>
                    </form>

                    <!-- Credentials Reference Note -->
                    <div style="margin-top: 24px; padding: 12px 16px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: var(--radius-sm); font-size: 12px; color: #0f766e; line-height: 1.5;">
                        <strong style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('key', { size: 14, color: '#0f766e' })} Authorized Roster Credentials:</strong><br>
                        • All accounts use password: <code>DoctorPass2026!</code><br>
                        • Click any doctor pill above to auto-select that physician.
                    </div>

                </div>

            </div>
        </div>
    `;

    // Quick fill handlers
    container.querySelectorAll(".btn-quick-doc").forEach(btn => {
        btn.addEventListener("click", () => {
            container.querySelector("#input-doc-id").value = btn.dataset.id;
            container.querySelector("#input-doc-pass").value = btn.dataset.pass;
        });
    });

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
                activeRoom: res.floor_room || res.assigned_room || "Room 102",
                isLoggedIn: true
            });

            if (onLoginSuccess) onLoginSuccess(res);
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Sign In to Clinical Console</span> ${getIcon('arrow-right', { size: 16, color: '#ffffff' })}`;
            errorMsg.textContent = "Invalid Doctor ID or password. Please check your credentials.";
            errorMsg.style.display = "block";
        }
    });
}
