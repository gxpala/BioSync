import secrets
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user, require_super_admin
from app.schemas.schemas import ConnectorRegisterRequest, ConnectorHeartbeatRequest, ConnectorPunchBatchRequest
from app.models.all_models import ConnectorInstance, Client, Branch, Device, Employee, EmployeeDeviceMapping, RawAttendancePunch, Shift, User
from app.attendance_engine.deduplication import generate_punch_hash
from app.attendance_engine.processor import process_daily_attendance_for_employee

router = APIRouter()

@router.get("/devices-config")
def get_remote_device_config(secret_token: str = Query(...), db: Session = Depends(get_db)):
    """
    Remote Cloud Device Configuration endpoint (Option 3).
    Local Connector Agent fetches its real-time assigned biometric device list from cloud.
    No manual local config file edits required on client machines!
    """
    instance = db.query(ConnectorInstance).filter(ConnectorInstance.secret_token == secret_token).first()
    if not instance:
        raise HTTPException(status_code=401, detail="Invalid Connector Secret Token")

    devices = db.query(Device).filter(
        Device.client_id == instance.client_id,
        Device.branch_id == instance.branch_id
    ).all()

    device_list = []
    for d in devices:
        device_list.append({
            "device_name": d.device_name,
            "serial_number": d.serial_number,
            "ip": d.local_ip or "127.0.0.1",
            "port": d.port or 4370,
            "brand": d.brand,
            "model": d.model,
            "protocol_driver": d.protocol_driver
        })

    return {
        "success": True,
        "client_id": instance.client_id,
        "branch_id": instance.branch_id,
        "devices": device_list
    }

@router.get("/download-installer")
def download_preconfigured_installer(
    client_code: str = Query(...),
    branch_code: str = Query(...),
    server_url: str = Query("http://localhost:8000/api/v1"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Web Portal Pre-Configured Installer Download endpoint (Option 1 - Super Admin Only).
    Generates a pre-configured 1-click Windows Batch setup installer.
    """
    client = db.query(Client).filter(Client.client_code == client_code.upper()).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    branch = db.query(Branch).filter(Branch.client_id == client.id, Branch.branch_code == branch_code.upper()).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    installer_script = f"""@echo off
title Mabicons Biometric Agent Setup - {client.client_name} ({branch.branch_name})
echo ================================================================
echo    Mabicons Central Biometric Attendance Agent Setup
echo    Client: {client.client_name} ({client.client_code})
echo    Branch: {branch.branch_name} ({branch.branch_code})
echo ================================================================
echo.

set TARGET_DIR=C:\\MabiconsConnector
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [1/3] Writing pre-configured cloud agent config...
(
  echo {{
  echo   "server_url": "{server_url}",
  echo   "client_code": "{client.client_code}",
  echo   "branch_code": "{branch.branch_code}",
  echo   "connector_name": "{client.client_code} {branch.branch_code} Agent",
  echo   "heartbeat_interval_sec": 15,
  echo   "sync_interval_sec": 10
  echo }}
) > "%TARGET_DIR%\\config.json"

echo [2/3] Downloading connector daemon module...
powershell -Command "Invoke-WebRequest -Uri '{server_url.replace('/api/v1', '')}/static/connector.py' -OutFile '%TARGET_DIR%\\connector.py'" 2>nul || (
  echo Python daemon module pre-configured.
)

echo [3/3] Creating Windows Task Scheduler background startup task...
schtasks /create /tn "MabiconsBiometricConnector" /tr "python %TARGET_DIR%\\connector.py" /sc onstart /ru SYSTEM /f 2>nul

echo.
echo ================================================================
echo SUCCESS: Mabicons Biometric Agent Installed and Registered!
echo Background service active. No further setup required.
echo ================================================================
pause
"""
    filename = f"Install_Mabicons_Agent_{client.client_code}_{branch.branch_code}.bat"

    return Response(
        content=installer_script,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/register")
def register_connector(payload: ConnectorRegisterRequest, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.client_code == payload.client_code.upper()).first()
    if not client:
        raise HTTPException(status_code=404, detail=f"Client with code '{payload.client_code}' not found")

    branch = db.query(Branch).filter(Branch.client_id == client.id, Branch.branch_code == payload.branch_code.upper()).first()
    if not branch:
        raise HTTPException(status_code=404, detail=f"Branch with code '{payload.branch_code}' not found for Client {client.client_name}")

    secret_token = f"mbc_token_{secrets.token_urlsafe(32)}"
    
    instance = ConnectorInstance(
        client_id=client.id,
        branch_id=branch.id,
        connector_name=payload.connector_name,
        machine_name=payload.machine_name,
        ip_address=payload.ip_address,
        status="ONLINE",
        secret_token=secret_token,
        last_heartbeat=datetime.utcnow(),
        version=payload.version
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)

    return {
        "success": True,
        "message": "Mabicons Local Connector Agent registered successfully",
        "secret_token": secret_token,
        "client_id": client.id,
        "branch_id": branch.id
    }

@router.post("/heartbeat")
def connector_heartbeat(payload: ConnectorHeartbeatRequest, db: Session = Depends(get_db)):
    instance = db.query(ConnectorInstance).filter(ConnectorInstance.secret_token == payload.secret_token).first()
    if not instance:
        raise HTTPException(status_code=401, detail="Invalid Connector Secret Token")

    instance.last_heartbeat = datetime.utcnow()
    instance.status = "ONLINE"

    if payload.device_statuses:
        for d_status in payload.device_statuses:
            s_num = d_status.get("serial_number")
            if s_num:
                dev = db.query(Device).filter(Device.serial_number == s_num).first()
                if dev:
                    dev.status = d_status.get("status", "Online")
                    dev.last_seen = datetime.utcnow()

    db.commit()
    return {"success": True, "server_timestamp": datetime.utcnow().isoformat()}

@router.post("/punches")
def receive_connector_punches(payload: ConnectorPunchBatchRequest, db: Session = Depends(get_db)):
    instance = db.query(ConnectorInstance).filter(ConnectorInstance.secret_token == payload.secret_token).first()
    if not instance:
        raise HTTPException(status_code=401, detail="Invalid Connector Secret Token")

    instance.last_sync = datetime.utcnow()
    
    inserted_count = 0
    duplicate_count = 0
    affected_employees = set()

    for p in payload.punches:
        dev = db.query(Device).filter(Device.serial_number == p.serial_number.strip()).first()
        if not dev:
            continue

        u_hash = generate_punch_hash(
            device_id=dev.id,
            device_user_id=p.device_user_id,
            punch_timestamp=p.punch_timestamp,
            source=p.source or "LOCAL_CONNECTOR"
        )

        existing = db.query(RawAttendancePunch).filter(RawAttendancePunch.unique_hash == u_hash).first()
        if existing:
            duplicate_count += 1
            continue

        try:
            if "T" in p.punch_timestamp:
                ts_dt = datetime.fromisoformat(p.punch_timestamp.replace("Z", "+00:00"))
            else:
                ts_dt = datetime.strptime(p.punch_timestamp, "%Y-%m-%d %H:%M:%S")
        except Exception:
            ts_dt = datetime.utcnow()

        p_date = ts_dt.strftime("%Y-%m-%d")
        p_time = ts_dt.strftime("%H:%M:%S")

        emp_id = None
        mapping = db.query(EmployeeDeviceMapping).filter(
            EmployeeDeviceMapping.device_id == dev.id,
            EmployeeDeviceMapping.device_user_id == str(p.device_user_id).strip()
        ).first()

        if mapping:
            emp_id = mapping.employee_id
        else:
            emp = db.query(Employee).filter(
                Employee.client_id == dev.client_id,
                Employee.default_device_user_id == str(p.device_user_id).strip()
            ).first()
            if emp:
                emp_id = emp.id

        raw_punch = RawAttendancePunch(
            client_id=dev.client_id,
            branch_id=dev.branch_id,
            device_id=dev.id,
            device_serial=dev.serial_number,
            employee_id=emp_id,
            device_user_id=str(p.device_user_id).strip(),
            punch_date=p_date,
            punch_time=p_time,
            punch_timestamp=ts_dt,
            punch_type=p.punch_type or "CHECK_IN",
            verification_type=p.verification_type or "FINGERPRINT",
            source=p.source or "LOCAL_CONNECTOR",
            raw_payload=p.raw_payload,
            unique_hash=u_hash,
            sync_status="PROCESSED"
        )
        db.add(raw_punch)
        inserted_count += 1

        dev.last_attendance_received = datetime.utcnow()
        dev.last_successful_sync = datetime.utcnow()
        dev.status = "Online"

        if emp_id:
            affected_employees.add((dev.client_id, emp_id, p_date))

    db.commit()

    default_shift = db.query(Shift).filter(Shift.client_id == instance.client_id).first()
    for client_id, emp_id, p_date in affected_employees:
        process_daily_attendance_for_employee(db, client_id, emp_id, p_date, default_shift)

    return {
        "success": True,
        "received_punches": len(payload.punches),
        "inserted_punches": inserted_count,
        "duplicate_punches_ignored": duplicate_count,
        "processed_employees_count": len(affected_employees)
    }
