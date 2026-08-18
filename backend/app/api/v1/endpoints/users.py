from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user, enforce_tenant_isolation
from app.core.security import get_password_hash
from app.schemas.schemas import UserCreate, UserOut
from app.models.all_models import User, UserRole, Client, AuditLog

router = APIRouter()

@router.get("", response_model=List[UserOut])
def list_users(
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        query = query.filter(User.client_id == current_user.client_id)
    elif client_id:
        query = query.filter(User.client_id == client_id)

    return query.all()

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a portal login ID for an employee or manager.
    Super Admin can create users for any client.
    Client Admin can create HR_MANAGER, HR_EXECUTIVE, or VIEWER users for their own company.
    """
    target_client_id = payload.client_id or current_user.client_id
    if not target_client_id and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        raise HTTPException(status_code=400, detail="Client ID is required")

    enforce_tenant_isolation(current_user, target_client_id)

    # Restrict roles Client Admin can create
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        allowed_roles = [UserRole.CLIENT_ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.VIEWER]
        if payload.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Client Admins can only create HR or Viewer accounts")

    existing = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"User with email '{payload.email}' already exists")

    user = User(
        email=payload.email.strip().lower(),
        full_name=payload.full_name.strip(),
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        client_id=target_client_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="USER_CREATE",
        entity="users",
        entity_id=str(user.id),
        metadata_json=f"Created portal login user {user.email} (Role: {user.role})"
    ))
    db.commit()

    return user
