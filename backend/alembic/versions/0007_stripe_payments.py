"""stripe connect payments

Revision ID: 0007
Revises: 0006
Create Date: 2026-09-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

payment_status = PGEnum("unpaid", "paid", name="payment_status", create_type=False)


def upgrade() -> None:
    payment_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "bookings",
        sa.Column("amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
    )
    op.add_column(
        "bookings",
        sa.Column("currency", sa.String(10), nullable=False, server_default="LKR"),
    )
    op.add_column(
        "bookings",
        sa.Column(
            "payment_status", payment_status, nullable=False, server_default="unpaid"
        ),
    )
    op.add_column(
        "bookings",
        sa.Column("stripe_checkout_session_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "bookings", sa.Column("stripe_payment_intent_id", sa.String(255), nullable=True)
    )

    op.add_column(
        "users", sa.Column("stripe_account_id", sa.String(255), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column(
            "stripe_payouts_enabled",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )

    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_paid'")


def downgrade() -> None:
    op.drop_column("users", "stripe_payouts_enabled")
    op.drop_column("users", "stripe_account_id")

    op.drop_column("bookings", "stripe_payment_intent_id")
    op.drop_column("bookings", "stripe_checkout_session_id")
    op.drop_column("bookings", "payment_status")
    op.drop_column("bookings", "currency")
    op.drop_column("bookings", "amount")

    # Postgres has no ALTER TYPE ... DROP VALUE; 'booking_paid' is left in
    # notification_type on downgrade (harmless — unused option).
    payment_status.drop(op.get_bind(), checkfirst=True)
