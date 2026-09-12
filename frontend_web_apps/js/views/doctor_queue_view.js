/**
 * MediKiosk Dedicated Assigned Patient Queue View (Section 1)
 * Features Real-Time Live Auto-Polling (3s sync), Department Filtering, and Instant Cabin Calls.
 */
import { portalState } from "../state.js";
import { portalApi } from "../api.js";

let queuePollInterval = null;

export async function renderDoctorQueueView(container, onSelectPatientToConsult) {
    if (queuePollInterval) {
        clearInterval(queuePollInterval);
        queuePollInterval = null;
    }

    const state = portalState.getState();
    let activeDept = state.activeDepartment || "KAYACHIKITSA";
    const activeDeptName = state.activeDepartmentName || "Kayachikitsa (Ayurveda OPD)";
    const activeRoom = state.activeRoom || "Room A-101";

    let currentQueue = await portalApi.getDoctorOpdQueue(activeDept === "ALL" ? null : activeDept);

    function calculateMetrics(items) {
        const redCount = items.filter(q => q.priority_tier === "RED").length;
        const amberCount = items.filter(q => q.priority_tier === "AMBER").length;
        return {
            total: items.length,
            urgent: redCount + amberCount
        };
    }

    function renderRowsHtml(items) {
        if (!items || items.length === 0) {
            return `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 48px 20px; color: #64748b;">
                        <div style="font-size: 36px; margin-bottom: 12px;">✅</div>
                        <div style="font-size: 16px; font-weight: 700; color: #0f172a;">No Patients Currently in Queue</div>
                        <div style="font-size: 13px; margin-top: 4px;">All registered patients for this department have been attended. Live updates active.</div>
                    </td>
                </tr>
            `;
        }

        return items.map(item => `
            <tr class="queue-row" data-search-text="${item.token_number} ${item.patient_name} ${item.chief_complaint || ''}" style="border-bottom: 1px solid #f1f5f9; transition: background 150ms ease;">
                <td style="padding: 16px 20px;">
                    <span style="font-size: 18px; font-weight: 900; color: #0284c7;">#${item.token_number}</span>
                </td>
                <td style="padding: 16px 20px;">
                    <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${item.patient_name}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                        ${item.patient_id} • ${item.gender === 'F' ? 'Female' : 'Male'} (${item.birth_year ? (2026 - item.birth_year) + ' yrs' : 'Adult'})
                    </div>
                </td>
                <td style="padding: 16px 20px;">
                    <span class="badge ${item.priority_tier === 'RED' ? 'badge-red' : (item.priority_tier === 'AMBER' ? 'badge-amber' : 'badge-green')}">
                        ${item.priority_tier === 'RED' ? '🚨 TIER-1 RED' : (item.priority_tier === 'AMBER' ? '⚠️ TIER-2 AMBER' : 'NORMAL')}
                    </span>
                </td>
                <td style="padding: 16px 20px; max-width: 320px;">
                    <div style="font-size: 13.5px; font-weight: 600; color: #1e293b; line-height: 1.4;">
                        ${item.chief_complaint || 'Pre-consultation clinical intake completed at kiosk'}
                    </div>
                </td>
                <td style="padding: 16px 20px; text-align: right;">
                    <button class="btn btn-primary btn-consult-patient" 
                            data-pat-id="${item.patient_id}"
                            data-tok-num="${item.token_number}"
                            style="padding: 8px 18px; font-size: 13px; font-weight: 800;">
                        🚪 Call Into Cabin ➔
                    </button>
                </td>
            </tr>
        `).join('');
    }

    const initialMetrics = calculateMetrics(currentQueue);

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1200px; margin: auto; animation: fade-in 200ms ease;">
            
            <!-- Top Queue Header & Statistics -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 20px 24px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 12px; font-weight: 800; color: #0d9488; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${activeRoom} • ${activeDeptName}
                        </span>
                        <span id="live-sync-indicator" style="display: inline-flex; align-items: center; gap: 5px; background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px;">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block; animation: pulse 1.5s infinite;"></span>
                            LIVE REAL-TIME SYNC
                        </span>
                    </div>
                    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">
                        📋 My Assigned Patient OPD Queue
                    </h2>
                </div>

                <!-- Live Metrics -->
                <div style="display: flex; gap: 16px;">
                    <div style="background: #f0fdfa; border: 1px solid #99f6e4; padding: 10px 18px; border-radius: var(--radius-sm); text-align: center; min-width: 100px;">
                        <div id="stat-total-waiting" style="font-size: 22px; font-weight: 900; color: #0d9488;">${initialMetrics.total}</div>
                        <div style="font-size: 11px; font-weight: 700; color: #0f766e; text-transform: uppercase;">Total Waiting</div>
                    </div>
                    <div style="background: #fee2e2; border: 1px solid #fca5a5; padding: 10px 18px; border-radius: var(--radius-sm); text-align: center; min-width: 100px;">
                        <div id="stat-urgent-cases" style="font-size: 22px; font-weight: 900; color: #b91c1c;">${initialMetrics.urgent}</div>
                        <div style="font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Urgent Cases</div>
                    </div>
                </div>
            </div>

            <!-- Patient Queue Table Card -->
            <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); overflow: hidden; box-shadow: 0 4px 12px rgba(15,23,42,0.04);">
                
                <div style="padding: 16px 24px; border-bottom: 1.5px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">
                            Active Waiting List (Sorted by Clinical Urgency)
                        </h3>
                    </div>

                    <div style="display: flex; align-items: center; gap: 10px;">
                        <select id="select-queue-dept" style="background: #f8fafc; border: 1.5px solid #cbd5e1; color: #0f172a; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; outline: none;">
                            <option value="${activeDept}">👨‍⚕️ My Department (${activeDept})</option>
                            <option value="ALL">🏥 All Hospital Departments</option>
                            <option value="GEN_MED">General Medicine OPD</option>
                            <option value="KAYACHIKITSA">Kayachikitsa (Ayurveda)</option>
                            <option value="CARDIOLOGY">Cardiology OPD</option>
                            <option value="ORTHOPAEDICS">Orthopaedics OPD</option>
                            <option value="PANCHAKARMA">Panchakarma OPD</option>
                            <option value="DERMATOLOGY">Dermatology OPD</option>
                            <option value="EMERGENCY">Emergency Triage</option>
                        </select>
                        <input type="text" id="input-queue-filter" placeholder="🔍 Search Token # or Patient Name..." 
                               style="background: #f8fafc; border: 1.5px solid #cbd5e1; color: #0f172a; padding: 8px 14px; border-radius: 6px; font-size: 13px; width: 260px; outline: none;">
                    </div>
                </div>

                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;" id="queue-table">
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;">
                                <th style="padding: 14px 20px;">Token #</th>
                                <th style="padding: 14px 20px;">Patient Info</th>
                                <th style="padding: 14px 20px;">Priority Level</th>
                                <th style="padding: 14px 20px;">Chief Symptom / Complaint</th>
                                <th style="padding: 14px 20px; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="queue-tbody">
                            ${renderRowsHtml(currentQueue)}
                        </tbody>
                    </table>
                </div>

            </div>

        </div>
    `;

    const filterInput = container.querySelector("#input-queue-filter");
    const deptSelect = container.querySelector("#select-queue-dept");
    const tbody = container.querySelector("#queue-tbody");
    const totalStatEl = container.querySelector("#stat-total-waiting");
    const urgentStatEl = container.querySelector("#stat-urgent-cases");
    const syncBadge = container.querySelector("#live-sync-indicator");

    function applySearchFilter() {
        const query = filterInput ? filterInput.value.toLowerCase().trim() : "";
        if (!query) {
            container.querySelectorAll(".queue-row").forEach(row => row.style.display = "");
            return;
        }
        container.querySelectorAll(".queue-row").forEach(row => {
            const text = row.getAttribute("data-search-text").toLowerCase();
            row.style.display = text.includes(query) ? "" : "none";
        });
    }

    if (filterInput) {
        filterInput.addEventListener("input", applySearchFilter);
    }

    if (deptSelect) {
        deptSelect.addEventListener("change", async (e) => {
            activeDept = e.target.value;
            await refreshQueue();
        });
    }

    // Delegated click handler for "Call Into Cabin"
    if (tbody) {
        tbody.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-consult-patient");
            if (btn) {
                const patId = btn.getAttribute("data-pat-id");
                portalState.setState({ selectedPatientId: patId });
                cleanup();
                if (onSelectPatientToConsult) {
                    onSelectPatientToConsult(patId);
                }
            }
        });
    }

    let previousTotalCount = initialMetrics.total;

    async function refreshQueue() {
        if (!container.isConnected) {
            cleanup();
            return;
        }

        try {
            const latestQueue = await portalApi.getDoctorOpdQueue(activeDept === "ALL" ? null : activeDept);
            const metrics = calculateMetrics(latestQueue);

            if (totalStatEl) totalStatEl.textContent = metrics.total;
            if (urgentStatEl) urgentStatEl.textContent = metrics.urgent;

            if (tbody) {
                tbody.innerHTML = renderRowsHtml(latestQueue);
                applySearchFilter();
            }

            // Flash sync badge if patient count changed or new patient arrived
            if (metrics.total > previousTotalCount && syncBadge) {
                syncBadge.style.background = "#dcfce7";
                syncBadge.style.borderColor = "#22c55e";
                syncBadge.innerHTML = `<span style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e; display: inline-block;"></span> ⚡ NEW PATIENT ARRIVED`;
                setTimeout(() => {
                    if (syncBadge && container.isConnected) {
                        syncBadge.style.background = "#ecfdf5";
                        syncBadge.style.borderColor = "#6ee7b7";
                        syncBadge.innerHTML = `<span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block;"></span> LIVE REAL-TIME SYNC`;
                    }
                }, 3000);
            }
            previousTotalCount = metrics.total;
        } catch (err) {
            console.warn("[DoctorQueueView] Polling refresh skipped:", err);
        }
    }

    // Real-Time Cross-Tab Event Bus
    let syncChannel = null;
    if (typeof BroadcastChannel !== "undefined") {
        try {
            syncChannel = new BroadcastChannel("medikiosk_opd_sync");
            syncChannel.onmessage = (ev) => {
                console.log("[DoctorQueueView] Instant OPD sync message received:", ev.data);
                refreshQueue();
            };
        } catch (e) {
            console.warn("[DoctorQueueView] BroadcastChannel init error:", e);
        }
    }

    // Cross-tab storage event fallback
    function handleStorageSync(e) {
        if (e.key === "medikiosk_last_token_sync" || e.key === "medikiosk_opd_token_updated") {
            console.log("[DoctorQueueView] Instant storage sync triggered");
            refreshQueue();
        }
    }
    window.addEventListener("storage", handleStorageSync);

    function cleanup() {
        if (queuePollInterval) {
            clearInterval(queuePollInterval);
            queuePollInterval = null;
        }
        if (syncChannel) {
            syncChannel.close();
            syncChannel = null;
        }
        window.removeEventListener("storage", handleStorageSync);
    }

    // Set up Real-Time Live Polling (every 1.5 seconds)
    queuePollInterval = setInterval(refreshQueue, 1500);
}
