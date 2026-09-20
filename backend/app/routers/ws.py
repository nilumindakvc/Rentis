import jwt
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.database import get_db
from app.models.user import User
from app.security import decode_token
from app.ws_manager import manager

router = APIRouter(tags=["ws"])


@router.websocket("/ws/messages")
async def ws_messages(websocket: WebSocket, db=Depends(get_db)):
    token = websocket.query_params.get("token")
    user: User | None = None
    if token:
        try:
            payload = decode_token(token)
            if payload.get("type") == "access" and payload.get("scope", "user") == "user":
                user = db.get(User, int(payload["sub"]))
                if user is not None and not user.is_active:
                    user = None
        except (jwt.PyJWTError, KeyError, ValueError):
            user = None

    if user is None:
        await websocket.close(code=1008)
        return

    await manager.connect(user.id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user.id, websocket)
