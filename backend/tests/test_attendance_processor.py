from datetime import datetime
from app.attendance_engine.processor import process_daily_attendance_for_employee
from app.models.all_models import RawAttendancePunch, Shift, Employee, AttendanceStatus

def test_attendance_processing_present_and_late(db_session):
    # Setup test employee & shift
    shift = Shift(
        client_id=1,
        shift_name="Morning Shift",
        start_time="09:00",
        end_time="18:00",
        grace_period_minutes=15,
        min_working_hours=4.0,
        break_duration_minutes=30
    )
    db_session.add(shift)
    db_session.commit()

    # Test Employee 1 - Present (Punches 09:05 IN, 18:30 OUT)
    p1 = RawAttendancePunch(
        client_id=1, branch_id=1, device_id=1, device_serial="TEST-01",
        employee_id=99, device_user_id="99", punch_date="2026-08-18",
        punch_time="09:05:00", punch_timestamp=datetime(2026, 8, 18, 9, 5, 0),
        punch_type="CHECK_IN", unique_hash="h1"
    )
    p2 = RawAttendancePunch(
        client_id=1, branch_id=1, device_id=1, device_serial="TEST-01",
        employee_id=99, device_user_id="99", punch_date="2026-08-18",
        punch_time="18:30:00", punch_timestamp=datetime(2026, 8, 18, 18, 30, 0),
        punch_type="CHECK_OUT", unique_hash="h2"
    )
    db_session.add(p1)
    db_session.add(p2)
    db_session.commit()

    record = process_daily_attendance_for_employee(db_session, 1, 99, "2026-08-18", shift)
    assert record.status == AttendanceStatus.PRESENT
    assert record.first_in == "09:05:00"
    assert record.last_out == "18:30:00"
    assert record.late_minutes == 0
    assert record.total_working_hours > 8.5
