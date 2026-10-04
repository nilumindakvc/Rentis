"""seed vehicle and good demo listings

Revision ID: 0014
Revises: 0013
Create Date: 2026-10-04

Inserts 3 vehicle and 3 good demo listings with photos (picsum.photos stable
seed URLs), vehicle_details, and good_details rows. Picks the first existing
owner in the DB; if none exists, creates a seed owner account.

Seed owner password (if created): SeedDemo@2024
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0014"
down_revision: Union[str, None] = "0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ── helpers ─────────────────────────────────────────────────────────────────

def _get_or_create_owner(conn) -> int:
    """Return the id of an existing owner or create a seed owner."""
    row = conn.execute(
        sa.text("SELECT id FROM users WHERE email = 'demo.owner@rentis.lk'")
    ).fetchone()
    if row:
        return row[0]

    row = conn.execute(
        sa.text("SELECT id FROM users WHERE role = 'owner' ORDER BY id LIMIT 1")
    ).fetchone()
    if row:
        return row[0]

    from passlib.context import CryptContext
    hashed = CryptContext(schemes=["bcrypt"], deprecated="auto").hash("SeedDemo@2024")
    row = conn.execute(
        sa.text("""
            INSERT INTO users (name, email, password, role, phone)
            VALUES ('Rentis Demo Owner', 'demo.owner@rentis.lk', :pw, 'owner', '0743417926')
            RETURNING id
        """),
        {"pw": hashed},
    ).fetchone()
    return row[0]


def _insert_property(conn, owner_id: int, data: dict) -> int:
    row = conn.execute(
        sa.text("""
            INSERT INTO properties (
                owner_id, primary_category_id, category_id, subtype_id,
                title, description, address_text, latitude, longitude,
                min_price, price_currency, rental_term, availability_status,
                status, view_count, additional_charges
            ) VALUES (
                :owner_id, :primary_category_id, :category_id, :subtype_id,
                :title, :description, :address_text, :latitude, :longitude,
                :min_price, 'LKR', :rental_term, 'available',
                'published', 0, '[]'
            ) RETURNING id
        """),
        {"owner_id": owner_id, **data},
    ).fetchone()
    return row[0]


def _add_photos(conn, property_id: int, urls: list) -> None:
    for i, url in enumerate(urls):
        conn.execute(
            sa.text("""
                INSERT INTO property_photos (property_id, url, media_type, sort_order)
                VALUES (:pid, :url, 'photo', :sort)
            """),
            {"pid": property_id, "url": url, "sort": i},
        )


# ── upgrade ──────────────────────────────────────────────────────────────────

def upgrade() -> None:
    conn = op.get_bind()
    owner_id = _get_or_create_owner(conn)

    # ------------------------------------------------------------------ #
    # Vehicle listings                                                      #
    # ------------------------------------------------------------------ #

    # 1. Toyota Prius 2020 — Cars > Sedan
    #    primary_category_id=2 (Vehicle), category_id=11 (Cars), subtype_id=28 (Sedan)
    p1 = _insert_property(conn, owner_id, {
        "primary_category_id": 2,
        "category_id": 11,
        "subtype_id": 28,
        "title": "Toyota Prius 2020 — Hybrid Sedan for Daily or Weekly Hire",
        "description": (
            "Well-maintained 2020 Toyota Prius Hybrid available for short-term hire. "
            "Fuel-efficient, smooth to drive, and perfect for city commutes or weekend "
            "trips across the island. GPS-enabled with a full service history. "
            "Free pickup and drop-off within Colombo limits."
        ),
        "address_text": "Colombo 03, Western Province, Sri Lanka",
        "latitude": "6.910100",
        "longitude": "79.852900",
        "min_price": "8500.00",
        "rental_term": "short_term",
    })
    _add_photos(conn, p1, [
        "https://picsum.photos/seed/prius-front/800/600",
        "https://picsum.photos/seed/prius-interior/800/600",
        "https://picsum.photos/seed/prius-side/800/600",
    ])
    conn.execute(sa.text("""
        INSERT INTO vehicle_details
            (property_id, make, model, year, color, fuel_type, transmission,
             mileage_km, seats, engine_cc, has_ac, has_gps, driver_included)
        VALUES
            (:pid, 'Toyota', 'Prius', 2020, 'Silver', 'hybrid', 'automatic',
             45000, 5, 1798, true, true, false)
    """), {"pid": p1})

    # 2. Honda CB150R — Motorcycles > Standard
    #    primary_category_id=2, category_id=12 (Motorcycles), subtype_id=33 (Standard)
    p2 = _insert_property(conn, owner_id, {
        "primary_category_id": 2,
        "category_id": 12,
        "subtype_id": 33,
        "title": "Honda CB150R — Explore Colombo on Two Wheels",
        "description": (
            "Sporty Honda CB150R in excellent condition. Ideal for urban commuting "
            "or short leisure rides along coastal roads. Full tank provided on pickup; "
            "please return with a full tank. Helmet included."
        ),
        "address_text": "Nugegoda, Western Province, Sri Lanka",
        "latitude": "6.868100",
        "longitude": "79.899800",
        "min_price": "2500.00",
        "rental_term": "short_term",
    })
    _add_photos(conn, p2, [
        "https://picsum.photos/seed/cb150r-black/800/600",
        "https://picsum.photos/seed/cb150r-side/800/600",
        "https://picsum.photos/seed/cb150r-front/800/600",
    ])
    conn.execute(sa.text("""
        INSERT INTO vehicle_details
            (property_id, make, model, year, color, fuel_type, transmission,
             mileage_km, seats, engine_cc, has_ac, has_gps, driver_included)
        VALUES
            (:pid, 'Honda', 'CB150R', 2021, 'Black', 'petrol', 'manual',
             12000, 2, 150, false, false, false)
    """), {"pid": p2})

    # 3. Toyota Hiace 12-Seater — Vans & Buses > Minivan
    #    primary_category_id=2, category_id=13 (Vans & Buses), subtype_id=37 (Minivan)
    p3 = _insert_property(conn, owner_id, {
        "primary_category_id": 2,
        "category_id": 13,
        "subtype_id": 37,
        "title": "Toyota Hiace 12-Seater — Group Travel with Experienced Driver",
        "description": (
            "Spacious 12-seater Toyota Hiace for group travel, family outings, "
            "airport transfers, or day trips around Sri Lanka. AC throughout, ample "
            "luggage space. Experienced, licensed driver included in the rate."
        ),
        "address_text": "Dehiwala-Mount Lavinia, Western Province, Sri Lanka",
        "latitude": "6.851900",
        "longitude": "79.866600",
        "min_price": "12000.00",
        "rental_term": "short_term",
    })
    _add_photos(conn, p3, [
        "https://picsum.photos/seed/hiace-white-ext/800/600",
        "https://picsum.photos/seed/hiace-interior/800/600",
        "https://picsum.photos/seed/hiace-rear/800/600",
    ])
    conn.execute(sa.text("""
        INSERT INTO vehicle_details
            (property_id, make, model, year, color, fuel_type, transmission,
             mileage_km, seats, engine_cc, has_ac, has_gps, driver_included)
        VALUES
            (:pid, 'Toyota', 'Hiace', 2018, 'White', 'diesel', 'manual',
             95000, 12, 2694, true, false, true)
    """), {"pid": p3})

    # ------------------------------------------------------------------ #
    # Good listings                                                         #
    # ------------------------------------------------------------------ #

    # 4. Sony Alpha A7 III — Electronics > Camera
    #    primary_category_id=3 (Good), category_id=17 (Electronics), subtype_id=50 (Camera)
    p4 = _insert_property(conn, owner_id, {
        "primary_category_id": 3,
        "category_id": 17,
        "subtype_id": 50,
        "title": "Sony Alpha A7 III Full-Frame Mirrorless Camera Kit",
        "description": (
            "Professional Sony A7 III available for events, weddings, and commercial "
            "shoots. Kit includes 24-70mm f/2.8 GM lens, two spare batteries, two "
            "64 GB SD cards, lens filter set, and a padded carry bag. Full sensor "
            "cleaning done before every rental."
        ),
        "address_text": "Colombo 05, Western Province, Sri Lanka",
        "latitude": "6.893500",
        "longitude": "79.861500",
        "min_price": "5000.00",
        "rental_term": "short_term",
    })
    _add_photos(conn, p4, [
        "https://picsum.photos/seed/sony-a7iii-kit/800/600",
        "https://picsum.photos/seed/sony-a7iii-lens/800/600",
        "https://picsum.photos/seed/sony-a7iii-bag/800/600",
    ])
    conn.execute(sa.text("""
        INSERT INTO good_details
            (property_id, brand, model_number, quantity_available, returnable, condition_notes)
        VALUES
            (:pid, 'Sony', 'ILCE-7M3', 1, true,
             'Excellent condition. Sensor clean done. All original accessories included. Security deposit required.')
    """), {"pid": p4})

    # 5. DJI Mavic 3 — Electronics > Drone
    #    primary_category_id=3, category_id=17 (Electronics), subtype_id=53 (Drone)
    p5 = _insert_property(conn, owner_id, {
        "primary_category_id": 3,
        "category_id": 17,
        "subtype_id": 53,
        "title": "DJI Mavic 3 — Aerial Photography & Videography",
        "description": (
            "High-performance DJI Mavic 3 with Hasselblad camera for aerial shoots, "
            "real estate photography, and event coverage. Fly More combo: 3 batteries, "
            "ND filter set (4/8/16/64), RC-N1 controller, shoulder bag, and charging hub. "
            "Client is responsible for obtaining any required CAA permits."
        ),
        "address_text": "Colombo 07, Western Province, Sri Lanka",
        "latitude": "6.902100",
        "longitude": "79.863200",
        "min_price": "7500.00",
        "rental_term": "short_term",
    })
    _add_photos(conn, p5, [
        "https://picsum.photos/seed/dji-mavic3-air/800/600",
        "https://picsum.photos/seed/dji-mavic3-pack/800/600",
        "https://picsum.photos/seed/dji-mavic3-shot/800/600",
    ])
    conn.execute(sa.text("""
        INSERT INTO good_details
            (property_id, brand, model_number, quantity_available, returnable, condition_notes)
        VALUES
            (:pid, 'DJI', 'Mavic 3 Fly More Combo', 1, true,
             'Good condition. Minor cosmetic scuff on one landing leg — does not affect flight. All batteries hold full charge.')
    """), {"pid": p5})

    # 6. Trek Marlin 7 — Sports & Outdoor > Bicycles
    #    primary_category_id=3, category_id=21 (Sports & Outdoor), subtype_id=66 (Bicycles)
    p6 = _insert_property(conn, owner_id, {
        "primary_category_id": 3,
        "category_id": 21,
        "subtype_id": 66,
        "title": "Trek Marlin 7 Mountain Bicycle (29-inch) — Trails or Coastal Paths",
        "description": (
            "Durable Trek Marlin 7 hardtail mountain bike for trails, coastal paths, "
            "or casual city riding. Two units available for group rides. Helmet, cable "
            "lock, and puncture repair kit included with each bicycle."
        ),
        "address_text": "Mount Lavinia, Western Province, Sri Lanka",
        "latitude": "6.839600",
        "longitude": "79.868600",
        "min_price": "1200.00",
        "rental_term": "short_term",
    })
    _add_photos(conn, p6, [
        "https://picsum.photos/seed/trek-marlin7-trail/800/600",
        "https://picsum.photos/seed/trek-marlin7-side/800/600",
    ])
    conn.execute(sa.text("""
        INSERT INTO good_details
            (property_id, brand, model_number, quantity_available, returnable, condition_notes)
        VALUES
            (:pid, 'Trek', 'Marlin 7 (2022)', 2, true,
             'Good condition. Tyres and brakes recently serviced. Includes helmet, cable lock, and puncture repair kit per bike.')
    """), {"pid": p6})

    # Reset sequences so future INSERTs get correct auto-increment IDs
    for tbl in ("properties", "property_photos", "users"):
        conn.execute(sa.text(
            f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), "
            f"(SELECT COALESCE(MAX(id), 1) FROM {tbl}))"
        ))


# ── downgrade ────────────────────────────────────────────────────────────────

def downgrade() -> None:
    conn = op.get_bind()
    # Cascades handle property_photos, vehicle_details, good_details automatically
    conn.execute(sa.text("""
        DELETE FROM properties WHERE title IN (
            'Toyota Prius 2020 — Hybrid Sedan for Daily or Weekly Hire',
            'Honda CB150R — Explore Colombo on Two Wheels',
            'Toyota Hiace 12-Seater — Group Travel with Experienced Driver',
            'Sony Alpha A7 III Full-Frame Mirrorless Camera Kit',
            'DJI Mavic 3 — Aerial Photography & Videography',
            'Trek Marlin 7 Mountain Bicycle (29-inch) — Trails or Coastal Paths'
        )
    """))
    conn.execute(sa.text(
        "DELETE FROM users WHERE email = 'demo.owner@rentis.lk'"
    ))
