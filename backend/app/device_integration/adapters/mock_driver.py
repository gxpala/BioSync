from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random
from app.device_integration.base_driver import DeviceDriverInterface, DriverExecutionResult

class MockDriver(DeviceDriverInterface):
    """
    Development & Testing Mock Driver.
    EXPLICITLY MARKED AS MOCK - NEVER PRETENDS MOCK DATA IS REAL HARDWARE PUNCHES.
    """
    driver_code = "mock_driver"
    driver_name = "Mabicons Development Mock Driver (MOCK)"
    brand = "Mock"
    is_mock = True

    def connect(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="[MOCK] Connected to simulated mock device endpoint.",
            data={"ip": device_config.get("local_ip", "127.0.0.1"), "port": device_config.get("port", 4370)},
            is_mock=True,
            driver_code=self.driver_code
        )

    def disconnect(self) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="[MOCK] Disconnected from simulated mock device endpoint.",
            is_mock=True,
            driver_code=self.driver_code
        )

    def test_connection(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="[MOCK DRIVER] Connection test successful (Simulated environment).",
            data={
                "serial_number": device_config.get("serial_number", "MOCK-DEV-999"),
                "status": "Online (Mock)",
                "latency_ms": random.randint(12, 45)
            },
            is_mock=True,
            driver_code=self.driver_code
        )

    def get_device_info(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="[MOCK DRIVER] Device Info retrieved.",
            data={
                "brand": "Mabicons Mock",
                "model": "DEV-TEST-V1",
                "firmware_version": "v1.0.0-mock",
                "serial_number": device_config.get("serial_number", "MOCK-DEV-999"),
                "user_count": 5,
                "fingerprint_count": 10,
                "attendance_count": 42
            },
            is_mock=True,
            driver_code=self.driver_code
        )

    def get_users(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        mock_users = [
            {"device_user_id": "101", "name": "Demo User 101", "privilege": "User"},
            {"device_user_id": "102", "name": "Demo User 102", "privilege": "User"},
            {"device_user_id": "103", "name": "Demo User 103", "privilege": "Admin"}
        ]
        return DriverExecutionResult(
            success=True,
            message="[MOCK DRIVER] Users retrieved.",
            data=mock_users,
            is_mock=True,
            driver_code=self.driver_code
        )

    def sync_users(self, device_config: Dict[str, Any], users: List[Dict[str, Any]]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message=f"[MOCK DRIVER] Synced {len(users)} users to simulated device.",
            is_mock=True,
            driver_code=self.driver_code
        )

    def get_attendance(self, device_config: Dict[str, Any], start_time: Optional[datetime] = None) -> DriverExecutionResult:
        now = datetime.utcnow()
        mock_punches = [
            {
                "device_user_id": "101",
                "timestamp": (now - timedelta(hours=2)).isoformat(),
                "punch_type": "CHECK_IN",
                "verification_type": "FINGERPRINT"
            },
            {
                "device_user_id": "102",
                "timestamp": (now - timedelta(hours=1, minutes=45)).isoformat(),
                "punch_type": "CHECK_IN",
                "verification_type": "FACE"
            }
        ]
        return DriverExecutionResult(
            success=True,
            message="[MOCK DRIVER] Retrieved mock attendance records.",
            data=mock_punches,
            is_mock=True,
            driver_code=self.driver_code
        )

    def sync_attendance(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self.get_attendance(device_config)

    def get_device_time(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="[MOCK DRIVER] Device time retrieved.",
            data={"device_time": datetime.utcnow().isoformat()},
            is_mock=True,
            driver_code=self.driver_code
        )

    def set_device_time(self, device_config: Dict[str, Any], new_time: datetime) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message=f"[MOCK DRIVER] Device time updated to {new_time.isoformat()}.",
            is_mock=True,
            driver_code=self.driver_code
        )

    def health_check(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="[MOCK DRIVER] Health check passed.",
            data={"status": "Online", "battery": 100},
            is_mock=True,
            driver_code=self.driver_code
        )
