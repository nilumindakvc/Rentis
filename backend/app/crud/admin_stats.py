from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.enums import UserRole
from app.models.message import Message
from app.models.property import Property
from app.models.user import User


def summary(db: Session) -> dict:
    total_owners = db.query(func.count(User.id)).filter(User.role == UserRole.owner).scalar()
    total_customers = db.query(func.count(User.id)).filter(User.role == UserRole.customer).scalar()

    rows = db.query(Property.status, func.count(Property.id)).group_by(Property.status).all()
    listings_by_status = {status.value: count for status, count in rows}

    total_conversations = db.query(func.count(Conversation.id)).scalar()
    total_messages = db.query(func.count(Message.id)).scalar()

    return {
        "total_owners": total_owners or 0,
        "total_customers": total_customers or 0,
        "listings_by_status": listings_by_status,
        "total_conversations": total_conversations or 0,
        "total_messages": total_messages or 0,
    }
