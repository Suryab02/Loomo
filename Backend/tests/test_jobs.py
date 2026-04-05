from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def test_job_crud_and_reminder_flow(client: TestClient, auth_headers: dict[str, str]):
    create_response = client.post(
        "/jobs/",
        headers=auth_headers,
        json={
            "company": "Acme",
            "role": "Backend Engineer",
            "job_description": "Python FastAPI SQL work",
            "platform": "LinkedIn",
        },
    )
    assert create_response.status_code == 200
    job_id = create_response.json()["id"]

    list_response = client.get("/jobs/", headers=auth_headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    update_response = client.patch(
        f"/jobs/{job_id}",
        headers=auth_headers,
        json={
            "status": "applied",
            "applied_date": (datetime.now(timezone.utc) - timedelta(days=8)).isoformat(),
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "applied"

    reminder_response = client.get("/insights/reminders", headers=auth_headers)
    assert reminder_response.status_code == 200
    assert len(reminder_response.json()) == 1

    snooze_response = client.post(
        f"/jobs/{job_id}/reminder-snooze",
        headers=auth_headers,
        json={"days": 7},
    )
    assert snooze_response.status_code == 200

    reminders_after_snooze = client.get("/insights/reminders", headers=auth_headers)
    assert reminders_after_snooze.status_code == 200
    assert reminders_after_snooze.json() == []

    delete_response = client.delete(f"/jobs/{job_id}", headers=auth_headers)
    assert delete_response.status_code == 200


def test_parse_text_endpoint_uses_parser_result(client: TestClient, auth_headers: dict[str, str], monkeypatch):
    monkeypatch.setattr(
        "app.routes.jobs.parse_job_text",
        lambda text: {
            "company": "Parsed Co",
            "role": "AI Engineer",
            "location": "Remote",
            "salary_range": "$100k-$120k",
            "platform": "LinkedIn",
            "job_description": "Parsed summary",
        },
    )

    response = client.post(
        "/jobs/parse-text",
        headers=auth_headers,
        json={"text": "Some messy job text"},
    )

    assert response.status_code == 200
    assert response.json()["company"] == "Parsed Co"
