from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# Token & Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# User
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "CLIENT_ADMIN"
    client_id: Optional[int] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    client_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Client
class ClientCreate(BaseModel):
    client_name: str
    client_code: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str = "ACTIVE"

class ClientOut(BaseModel):
    id: int
    client_name: str
    client_code: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Branch
class BranchCreate(BaseModel):
    client_id: int
    branch_name: str
    branch_code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    timezone: str = "Asia/Kolkata"
    status: str = "ACTIVE"

class BranchOut(BaseModel):
    id: int
    client_id: int
    branch_name: str
    branch_code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    timezone: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Device
class DeviceCreate(BaseModel):
    client_id: int
    branch_id: int
    device_name: str
    brand: str
    model: Optional[str] = None
    serial_number: str
    firmware_version: Optional[str] = None
    local_ip: Optional[str] = None
    port: int = 4370
    mac_address: Optional[str] = None
    connection_type: str = "Ethernet"
    integration_type: str = "Local Connector"
    protocol_driver: str = "unconfigured"
    adms_config: Optional[str] = None
    status: str = "Not Configured"

class DeviceOut(BaseModel):
    id: int
    client_id: int
    branch_id: int
    device_name: str
    brand: str
    model: Optional[str] = None
    serial_number: str
    firmware_version: Optional[str] = None
    local_ip: Optional[str] = None
    port: int
    mac_address: Optional[str] = None
    connection_type: str
    integration_type: str
    protocol_driver: str
    adms_config: Optional[str] = None
    status: str
    last_seen: Optional[datetime] = None
    last_successful_sync: Optional[datetime] = None
    last_attendance_received: Optional[datetime] = None
    error_count: int = 0
    last_error: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Employee & Device Mapping
class EmployeeCreate(BaseModel):
    client_id: int
    branch_id: int
    employee_code: str
    default_device_user_id: Optional[str] = None
    employee_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[str] = None
    status: str = "ACTIVE"

class EmployeeDeviceMappingCreate(BaseModel):
    employee_id: int
    device_id: int
    device_user_id: str

class EmployeeOut(BaseModel):
    id: int
    client_id: int
    branch_id: int
    employee_code: str
    default_device_user_id: Optional[str] = None
    employee_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Shift
class ShiftCreate(BaseModel):
    client_id: int
    shift_name: str
    start_time: str = "09:00"
    end_time: str = "18:00"
    grace_period_minutes: int = 15
    min_working_hours: float = 4.0
    break_duration_minutes: int = 30
    weekly_off_days: str = "Sunday"

class ShiftOut(BaseModel):
    id: int
    client_id: int
    shift_name: str
    start_time: str
    end_time: str
    grace_period_minutes: int
    min_working_hours: float
    break_duration_minutes: int
    weekly_off_days: str

    class Config:
        from_attributes = True

# Raw Punch Ingestion & Out
class RawPunchIngest(BaseModel):
    serial_number: str
    device_user_id: str
    punch_timestamp: str # ISO string or YYYY-MM-DD HH:MM:SS
    punch_type: Optional[str] = "CHECK_IN"
    verification_type: Optional[str] = "FINGERPRINT"
    source: Optional[str] = "LOCAL_CONNECTOR"
    raw_payload: Optional[str] = None

class RawPunchOut(BaseModel):
    id: int
    client_id: int
    branch_id: int
    device_id: int
    device_serial: str
    employee_id: Optional[int] = None
    device_user_id: str
    punch_date: str
    punch_time: str
    punch_timestamp: datetime
    punch_type: str
    verification_type: str
    source: str
    raw_payload: Optional[str] = None
    received_at: datetime
    unique_hash: str

    class Config:
        from_attributes = True

# Daily Attendance
class DailyAttendanceOut(BaseModel):
    id: int
    client_id: int
    branch_id: int
    employee_id: int
    attendance_date: str
    first_in: Optional[str] = None
    last_out: Optional[str] = None
    total_break_minutes: int = 0
    total_working_hours: float = 0.0
    status: str
    late_minutes: int = 0
    early_exit_minutes: int = 0
    remarks: Optional[str] = None
    is_manually_edited: bool = False

    class Config:
        from_attributes = True

# Local Connector Agent API Schemas
class ConnectorRegisterRequest(BaseModel):
    client_code: str
    branch_code: str
    connector_name: str
    machine_name: str
    ip_address: Optional[str] = None
    version: str = "1.0.0"

class ConnectorHeartbeatRequest(BaseModel):
    secret_token: str
    device_statuses: Optional[List[Dict[str, Any]]] = None

class ConnectorPunchBatchRequest(BaseModel):
    secret_token: str
    punches: List[RawPunchIngest]
