export type UserRole = 'SUPER_ADMIN' | 'MABICONS_ADMIN' | 'CLIENT_ADMIN' | 'HR_MANAGER' | 'HR_EXECUTIVE' | 'VIEWER';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  client_id?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Client {
  id: number;
  client_name: string;
  client_code: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: number;
  client_id: number;
  branch_name: string;
  branch_code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  timezone: string;
  status: string;
  created_at: string;
}

export interface Device {
  id: number;
  client_id: number;
  branch_id: number;
  device_name: string;
  brand: string;
  model?: string;
  serial_number: string;
  firmware_version?: string;
  local_ip?: string;
  port: number;
  mac_address?: string;
  connection_type: string;
  integration_type: string;
  protocol_driver: string;
  adms_config?: string;
  status: 'Online' | 'Offline' | 'Sync Delayed' | 'Not Configured' | 'Unsupported' | 'Error';
  last_seen?: string;
  last_successful_sync?: string;
  last_attendance_received?: string;
  error_count: number;
  last_error?: string;
  created_at: string;
}

export interface Employee {
  id: number;
  client_id: number;
  branch_id: number;
  employee_code: string;
  default_device_user_id?: string;
  employee_name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  joining_date?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXITED';
  created_at: string;
}

export interface EmployeeDeviceMapping {
  id: number;
  employee_id: number;
  device_id: number;
  device_name?: string;
  device_serial?: string;
  device_user_id: string;
  created_at: string;
}

export interface Shift {
  id: number;
  client_id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  min_working_hours: number;
  break_duration_minutes: number;
  weekly_off_days: string;
}

export interface RawPunch {
  id: number;
  client_id: number;
  branch_id: number;
  device_id: number;
  device_serial: string;
  employee_id?: number;
  device_user_id: string;
  punch_date: string;
  punch_time: string;
  punch_timestamp: string;
  punch_type: string;
  verification_type: string;
  source: string;
  raw_payload?: string;
  received_at: string;
  unique_hash: string;
}

export interface DailyAttendance {
  id: number;
  client_id: number;
  branch_id: number;
  employee_id: number;
  attendance_date: string;
  first_in?: string;
  last_out?: string;
  total_break_minutes: number;
  total_working_hours: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Early Exit' | 'Week Off' | 'Holiday' | 'Miss Punch';
  late_minutes: number;
  early_exit_minutes: number;
  remarks?: string;
  is_manually_edited: boolean;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata_json?: string;
  created_at: string;
}

export interface DriverCatalogItem {
  driver_code: string;
  driver_name: string;
  brand: string;
  is_mock: boolean;
}

export interface DashboardStats {
  summary: {
    total_clients: number;
    active_clients: number;
    total_devices: number;
    online_devices: number;
    offline_devices: number;
    sync_delayed_devices: number;
    not_configured_devices: number;
    total_employees: number;
    today_present: number;
    today_absent: number;
    today_late: number;
    today_half_day: number;
    today_date: string;
  };
  recent_punches: Array<{
    id: number;
    punch_timestamp: string;
    punch_time: string;
    employee_name: string;
    employee_code: string;
    client_name: string;
    device_name: string;
    device_serial: string;
    punch_type: string;
    source: string;
  }>;
}
