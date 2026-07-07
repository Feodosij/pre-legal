def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_signup_creates_user(client):
    response = client.post(
        "/api/auth/signup",
        json={"email": "alice@example.com", "password": "supersecret"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert "id" in body
    assert "password" not in body
    assert "password_hash" not in body


def test_signup_rejects_duplicate_email(client):
    payload = {"email": "bob@example.com", "password": "supersecret"}
    first = client.post("/api/auth/signup", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/signup", json=payload)
    assert second.status_code == 409


def test_signup_rejects_short_password(client):
    response = client.post(
        "/api/auth/signup",
        json={"email": "carol@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_signin_with_correct_credentials(client):
    client.post(
        "/api/auth/signup",
        json={"email": "dave@example.com", "password": "supersecret"},
    )

    response = client.post(
        "/api/auth/signin",
        json={"email": "dave@example.com", "password": "supersecret"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "dave@example.com"


def test_signin_with_wrong_password(client):
    client.post(
        "/api/auth/signup",
        json={"email": "erin@example.com", "password": "supersecret"},
    )

    response = client.post(
        "/api/auth/signin",
        json={"email": "erin@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_signin_with_unknown_email(client):
    response = client.post(
        "/api/auth/signin",
        json={"email": "nobody@example.com", "password": "whatever"},
    )
    assert response.status_code == 401
