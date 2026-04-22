from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_root():
    res = client.get("/")
    assert res.status_code == 200

def test_parse_txt_summary():
    content = b"John Smith signed the contract on 12 March 2024 for $5000 with Acme Corp."
    res = client.post("/api/v1/parse",
        files={"file": ("test.txt", content, "text/plain")},
        data={"mode": "summary"}
    )
    assert res.status_code == 200
    assert "summary" in res.json()

def test_parse_txt_entities():
    content = b"John Smith signed the contract on 12 March 2024 for $5000 with Acme Corp."
    res = client.post("/api/v1/parse",
        files={"file": ("test.txt", content, "text/plain")},
        data={"mode": "entities"}
    )
    assert res.status_code == 200
    assert "entities" in res.json()

def test_parse_txt_classify():
    content = b"Invoice Number: INV-001. Total Amount: $5000. Due Date: 30 March 2024."
    res = client.post("/api/v1/parse",
        files={"file": ("test.txt", content, "text/plain")},
        data={"mode": "classify"}
    )
    assert res.status_code == 200
    assert "classification" in res.json()