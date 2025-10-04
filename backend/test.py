import pytest
from app import app, db
from models import Company, User, Expense, ApprovalFlow, Approval

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

def signup_and_login(client):
    """Helper to create company + admin and return token"""
    res = client.post("/auth/signup", json={
        "name": "TestCo",
        "email": "admin@test.com",
        "password": "secret",
        "country_code": "IN",
        "currency_code": "INR"
    })
    assert res.status_code == 200
    login = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "secret"
    })
    token = login.get_json()["access_token"]
    return token

def test_signup_and_login(client):
    token = signup_and_login(client)
    assert token is not None

def test_create_user(client):
    token = signup_and_login(client)
    res = client.post("/users", json={
        "email": "employee@test.com",
        "full_name": "Test Employee",
        "role": "employee"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

def test_submit_expense(client):
    token = signup_and_login(client)
    # Create employee
    client.post("/users", json={
        "email": "employee@test.com",
        "full_name": "Test Employee",
        "role": "employee"
    }, headers={"Authorization": f"Bearer {token}"})
    # Login as employee
    login = client.post("/auth/login", json={
        "email": "employee@test.com",
        "password": "secret"  # Assume default for hackathon
    })
    emp_token = login.get_json()["access_token"]

    # Submit expense
    res = client.post("/expenses", json={
        "amount": 100,
        "currency_code": "USD",
        "description": "Dinner"
    }, headers={"Authorization": f"Bearer {emp_token}"})
    assert res.status_code == 200

def test_approval_flow(client):
    token = signup_and_login(client)
    # Create manager + employee
    res = client.post("/users", json={
        "email": "manager@test.com", "full_name": "Manager", "role": "manager"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    res = client.post("/users", json={
        "email": "employee@test.com", "full_name": "Employee", "role": "employee"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

    # Create approval flow
    flow = {"sequence": [2], "rules": {"specific": 2}}
    res = client.post("/flows", json=flow, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

    # Login as employee & submit expense
    login = client.post("/auth/login", json={
        "email": "employee@test.com", "password": "secret"
    })
    emp_token = login.get_json()["access_token"]
    res = client.post("/expenses", json={
        "amount": 50,
        "currency_code": "USD",
        "description": "Taxi"
    }, headers={"Authorization": f"Bearer {emp_token}"})
    assert res.status_code == 200
    expense_id = res.get_json()["expense_id"]

    # Manager approves
    login = client.post("/auth/login", json={
        "email": "manager@test.com", "password": "secret"
    })
    mgr_token = login.get_json()["access_token"]
    res = client.post(f"/expenses/{expense_id}/approve", json={
        "decision": "approved"
    }, headers={"Authorization": f"Bearer {mgr_token}"})
    assert res.status_code == 200
