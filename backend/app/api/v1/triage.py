from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import get_db
from app.models.schemas import triage_alerts, patients, visit_sessions, staff_users
from app.engines.red_flag_engine import triage_ws_manager

router = APIRouter(prefix="/triage", tags=["Clinical Triage & Emergency Alerts"])

class AcknowledgeAlertRequest(BaseModel):
    staff_id: str
    action_note: Optional[str] = None

@router.websocket("/ws")
async def triage_alerts_websocket(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for desktop buzzer audio and popups in Emergency and Triage rooms.
    """
    await triage_ws_manager.connect(websocket)
    try:
        while True:
            # Keepalive / ping-pong
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        triage_ws_manager.disconnect(websocket)

@router.get("/alerts")
async def get_active_triage_alerts(status_filter: str = "ACTIVE", db: AsyncSession = Depends(get_db)):
    """
    Lists active Tier 1 (RED) and Tier 2 (AMBER) clinical alerts.
    """
    q = select(
        triage_alerts,
        patients.c.full_name.label("patient_name"),
        visit_sessions.c.department_id,
        visit_sessions.c.assigned_room
    ).join(patients, triage_alerts.c.patient_id == patients.c.patient_id)\
     .join(visit_sessions, triage_alerts.c.session_id == visit_sessions.c.session_id)\
     .where(triage_alerts.c.status == status_filter)\
     .order_by(triage_alerts.c.created_at.desc())

    rows = (await db.execute(q)).fetchall()
    return [dict(r._mapping) for r in rows]

@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_triage_alert(alert_id: str, req: AcknowledgeAlertRequest, db: AsyncSession = Depends(get_db)):
    """
    Marks a triage alert as ACKNOWLEDGED or RESOLVED by on-duty nursing/emergency staff.
    """
    q = select(triage_alerts).where(triage_alerts.c.alert_id == alert_id)
    alert = (await db.execute(q)).fetchone()
    if not alert:
        raise HTTPException(status_code=404, detail="Triage alert not found")

    now = datetime.now(timezone.utc)
    await db.execute(
        update(triage_alerts)
        .where(triage_alerts.c.alert_id == alert_id)
        .values(
            status="RESOLVED",
            resolved_by_staff_id=req.staff_id,
            resolved_at=now
        )
    )
    await db.commit()

    return {
        "status": "SUCCESS",
        "alert_id": alert_id,
        "resolved_by_staff_id": req.staff_id,
        "resolved_at": now.isoformat()
    }
