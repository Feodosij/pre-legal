def _signed_in_client(client, email="doc-user@example.com"):
    client.post("/api/auth/signup", json={"email": email, "password": "supersecret"})
    return client


def test_create_document_requires_authentication(client):
    response = client.post(
        "/api/documents",
        json={"documentId": "mutual-nda", "fields": {}, "isComplete": False},
    )
    assert response.status_code == 401


def test_create_and_list_document(client):
    _signed_in_client(client)

    create = client.post(
        "/api/documents",
        json={
            "documentId": "mutual-nda",
            "fields": {
                "partyOne": {"companyName": "Acme AI Inc"},
                "partyTwo": {"companyName": "Beta Corp"},
            },
            "isComplete": False,
        },
    )
    assert create.status_code == 201
    body = create.json()
    assert body["documentId"] == "mutual-nda"
    assert body["title"] == "Mutual Non-Disclosure Agreement: Acme AI Inc & Beta Corp"
    assert body["isComplete"] is False

    listing = client.get("/api/documents")
    assert listing.status_code == 200
    ids = [item["id"] for item in listing.json()]
    assert body["id"] in ids


def test_documents_are_scoped_to_the_owning_user(client):
    _signed_in_client(client, "owner@example.com")
    created = client.post(
        "/api/documents", json={"documentId": "mutual-nda", "fields": {}, "isComplete": False}
    ).json()

    client.cookies.clear()
    _signed_in_client(client, "other@example.com")

    listing = client.get("/api/documents")
    assert listing.json() == []

    get_response = client.get(f"/api/documents/{created['id']}")
    assert get_response.status_code == 404

    update_response = client.put(
        f"/api/documents/{created['id']}", json={"fields": {}, "isComplete": True}
    )
    assert update_response.status_code == 404


def test_update_document_changes_fields_and_title(client):
    _signed_in_client(client)
    created = client.post(
        "/api/documents",
        json={"documentId": "mutual-nda", "fields": {}, "isComplete": False},
    ).json()

    updated = client.put(
        f"/api/documents/{created['id']}",
        json={
            "fields": {"partyOne": {"companyName": "Acme AI Inc"}},
            "isComplete": True,
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["isComplete"] is True
    assert "Acme AI Inc" in body["title"]


def test_create_document_rejects_unknown_document_id(client):
    _signed_in_client(client)
    response = client.post(
        "/api/documents", json={"documentId": "not-a-real-document", "fields": {}}
    )
    assert response.status_code == 400
