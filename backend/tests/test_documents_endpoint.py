def test_render_pilot_agreement_returns_rendered_document(client):
    response = client.post(
        "/api/documents/pilot-agreement/render",
        json={
            "provider": {"companyName": "Acme Inc"},
            "customer": {"companyName": "Globex Corp"},
            "pilotPeriod": "90 days",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Pilot Agreement"
    assert body["partyRoleLabels"] == ["Provider", "Customer"]
    assert any(section["title"] == "Pilot Access" for section in body["sections"])


def test_render_unknown_document_returns_404(client):
    response = client.post("/api/documents/not-a-real-document/render", json={})
    assert response.status_code == 404


def test_render_document_without_generic_renderer_returns_404(client):
    response = client.post("/api/documents/mutual-nda/render", json={})
    assert response.status_code == 404
