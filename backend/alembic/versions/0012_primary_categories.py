"""primary categories restructure

Revision ID: 0012
Revises: 0011
Create Date: 2026-10-04

Renames property_categories → property_secondary_categories, adds
property_primary_categories (Place / Vehicle / Good), wires up FK on both
property_secondary_categories and properties, then seeds Vehicle and Good
secondary categories + subtypes.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. Create property_primary_categories and seed Place / Vehicle / Good
    # ------------------------------------------------------------------ #
    op.create_table(
        "property_primary_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(80), nullable=False, unique=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
    )
    op.bulk_insert(
        sa.table(
            "property_primary_categories",
            sa.column("id", sa.Integer),
            sa.column("name", sa.String),
            sa.column("slug", sa.String),
        ),
        [
            {"id": 1, "name": "Place", "slug": "place"},
            {"id": 2, "name": "Vehicle", "slug": "vehicle"},
            {"id": 3, "name": "Good", "slug": "good"},
        ],
    )
    op.execute(
        "SELECT setval(pg_get_serial_sequence('property_primary_categories', 'id'), 3)"
    )

    # ------------------------------------------------------------------ #
    # 2. Rename property_categories → property_secondary_categories
    #    PostgreSQL automatically updates FK references in child tables.
    # ------------------------------------------------------------------ #
    op.rename_table("property_categories", "property_secondary_categories")

    # ------------------------------------------------------------------ #
    # 3. Add primary_category_id to property_secondary_categories
    #    All existing rows are place-type categories → id = 1.
    # ------------------------------------------------------------------ #
    op.add_column(
        "property_secondary_categories",
        sa.Column("primary_category_id", sa.Integer(), nullable=True),
    )
    op.execute("UPDATE property_secondary_categories SET primary_category_id = 1")
    op.alter_column("property_secondary_categories", "primary_category_id", nullable=False)
    op.create_foreign_key(
        "fk_secondary_cat_primary_cat",
        "property_secondary_categories", "property_primary_categories",
        ["primary_category_id"], ["id"],
    )

    # ------------------------------------------------------------------ #
    # 4. Add denormalised primary_category_id to properties
    #    Derived from the secondary category's primary_category_id.
    # ------------------------------------------------------------------ #
    op.add_column(
        "properties",
        sa.Column("primary_category_id", sa.Integer(), nullable=True),
    )
    op.execute("""
        UPDATE properties p
        SET    primary_category_id = sc.primary_category_id
        FROM   property_secondary_categories sc
        WHERE  p.category_id = sc.id
    """)
    op.alter_column("properties", "primary_category_id", nullable=False)
    op.create_foreign_key(
        "fk_properties_primary_category",
        "properties", "property_primary_categories",
        ["primary_category_id"], ["id"],
    )
    op.create_index("ix_properties_primary_category_id", "properties", ["primary_category_id"])

    # ------------------------------------------------------------------ #
    # 5. Seed Vehicle and Good secondary categories + subtypes
    # ------------------------------------------------------------------ #
    _seed_vehicle_and_good()


def _seed_vehicle_and_good() -> None:
    secondary_table = sa.table(
        "property_secondary_categories",
        sa.column("id", sa.Integer),
        sa.column("primary_category_id", sa.Integer),
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

    # ids 11-16 → Vehicle  |  17-22 → Good
    new_secondaries = [
        (11, 2, "Cars",             "vehicle-cars"),
        (12, 2, "Motorcycles",      "vehicle-motorcycles"),
        (13, 2, "Vans & Buses",     "vehicle-vans-buses"),
        (14, 2, "Trucks & Lorries", "vehicle-trucks-lorries"),
        (15, 2, "Boats",            "vehicle-boats"),
        (16, 2, "Heavy Equipment",  "vehicle-heavy-equipment"),
        (17, 3, "Electronics",          "good-electronics"),
        (18, 3, "Furniture",            "good-furniture"),
        (19, 3, "Tools & Equipment",    "good-tools-equipment"),
        (20, 3, "Event & Party",        "good-event-party"),
        (21, 3, "Sports & Outdoor",     "good-sports-outdoor"),
        (22, 3, "Clothing & Costumes",  "good-clothing-costumes"),
    ]
    op.bulk_insert(secondary_table, [
        {"id": i, "primary_category_id": p, "name": n, "slug": s}
        for i, p, n, s in new_secondaries
    ])

    # ids 28-49 → Vehicle subtypes  |  50-73 → Good subtypes
    new_subtypes = [
        # Cars (11)
        (28, 11, "Sedan",           "vehicle-cars-sedan"),
        (29, 11, "SUV",             "vehicle-cars-suv"),
        (30, 11, "Hatchback",       "vehicle-cars-hatchback"),
        (31, 11, "Pickup",          "vehicle-cars-pickup"),
        (32, 11, "Van",             "vehicle-cars-van"),
        # Motorcycles (12)
        (33, 12, "Standard",        "vehicle-motorcycles-standard"),
        (34, 12, "Scooter",         "vehicle-motorcycles-scooter"),
        (35, 12, "Sport",           "vehicle-motorcycles-sport"),
        (36, 12, "Cruiser",         "vehicle-motorcycles-cruiser"),
        # Vans & Buses (13)
        (37, 13, "Minivan",         "vehicle-vans-minivan"),
        (38, 13, "Passenger Bus",   "vehicle-vans-passenger-bus"),
        (39, 13, "Mini Bus",        "vehicle-vans-mini-bus"),
        # Trucks & Lorries (14)
        (40, 14, "Flatbed",         "vehicle-trucks-flatbed"),
        (41, 14, "Covered Lorry",   "vehicle-trucks-covered-lorry"),
        (42, 14, "Refrigerated",    "vehicle-trucks-refrigerated"),
        # Boats (15)
        (43, 15, "Speedboat",       "vehicle-boats-speedboat"),
        (44, 15, "Fishing Boat",    "vehicle-boats-fishing-boat"),
        (45, 15, "Catamaran",       "vehicle-boats-catamaran"),
        # Heavy Equipment (16)
        (46, 16, "Excavator",       "vehicle-heavy-excavator"),
        (47, 16, "Forklift",        "vehicle-heavy-forklift"),
        (48, 16, "Generator",       "vehicle-heavy-generator"),
        (49, 16, "Scaffolding",     "vehicle-heavy-scaffolding"),
        # Electronics (17)
        (50, 17, "Camera",          "good-electronics-camera"),
        (51, 17, "Projector",       "good-electronics-projector"),
        (52, 17, "Audio System",    "good-electronics-audio-system"),
        (53, 17, "Drone",           "good-electronics-drone"),
        # Furniture (18)
        (54, 18, "Sofa Set",        "good-furniture-sofa-set"),
        (55, 18, "Dining Set",      "good-furniture-dining-set"),
        (56, 18, "Office Chair",    "good-furniture-office-chair"),
        (57, 18, "Bed Frame",       "good-furniture-bed-frame"),
        # Tools & Equipment (19)
        (58, 19, "Power Tools",     "good-tools-power-tools"),
        (59, 19, "Hand Tools",      "good-tools-hand-tools"),
        (60, 19, "Gardening",       "good-tools-gardening"),
        (61, 19, "Welding Equipment","good-tools-welding-equipment"),
        # Event & Party (20)
        (62, 20, "Tables & Chairs", "good-event-tables-chairs"),
        (63, 20, "Tents",           "good-event-tents"),
        (64, 20, "Sound System",    "good-event-sound-system"),
        (65, 20, "Lighting",        "good-event-lighting"),
        # Sports & Outdoor (21)
        (66, 21, "Bicycles",        "good-sports-bicycles"),
        (67, 21, "Camping Gear",    "good-sports-camping-gear"),
        (68, 21, "Water Sports",    "good-sports-water-sports"),
        (69, 21, "Gym Equipment",   "good-sports-gym-equipment"),
        # Clothing & Costumes (22)
        (70, 22, "Traditional",     "good-clothing-traditional"),
        (71, 22, "Formal",          "good-clothing-formal"),
        (72, 22, "Costumes",        "good-clothing-costumes"),
        (73, 22, "Cultural",        "good-clothing-cultural"),
    ]
    op.bulk_insert(subtypes_table, [
        {"id": i, "category_id": c, "name": n, "slug": s}
        for i, c, n, s in new_subtypes
    ])

    op.execute(
        "SELECT setval(pg_get_serial_sequence('property_secondary_categories', 'id'), "
        "(SELECT MAX(id) FROM property_secondary_categories))"
    )
    op.execute(
        "SELECT setval(pg_get_serial_sequence('property_subtypes', 'id'), "
        "(SELECT MAX(id) FROM property_subtypes))"
    )


def downgrade() -> None:
    # Remove seeded Vehicle / Good data
    op.execute("DELETE FROM property_subtypes WHERE id >= 28")
    op.execute("DELETE FROM property_secondary_categories WHERE id >= 11")

    # Remove primary_category_id from properties
    op.drop_index("ix_properties_primary_category_id", table_name="properties")
    op.drop_constraint("fk_properties_primary_category", "properties", type_="foreignkey")
    op.drop_column("properties", "primary_category_id")

    # Remove primary_category_id from property_secondary_categories
    op.drop_constraint(
        "fk_secondary_cat_primary_cat", "property_secondary_categories", type_="foreignkey"
    )
    op.drop_column("property_secondary_categories", "primary_category_id")

    # Rename back
    op.rename_table("property_secondary_categories", "property_categories")

    # Drop primary categories table
    op.drop_table("property_primary_categories")
