import pytest
from app.device_integration.registry import DeviceDriverRegistry
from app.device_integration.adapters.mock_driver import MockDriver
from app.attendance_engine.deduplication import generate_punch_hash

def test_device_driver_registry_resolution():
    # 1. Registered Mock Driver
    mock_drv = DeviceDriverRegistry.get_driver("mock_driver")
    assert mock_drv is not None
    assert mock_drv.is_mock is True
    
    res = mock_drv.test_connection({"local_ip": "127.0.0.1"})
    assert res.success is True
    assert res.is_mock is True

    # 2. Registered eSSL Driver (Unconfigured stub)
    essl_drv = DeviceDriverRegistry.get_driver("essl_tcp")
    assert essl_drv is not None
    res_essl = essl_drv.test_connection({"local_ip": "192.168.1.50"})
    assert res_essl.success is False
    assert "Driver not configured" in res_essl.message

    # 3. Unknown / Unregistered Driver Code
    unknown_drv = DeviceDriverRegistry.get_driver("random_unknown_brand")
    res_unk = unknown_drv.test_connection({"local_ip": "10.0.0.1"})
    assert res_unk.success is False
    assert "Driver not configured" in res_unk.message

def test_punch_deduplication_hashing():
    hash1 = generate_punch_hash(device_id=1, device_user_id="101", punch_timestamp="2026-08-18 09:00:00", source="LOCAL_CONNECTOR")
    hash2 = generate_punch_hash(device_id=1, device_user_id="101", punch_timestamp="2026-08-18 09:00:00", source="LOCAL_CONNECTOR")
    hash3 = generate_punch_hash(device_id=1, device_user_id="101", punch_timestamp="2026-08-18 09:00:01", source="LOCAL_CONNECTOR")

    assert hash1 == hash2  # Identical punch produces identical hash
    assert hash1 != hash3  # Different timestamp produces distinct hash
