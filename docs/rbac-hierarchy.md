# Role-Based Access Control (RBAC) & Multi-Tenant Hierarchy

This document outlines the multi-tenant role hierarchy, security boundary rules, and feature permission matrix for **Mabicons Central Biometric Attendance Platform**.

---

## 1. Tenant Isolation Architecture

The platform enforces strict multi-tenant data isolation:
- **Super Admin (`SUPER_ADMIN` / `MABICONS_ADMIN`)**: Unrestricted global scope across all 50+ clients.
- **Client Roles (`CLIENT_ADMIN`, `HR_MANAGER`, `HR_EXECUTIVE`, `VIEWER`)**: Strictly scoped to their assigned `client_id`. Backend API middleware automatically enforces tenant boundaries (`enforce_tenant_isolation`) and rejects any cross-tenant data requests with HTTP 403 Forbidden.

---

## 2. Role Definitions & Access Levels

### 👑 1. Super Admin (`SUPER_ADMIN` / `MABICONS_ADMIN`)
*Primary Mabicons operations team managing multi-tenant client infrastructure.*

- **Scope**: Platform-Wide (Central Access across all clients).
- **Access Level**: **100% Unrestricted Full Control**
  - **Client Management**: Create, edit, suspend, or delete client organizations.
  - **Exclusive Device & Hardware Management**: Access to `/devices`, `/devices/new`, `/device-monitoring`, live hardware connection testing, and downloading 1-Click Client Agent Installers (`.bat`).
  - **Global Tenant Selector**: Switch between `All Clients` or filter down to any specific client using the top **Client Scope** dropdown in the header.
  - **Audit Logs**: Access system security audit trails.

---

### 🏢 2. Client Admin (`CLIENT_ADMIN`)
*IT Head / Organization Admin at a specific client company (e.g. V & Y Solar).*

- **Scope**: **Tenant Isolated** (Strictly locked to their own company `client_id`).
- **Access Level**: **Company Administrative Control**
  - **Branches & Locations**: Add/edit office branches for their company.
  - **Employee Directory**: Add, update, and manage employees and default device mappings.
  - **Shift Management**: Create and configure shift timings, grace periods, and weekly off days.
  - **Attendance Operations**: View Live Punches, inspect Raw Punches, trigger daily attendance recalculations, and download CSV reports.
  - **Restricted**: Cannot view or access other clients' data, cannot modify physical biometric hardware settings or download agent installers (managed by Mabicons), and cannot view system audit logs.

---

### 👔 3. HR Manager (`HR_MANAGER`)
*HR Heads responsible for daily employee attendance and payroll preparation.*

- **Scope**: Single Client Organization.
- **Access Level**: **HR Operational Access**
  - **Employee Management**: View and edit employee profiles.
  - **Shift Schedules**: View shift timings and assign employee shifts.
  - **Attendance Management**: Review daily attendance (Present, Late, Absent, Half Day), add manual attendance remarks/edits, and trigger attendance recalculation.
  - **Reports**: Generate and export attendance summary reports to CSV.
  - **Restricted**: Cannot create clients, add new office branches, or configure biometric hardware.

---

### 📋 4. HR Executive (`HR_EXECUTIVE`)
*Junior HR staff verifying daily punch logs and late entries.*

- **Scope**: Single Client Organization / Branch.
- **Access Level**: **Daily Verification Access**
  - View Employee Directory.
  - Monitor Live Punches stream and daily attendance records.
  - Export basic attendance reports.
  - **Restricted**: Read-mostly access; cannot change shift policies or company settings.

---

### 👁️ 5. Viewer (`VIEWER`)
*Auditors or management executives requiring visibility without edit powers.*

- **Scope**: Single Client Organization.
- **Access Level**: **Read-Only**
  - View-only access to daily attendance summaries and employee lists.
  - **Restricted**: Cannot create, edit, recalculate, or delete any data.

---

## 3. Feature & Permission Matrix

| Feature / Page | Super Admin | Client Admin | HR Manager | HR Executive | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **All Clients Scope Switcher** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Client Management** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Biometric Devices & Hardware Config** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Download Client Agent Installer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Branch Management** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Shift Policy Configuration** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Employee Directory** | ✅ | ✅ | ✅ | ✅ (Read) | ✅ (Read) |
| **Daily Attendance & Recalculation** | ✅ | ✅ | ✅ | ✅ | ✅ (Read) |
| **Reports & CSV Downloads** | ✅ | ✅ | ✅ | ✅ | ✅ |
