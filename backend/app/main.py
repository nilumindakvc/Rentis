from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.datastructures import Headers
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

from app.config import settings
from app.routers import (
    admin_admins,
    admin_auth,
    admin_partners,
    admin_properties,
    admin_stats,
    admin_users,
    auth,
    availability,
    bookings,
    conversations,
    favorites,
    notifications,
    owner_stats,
    partners,
    payments,
    properties,
    reviews,
    taxonomy,
    uploads,
    ws,
)

app = FastAPI(title="Rentit API", version="0.1.0")


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            accepts_html = "text/html" in Headers(scope=scope).get("accept", "")
            if exc.status_code != 404 or not accepts_html or Path(path).suffix:
                raise
            return await super().get_response("index.html", scope)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(taxonomy.router)
app.include_router(properties.router)
app.include_router(reviews.router)
app.include_router(availability.router)
app.include_router(bookings.router)
app.include_router(favorites.router)
app.include_router(conversations.router)
app.include_router(notifications.router)
app.include_router(owner_stats.router)
app.include_router(payments.router)
app.include_router(uploads.router)
app.include_router(partners.router)
app.include_router(ws.router)
app.include_router(admin_auth.router)
app.include_router(admin_admins.router)
app.include_router(admin_users.router)
app.include_router(admin_properties.router)
app.include_router(admin_partners.router)
app.include_router(admin_stats.router)


@app.get("/health")
def health():
    return {"status": "ok"}


frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if (frontend_dist / "index.html").is_file():
    app.mount("/", SPAStaticFiles(directory=frontend_dist, html=True), name="frontend")
