import uuid
from sqlalchemy import String, Numeric, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    max_amount_per_item: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    max_amount_per_day: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    requires_receipt_above: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
