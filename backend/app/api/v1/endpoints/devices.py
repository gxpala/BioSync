from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.rbac import get_current_user, require_super_admin
from app.schemas.schemas import DeviceCreate, DeviceOut
from app.models.all_models import Device, Client, Branch, User, UserRole, AuditLog
from app.device_integration.registry import DeviceDriverRegistry

router = APIRouter()

@router.get("/drivers")
def get_registered_drivers(current_user: User = Depends(require_super_admin)):
    """Returns catalog of registered driver adapters in the system (Super Admin Only)."""
    return DeviceDriverRegistry.list_drivers()

@router.get("", response_model=List[DeviceOut])
def list_devices(
    client_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    brand_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    query = db.query(Device)
    if client_id:
        query = query.filter(Device.client_id == client_id)
    if branch_id:
        query = query.filter(Device.branch_id == branch_id)
    if status_filter:
        query = query.filter(Device.status == status_filter)
    if brand_filter:
        query = query.filter(Device.brand.ilike(f"%{brand_filter}%"))

    return query.all()

@router.post("", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
def create_device(
    payload: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    existing = db.query(Device).filter(Device.serial_number == payload.serial_number.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Device with this Serial Number already registered")

    device = Device(
        client_id=payload.client_id,
        branch_id=payload.branch_id,
        device_name=payload.device_name,
        brand=payload.brand,
        model=payload.model,
        serial_number=payload.serial_number.strip(),
        firmware_version=payload.firmware_version,
        local_ip=payload.local_ip,
        port=payload.port,
        mac_address=payload.mac_address,
        connection_type=payload.connection_type,
        integration_type=payload.integration_type,
        protocol_driver=payload.protocol_driver,
        adms_config=payload.adms_config,
        status=payload.status
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DEVICE_ADD",
        entity="devices",
        entity_id=str(device.id),
        metadata_json=f"Added device {device.device_name} (S/N: {device.serial_number}, Driver: {device.protocol_driver})"
    ))
    db.commit()
    return device

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
    device_config = {"local_ip": device.local_ip, "port": device.port, "serial_number": device.serial_number}
    result = driver.sync_attendance(device_config)

    if result.success:
        device.last_successful_sync = datetime.utcnow()
        db.commit()

    return result.to_dict()
