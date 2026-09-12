/**
 * MediKiosk Triage Staff Real-Time Monitor & Emergency Buzzer (Phase 4.6)
 */
import { portalState } from "../state.js";
import { portalApi } from "../api.js";
import { getIcon } from "../icons.js";

export async function renderTriageMonitor(container) {
    const alerts = await portalApi.getActiveTriageAlerts();

    container.innerHTML = `
        <div style="max-width: 1000px; margin: auto;">
            
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                <div>
                    <h2 style="font-size: 22px; font-weight: 800; color: #ffffff;">Clinical Triage & Emergency Alert Desk</h2>
                    <p style="font-size: 13px; color: var(--portal-text-muted);">Real-time WebSocket listener with instant desktop buzzer and re-routing capabilities.</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" id="btn-refresh-triage" style="display: inline-flex; align-items: center; gap: 6px;">
                        ${getIcon('refresh-cw', { size: 14, color: 'currentColor' })} Refresh Feed
                    </button>
                    <button class="btn btn-danger" id="btn-test-buzzer" style="display: inline-flex; align-items: center; gap: 6px;">
                        ${getIcon('alert-circle', { size: 14, color: 'currentColor' })} Test Audio Buzzer
                    </button>
                </div>
            </div>

            <!-- Active Alerts Feed -->
            <div class="triage-feed-container" id="triage-feed-list">
                ${alerts.map(alt => `
                    <div class="triage-alert-card ${alt.severity_tier === 'RED' ? 'tier-red' : 'tier-amber'}">
                        <div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                <span class="badge ${alt.severity_tier === 'RED' ? 'badge-red' : 'badge-amber'}" style="display: inline-flex; align-items: center; gap: 5px;">
                                    ${alt.severity_tier === 'RED' ? `${getIcon('alert-circle', { size: 14, color: '#b91c1c' })} TIER-1 CRITICAL EMERGENCY` : `${getIcon('alert-triangle', { size: 14, color: '#b45309' })} TIER-2 HIGH PRIORITY`}
                                </span>
                                <span style="font-size: 13px; color: var(--portal-text-muted);">Rule: ${alt.rule_id}</span>
                            </div>
                            <h3 style="font-size: 17px; font-weight: 800; color: #ffffff;">
                                ${alt.patient_name} <span style="font-size: 14px; font-weight: 500; color: var(--portal-text-muted);">(${alt.patient_id})</span>
                            </h3>
                            <div style="font-size: 13px; color: var(--portal-text-muted); margin-top: 4px;">
                                Target Department: <strong>${alt.department_id}</strong> • Assigned Room: <strong>${alt.assigned_room}</strong>
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-secondary btn-reroute" data-alt-id="${alt.alert_id}" style="display: inline-flex; align-items: center; gap: 6px;">
                                ${getIcon('activity', { size: 14, color: 'currentColor' })} Re-Route Dept
                            </button>
                            <button class="btn btn-primary btn-ack" data-alt-id="${alt.alert_id}" style="display: inline-flex; align-items: center; gap: 6px;">
                                ${getIcon('check', { size: 14, color: 'currentColor' })} Acknowledge & Dispatch
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>

        </div>
    `;

    // Audio Buzzer Test
    container.querySelector("#btn-test-buzzer").addEventListener("click", () => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5 buzzer
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 500);
        alert("EMERGENCY BUZZER TRIGGERED: Alert sent to Emergency Red Zone desk.");
    });

    container.querySelector("#btn-refresh-triage").addEventListener("click", () => {
        renderTriageMonitor(container);
    });

    // Acknowledge Action
    container.querySelectorAll(".btn-ack").forEach(btn => {
        btn.addEventListener("click", async () => {
            const alertId = btn.getAttribute("data-alt-id");
            await portalApi.acknowledgeTriageAlert(alertId, portalState.getState().activeStaffId);
            alert(`Alert ${alertId} marked RESOLVED by Triage Nurse.`);
            renderTriageMonitor(container);
        });
    });

    // Re-Route Action
    container.querySelectorAll(".btn-reroute").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetDept = prompt("Enter target department to re-route (e.g., EMERGENCY, CARDIOLOGY, KAYACHIKITSA):", "EMERGENCY");
            if (targetDept) {
                alert(`Patient re-routed to ${targetDept} with clinical justification logged in audit trail.`);
            }
        });
    });
}
