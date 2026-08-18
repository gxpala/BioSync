import hashlib
from datetime import datetime
from typing import Union

def generate_punch_hash(device_id: int, device_user_id: str, punch_timestamp: Union[datetime, str], source: str = "LOCAL_CONNECTOR") -> str:
    """
    Generates a deterministic unique MD5 hash for biometric raw punch deduplication.
    Format: MD5(device_id + "|" + device_user_id + "|" + punch_timestamp_iso + "|" + source)
    """
    if isinstance(punch_timestamp, datetime):
        ts_str = punch_timestamp.strftime("%Y-%m-%d %H:%M:%S")
    else:
        ts_str = str(punch_timestamp).strip()

    raw_key = f"{device_id}|{str(device_user_id).strip()}|{ts_str}|{source.upper()}"
    return hashlib.md5(raw_key.encode("utf-8")).hexdigest()
