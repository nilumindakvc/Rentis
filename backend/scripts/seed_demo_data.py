"""Seeds demo owners, customers, and one published listing per property
subtype (spanning all 10 categories) so Stage 1 can be exercised end to end.

Run from backend/ with the venv active:
    python -m scripts.seed_demo_data [--reset]

--reset wipes users/properties/favorites/conversations/notifications first
(the fixed property_categories/property_subtypes reference data, seeded by
the initial migration, is never touched).
"""
import argparse
import random
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.crud import conversations as conversations_crud  # noqa: E402
from app.crud.favorites import add_favorite  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models.conversation import Conversation  # noqa: E402
from app.models.favorite import Favorite  # noqa: E402
from app.models.notification import Notification  # noqa: E402
from app.models.photo import PropertyPhoto  # noqa: E402
from app.models.property import Property  # noqa: E402
from app.models.taxonomy import PropertySubtype  # noqa: E402
from app.models.user import User  # noqa: E402
from app.security import hash_password  # noqa: E402

REFERENCE_CITY = (6.9271, 79.8612)  # Colombo — matches the frontend's default map center
JITTER_DEGREES = 0.05  # roughly +/- 5 km

OWNERS = [
    {"name": "Nadeesha Perera", "email": "owner1@rentis.test", "password": "password123", "phone": "+94 77 111 2222"},
    {"name": "Kasun Fernando", "email": "owner2@rentis.test", "password": "password123", "phone": "+94 77 333 4444"},
]
CUSTOMERS = [
    {"name": "Ishara Silva", "email": "customer1@rentis.test", "password": "password123", "phone": "+94 71 555 6666"},
    {"name": "Tharindu Jayasuriya", "email": "customer2@rentis.test", "password": "password123", "phone": "+94 71 777 8888"},
]

# One demo listing per property_subtype slug (27 total, all 10 categories).
LISTINGS = {
    "healthcare-clinic": dict(
        title="Two-chair clinic space in Colombo 5", min_price=95000, rental_term="long_term",
        size_value=650, layout_description="Waiting area + 2 consultation rooms", capacity=2,
        facilities=["AC", "Backup power", "Waiting area", "Attached restroom"],
        condition="good", furnishing="semi_furnished",
    ),
    "healthcare-medical-center": dict(
        title="Multi-specialty medical center shell, Nugegoda", min_price=280000, rental_term="long_term",
        size_value=2200, layout_description="Reception, 6 consultation rooms, lab space", capacity=6,
        facilities=["AC", "Backup power", "Elevator", "Ample parking"],
        condition="new", furnishing="unfurnished",
    ),
    "healthcare-dental-clinic-space": dict(
        title="Dental clinic space with plumbing pre-fitted", min_price=110000, rental_term="long_term",
        size_value=500, layout_description="2 dental chairs, sterilization room", capacity=2,
        facilities=["AC", "Water/plumbing pre-fitted", "Backup power"],
        condition="renovated", furnishing="semi_furnished",
    ),
    "healthcare-pharmacy-space": dict(
        title="Street-facing pharmacy unit, Kandy Road", min_price=75000, rental_term="long_term",
        size_value=380, layout_description="Open retail counter + storage", capacity=None,
        facilities=["AC", "Shutter/security grille", "Street frontage"],
        condition="good", furnishing="unfurnished",
    ),
    "education-classroom": dict(
        title="Classroom for rent, hourly or monthly, Maharagama", min_price=3500, rental_term="short_term",
        size_value=400, layout_description="1 classroom, whiteboard, 30 desks", capacity=30,
        facilities=["AC", "Whiteboard", "Projector", "WiFi"],
        condition="good", furnishing="furnished",
    ),
    "hospitality-hotel": dict(
        title="Boutique hotel building for lease, Galle Road", min_price=850000, rental_term="long_term",
        size_value=9000, layout_description="18 rooms, reception, restaurant floor", capacity=18,
        facilities=["Backup power", "Elevator", "Generator", "Sea view"],
        condition="good", furnishing="furnished",
    ),
    "vehicle-parking-space": dict(
        title="Covered parking bay, Colombo 3", min_price=12000, rental_term="medium_term",
        size_value=140, layout_description="Single covered bay", capacity=1,
        facilities=["CCTV", "24-hour access"],
        condition="good", furnishing="unfurnished",
    ),
    "vehicle-vehicle-yard": dict(
        title="Open vehicle yard for dealership, Kottawa", min_price=180000, rental_term="long_term",
        size_value=15000, layout_description="Open yard + small office cabin", capacity=None,
        facilities=["Perimeter fencing", "CCTV", "Floodlighting"],
        condition="good", furnishing="unfurnished",
    ),
    "industrial-warehouse": dict(
        title="Logistics warehouse near Katunayake", min_price=420000, rental_term="long_term",
        size_value=18000, layout_description="Clear-span warehouse, loading dock", capacity=None,
        facilities=["Loading dock", "High ceiling", "3-phase power", "Security"],
        condition="good", furnishing="unfurnished",
    ),
    "industrial-factory": dict(
        title="Factory shed for manufacturing, Biyagama", min_price=650000, rental_term="long_term",
        size_value=25000, layout_description="Production floor + office annex", capacity=None,
        facilities=["3-phase power", "Effluent handling", "Loading bay"],
        condition="needs_work", furnishing="unfurnished",
    ),
    "food-restaurant-space": dict(
        title="Restaurant space with kitchen exhaust, Colombo 7", min_price=250000, rental_term="long_term",
        size_value=2000, layout_description="Dining hall for 60 + working kitchen", capacity=60,
        facilities=["Kitchen exhaust", "Grease trap", "AC dining area"],
        condition="renovated", furnishing="furnished",
    ),
    "food-cafe-space": dict(
        title="Corner café space, high foot traffic", min_price=95000, rental_term="long_term",
        size_value=700, layout_description="Counter + seating for 20", capacity=20,
        facilities=["AC", "Street frontage", "Small kitchenette"],
        condition="good", furnishing="semi_furnished",
    ),
    "retail-shop": dict(
        title="Retail shop unit, Unity Plaza", min_price=140000, rental_term="long_term",
        size_value=850, layout_description="Open-plan retail floor", capacity=None,
        facilities=["AC", "Shutter", "Shared parking"],
        condition="good", furnishing="unfurnished",
    ),
    "retail-showroom": dict(
        title="Vehicle/furniture showroom, main road frontage", min_price=320000, rental_term="long_term",
        size_value=4500, layout_description="Glass-front showroom + back office", capacity=None,
        facilities=["Glass frontage", "AC", "Signage space"],
        condition="new", furnishing="unfurnished",
    ),
    "office-office-building": dict(
        title="Full office building, Rajagiriya", min_price=950000, rental_term="long_term",
        size_value=12000, layout_description="5 floors, open-plan per floor", capacity=200,
        facilities=["Elevator", "Backup power", "Central AC", "Parking"],
        condition="good", furnishing="unfurnished",
    ),
    "office-individual-office": dict(
        title="Individual office suite, WTC area", min_price=65000, rental_term="long_term",
        size_value=450, layout_description="1 cabin office + reception", capacity=8,
        facilities=["AC", "WiFi", "Shared reception"],
        condition="good", furnishing="furnished",
    ),
    "office-meeting-conference-room": dict(
        title="Conference room by the hour, city center", min_price=6000, rental_term="short_term",
        size_value=300, layout_description="Boardroom table for 12", capacity=12,
        facilities=["Projector", "Video conferencing", "AC", "WiFi"],
        condition="new", furnishing="furnished",
    ),
    "living-house": dict(
        title="3-bedroom house, Nawala", min_price=120000, rental_term="long_term",
        size_value=1800, layout_description="3 bed, 2 bath, garden", capacity=5,
        facilities=["Garden", "Parking", "Hot water"],
        condition="good", furnishing="semi_furnished",
    ),
    "living-apartment-flat": dict(
        title="2-bedroom apartment, Rajagiriya", min_price=95000, rental_term="long_term",
        size_value=950, layout_description="2 bed, 2 bath, balcony", capacity=4,
        facilities=["Elevator", "Security", "Gym access"],
        condition="new", furnishing="furnished",
    ),
    "living-villa": dict(
        title="Beachside villa, Mirissa", min_price=45000, rental_term="short_term",
        size_value=3200, layout_description="4 bed villa with pool", capacity=8,
        facilities=["Private pool", "Sea view", "Housekeeping"],
        condition="new", furnishing="furnished",
    ),
    "living-room": dict(
        title="Single room for rent, near university", min_price=18000, rental_term="medium_term",
        size_value=140, layout_description="Single room, shared bathroom", capacity=1,
        facilities=["WiFi", "Shared kitchen"],
        condition="good", furnishing="furnished",
    ),
    "living-boarding-house": dict(
        title="Boarding house with 6 rooms, Moratuwa", min_price=8500, rental_term="medium_term",
        size_value=180, layout_description="Single room within shared house", capacity=1,
        facilities=["Shared kitchen", "WiFi", "Common area"],
        condition="good", furnishing="furnished",
    ),
    "living-guest-house": dict(
        title="Guest house room, Ella", min_price=6500, rental_term="short_term",
        size_value=200, layout_description="Double room, private bath, mountain view", capacity=2,
        facilities=["Private bathroom", "Mountain view", "Breakfast included"],
        condition="good", furnishing="furnished",
    ),
    "events-event-hall": dict(
        title="Event hall for hire, Battaramulla", min_price=180000, rental_term="short_term",
        size_value=6000, layout_description="Open hall, stage, seating for 400", capacity=400,
        facilities=["Stage", "Sound system", "Parking", "Backup power"],
        condition="good", furnishing="unfurnished",
    ),
    "events-wedding-hall": dict(
        title="Wedding hall with catering kitchen, Kandy", min_price=250000, rental_term="short_term",
        size_value=7500, layout_description="Banquet hall, stage, bridal room", capacity=500,
        facilities=["Catering kitchen", "Bridal room", "Ample parking"],
        condition="renovated", furnishing="furnished",
    ),
    "events-conference-hall": dict(
        title="Conference hall for corporate events, Colombo 2", min_price=95000, rental_term="short_term",
        size_value=2500, layout_description="Theatre-style seating for 150", capacity=150,
        facilities=["AV system", "AC", "Breakout rooms"],
        condition="new", furnishing="furnished",
    ),
    "events-party-function-space": dict(
        title="Rooftop party/function space, Colombo 6", min_price=60000, rental_term="short_term",
        size_value=1800, layout_description="Open rooftop deck + bar counter", capacity=120,
        facilities=["Bar counter", "Lighting rig", "City view"],
        condition="good", furnishing="semi_furnished",
    ),
}

NEIGHBORHOODS = [
    "Colombo 3", "Colombo 5", "Colombo 7", "Nugegoda", "Rajagiriya", "Nawala",
    "Battaramulla", "Kotte", "Moratuwa", "Dehiwala", "Maharagama", "Kandy Road",
    "Kottawa", "Katunayake", "Biyagama", "Ella", "Mirissa", "Galle Road",
]
DEFAULT_ADDRESS_SUFFIX = ", Sri Lanka"
DEFAULT_RESTRICTIONS = "No subletting without owner consent."
DEFAULT_PARKING = "On-site parking available."
DEFAULT_RENEWAL = "Renewable annually by mutual agreement."


def _jittered_latlng():
    lat, lng = REFERENCE_CITY
    return (
        lat + random.uniform(-JITTER_DEGREES, JITTER_DEGREES),
        lng + random.uniform(-JITTER_DEGREES, JITTER_DEGREES),
    )


def already_seeded(db) -> bool:
    return db.query(User).filter(User.email == OWNERS[0]["email"]).first() is not None


def reset_demo_data(db) -> None:
    db.query(Notification).delete()
    db.query(Conversation).delete()
    db.query(Favorite).delete()
    db.query(PropertyPhoto).delete()
    db.query(Property).delete()
    db.query(User).delete()
    db.commit()


def seed(db) -> None:
    owners = []
    for data in OWNERS:
        user = User(role="owner", **{**data, "password": hash_password(data["password"])})
        db.add(user)
        owners.append(user)

    customers = []
    for data in CUSTOMERS:
        user = User(role="customer", **{**data, "password": hash_password(data["password"])})
        db.add(user)
        customers.append(user)

    db.flush()

    subtypes = db.query(PropertySubtype).order_by(PropertySubtype.id).all()

    created_properties = []
    for i, subtype in enumerate(subtypes):
        listing = LISTINGS.get(subtype.slug)
        if listing is None:
            continue

        owner = owners[i % len(owners)]
        lat, lng = _jittered_latlng()

        prop = Property(
            owner_id=owner.id,
            category_id=subtype.category_id,
            subtype_id=subtype.id,
            title=listing["title"],
            description=f"{listing['layout_description']}. Well-maintained and ready to move in.",
            address_text=f"{NEIGHBORHOODS[i % len(NEIGHBORHOODS)]}{DEFAULT_ADDRESS_SUFFIX}",
            latitude=lat,
            longitude=lng,
            size_value=listing["size_value"],
            size_unit="sqft",
            layout_description=listing["layout_description"],
            facilities=listing["facilities"],
            condition=listing["condition"],
            furnishing=listing["furnishing"],
            capacity=listing.get("capacity"),
            min_price=listing["min_price"],
            price_currency="LKR",
            security_deposit=listing["min_price"] * 2,
            rental_term=listing["rental_term"],
            renewal_terms=DEFAULT_RENEWAL,
            availability_status="available",
            additional_charges=[{"label": "Utilities", "amount": round(listing["min_price"] * 0.05, 2)}],
            permitted_usage=f"Intended for {subtype.name.lower()} use.",
            restrictions=DEFAULT_RESTRICTIONS,
            parking_access=DEFAULT_PARKING,
            status="published",
            view_count=random.randint(3, 120),
        )
        db.add(prop)
        db.flush()

        for photo_index in range(random.randint(2, 4)):
            db.add(
                PropertyPhoto(
                    property_id=prop.id,
                    url=f"https://picsum.photos/seed/rentis-{prop.id}-{photo_index}/800/600",
                    sort_order=photo_index,
                )
            )
        created_properties.append(prop)

    db.commit()

    # A handful of favorites and conversations so dashboards aren't empty on first login.
    sample_size = min(6, len(created_properties))
    for prop in random.sample(created_properties, sample_size):
        add_favorite(db, customers[0].id, prop.id)

    conversation_targets = random.sample(created_properties, min(4, len(created_properties)))
    for i, prop in enumerate(conversation_targets):
        conversation = conversations_crud.get_or_create(db, prop.id, customers[1].id)
        conversations_crud.create_message(
            db,
            conversation,
            customers[1].id,
            f"Hi, I'm interested in \"{prop.title}\" — is it still available for viewing this week?",
        )
        if i % 2 == 0:
            # a couple of threads get a reply so the chat UI has a real back-and-forth to render
            conversations_crud.create_message(
                db,
                conversation,
                conversation.owner_id,
                "Yes, it's available — happy to arrange a viewing. What day works for you?",
            )

    print(f"Seeded {len(owners)} owners, {len(customers)} customers, {len(created_properties)} properties.")
    print("Demo logins (all passwords: password123):")
    for u in OWNERS:
        print(f"  owner    -> {u['email']}")
    for u in CUSTOMERS:
        print(f"  customer -> {u['email']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="Wipe existing demo data before seeding")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.reset:
            reset_demo_data(db)
        elif already_seeded(db):
            print("Demo data already present (use --reset to wipe and reseed). Skipping.")
            return
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
