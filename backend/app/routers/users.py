from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserShort
from app.auth.dependencies import get_current_user, require_finance
from typing import List

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserShort])
def list_users(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(User).all()


@router.post("", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_finance)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        hashed_password=bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode(),
        full_name=data.full_name,
        role=data.role,
        department=data.department,
        manager_id=data.manager_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/managers", response_model=List[UserShort])
def list_managers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(User).filter(User.role.in_(["manager", "finance"])).all()
