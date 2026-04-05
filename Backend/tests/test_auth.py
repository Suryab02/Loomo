from fastapi.testclient import TestClient


def test_register_returns_user_payload(client: TestClient):
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "password123",
            "full_name": "New User",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == "newuser@example.com"
    assert body["user"]["full_name"] == "New User"


def test_login_rejects_bad_password(client: TestClient):
    client.post(
        "/auth/register",
        json={
            "email": "person@example.com",
            "password": "password123",
            "full_name": "Person Example",
        },
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "person@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"

