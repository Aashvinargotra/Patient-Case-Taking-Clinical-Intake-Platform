import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import get_db
from app.models.schemas import token_records, visit_sessions, patients, departments, clinical_summaries
from app.core.security import generate_signed_qr_token
from app.engines.routing_engine import determine_department

router = APIRouter(prefix="/queue", tags=["Queue Management & Digital Parchi"])

class IssueTokenRequest(BaseModel):
    session_id: str
    patient_id: str
    chief_complaint: str
    priority_tier: str = "NORMAL"

@router.post("/issue-token")
async def issue_opd_token(req: IssueTokenRequest, db: AsyncSession = Depends(get_db)):
    """
    Issues a sequential OPD queue token and generates anti-tamper signed QR.
    """
    dept_info = determine_department(req.chief_complaint)
    token_num = 101 # In production: atomic sequential counter per department
    signed_qr = generate_signed_qr_token(req.session_id, req.patient_id, token_num)

    token_id = str(uuid.uuid4())
    await db.execute(token_records.insert().values(
        token_id=token_id,
        session_id=req.session_id,
        patient_id=req.patient_id,
        token_number=token_num,
        department_id=dept_info["dept_id"],
        priority_tier=req.priority_tier,
        signed_qr_token=signed_qr,
        queue_status="WAITING"
    ))

    await db.execute(
        update(visit_sessions)
        .where(visit_sessions.c.session_id == req.session_id)
        .values(
            department_id=dept_info["dept_id"],
            assigned_room=dept_info["room"],
            status="READY_FOR_DR"
        )
    )

    await db.commit()

    return {
        "token_id": token_id,
        "token_number": token_num,
        "department": dept_info["name"],
        "room": dept_info["room"],
        "signed_qr_token": signed_qr
    }

@router.get("/public-display/{department_id}")
async def get_public_display_queue(department_id: str, db: AsyncSession = Depends(get_db)):
    """
    Public queue display for waiting area screens.
    Strictly displays plain token numbers and assigned room (Zero health/confidential PII).
    """
    q = select(token_records.c.token_number, visit_sessions.c.assigned_room)\
        .join(visit_sessions, token_records.c.session_id == visit_sessions.c.session_id)\
        .where(token_records.c.department_id == department_id)\
        .where(token_records.c.queue_status == "WAITING")\
        .order_by(token_records.c.token_number.asc()).limit(10)
    res = await db.execute(q)
    return [{"display_text": f"Token #{r.token_number} ➔ {r.assigned_room}"} for r in res.fetchall()]

@router.get("/parchi/{patient_id}")
async def get_digital_opd_parchi(patient_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generates data payload for the Digital OPD Parchi (replacing paper slips).
    """
    # 1. Fetch Patient
    q_p = select(patients).where(patients.c.patient_id == patient_id)
    patient = (await db.execute(q_p)).fetchone()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    # 2. Fetch Latest Active Token
    q_t = select(
        token_records,
        departments.c.name.label("department_name"),
        visit_sessions.c.assigned_room,
        clinical_summaries.c.chief_complaint
    ).join(departments, token_records.c.department_id == departments.c.department_id)\
     .join(visit_sessions, token_records.c.session_id == visit_sessions.c.session_id)\
     .outerjoin(clinical_summaries, token_records.c.session_id == clinical_summaries.c.session_id)\
     .where(token_records.c.patient_id == patient_id)\
     .order_by(token_records.c.issued_at.desc()).limit(1)

    parchi_row = (await db.execute(q_t)).fetchone()
    if not parchi_row:
        raise HTTPException(status_code=404, detail="No active OPD token found for patient")

    return {
        "hospital_name": "All India Institute of Ayurveda / OPD Central",
        "parchi_title": "DIGITAL OPD REGISTRATION SLIP",
        "patient_id": patient.patient_id,
        "patient_name": patient.full_name,
        "gender": patient.gender,
        "token_number": parchi_row.token_number,
        "department": parchi_row.department_name,
        "assigned_room": parchi_row.assigned_room,
        "priority_tier": parchi_row.priority_tier,
        "chief_complaint": parchi_row.chief_complaint or "General Consultation",
        "signed_qr_token": parchi_row.signed_qr_token,
        "issued_at": parchi_row.issued_at.isoformat() if parchi_row.issued_at else None
    }
