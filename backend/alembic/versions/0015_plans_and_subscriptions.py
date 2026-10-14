"""plans and owner_subscriptions

Revision ID: 0015
Revises: 0014
Create Date: 2026-10-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0015"
down_revision: Union[str, None] = "0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=30), nullable=False, unique=True),
        sa.Column("name", sa.String(length=60), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("max_active_listings", sa.Integer(), nullable=True),
        sa.Column("allows_booking", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("monthly_price_lkr", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "owner_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("plans.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    plans_table = sa.table(
        "plans",
        sa.column("id", sa.Integer),
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("max_active_listings", sa.Integer),
        sa.column("allows_booking", sa.Boolean),
        sa.column("monthly_price_lkr", sa.Numeric),
        sa.column("sort_order", sa.Integer),
    )

    bind = op.get_bind()
    bind.execute(
        plans_table.insert(),
        [
            {
                "code": "free",
                "name": "Free",
                "description": "Message customers and keep up to 3 active listings.",
                "max_active_listings": 3,
                "allows_booking": False,
                "monthly_price_lkr": 0,
                "sort_order": 0,
            },
            {
                "code": "pro",
                "name": "Pro",
                "description": "Messaging, booking requests, and Stripe checkout for up to 15 active listings.",
                "max_active_listings": 15,
                "allows_booking": True,
                "monthly_price_lkr": 4900,
                "sort_order": 1,
            },
        ],
    )

    free_plan_id = bind.execute(
        sa.text("SELECT id FROM plans WHERE code = 'free'")
    ).scalar()

    bind.execute(
        sa.text(
            """
            INSERT INTO owner_subscriptions (owner_id, plan_id)
            SELECT u.id, :free_plan_id
            FROM users u
            WHERE u.role = 'owner'
              AND NOT EXISTS (
                  SELECT 1 FROM owner_subscriptions os WHERE os.owner_id = u.id
              )
            """
        ),
        {"free_plan_id": free_plan_id},
    )


def downgrade() -> None:
    op.drop_table("owner_subscriptions")
    op.drop_table("plans")
