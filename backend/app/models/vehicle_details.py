from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import FuelType, TransmissionType


class VehicleDetails(Base):
    __tablename__ = "vehicle_details"

    property_id: Mapped[int] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), primary_key=True
    )

    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)

    fuel_type: Mapped[FuelType | None] = mapped_column(
        Enum(FuelType, name="fuel_type"), nullable=True
    )
    transmission: Mapped[TransmissionType | None] = mapped_column(
        Enum(TransmissionType, name="transmission_type"), nullable=True
    )

    mileage_km: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seats: Mapped[int | None] = mapped_column(Integer, nullable=True)
    engine_cc: Mapped[int | None] = mapped_column(Integer, nullable=True)

    has_ac: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    has_gps: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    driver_included: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    property = relationship("Property", back_populates="vehicle_details")
