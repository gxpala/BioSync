# Device Integration Layer & Adapter Specification

## Principles

1. **Brand Decoupling**: The core attendance engine never calls eSSL or MORX SDKs directly.
2. **Adapter Registry**: Every device driver implements `DeviceDriverInterface`.
3. **No Fake Connections**: If a device driver is unconfigured, `test_connection()` explicitly returns failure with `"Driver not configured for this device"`.

## Standard Interface Contract (`DeviceDriverInterface`)

```python
class DeviceDriverInterface(ABC):
    driver_code: str
    driver_name: str
    brand: str
    is_mock: bool

    def connect(self, device_config: Dict[str, Any]) -> DriverExecutionResult: pass
    def disconnect(self) -> DriverExecutionResult: pass
    def test_connection(self, device_config: Dict[str, Any]) -> DriverExecutionResult: pass
    def get_device_info(self, device_config: Dict[str, Any]) -> DriverExecutionResult: pass
    def get_users(self, device_config: Dict[str, Any]) -> DriverExecutionResult: pass
    def sync_users(self, device_config: Dict[str, Any], users: List[Dict]) -> DriverExecutionResult: pass
    def get_attendance(self, device_config: Dict[str, Any], start_time=None) -> DriverExecutionResult: pass
    def sync_attendance(self, device_config: Dict[str, Any]) -> DriverExecutionResult: pass
    def get_device_time(self, device_config: Dict[str, Any]) -> DriverExecutionResult: pass
    def set_device_time(self, device_config: Dict[str, Any], new_time) -> DriverExecutionResult: pass
    def health_check(self, device_config: Dict[str, Any]) -> DriverExecutionResult: pass
```

## How to Add the First Real eSSL or MORX Hardware Adapter

When physical eSSL or MORX hardware details and C++/DLL/SDK specifications are provided following the POC:

1. Create `backend/app/device_integration/adapters/essl_real_adapter.py`.
2. Implement `DeviceDriverInterface` using `ctypes` or `pyzk` / socket binary communication.
3. Register the adapter in `DeviceDriverRegistry`:
   ```python
   DeviceDriverRegistry.register_driver(ESSlRealAdapter())
   ```
4. Set device `protocol_driver = "essl_real"` in the UI configuration screen.
