"""seed vehicle and good demo listings — gutted for fresh DB

Revision ID: 0014
Revises: 0013
Create Date: 2026-10-04

Seed data removed. Revision chain (0013 → 0014) kept intact.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0014"
down_revision: Union[str, None] = "0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
