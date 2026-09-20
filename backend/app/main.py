from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    admin_admins,
    admin_auth,
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
    properties,
    taxonomy,
    uploads,
    ws,
)

app = FastAPI(title="Rentis API", version="0.1.0")

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
app.include_router(availability.router)
app.include_router(bookings.router)
app.include_router(favorites.router)
app.include_router(conversations.router)
app.include_router(notifications.router)
app.include_router(owner_stats.router)
app.include_router(uploads.router)
app.include_router(ws.router)
app.include_router(admin_auth.router)
app.include_router(admin_admins.router)
app.include_router(admin_users.router)
app.include_router(admin_properties.router)
app.include_router(admin_stats.router)


@app.get("/health")
def health():
    return {"status": "ok"}
