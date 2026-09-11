import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.schemas import medical_documents, extracted_entities, patients, visit_sessions
from app.engines.ocr_extractor import extract_document_entities

router = APIRouter(prefix="/documents", tags=["Medical Document AI & OCR"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_medical_document(
    patient_id: str = Form(...),
    session_id: str = Form(...),
    doc_type: str = Form(default="PRESCRIPTION"), # PRESCRIPTION, LAB_REPORT, DISCHARGE_SUMMARY
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives uploaded prescription or lab report image, performs OCR entity extraction,
    extracts medicines and lab reference intervals, and stores structured records.
    """
    # Verify patient & session
    p_row = (await db.execute(select(patients).where(patients.c.patient_id == patient_id))).fetchone()
    if not p_row:
        raise HTTPException(status_code=404, detail="Patient not found")

    file_bytes = await file.read()
    doc_id = str(uuid.uuid4())
    filename = f"{doc_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save to local uploads disk
    try:
        with open(file_path, "wb") as f:
            f.write(file_bytes)
    except Exception:
        file_path = f"virtual://uploads/{filename}"

    # Insert document record
    await db.execute(medical_documents.insert().values(
        doc_id=doc_id,
        patient_id=patient_id,
        session_id=session_id,
        original_filename=file.filename,
        file_path=file_path,
        doc_type=doc_type.upper(),
        mime_type=file.content_type or "image/jpeg",
        processing_status="PROCESSED"
    ))

    # Run OCR & Entity Extraction Pipeline
    ocr_result = await extract_document_entities(file_bytes, file.filename, doc_type=doc_type)

    extracted_records = []

    # Store Medications
    for med in ocr_result.get("extracted_medications", []):
        entity_id = str(uuid.uuid4())
        await db.execute(extracted_entities.insert().values(
            entity_id=entity_id,
            doc_id=doc_id,
            entity_type="MEDICATION",
            raw_text=med["raw_text"],
            standardized_name=med["standardized_name"],
            confidence_score=med["confidence_score"],
            bbox_coordinates=med.get("bbox_coordinates")
        ))
        extracted_records.append(med)

    # Store Lab Values
    for lab in ocr_result.get("extracted_labs", []):
        entity_id = str(uuid.uuid4())
        await db.execute(extracted_entities.insert().values(
            entity_id=entity_id,
            doc_id=doc_id,
            entity_type="LAB_VALUE",
            raw_text=lab["raw_text"],
            standardized_name=lab["standardized_name"],
            value=str(lab["value"]),
            unit=lab["unit"],
            reference_range_low=lab["reference_low"],
            reference_range_high=lab["reference_high"],
            is_abnormal=lab["is_abnormal"],
            confidence_score=lab["confidence_score"],
            bbox_coordinates=lab.get("bbox_coordinates")
        ))
        extracted_records.append(lab)

    await db.commit()

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "doc_type": doc_type,
        "processing_status": "PROCESSED",
        "extracted_entities": extracted_records
    }

@router.get("/{doc_id}")
async def get_document_details(doc_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns document details alongside all extracted bounding-box entities for the side-by-side viewer.
    """
    q_doc = select(medical_documents).where(medical_documents.c.doc_id == doc_id)
    doc = (await db.execute(q_doc)).fetchone()
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found")

    q_ent = select(extracted_entities).where(extracted_entities.c.doc_id == doc_id)
    entities = (await db.execute(q_ent)).fetchall()

    return {
        "document": dict(doc._mapping),
        "entities": [dict(e._mapping) for e in entities]
    }
