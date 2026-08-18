from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user, require_super_admin
from app.models.all_models import AuditLog, User

router = APIRouter()

@router.get("")
def list_audit_logs(
    action: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
