from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user, enforce_tenant_isolation
from app.schemas.schemas import ShiftCreate, ShiftOut
from app.models.all_models import Shift, User, UserRole

router = APIRouter()

@router.get("", response_model=List[ShiftOut])
def list_shifts(
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Shift)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        if current_user.client_id:
            query = query.filter(Shift.client_id == current_user.client_id)
        else:
            return []
    elif client_id:
        query = query.filter(Shift.client_id == client_id)

    return query.all()

@router.post("", response_model=ShiftOut, status_code=status.HTTP_201_CREATED)
def create_shift(
    payload: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enforce_tenant_isolation(current_user, payload.client_id)

    shift = Shift(
        client_id=payload.client_id,
        shift_name=payload.shift_name,
        start_time=payload.start_time,
        end_time=payload.end_time,
        grace_period_minutes=payload.grace_period_minutes,
        min_working_hours=payload.min_working_hours,
        break_duration_minutes=payload.break_duration_minutes,
        weekly_off_days=payload.weekly_off_days
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift
