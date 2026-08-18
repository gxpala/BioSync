from datetime import datetime, time, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.all_models import RawAttendancePunch, DailyAttendance, Shift, Employee, AttendanceStatus

def parse_time_str(t_str: str) -> time:
    """Parses '09:00' or '09:00:00' into datetime.time object."""
    parts = [int(p) for p in t_str.split(":")]
    return time(hour=parts[0], minute=parts[1], second=parts[2] if len(parts) > 2 else 0)

def process_daily_attendance_for_employee(
    db: Session,
    client_id: int,
    employee_id: int,
    attendance_date: str, # YYYY-MM-DD
    shift: Optional[Shift] = None
) -> DailyAttendance:
    """
    Modular Attendance Processing Engine.
    Converts raw biometric punches into structured daily attendance records.
    """
    # 1. Fetch all raw punches for employee on this date
    punches = (
        db.query(RawAttendancePunch)
        .filter(
            RawAttendancePunch.client_id == client_id,
            RawAttendancePunch.employee_id == employee_id,
            RawAttendancePunch.punch_date == attendance_date
        )
        .order_by(RawAttendancePunch.punch_timestamp.asc())
        .all()
    )

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    branch_id = employee.branch_id if employee else 1

    # Default Shift Settings if no shift is explicitly supplied
    shift_start_str = shift.start_time if shift else "09:00"
    shift_end_str = shift.end_time if shift else "18:00"
    grace_mins = shift.grace_period_minutes if shift else 15
    min_hours = shift.min_working_hours if shift else 4.0
    break_mins = shift.break_duration_minutes if shift else 30
    shift_id = shift.id if shift else None

    # Handle No Punches
    if not punches:
        existing = db.query(DailyAttendance).filter(
            DailyAttendance.employee_id == employee_id,
            DailyAttendance.attendance_date == attendance_date
        ).first()

        if not existing:
            existing = DailyAttendance(
                client_id=client_id,
                branch_id=branch_id,
                employee_id=employee_id,
                attendance_date=attendance_date,
                shift_id=shift_id,
                status=AttendanceStatus.ABSENT,
                first_in=None,
                last_out=None,
                total_working_hours=0.0,
                late_minutes=0,
                early_exit_minutes=0
            )
            db.add(existing)
        else:
            if not existing.is_manually_edited:
                existing.status = AttendanceStatus.ABSENT
                existing.first_in = None
                existing.last_out = None
                existing.total_working_hours = 0.0

        db.commit()
        db.refresh(existing)
        return existing

    # Extract First In and Last Out
    timestamps = [p.punch_timestamp for p in punches]
    first_in_dt = min(timestamps)
    last_out_dt = max(timestamps)

    first_in_str = first_in_dt.strftime("%H:%M:%S")
    last_out_str = last_out_dt.strftime("%H:%M:%S")

    # If only 1 punch recorded
    is_single_punch = (len(punches) == 1 or first_in_dt == last_out_dt)

    # Calculate Working Hours
    if is_single_punch:
        total_working_hours = 0.0
        status = AttendanceStatus.MISS_PUNCH
        late_mins = 0
        early_mins = 0
    else:
        duration_sec = (last_out_dt - first_in_dt).total_seconds()
        working_sec = max(0.0, duration_sec - (break_mins * 60))
        total_working_hours = round(working_sec / 3600.0, 2)

        # Shift Timing Calculations
        shift_start = parse_time_str(shift_start_str)
        shift_end = parse_time_str(shift_end_str)

        # Thresholds
        start_dt = datetime.combine(first_in_dt.date(), shift_start)
        grace_deadline_dt = start_dt + timedelta(minutes=grace_mins)
        end_dt = datetime.combine(last_out_dt.date(), shift_end)

        # Late Calculation
        if first_in_dt > grace_deadline_dt:
            late_mins = int((first_in_dt - start_dt).total_seconds() // 60)
            status = AttendanceStatus.LATE
        else:
            late_mins = 0
            status = AttendanceStatus.PRESENT

        # Early Exit Calculation
        if last_out_dt < end_dt:
            early_mins = int((end_dt - last_out_dt).total_seconds() // 60)
            if status != AttendanceStatus.LATE:
                status = AttendanceStatus.EARLY_EXIT
        else:
            early_mins = 0

        # Half Day Threshold
        if total_working_hours < min_hours:
            status = AttendanceStatus.HALF_DAY

    # Upsert into DailyAttendance
    daily_record = db.query(DailyAttendance).filter(
        DailyAttendance.employee_id == employee_id,
        DailyAttendance.attendance_date == attendance_date
    ).first()

    if not daily_record:
        daily_record = DailyAttendance(
            client_id=client_id,
            branch_id=branch_id,
            employee_id=employee_id,
            attendance_date=attendance_date,
            shift_id=shift_id,
            first_in=first_in_str,
            last_out=last_out_str,
            total_break_minutes=break_mins if not is_single_punch else 0,
            total_working_hours=total_working_hours,
            status=status,
            late_minutes=late_mins,
            early_exit_minutes=early_mins
        )
        db.add(daily_record)
    else:
        if not daily_record.is_manually_edited:
            daily_record.first_in = first_in_str
            daily_record.last_out = last_out_str
            daily_record.total_break_minutes = break_mins if not is_single_punch else 0
            daily_record.total_working_hours = total_working_hours
            daily_record.status = status
            daily_record.late_minutes = late_mins
            daily_record.early_exit_minutes = early_mins

    db.commit()
    db.refresh(daily_record)
    return daily_record
