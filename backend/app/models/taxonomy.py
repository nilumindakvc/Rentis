from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PropertyCategory(Base):
    __tablename__ = "property_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)

    subtypes = relationship(
        "PropertySubtype", back_populates="category", order_by="PropertySubtype.id"
    )


class PropertySubtype(Base):
    __tablename__ = "property_subtypes"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("property_categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    category = relationship("PropertyCategory", back_populates="subtypes")
