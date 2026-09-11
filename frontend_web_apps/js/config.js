/**
 * MediKiosk Web Portals Configuration
 */
export const PORTAL_CONFIG = {
    APP_NAME: "MediKiosk Clinical Portals",
    HOSPITAL_NAME: "All India Institute of Ayurveda & Associated Hospitals",
    API_BASE: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:8000/api/v1"
        : "https://medikiosk-backend-ddbm.onrender.com/api/v1",
    WS_TRIAGE: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "ws://localhost:8000/api/v1/triage/ws"
        : "wss://medikiosk-backend-ddbm.onrender.com/api/v1/triage/ws",
    
    // Default Mock Active Session Credentials (for Demonstration)
    DEFAULT_DOCTOR_ID: "DOC-2026-01",     // Dr. Rajesh Sharma (Gen Med / Kayachikitsa)
    DEFAULT_DOCTOR_NAME: "Dr. Rajesh Sharma, MD",
    DEFAULT_STAFF_ID: "STF-2026-01",       // Sister Sunita Rani (Triage Nurse)
    DEFAULT_STAFF_NAME: "Sister Sunita Rani (Triage RN)",
    DEFAULT_ADMIN_ID: "ADM-2026-01",
    
    // Department Mapping
    DEPARTMENTS: [
        { id: "KAYACHIKITSA", name: "Kayachikitsa (Ayurveda Internal Med)", room: "Room A-101" },
        { id: "GEN_MED", name: "General Medicine OPD", room: "Room 101" },
        { id: "CARDIOLOGY", name: "Cardiology OPD", room: "Room 104" },
        { id: "ORTHOPEDICS", name: "Orthopedics OPD", room: "Room 108" },
        { id: "PANCHAKARMA", name: "Panchakarma Department", room: "Room A-102" },
        { id: "EMERGENCY", name: "Emergency & Trauma Triage", room: "Red Zone E-01" }
    ]
};
