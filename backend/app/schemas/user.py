from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str
    manager_id: Optional[str] = None


class UserOut(UserBase):
    id: str
    manager_id: Optional[str] = None

    model_config = {"from_attributes": True}


class UserShort(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    department: Optional[str] = None

    model_config = {"from_attributes": True}


class UserUpdateSelf(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
