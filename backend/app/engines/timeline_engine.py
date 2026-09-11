from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schemas import visit_sessions, medical_documents, extracted_entities, clinical_summaries

async def build_patient_timeline(patient_id: str, db: AsyncSession) -> List[Dict[str, Any]]:
    """
    Constructs a reverse-chronological longitudinal medical timeline for the patient.
    Aggregates past visit summaries, uploaded prescriptions, and extracted lab reports.
    """
    timeline_events = []

    # 1. Fetch Past Clinical Summaries
    q_summaries = select(clinical_summaries, visit_sessions.c.start_time, visit_sessions.c.assigned_room)\
        .join(visit_sessions, clinical_summaries.c.session_id == visit_sessions.c.session_id)\
        .where(clinical_summaries.c.patient_id == patient_id)\
        .order_by(clinical_summaries.c.generated_at.desc())
    summary_rows = (await db.execute(q_summaries)).fetchall()

    for row in summary_rows:
        timeline_events.append({
            "event_id": row.summary_id,
            "timestamp": row.generated_at.isoformat() if row.generated_at else None,
            "event_type": "OPD_CONSULTATION",
            "title": f"OPD Consultation: {row.chief_complaint}",
            "description": row.draft_summary_text[:180] + "..." if len(row.draft_summary_text) > 180 else row.draft_summary_text,
            "is_draft": row.is_draft,
            "verified_by_doctor_id": row.verified_by_doctor_id,
            "room": row.assigned_room
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
