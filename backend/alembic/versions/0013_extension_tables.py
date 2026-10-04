"""vehicle_details and good_details extension tables

Revision ID: 0013
Revises: 0012
Create Date: 2026-10-04

Adds optional 1-to-1 extension tables for vehicle-specific and
good-specific fields. Each table uses the property_id as its PK
and FK so there is no separate surrogate key.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

revision: str = "0013"
down_revision: Union[str, None] = "0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

fuel_type = PGEnum("petrol", "diesel", "electric", "hybrid", name="fuel_type", create_type=False)
transmission_type = PGEnum("manual", "automatic", name="transmission_type", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    fuel_type.create(bind, checkfirst=True)
    transmission_type.create(bind, checkfirst=True)

    op.create_table(
        "vehicle_details",
        sa.Column(
            "property_id",
            sa.Integer(),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("make", sa.String(100), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("color", sa.String(50), nullable=True),
        sa.Column("fuel_type", fuel_type, nullable=True),
        sa.Column("transmission", transmission_type, nullable=True),
        sa.Column("mileage_km", sa.Integer(), nullable=True),
        sa.Column("seats", sa.Integer(), nullable=True),
        sa.Column("engine_cc", sa.Integer(), nullable=True),
        sa.Column("has_ac", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("has_gps", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("driver_included", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_table(
        "good_details",
        sa.Column(
            "property_id",
            sa.Integer(),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("brand", sa.String(120), nullable=True),
        sa.Column("model_number", sa.String(120), nullable=True),
        sa.Column("quantity_available", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("returnable", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("condition_notes", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("good_details")
    op.drop_table("vehicle_details")

    bind = op.get_bind()
    transmission_type.drop(bind, checkfirst=True)
    fuel_type.drop(bind, checkfirst=True)
