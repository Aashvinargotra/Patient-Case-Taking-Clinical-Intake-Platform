/**
 * MediKiosk Web Portals State Store
 */
import { PORTAL_CONFIG } from "./config.js";

class PortalStateStore {
    constructor() {
        this.listeners = new Set();
        this.state = {
            isLoggedIn: false,
            currentRole: "DOCTOR",              // DOCTOR, TRIAGE, ADMIN, PUBLIC_BOARD, PATIENT
            activeDepartment: "KAYACHIKITSA",
            activeDepartmentName: "Kayachikitsa (Ayurvedic Medicine)",
            activeRoom: "Room A-101 (Ground Floor)",
            activeDoctorId: "DOC-AYUSH-01",
            activeDoctorName: "Dr. Ananya Sharma",
            activeStaffId: PORTAL_CONFIG.DEFAULT_STAFF_ID,
            
            // Doctor Case Context
            selectedPatientId: null,
            loadedPatientCase: null,
            isSplitViewerOpen: false,
            
            // Real-time Queue & Alerts
            opdQueue: [],
            activeTriageAlerts: [],
            isWsConnected: false,
            
            // Search Modal
            isSearchModalOpen: false
        };
    }

    getState() {
        return { ...this.state };
    }

    setState(partial) {
        this.state = { ...this.state, ...partial };
        this.notify();
    }

    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    notify() {
        for (const fn of this.listeners) {
            fn(this.getState());
        }
    }
}

export const portalState = new PortalStateStore();
