import enum


class UserRole(str, enum.Enum):
    owner = "owner"
    customer = "customer"


class AdminRole(str, enum.Enum):
    admin = "admin"
    super_admin = "super_admin"


class SizeUnit(str, enum.Enum):
    sqft = "sqft"
    sqm = "sqm"


class PropertyCondition(str, enum.Enum):
    new = "new"
    good = "good"
    renovated = "renovated"
    needs_work = "needs_work"


class FurnishingType(str, enum.Enum):
    furnished = "furnished"
    semi_furnished = "semi_furnished"
    unfurnished = "unfurnished"


class RentalTerm(str, enum.Enum):
    long_term = "long_term"
    medium_term = "medium_term"
    short_term = "short_term"


class ListingStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class AvailabilityStatus(str, enum.Enum):
    available = "available"
    unavailable = "unavailable"
    under_maintenance = "under_maintenance"


class MediaType(str, enum.Enum):
    photo = "photo"
    video = "video"


class NotificationType(str, enum.Enum):
    new_inquiry = "new_inquiry"
    new_message = "new_message"
    booking_request = "booking_request"
    booking_accepted = "booking_accepted"
    booking_rejected = "booking_rejected"
    booking_paid = "booking_paid"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    unpaid = "unpaid"
    paid = "paid"
