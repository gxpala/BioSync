# Mabicons Central Biometric Attendance Architecture

**Company:** Mabicons Technosoft Pvt Ltd  
**Product:** Mabicons Attendance

## Architectural Overview

Mabicons Attendance is designed as a centralized multi-tenant B2B SaaS platform allowing Mabicons HR Operations to manage 50+ clients and their heterogeneous biometric attendance hardware from one central dashboard.

```
Mabicons Web Application (React + TypeScript)
               |
               v (REST API / WebSockets)
FastAPI Backend Application (Python 3.11)
  +--- PostgreSQL Database (Relational Schema)
  +--- Device Integration Service (Modular Adapter Registry)
  +--- Attendance Processing Engine (Deduplication & Shift Calculator)
  +--- Device Monitoring & Telemetry
  +--- Local Connector Outbound API (/api/v1/connector)
  +--- ADMS / iClock Push Listener (/api/v1/adms)
               ^
               | (HTTPS Outbound & HTTP Push)
Biometric Devices & Local Networks
  +--- eSSL Devices (LAN / Local Connector)
  +--- MORX Devices (LAN / Local Connector)
  +--- ZKTeco ADMS Devices (Cloud Push)
  +--- Private LAN Agents (Mabicons Windows Connector)
```

## Multi-Tenant Hierarchy

1. **Mabicons (Platform Owner)**
2. **Clients** (50+ Client companies, e.g. *V & Y Solar*, *Solaris Energy*, *Apex Tech*)
3. **Branches** (Office locations, e.g. *Jaipur HQ*, *Delhi Regional*)
4. **Devices** (Biometric hardware machines) & **Employees**
5. **Attendance Records** (Raw punches & Processed daily attendance)

## Security & Tenant Isolation

- Role-Based Access Control (RBAC): `SUPER_ADMIN`, `MABICONS_ADMIN`, `CLIENT_ADMIN`, `HR_MANAGER`, `HR_EXECUTIVE`, `VIEWER`.
- Password hashing with bcrypt.
- JWT Bearer Authentication.
- Enforced tenant isolation prevents Client Admins from querying or mutating data of other clients.
