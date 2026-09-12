/**
 * MediKiosk Public Queue Display Board (Phase 4.3)
 * Data-minimized waiting room display for large TV monitors (Zero confidential PII).
 */
import { portalApi } from "../api.js";
import { getIcon } from "../icons.js";

export function renderPublicDisplay(container) {
    const activeTokens = [
        "Token #101 ➔ Room A-101 (Kayachikitsa)",
        "Token #102 ➔ Room B-204 (Cardiology)",
        "Token #104 ➔ Room C-102 (Orthopaedics)",
        "Token #105 ➔ Room A-102 (Panchakarma)"
    ];

    container.innerHTML = `
        <div class="public-display-screen" style="max-width: 1100px; margin: auto; text-align: center;">
            
            <div style="margin-bottom: 36px;">
                <div class="public-clock" id="display-clock">--:--:--</div>
                <h1 style="font-size: 32px; font-weight: 800; color: #ffffff; margin-top: 8px;">
                    Central Hospital OPD Calling Board
                </h1>
                <p style="font-size: 16px; color: var(--portal-text-muted);">Please proceed to the indicated cabin when your token number appears below.</p>
            </div>

            <!-- Active Calling Grid -->
            <div class="public-grid">
                ${activeTokens.map(tok => {
                    const parts = tok.split("➔");
                    const tokenNum = parts[0] || "Token #";
                    const roomName = parts[1] || "Room 101";

                    return `
                        <div class="public-token-card">
                            <span class="badge badge-blue" style="font-size: 11px;">NOW CALLING</span>
                            <div class="public-token-num">${tokenNum.trim()}</div>
                            <div class="public-token-room">➔ ${roomName.trim()}</div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div style="margin-top: 40px; font-size: 14px; color: var(--portal-text-dim); display: flex; align-items: center; justify-content: center; gap: 8px;">
                ${getIcon('lock', { size: 14, color: 'var(--portal-text-dim)' })}
                <span>Privacy Guardrail: Only anonymized token identifiers are displayed. Health details remain confidential.</span>
            </div>

        </div>
    `;
}
