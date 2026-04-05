from fastapi.testclient import TestClient


def test_auth_me_returns_current_user(client: TestClient, auth_headers: dict[str, str]):
    response = client.get("/auth/me", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "tester@example.com"
    assert body["full_name"] == "Test User"


def test_jobs_endpoint_requires_auth(client: TestClient):
    response = client.get("/jobs/")

    assert response.status_code == 403


def test_stats_endpoint_returns_counts(client: TestClient, auth_headers: dict[str, str]):
    client.post(
        "/jobs/",
        headers=auth_headers,
        json={
            "company": "Alpha",
            "role": "Frontend Engineer",
            "job_description": "React TypeScript frontend job",
            "platform": "LinkedIn",
        },
    )
    client.post(
        "/jobs/",
        headers=auth_headers,
        json={
            "company": "Beta",
            "role": "Backend Engineer",
            "job_description": "Python backend api role",
            "platform": "Indeed",
        },
    )

    jobs = client.get("/jobs/", headers=auth_headers).json()["items"]
    first_job_id = jobs[0]["id"]

    client.patch(
        f"/jobs/{first_job_id}",
        headers=auth_headers,
        json={"status": "applied"},
    )

    response = client.get("/insights/stats", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["applied"] == 1
    assert body["wishlist"] == 1


def test_platforms_endpoint_groups_platform_counts(client: TestClient, auth_headers: dict[str, str]):
    client.post(
        "/jobs/",
        headers=auth_headers,
        json={
            "company": "Gamma",
            "role": "Data Engineer",
            "job_description": "Data pipelines",
            "platform": "LinkedIn",
        },
    )
    client.post(
        "/jobs/",
        headers=auth_headers,
        json={
            "company": "Delta",
            "role": "ML Engineer",
            "job_description": "ML systems",
            "platform": "LinkedIn",
        },
    )

    response = client.get("/insights/platforms", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["LinkedIn"] == 2


def test_settings_allows_clearing_api_key(client: TestClient, auth_headers: dict[str, str]):
    save_response = client.put(
        "/auth/settings",
        headers=auth_headers,
        json={"gemini_api_key": "test-key-123"},
    )
    assert save_response.status_code == 200

    clear_response = client.put(
        "/auth/settings",
        headers=auth_headers,
        json={"gemini_api_key": ""},
    )
    assert clear_response.status_code == 200

    me_response = client.get("/auth/me", headers=auth_headers)
    assert me_response.status_code == 200
    assert me_response.json()["gemini_api_key"] is None
