# Mabicons Biometric Local Connector Architecture

## Network Challenge

Biometric devices in client offices reside behind private routers on local LAN subnets (e.g. `192.168.1.x` or `10.0.0.x`). Cloud servers cannot initiate inbound TCP connections to private local IPs.

## Solution

The **Mabicons Biometric Local Connector** is installed inside the client local network as a Windows Background Service.

```
Biometric Device (LAN: 192.168.1.201)
         |
         | LAN TCP (Port 4370)
         v
Mabicons Biometric Connector (Windows Service on Client PC)
         |
         | HTTPS Outbound REST API (/api/v1/connector/punches)
         v
Mabicons Central Cloud Platform
```

## Features

- **Configuration File**: Settings stored in `config.json` (no code modifications).
- **Agent Registration**: Auto-obtains a secure token (`POST /api/v1/connector/register`).
- **Heartbeat Telemetry**: Sends device health updates every 15 seconds.
- **Offline Buffering Queue**: Stores raw punches in local SQLite DB (`connector_offline_buffer.db`) during Internet outages.
- **Auto Sync & Retry**: Automatically flushes buffered punches with backoff once internet is restored.
