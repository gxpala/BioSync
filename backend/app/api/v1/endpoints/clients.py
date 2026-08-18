from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user, require_super_admin, enforce_tenant_isolation
from app.schemas.schemas import ClientCreate, ClientOut
from app.models.all_models import Client, User, UserRole, AuditLog

router = APIRouter()

@router.get("", response_model=List[ClientOut])
def list_clients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.MABICONS_ADMIN]:
        return db.query(Client).all()
    else:
        if not current_user.client_id:
            return []
        return db.query(Client).filter(Client.id == current_user.client_id).all()

@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    existing = db.query(Client).filter(Client.client_code == payload.client_code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Client Code already exists")

    client = Client(
        client_name=payload.client_name,
        client_code=payload.client_code.upper(),
        contact_person=payload.contact_person,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        status=payload.status
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CLIENT_CREATE",
        entity="clients",
        entity_id=str(client.id),
        metadata_json=f"Created client {client.client_name} ({client.client_code})"
    ))
    db.commit()
    return client

@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    enforce_tenant_isolation(current_user, client_id)
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.put("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.client_name = payload.client_name
    client.contact_person = payload.contact_person
    client.email = payload.email
    client.phone = payload.phone
    client.address = payload.address
    client.status = payload.status

    db.commit()
    db.refresh(client)

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CLIENT_UPDATE",
        entity="clients",
        entity_id=str(client.id),
        metadata_json=f"Updated client {client.client_name}"
    ))
    db.commit()
    return client
