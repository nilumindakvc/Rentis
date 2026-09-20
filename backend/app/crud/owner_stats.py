from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.property import Property


def summary(db: Session, owner_id: int) -> dict:
    total_listings, total_views = (
        db.query(func.count(Property.id), func.coalesce(func.sum(Property.view_count), 0))
        .filter(Property.owner_id == owner_id)
        .first()
    )

    total_conversations = db.query(func.count(Conversation.id)).filter(Conversation.owner_id == owner_id).scalar()

    unread_messages = (
        db.query(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.owner_id == owner_id,
            Message.sender_id != owner_id,
            Message.read_at.is_(None),
        )
        .scalar()
    )

    return {
        "total_listings": total_listings or 0,
        "total_views": int(total_views or 0),
        "total_conversations": total_conversations or 0,
        "unread_messages": unread_messages or 0,
    }
