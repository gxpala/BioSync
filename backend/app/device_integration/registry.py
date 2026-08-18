from typing import Dict, Type, Optional, List
from app.device_integration.base_driver import DeviceDriverInterface, DriverExecutionResult
from app.device_integration.adapters.mock_driver import MockDriver
from app.device_integration.adapters.essl_driver import ESSlDriver
from app.device_integration.adapters.morx_driver import MorxDriver
from app.device_integration.adapters.zkteco_driver import ZKTecoDriver
from app.device_integration.adapters.adms_push import ADMSPushDriver
from app.device_integration.adapters.local_connector_adapter import LocalConnectorDriver

class UnconfiguredDriver(DeviceDriverInterface):
    driver_code = "unconfigured"
    driver_name = "Unconfigured / Unsupported Driver"
    brand = "Unknown"
    is_mock = False

    def __init__(self, requested_code: str = "unconfigured"):
        self.requested_code = requested_code

    def _msg(self) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=False,
            message=f"Driver not configured for this device (Driver key: '{self.requested_code}'). Real hardware adapter required.",
            data={"status": "Not Configured"},
            is_mock=False,
            driver_code=self.requested_code
        )

    def connect(self, device_config: Dict) -> DriverExecutionResult: return self._msg()
    def disconnect(self) -> DriverExecutionResult: return self._msg()
    def test_connection(self, device_config: Dict) -> DriverExecutionResult: return self._msg()
    def get_device_info(self, device_config: Dict) -> DriverExecutionResult: return self._msg()
    def get_users(self, device_config: Dict) -> DriverExecutionResult: return self._msg()
    def sync_users(self, device_config: Dict, users: List[Dict]) -> DriverExecutionResult: return self._msg()
    def get_attendance(self, device_config: Dict, start_time: Optional = None) -> DriverExecutionResult: return self._msg()
    def sync_attendance(self, device_config: Dict) -> DriverExecutionResult: return self._msg()
    def get_device_time(self, device_config: Dict) -> DriverExecutionResult: return self._msg()
    def set_device_time(self, device_config: Dict, new_time) -> DriverExecutionResult: return self._msg()
    def health_check(self, device_config: Dict) -> DriverExecutionResult: return self._msg()


class DeviceDriverRegistry:
    """
    Central Adapter Registry managing modular biometric device drivers.
    Allows registering new hardware adapters dynamically without altering core attendance logic.
    """

    _registry: Dict[str, DeviceDriverInterface] = {}

    @classmethod
    def register_defaults(cls):
        cls.register_driver(MockDriver())
        cls.register_driver(ESSlDriver())
        cls.register_driver(MorxDriver())
        cls.register_driver(ZKTecoDriver())
        cls.register_driver(ADMSPushDriver())
        cls.register_driver(LocalConnectorDriver())

    @classmethod
    def register_driver(cls, driver_instance: DeviceDriverInterface):
        cls._registry[driver_instance.driver_code.lower()] = driver_instance

    @classmethod
    def get_driver(cls, driver_code: Optional[str]) -> DeviceDriverInterface:
        if not driver_code:
            return UnconfiguredDriver("none")
        
        normalized_code = driver_code.strip().lower()
        if normalized_code in cls._registry:
            return cls._registry[normalized_code]
        
        return UnconfiguredDriver(normalized_code)

    @classmethod
    def list_drivers(cls) -> List[Dict[str, Any]]:
        drivers = []
        for code, driver in cls._registry.items():
            drivers.append({
                "driver_code": driver.driver_code,
                "driver_name": driver.driver_name,
                "brand": driver.brand,
                "is_mock": driver.is_mock
            })
        return drivers

# Initialize defaults on import
DeviceDriverRegistry.register_defaults()
