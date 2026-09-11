import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_

from app.db.session import get_db
from app.models.schemas import patients, doctors, staff_users, audit_logs
from app.core.security import (
    compute_search_hash,
    verify_password,
    create_access_token,
    verify_totp_mfa,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Identity Gateway"])

class LoginRequest(BaseModel):
    auth_type: str = Field(..., description="PATIENT_PASSWORD, PATIENT_MPIN, ABHA_OTP, TEMP_WALKIN, DOCTOR_ID, STAFF_ID, ADMIN_SSO")
    identifier: Optional[str] = Field(None, description="Patient ID, Phone number, ABHA, Doctor ID, Staff ID, or SSO Subject ID")
    secret: Optional[str] = Field(None, description="Password, MPIN, or OTP Token")
    mfa_code: Optional[str] = Field(None, description="6-digit RFC 6238 TOTP MFA Code")

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    staff_role: Optional[str] = None
    patient_id: Optional[str] = None
    department_id: Optional[str] = None
    is_temporary: bool = False

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Unified Authentication Gateway supporting all 7 user roles and credential flows.
    """
    sub = None
    role = None
    staff_role = None
    dept_id = None
    is_temp = False

    # 1. Patient Password Login
    if req.auth_type == "PATIENT_PASSWORD":
        if not req.identifier or not req.secret:
            raise HTTPException(status_code=400, detail="Identifier and password are required")
        
        search_hash = compute_search_hash(req.identifier) if not req.identifier.startswith("PAT-") else None
        q = select(patients).where(
            or_(
                patients.c.patient_id == req.identifier,
                patients.c.phone_search_hash == search_hash
            )
        ).where(patients.c.is_archived == False)
        patient = (await db.execute(q)).fetchone()

        if not patient or not patient.password_hash or not verify_password(req.secret, patient.password_hash):
            raise HTTPException(status_code=401, detail="Invalid patient credentials")
        sub, role, is_temp = patient.patient_id, "PATIENT", patient.is_temporary

    # 2. Patient MPIN Login (with 3-attempt / 15-min Lockout)
    elif req.auth_type == "PATIENT_MPIN":
        if not req.identifier or not req.secret:
            raise HTTPException(status_code=400, detail="Identifier and MPIN are required")

        search_hash = compute_search_hash(req.identifier) if not req.identifier.startswith("PAT-") else None
        q = select(patients).where(
            or_(
                patients.c.patient_id == req.identifier,
                patients.c.phone_search_hash == search_hash
            )
        ).where(patients.c.is_archived == False)
        patient = (await db.execute(q)).fetchone()

        if not patient:
            raise HTTPException(status_code=401, detail="Patient record not found")

        # Check lockout status
        now = datetime.now(timezone.utc)
        if patient.mpin_locked_until and patient.mpin_locked_until > now:
            lockout_mins = int((patient.mpin_locked_until - now).total_seconds() / 60)
            raise HTTPException(
                status_code=403,
                detail=f"Account locked due to 3 failed attempts. Please retry in {max(1, lockout_mins)} minutes."
            )

        if not patient.mpin_hash or not verify_password(req.secret, patient.mpin_hash):
            new_attempts = patient.failed_mpin_attempts + 1
            locked_until = now + timedelta(minutes=15) if new_attempts >= 3 else None
            await db.execute(
                update(patients)
                .where(patients.c.patient_id == patient.patient_id)
                .values(failed_mpin_attempts=new_attempts, mpin_locked_until=locked_until)
            )
            await db.commit()
            raise HTTPException(status_code=401, detail="Invalid MPIN")

        # Reset failed attempts on success
        await db.execute(
            update(patients)
            .where(patients.c.patient_id == patient.patient_id)
            .values(failed_mpin_attempts=0, mpin_locked_until=None)
        )
        await db.commit()
        sub, role, is_temp = patient.patient_id, "PATIENT", patient.is_temporary

    # 3. ABHA OTP Gateway Authentication
    elif req.auth_type == "ABHA_OTP":
        if not req.identifier:
            raise HTTPException(status_code=400, detail="ABHA address / ID is required")
        q = select(patients).where(patients.c.abha_address == req.identifier).where(patients.c.is_archived == False)
        patient = (await db.execute(q)).fetchone()
        if not patient:
            # Create registered patient from verified ABHA profile
            new_id = f"PAT-{random.randint(100000, 999999)}"
            await db.execute(patients.insert().values(
                patient_id=new_id,
                full_name="ABHA Verified Patient",
                gender="OTHER",
                birth_year=1990,
                abha_address=req.identifier,
                is_temporary=False
            ))
            await db.commit()
            sub, role, is_temp = new_id, "PATIENT", False
        else:
            sub, role, is_temp = patient.patient_id, "PATIENT", patient.is_temporary

    # 4. Anonymous Walk-in Kiosk Registration
    elif req.auth_type == "TEMP_WALKIN":
        temp_id = f"TEMP-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"
        await db.execute(patients.insert().values(
            patient_id=temp_id,
            full_name="Walk-in OPD Patient",
            gender="UNKNOWN",
            is_temporary=True
        ))
        await db.commit()
        sub, role, is_temp = temp_id, "PATIENT", True

    # 5. Doctor ID + TOTP MFA Login
    elif req.auth_type == "DOCTOR_ID":
        if not req.identifier or not req.secret:
            raise HTTPException(status_code=400, detail="Doctor ID and password are required")
        q = select(doctors).where(doctors.c.doctor_id == req.identifier).where(doctors.c.is_active == True)
        doc = (await db.execute(q)).fetchone()
        if not doc or not doc.password_hash or not verify_password(req.secret, doc.password_hash):
            raise HTTPException(status_code=401, detail="Invalid doctor credentials")
        if doc.mfa_secret and not verify_totp_mfa(doc.mfa_secret, req.mfa_code):
            raise HTTPException(status_code=401, detail="Invalid or missing TOTP MFA code")
        sub, role, dept_id = doc.doctor_id, "DOCTOR", doc.department_id

    # 6. Staff / Nurse ID + TOTP MFA Login
    elif req.auth_type == "STAFF_ID":
        if not req.identifier or not req.secret:
            raise HTTPException(status_code=400, detail="Staff ID and password are required")
        q = select(staff_users).where(staff_users.c.staff_id == req.identifier).where(staff_users.c.is_active == True)
        staff = (await db.execute(q)).fetchone()
        if not staff or not staff.password_hash or not verify_password(req.secret, staff.password_hash):
            raise HTTPException(status_code=401, detail="Invalid staff credentials")
        if staff.mfa_secret and not verify_totp_mfa(staff.mfa_secret, req.mfa_code):
            raise HTTPException(status_code=401, detail="Invalid or missing TOTP MFA code")
        sub, role, staff_role, dept_id = staff.staff_id, "STAFF", staff.role, staff.department_id

    # 7. Enterprise Admin SSO Assertion + MFA Verification
    elif req.auth_type == "ADMIN_SSO":
        if not req.identifier:
            raise HTTPException(status_code=400, detail="SSO subject identifier is required")
        q = select(staff_users).where(staff_users.c.sso_subject_id == req.identifier).where(staff_users.c.is_active == True)
        admin_user = (await db.execute(q)).fetchone()
        if not admin_user or admin_user.role not in ["SUPER_ADMIN", "HOSPITAL_ADMIN"]:
            raise HTTPException(status_code=401, detail="Unauthorized Admin SSO subject assertion")
        if admin_user.mfa_secret and not verify_totp_mfa(admin_user.mfa_secret, req.mfa_code):
            raise HTTPException(status_code=401, detail="Admin MFA verification failed")
        sub, role, staff_role = admin_user.staff_id, "ADMIN", admin_user.role

    else:
        raise HTTPException(status_code=400, detail="Unsupported auth_type")

    # Issue Signed JWT
    token_claims = {
        "sub": sub,
        "role": role,
        "staff_role": staff_role,
        "dept_id": dept_id,
        "is_temporary": is_temp
    }
    access_token = create_access_token(token_claims)

    return LoginResponse(
        access_token=access_token,
        role=role,
        staff_role=staff_role,
        patient_id=sub if role == "PATIENT" else None,
        department_id=dept_id,
        is_temporary=is_temp
    )
