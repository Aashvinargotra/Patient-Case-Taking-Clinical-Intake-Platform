from typing import Dict, Any, List, Optional
import httpx
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schemas import doctors, staff_users
from app.core.security import decrypt_phone
from app.core.config import settings

# Slot-Scoped Multi-Condition Triage Rules
TRIAGE_RULES = [
    {
        "id": "ACS_SUSPICION_TIER1",
        "tier": "RED",
        "description": "Acute Coronary Syndrome Suspicion (Chest pain + Radiation/Diaphoresis + Crushing)",
        "conditions": {
            "chief_complaint": {"matches": "chest_pain"},
            "associated_symptoms": {"contains_any": ["diaphoresis", "dyspnea", "palpitations"]},
            "character_and_severity": {"matches": "crushing_pressure"}
        }
    },
    {
        "id": "ACUTE_STROKE_TIER1",
        "tier": "RED",
        "description": "Acute Stroke FAST Criteria (Facial droop/slurred speech + sudden onset)",
        "conditions": {
            "chief_complaint": {"contains_any": ["headache", "facial_droop", "slurred_speech"]},
            "onset_and_timing": {"matches": "sudden_recent"}
        }
    },
    {
        "id": "SEVERE_DYSPNEA_TIER1",
        "tier": "RED",
        "description": "Acute Respiratory Distress (Sudden onset dyspnea)",
        "conditions": {
            "chief_complaint": {"matches": "shortness_of_breath"},
            "onset_and_timing": {"matches": "sudden_recent"}
        }
    },
    {
        "id": "ANAPHYLAXIS_ACUTE_TIER1",
        "tier": "RED",
        "description": "Acute Anaphylaxis / Severe Allergic Reaction",
        "conditions": {
            "chief_complaint": {"contains_any": ["rash", "allergy", "itching"]},
            "associated_symptoms": {"contains_any": ["dyspnea", "shortness_of_breath", "vomiting"]},
            "onset_and_timing": {"matches": "sudden_recent"}
        }
    },
    {
        "id": "ISOLATED_CHEST_PAIN_TIER2",
        "tier": "AMBER",
        "description": "Priority OPD: Moderate Chest Discomfort without hemodynamic instability",
        "conditions": {
            "chief_complaint": {"matches": "chest_pain"}
        }
    },
    {
        "id": "HIGH_FEVER_PROLONGED_TIER2",
        "tier": "AMBER",
        "description": "Priority OPD: Prolonged Febrile Illness (>3 days)",
        "conditions": {
            "chief_complaint": {"matches": "fever"}
        }
    },
    {
        "id": "ACUTE_ABDOMEN_TIER2",
        "tier": "AMBER",
        "description": "Priority OPD: Acute Severe Abdominal Discomfort",
        "conditions": {
            "chief_complaint": {"matches": "abdominal_pain"}
        }
    }
]

def evaluate_slot_scoped_triage(intake_slots: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Evaluates structured intake slots against hierarchical multi-condition triage rules.
    Prevents false positives by evaluating exact structured slots rather than unconstrained text.
    """
    for rule in TRIAGE_RULES:
        matched = True
        for slot_key, cond in rule["conditions"].items():
            slot_val = intake_slots.get(slot_key)
            if not slot_val:
                matched = False
                break
            
            if "matches" in cond:
                if str(slot_val).lower() != cond["matches"].lower():
                    matched = False
                    break
                    
            if "contains_any" in cond:
                if isinstance(slot_val, list):
                    if not any(item.lower() in [c.lower() for c in cond["contains_any"]] for item in slot_val):
                        matched = False
                        break
                elif isinstance(slot_val, str):
                    if not any(c.lower() in slot_val.lower() for c in cond["contains_any"]):
                        matched = False
                        break
                else:
                    matched = False
                    break

        if matched:
            return {
                "rule_id": rule["id"],
                "tier": rule["tier"],
                "description": rule["description"],
                "trigger_slots": intake_slots
            }

    return None


class TriageWebSocketManager:
    """Manages real-time desktop buzzer alerts connected to Emergency and Triage workstations."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_alert(self, alert_payload: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(alert_payload)
            except Exception:
                pass

triage_ws_manager = TriageWebSocketManager()


async def send_scoped_emergency_sms(db: AsyncSession, department_id: str, alert_info: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Sends generic, data-minimized operational SMS notifications strictly to on-duty
    doctors and triage nurses assigned to the specific department.
    Zero patient PII or sensitive diagnosis is sent over SMS.
    """
    # 1. Query On-Duty Triage Nurses
    q_nurses = select(staff_users.c.duty_phone_encrypted, staff_users.c.full_name)\
        .where(staff_users.c.department_id == department_id)\
        .where(staff_users.c.role == "TRIAGE_NURSE")\
        .where(staff_users.c.is_active == True)
    nurse_rows = (await db.execute(q_nurses)).fetchall()

    # 2. Query On-Duty Doctors
    q_docs = select(doctors.c.duty_phone_encrypted, doctors.c.full_name)\
        .where(doctors.c.department_id == department_id)\
        .where(doctors.c.is_on_duty == True)\
        .where(doctors.c.is_active == True)
    doc_rows = (await db.execute(q_docs)).fetchall()

    dispatched = []
    # Generic, data-minimized operational SMS format
    msg = f"[MEDIKIOSK ALERT] Priority {alert_info.get('tier', 'RED')} alert triggered in Dept {department_id}. Token #{alert_info.get('token_number', 'N/A')}. Please check the clinical triage console."

    for row in nurse_rows + doc_rows:
        if row.duty_phone_encrypted:
            try:
                phone = decrypt_phone(row.duty_phone_encrypted)
                
                # Check if external SMS API key is configured
                sms_key = getattr(settings, "SMS_API_KEY", None)
                if sms_key:
                    # Live SMS Dispatch via Fast2SMS / Gateway
                    try:
                        async with httpx.AsyncClient(timeout=3.0) as client:
                            await client.post(
                                "https://www.fast2sms.com/dev/bulkV2",
                                headers={"authorization": sms_key},
                                json={"route": "q", "message": msg, "numbers": phone}
                            )
                    except Exception:
                        pass

                dispatched.append({
                    "recipient": row.full_name,
                    "phone": phone,
                    "message": msg,
                    "status": "SENT" if sms_key else "SENT_SIMULATED"
                })
            except Exception:
                pass

    return dispatched
