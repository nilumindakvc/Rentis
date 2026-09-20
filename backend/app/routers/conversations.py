from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import conversations as conversations_crud
from app.crud import notifications as notifications_crud
from app.database import get_db
from app.deps import get_current_customer, get_current_user
from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.schemas.conversation import ConversationCreate, ConversationOut, MessageCreate, MessageOut
from app.ws_manager import manager

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _get_owned_conversation(db: Session, conversation_id: int, user: User):
    conversation = conversations_crud.get(db, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if not conversations_crud.is_participant(conversation, user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not part of this conversation")
    return conversation


def _notify_and_push(db: Session, conversation, sender: User, recipient_id: int):
    notification = Notification(
        user_id=recipient_id,
        type=NotificationType.new_message,
        title=f"New message from {sender.name}",
        body=f'About "{conversation.property.title}"',
        related_property_id=conversation.property_id,
        related_conversation_id=conversation.id,
    )
    db.add(notification)
    db.commit()
    return notification


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def start_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    customer: User = Depends(get_current_customer),
):
    conversation = conversations_crud.get_or_create(db, payload.property_id, customer.id)
    conversations_crud.create_message(db, conversation, customer.id, payload.message)
    conversation = conversations_crud.get(db, conversation.id)

    _notify_and_push(db, conversation, customer, conversation.owner_id)
    await manager.send_to_user(
        conversation.owner_id,
        {"type": "new_message", "conversation_id": conversation.id},
    )
    return conversations_crud.serialize(conversation, current_user_id=customer.id)


@router.get("", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conversations = conversations_crud.list_for_user(db, user.id)
    return [conversations_crud.serialize(c, current_user_id=user.id) for c in conversations]


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(
    conversation_id: int,
    before_id: int | None = None,
    limit: int = 30,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_owned_conversation(db, conversation_id, user)
    return conversations_crud.list_messages(db, conversation_id, before_id, limit)


@router.post("/{conversation_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conversation = _get_owned_conversation(db, conversation_id, user)
    message = conversations_crud.create_message(db, conversation, user.id, payload.body)

    recipient_id = conversation.owner_id if user.id == conversation.customer_id else conversation.customer_id
    _notify_and_push(db, conversation, user, recipient_id)
    await manager.send_to_user(recipient_id, {"type": "new_message", "conversation_id": conversation.id})
    return message


@router.patch("/{conversation_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    conversation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_owned_conversation(db, conversation_id, user)
    conversations_crud.mark_read(db, conversation_id, user.id)
    notifications_crud.mark_read_for_conversation(db, user.id, conversation_id)
