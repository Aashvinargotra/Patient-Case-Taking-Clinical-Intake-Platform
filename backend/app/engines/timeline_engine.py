from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schemas import visit_sessions, medical_documents, extracted_entities, clinical_summaries, doctors

async def build_patient_timeline(patient_id: str, db: AsyncSession) -> List[Dict[str, Any]]:
    """
    Constructs a reverse-chronological longitudinal medical timeline for the patient.
    Aggregates past visit summaries, uploaded prescriptions, and extracted lab reports.
    """
    timeline_events = []

    # 1. Fetch Past Clinical Summaries
    q_summaries = select(
        clinical_summaries, 
        visit_sessions.c.start_time, 
        visit_sessions.c.assigned_room,
        visit_sessions.c.department_id,
        visit_sessions.c.hospital_id,
        doctors.c.full_name.label("doctor_name")
    )\
        .join(visit_sessions, clinical_summaries.c.session_id == visit_sessions.c.session_id)\
        .outerjoin(doctors, clinical_summaries.c.verified_by_doctor_id == doctors.c.doctor_id)\
        .where(clinical_summaries.c.patient_id == patient_id)\
        .order_by(clinical_summaries.c.generated_at.desc())
    summary_rows = (await db.execute(q_summaries)).fetchall()

    for row in summary_rows:
        verified_at = getattr(row, "verified_at", None)
        generated_at = getattr(row, "generated_at", None)
        event_time = verified_at or generated_at
        chief_complaint = getattr(row, "chief_complaint", "General OPD") or "General OPD"
        draft_summary_text = getattr(row, "draft_summary_text", "") or ""
        doctor_notes = getattr(row, "doctor_notes", "") or ""
        is_draft = getattr(row, "is_draft", False)
        doc_id = getattr(row, "verified_by_doctor_id", None)
        doc_name = getattr(row, "doctor_name", None)
        dept_id = getattr(row, "department_id", "GEN_MED")
        room = getattr(row, "assigned_room", "Room 101")
        hosp_id = getattr(row, "hospital_id", "AIIMS-DELHI")

        fallback_doc = (
            "Dr. Vikram Malhotra" if doc_id == "DOC-CARDIO-01"
            else ("Dr. Priya Sen" if doc_id == "DOC-GENMED-01"
            else ("Dr. Ananya Sharma" if doc_id == "DOC-AYUSH-01"
            else "Attending Physician"))
        )

        timeline_events.append({
            "event_id": getattr(row, "summary_id", ""),
            "timestamp": event_time.isoformat() if event_time else None,
            "event_type": "OPD_CONSULTATION",
            "title": f"OPD Consultation: {chief_complaint}",
            "chief_complaint": chief_complaint,
            "description": draft_summary_text[:200] + "..." if len(draft_summary_text) > 200 else draft_summary_text,
            "summary_text": draft_summary_text,
            "doctor_notes": doctor_notes,
            "is_draft": is_draft,
            "doctor_id": doc_id,
            "doctor_name": doc_name or fallback_doc,
            "department_id": dept_id,
            "room": room or "Room 101",
            "hospital_id": hosp_id
        })

    # 2. Fetch Uploaded Medical Documents & Extracted Entities
    q_docs = select(medical_documents).where(medical_documents.c.patient_id == patient_id)\
        .order_by(medical_documents.c.uploaded_at.desc())
    doc_rows = (await db.execute(q_docs)).fetchall()

    for doc in doc_rows:
        # Fetch entities for this doc
        q_ent = select(extracted_entities).where(extracted_entities.c.doc_id == doc.doc_id)
        ent_rows = (await db.execute(q_ent)).fetchall()
        entities_summary = ", ".join([f"{e.standardized_name} ({e.value} {e.unit or ''})" if e.value else e.standardized_name for e in ent_rows if e.standardized_name])

        timeline_events.append({
            "event_id": doc.doc_id,
            "timestamp": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            "event_type": doc.doc_type,
            "title": f"Uploaded {doc.doc_type.replace('_', ' ').title()}: {doc.original_filename}",
            "description": entities_summary or "Document processed and indexed.",
            "file_path": doc.file_path,
            "processing_status": doc.processing_status
        })

    # Sort all events reverse-chronologically
    timeline_events.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    return timeline_events
