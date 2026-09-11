from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import uuid

def serialize_to_fhir_r4_bundle(
    patient_id: str,
    patient_name: str,
    session_id: str,
    chief_complaint: str,
    summary_text: str,
    extracted_labs: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Serializes MediKiosk clinical intake session into an HL7 FHIR R4 standard JSON Bundle.
    Ready for ABDM Health Information Provider (HIP) and Health Information User (HIU) data exchange.
    """
    bundle_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    
    entries = [
        # 1. FHIR Patient Resource
        {
            "fullUrl": f"urn:uuid:patient-{patient_id}",
            "resource": {
                "resourceType": "Patient",
                "id": patient_id,
                "name": [{"use": "official", "text": patient_name}],
                "active": True
            }
        },
        # 2. FHIR Encounter Resource
        {
            "fullUrl": f"urn:uuid:encounter-{session_id}",
            "resource": {
                "resourceType": "Encounter",
                "id": session_id,
                "status": "in-progress",
                "class": {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    "code": "AMB",
                    "display": "ambulatory / OPD"
                },
                "subject": {"reference": f"urn:uuid:patient-{patient_id}"},
                "period": {"start": now_iso}
            }
        },
        # 3. FHIR Condition (Chief Complaint)
        {
            "fullUrl": f"urn:uuid:condition-{session_id}",
            "resource": {
                "resourceType": "Condition",
                "clinicalStatus": {
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
                },
                "verificationStatus": {
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "provisional"}]
                },
                "code": {"text": chief_complaint},
                "subject": {"reference": f"urn:uuid:patient-{patient_id}"}
            }
        },
        # 4. FHIR DocumentReference (Draft Clinical Summary)
        {
            "fullUrl": f"urn:uuid:docref-{session_id}",
            "resource": {
                "resourceType": "DocumentReference",
                "status": "preliminary", # Draft status
                "type": {"text": "Patient-Reported OPD Clinical Intake Summary"},
                "subject": {"reference": f"urn:uuid:patient-{patient_id}"},
                "date": now_iso,
                "description": summary_text
            }
        }
    ]

    # 5. FHIR Observations for extracted lab values
    if extracted_labs:
        for lab in extracted_labs:
            entries.append({
                "fullUrl": f"urn:uuid:observation-{uuid.uuid4()}",
                "resource": {
                    "resourceType": "Observation",
                    "status": "preliminary",
                    "code": {"text": lab.get("standardized_name", "Lab Test")},
                    "subject": {"reference": f"urn:uuid:patient-{patient_id}"},
                    "valueQuantity": {
                        "value": lab.get("value"),
                        "unit": lab.get("unit", "")
                    },
                    "interpretation": [
                        {
                            "coding": [{
                                "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                                "code": "A" if lab.get("is_abnormal") else "N",
                                "display": "Abnormal" if lab.get("is_abnormal") else "Normal"
                            }]
                        }
                    ]
                }
            })

    return {
        "resourceType": "Bundle",
        "id": bundle_id,
        "type": "document",
        "timestamp": now_iso,
        "entry": entries
    }

async def post_bundle_to_hapi_fhir(bundle: Dict[str, Any], fhir_base_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Submits a FHIR R4 Bundle to the HAPI FHIR public server or configured endpoint.
    Handles network errors gracefully with offline fallback metadata.
    """
    import httpx
    from app.core.config import settings
    base_url = fhir_base_url or settings.HAPI_FHIR_BASE_URL

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{base_url}/Bundle",
                json=bundle,
                headers={"Content-Type": "application/fhir+json", "Accept": "application/fhir+json"}
            )
            if resp.status_code in [200, 201]:
                return {
                    "success": True,
                    "status_code": resp.status_code,
                    "fhir_id": resp.json().get("id", bundle.get("id")),
                    "endpoint": base_url,
                    "response": resp.json()
                }
            else:
                return {
                    "success": False,
                    "status_code": resp.status_code,
                    "endpoint": base_url,
                    "error": resp.text[:300]
                }
    except Exception as e:
        return {
            "success": False,
            "status_code": 500,
            "endpoint": base_url,
            "error": f"FHIR sync connection exception: {str(e)}",
            "offline_queued": True
        }

async def get_patient_fhir_record(patient_id: str, fhir_base_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Queries HAPI FHIR server for a patient's FHIR Patient and Observation resources.
    """
    import httpx
    from app.core.config import settings
    base_url = fhir_base_url or settings.HAPI_FHIR_BASE_URL

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{base_url}/Patient/{patient_id}",
                headers={"Accept": "application/fhir+json"}
            )
            if resp.status_code == 200:
                return {"found": True, "patient": resp.json()}
            return {"found": False, "status_code": resp.status_code}
    except Exception as e:
        return {"found": False, "error": str(e)}

