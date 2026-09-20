from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import MediaType


class PropertyPhoto(Base):
    __tablename__ = "property_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    media_type: Mapped[MediaType] = mapped_column(
        Enum(MediaType, name="media_type"), default=MediaType.photo, server_default=MediaType.photo.value
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    property = relationship("Property", back_populates="photos")
