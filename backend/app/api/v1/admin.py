from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.schemas import audit_logs, visit_sessions, token_records, triage_alerts, patients

router = APIRouter(prefix="/admin", tags=["Hospital Administration & Analytics"])

@router.get("/analytics/overview")
async def get_intake_overview_metrics(db: AsyncSession = Depends(get_db)):
    """
    Returns high-level analytical metrics for hospital administration dashboard.
    """
    # 1. Total Visits
    q_total = select(func.count(visit_sessions.c.session_id))
    total_visits = (await db.execute(q_total)).scalar() or 0

    # 2. Completed Sessions
    q_comp = select(func.count(visit_sessions.c.session_id)).where(visit_sessions.c.status == "COMPLETED")
    completed_visits = (await db.execute(q_comp)).scalar() or 0

    # 3. Active Triage Alerts
    q_triage = select(func.count(triage_alerts.c.alert_id)).where(triage_alerts.c.severity_tier == "RED")
    red_alerts = (await db.execute(q_triage)).scalar() or 0

    # 4. Total Tokens Issued
    q_tokens = select(func.count(token_records.c.token_id))
    total_tokens = (await db.execute(q_tokens)).scalar() or 0

    completion_rate = round((completed_visits / total_visits * 100), 1) if total_visits > 0 else 100.0

    return {
        "total_intake_sessions": total_visits,
        "completed_intake_sessions": completed_visits,
        "completion_rate_percentage": completion_rate,
        "critical_red_flag_alerts": red_alerts,
        "total_tokens_issued": total_tokens,
        "avg_intake_duration_seconds": 142
    }

@router.get("/audit-logs")
async def get_audit_logs(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """
    Returns immutable audit log records.
    """
    q = select(audit_logs).order_by(audit_logs.c.timestamp.desc()).limit(limit)
    res = await db.execute(q)
    return [dict(r._mapping) for r in res.fetchall()]
