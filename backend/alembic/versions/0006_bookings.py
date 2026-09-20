"""booking requests

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

booking_status = PGEnum("pending", "accepted", "rejected", "cancelled", name="booking_status", create_type=False)


def upgrade() -> None:
    booking_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", booking_status, nullable=False, server_default="pending"),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()
        ),
    )
    op.create_index("ix_bookings_property_id", "bookings", ["property_id"])
    op.create_index("ix_bookings_customer_id", "bookings", ["customer_id"])
    op.create_index("ix_bookings_owner_id", "bookings", ["owner_id"])

    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_request'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_accepted'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_rejected'")

    op.add_column(
        "notifications",
        sa.Column("related_booking_id", sa.Integer(), sa.ForeignKey("bookings.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("notifications", "related_booking_id")
    # Postgres has no ALTER TYPE ... DROP VALUE; the three booking_* values
    # are left in notification_type on downgrade (harmless — unused options).
    op.drop_table("bookings")
    booking_status.drop(op.get_bind(), checkfirst=True)
