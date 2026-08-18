from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.all_models import (
    User, UserRole, Client, ClientStatus, Branch, Device, Employee,
    EmployeeDeviceMapping, Shift, RawAttendancePunch, DailyAttendance,
    ConnectorInstance, AuditLog
)
from app.attendance_engine.deduplication import generate_punch_hash
from app.attendance_engine.processor import process_daily_attendance_for_employee

def seed_database(db: Session = None):
    Base.metadata.create_all(bind=engine if db is None else db.get_bind())
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # 1. Super Admin User
        admin_email = "superadmin@mabicons.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            admin_user = User(
                email=admin_email,
                full_name="Mabicons Super Admin",
                hashed_password=get_password_hash("Admin@123"),
                role=UserRole.SUPER_ADMIN,
                client_id=None,
                is_active=True
            )
            db.add(admin_user)
            db.commit()

        # 2. Demo Clients
        client1 = db.query(Client).filter(Client.client_code == "VYSOLAR").first()
        if not client1:
            client1 = Client(
                client_name="V & Y Solar Pvt Ltd",
                client_code="VYSOLAR",
                contact_person="Vikram Yadav",
                email="contact@vysolar.com",
                phone="+91 98765 43210",
                address="Plot 42, Sitapura Industrial Area, Jaipur, Rajasthan",
                status=ClientStatus.ACTIVE
            )
            db.add(client1)

            client2 = Client(
                client_name="Solaris Energy Ltd",
                client_code="SOLARIS",
                contact_person="Sunil Mehta",
                email="info@solarisenergy.com",
                phone="+91 98111 22334",
                address="Bandra Kurla Complex, Mumbai, Maharashtra",
                status=ClientStatus.ACTIVE
            )
            db.add(client2)

            client3 = Client(
                client_name="Apex Technologies",
                client_code="APEX",
                contact_person="Neha Kapoor",
                email="admin@apextech.io",
                phone="+91 97222 33445",
                address="Electronic City Phase 1, Bengaluru, Karnataka",
                status=ClientStatus.ACTIVE
            )
            db.add(client3)

            db.commit()
            db.refresh(client1)
            db.refresh(client2)
            db.refresh(client3)

            # Client Admin User for V & Y Solar
            c_admin = User(
                email="admin@vysolar.com",
                full_name="V&Y Client Admin",
                hashed_password=get_password_hash("Client@123"),
                role=UserRole.CLIENT_ADMIN,
                client_id=client1.id,
                is_active=True
            )
            db.add(c_admin)
            db.commit()

        # 3. Demo Branches for V & Y Solar
        b_jaipur = db.query(Branch).filter(Branch.client_id == client1.id, Branch.branch_code == "JPR-01").first()
        if not b_jaipur:
            b_jaipur = Branch(
                client_id=client1.id,
                branch_name="Jaipur Head Office",
                branch_code="JPR-01",
                address="Sitapura Industrial Area",
                city="Jaipur",
                state="Rajasthan",
                pincode="302022",
                timezone="Asia/Kolkata"
            )
            db.add(b_jaipur)

            b_delhi = Branch(
                client_id=client1.id,
                branch_name="Delhi Regional Office",
                branch_code="DEL-01",
                address="Connaught Place",
                city="New Delhi",
                state="Delhi",
                pincode="110001",
                timezone="Asia/Kolkata"
            )
            db.add(b_delhi)

            b_mumbai = Branch(
                client_id=client2.id,
                branch_name="Mumbai HQ",
                branch_code="MUM-01",
                address="BKC Main Road",
                city="Mumbai",
                state="Maharashtra",
                pincode="400051"
            )
            db.add(b_mumbai)

            b_blr = Branch(
                client_id=client3.id,
                branch_name="Bengaluru Tech Park",
                branch_code="BLR-01",
                address="Electronic City",
                city="Bengaluru",
                state="Karnataka",
                pincode="560100"
            )
            db.add(b_blr)

            db.commit()
            db.refresh(b_jaipur)
            db.refresh(b_delhi)
            db.refresh(b_mumbai)
            db.refresh(b_blr)

        # 4. Demo Devices
        d1 = db.query(Device).filter(Device.serial_number == "ESSL-JPR-001").first()
        if not d1:
            d1 = Device(
                client_id=client1.id,
                branch_id=b_jaipur.id,
                device_name="Main Gate eSSL",
                brand="eSSL",
                model="eTimeTrack X990",
                serial_number="ESSL-JPR-001",
                firmware_version="Ver 8.0.4",
                local_ip="192.168.1.201",
                port=4370,
                mac_address="00:1A:2B:3C:4D:5E",
                connection_type="Ethernet",
                integration_type="Local Connector",
                protocol_driver="essl_tcp",
                status="Online",
                last_seen=datetime.utcnow() - timedelta(seconds=18),
                last_successful_sync=datetime.utcnow() - timedelta(seconds=25)
            )
            db.add(d1)

            d2 = Device(
                client_id=client1.id,
                branch_id=b_jaipur.id,
                device_name="Factory Gate MORX",
                brand="MORX",
                model="MX-800 Pro",
                serial_number="MORX-JPR-002",
                firmware_version="v2.1",
                local_ip="192.168.1.202",
                port=4370,
                mac_address="00:1A:2B:3C:4D:5F",
                connection_type="Ethernet",
                integration_type="LAN / TCP-IP",
                protocol_driver="morx_tcp",
                status="Not Configured",
                last_seen=datetime.utcnow() - timedelta(minutes=42)
            )
            db.add(d2)

            d3 = Device(
                client_id=client1.id,
                branch_id=b_delhi.id,
                device_name="Delhi Main Entrance",
                brand="eSSL",
                model="iFace 302",
                serial_number="ESSL-DEL-003",
                firmware_version="Ver 7.2",
                local_ip="10.0.1.50",
                port=4370,
                mac_address="00:1A:2B:3C:4D:60",
                connection_type="Ethernet",
                integration_type="Local Connector",
                protocol_driver="essl_tcp",
                status="Offline",
                last_seen=datetime.utcnow() - timedelta(hours=3)
            )
            db.add(d3)

            d4 = Device(
                client_id=client2.id,
                branch_id=b_mumbai.id,
                device_name="ADMS Entrance ZKTeco",
                brand="ZKTeco",
                model="uFace800",
                serial_number="ZK-MUM-004",
                firmware_version="Ver 12.0",
                local_ip="172.16.0.10",
                port=80,
                mac_address="00:1A:2B:3C:4D:61",
                connection_type="Wi-Fi",
                integration_type="ADMS Push",
                protocol_driver="adms_push",
                status="Online",
                last_seen=datetime.utcnow() - timedelta(seconds=12)
            )
            db.add(d4)

            d5 = Device(
                client_id=client3.id,
                branch_id=b_blr.id,
                device_name="Dev Mock Device (MOCK)",
                brand="Mock",
                model="DEV-TEST-V1",
                serial_number="MOCK-BLR-999",
                firmware_version="v1.0.0-mock",
                local_ip="127.0.0.1",
                port=4370,
                mac_address="00:00:00:00:00:00",
                connection_type="Ethernet",
                integration_type="Local Connector",
                protocol_driver="mock_driver",
                status="Online",
                last_seen=datetime.utcnow()
            )
            db.add(d5)

            db.commit()
            db.refresh(d1)
            db.refresh(d2)
            db.refresh(d5)

        # 5. Demo Shift
        shift1 = db.query(Shift).filter(Shift.client_id == client1.id).first()
        if not shift1:
            shift1 = Shift(
                client_id=client1.id,
                shift_name="General Shift",
                start_time="09:00",
                end_time="18:00",
                grace_period_minutes=15,
                min_working_hours=4.0,
                break_duration_minutes=30,
                weekly_off_days="Sunday"
            )
            db.add(shift1)
            db.commit()
            db.refresh(shift1)

        # 6. Demo Employees
        e1 = db.query(Employee).filter(Employee.employee_code == "EMP001").first()
        if not e1:
            e1 = Employee(
                client_id=client1.id,
                branch_id=b_jaipur.id,
                employee_code="EMP001",
                default_device_user_id="15",
                employee_name="Rahul Sharma",
                email="rahul.sharma@vysolar.com",
                phone="+91 99000 11122",
                department="Engineering",
                designation="Senior Solar Engineer",
                joining_date="2024-01-15",
                status="ACTIVE"
            )
            db.add(e1)

            e2 = Employee(
                client_id=client1.id,
                branch_id=b_jaipur.id,
                employee_code="EMP002",
                default_device_user_id="16",
                employee_name="Priya Patel",
                email="priya.patel@vysolar.com",
                phone="+91 99000 33344",
                department="HR Operations",
                designation="HR Executive",
                joining_date="2024-03-01",
                status="ACTIVE"
            )
            db.add(e2)

            e3 = Employee(
                client_id=client1.id,
                branch_id=b_jaipur.id,
                employee_code="EMP003",
                default_device_user_id="17",
                employee_name="Amit Verma",
                email="amit.verma@vysolar.com",
                phone="+91 99000 55566",
                department="Operations",
                designation="Operations Lead",
                joining_date="2023-11-10",
                status="ACTIVE"
            )
            db.add(e3)

            db.commit()
            db.refresh(e1)
            db.refresh(e2)
            db.refresh(e3)

            # Employee Device Mappings
            m1 = EmployeeDeviceMapping(employee_id=e1.id, device_id=d1.id, device_user_id="15")
            m2 = EmployeeDeviceMapping(employee_id=e1.id, device_id=d2.id, device_user_id="102")
            db.add(m1)
            db.add(m2)
            db.commit()

        # 7. Demo Raw Punches & Attendance for today
        today_date = datetime.utcnow().strftime("%Y-%m-%d")
        existing_punch = db.query(RawAttendancePunch).filter(RawAttendancePunch.punch_date == today_date).first()

        if not existing_punch and e1 and d1:
            p1_time = datetime.utcnow().replace(hour=9, minute=2, second=10)
            hash1 = generate_punch_hash(d1.id, "15", p1_time, "LOCAL_CONNECTOR")

            punch1 = RawAttendancePunch(
                client_id=client1.id,
                branch_id=b_jaipur.id,
                device_id=d1.id,
                device_serial=d1.serial_number,
                employee_id=e1.id,
                device_user_id="15",
                punch_date=today_date,
                punch_time="09:02:10",
                punch_timestamp=p1_time,
                punch_type="CHECK_IN",
                verification_type="FINGERPRINT",
                source="LOCAL_CONNECTOR",
                raw_payload='{"cmd":"attlog","sn":"ESSL-JPR-001","uid":15}',
                unique_hash=hash1
            )
            db.add(punch1)

            p2_time = datetime.utcnow().replace(hour=18, minute=31, second=45)
            hash2 = generate_punch_hash(d1.id, "15", p2_time, "LOCAL_CONNECTOR")

            punch2 = RawAttendancePunch(
                client_id=client1.id,
                branch_id=b_jaipur.id,
                device_id=d1.id,
                device_serial=d1.serial_number,
                employee_id=e1.id,
                device_user_id="15",
                punch_date=today_date,
                punch_time="18:31:45",
                punch_timestamp=p2_time,
                punch_type="CHECK_OUT",
                verification_type="FINGERPRINT",
                source="LOCAL_CONNECTOR",
                raw_payload='{"cmd":"attlog","sn":"ESSL-JPR-001","uid":15}',
                unique_hash=hash2
            )
            db.add(punch2)

            # Priya Patel - Late Punch (09:42 AM)
            p3_time = datetime.utcnow().replace(hour=9, minute=42, second=0)
            hash3 = generate_punch_hash(d1.id, "16", p3_time, "LOCAL_CONNECTOR")
            punch3 = RawAttendancePunch(
                client_id=client1.id,
                branch_id=b_jaipur.id,
                device_id=d1.id,
                device_serial=d1.serial_number,
                employee_id=e2.id,
                device_user_id="16",
                punch_date=today_date,
                punch_time="09:42:00",
                punch_timestamp=p3_time,
                punch_type="CHECK_IN",
                verification_type="FACE",
                source="LOCAL_CONNECTOR",
                raw_payload='{"cmd":"attlog","sn":"ESSL-JPR-001","uid":16}',
                unique_hash=hash3
            )
            db.add(punch3)

            db.commit()

            # Process Attendance
            process_daily_attendance_for_employee(db, client1.id, e1.id, today_date, shift1)
            process_daily_attendance_for_employee(db, client1.id, e2.id, today_date, shift1)

    except Exception as e:
        db.rollback()
    finally:
        if should_close:
            db.close()
