from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        self.active[user_id].discard(websocket)
        if not self.active[user_id]:
            del self.active[user_id]

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        dead = []
        for websocket in self.active.get(user_id, set()):
            try:
                await websocket.send_json(payload)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(user_id, websocket)


manager = ConnectionManager()
