from typing import Dict, Any, List, Optional
from datetime import datetime
from app.device_integration.base_driver import DeviceDriverInterface, DriverExecutionResult

class ESSlDriver(DeviceDriverInterface):
    """
    eSSL Biometric Device Driver Adapter Interface.
    Boundary placeholder ready for physical eSSL SDK / TCP binary library integration.
    """
    driver_code = "essl_tcp"
    driver_name = "eSSL TCP/IP & SDK Driver Adapter"
    brand = "eSSL"
    is_mock = False

    def __init__(self, sdk_binary_path: Optional[str] = None):
        self.sdk_binary_path = sdk_binary_path

    def _unconfigured_response(self, action: str) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=False,
            message=f"Driver not configured for this device ({action}). eSSL physical SDK binary / protocol adapter will be activated following initial real-device POC.",
            data={"status": "Not Configured", "requires_hardware_poc": True},
            is_mock=False,
            driver_code=self.driver_code
        )

    def connect(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self._unconfigured_response("connect")

    def disconnect(self) -> DriverExecutionResult:
        return self._unconfigured_response("disconnect")

    def test_connection(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self._unconfigured_response("test_connection")

    def get_device_info(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self._unconfigured_response("get_device_info")

    def get_users(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self._unconfigured_response("get_users")

    def sync_users(self, device_config: Dict[str, Any], users: List[Dict[str, Any]]) -> DriverExecutionResult:
        return self._unconfigured_response("sync_users")

    def get_attendance(self, device_config: Dict[str, Any], start_time: Optional[datetime] = None) -> DriverExecutionResult:
        return self._unconfigured_response("get_attendance")

    def sync_attendance(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self._unconfigured_response("sync_attendance")

    def get_device_time(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self._unconfigured_response("get_device_time")

    def set_device_time(self, device_config: Dict[str, Any], new_time: datetime) -> DriverExecutionResult:
        return self._unconfigured_response("set_device_time")

    def health_check(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self._unconfigured_response("health_check")
