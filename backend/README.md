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
- `GET /audit/<expense_id>` - View audit logs for expense

## Testing

Import the provided Postman collection (`Expense_Management_API.postman_collection.json`) to test the API endpoints.

### Test Flow

1. **Signup** - Create admin user and company
2. **Login** - Get access token
3. **Create Users** - Add managers and employees
4. **Create Approval Flow** - Set up approval rules
5. **Create Expense** - Submit expense for approval
6. **Approve Expense** - Manager approves/rejects
7. **View Audit** - Check audit logs

## Database Schema

The system uses the following main entities:

- **Company** - Organization with currency settings
- **User** - Users with roles (admin, manager, employee)
- **Expense** - Expense submissions with multi-currency support
- **ApprovalFlow** - JSON-based approval configuration
- **Approval** - Individual approval decisions
- **AuditLog** - Action tracking and audit trail

## Approval Flow Configuration

The approval flow supports three types of rules:

### Sequential Approval
```json
{
  "sequence": [2, 3, 5],
  "rules": {
    "type": "sequential"
  }
}
```

### Specific Approver
```json
{
  "rules": {
    "specific": 2
  }
}
```

### Percentage-based
```json
{
  "rules": {
    "percentage": 0.6
  }
}
```

## Environment Variables

- `SECRET_KEY` - Flask secret key
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - JWT signing key
- `RESTCOUNTRIES_API_URL` - RestCountries API endpoint

## Development

The application is structured as follows:

- `app.py` - Main Flask application
- `models.py` - SQLAlchemy database models
- `routes.py` - API route handlers
- `utils.py` - Utility functions and policy engine

## License

This project is created for hackathon purposes.

