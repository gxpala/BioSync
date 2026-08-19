from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user, require_super_admin, enforce_tenant_isolation
from app.schemas.schemas import DeviceCreate, DeviceOut
from app.models.all_models import Device, Client, Branch, User, AuditLog
from app.device_integration.registry import DeviceDriverRegistry

router = APIRouter()

@router.get("", response_model=List[DeviceOut])
def list_devices(
    client_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    query = db.query(Device)
    if client_id:
        query = query.filter(Device.client_id == client_id)
    if branch_id:
        query = query.filter(Device.branch_id == branch_id)
    return query.all()

@router.post("", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
def create_device(
    payload: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    client = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Target Client not found")

    branch = db.query(Branch).filter(Branch.id == payload.branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Target Branch not found")

    device = Device(
        client_id=payload.client_id,
        branch_id=payload.branch_id,
        device_name=payload.device_name,
        device_model=payload.device_model,
        serial_number=payload.serial_number.strip(),
        mac_address=payload.mac_address,
        local_ip=payload.local_ip,
        port=payload.port,
        connection_type=payload.connection_type,
        integration_type=payload.integration_type,
        protocol_driver=payload.protocol_driver,
        firmware_version=payload.firmware_version,
        status=payload.status
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DEVICE_REGISTER",
        entity="devices",
        entity_id=str(device.id),
        metadata_json=f"Registered device {device.device_name} ({device.serial_number})"
    ))
    db.commit()
    return device

@router.get("/drivers")
def list_device_drivers(current_user: User = Depends(get_current_user)):
    return DeviceDriverRegistry.list_drivers()

@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_super_admin)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.post("/{device_id}/test-connection")
def test_device_connection(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_super_admin)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    driver = DeviceDriverRegistry.get_driver(device.protocol_driver)
    
    device_config = {
        "local_ip": device.local_ip,
        "port": device.port,
        "serial_number": device.serial_number,
        "mac_address": device.mac_address,
        "connector_status": "ONLINE" if device.status == "Online" else "OFFLINE",
        "last_seen": device.last_seen.isoformat() if device.last_seen else None
    }

    result = driver.test_connection(device_config)
    
    if result.success:
        device.status = "Online"
        device.last_seen = datetime.utcnow()
    else:
        if "not configured" in result.message.lower():
            device.status = "Not Configured"
        else:
            device.status = "Offline"
        device.error_count += 1
        device.last_error = result.message

    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DEVICE_TEST_CONNECTION",
        entity="devices",
        entity_id=str(device.id),
        metadata_json=f"Tested connection for {device.device_name}: {result.message}"
    ))
    db.commit()

    return result.to_dict()

@router.get("/{device_id}/info")
def get_device_info(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_super_admin)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    driver = DeviceDriverRegistry.get_driver(device.protocol_driver)
    device_config = {
        "local_ip": device.local_ip,
        "port": device.port,
        "serial_number": device.serial_number,
        "mac_address": device.mac_address
    }
    result = driver.get_device_info(device_config)
    return result.to_dict()

@router.post("/{device_id}/sync")
def sync_device_attendance(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_super_admin)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    driver = DeviceDriverRegistry.get_driver(device.protocol_driver)
    device_config = {
        "local_ip": device.local_ip,
        "port": device.port,
        "serial_number": device.serial_number,
        "mac_address": device.mac_address
    }
    result = driver.get_attendance(device_config)
    
    if result.success:
        device.last_successful_sync = datetime.utcnow()
        db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DEVICE_SYNC_ATTENDANCE",
        entity="devices",
        entity_id=str(device.id),
        metadata_json=f"Manual attendance sync trigger for {device.device_name}"
    ))
    db.commit()

    return result.to_dict()

@router.delete("/{device_id}", status_code=status.HTTP_200_OK)
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device_name = device.device_name
    serial_number = device.serial_number

    db.delete(device)
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DEVICE_DELETE",
        entity="devices",
        entity_id=str(device_id),
        metadata_json=f"Unregistered device {device_name} ({serial_number})"
    ))
    db.commit()

    return {"message": f"Device {device_name} unregistered successfully"}
