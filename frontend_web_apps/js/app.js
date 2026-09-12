/**
 * MediKiosk Dedicated Physician Clinical Console Coordinator
 */
import { PORTAL_CONFIG } from "./config.js";
import { portalState } from "./state.js";
import { portalApi } from "./api.js";
import { getIcon } from "./icons.js";

// Views
import { renderDoctorLogin } from "./views/doctor_login.js";
import { renderDoctorQueueView } from "./views/doctor_queue_view.js";
import { renderDoctorDashboard } from "./views/doctor_dashboard.js";

class DoctorPortalApp {
    constructor() {
        this.navContainer = document.getElementById("sidebar-nav-root");
        this.viewportContainer = document.getElementById("portal-viewport-root");
        this.hotkeyModalContainer = document.getElementById("hotkey-modal-root");
        this.sidebarProfile = document.querySelector(".sidebar-footer");
        this.deptBadgeText = document.getElementById("badge-dept-text");
        this.currentTab = "QUEUE"; // QUEUE | CONSULTATION
    }

    init() {
        console.log("Initializing MediKiosk Dedicated Physician Console...");
        this.bindGlobalHotkeys();
        
        // Start at Doctor Authentication or Queue
        const state = portalState.getState();
        if (!state.isLoggedIn) {
            this.showLogin();
        } else {
            this.renderSidebarNav();
            this.renderUserProfile();
            this.switchTab("QUEUE");
        }
    }

    showLogin() {
        this.navContainer.innerHTML = `
            <div style="padding: 16px 12px; color: #64748b; font-size: 13px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                ${getIcon("lock", { size: 16, color: "#94a3b8" })}
                <span>Doctor Authentication Required</span>
            </div>
        `;
        if (this.sidebarProfile) {
            this.sidebarProfile.innerHTML = `
                <div style="font-size: 12px; color: #64748b; text-align: center; padding: 6px;">
                    Please sign in to access records
                </div>
            `;
        }

        renderDoctorLogin(this.viewportContainer, (doc) => {
            portalState.setState({ isLoggedIn: true });
            this.renderSidebarNav();
            this.renderUserProfile();
            this.updateHeaderBadges();
            this.switchTab("QUEUE");
        });
    }

    updateHeaderBadges() {
        const state = portalState.getState();
        if (this.deptBadgeText) {
            this.deptBadgeText.textContent = `${state.activeDepartmentName || 'Kayachikitsa OPD'} • ${state.activeRoom || 'Room A-101'}`;
        }
    }

    renderUserProfile() {
        if (!this.sidebarProfile) return;
        const state = portalState.getState();
        if (state.isLoggedIn) {
            this.sidebarProfile.innerHTML = `
                <div class="user-profile-badge" style="display: flex; align-items: center; justify-content: space-between; width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: var(--radius-sm); padding: 10px 14px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="user-avatar" style="width: 38px; height: 38px; border-radius: 50%; background: #0d9488; color: #ffffff; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 14px;">DR</div>
                        <div>
                            <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${state.activeDoctorName}</div>
                            <div style="font-size: 11px; color: #0d9488; font-weight: 700;">${state.activeRoom}</div>
                        </div>
                    </div>
                    <button id="btn-doc-logout" title="Sign Out" style="background: none; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 6px; transition: background 0.15s ease;">
                        ${getIcon("log-out", { size: 18, color: "#64748b" })}
                    </button>
                </div>
            `;
            const logoutBtn = this.sidebarProfile.querySelector("#btn-doc-logout");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", () => {
                    portalState.setState({ isLoggedIn: false, selectedPatientId: null });
                    this.showLogin();
                });
            }
        }
    }

    renderSidebarNav() {
        const navItems = [
            { id: "QUEUE", icon: getIcon("clipboard-list", { size: 18 }), label: "My Assigned Patient Queue" },
            { id: "CONSULTATION", icon: getIcon("stethoscope", { size: 18 }), label: "Active Consultation Cabin" }
        ];

        this.navContainer.innerHTML = navItems.map(item => `
            <div class="nav-item ${this.currentTab === item.id ? 'active' : ''}" data-tab-id="${item.id}" style="display: flex; align-items: center; gap: 10px;">
                <span style="display: flex; align-items: center; justify-content: center;">${item.icon}</span>
                <span>${item.label}</span>
            </div>
        `).join('');

        this.navContainer.querySelectorAll(".nav-item").forEach(el => {
            el.addEventListener("click", () => {
                const tabId = el.getAttribute("data-tab-id");
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        this.renderSidebarNav();
        this.viewportContainer.innerHTML = "";

        if (tabId === "QUEUE") {
            renderDoctorQueueView(this.viewportContainer, (patId) => {
                portalState.setState({ selectedPatientId: patId });
                this.switchTab("CONSULTATION");
            });
        } else if (tabId === "CONSULTATION") {
            renderDoctorDashboard(this.viewportContainer, () => {
                this.switchTab("QUEUE");
            });
        }
    }

    bindGlobalHotkeys() {
        window.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                this.openQuickSearchModal();
            }
        });

        const trigger = document.getElementById("hotkey-search-trigger");
        if (trigger) {
            trigger.addEventListener("click", () => this.openQuickSearchModal());
        }
    }

    openQuickSearchModal() {
        this.hotkeyModalContainer.innerHTML = `
            <div class="modal-overlay" role="dialog" aria-modal="true" style="position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px);">
                <div class="modal-dialog" style="width: 100%; max-width: 580px; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: var(--radius-md); padding: 24px; box-shadow: 0 20px 50px rgba(15,23,42,0.25);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
                            ${getIcon('search', { size: 18, color: '#0d9488' })}
                            <span>Quick Patient Case Lookup</span>
                        </h3>
                        <button id="btn-close-search" style="background: none; border: none; padding: 4px; color: #64748b; cursor: pointer; display: flex; align-items: center;">
                            ${getIcon('x', { size: 18, color: '#64748b' })}
                        </button>
                    </div>
                    <input type="text" id="input-modal-search" 
                           placeholder="Type Patient Name, ABHA ID, or Token Number..." 
                           autofocus
                           style="width: 100%; background: #f8fafc; border: 1.5px solid #cbd5e1; color: #0f172a; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 15px; outline: none; margin-bottom: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div class="search-result-row" data-pat-id="PAT-DEMO-01" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <span style="font-weight: 800; color: #0f172a;">Rahul Verma</span>
                                <span style="color: #64748b; font-size: 12px; margin-left: 8px;">PAT-DEMO-01 • Token #101</span>
                            </div>
                            <span class="badge badge-red">Cardiology (RED)</span>
                        </div>
                        <div class="search-result-row" data-pat-id="PAT-DEMO-02" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <span style="font-weight: 800; color: #0f172a;">Gurpreet Singh</span>
                                <span style="color: #64748b; font-size: 12px; margin-left: 8px;">PAT-DEMO-02 • Token #102</span>
                            </div>
                            <span class="badge badge-amber">Kayachikitsa (AMBER)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.hotkeyModalContainer.querySelector("#btn-close-search").addEventListener("click", () => {
            this.hotkeyModalContainer.innerHTML = "";
        });

        this.hotkeyModalContainer.querySelectorAll(".search-result-row").forEach(row => {
            row.addEventListener("click", () => {
                const patId = row.getAttribute("data-pat-id");
                portalState.setState({ selectedPatientId: patId });
                this.hotkeyModalContainer.innerHTML = "";
                this.switchTab("CONSULTATION");
            });
        });
    }
}

// Mount app on DOM load
document.addEventListener("DOMContentLoaded", () => {
    window.doctorPortalApp = new DoctorPortalApp();
    window.doctorPortalApp.init();
});
