/**
 * MediKiosk Public Queue Display Board (Phase 4.3)
 * Data-minimized waiting room display for large TV monitors (Zero confidential PII).
 */
import { portalApi } from "../api.js";

export async function renderPublicDisplay(container) {
    const queueItems = await portalApi.getPublicDisplayQueue("KAYACHIKITSA");

    container.innerHTML = `
        <div class="public-board-container">
            
            <div style="margin-bottom: 24px;">
                <span class="badge badge-green" style="font-size: 14px; padding: 6px 16px;">
                    LIVE OPD WAITING ROOM DISPLAY
                </span>
                <h1 style="font-size: 36px; font-weight: 900; margin-top: 12px; color: #ffffff;">
                    All India Institute of Ayurveda — Central OPD
                </h1>
                <p style="font-size: 16px; color: var(--portal-text-muted);">
                    Please watch the screen for your Token Number. Proceed directly to the assigned consultation room when called.
                </p>
            </div>

            <!-- Active Called Tokens Grid -->
            <div class="public-token-grid">
                ${queueItems.map((item, idx) => {
                    const parts = item.display_text.split("➔");
                    const tokenNum = parts[0] || "Token #100";
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

            <div style="margin-top: 40px; font-size: 14px; color: var(--portal-text-dim);">
                🔒 Privacy Guardrail: Only anonymized token identifiers are displayed. Health details remain confidential.
            </div>

        </div>
    `;
}
