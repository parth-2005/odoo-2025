from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import enum

db = SQLAlchemy()

class UserRole(enum.Enum):
    admin = "admin"
    manager = "manager"
    employee = "employee"

class ExpenseStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class ApprovalDecision(enum.Enum):
    approved = "approved"
    rejected = "rejected"
    pending = "pending"

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    country_code = db.Column(db.String(2))
    currency_code = db.Column(db.String(3), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relationships
    users = db.relationship('User', backref='company', lazy=True)
    expenses = db.relationship('Expense', backref='company', lazy=True)
    approval_flows = db.relationship('ApprovalFlow', backref='company', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relationships
    manager = db.relationship('User', remote_side=[id], backref='subordinates')
    submitted_expenses = db.relationship('Expense', backref='submitter', lazy=True)
    approvals = db.relationship('Approval', backref='approver', lazy=True)
    audit_logs = db.relationship('AuditLog', backref='user', lazy=True)

class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    submitter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency_code = db.Column(db.String(3), nullable=False)
    amount_converted = db.Column(db.Numeric(12, 2))  # company currency
    description = db.Column(db.Text)
    status = db.Column(db.Enum(ExpenseStatus), default=ExpenseStatus.pending)
    receipt_path = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    
    # Relationships
    approvals = db.relationship('Approval', backref='expense', lazy=True, cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='expense', lazy=True, cascade='all, delete-orphan')

class ApprovalFlow(db.Model):
    __tablename__ = 'approval_flows'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    config = db.Column(db.JSON, nullable=False)  # { "sequence":[2,5,7], "rules":{...} }
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relationships
    creator = db.relationship('User', backref='created_flows', lazy=True)

class Approval(db.Model):
    __tablename__ = 'approvals'
    
    id = db.Column(db.Integer, primary_key=True)
    expense_id = db.Column(db.Integer, db.ForeignKey('expenses.id'), nullable=False)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    decision = db.Column(db.Enum(ApprovalDecision), default=ApprovalDecision.pending)
    comments = db.Column(db.Text)
    acted_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    expense_id = db.Column(db.Integer, db.ForeignKey('expenses.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    details = db.Column(db.JSON)  # Additional action details
    created_at = db.Column(db.DateTime, server_default=db.func.now())

