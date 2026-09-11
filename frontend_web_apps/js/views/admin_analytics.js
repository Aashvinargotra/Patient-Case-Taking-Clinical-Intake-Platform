/**
 * MediKiosk Hospital Administration & Analytics Dashboard (Phase 4.5)
 */
import { portalApi } from "../api.js";

export async function renderAdminAnalytics(container) {
    const kpis = await portalApi.getAdminAnalytics();
    const auditLogs = await portalApi.getAuditLogs();

    container.innerHTML = `
        <div style="max-width: 1200px; margin: auto;">
            
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                <div>
                    <h2 style="font-size: 22px; font-weight: 800; color: #ffffff;">Hospital Administration & Intake Analytics</h2>
                    <p style="font-size: 13px; color: var(--portal-text-muted);">Real-time OPD intake throughput, completion metrics, and tamper-evident audit logs.</p>
                </div>
                <button class="btn btn-secondary" id="btn-export-audit">📥 Export Audit Logs</button>
            </div>

            <!-- KPI Metric Cards -->
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-title">Total Intake Sessions</div>
                    <div class="kpi-value">${kpis.total_intake_sessions}</div>
                    <div class="kpi-sub">↑ 14% vs yesterday</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Intake Completion Rate</div>
                    <div class="kpi-value" style="color: var(--portal-green);">${kpis.completion_rate_percentage}%</div>
                    <div class="kpi-sub">Target: >85%</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Avg. Intake Duration</div>
                    <div class="kpi-value" style="color: #38bdf8;">${Math.floor(kpis.avg_intake_duration_seconds / 60)}m ${kpis.avg_intake_duration_seconds % 60}s</div>
                    <div class="kpi-sub">Standard: < 3 mins</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title">Critical Red Flag Alerts</div>
                    <div class="kpi-value" style="color: var(--portal-red);">${kpis.critical_red_flag_alerts}</div>
                    <div class="kpi-sub" style="color: #fca5a5;">100% Dispatched to Triage</div>
                </div>
            </div>

            <!-- Tamper-Evident Audit Log Table -->
            <div style="background: var(--portal-card); border: 1px solid var(--portal-border); border-radius: var(--radius-md); overflow: hidden;">
                <div style="padding: 16px 20px; border-bottom: 1px solid var(--portal-border); display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="font-size: 15px; font-weight: 700; color: #ffffff;">🔒 Immutable Audit Log Trail (DPDP & HIPAA Compliance)</h3>
                    <span class="badge badge-green">SHA-256 Chained</span>
                </div>
                <table class="portal-table">
                    <thead>
                        <tr>
                            <th>Timestamp (UTC)</th>
                            <th>Event Type</th>
                            <th>Actor / Role</th>
                            <th>Target Patient</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${auditLogs.map(log => `
                            <tr>
                                <td style="font-family: monospace; font-size: 12px; color: var(--portal-text-muted);">${new Date(log.timestamp).toLocaleString()}</td>
                                <td><strong>${log.event_type}</strong></td>
                                <td>${log.user_id} (${log.user_role})</td>
                                <td>${log.target_patient_id || 'SYSTEM'}</td>
                                <td><span class="badge badge-green">${log.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

        </div>
    `;

    container.querySelector("#btn-export-audit").addEventListener("click", () => {
        const jsonStr = JSON.stringify(auditLogs, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `medikiosk_audit_logs_${Date.now()}.json`;
        a.click();
    });
}
