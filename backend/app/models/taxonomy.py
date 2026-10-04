from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PropertyPrimaryCategory(Base):
    __tablename__ = "property_primary_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)

    secondary_categories = relationship(
        "PropertySecondaryCategory",
        back_populates="primary_category",
        order_by="PropertySecondaryCategory.id",
    )


class PropertySecondaryCategory(Base):
    __tablename__ = "property_secondary_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    primary_category_id: Mapped[int] = mapped_column(
        ForeignKey("property_primary_categories.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)

    primary_category = relationship("PropertyPrimaryCategory", back_populates="secondary_categories")
    subtypes = relationship(
        "PropertySubtype", back_populates="category", order_by="PropertySubtype.id"
    )


class PropertySubtype(Base):
    __tablename__ = "property_subtypes"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("property_secondary_categories.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    category = relationship("PropertySecondaryCategory", back_populates="subtypes")


# Backwards-compat alias — existing code that imports PropertyCategory keeps working.
PropertyCategory = PropertySecondaryCategory
