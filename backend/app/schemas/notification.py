from datetime import datetime

from pydantic import BaseModel

from app.models.enums import NotificationType


class NotificationOut(BaseModel):
    id: int
    type: NotificationType
    title: str
    body: str | None
    related_property_id: int | None
    related_conversation_id: int | None
    related_booking_id: int | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UnreadCountOut(BaseModel):
    unread_count: int


class OwnerStatsOut(BaseModel):
    total_listings: int
    total_views: int
    total_conversations: int
    unread_messages: int
