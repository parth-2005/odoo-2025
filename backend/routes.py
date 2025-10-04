from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Company, User, Expense, Approval, ApprovalFlow, AuditLog, UserRole, ExpenseStatus, ApprovalDecision
from utils import get_currency_from_country, create_audit_log, evaluate_policy, convert_currency
from datetime import datetime
import os

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
users_bp = Blueprint('users', __name__, url_prefix='/users')
expenses_bp = Blueprint('expenses', __name__, url_prefix='/expenses')
flows_bp = Blueprint('flows', __name__, url_prefix='/flows')
audit_bp = Blueprint('audit', __name__, url_prefix='/audit')

# Auth routes
@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name', 'company_name', 'country_code']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User already exists'}), 400
        
        # Get currency from country
        currency_code = get_currency_from_country(data['country_code'])
        
        # Create company
        company = Company(
            name=data['company_name'],
            country_code=data['country_code'],
            currency_code=currency_code
        )
        db.session.add(company)
        db.session.flush()  # Get company ID
        
        # Create admin user
        user = User(
            company_id=company.id,
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            full_name=data['full_name'],
            role=UserRole.admin
        )
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User and company created successfully',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role.value,
                'company_id': company.id
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role.value,
                'company_id': user.company_id
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User routes
@users_bp.route('', methods=['POST'])
@jwt_required()
def create_user():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        if current_user.role != UserRole.admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User already exists'}), 400
        
        # Validate role
        try:
            role = UserRole(data['role'])
        except ValueError:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Create user
        user = User(
            company_id=current_user.company_id,
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            full_name=data['full_name'],
            role=role,
            manager_id=data.get('manager_id')
        )
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role.value,
                'company_id': user.company_id
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('', methods=['GET'])
@jwt_required()
def list_users():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        users = User.query.filter_by(company_id=current_user.company_id).all()
        
        return jsonify({
            'users': [{
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role.value,
                'manager_id': user.manager_id,
                'created_at': user.created_at.isoformat()
            } for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Expense routes
@expenses_bp.route('', methods=['POST'])
@jwt_required()
def create_expense():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'currency_code', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Convert amount to company currency
        company = Company.query.get(current_user.company_id)
        amount_converted = convert_currency(
            data['amount'], 
            data['currency_code'], 
            company.currency_code
        )
        
        # Create expense
        expense = Expense(
            company_id=current_user.company_id,
            submitter_id=current_user.id,
            amount=data['amount'],
            currency_code=data['currency_code'],
            amount_converted=amount_converted,
            description=data['description'],
            receipt_path=data.get('receipt_path')
        )
        db.session.add(expense)
        db.session.commit()
        
        # Create audit log
        create_audit_log(expense.id, current_user.id, 'expense_created', {
            'amount': str(data['amount']),
            'currency': data['currency_code']
        })
        
        # Evaluate policy to assign first approver
        evaluate_policy(expense.id)
        
        return jsonify({
            'message': 'Expense created successfully',
            'expense': {
                'id': expense.id,
                'amount': str(expense.amount),
                'currency_code': expense.currency_code,
                'amount_converted': str(expense.amount_converted),
                'description': expense.description,
                'status': expense.status.value,
                'created_at': expense.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('', methods=['GET'])
@jwt_required()
def list_expenses():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        # Get query parameters
        status = request.args.get('status')
        user_id = request.args.get('user_id')
        
        # Build query
        query = Expense.query.filter_by(company_id=current_user.company_id)
        
        if status:
            try:
                status_enum = ExpenseStatus(status)
                query = query.filter_by(status=status_enum)
            except ValueError:
                return jsonify({'error': 'Invalid status'}), 400
        
        if user_id:
            query = query.filter_by(submitter_id=user_id)
        
        expenses = query.order_by(Expense.created_at.desc()).all()
        
        return jsonify({
            'expenses': [{
                'id': expense.id,
                'amount': str(expense.amount),
                'currency_code': expense.currency_code,
                'amount_converted': str(expense.amount_converted),
                'description': expense.description,
                'status': expense.status.value,
                'submitter_id': expense.submitter_id,
                'submitter_name': expense.submitter.full_name,
                'created_at': expense.created_at.isoformat()
            } for expense in expenses]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/<int:expense_id>/approve', methods=['POST'])
@jwt_required()
def approve_expense(expense_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        data = request.get_json()
        
        if not data.get('decision'):
            return jsonify({'error': 'decision is required'}), 400
        
        # Validate decision
        try:
            decision = ApprovalDecision(data['decision'])
        except ValueError:
            return jsonify({'error': 'Invalid decision'}), 400
        
        # Get expense
        expense = Expense.query.get(expense_id)
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        if expense.company_id != current_user.company_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if user can approve this expense
        approval = Approval.query.filter_by(
            expense_id=expense_id,
            approver_id=current_user_id,
            decision=ApprovalDecision.pending
        ).first()
        
        if not approval:
            return jsonify({'error': 'No pending approval found for this user'}), 403
        
        # Update approval
        approval.decision = decision
        approval.comments = data.get('comments')
        approval.acted_at = datetime.utcnow()
        db.session.commit()
        
        # Create audit log
        create_audit_log(expense_id, current_user.id, 'approval_decision', {
            'decision': decision.value,
            'comments': data.get('comments')
        })
        
        # Evaluate policy
        evaluate_policy(expense_id)
        
        return jsonify({
            'message': f'Expense {decision.value} successfully',
            'expense': {
                'id': expense.id,
                'status': expense.status.value
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Approval flow routes
@flows_bp.route('', methods=['POST'])
@jwt_required()
def create_flow():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        if current_user.role != UserRole.admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        if not data.get('config'):
            return jsonify({'error': 'config is required'}), 400
        
        # Validate config structure
        config = data['config']
        if not isinstance(config, dict):
            return jsonify({'error': 'config must be a JSON object'}), 400
        
        # Create or update flow
        flow = ApprovalFlow.query.filter_by(company_id=current_user.company_id).first()
        
        if flow:
            flow.config = config
            flow.created_by = current_user_id
        else:
            flow = ApprovalFlow(
                company_id=current_user.company_id,
                config=config,
                created_by=current_user_id
            )
            db.session.add(flow)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Approval flow created successfully',
            'flow': {
                'id': flow.id,
                'config': flow.config,
                'created_at': flow.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@flows_bp.route('', methods=['GET'])
@jwt_required()
def get_flow():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        flow = ApprovalFlow.query.filter_by(company_id=current_user.company_id).first()
        
        if not flow:
            return jsonify({'flow': None}), 200
        
        return jsonify({
            'flow': {
                'id': flow.id,
                'config': flow.config,
                'created_at': flow.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Audit routes
@audit_bp.route('/<int:expense_id>', methods=['GET'])
@jwt_required()
def get_audit_logs(expense_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(int(current_user_id))
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        # Get expense
        expense = Expense.query.get(expense_id)
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        if expense.company_id != current_user.company_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get audit logs
        audit_logs = AuditLog.query.filter_by(expense_id=expense_id).order_by(AuditLog.created_at.desc()).all()
        
        return jsonify({
            'audit_logs': [{
                'id': log.id,
                'action': log.action,
                'details': log.details,
                'user_id': log.user_id,
                'user_name': log.user.full_name if log.user else 'System',
                'created_at': log.created_at.isoformat()
            } for log in audit_logs]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Register blueprints
def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(flows_bp)
    app.register_blueprint(audit_bp)

