from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OwnerSubscription(Base):
    __tablename__ = "owner_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Stripe Billing
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stripe_subscription_item_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    billing_status: Mapped[str] = mapped_column(String(20), nullable=False, default="free", server_default="free")
    trial_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    grace_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    has_used_trial: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    owner = relationship("User", back_populates="subscription")
    plan = relationship("Plan")
