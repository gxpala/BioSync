from fastapi import APIRouter, Request, Depends, HTTPException, Query
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.all_models import Device, RawAttendancePunch, Employee, EmployeeDeviceMapping, Shift
from app.device_integration.adapters.adms_push import ADMSPushDriver
from app.attendance_engine.deduplication import generate_punch_hash
from app.attendance_engine.processor import process_daily_attendance_for_employee

router = APIRouter()
adms_driver = ADMSPushDriver()

@router.get("/iclock/cdata")
@router.post("/iclock/cdata")
async def adms_iclock_listener(
    request: Request,
    SN: Optional[str] = Query(None),
    table: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Standard ADMS / iClock Cloud Push Listener.
    Receives incoming push requests from eSSL, ZKTeco, and MORX ADMS hardware devices.
    """
    query_params = dict(request.query_params)
    serial_number = SN or query_params.get("SN") or query_params.get("serial")
    
    body_bytes = await request.body()
    raw_body_str = body_bytes.decode("utf-8", errors="ignore")

    if not serial_number:
        # Check body for serial number
        if "SN=" in raw_body_str:
            for part in raw_body_str.split("&"):
                if part.startswith("SN="):
                    serial_number = part.split("=")[1]

    if not serial_number:
        return "OK" # ADMS protocol handshake response

    dev = db.query(Device).filter(Device.serial_number == serial_number.strip()).first()
    if not dev:
        # Unknown device handshake
        return "OK"

    dev.last_seen = datetime.utcnow()
    dev.status = "Online"

    # Handshake request (e.g. GET /iclock/cdata?SN=XYZ)
    if not raw_body_str and request.method == "GET":
        db.commit()
        return "OK"

    # Normalize payload
    payload_dict = {"raw_text": raw_body_str, "query": query_params}
    normalized_punches = adms_driver.normalize_payload(payload_dict, serial_number)

    inserted_count = 0
    affected_employees = set()

    for p in normalized_punches:
        dev_user_id = str(p.get("device_user_id")).strip()
        ts_str = p.get("timestamp")
        
        try:
            if " " in ts_str:
                ts_dt = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
            else:
                ts_dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        except Exception:
            ts_dt = datetime.utcnow()

        u_hash = generate_punch_hash(dev.id, dev_user_id, ts_dt, "ADMS_PUSH")

        existing = db.query(RawAttendancePunch).filter(RawAttendancePunch.unique_hash == u_hash).first()
        if existing:
            continue

        emp_id = None
        mapping = db.query(EmployeeDeviceMapping).filter(
            EmployeeDeviceMapping.device_id == dev.id,
            EmployeeDeviceMapping.device_user_id == dev_user_id
        ).first()

        if mapping:
            emp_id = mapping.employee_id
        else:
            emp = db.query(Employee).filter(
                Employee.client_id == dev.client_id,
                Employee.default_device_user_id == dev_user_id
            ).first()
            if emp:
                emp_id = emp.id

        raw_punch = RawAttendancePunch(
            client_id=dev.client_id,
            branch_id=dev.branch_id,
            device_id=dev.id,
            device_serial=dev.serial_number,
            employee_id=emp_id,
            device_user_id=dev_user_id,
            punch_date=ts_dt.strftime("%Y-%m-%d"),
            punch_time=ts_dt.strftime("%H:%M:%S"),
            punch_timestamp=ts_dt,
            punch_type=p.get("punch_type", "AUTO"),
            verification_type="ADMS_PUSH",
            source="ADMS_PUSH",
            raw_payload=raw_body_str,
            unique_hash=u_hash,
            sync_status="PROCESSED"
        )
        db.add(raw_punch)
        inserted_count += 1

        if emp_id:
            affected_employees.add((dev.client_id, emp_id, ts_dt.strftime("%Y-%m-%d")))

    dev.last_attendance_received = datetime.utcnow()
    dev.last_successful_sync = datetime.utcnow()
    db.commit()

    # Process attendance engine
    default_shift = db.query(Shift).filter(Shift.client_id == dev.client_id).first()
    for client_id, emp_id, p_date in affected_employees:
        process_daily_attendance_for_employee(db, client_id, emp_id, p_date, default_shift)

    return "OK"
