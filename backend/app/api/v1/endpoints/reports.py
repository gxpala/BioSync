import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.rbac import get_current_user
from app.models.all_models import DailyAttendance, RawAttendancePunch, Device, Employee, Client, Branch, User, UserRole

router = APIRouter()

@router.get("/data")
def get_report_data(
    report_type: str = Query(..., description="daily, monthly, late, absent, device_sync, raw_punches"),
    client_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_client_id = client_id
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        target_client_id = current_user.client_id

    if report_type in ["daily", "late", "absent", "monthly"]:
        q = db.query(DailyAttendance)
        if target_client_id:
            q = q.filter(DailyAttendance.client_id == target_client_id)
        if branch_id:
            q = q.filter(DailyAttendance.branch_id == branch_id)
        if employee_id:
            q = q.filter(DailyAttendance.employee_id == employee_id)
        if start_date:
            q = q.filter(DailyAttendance.attendance_date >= start_date)
        if end_date:
            q = q.filter(DailyAttendance.attendance_date <= end_date)

        if report_type == "late":
            q = q.filter(DailyAttendance.status == "Late")
        elif report_type == "absent":
            q = q.filter(DailyAttendance.status == "Absent")

        records = q.order_by(DailyAttendance.attendance_date.desc()).limit(500).all()
        result = []
        for r in records:
            emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
            cli = db.query(Client).filter(Client.id == r.client_id).first()
            br = db.query(Branch).filter(Branch.id == r.branch_id).first()
            result.append({
                "id": r.id,
                "client": cli.client_name if cli else "N/A",
                "branch": br.branch_name if br else "N/A",
                "employee_code": emp.employee_code if emp else "N/A",
                "employee_name": emp.employee_name if emp else "N/A",
                "department": emp.department if emp else "N/A",
                "attendance_date": r.attendance_date,
                "first_in": r.first_in or "-",
                "last_out": r.last_out or "-",
                "working_hours": r.total_working_hours,
                "status": r.status,
                "late_minutes": r.late_minutes
            })
        return {"report_type": report_type, "count": len(result), "data": result}

    elif report_type == "device_sync":
        q = db.query(Device)
        if target_client_id:
            q = q.filter(Device.client_id == target_client_id)
        devices = q.all()
        result = []
        for d in devices:
            cli = db.query(Client).filter(Client.id == d.client_id).first()
            br = db.query(Branch).filter(Branch.id == d.branch_id).first()
            result.append({
                "device_name": d.device_name,
                "brand": d.brand,
                "serial_number": d.serial_number,
                "client": cli.client_name if cli else "N/A",
                "branch": br.branch_name if br else "N/A",
                "status": d.status,
                "protocol_driver": d.protocol_driver,
                "last_seen": d.last_seen.isoformat() if d.last_seen else "-",
                "last_successful_sync": d.last_successful_sync.isoformat() if d.last_successful_sync else "-"
            })
        return {"report_type": report_type, "count": len(result), "data": result}

    elif report_type == "raw_punches":
        q = db.query(RawAttendancePunch)
        if target_client_id:
            q = q.filter(RawAttendancePunch.client_id == target_client_id)
        if start_date:
            q = q.filter(RawAttendancePunch.punch_date >= start_date)
        if end_date:
            q = q.filter(RawAttendancePunch.punch_date <= end_date)

        punches = q.order_by(RawAttendancePunch.punch_timestamp.desc()).limit(500).all()
        result = []
        for p in punches:
            emp = db.query(Employee).filter(Employee.id == p.employee_id).first() if p.employee_id else None
            cli = db.query(Client).filter(Client.id == p.client_id).first()
            result.append({
                "id": p.id,
                "client": cli.client_name if cli else "N/A",
                "device_serial": p.device_serial,
                "device_user_id": p.device_user_id,
                "employee": emp.employee_name if emp else "Unmapped",
                "punch_timestamp": p.punch_timestamp.isoformat(),
                "source": p.source,
                "unique_hash": p.unique_hash
            })
        return {"report_type": report_type, "count": len(result), "data": result}

    raise HTTPException(status_code=400, detail="Unsupported report type")

@router.get("/export-csv")
def export_report_csv(
    report_type: str = Query(...),
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report_res = get_report_data(report_type, client_id=client_id, db=db, current_user=current_user)
    data = report_res.get("data", [])

    output = io.StringIO()
    if data:
        fieldnames = list(data[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for row in data:
            writer.writerow(row)

    csv_content = output.getvalue()
    filename = f"mabicons_{report_type}_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
