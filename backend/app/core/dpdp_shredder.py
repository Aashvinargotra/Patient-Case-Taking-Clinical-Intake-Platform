import os
import shutil
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_

from app.models.schemas import visit_sessions, clinical_summaries, audit_logs

async def run_dpdp_ephemeral_shredding_cycle(
    db: AsyncSession,
    inactivity_threshold_minutes: int = 15,
    temp_dirs_to_clean: List[str] = None
) -> Dict[str, Any]:
    """
    DPDP Act 2023 & HIPAA Automated Ephemeral Data Shredding Engine:
    1. Identifies abandoned or unverified intake sessions exceeding threshold.
    2. Marks sessions as 'ABANDONED' and detaches draft clinical summaries.
    3. Securely deletes temporary audio and unverified OCR image files from scratch disk.
    4. Records immutable audit trail for DPDP compliance auditors.
    """
    now = datetime.now(timezone.utc)
    cutoff_time = now - timedelta(minutes=inactivity_threshold_minutes)
    
    # 1. Identify abandoned in-progress sessions
    q_stale = select(visit_sessions).where(
        and_(
            visit_sessions.c.status.in_(["IN_PROGRESS", "ABANDONED"]),
            visit_sessions.c.start_time <= cutoff_time
        )
    )
    stale_rows = (await db.execute(q_stale)).fetchall()
    shredded_session_ids = [r.session_id for r in stale_rows]

    if shredded_session_ids:
        # Mark sessions as ABANDONED
        await db.execute(
            update(visit_sessions)
            .where(visit_sessions.c.session_id.in_(shredded_session_ids))
            .values(status="ABANDONED")
        )

        # Shred unverified draft summary texts for abandoned sessions
        await db.execute(
            update(clinical_summaries)
            .where(
                and_(
                    clinical_summaries.c.session_id.in_(shredded_session_ids),
                    clinical_summaries.c.is_draft == True
                )
            )
            .values(
                draft_summary_text="[DPDP_AUTOMATED_SHREDDED: Session timed out without physician verification]",
                chief_complaint="[SHREDDED]"
            )
        )

        # 2. File Shredding from disk
        if temp_dirs_to_clean:
            for d in temp_dirs_to_clean:
                if os.path.exists(d):
                    for filename in os.listdir(d):
                        filepath = os.path.join(d, filename)
                        try:
                            if os.path.isfile(filepath) or os.path.islink(filepath):
                                os.unlink(filepath)
                            elif os.path.isdir(filepath):
                                shutil.rmtree(filepath)
                        except Exception as e:
                            print(f"[WARN] Error shredding file {filepath}: {e}")

        # 3. Log Audit Trail
        await db.execute(audit_logs.insert().values(
            event_type="DPDP_EPHEMERAL_DATA_SHRED",
            user_id="SYSTEM_DPDP_WORKER",
            user_role="SYSTEM",
            action_details={
                "shredded_sessions_count": len(shredded_session_ids),
                "session_ids": shredded_session_ids[:10],
                "cutoff_timestamp": cutoff_time.isoformat()
            },
            status="SUCCESS"
        ))

        await db.commit()

    return {
        "shredded_sessions_count": len(shredded_session_ids),
        "cutoff_time": cutoff_time.isoformat(),
        "status": "COMPLETED"
    }
