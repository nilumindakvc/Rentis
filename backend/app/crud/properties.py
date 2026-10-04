from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.conversation import Conversation
from app.models.favorite import Favorite
from app.models.good_details import GoodDetails
from app.models.photo import PropertyPhoto
from app.models.property import Property
from app.models.vehicle_details import VehicleDetails
from app.schemas.property import PropertyCreate, PropertyStatusUpdate, PropertyUpdate

PROPERTY_RELATIONSHIPS = (
    joinedload(Property.owner),
    joinedload(Property.primary_category),
    joinedload(Property.category),
    joinedload(Property.subtype),
    joinedload(Property.vehicle_details),
    joinedload(Property.good_details),
    joinedload(Property.photos),
)


def _base_query(db: Session):
    return db.query(Property).options(*PROPERTY_RELATIONSHIPS)


def get_property(db: Session, property_id: int) -> Property | None:
    return _base_query(db).filter(Property.id == property_id).first()


def list_all_for_admin(
    db: Session,
    status_filter: str | None = None,
    primary_category_id: int | None = None,
    category_id: int | None = None,
    featured: bool | None = None,
) -> list[Property]:
    query = _base_query(db)
    if status_filter:
        query = query.filter(Property.status == status_filter)
    if primary_category_id:
        query = query.filter(Property.primary_category_id == primary_category_id)
    if category_id:
        query = query.filter(Property.category_id == category_id)
    if featured is not None:
        query = query.filter(Property.is_featured == featured)
    return query.order_by(Property.created_at.desc()).all()


def search_properties(
    db: Session,
    *,
    primary_category_id: int | None = None,
    category_id: int | None = None,
    subtype_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    rental_term: str | None = None,
    featured: bool | None = None,
    q: str | None = None,
    north: float | None = None,
    south: float | None = None,
    east: float | None = None,
    west: float | None = None,
    page: int = 1,
    page_size: int = 9,
    sort: str = "newest",
):
    query = _base_query(db).filter(Property.status == "published")

    if primary_category_id:
        query = query.filter(Property.primary_category_id == primary_category_id)
    if category_id:
        query = query.filter(Property.category_id == category_id)
    if subtype_id:
        query = query.filter(Property.subtype_id == subtype_id)
    if min_price is not None:
        query = query.filter(Property.min_price >= min_price)
    if max_price is not None:
        query = query.filter(Property.min_price <= max_price)
    if rental_term:
        query = query.filter(Property.rental_term == rental_term)
    if featured is not None:
        query = query.filter(Property.is_featured == featured)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Property.title.ilike(like), Property.address_text.ilike(like)))
    if north is not None and south is not None:
        query = query.filter(Property.latitude.between(south, north))
    if east is not None and west is not None:
        query = query.filter(Property.longitude.between(west, east))

    total = query.count()

    if sort == "price_asc":
        query = query.order_by(Property.min_price.asc())
    elif sort == "price_desc":
        query = query.order_by(Property.min_price.desc())
    else:
        query = query.order_by(Property.created_at.desc())

    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_owner_properties(db: Session, owner_id: int) -> list[tuple[Property, int]]:
    properties = (
        _base_query(db)
        .filter(Property.owner_id == owner_id)
        .order_by(Property.created_at.desc())
        .all()
    )
    if not properties:
        return []
    property_ids = [p.id for p in properties]
    counts = dict(
        db.query(Conversation.property_id, func.count(Conversation.id))
        .filter(Conversation.property_id.in_(property_ids))
        .group_by(Conversation.property_id)
        .all()
    )
    return [(p, counts.get(p.id, 0)) for p in properties]


def create_property(db: Session, owner_id: int, payload: PropertyCreate) -> Property:
    data = payload.model_dump(
        exclude={"photos", "additional_charges", "vehicle_details", "good_details"}
    )
    prop = Property(
        owner_id=owner_id,
        additional_charges=[c.model_dump() for c in payload.additional_charges],
        **data,
    )
    db.add(prop)
    db.flush()

    for photo in payload.photos:
        db.add(PropertyPhoto(property_id=prop.id, url=photo.url, sort_order=photo.sort_order))

    if payload.vehicle_details is not None:
        db.add(VehicleDetails(property_id=prop.id, **payload.vehicle_details.model_dump()))

    if payload.good_details is not None:
        db.add(GoodDetails(property_id=prop.id, **payload.good_details.model_dump()))

    db.commit()
    return get_property(db, prop.id)


def update_property(db: Session, prop: Property, payload: PropertyUpdate) -> Property:
    data = payload.model_dump(
        exclude={"photos", "additional_charges", "vehicle_details", "good_details"}
    )
    for field, value in data.items():
        setattr(prop, field, value)
    prop.additional_charges = [c.model_dump() for c in payload.additional_charges]

    db.query(PropertyPhoto).filter(PropertyPhoto.property_id == prop.id).delete()
    for photo in payload.photos:
        db.add(PropertyPhoto(property_id=prop.id, url=photo.url, sort_order=photo.sort_order))

    # Vehicle details — upsert or delete
    if payload.vehicle_details is not None:
        existing_vd = db.query(VehicleDetails).filter(VehicleDetails.property_id == prop.id).first()
        if existing_vd:
            for k, v in payload.vehicle_details.model_dump().items():
                setattr(existing_vd, k, v)
        else:
            db.add(VehicleDetails(property_id=prop.id, **payload.vehicle_details.model_dump()))
    else:
        db.query(VehicleDetails).filter(VehicleDetails.property_id == prop.id).delete()

    # Good details — upsert or delete
    if payload.good_details is not None:
        existing_gd = db.query(GoodDetails).filter(GoodDetails.property_id == prop.id).first()
        if existing_gd:
            for k, v in payload.good_details.model_dump().items():
                setattr(existing_gd, k, v)
        else:
            db.add(GoodDetails(property_id=prop.id, **payload.good_details.model_dump()))
    else:
        db.query(GoodDetails).filter(GoodDetails.property_id == prop.id).delete()

    db.commit()
    return get_property(db, prop.id)


def update_property_status(db: Session, prop: Property, payload: PropertyStatusUpdate) -> Property:
    if payload.status is not None:
        prop.status = payload.status
    if payload.availability_status is not None:
        prop.availability_status = payload.availability_status
    db.commit()
    return get_property(db, prop.id)


def set_featured(db: Session, prop: Property, is_featured: bool) -> Property:
    prop.is_featured = is_featured
    db.commit()
    return get_property(db, prop.id)


def delete_property(db: Session, prop: Property) -> None:
    db.delete(prop)
    db.commit()


def increment_view_count(db: Session, prop: Property) -> None:
    prop.view_count += 1
    db.commit()


def is_favorited(db: Session, property_id: int, customer_id: int | None) -> bool:
    if customer_id is None:
        return False
    return (
        db.query(Favorite)
        .filter(Favorite.property_id == property_id, Favorite.customer_id == customer_id)
        .first()
        is not None
    )


def serialize_summary(prop: Property) -> dict:
    primary_photo = prop.photos[0].url if prop.photos else None
    return {
        "id": prop.id,
        "title": prop.title,
        "primary_category_id": prop.primary_category_id,
        "primary_category_name": prop.primary_category.name,
        "category_id": prop.category_id,
        "category_name": prop.category.name,
        "subtype_id": prop.subtype_id,
        "subtype_name": prop.subtype.name,
        "address_text": prop.address_text,
        "latitude": prop.latitude,
        "longitude": prop.longitude,
        "min_price": prop.min_price,
        "price_currency": prop.price_currency,
        "rental_term": prop.rental_term,
        "status": prop.status,
        "view_count": prop.view_count,
        "is_featured": prop.is_featured,
        "primary_photo_url": primary_photo,
    }


def serialize_full(prop: Property, *, favorited: bool = False, conversation_count: int | None = None) -> dict:
    result = {
        "id": prop.id,
        "owner_id": prop.owner_id,
        "owner_name": prop.owner.name,
        "primary_category_id": prop.primary_category_id,
        "primary_category_name": prop.primary_category.name,
        "category_id": prop.category_id,
        "category_name": prop.category.name,
        "subtype_id": prop.subtype_id,
        "subtype_name": prop.subtype.name,
        "title": prop.title,
        "description": prop.description,
        "address_text": prop.address_text,
        "latitude": prop.latitude,
        "longitude": prop.longitude,
        "size_value": prop.size_value,
        "size_unit": prop.size_unit,
        "layout_description": prop.layout_description,
        "facilities": prop.facilities or [],
        "condition": prop.condition,
        "furnishing": prop.furnishing,
        "capacity": prop.capacity,
        "min_price": prop.min_price,
        "price_currency": prop.price_currency,
        "security_deposit": prop.security_deposit,
        "rental_term": prop.rental_term,
        "renewal_terms": prop.renewal_terms,
        "availability_status": prop.availability_status,
        "additional_charges": prop.additional_charges or [],
        "permitted_usage": prop.permitted_usage,
        "restrictions": prop.restrictions,
        "parking_access": prop.parking_access,
        "status": prop.status,
        "view_count": prop.view_count,
        "is_featured": prop.is_featured,
        "created_at": prop.created_at,
        "photos": prop.photos,
        "is_favorited": favorited,
        "vehicle_details": prop.vehicle_details,
        "good_details": prop.good_details,
    }
    if conversation_count is not None:
        result["conversation_count"] = conversation_count
    return result
