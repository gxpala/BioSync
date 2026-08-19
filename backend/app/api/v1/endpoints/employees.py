from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user, enforce_tenant_isolation
from app.schemas.schemas import EmployeeCreate, EmployeeOut, EmployeeDeviceMappingCreate
from app.models.all_models import Employee, EmployeeDeviceMapping, Device, Client, User, UserRole, AuditLog

router = APIRouter()

@router.get("", response_model=List[EmployeeOut])
def list_employees(
    client_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Employee)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        if current_user.client_id:
            query = query.filter(Employee.client_id == current_user.client_id)
        else:
            return []
    elif client_id:
        query = query.filter(Employee.client_id == client_id)

    if branch_id:
        query = query.filter(Employee.branch_id == branch_id)
    if department:
        query = query.filter(Employee.department.ilike(f"%{department}%"))

    return query.all()

@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enforce_tenant_isolation(current_user, payload.client_id)

    employee = Employee(
        client_id=payload.client_id,
        branch_id=payload.branch_id,
        employee_code=payload.employee_code.strip(),
        default_device_user_id=payload.default_device_user_id or payload.employee_code.strip(),
        employee_name=payload.employee_name,
        email=payload.email,
        phone=payload.phone,
        department=payload.department,
        designation=payload.designation,
        joining_date=payload.joining_date,
        status=payload.status
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="EMPLOYEE_CREATE",
        entity="employees",
        entity_id=str(employee.id),
        metadata_json=f"Created employee {employee.employee_name} ({employee.employee_code})"
    ))
    db.commit()
    return employee

@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    enforce_tenant_isolation(current_user, emp.client_id)
    enforce_tenant_isolation(current_user, payload.client_id)

    emp.client_id = payload.client_id
    emp.branch_id = payload.branch_id
    emp.employee_code = payload.employee_code.strip()
    emp.default_device_user_id = payload.default_device_user_id or payload.employee_code.strip()
    emp.employee_name = payload.employee_name
    emp.email = payload.email
    emp.phone = payload.phone
    emp.department = payload.department
    emp.designation = payload.designation
    emp.joining_date = payload.joining_date
    emp.status = payload.status

    db.commit()
    db.refresh(emp)

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="EMPLOYEE_UPDATE",
        entity="employees",
        entity_id=str(emp.id),
        metadata_json=f"Updated employee {emp.employee_name} ({emp.employee_code})"
    ))
    db.commit()
    return emp

@router.get("/{employee_id}/mappings")
def get_employee_device_mappings(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    enforce_tenant_isolation(current_user, emp.client_id)

    mappings = db.query(EmployeeDeviceMapping).filter(EmployeeDeviceMapping.employee_id == employee_id).all()
    res = []
    for m in mappings:
        dev = db.query(Device).filter(Device.id == m.device_id).first()
        res.append({
            "id": m.id,
            "employee_id": m.employee_id,
            "device_id": m.device_id,
            "device_name": dev.device_name if dev else "Unknown Device",
            "device_serial": dev.serial_number if dev else "",
            "device_user_id": m.device_user_id,
            "created_at": m.created_at
        })
    return res

@router.post("/mappings", status_code=status.HTTP_201_CREATED)
def create_employee_device_mapping(
    payload: EmployeeDeviceMappingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    enforce_tenant_isolation(current_user, emp.client_id)

    dev = db.query(Device).filter(Device.id == payload.device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Target Biometric Device not found")

    mapping = db.query(EmployeeDeviceMapping).filter(
        EmployeeDeviceMapping.device_id == payload.device_id,
        EmployeeDeviceMapping.device_user_id == payload.device_user_id.strip()
    ).first()

    if mapping:
        mapping.employee_id = payload.employee_id
    else:
        mapping = EmployeeDeviceMapping(
            employee_id=payload.employee_id,
            device_id=payload.device_id,
            device_user_id=payload.device_user_id.strip()
        )
        db.add(mapping)

    db.commit()
    db.refresh(mapping)
    return {"message": "Employee device mapping saved successfully", "mapping_id": mapping.id}

@router.delete("/{employee_id}", status_code=status.HTTP_200_OK)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    enforce_tenant_isolation(current_user, emp.client_id)

    emp_name = emp.employee_name

    db.delete(emp)
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="EMPLOYEE_DELETE",
        entity="employees",
        entity_id=str(employee_id),
        metadata_json=f"Deleted employee record {emp_name}"
    ))
    db.commit()

    return {"message": f"Employee {emp_name} deleted successfully"}
