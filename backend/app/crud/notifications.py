from sqlalchemy.orm import Session

from app.models.notification import Notification


def list_notifications(db: Session, user_id: int, unread_only: bool = False, limit: int = 50):
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).limit(limit).all()


def unread_count(db: Session, user_id: int) -> int:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .count()
    )


def mark_read(db: Session, user_id: int, notification_id: int) -> None:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if notification:
        notification.is_read = True
        db.commit()


def mark_all_read(db: Session, user_id: int) -> None:
    db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read.is_(False)).update(
        {"is_read": True}
    )
    db.commit()


def mark_read_for_conversation(db: Session, user_id: int, conversation_id: int) -> None:
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.related_conversation_id == conversation_id,
        Notification.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()
