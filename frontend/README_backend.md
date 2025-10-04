# Expense Management System Backend

A Flask-based backend for an expense management system with multi-currency support, approval flows, and audit logging.

## Features

- **Multi-currency support** with automatic currency assignment from country codes
- **Role-based access control** (admin, manager, employee)
- **Flexible approval flows** with sequential, specific approver, and percentage-based rules
- **Comprehensive audit logging** for all actions
- **JWT-based authentication**
- **RESTful API design**

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL
- pip

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your database credentials and secret keys
```

4. Create PostgreSQL database:
```sql
CREATE DATABASE hackathon_db;
```

5. Run the application:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /auth/signup` - Create user and company
- `POST /auth/login` - Login and get JWT token

### Users
- `POST /users` - Create user (admin only)
- `GET /users` - List users in company

### Expenses
- `POST /expenses` - Submit expense
- `GET /expenses` - List expenses (with filters)
- `POST /expenses/<id>/approve` - Approve/reject expense

### Approval Flows
- `POST /flows` - Create/update approval flow (admin only)
- `GET /flows` - Get company's approval flow

### Audit
# Expense Management API

This README documents the HTTP endpoints, request/response examples, and data models for the Expense Management API in this repository.

## Authentication
- Uses JWT access tokens (flask_jwt_extended).
- After signup or login the API returns an `access_token` (Bearer token).
- Include in requests: `Authorization: Bearer <access_token>`.
- Tokens now encode the `sub` (subject) claim as a string. Server code expects `sub` to be a string and converts it to an integer internally when resolving the user.

---

## Endpoints

### POST /auth/signup
Create a company and initial admin user, returns an access token.

Request JSON (required fields):
```json
{
  "email": "admin@example.com",
  "password": "secret",
  "full_name": "Admin Name",
  "company_name": "Example Co",
  "country_code": "US"
}
```
Response (201):
```json
{
  "message": "User and company created successfully",
  "access_token": "<JWT token>",
  "user": {"id": 1, "email": "admin@example.com", "full_name": "Admin Name", "role": "admin", "company_id": 1}
}
```
Errors: 400 for validation errors, 500 for server errors.

---

### POST /auth/login
Authenticate user and return an access token.

Request JSON (required fields):
```json
{ "email": "admin@example.com", "password": "secret" }
```
Response (200):
```json
{
  "access_token": "<JWT token>",
  "user": {"id": 1, "email": "admin@example.com", "full_name": "Admin Name", "role": "admin", "company_id": 1}
}
```
Errors: 400 for missing fields, 401 for invalid credentials, 500 for server errors.

---

### POST /users
Create a new user in the same company as the authenticated admin.
- Requires Admin role.

Request headers:
- Authorization: Bearer <access_token>

Request JSON (required fields):
```json
{
  "email": "employee@example.com",
  "password": "secret",
  "full_name": "Employee Name",
  "role": "employee",         // one of "admin", "manager", "employee"
  "manager_id": 2              // optional
}
```
Response (201):
```json
{
  "message": "User created successfully",
  "user": {"id": 3, "email": "employee@example.com", "full_name": "Employee Name", "role": "employee", "company_id": 1}
}
```
Errors: 400 for missing/invalid data, 401 for unauthenticated, 403 for non-admin, 500 for server errors.

---

### GET /users
List all users in the authenticated user's company.

Request headers:
- Authorization: Bearer <access_token>

Response (200):
```json
{
  "users": [
    {"id": 1, "email": "admin@example.com", "full_name": "Admin Name", "role": "admin", "manager_id": null, "created_at": "2025-10-04T..."},
    {"id": 3, "email": "employee@example.com", "full_name": "Employee", "role": "employee", "manager_id": 2, "created_at": "..."}
  ]
}
```

---

### POST /expenses
Submit a new expense.

Request headers:
- Authorization: Bearer <access_token>

Request JSON (required fields):
```json
{
  "amount": 100.00,
  "currency_code": "USD",
  "description": "Taxi to client meeting",
  "receipt_path": "optional/path/to/receipt.jpg"
}
```
Response (201):
```json
{
  "message": "Expense created successfully",
  "expense": {
    "id": 10,
    "amount": "100.00",
    "currency_code": "USD",
    "amount_converted": "100.00",
    "description": "Taxi to client meeting",
    "status": "pending",
    "created_at": "2025-10-04T..."
  }
}
```
Errors: 400 for missing fields, 401 for unauthenticated, 500 for server errors.

---

### GET /expenses
List expenses in your company. Supports optional query params: `status` and `user_id`.

Request headers:
- Authorization: Bearer <access_token>

Response (200):
```json
{
  "expenses": [
    {"id": 10, "amount": "100.00", "currency_code": "USD", "amount_converted": "100.00", "description": "Taxi", "status": "pending", "submitter_id": 3, "submitter_name": "Employee Name", "created_at": "..."}
  ]
}
```

---

### POST /expenses/<expense_id>/approve
Make an approval decision for an expense (requires a pending approval for the user).

Request headers:
- Authorization: Bearer <access_token>

Request JSON (required fields):
```json
{ "decision": "approved", "comments": "Looks good" }
```
Response (200):
```json
{ "message": "Expense approved successfully", "expense": { "id": 10, "status": "approved" } }
```
Errors: 400 for missing/invalid fields, 403 for invalid approver, 404 if expense not found, 500 for server errors.

---

### POST /flows
Create or update the approval flow for a company (Admin only).

Request headers:
- Authorization: Bearer <access_token>

Request JSON (required):
```json
{ "config": { "sequence": [2,5], "rules": { "specific": 2 } } }
```
- `config` must be a JSON object describing the approval sequence and rules.
Response (201):
```json
{ "message": "Approval flow created successfully", "flow": { "id": 1, "config": { ... }, "created_at": "..." } }
```

---

### GET /flows
Get the current approval flow for the authenticated user's company.

Request headers:
- Authorization: Bearer <access_token>

Response (200):
```json
{ "flow": { "id": 1, "config": {...}, "created_at": "..." } }
```

---

### GET /audit/<expense_id>
Retrieve audit logs for the specified expense (company-level access enforced).

Request headers:
- Authorization: Bearer <access_token>

Response (200):
```json
{
  "audit_logs": [
    { "id": 1, "action": "expense_created", "details": {"amount": "100.00"}, "user_id": 3, "user_name": "Employee", "created_at": "..." }
  ]
}
```

---

## Data Models
(Fields reflect the SQLAlchemy models in `models.py`)

### Company
- id: Integer (PK)
- name: String
- country_code: String(2)
- currency_code: String(3)
- created_at: DateTime
- relationships: users, expenses, approval_flows

### User
- id: Integer (PK)
- company_id: Integer (FK -> companies.id)
- email: String (unique)
- password_hash: String
- full_name: String
- role: Enum ["admin", "manager", "employee"]
- manager_id: Integer (self FK)
- created_at: DateTime
- relationships: manager, submitted_expenses, approvals, audit_logs

### Expense
- id: Integer (PK)
- company_id: Integer (FK -> companies.id)
- submitter_id: Integer (FK -> users.id)
- amount: Numeric(12,2)
- currency_code: String(3)
- amount_converted: Numeric(12,2)
- description: Text
- status: Enum ["pending", "approved", "rejected"] (default pending)
- receipt_path: Text
- created_at/updated_at: DateTime
- relationships: approvals, audit_logs

### ApprovalFlow
- id: Integer
- company_id: Integer (FK)
- config: JSON (e.g. { "sequence": [2,5], "rules": { ... } })
- created_by: Integer (FK -> users.id)
- created_at: DateTime

### Approval
- id: Integer
- expense_id: Integer (FK)
- approver_id: Integer (FK -> users.id)
- decision: Enum ["approved", "rejected", "pending"]
- comments: Text
- acted_at: DateTime
- created_at: DateTime

### AuditLog
- id: Integer
- expense_id: Integer (FK)
- user_id: Integer (FK)
- action: String
- details: JSON
- created_at: DateTime

---

## Common error patterns
- 400: Missing or invalid input fields (JSON schema/validation)
- 401: Missing or invalid authentication
- 403: Access denied (wrong company or insufficient role)
- 404: Resource not found
- 422: (Originally occurred when JWT `sub` claim was an integer) - make sure clients and the server generate tokens where `sub` is a string. This repository has been updated to always create tokens with string `sub` and handle lookups accordingly.

---

## Notes & Next steps
- Consider adding OpenAPI (Swagger) for machine-readable API docs and easier testing.
- Add unit tests that validate tokens encode `sub` as a string and that protected endpoints reject malformed tokens.

---

If you'd like, I can commit this file into the repository (done), or extend it to a full OpenAPI spec (yaml/json) and a Postman collection export for testing. Let me know which you prefer.

