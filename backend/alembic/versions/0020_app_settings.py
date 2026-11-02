"""add app_settings key-value store, seeded with banner defaults

Revision ID: 0020
Revises: 0019
Create Date: 2026-11-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0020"
down_revision: Union[str, None] = "0019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

app_settings_table = sa.table(
    "app_settings",
    sa.column("key", sa.String),
    sa.column("value", sa.String),
)


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("key", sa.String(), primary_key=True),
        sa.Column("value", sa.String(), nullable=True),
    )
    op.bulk_insert(
        app_settings_table,
        [
            {"key": "banner_enabled", "value": "false"},
            {"key": "banner_message", "value": ""},
        ],
    )


def downgrade() -> None:
    op.drop_table("app_settings")
