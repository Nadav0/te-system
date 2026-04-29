import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="employee")
    department: Mapped[str] = mapped_column(String, nullable=True)
    manager_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)

    # Relationships
    manager: Mapped["User | None"] = relationship("User", remote_side="User.id", foreign_keys=[manager_id])
    direct_reports: Mapped[list["User"]] = relationship("User", back_populates="manager", foreign_keys=[manager_id])
    expense_reports: Mapped[list["ExpenseReport"]] = relationship(  # type: ignore[name-defined]
        "ExpenseReport", back_populates="employee", foreign_keys="ExpenseReport.employee_id"
    )
    travel_requests: Mapped[list["TravelRequest"]] = relationship(  # type: ignore[name-defined]
        "TravelRequest", back_populates="employee", foreign_keys="TravelRequest.employee_id"
    )
