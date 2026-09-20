# Rentis — Stage 1

Property rental brokerage platform. This is Stage 1: core listings, search/filter, owner and customer accounts, favorites, real-time messaging, notifications, and an admin panel. See [docs/stage1-plan.md](docs/stage1-plan.md), [docs/jwt-auth-plan.md](docs/jwt-auth-plan.md), [docs/messaging-plan.md](docs/messaging-plan.md), and [docs/admin-panel-plan.md](docs/admin-panel-plan.md) for the full build plans.

- `backend/` — FastAPI + SQLAlchemy + Alembic, backed by PostgreSQL
- `frontend/` — React (JS) + Bootstrap + Leaflet, built with Vite

## Prerequisites

- PostgreSQL running and reachable (e.g. your own Docker container)
- A Cloudinary account (for property photo uploads)
- Python 3.11+ and Node 18+

## 1. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

copy .env.example .env       # Windows: copy, macOS/Linux: cp
```

Edit `backend/.env`:
- `DATABASE_URL` — point at your Postgres container, e.g. `postgresql://postgres:postgres@localhost:5432/rentis`
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — from your Cloudinary dashboard
- `JWT_SECRET_KEY` — generate one with `python -c "import secrets; print(secrets.token_hex(32))"`

```bash
alembic upgrade head          # creates all tables + seeds the 10 property categories/subtypes
python -m scripts.seed_demo_data   # optional but recommended: adds demo owners, customers & listings/conversations

uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Interactive API docs (Swagger UI): http://localhost:8000/docs

### Demo logins (created by the seed script, password `password123` for all)

| Role | Email |
|---|---|
| Owner | owner1@rentis.test |
| Owner | owner2@rentis.test |
| Customer | customer1@rentis.test |
| Customer | customer2@rentis.test |

Re-run the seed script with `--reset` to wipe and reseed demo data: `python -m scripts.seed_demo_data --reset`.

### Admin panel

The admin panel is a separate login (`/admin/login` in the frontend, `/admin/auth/*` in the API) with its own `admins` table — not a role on a regular user account. Bootstrap the one-and-only super admin once:

```bash
python -m scripts.create_super_admin --name "Your Name" --email "you@rentis.internal" --password "choose-a-strong-password"
```

Log in at http://localhost:5173/admin/login. The super admin can add/remove other admins from the Admins page; regular admins can manage users and listings but not other admins.

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173
- By default it talks to `http://localhost:8000`. To point it elsewhere, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`.

## Notes on this build

- **Auth** uses JWT access + refresh tokens (bcrypt-hashed passwords, no plaintext). Access tokens are short-lived (45 min) and refreshed silently by the frontend; refresh tokens are rotated and revocable server-side. See [docs/jwt-auth-plan.md](docs/jwt-auth-plan.md).
- **Messaging** is real two-way chat (`conversations`/`messages`), delivered live over a WebSocket (`/ws/messages`) while both sides are online, with an in-app notification/bell fallback otherwise. In-memory connection registry — fine for a single backend process; see [docs/messaging-plan.md](docs/messaging-plan.md) for the scaling note.
- **Photos/videos** are uploaded to Cloudinary from the create/edit listing form — no more pasted URLs.
- **Maps** use Leaflet + OpenStreetMap, no API key required.
- **Admin panel** is fully separate from customer/owner auth — its own `admins` table, its own JWTs (a `scope` claim keeps admin and user tokens from ever being usable against the other's endpoints), its own login page. Exactly one `super_admin` can exist, enforced by a database constraint. See [docs/admin-panel-plan.md](docs/admin-panel-plan.md).
