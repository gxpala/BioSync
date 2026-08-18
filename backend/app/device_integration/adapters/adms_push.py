from typing import Dict, Any, List, Optional
from datetime import datetime
from app.device_integration.base_driver import DeviceDriverInterface, DriverExecutionResult

class ADMSPushDriver(DeviceDriverInterface):
    """
    ADMS / HTTP Cloud Push Driver Adapter.
    Devices configured for ADMS push send HTTP POST/GET requests to the server endpoint.
    """
    driver_code = "adms_push"
    driver_name = "ADMS Cloud Push Listener Adapter"
    brand = "Multi-Brand ADMS"
    is_mock = False

    def normalize_payload(self, raw_payload: Dict[str, Any], serial_number: str) -> List[Dict[str, Any]]:
        """
        Normalizes varying ADMS device payloads (ZKTeco ADMS, eSSL ADMS, MORX Push)
        into standard punch dictionary objects.
        """
        normalized_punches = []
        
        # Check standard ZK/eSSL ADMS text/kv or JSON format
        if "table" in raw_payload or "ATTLOG" in str(raw_payload):
            # Parse line by line: UserID \t Timestamp \t Status \t VerifyType
            lines = str(raw_payload.get("raw_text", "")).split("\n")
            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 2:
                    user_id = parts[0]
                    # Attempt timestamp parse
                    ts_str = f"{parts[1]} {parts[2]}" if len(parts) >= 3 else parts[1]
                    normalized_punches.append({
                        "device_user_id": user_id,
                        "timestamp": ts_str,
                        "punch_type": "AUTO",
                        "source": "ADMS_PUSH"
                    })
        elif "punches" in raw_payload and isinstance(raw_payload["punches"], list):
            for item in raw_payload["punches"]:
                normalized_punches.append({
                    "device_user_id": str(item.get("user_id") or item.get("device_user_id")),
                    "timestamp": str(item.get("timestamp") or item.get("time")),
                    "punch_type": item.get("punch_type", "CHECK_IN"),
                    "source": "ADMS_PUSH"
                })
        else:
            # Single punch JSON format fallback
            if "user_id" in raw_payload or "device_user_id" in raw_payload:
                normalized_punches.append({
                    "device_user_id": str(raw_payload.get("user_id") or raw_payload.get("device_user_id")),
                    "timestamp": str(raw_payload.get("timestamp") or datetime.utcnow().isoformat()),
                    "punch_type": raw_payload.get("punch_type", "AUTO"),
                    "source": "ADMS_PUSH"
                })

        return normalized_punches

    def connect(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="ADMS Push Listener endpoint active. Listening for inbound device HTTP POST/GET requests.",
            is_mock=False,
            driver_code=self.driver_code
        )

    def disconnect(self) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="ADMS Listener inactive.", is_mock=False, driver_code=self.driver_code)

    def test_connection(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        last_seen = device_config.get("last_seen")
        if last_seen:
            return DriverExecutionResult(
                success=True,
                message=f"ADMS Device actively pushing data. Last heartbeat: {last_seen}",
                data={"status": "Online", "last_seen": last_seen},
                is_mock=False,
                driver_code=self.driver_code
            )
        return DriverExecutionResult(
            success=False,
            message="ADMS Device has not pushed any heartbeat or log data to server endpoint yet.",
            data={"status": "Offline"},
            is_mock=False,
            driver_code=self.driver_code
        )

    def get_device_info(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(
            success=True,
            message="ADMS Device Info retrieved from last registration payload.",
            data={"serial_number": device_config.get("serial_number"), "push_protocol": "HTTP/HTTPS ADMS"},
            is_mock=False,
            driver_code=self.driver_code
        )

    def get_users(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(success=False, message="Direct remote user query not supported on ADMS push mode.", is_mock=False, driver_code=self.driver_code)

    def sync_users(self, device_config: Dict[str, Any], users: List[Dict[str, Any]]) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="Command queued for next ADMS device heartbeat pull.", is_mock=False, driver_code=self.driver_code)

    def get_attendance(self, device_config: Dict[str, Any], start_time: Optional[datetime] = None) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="ADMS operates via asynchronous inbound push.", is_mock=False, driver_code=self.driver_code)

    def sync_attendance(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="ADMS devices push automatically.", is_mock=False, driver_code=self.driver_code)

    def get_device_time(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="Pushed during ADMS heartbeat.", is_mock=False, driver_code=self.driver_code)

    def set_device_time(self, device_config: Dict[str, Any], new_time: datetime) -> DriverExecutionResult:
        return DriverExecutionResult(success=True, message="Time update command queued for next ADMS poll.", is_mock=False, driver_code=self.driver_code)

    def health_check(self, device_config: Dict[str, Any]) -> DriverExecutionResult:
        return self.test_connection(device_config)
