import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, Time, Enum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    MABICONS_ADMIN = "MABICONS_ADMIN"
    CLIENT_ADMIN = "CLIENT_ADMIN"
    HR_MANAGER = "HR_MANAGER"
    HR_EXECUTIVE = "HR_EXECUTIVE"
    VIEWER = "VIEWER"

class ClientStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"

class DeviceConnectionType(str, enum.Enum):
    ETHERNET = "Ethernet"
    WIFI = "Wi-Fi"
    OTHER = "Other"

class DeviceIntegrationType(str, enum.Enum):
    ADMS_PUSH = "ADMS Push"
    LAN_TCP_IP = "LAN / TCP-IP"
    SDK = "SDK"
    LOCAL_CONNECTOR = "Local Connector"
    EXISTING_SOFTWARE = "Existing Software / Database"
    REST_API = "REST API"
    OTHER = "Other"

class DeviceStatus(str, enum.Enum):
    ONLINE = "Online"
    OFFLINE = "Offline"
    SYNC_DELAYED = "Sync Delayed"
    NOT_CONFIGURED = "Not Configured"
    UNSUPPORTED = "Unsupported"
    ERROR = "Error"

class EmployeeStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    EXITED = "EXITED"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LATE = "Late"
    HALF_DAY = "Half Day"
    EARLY_EXIT = "Early Exit"
    WEEK_OFF = "Week Off"
    HOLIDAY = "Holiday"
    MISS_PUNCH = "Miss Punch"

# User & Auth Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.CLIENT_ADMIN, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="users")

# Multi-Tenant Core Models
class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String(255), index=True, nullable=False)
    client_code = Column(String(50), unique=True, index=True, nullable=False)
    contact_person = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    status = Column(String(50), default=ClientStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    branches = relationship("Branch", back_populates="client", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="client", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="client", cascade="all, delete-orphan")
    users = relationship("User", back_populates="client")
    shifts = relationship("Shift", back_populates="client", cascade="all, delete-orphan")
    connectors = relationship("ConnectorInstance", back_populates="client", cascade="all, delete-orphan")

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_name = Column(String(255), nullable=False)
    branch_code = Column(String(50), nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    timezone = Column(String(50), default="Asia/Kolkata")
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="branches")
    devices = relationship("Device", back_populates="branch", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="branch")

# Device Management Models
class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    device_name = Column(String(255), nullable=False)
    brand = Column(String(100), nullable=False, index=True)  # e.g., eSSL, MORX, ZKTeco, Generic
    model = Column(String(100), nullable=True)
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    firmware_version = Column(String(100), nullable=True)
    local_ip = Column(String(50), nullable=True)
    port = Column(Integer, default=4370)
    mac_address = Column(String(100), nullable=True)
    connection_type = Column(String(50), default=DeviceConnectionType.ETHERNET)
    integration_type = Column(String(50), default=DeviceIntegrationType.LOCAL_CONNECTOR)
    protocol_driver = Column(String(100), default="unconfigured")  # Driver code key
    adms_config = Column(Text, nullable=True)  # JSON config string for ADMS endpoints
    status = Column(String(50), default=DeviceStatus.NOT_CONFIGURED, index=True)
    last_seen = Column(DateTime, nullable=True)
    last_successful_sync = Column(DateTime, nullable=True)
    last_attendance_received = Column(DateTime, nullable=True)
    error_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="devices")
    branch = relationship("Branch", back_populates="devices")
    raw_punches = relationship("RawAttendancePunch", back_populates="device")
    device_mappings = relationship("EmployeeDeviceMapping", back_populates="device")

class DeviceDriver(Base):
    __tablename__ = "device_drivers"

    id = Column(Integer, primary_key=True, index=True)
    driver_code = Column(String(100), unique=True, index=True, nullable=False)
    driver_name = Column(String(255), nullable=False)
    brand = Column(String(100), nullable=False)
    supported_models = Column(String(255), nullable=True)
    integration_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    is_mock = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Employee & Mapping Models
class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_code = Column(String(50), nullable=False, index=True)
    default_device_user_id = Column(String(50), nullable=True)
    employee_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    joining_date = Column(String(20), nullable=True)
    status = Column(String(50), default=EmployeeStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="employees")
    branch = relationship("Branch", back_populates="employees")
    device_mappings = relationship("EmployeeDeviceMapping", back_populates="employee", cascade="all, delete-orphan")
    daily_attendances = relationship("DailyAttendance", back_populates="employee")

class EmployeeDeviceMapping(Base):
    __tablename__ = "employee_device_mappings"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    device_user_id = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="device_mappings")
    device = relationship("Device", back_populates="device_mappings")

    __table_args__ = (
        UniqueConstraint('device_id', 'device_user_id', name='_device_user_unique'),
    )

# Shift Management Model
class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_name = Column(String(100), nullable=False)
    start_time = Column(String(10), default="09:00", nullable=False) # "09:00"
    end_time = Column(String(10), default="18:00", nullable=False)   # "18:00"
    grace_period_minutes = Column(Integer, default=15)
    min_working_hours = Column(Float, default=4.0)
    break_duration_minutes = Column(Integer, default=30)
    weekly_off_days = Column(String(100), default="Sunday") # comma-separated
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="shifts")

# Attendance Core Models
class RawAttendancePunch(Base):
    __tablename__ = "raw_attendance_punches"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    device_serial = Column(String(100), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    device_user_id = Column(String(50), nullable=False, index=True)
    punch_date = Column(String(10), nullable=False, index=True) # YYYY-MM-DD
    punch_time = Column(String(8), nullable=False)              # HH:MM:SS
    punch_timestamp = Column(DateTime, nullable=False, index=True)
    punch_type = Column(String(20), default="CHECK_IN")         # CHECK_IN / CHECK_OUT / AUTO
    verification_type = Column(String(50), default="FINGERPRINT")
    source = Column(String(50), default="LOCAL_CONNECTOR")       # LOCAL_CONNECTOR / ADMS_PUSH / MOCK
    raw_payload = Column(Text, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    unique_hash = Column(String(64), unique=True, index=True, nullable=False)
    sync_status = Column(String(20), default="PROCESSED")

    device = relationship("Device", back_populates="raw_punches")

class DailyAttendance(Base):
    __tablename__ = "daily_attendance"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    attendance_date = Column(String(10), nullable=False, index=True) # YYYY-MM-DD
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True)
    first_in = Column(String(8), nullable=True)
    last_out = Column(String(8), nullable=True)
    total_break_minutes = Column(Integer, default=0)
    total_working_hours = Column(Float, default=0.0)
    status = Column(String(50), default=AttendanceStatus.ABSENT, index=True)
    late_minutes = Column(Integer, default=0)
    early_exit_minutes = Column(Integer, default=0)
    remarks = Column(Text, nullable=True)
    is_manually_edited = Column(Boolean, default=False)
    updated_by_user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="daily_attendances")

    __table_args__ = (
        UniqueConstraint('employee_id', 'attendance_date', name='_employee_date_unique'),
    )

# Local Connector Instance Model
class ConnectorInstance(Base):
    __tablename__ = "connector_instances"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    connector_name = Column(String(100), nullable=False)
    machine_name = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    status = Column(String(50), default="ONLINE", index=True)
    secret_token = Column(String(255), unique=True, index=True, nullable=False)
    last_heartbeat = Column(DateTime, nullable=True)
    last_sync = Column(DateTime, nullable=True)
    error_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    version = Column(String(20), default="1.0.0")
    config_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="connectors")

# Audit & Monitoring Logs
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True) # LOGIN, CLIENT_CREATE, DEVICE_TEST, etc.
    entity = Column(String(100), nullable=True)
    entity_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String(50), nullable=True)
    metadata_json = Column(Text, nullable=True)
