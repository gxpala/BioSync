# Mabicons Central Biometric Attendance Platform

Centralized, production-ready multi-tenant biometric attendance SaaS platform built for **Mabicons Technosoft Pvt Ltd**.
Manages 50+ clients and heterogeneous biometric device hardware (eSSL, MORX, ZKTeco, etc.) across LAN subnets and cloud push protocols from one dashboard.

---

## Technical Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, Pytest
- **Database**: PostgreSQL (Default fallback SQLite for zero-config local run out-of-the-box)
- **Local Agent**: Python Windows Service / Daemon (`local_connector/`)
- **Containerization**: Docker Compose (`docker-compose.yml`)

---

## Quickstart Guide

### Option 1: Run Locally (Fastest)

#### 1. Start Backend Server
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Run backend (Option A - Direct):
python app/main.py

# Or (Option B - Module mode):
python -m app.main

# Or (Option C - Uvicorn directly):
python -m uvicorn app.main:app --reload --port 8000
```
Backend will start on `http://localhost:8000`. OpenAPI docs available at `http://localhost:8000/api/v1/docs`.
Demo data auto-seeds on first startup!

#### 2. Start Frontend Server
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

#### 3. Credentials
- **Super Admin Login**:
  - Email: `superadmin@mabicons.com`
  - Password: `Admin@123`
- **Client Admin Login (V & Y Solar)**:
  - Email: `admin@vysolar.com`
  - Password: `Client@123`

---

### Option 2: Run via Docker Compose

```bash
docker-compose up --build
```
This spins up PostgreSQL database, FastAPI backend, and Vite frontend.

---

## Running Local Connector Agent (Private LANs)

```bash
cd local_connector
python connector.py
```
Reads settings from `config.example.json`, registers with the cloud API, buffers punches in SQLite if offline, and streams punches outbound over HTTPS.

---

## Running Automated Tests

```bash
cd backend
python -m pytest -v
```

---

## Documentation Index

- [Architecture Overview](docs/architecture.md)
- [Device Integration & Adapters](docs/device-integration.md)
- [Local Connector Agent](docs/local-connector.md)
- [Attendance Processing Engine](docs/attendance-engine.md)
- [API Reference](docs/api.md)
