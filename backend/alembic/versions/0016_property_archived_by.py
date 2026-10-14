"""property archived_by tracking

Revision ID: 0016
Revises: 0015
Create Date: 2026-10-11

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0016"
down_revision: Union[str, None] = "0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("archived_by_role", sa.String(length=10), nullable=True))
    op.add_column("properties", sa.Column("archived_by_name", sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column("properties", "archived_by_name")
    op.drop_column("properties", "archived_by_role")
