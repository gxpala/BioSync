# Attendance Processing Engine & Deduplication Specification

## Data Segregation

1. `raw_attendance_punches`: Immutable biometric raw punch audit trail.
2. `daily_attendance`: Calculated aggregated daily attendance records.
3. `attendance_processing_logs`: Calculation run execution logs.

## Deduplication Algorithm

Every punch ingested produces an idempotent unique MD5 key:
```python
unique_hash = MD5(device_id + "|" + device_user_id + "|" + punch_timestamp + "|" + source)
```
Database unique constraint on `unique_hash` ensures identical punches are ignored safely.

## Daily Attendance Calculation Logic

1. **First In**: Earliest punch timestamp of the day.
2. **Last Out**: Latest punch timestamp of the day.
3. **Working Duration**: `(Last Out - First In) - Shift Break Duration`.
4. **Late Evaluation**: `First In > Shift Start Time + Grace Period`.
5. **Early Exit Evaluation**: `Last Out < Shift End Time`.
6. **Half Day**: `Total Working Hours < Shift Min Working Hours`.
7. **Miss Punch**: Only 1 punch recorded for the day.
8. **Absent**: No punches recorded for a workday.
