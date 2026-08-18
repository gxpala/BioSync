from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.rbac import get_current_user
from app.models.all_models import Client, Device, Employee, DailyAttendance, RawAttendancePunch, User, UserRole

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    client_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_client_id = client_id
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        target_client_id = current_user.client_id

    # Client queries
    clients_q = db.query(Client)
    if target_client_id:
        clients_q = clients_q.filter(Client.id == target_client_id)
    total_clients = clients_q.count()
    active_clients = clients_q.filter(Client.status == "ACTIVE").count()

    # Devices queries
    devices_q = db.query(Device)
    if target_client_id:
        devices_q = devices_q.filter(Device.client_id == target_client_id)
    total_devices = devices_q.count()
    online_devices = devices_q.filter(Device.status == "Online").count()
    offline_devices = devices_q.filter(Device.status == "Offline").count()
    sync_delayed_devices = devices_q.filter(Device.status == "Sync Delayed").count()
    not_configured_devices = devices_q.filter(Device.status == "Not Configured").count()

    # Employees queries
    emp_q = db.query(Employee).filter(Employee.status == "ACTIVE")
    if target_client_id:
        emp_q = emp_q.filter(Employee.client_id == target_client_id)
    total_employees = emp_q.count()

    # Attendance today
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    att_q = db.query(DailyAttendance).filter(DailyAttendance.attendance_date == today_str)
    if target_client_id:
        att_q = att_q.filter(DailyAttendance.client_id == target_client_id)

    today_present = att_q.filter(DailyAttendance.status == "Present").count()
    today_absent = att_q.filter(DailyAttendance.status == "Absent").count()
    today_late = att_q.filter(DailyAttendance.status == "Late").count()
    today_half_day = att_q.filter(DailyAttendance.status == "Half Day").count()

    # Recent 10 punches
    recent_q = db.query(RawAttendancePunch)
    if target_client_id:
        recent_q = recent_q.filter(RawAttendancePunch.client_id == target_client_id)
    recent_punches_db = recent_q.order_by(RawAttendancePunch.punch_timestamp.desc()).limit(10).all()

    recent_punches = []
    for rp in recent_punches_db:
        emp = db.query(Employee).filter(Employee.id == rp.employee_id).first() if rp.employee_id else None
        dev = db.query(Device).filter(Device.id == rp.device_id).first()
        cli = db.query(Client).filter(Client.id == rp.client_id).first()
        recent_punches.append({
            "id": rp.id,
            "punch_timestamp": rp.punch_timestamp.isoformat(),
            "punch_time": rp.punch_time,
            "employee_name": emp.employee_name if emp else f"User #{rp.device_user_id}",
            "employee_code": emp.employee_code if emp else rp.device_user_id,
            "client_name": cli.client_name if cli else "Unknown",
            "device_name": dev.device_name if dev else "Unknown Device",
            "device_serial": rp.device_serial,
            "punch_type": rp.punch_type,
            "source": rp.source
        })

    return {
        "summary": {
            "total_clients": total_clients,
            "active_clients": active_clients,
            "total_devices": total_devices,
            "online_devices": online_devices,
            "offline_devices": offline_devices,
            "sync_delayed_devices": sync_delayed_devices,
            "not_configured_devices": not_configured_devices,
            "total_employees": total_employees,
            "today_present": today_present,
            "today_absent": today_absent,
            "today_late": today_late,
            "today_half_day": today_half_day,
            "today_date": today_str
        },
        "recent_punches": recent_punches
    }
