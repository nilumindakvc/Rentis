"""admin panel: admins, admin_refresh_tokens, users.is_active

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

admin_role = PGEnum("admin", "super_admin", name="admin_role", create_type=False)


def upgrade() -> None:
    admin_role.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "admins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password", sa.String(255), nullable=False),
        sa.Column("role", admin_role, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_admins_email", "admins", ["email"])
    # Enforces "only one super_admin" at the database level: a partial unique
    # index on `role` restricted to rows where role='super_admin' means at
    # most one such row can ever exist.
    op.create_index(
        "uq_single_super_admin",
        "admins",
        ["role"],
        unique=True,
        postgresql_where=sa.text("role = 'super_admin'"),
    )

    op.create_table(
        "admin_refresh_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("admin_id", sa.Integer(), sa.ForeignKey("admins.id", ondelete="CASCADE"), nullable=False),
        sa.Column("jti", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_admin_refresh_tokens_admin_id", "admin_refresh_tokens", ["admin_id"])
    op.create_index("ix_admin_refresh_tokens_jti", "admin_refresh_tokens", ["jti"], unique=True)

    op.add_column(
        "users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true")
    )


def downgrade() -> None:
    op.drop_column("users", "is_active")
    op.drop_table("admin_refresh_tokens")
    op.drop_index("uq_single_super_admin", table_name="admins")
    op.drop_table("admins")
    admin_role.drop(op.get_bind(), checkfirst=True)
