from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime

class DriverExecutionResult:
    def __init__(self, success: bool, message: str, data: Optional[Any] = None, is_mock: bool = False, driver_code: str = ""):
        self.success = success
        self.message = message
        self.data = data
        self.is_mock = is_mock
        self.driver_code = driver_code
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "message": self.message,
            "data": self.data,
            "is_mock": self.is_mock,
            "driver_code": self.driver_code,
            "timestamp": self.timestamp
        }

class DeviceDriverInterface(ABC):
    """
    Standard interface contract for all biometric device drivers in Mabicons Attendance.
    No direct application coupling to hardware SDKs or proprietary TCP protocols.
    """

    driver_code: str = "base"
    driver_name: str = "Base Driver"
    brand: str = "Generic"
    is_mock: bool = False

    @abstractmethod
    def connect(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        pass

    @abstractmethod
    def disconnect(self) -> DriverExecutionResult:
        pass

    @abstractmethod
    def test_connection(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        pass

    @abstractmethod
    def get_device_info(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        pass

    @abstractmethod
    def get_users(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        pass

    @abstractmethod
    def sync_users(self, device_config: Dict[str, Any], users: List[Dict[str, Any]]) -> DriverExecutionResult:
        pass

    @abstractmethod
    def get_attendance(self, device_config: Dict[str, Any], start_time: Optional[datetime] = None) -> DriverExecutionResult:
        pass

    @abstractmethod
    def sync_attendance(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        pass

    @abstractmethod
    def get_device_time(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        pass

    @abstractmethod
    def set_device_time(self, device_config: Dict[str, Any], new_time: datetime) -> DriverExecutionResult:
        pass

    @abstractmethod
    def health_check(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        pass
