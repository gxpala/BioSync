from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.rbac import get_current_user, enforce_tenant_isolation
from app.schemas.schemas import DailyAttendanceOut
from app.models.all_models import DailyAttendance, Employee, User, UserRole, Shift, AuditLog
from app.attendance_engine.processor import process_daily_attendance_for_employee

router = APIRouter()

@router.get("", response_model=List[DailyAttendanceOut])
def get_daily_attendance(
    client_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    attendance_date: Optional[str] = None, # YYYY-MM-DD
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DailyAttendance)
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        if current_user.client_id:
            query = query.filter(DailyAttendance.client_id == current_user.client_id)
        else:
            return []
    elif client_id:
        query = query.filter(DailyAttendance.client_id == client_id)

    if branch_id:
        query = query.filter(DailyAttendance.branch_id == branch_id)
    if employee_id:
        query = query.filter(DailyAttendance.employee_id == employee_id)
    if attendance_date:
        query = query.filter(DailyAttendance.attendance_date == attendance_date)
    if start_date:
        query = query.filter(DailyAttendance.attendance_date >= start_date)
    if end_date:
        query = query.filter(DailyAttendance.attendance_date <= end_date)
    if status_filter:
        query = query.filter(DailyAttendance.status == status_filter)

    return query.order_by(DailyAttendance.attendance_date.desc(), DailyAttendance.employee_id.asc()).offset(skip).limit(limit).all()

@router.post("/reprocess")
def reprocess_attendance(
    client_id: int,
    target_date: str, # YYYY-MM-DD
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enforce_tenant_isolation(current_user, client_id)

    employees = db.query(Employee).filter(Employee.client_id == client_id, Employee.status == "ACTIVE").all()
    default_shift = db.query(Shift).filter(Shift.client_id == client_id).first()

    processed_count = 0
    for emp in employees:
        process_daily_attendance_for_employee(db, client_id, emp.id, target_date, default_shift)
        processed_count += 1

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="ATTENDANCE_REPROCESS",
        entity="daily_attendance",
        entity_id=f"{client_id}:{target_date}",
        metadata_json=f"Reprocessed daily attendance for {processed_count} employees on {target_date}"
    ))
    db.commit()

    return {"message": f"Successfully reprocessed attendance for {processed_count} employees", "target_date": target_date}
