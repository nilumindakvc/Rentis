from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import (
    AvailabilityStatus,
    FurnishingType,
    ListingStatus,
    PropertyCondition,
    RentalTerm,
    SizeUnit,
)


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    primary_category_id: Mapped[int] = mapped_column(
        ForeignKey("property_primary_categories.id"), nullable=False, index=True
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("property_secondary_categories.id"), nullable=False
    )
    subtype_id: Mapped[int] = mapped_column(ForeignKey("property_subtypes.id"), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Location
    address_text: Mapped[str | None] = mapped_column(String(300), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)

    # Size & layout
    size_value: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    size_unit: Mapped[SizeUnit | None] = mapped_column(Enum(SizeUnit, name="size_unit"), nullable=True)
    layout_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Facilities / condition / furnishing / capacity
    facilities: Mapped[list | None] = mapped_column(JSON, nullable=True)
    condition: Mapped[PropertyCondition | None] = mapped_column(
        Enum(PropertyCondition, name="property_condition"), nullable=True
    )
    furnishing: Mapped[FurnishingType | None] = mapped_column(
        Enum(FurnishingType, name="furnishing_type"), nullable=True
    )
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Rental
    min_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    price_currency: Mapped[str] = mapped_column(String(10), default="LKR", server_default="LKR")
    security_deposit: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    rental_term: Mapped[RentalTerm] = mapped_column(Enum(RentalTerm, name="rental_term"), nullable=False)
    renewal_terms: Mapped[str | None] = mapped_column(Text, nullable=True)
    availability_status: Mapped[AvailabilityStatus] = mapped_column(
        Enum(AvailabilityStatus, name="availability_status"),
        default=AvailabilityStatus.available,
        server_default=AvailabilityStatus.available.value,
    )
    additional_charges: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Rules
    permitted_usage: Mapped[str | None] = mapped_column(Text, nullable=True)
    restrictions: Mapped[str | None] = mapped_column(Text, nullable=True)
    parking_access: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Lifecycle / meta
    status: Mapped[ListingStatus] = mapped_column(
        Enum(ListingStatus, name="listing_status"),
        default=ListingStatus.published,
        server_default=ListingStatus.published.value,
    )
    view_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner = relationship("User", back_populates="properties")
    primary_category = relationship("PropertyPrimaryCategory")
    category = relationship("PropertySecondaryCategory")
    subtype = relationship("PropertySubtype")
    vehicle_details = relationship(
        "VehicleDetails", back_populates="property", uselist=False, cascade="all, delete-orphan"
    )
    good_details = relationship(
        "GoodDetails", back_populates="property", uselist=False, cascade="all, delete-orphan"
    )
    photos = relationship(
        "PropertyPhoto", back_populates="property", cascade="all, delete-orphan", order_by="PropertyPhoto.sort_order"
    )
    favorited_by = relationship("Favorite", back_populates="property", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="property", cascade="all, delete-orphan")
    availability_blocks = relationship(
        "AvailabilityBlock", back_populates="property", cascade="all, delete-orphan"
    )
    bookings = relationship("Booking", back_populates="property", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="property", cascade="all, delete-orphan")
