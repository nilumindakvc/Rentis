# Rentis — Admin Panel

## Context

Rentis has had zero moderation or platform-wide visibility until now: an owner only ever sees their own listings, a customer only their own account, and nothing stops a bad actor from publishing junk or nothing lets anyone suspend an abusive account. This plan adds a first-stage admin panel covering the three things actually missing: **user directory + suspend/reactivate**, **listing moderation** (view/unpublish/archive any listing regardless of owner), and a **platform-wide stats snapshot**.

Confirmed requirements, all explicit user decisions:
- Admins are **entirely separate from the `users` table** — a dedicated `admins` table, dedicated login endpoint (`/admin/auth/login`), never reachable from the normal customer/owner login page.
- Two admin roles: **`admin`** (operational access — users, listings, stats) and **`super_admin`** (same access, *plus* the exclusive ability to add/remove `admin` accounts). Exactly **one** `super_admin` can ever exist, enforced at the database level, not just in application logic.
- Built for extension: the current `admin` vs `super_admin` split is deliberately just "who manages admins" for now — a later stage can add per-admin feature restrictions without changing this shape.
- Frontend: same React app, new `/admin/*` routes with their own auth context/localStorage keys — not a separate project (confirmed trade-off: less isolation, but one dev server and no doubled infra for a 3-feature tool).

## Backend

### Schema

**`admins`** (new table): `id`, `name`, `email` (unique), `password` (bcrypt hash, same as `users`), `role` (`admin_role` enum: `admin` / `super_admin`), `created_at`. A **partial unique index** on `role` where `role = 'super_admin'` makes a second super admin impossible to insert, full stop — not just a rule the application layer has to remember.

**`admin_refresh_tokens`** (new table): mirrors the existing `refresh_tokens` table exactly (`id`, `admin_id` FK→admins CASCADE, `jti` unique, `expires_at`, `revoked`, `created_at`) — kept as its own table rather than reusing `refresh_tokens`, since that table's `user_id` is a NOT NULL FK into `users` and admins are a genuinely separate identity space.

**`users`**: add `is_active` (boolean, not null, default `true`). This is what "suspend" actually means.

### Reused, not duplicated: JWT infrastructure

`app/security.py`'s `create_access_token`/`create_refresh_token` gain an optional `scope: str = "user"` param, embedded as a `"scope"` claim in the token payload. Admin tokens are issued with `scope="admin"`. This is the mechanism that keeps the two identity spaces from ever crossing wires: `app/deps.py`'s existing `get_optional_user` (used by every customer/owner-facing route) starts rejecting any token where `scope != "user"`, and the new admin dependency rejects the reverse. Same signing key, same `decode_token()`, same bcrypt hashing — no parallel crypto to maintain, just a claim check on top of what already exists.

`deps.get_optional_user` also starts rejecting a token whose `user.is_active` is `False` — this is what makes a suspension take effect **immediately**, not just block the next login (an already-issued access token would otherwise keep working for up to 45 more minutes).

### New backend files

- **`app/models/admin.py`**, **`app/models/admin_refresh_token.py`** — the two new tables above.
- **`app/schemas/admin.py`** — `AdminLogin`, `AdminCreate` (name/email/password — role is always forced to `admin` server-side, never client-supplied), `AdminOut`, `AdminTokenPair`, `AdminRefreshRequest`.
- **`app/crud/admins.py`** — `get_by_email`, `create_admin`, `authenticate`, `list_all`, `delete` (raises if the target is the `super_admin` — that account is never deletable through this endpoint).
- **`app/crud/admin_refresh_tokens.py`** — mirrors `app/crud/refresh_tokens.py` (`create`/`get_active`/`revoke`), scoped to `admin_id`.
- **`app/admin_deps.py`** — `get_optional_admin` / `get_current_admin` / `get_current_super_admin`, mirroring `app/deps.py`'s shape but checking `scope == "admin"` and loading from the `Admin` table.
- **`app/routers/admin_auth.py`** — `POST /admin/auth/login`, `POST /admin/auth/refresh`, `POST /admin/auth/logout`, `GET /admin/auth/me`. No signup endpoint — admins are only ever created by the super admin (or the bootstrap script below).
- **`app/routers/admin_admins.py`** (super_admin only) — `GET /admin/admins`, `POST /admin/admins` (create a regular `admin`), `DELETE /admin/admins/{id}`.
- **`app/routers/admin_users.py`** (any admin) — `GET /admin/users` (search/paginate all owners+customers, shows `is_active`), `PATCH /admin/users/{id}/status` (toggle `is_active`).
- **`app/routers/admin_properties.py`** (any admin) — `GET /admin/properties` (every listing regardless of owner/status, with filters), `PATCH /admin/properties/{id}/status` (reuses the existing `ListingStatus` enum — this is how an admin takes a bad listing down: set it to `archived`). Deliberately **no delete** endpoint here — status changes are reversible, a destructive delete from a brand-new admin tool isn't worth the risk yet.
- **`app/routers/admin_stats.py`** (any admin) — `GET /admin/stats/summary`: total users by role, total listings by status, total conversations, total messages.
- **`backend/scripts/create_super_admin.py`** — one-time bootstrap script (`python -m scripts.create_super_admin --name ... --email ... --password ...`), the only way the first (and only) super admin ever gets created. Refuses with a clear message if one already exists.
- **Migration `0004`**: `admin_role` enum, `admins` table + partial unique index, `admin_refresh_tokens` table, `users.is_active` column.

### Modified backend files

- **`app/security.py`** — add the `scope` param described above.
- **`app/deps.py`** — `scope` check + `is_active` check in `get_optional_user`.
- **`app/models/user.py`** — `is_active` column.
- **`app/routers/auth.py`** — after a successful password check, reject login with 403 ("Account suspended") if `is_active` is `False`.
- **`app/main.py`** — register the four new admin routers.

## Frontend

All new, under `frontend/src/`:
- **`services/adminAuthStorage.js`** — mirrors `authStorage.js`, `rentis_admin_*` localStorage keys (fully independent of the regular user session — both can be logged in at once in the same browser without conflict).
- **`services/adminApi.js`** — separate axios instance/interceptors (bearer token + silent refresh against `/admin/auth/refresh`), grouped into `adminAuthApi`, `adminAdminsApi`, `adminUsersApi`, `adminPropertiesApi`, `adminStatsApi`.
- **`context/AdminAuthContext.jsx`** — mirrors `AuthContext.jsx`, independent of it.
- **`components/admin/AdminProtectedRoute.jsx`** — checks `AdminAuthContext`; optional `superOnly` prop for the admin-management page.
- **`components/admin/AdminLayout.jsx`** — distinct nav (Dashboard / Users / Listings / Admins-if-super-only) + logout, visually distinguishable from the customer-facing site so it's never confused with it.
- **`pages/admin/AdminLoginPage.jsx`** — route `/admin/login`, its own form, **not linked from the main `NavBar`** anywhere.
- **`pages/admin/AdminDashboardPage.jsx`** — the stats snapshot.
- **`pages/admin/AdminUsersPage.jsx`** — searchable table, suspend/reactivate button per row.
- **`pages/admin/AdminPropertiesPage.jsx`** — table of every listing, filter by status/category, unpublish/archive action.
- **`pages/admin/AdminManageAdminsPage.jsx`** (super_admin only) — list admins, add-admin form, remove button (disabled/hidden for the super admin's own row).

Modified: **`main.jsx`** wraps the app in `<AdminAuthProvider>` alongside the existing `<AuthProvider>` (both independent, both always mounted); **`App.jsx`** adds `/admin/login` and the `/admin/*` protected routes.

## Build order

1. Migration `0004` (admins, admin_refresh_tokens, users.is_active) → `alembic upgrade head`
2. `security.py` scope param, `admin_deps.py`, `crud/admins.py`, `crud/admin_refresh_tokens.py`, `routers/admin_auth.py` → wire into `main.py` → bootstrap the super admin via the new script
3. `deps.py` scope/is_active checks, `routers/auth.py` suspended-login guard
4. `routers/admin_users.py`, `routers/admin_properties.py`, `routers/admin_stats.py`, `routers/admin_admins.py`
5. Frontend: `adminAuthStorage.js`, `adminApi.js`, `AdminAuthContext.jsx`, `AdminProtectedRoute.jsx`, `AdminLayout.jsx`, routes in `App.jsx`/`main.jsx`
6. `AdminLoginPage`, `AdminDashboardPage`, `AdminUsersPage`, `AdminPropertiesPage`, `AdminManageAdminsPage`
7. End-to-end verification

## Verification

- Bootstrap the super admin, confirm a second attempt (or a direct insert) is rejected by the partial unique index.
- curl: admin login returns a token pair; an **admin-scoped token used against a normal endpoint** (e.g. `GET /properties/mine`) gets 401, and a **normal user token used against `/admin/users`** also gets 401 — proves the scope separation actually works, not just in the happy path.
- Super admin creates a regular admin, regular admin can hit `/admin/users`/`/admin/properties`/`/admin/stats/summary` but gets 403 on `/admin/admins`.
- Suspend a demo user via `PATCH /admin/users/{id}/status`: confirm their **already-issued access token immediately 401s** on the next request (not just that a fresh login fails).
- Unpublish a property via admin: confirm it disappears from public `GET /properties` search results.
- Attempt to delete the super admin via `DELETE /admin/admins/{id}`: must fail.
- Frontend: log in at `/admin/login` (confirm it's unreachable from the regular nav), browse Users/Listings/Dashboard, suspend a user, unpublish a listing, and (as super admin) add + remove a regular admin.
