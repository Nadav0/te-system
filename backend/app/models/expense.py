import uuid
from datetime import date, datetime
from sqlalchemy import String, Numeric, Date, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ExpenseReport(Base):
    __tablename__ = "expense_reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    travel_request_id: Mapped[str | None] = mapped_column(String, ForeignKey("travel_requests.id"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee: Mapped["User"] = relationship("User", back_populates="expense_reports", foreign_keys=[employee_id])  # type: ignore[name-defined]
    reviewer: Mapped["User | None"] = relationship("User", foreign_keys=[reviewed_by])  # type: ignore[name-defined]
    travel_request: Mapped["TravelRequest | None"] = relationship("TravelRequest", back_populates="expense_reports")  # type: ignore[name-defined]
    items: Mapped[list["ExpenseItem"]] = relationship("ExpenseItem", back_populates="report", cascade="all, delete-orphan")

    @property
    def total_amount(self) -> float:
        return sum(float(item.amount) for item in self.items)

    @property
    def has_violations(self) -> bool:
        return any(item.policy_violation for item in self.items)


class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id: Mapped[str] = mapped_column(String, ForeignKey("expense_reports.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    receipt_url: Mapped[str | None] = mapped_column(String, nullable=True)
    policy_violation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    violation_detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    report: Mapped["ExpenseReport"] = relationship("ExpenseReport", back_populates="items")
