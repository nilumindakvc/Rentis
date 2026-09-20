from datetime import datetime, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.property import Property


def _base_query(db: Session):
    return db.query(Conversation).options(
        joinedload(Conversation.property),
        joinedload(Conversation.owner),
        joinedload(Conversation.customer),
        selectinload(Conversation.messages),
    )


def get(db: Session, conversation_id: int) -> Conversation | None:
    return _base_query(db).filter(Conversation.id == conversation_id).first()


def is_participant(conversation: Conversation, user_id: int) -> bool:
    return user_id in (conversation.owner_id, conversation.customer_id)


def get_or_create(db: Session, property_id: int, customer_id: int) -> Conversation:
    prop = db.get(Property, property_id)
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.property_id == property_id,
            Conversation.owner_id == prop.owner_id,
            Conversation.customer_id == customer_id,
        )
        .first()
    )
    if conversation is None:
        conversation = Conversation(property_id=property_id, owner_id=prop.owner_id, customer_id=customer_id)
        db.add(conversation)
        db.flush()
    return get(db, conversation.id)


def create_message(db: Session, conversation: Conversation, sender_id: int, body: str) -> Message:
    message = Message(conversation_id=conversation.id, sender_id=sender_id, body=body)
    db.add(message)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)
    return message


def list_for_user(db: Session, user_id: int) -> list[Conversation]:
    return (
        _base_query(db)
        .filter(or_(Conversation.owner_id == user_id, Conversation.customer_id == user_id))
        .order_by(Conversation.updated_at.desc())
        .all()
    )


def list_messages(db: Session, conversation_id: int, before_id: int | None = None, limit: int = 30) -> list[Message]:
    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    if before_id is not None:
        query = query.filter(Message.id < before_id)
    rows = query.order_by(Message.id.desc()).limit(limit).all()
    return list(reversed(rows))


def mark_read(db: Session, conversation_id: int, user_id: int) -> None:
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != user_id,
        Message.read_at.is_(None),
    ).update({"read_at": datetime.now(timezone.utc)})
    db.commit()


def serialize(conversation: Conversation, *, current_user_id: int) -> dict:
    messages = conversation.messages
    last = messages[-1] if messages else None
    unread = sum(1 for m in messages if m.sender_id != current_user_id and m.read_at is None)
    return {
        "id": conversation.id,
        "property_id": conversation.property_id,
        "property_title": conversation.property.title,
        "owner_id": conversation.owner_id,
        "owner_name": conversation.owner.name,
        "customer_id": conversation.customer_id,
        "customer_name": conversation.customer.name,
        "last_message": last.body if last else None,
        "last_message_at": last.created_at if last else None,
        "unread_count": unread,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
    }
