# Mabicons Attendance API Documentation

Interactive Swagger API documentation is served at `/api/v1/docs`.

## Core REST Endpoints

### Authentication
- `POST /api/v1/auth/login`: Authenticate and receive JWT access token.
- `GET /api/v1/auth/me`: Get current user profile.

### Multi-Tenant Management
- `GET /api/v1/clients`: List clients.
- `POST /api/v1/clients`: Create client (Super Admin).
- `GET /api/v1/branches`: List branches.
- `POST /api/v1/branches`: Create branch.

### Device Management & Drivers
- `GET /api/v1/devices`: List devices.
- `POST /api/v1/devices`: Add biometric device.
- `GET /api/v1/devices/drivers`: List driver catalog in registry.
- `POST /api/v1/devices/{id}/test-connection`: Hardware connection test.
- `GET /api/v1/devices/{id}/info`: Query hardware metadata.
- `POST /api/v1/devices/{id}/sync`: Trigger attendance sync.

### Employees & Mappings
- `GET /api/v1/employees`: List employees.
- `POST /api/v1/employees`: Add employee.
- `GET /api/v1/employees/{id}/mappings`: List device user ID mappings.
- `POST /api/v1/employees/mappings`: Create employee hardware mapping.

### Attendance & Raw Punches
- `GET /api/v1/raw-punches`: Filter raw biometric punches.
- `GET /api/v1/attendance`: Filter calculated daily attendance.
- `POST /api/v1/attendance/reprocess`: Trigger attendance engine recalculation.

### Local Agent Connector API
- `POST /api/v1/connector/register`: Register agent instance.
- `POST /api/v1/connector/heartbeat`: Inbound agent telemetry.
- `POST /api/v1/connector/punches`: Ingest punch batch.

### ADMS Cloud Push Endpoint
- `GET /api/v1/adms/iclock/cdata`: ADMS device handshake.
- `POST /api/v1/adms/iclock/cdata`: Ingest push logs.

### Reports & Export
- `GET /api/v1/reports/data`: Query report data.
- `GET /api/v1/reports/export-csv`: Download CSV report.
