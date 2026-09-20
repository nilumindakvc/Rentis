# Rentis — Stage 1 Build Plan (React + Bootstrap frontend, FastAPI + Postgres backend)

## Context

The Rentis Roadmap artifact already defines three build stages for this property rental brokerage platform. This plan covers **Stage 1: Foundation & Core Listings** — the first thing the user will actually run and test in a browser. The working directory (`E:\myORG`) currently has no code, only `rentins.txt` (requirements) — this is a from-scratch scaffold.

Confirmed decisions from the user:
- **Frontend**: React (plain JavaScript) + Bootstrap (via `react-bootstrap`), built with Vite.
- **Backend**: FastAPI + PostgreSQL (SQLAlchemy + Alembic). The user runs Postgres themselves in Docker and will supply `backend/.env` with `DATABASE_URL`.
- **Auth**: Plain & minimal, by explicit choice — no password hashing, no JWT. Login/signup compares email+password directly; the frontend remembers the logged-in user and sends their id on requests. Not production-secure, accepted for this internal test build.
- **Maps**: Leaflet + OpenStreetMap (`react-leaflet`), no API key needed.
- **Git**: initialize a repo at `E:\myORG` with a `.gitignore`.
- **Photos/videos**: owners paste image URLs for Stage 1 — no file upload/storage infra yet.
- Demo/seed data spans **all 10 property categories** so search and filtering can be tested realistically.

**Goal:** an owner can publish a listing (Property/Rental/Rules) in any of the 10 categories, and a customer can search, filter, view on a map, favorite, and send an inquiry — with the owner seeing that inquiry and a notification. When done, the user will run it locally and evaluate it.

## Repo layout

```
E:\myORG\
  backend/        # FastAPI + SQLAlchemy + Alembic
  frontend/        # Vite + React (JS) + react-bootstrap + react-leaflet
  rentins.txt        # existing, unchanged
  docs/
    stage1-plan.md      # this file
  .gitignore
  README.md            # setup + run instructions for both halves
```

`.gitignore` covers `node_modules/`, `__pycache__/`, `venv/`, `.env`, `dist/`, `build/`.

## Backend

**Schema** (Postgres, via SQLAlchemy models + Alembic migrations):
- `users` — id, name, email (unique), password (plain text — internal test only), role (`owner`/`customer`), phone, created_at
- `property_categories` / `property_subtypes` — fixed reference data seeded by the initial migration (the 10 categories + their subtypes from `rentins.txt`)
- `properties` — owner_id, category_id, subtype_id, title, description; **location** (address_text, latitude, longitude); **size** (size_value, size_unit, layout_description); facilities (JSONB); condition, furnishing, capacity; **rental** (min_price, security_deposit, rental_term enum long/medium/short, renewal_terms, availability_status, additional_charges JSONB); **rules** (permitted_usage, restrictions, parking_access); status (draft/published/archived), view_count, timestamps
- `property_photos` — property_id, url, media_type, sort_order
- `favorites` — customer_id, property_id (unique pair)
- `inquiries` — property_id, customer_id, message, status (new/contacted/closed), timestamps
- `notifications` — user_id (recipient owner), type, title/body, related_inquiry_id, is_read, created_at

**FastAPI structure**: `app/{main,config,database,deps}.py`, `app/models/`, `app/schemas/`, `app/crud/`, `app/routers/{auth,taxonomy,properties,favorites,inquiries,notifications,owner_stats}.py`, `alembic/`, `scripts/seed_demo_data.py`.

**Endpoints**:
- `POST /auth/signup`, `POST /auth/login`
- `GET /taxonomy/categories` (nested categories → subtypes)
- `GET /properties` (search/filter: category, subtype, price range, rental_term, text query, bbox, pagination, sort), `GET /properties/{id}` (increments view_count), `GET /properties/mine` (owner dashboard), `POST /properties`, `PUT /properties/{id}`, `PATCH /properties/{id}/status`, `DELETE /properties/{id}`
- `GET/POST /favorites`, `DELETE /favorites/{property_id}`
- `POST /inquiries`, `GET /inquiries/mine`, `GET /inquiries/owner`, `PATCH /inquiries/{id}/status`
- `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`
- `GET /owner/stats/summary` (listing/view/inquiry counts)

Owner/customer-only routes gate via a dependency reading an `X-User-Id` header (matching the minimal-auth decision).

**Seed script** (`scripts/seed_demo_data.py`): 2 demo owner + 2 demo customer accounts with documented credentials, 1–2 published listings per subtype (~20–30 properties across all 10 categories), 2–4 placeholder photo URLs each, coordinates jittered around one reference city for a believable map cluster, plus a handful of favorites/inquiries/notifications so dashboards aren't empty on first login.

## Frontend

Vite + React (JS) app under `frontend/`:
- `context/AuthContext.jsx` — current user in state + `localStorage`, `login`/`signup`/`logout`
- `services/api.js` — axios instance (`VITE_API_BASE_URL`), interceptor adds `X-User-Id`, grouped helpers per resource
- `components/property/` — `PropertyCard`, `PropertyGrid`, `FilterBar` (category→subtype cascade, price, rental term, text search), `PhotoGallery` (Bootstrap Carousel), `MapView` (react-leaflet, used read-only in search/detail and click-to-pick in the create-listing form), `InquiryForm`, `FavoriteButton`
- `components/layout/` — role-aware `NavBar` with `NotificationBell` (polls unread-count), `ProtectedRoute`
- `pages/` — `HomePage`, `SearchPage` (filters + grid + map split view), `PropertyDetailPage`, `LoginPage`, `SignupPage` (role toggle), `OwnerDashboardPage` (My Listings + stats, Inquiries with status update), `CustomerDashboardPage` (Favorites, My Inquiries), `CreateEditListingPage` (Property/Rental/Rules form, repeatable photo URL fields, map click sets lat/lng)

## Build order & how you'll test each milestone

1. **Repo scaffold** — git init, folder skeletons, README
2. **DB schema & migrations** — `alembic upgrade head` against your Postgres container; inspect tables/enums/taxonomy rows via psql
3. **Seed data** — run seed script, verify row counts
4. **Core read endpoints** — exercise `/properties`, `/properties/{id}`, `/taxonomy/categories` via FastAPI's Swagger UI at `/docs`
5. **Frontend browse (no auth)** — `npm run dev`, browse/filter/view listings and map against real seeded data
6. **Auth** — signup/login via Swagger, then in-browser; confirm session persists across refresh
7. **Create/edit listing** — owner can publish a new listing end-to-end, appears in search
8. **Favorites**
9. **Inquiries + notifications** — customer inquiry triggers an owner notification; owner updates inquiry status
10. **Owner stats**
11. **Full end-to-end pass** — both role journeys, README setup verified from a clean state

## When it's ready

I'll build through all milestones above, then let you know it's ready to run. You'll need your Postgres container up and `backend/.env` filled in beforehand — the README will spell out the exact steps (`alembic upgrade head` → seed script → `uvicorn` → `npm run dev`), including the demo login credentials the seed script creates, so you can log in as both an owner and a customer to evaluate every Stage 1 flow.
