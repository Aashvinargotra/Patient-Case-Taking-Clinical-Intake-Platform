import pytest
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock
from collections import namedtuple
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db
from app.core.dpdp_shredder import run_dpdp_ephemeral_shredding_cycle

@pytest.fixture(autouse=True)
def override_db_dependency():
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.fetchall.return_value = []
    mock_result.fetchone.return_value = None
    mock_result.scalar.return_value = 0
    mock_session.execute.return_value = mock_result

    async def mock_get_db_override():
        yield mock_session

    app.dependency_overrides[get_db] = mock_get_db_override
    yield
    app.dependency_overrides.pop(get_db, None)

client = TestClient(app)


def test_dpdp_data_erasure_request_endpoint():
    resp = client.post("/api/v1/patient/data-erasure-request", json={
        "patient_id": "PAT-DEMO-01",
        "request_type": "ERASURE",
        "payload": {"reason": "Revoking consent for clinical intake test data"}
    })
    # Should succeed or return pending status
    assert resp.status_code in [200, 201]
    data = resp.json()
    assert data["status"] == "PENDING"
    assert "ERASURE" in data["message"]

def test_merge_temporary_patient_invalid_source():
    # If source patient does not exist or is invalid
    resp = client.post("/api/v1/patient/merge-temporary-record", json={
        "temp_patient_id": "NON_EXISTENT_TEMP_123",
        "verified_patient_id": "PAT-DEMO-01"
    })
    assert resp.status_code in [400, 404]

@pytest.mark.asyncio
async def test_dpdp_ephemeral_shredding_worker():
    now = datetime.now(timezone.utc)
    stale_time = now - timedelta(minutes=30)
    
    SessionRow = namedtuple("SessionRow", ["session_id", "status", "start_time"])
    mock_stale_session = SessionRow(
        session_id="sess_stale_99",
        status="IN_PROGRESS",
        start_time=stale_time
    )

    mock_db = AsyncMock()
    mock_res_stale = MagicMock()
    mock_res_stale.fetchall.return_value = [mock_stale_session]

    mock_db.execute.return_value = mock_res_stale

    result = await run_dpdp_ephemeral_shredding_cycle(
        db=mock_db,
        inactivity_threshold_minutes=15
    )

    assert result["shredded_sessions_count"] == 1
    assert result["status"] == "COMPLETED"
    mock_db.commit.assert_called_once()
