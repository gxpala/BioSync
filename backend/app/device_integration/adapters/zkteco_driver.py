from typing import Dict, Any, List, Optional
from datetime import datetime
from app.device_integration.base_driver import DeviceDriverInterface, DriverExecutionResult

class ZKTecoDriver(DeviceDriverInterface):
    driver_code = "zkteco_driver"
    driver_name = "ZKTeco Standalone Driver Adapter"
    brand = "ZKTeco"
    is_mock = False

    def _unconfigured(self, action: str) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=False,
            message=f"Driver not configured for ZKTeco device ({action}). Hardware integration pending POC.",
            is_mock=False,
            driver_code=self.driver_code
        )

    def connect(self, device_config: Dict[str, Any]) -> DriverExecutionResult: return self._unconfigured("connect")
    def disconnect(self) -> DriverExecutionResult: return self._unconfigured("disconnect")
    def test_connection(self, device_config: Dict[str, Any]) -> DriverExecutionResult: return self._unconfigured("test_connection")
    def get_device_info(self, device_config: Dict[str, Any]) -> DriverExecutionResult: return self._unconfigured("get_device_info")
    def get_users(self, device_config: Dict[str, Any]) -> DriverExecutionResult: return self._unconfigured("get_users")
    def sync_users(self, device_config: Dict[str, Any], users: List[Dict[str, Any]]) -> DriverExecutionResult: return self._unconfigured("sync_users")
    def get_attendance(self, device_config: Dict[str, Any], start_time: Optional[datetime] = None) -> DriverExecutionResult: return self._unconfigured("get_attendance")
    def sync_attendance(self, device_config: Dict[str, Any]) -> DriverExecutionResult: return self._unconfigured("sync_attendance")
    def get_device_time(self, device_config: Dict[str, Any]) -> DriverExecutionResult: return self._unconfigured("get_device_time")
    def set_device_time(self, device_config: Dict[str, Any], new_time: datetime) -> DriverExecutionResult: return self._unconfigured("set_device_time")
    def health_check(self, device_config: Dict[str, Any]) -> DriverExecutionResult: return self._unconfigured("health_check")
