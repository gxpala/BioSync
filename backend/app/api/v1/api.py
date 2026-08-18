from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, clients, branches, devices, employees, shifts,
    raw_punches, attendance, connector, adms_listener, dashboard, reports, audit
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(branches.router, prefix="/branches", tags=["Branches"])
api_router.include_router(devices.router, prefix="/devices", tags=["Devices"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employees"])
api_router.include_router(shifts.router, prefix="/shifts", tags=["Shifts"])
api_router.include_router(raw_punches.router, prefix="/raw-punches", tags=["Raw Punches"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Daily Attendance"])
api_router.include_router(connector.router, prefix="/connector", tags=["Local Connector API"])
api_router.include_router(adms_listener.router, prefix="/adms", tags=["ADMS Listener"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard Analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Logs"])
