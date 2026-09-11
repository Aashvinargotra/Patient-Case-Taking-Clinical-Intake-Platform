import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db

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

@pytest.fixture
def api_client():
    return TestClient(app)

def test_health_and_root_endpoints(api_client):
    r_health = api_client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "healthy"

    r_root = api_client.get("/")
    assert r_root.status_code == 200
    assert r_root.json()["docs_url"] == "/docs"

def test_unsupported_auth_type(api_client):
    r = api_client.post("/api/v1/auth/login", json={"auth_type": "INVALID_TYPE"})
    assert r.status_code == 400

def test_missing_credentials_auth(api_client):
    r = api_client.post("/api/v1/auth/login", json={"auth_type": "PATIENT_PASSWORD"})
    assert r.status_code == 400

def test_public_display_endpoint(api_client):
    r = api_client.get("/api/v1/queue/public-display/GEN_MED")
    assert r.status_code == 200
    assert isinstance(r.json(), list)

def test_admin_analytics_overview(api_client):
    r = api_client.get("/api/v1/admin/analytics/overview")
    assert r.status_code == 200
    data = r.json()
    assert "total_intake_sessions" in data
    assert "completion_rate_percentage" in data
