from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, select, insert
import jwt

from app.db.session import get_db
from app.models.schemas import (
    patients,
    visit_sessions,
    clinical_summaries,
    medical_documents,
    token_records,
    consent_records,
    triage_alerts,
    dpdp_data_requests,
    audit_logs
)
from app.core.config import settings
from app.core.security import verify_access_token
from app.engines.timeline_engine import build_patient_timeline

router = APIRouter(prefix="/patient", tags=["Patient Portal & DPDP Rights"])

class MergeTemporaryPatientRequest(BaseModel):
    temp_patient_id: str = Field(..., json_schema_extra={"example": "TEMP-98412"})
    verified_patient_id: str = Field(..., json_schema_extra={"example": "PAT-102948"})
    verification_session_token: Optional[str] = Field(None, description="Single-use OTP verification token")

class DPDPDataRequest(BaseModel):
    patient_id: str
    request_type: str = Field(..., description="CORRECTION | ERASURE | ACCESS_LOG")
    payload: Optional[dict] = None

@router.post("/merge-temporary-record")
async def merge_temporary_patient(req: MergeTemporaryPatientRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Atomic Temporary Walk-in Record Merge across ALL 6 referencing tables:
    visit_sessions, clinical_summaries, medical_documents, token_records, consent_records, triage_alerts.
    """
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "UNKNOWN")

    # 1. Verify Source is Temporary
    q_temp = select(patients).where(patients.c.patient_id == req.temp_patient_id)
    temp_patient = (await db.execute(q_temp)).fetchone()
    if not temp_patient or not temp_patient.is_temporary:
        raise HTTPException(status_code=400, detail="Source record is not a valid temporary patient")

    # 2. Verify Target is Permanent
    q_perm = select(patients).where(patients.c.patient_id == req.verified_patient_id)
    perm_patient = (await db.execute(q_perm)).fetchone()
    if not perm_patient or perm_patient.is_temporary:
        raise HTTPException(status_code=400, detail="Target record is not a valid permanent patient")

    # 3. Atomic Foreign Key Migration across ALL 6 referencing tables
    await db.execute(update(visit_sessions).where(visit_sessions.c.patient_id == req.temp_patient_id).values(patient_id=req.verified_patient_id))
    await db.execute(update(clinical_summaries).where(clinical_summaries.c.patient_id == req.temp_patient_id).values(patient_id=req.verified_patient_id))
    await db.execute(update(medical_documents).where(medical_documents.c.patient_id == req.temp_patient_id).values(patient_id=req.verified_patient_id))
    await db.execute(update(token_records).where(token_records.c.patient_id == req.temp_patient_id).values(patient_id=req.verified_patient_id))
    await db.execute(update(consent_records).where(consent_records.c.patient_id == req.temp_patient_id).values(patient_id=req.verified_patient_id))
    await db.execute(update(triage_alerts).where(triage_alerts.c.patient_id == req.temp_patient_id).values(patient_id=req.verified_patient_id))

    # 4. Archive Temporary Patient Record
    await db.execute(
        update(patients)
        .where(patients.c.patient_id == req.temp_patient_id)
        .values(is_temporary=False, is_archived=True, merged_into=req.verified_patient_id)
    )

    # 5. Append Audit Log
    await db.execute(audit_logs.insert().values(
        event_type="PATIENT_RECORD_MERGE",
        user_id=req.verified_patient_id,
        user_role="PATIENT",
        target_patient_id=req.verified_patient_id,
        ip_address=client_ip,
        action_details={"temp_id": req.temp_patient_id, "merged_into": req.verified_patient_id},
        status="SUCCESS"
    ))

    await db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Temporary record {req.temp_patient_id} successfully merged into {req.verified_patient_id}",
        "target_patient_id": req.verified_patient_id
    }

@router.get("/consent-history")
async def get_consent_history(patient_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns complete DPDP consent history for the patient.
    """
    res = await db.execute(
        select(consent_records)
        .where(consent_records.c.patient_id == patient_id)
        .order_by(consent_records.c.timestamp.desc())
    )
    return [dict(r._mapping) for r in res.fetchall()]

@router.post("/data-erasure-request")
async def request_data_erasure(req: DPDPDataRequest, db: AsyncSession = Depends(get_db)):
    """
    DPDP Act 2023: Registers Right to Data Erasure / Consent Revocation request.
    """
    await db.execute(dpdp_data_requests.insert().values(
        patient_id=req.patient_id,
        request_type=req.request_type,
        status="PENDING",
        payload=req.payload or {}
    ))
    await db.commit()

    return {
        "status": "PENDING",
        "message": f"DPDP {req.request_type} request successfully registered and logged."
    }

@router.get("/records/{patient_id}")
async def get_patient_portal_records(patient_id: str, db: AsyncSession = Depends(get_db)):
    """
    Longitudinal records overview for the patient self-service portal.
    """
    q_p = select(patients).where(patients.c.patient_id == patient_id).where(patients.c.is_archived == False)
    patient = (await db.execute(q_p)).fetchone()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    timeline = await build_patient_timeline(patient_id, db)

    return {
        "patient": {
            "patient_id": patient.patient_id,
            "full_name": patient.full_name,
            "gender": patient.gender,
            "birth_year": patient.birth_year,
            "abha_address": patient.abha_address
        },
        "timeline": timeline
    }
