"""conversations and messages, retire inquiries

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("property_id", sa.Integer(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()
        ),
        sa.UniqueConstraint(
            "property_id", "owner_id", "customer_id", name="uq_conversation_property_owner_customer"
        ),
    )
    op.create_index("ix_conversations_property_id", "conversations", ["property_id"])
    op.create_index("ix_conversations_owner_id", "conversations", ["owner_id"])
    op.create_index("ix_conversations_customer_id", "conversations", ["customer_id"])

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.Integer(),
            sa.ForeignKey("conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])

    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_message'")

    op.add_column(
        "notifications",
        sa.Column("related_conversation_id", sa.Integer(), sa.ForeignKey("conversations.id"), nullable=True),
    )
    op.drop_column("notifications", "related_inquiry_id")

    op.drop_table("inquiries")
    op.execute("DROP TYPE inquiry_status")


def downgrade() -> None:
    inquiry_status = sa.Enum("new", "contacted", "closed", name="inquiry_status")
    inquiry_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "inquiries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "property_id", sa.Integer(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", inquiry_status, nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()
        ),
    )
    op.create_index("ix_inquiries_property_id", "inquiries", ["property_id"])
    op.create_index("ix_inquiries_customer_id", "inquiries", ["customer_id"])

    op.add_column(
        "notifications",
        sa.Column("related_inquiry_id", sa.Integer(), sa.ForeignKey("inquiries.id"), nullable=True),
    )
    op.drop_column("notifications", "related_conversation_id")

    # Postgres has no ALTER TYPE ... DROP VALUE; 'new_message' is left in the
    # notification_type enum on downgrade (harmless — just an unused option).

    op.drop_table("messages")
    op.drop_table("conversations")
