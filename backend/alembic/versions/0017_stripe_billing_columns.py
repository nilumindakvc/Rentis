"""add Stripe billing columns to plans, users, owner_subscriptions

Revision ID: 0017
Revises: 0016
Create Date: 2026-10-11
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0017"
down_revision: Union[str, None] = "0016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extend notification_type enum with payment_failed
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_failed'")

    # plans — Stripe product/price IDs and Connect gate
    op.add_column("plans", sa.Column("stripe_product_id", sa.String(100), nullable=True))
    op.add_column("plans", sa.Column("stripe_price_id", sa.String(100), nullable=True))
    op.add_column(
        "plans",
        sa.Column("allows_connect", sa.Boolean(), nullable=False, server_default="false"),
    )

    # users — Stripe Billing customer ID (separate from Connect stripe_account_id)
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(100), nullable=True))

    # owner_subscriptions — full Stripe Billing state
    op.add_column(
        "owner_subscriptions",
        sa.Column("stripe_subscription_id", sa.String(100), nullable=True),
    )
    op.add_column(
        "owner_subscriptions",
        sa.Column("stripe_subscription_item_id", sa.String(100), nullable=True),
    )
    op.add_column(
        "owner_subscriptions",
        sa.Column(
            "billing_status",
            sa.String(20),
            nullable=False,
            server_default="free",
        ),
    )
    op.add_column(
        "owner_subscriptions",
        sa.Column("trial_end", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "owner_subscriptions",
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "owner_subscriptions",
        sa.Column(
            "cancel_at_period_end",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "owner_subscriptions",
        sa.Column("grace_ends_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "owner_subscriptions",
        sa.Column(
            "has_used_trial",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )


def downgrade() -> None:
    op.drop_column("owner_subscriptions", "has_used_trial")
    op.drop_column("owner_subscriptions", "grace_ends_at")
    op.drop_column("owner_subscriptions", "cancel_at_period_end")
    op.drop_column("owner_subscriptions", "current_period_end")
    op.drop_column("owner_subscriptions", "trial_end")
    op.drop_column("owner_subscriptions", "billing_status")
    op.drop_column("owner_subscriptions", "stripe_subscription_item_id")
    op.drop_column("owner_subscriptions", "stripe_subscription_id")
    op.drop_column("users", "stripe_customer_id")
    op.drop_column("plans", "allows_connect")
    op.drop_column("plans", "stripe_price_id")
    op.drop_column("plans", "stripe_product_id")
