import requests
import os
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Company, User, Expense, Approval, ApprovalFlow, AuditLog, UserRole, ExpenseStatus, ApprovalDecision
from datetime import datetime

def get_currency_from_country(country_code):
    """Get currency code from country code using RestCountries API"""
    try:
        api_url = os.getenv('RESTCOUNTRIES_API_URL', 'https://restcountries.com/v3.1')
        response = requests.get(f"{api_url}/alpha/{country_code}")
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                currencies = data[0].get('currencies', {})
                if currencies:
                    # Get the first currency code
                    return list(currencies.keys())[0]
    except Exception as e:
        print(f"Error fetching currency: {e}")
    
    # Default to USD if API fails
    return 'USD'

def create_audit_log(expense_id, user_id, action, details=None):
    """Create an audit log entry"""
    audit_log = AuditLog(
        expense_id=expense_id,
        user_id=user_id,
        action=action,
        details=details or {}
    )
    db.session.add(audit_log)
    db.session.commit()
    return audit_log

def evaluate_policy(expense_id):
    """Policy engine to evaluate approval rules"""
    expense = Expense.query.get(expense_id)
    if not expense:
        return False
    
    flow = ApprovalFlow.query.filter_by(company_id=expense.company_id).first()
    if not flow:
        # Default sequential approval if no flow exists
        return False
    
    rules = flow.config.get("rules", {})
    approvals = Approval.query.filter_by(expense_id=expense_id).all()
    
    # Check if expense is already rejected
    if any(a.decision == ApprovalDecision.rejected for a in approvals):
        expense.status = ExpenseStatus.rejected
        db.session.commit()
        create_audit_log(expense_id, None, "expense_rejected", {"reason": "policy_evaluation"})
        return True
    
    # Specific approver rule
    if "specific" in rules:
        specific_id = rules["specific"]
        for approval in approvals:
            if approval.approver_id == specific_id and approval.decision == ApprovalDecision.approved:
                expense.status = ExpenseStatus.approved
                db.session.commit()
                create_audit_log(expense_id, None, "expense_approved", {"reason": "specific_approver"})
                return True
    
    # Percentage rule
    if "percentage" in rules:
        total_approvals = len([a for a in approvals if a.decision != ApprovalDecision.pending])
        approved_count = len([a for a in approvals if a.decision == ApprovalDecision.approved])
        if total_approvals > 0 and (approved_count / total_approvals) >= rules["percentage"]:
            expense.status = ExpenseStatus.approved
            db.session.commit()
            create_audit_log(expense_id, None, "expense_approved", {"reason": "percentage_rule"})
            return True
    
    # Sequential rule (default)
    sequence = flow.config.get("sequence", [])
    if sequence:
        # Check if all required approvers have approved
        sequence_approvals = [a for a in approvals if a.approver_id in sequence]
        approved_sequence = [a for a in sequence_approvals if a.decision == ApprovalDecision.approved]
        
        if len(approved_sequence) == len(sequence):
            expense.status = ExpenseStatus.approved
            db.session.commit()
            create_audit_log(expense_id, None, "expense_approved", {"reason": "sequential_approval"})
            return True
        
        # Find next approver in sequence
        for approver_id in sequence:
            if not any(a.approver_id == approver_id for a in approvals):
                # Create pending approval for next approver
                next_approval = Approval(
                    expense_id=expense.id,
                    approver_id=approver_id
                )
                db.session.add(next_approval)
                db.session.commit()
                create_audit_log(expense_id, None, "approval_assigned", {"approver_id": approver_id})
                return False
    
    return False

def convert_currency(amount, from_currency, to_currency):
    """Simple currency conversion - in production, use a proper currency API"""
    # This is a placeholder - in production, integrate with a currency conversion API
    # For now, return the same amount
    return float(amount)
