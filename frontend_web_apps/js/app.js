/**
 * MediKiosk Web Portals Main Application Coordinator
 */
import { PORTAL_CONFIG } from "./config.js";
import { portalState } from "./state.js";
import { portalApi } from "./api.js";

// Views
import { renderDoctorDashboard } from "./views/doctor_dashboard.js";
import { renderTriageMonitor } from "./views/triage_monitor.js";
import { renderPublicDisplay } from "./views/public_display.js";
import { renderAdminAnalytics } from "./views/admin_analytics.js";
import { renderPatientPortal } from "./views/patient_portal.js";

class PortalApp {
    constructor() {
        this.navContainer = document.getElementById("sidebar-nav-root");
        this.viewportContainer = document.getElementById("portal-viewport-root");
        this.hotkeyModalContainer = document.getElementById("hotkey-modal-root");
        this.roleSelector = document.getElementById("role-selector");
        this.deptSelector = document.getElementById("dept-selector");
    }

    init() {
        console.log("Initializing MediKiosk Web Portals...");
        this.renderSidebarNav();
        this.bindGlobalHotkeys();
        this.bindRoleAndDeptSelectors();
        
        // Initial view
        this.switchView("DOCTOR");
    }

    renderSidebarNav() {
        const navItems = [
            { id: "DOCTOR", icon: "🩺", label: "Doctor Dashboard" },
            { id: "TRIAGE", icon: "🚨", label: "Triage Staff Monitor" },
            { id: "PUBLIC_BOARD", icon: "📺", label: "Public Queue TV" },
            { id: "ADMIN", icon: "📊", label: "Admin Analytics" },
            { id: "PATIENT", icon: "📱", label: "MyMediKiosk Portal" }
        ];

        const state = portalState.getState();
        this.navContainer.innerHTML = navItems.map(item => `
            <div class="nav-item ${state.currentRole === item.id ? 'active' : ''}" data-role-id="${item.id}">
                <span>${item.icon}</span>
                <span>${item.label}</span>
            </div>
        `).join('');

        this.navContainer.querySelectorAll(".nav-item").forEach(el => {
            el.addEventListener("click", () => {
                const roleId = el.getAttribute("data-role-id");
                this.switchView(roleId);
            });
        });
    }

    bindRoleAndDeptSelectors() {
        if (this.roleSelector) {
            this.roleSelector.addEventListener("change", (e) => {
                this.switchView(e.target.value);
            });
        }
        if (this.deptSelector) {
            this.deptSelector.addEventListener("change", (e) => {
                portalState.setState({ activeDepartment: e.target.value });
                this.switchView(portalState.getState().currentRole);
            });
        }
    }

    bindGlobalHotkeys() {
        // Universal Ctrl+K Patient Search
        window.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                this.openHotkeySearchModal();
            }
            if (e.key === "Escape") {
                this.closeHotkeySearchModal();
            }
        });

        const trigger = document.getElementById("hotkey-search-trigger");
        if (trigger) {
            trigger.addEventListener("click", () => this.openHotkeySearchModal());
        }
    }

    openHotkeySearchModal() {
        this.hotkeyModalContainer.innerHTML = `
            <div class="hotkey-modal-overlay" id="hotkey-overlay">
                <div class="hotkey-modal-card">
                    <input type="text" class="hotkey-input" id="search-pat-input" placeholder="Search by Patient ID, Name, or ABHA (e.g. PAT-DEMO-01, Rahul Verma)..." autofocus />
                    <div style="padding: 16px 20px; max-height: 280px; overflow-y: auto;" id="search-results-list">
                        <div style="font-size: 12px; color: var(--portal-text-muted); padding: 8px 0;">RECENT PATIENTS:</div>
                        <div class="search-result-row" data-pat-id="PAT-DEMO-01" style="padding: 10px; border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--portal-border);">
                            <div>
                                <strong style="color: #ffffff;">Rahul Verma</strong> <span style="color: var(--portal-text-muted);">(PAT-DEMO-01)</span>
                                <div style="font-size: 12px; color: #fca5a5;">🚨 ACS Suspicion • Crushing chest pain</div>
                            </div>
                            <span class="badge badge-red">Cardiology</span>
                        </div>
                        <div class="search-result-row" data-pat-id="PAT-DEMO-02" style="padding: 10px; border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #ffffff;">Gurpreet Singh</strong> <span style="color: var(--portal-text-muted);">(PAT-DEMO-02)</span>
                                <div style="font-size: 12px; color: #fcd34d;">⚠️ Joint pain • Sandhi Vata</div>
                            </div>
                            <span class="badge badge-amber">Kayachikitsa</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const overlay = document.getElementById("hotkey-overlay");
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) this.closeHotkeySearchModal();
        });

        this.hotkeyModalContainer.querySelectorAll(".search-result-row").forEach(row => {
            row.addEventListener("click", () => {
                const patId = row.getAttribute("data-pat-id");
                portalState.setState({ selectedPatientId: patId, currentRole: "DOCTOR" });
                this.closeHotkeySearchModal();
                this.switchView("DOCTOR");
            });
        });
    }

    closeHotkeySearchModal() {
        this.hotkeyModalContainer.innerHTML = "";
    }

    async switchView(roleId) {
        portalState.setState({ currentRole: roleId });
        this.renderSidebarNav();
        if (this.roleSelector) this.roleSelector.value = roleId;

        this.viewportContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--portal-text-muted);">
                Loading Clinical View...
            </div>
        `;

        switch (roleId) {
            case "DOCTOR":
                await renderDoctorDashboard(this.viewportContainer);
                break;
            case "TRIAGE":
                await renderTriageMonitor(this.viewportContainer);
                break;
            case "PUBLIC_BOARD":
                await renderPublicDisplay(this.viewportContainer);
                break;
            case "ADMIN":
                await renderAdminAnalytics(this.viewportContainer);
                break;
            case "PATIENT":
                await renderPatientPortal(this.viewportContainer);
                break;
            default:
                await renderDoctorDashboard(this.viewportContainer);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const app = new PortalApp();
    app.init();
});
