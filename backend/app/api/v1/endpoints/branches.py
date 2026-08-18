from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user, require_super_admin, enforce_tenant_isolation
from app.schemas.schemas import BranchCreate, BranchOut
from app.models.all_models import Branch, Client, User, UserRole, AuditLog

router = APIRouter()

@router.get("", response_model=List[BranchOut])
def list_branches(
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Branch)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        if current_user.client_id:
            query = query.filter(Branch.client_id == current_user.client_id)
        else:
            return []
    elif client_id:
        query = query.filter(Branch.client_id == client_id)
        
    return query.all()

@router.post("", response_model=BranchOut, status_code=status.HTTP_201_CREATED)
def create_branch(
    payload: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enforce_tenant_isolation(current_user, payload.client_id)
    client = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Parent Client not found")

    branch = Branch(
        client_id=payload.client_id,
        branch_name=payload.branch_name,
        branch_code=payload.branch_code.upper(),
        address=payload.address,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        timezone=payload.timezone,
        status=payload.status
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="BRANCH_CREATE",
        entity="branches",
        entity_id=str(branch.id),
        metadata_json=f"Created branch {branch.branch_name} for Client ID {payload.client_id}"
    ))
    db.commit()
    return branch
