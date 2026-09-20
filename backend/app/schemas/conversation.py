from datetime import datetime

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    property_id: int
    message: str


class MessageCreate(BaseModel):
    body: str


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    body: str
    read_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    property_id: int
    property_title: str
    owner_id: int
    owner_name: str
    customer_id: int
    customer_name: str
    last_message: str | None
    last_message_at: datetime | None
    unread_count: int
    created_at: datetime
    updated_at: datetime
