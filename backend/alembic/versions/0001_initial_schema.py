"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-11

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# create_type=False on every enum below: the types are created/dropped explicitly
# in upgrade()/downgrade() instead of relying on op.create_table's/op.drop_table's
# implicit CREATE TYPE / DROP TYPE hooks, which conflict with an explicit create()
# call and raise "type already exists". See the Alembic cookbook entry on
# PostgreSQL ENUM types.
user_role = PGEnum("owner", "customer", name="user_role", create_type=False)
size_unit = PGEnum("sqft", "sqm", name="size_unit", create_type=False)
property_condition = PGEnum(
    "new", "good", "renovated", "needs_work", name="property_condition", create_type=False
)
furnishing_type = PGEnum(
    "furnished", "semi_furnished", "unfurnished", name="furnishing_type", create_type=False
)
rental_term = PGEnum("long_term", "medium_term", "short_term", name="rental_term", create_type=False)
listing_status = PGEnum("draft", "published", "archived", name="listing_status", create_type=False)
availability_status = PGEnum(
    "available", "unavailable", "under_maintenance", name="availability_status", create_type=False
)
media_type = PGEnum("photo", "video", name="media_type", create_type=False)
inquiry_status = PGEnum("new", "contacted", "closed", name="inquiry_status", create_type=False)
notification_type = PGEnum("new_inquiry", name="notification_type", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    for enum_type in (
        user_role,
        size_unit,
        property_condition,
        furnishing_type,
        rental_term,
        listing_status,
        availability_status,
        media_type,
        inquiry_status,
        notification_type,
    ):
        enum_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "property_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(80), nullable=False, unique=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
    )

    op.create_table(
        "property_subtypes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "category_id", sa.Integer(), sa.ForeignKey("property_categories.id"), nullable=False
        ),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("slug", sa.String(120), nullable=False, unique=True),
    )

    op.create_table(
        "properties",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "category_id", sa.Integer(), sa.ForeignKey("property_categories.id"), nullable=False
        ),
        sa.Column(
            "subtype_id", sa.Integer(), sa.ForeignKey("property_subtypes.id"), nullable=False
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("address_text", sa.String(300), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("size_value", sa.Numeric(10, 2), nullable=True),
        sa.Column("size_unit", size_unit, nullable=True),
        sa.Column("layout_description", sa.Text(), nullable=True),
        sa.Column("facilities", sa.JSON(), nullable=True),
        sa.Column("condition", property_condition, nullable=True),
        sa.Column("furnishing", furnishing_type, nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("min_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("price_currency", sa.String(10), nullable=False, server_default="LKR"),
        sa.Column("security_deposit", sa.Numeric(12, 2), nullable=True),
        sa.Column("rental_term", rental_term, nullable=False),
        sa.Column("renewal_terms", sa.Text(), nullable=True),
        sa.Column(
            "availability_status", availability_status, nullable=False, server_default="available"
        ),
        sa.Column("additional_charges", sa.JSON(), nullable=True),
        sa.Column("permitted_usage", sa.Text(), nullable=True),
        sa.Column("restrictions", sa.Text(), nullable=True),
        sa.Column("parking_access", sa.Text(), nullable=True),
        sa.Column("status", listing_status, nullable=False, server_default="published"),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()
        ),
    )
    op.create_index("ix_properties_owner_id", "properties", ["owner_id"])

    op.create_table(
        "property_photos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "property_id",
            sa.Integer(),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("url", sa.String(1000), nullable=False),
        sa.Column("media_type", media_type, nullable=False, server_default="photo"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_property_photos_property_id", "property_photos", ["property_id"])

    op.create_table(
        "favorites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "property_id",
            sa.Integer(),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("customer_id", "property_id", name="uq_favorite_customer_property"),
    )
    op.create_index("ix_favorites_customer_id", "favorites", ["customer_id"])

    op.create_table(
        "inquiries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "property_id",
            sa.Integer(),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
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

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", notification_type, nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("related_property_id", sa.Integer(), sa.ForeignKey("properties.id"), nullable=True),
        sa.Column("related_inquiry_id", sa.Integer(), sa.ForeignKey("inquiries.id"), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    _seed_taxonomy()


def _seed_taxonomy() -> None:
    categories_table = sa.table(
        "property_categories",
        sa.column("id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("slug", sa.String),
    )
    subtypes_table = sa.table(
        "property_subtypes",
        sa.column("id", sa.Integer),
        sa.column("category_id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("slug", sa.String),
    )

    categories = [
        (1, "Healthcare", "healthcare"),
        (2, "Education", "education"),
        (3, "Hospitality", "hospitality"),
        (4, "Vehicle", "vehicle"),
        (5, "Industrial", "industrial"),
        (6, "Food", "food"),
        (7, "Retail", "retail"),
        (8, "Office", "office"),
        (9, "Living", "living"),
        (10, "Events", "events"),
    ]
    op.bulk_insert(
        categories_table,
        [{"id": i, "name": n, "slug": s} for i, n, s in categories],
    )

    subtypes = [
        (1, 1, "Clinic", "healthcare-clinic"),
        (2, 1, "Medical center", "healthcare-medical-center"),
        (3, 1, "Dental clinic space", "healthcare-dental-clinic-space"),
        (4, 1, "Pharmacy space", "healthcare-pharmacy-space"),
        (5, 2, "Classroom", "education-classroom"),
        (6, 3, "Hotel", "hospitality-hotel"),
        (7, 4, "Parking space", "vehicle-parking-space"),
        (8, 4, "Vehicle yard", "vehicle-vehicle-yard"),
        (9, 5, "Warehouse", "industrial-warehouse"),
        (10, 5, "Factory", "industrial-factory"),
        (11, 6, "Restaurant space", "food-restaurant-space"),
        (12, 6, "Café space", "food-cafe-space"),
        (13, 7, "Shop", "retail-shop"),
        (14, 7, "Showroom", "retail-showroom"),
        (15, 8, "Office building", "office-office-building"),
        (16, 8, "Individual office", "office-individual-office"),
        (17, 8, "Meeting/conference room", "office-meeting-conference-room"),
        (18, 9, "House", "living-house"),
        (19, 9, "Apartment/flat", "living-apartment-flat"),
        (20, 9, "Villa", "living-villa"),
        (21, 9, "Room", "living-room"),
        (22, 9, "Boarding house", "living-boarding-house"),
        (23, 9, "Guest house", "living-guest-house"),
        (24, 10, "Event hall", "events-event-hall"),
        (25, 10, "Wedding hall", "events-wedding-hall"),
        (26, 10, "Conference hall", "events-conference-hall"),
        (27, 10, "Party/function space", "events-party-function-space"),
    ]
    op.bulk_insert(
        subtypes_table,
        [{"id": i, "category_id": c, "name": n, "slug": s} for i, c, n, s in subtypes],
    )

    # explicit ids were used above, so the identity sequences need to catch up
    op.execute(
        "SELECT setval(pg_get_serial_sequence('property_categories', 'id'), "
        "(SELECT MAX(id) FROM property_categories))"
    )
    op.execute(
        "SELECT setval(pg_get_serial_sequence('property_subtypes', 'id'), "
        "(SELECT MAX(id) FROM property_subtypes))"
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("inquiries")
    op.drop_table("favorites")
    op.drop_table("property_photos")
    op.drop_table("properties")
    op.drop_table("property_subtypes")
    op.drop_table("property_categories")
    op.drop_table("users")

    bind = op.get_bind()
    for enum_type in (
        notification_type,
        inquiry_status,
        media_type,
        availability_status,
        listing_status,
        rental_term,
        furnishing_type,
        property_condition,
        size_unit,
        user_role,
    ):
        enum_type.drop(bind, checkfirst=True)
