from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GoodDetails(Base):
    __tablename__ = "good_details"

    property_id: Mapped[int] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), primary_key=True
    )

    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    model_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    quantity_available: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    returnable: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    condition_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    property = relationship("Property", back_populates="good_details")
