"""property reviews

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-01

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("booking_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="review_rating_range"),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_id", name="uq_reviews_booking_id"),
    )
    op.create_index(
        op.f("ix_reviews_booking_id"), "reviews", ["booking_id"], unique=False
    )
    op.create_index(
        op.f("ix_reviews_customer_id"), "reviews", ["customer_id"], unique=False
    )
    op.create_index(
        op.f("ix_reviews_property_id"), "reviews", ["property_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_reviews_property_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_customer_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_booking_id"), table_name="reviews")
    op.drop_table("reviews")
