from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.rbac import get_current_user
from app.schemas.schemas import LoginRequest, ChangePasswordRequest, Token, UserOut
from app.models.all_models import User, AuditLog
from datetime import datetime

router = APIRouter()

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.strip()).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is disabled"
        )

    # Audit log entry
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="USER_LOGIN",
        entity="users",
        entity_id=str(user.id),
        metadata_json=f"Login successful for {user.email}"
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(subject=user.email)
    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "client_id": user.client_id
    }
    return {"access_token": access_token, "token_type": "bearer", "user": user_dict}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows any authenticated user to change their account password."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="USER_CHANGE_PASSWORD",
        entity="users",
        entity_id=str(current_user.id),
        metadata_json=f"Password updated successfully for {current_user.email}"
    ))
    db.commit()

    return {"success": True, "message": "Password changed successfully"}
