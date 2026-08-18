from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.rbac import get_current_user, enforce_tenant_isolation
from app.schemas.schemas import RawPunchOut
from app.models.all_models import RawAttendancePunch, User, UserRole, Employee, Device, Client, Branch

router = APIRouter()

@router.get("", response_model=List[RawPunchOut])
def get_raw_punches(
    client_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    device_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    start_date: Optional[str] = None, # YYYY-MM-DD
    end_date: Optional[str] = None,   # YYYY-MM-DD
    source_filter: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(RawAttendancePunch)
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        if current_user.client_id:
            query = query.filter(RawAttendancePunch.client_id == current_user.client_id)
        else:
            return []
    elif client_id:
        query = query.filter(RawAttendancePunch.client_id == client_id)

    if branch_id:
        query = query.filter(RawAttendancePunch.branch_id == branch_id)
    if device_id:
        query = query.filter(RawAttendancePunch.device_id == device_id)
    if employee_id:
        query = query.filter(RawAttendancePunch.employee_id == employee_id)
    if start_date:
        query = query.filter(RawAttendancePunch.punch_date >= start_date)
    if end_date:
        query = query.filter(RawAttendancePunch.punch_date <= end_date)
    if source_filter:
        query = query.filter(RawAttendancePunch.source == source_filter)

    return query.order_by(RawAttendancePunch.punch_timestamp.desc()).offset(skip).limit(limit).all()
