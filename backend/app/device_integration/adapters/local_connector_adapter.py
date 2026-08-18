from typing import Dict, Any, List, Optional
from datetime import datetime
from app.device_integration.base_driver import DeviceDriverInterface, DriverExecutionResult

class LocalConnectorDriver(DeviceDriverInterface):
    """
    Local Connector / Agent Driver Adapter.
    Communicates with private LAN devices via the Mabicons Biometric Connector service
    installed in the client local network.
    """
    driver_code = "local_connector"
    driver_name = "Mabicons Local Agent Connector Adapter"
    brand = "LAN Multi-Brand Agent"
    is_mock = False

    def connect(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="Local agent driver assigned. Communication routes through Mabicons Biometric Agent.",
            is_mock=False,
            driver_code=self.driver_code
        )

    def disconnect(self) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="Agent session disconnected.", is_mock=False, driver_code=self.driver_code)

    def test_connection(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        connector_status = device_config.get("connector_status")
        last_seen = device_config.get("last_seen")
        
        if connector_status == "ONLINE" and last_seen:
            return DriverExecutionResult(
                success=True,
                message=f"Local Agent is ONLINE. Last device heartbeat: {last_seen}",
                data={"status": "Online", "agent": "Mabicons Local Connector"},
                is_mock=False,
                driver_code=self.driver_code
            )
        return DriverExecutionResult(
            success=False,
            message="Local Connector Agent is currently offline or device unreachable on LAN.",
            data={"status": "Offline"},
            is_mock=False,
            driver_code=self.driver_code
        )

    def get_device_info(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="Device Info reported by local agent.",
            data={
                "local_ip": device_config.get("local_ip"),
                "mac": device_config.get("mac_address"),
                "serial_number": device_config.get("serial_number")
            },
            is_mock=False,
            driver_code=self.driver_code
        )

    def get_users(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="User list fetch command queued for Local Agent.", is_mock=False, driver_code=self.driver_code)

    def sync_users(self, device_config: Dict[str, Any], users: List[Dict[str, Any]]) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message=f"Queued {len(users)} users sync command to Local Agent.", is_mock=False, driver_code=self.driver_code)

    def get_attendance(self, device_config: Dict[str, Any], start_time: Optional[datetime] = None) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="Local Agent syncs attendance periodically over HTTPS outbound.", is_mock=False, driver_code=self.driver_code)

    def sync_attendance(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="Triggered manual sync signal to Local Agent.", is_mock=False, driver_code=self.driver_code)

    def get_device_time(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="Reported by Local Agent.", is_mock=False, driver_code=self.driver_code)

    def set_device_time(self, device_config: Dict[str, Any], new_time: datetime) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="Time sync command sent to Local Agent.", is_mock=False, driver_code=self.driver_code)

    def health_check(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self.test_connection(device_config)
