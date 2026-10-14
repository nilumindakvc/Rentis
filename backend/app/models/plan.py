from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_active_listings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    allows_booking: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    allows_connect: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    monthly_price_lkr: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0, server_default="0")
    stripe_product_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stripe_price_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    features: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
