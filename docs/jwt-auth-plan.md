# JWT Authentication Upgrade

## Context

Stage 1 shipped with auth that was explicitly "plain & minimal": plaintext password comparison, and every request just sends an `X-User-Id` header that the backend trusts at face value. That was an acceptable trade-off while the app only had public listings and self-serve dashboards. It stops being acceptable once real user-to-user messaging is built (Stage 2) — private conversations need identity that can't be spoofed by editing a request header. This plan replaces the header trick with real JWT-based auth: hashed passwords, signed access tokens, and refresh tokens with server-side revocation — while keeping the same overall shape of the existing auth flow (`/auth/signup`, `/auth/login`, `AuthContext`, `ProtectedRoute`) so the rest of the app barely notices the change.

Confirmed decisions:
- **Access + refresh token pair**: short-lived access token (45 min) for API calls, longer-lived refresh token (14 days) used only to mint new access tokens. Refresh tokens are tracked server-side (by `jti`) so they can be revoked on logout and are rotated on every use — a replayed/stolen refresh token stops working the moment the legitimate client refreshes.
- **Storage**: tokens live in `localStorage` and are sent as `Authorization: Bearer <token>`, matching how the app already stores the current user — no cookie/CORS/CSRF rework needed.
- **Hashing**: `bcrypt` directly (not `passlib`, which has known version friction with modern bcrypt releases).
- Existing seeded demo users have plaintext passwords and will stop authenticating once `authenticate()` switches to hash comparison — the seed script gets updated to hash passwords, and the user re-runs it with `--reset`.

## Backend changes

**New `app/security.py`**: `hash_password`/`verify_password` (bcrypt), `create_access_token(user_id, role)`, `create_refresh_token(user_id)` (returns a JWT with a unique `jti` claim, `type: refresh`, 14-day expiry), `decode_token(token)`.

**New table `refresh_tokens`** (model in `app/models/refresh_token.py`, new Alembic migration): `id`, `user_id` FK, `jti` (unique), `expires_at`, `revoked` (bool), `created_at`. Lets us revoke a specific refresh token (logout) without needing to track every access token.

**`app/config.py`**: add `jwt_secret_key`, `jwt_algorithm` (default `HS256`), `jwt_access_token_expire_minutes` (default 45), `jwt_refresh_token_expire_days` (default 14). `JWT_SECRET_KEY` added to `.env`/`.env.example`.

**`app/crud/users.py`**: `create_user` hashes the password via `hash_password()` before storing; `authenticate` uses `verify_password()` instead of `==`.

**New `app/crud/refresh_tokens.py`**: `create(db, user_id)`, `get_active(db, jti)` (exists, not revoked, not expired), `revoke(db, jti)`.

**`app/schemas/user.py`**: add `TokenPair` (`access_token`, `refresh_token`, `token_type="bearer"`, `user: UserOut`), `RefreshRequest` (`refresh_token`), `AccessTokenOut`.

**`app/routers/auth.py`**:
- `POST /auth/signup` / `POST /auth/login` — now return `TokenPair` (issue both tokens on success).
- `POST /auth/refresh` — verifies the refresh JWT's signature/expiry, checks its `jti` is still active in `refresh_tokens`, **rotates** it (revoke old `jti`, issue a new access+refresh pair), returns a new `TokenPair`.
- `POST /auth/logout` — revokes the given refresh token's `jti` server-side.
- `GET /auth/me` — `Depends(get_current_user)`, returns `UserOut`; frontend calls this on app load to confirm the cached session is still valid and to refresh profile data.

**`app/deps.py`**: replace the `X-User-Id` header read with `HTTPBearer(auto_error=False)` — `get_optional_user` decodes the bearer token (invalid signature, wrong `type`, or expiry all just fall through to "no user"), loads the user from the token's `sub` claim. `get_current_user`/`get_current_owner`/`get_current_customer` keep their existing signatures and 401/403 behavior on top of this.

**`requirements.txt`**: add `pyjwt`, `bcrypt`.

**`scripts/seed_demo_data.py`**: hash demo passwords via `hash_password()` instead of storing them plaintext.

## Frontend changes

**`services/api.js`**:
- Request interceptor now attaches `Authorization: Bearer <access_token>` (from `localStorage`) instead of `X-User-Id`.
- Response interceptor: on a `401` (excluding the login/signup/refresh calls themselves), calls `POST /auth/refresh` once with the stored refresh token, stores the new pair, and retries the original request; concurrent 401s share one in-flight refresh call instead of each firing their own. If refresh itself fails, clears stored tokens/user and dispatches a `rentis:auth-expired` window event.
- `authApi` gains `refresh(refreshToken)`, `logout(refreshToken)`, `me()`.

**`context/AuthContext.jsx`**: `login`/`signup` persist `access_token`+`refresh_token`+`user` to `localStorage`. `logout` calls `authApi.logout()` best-effort, then clears everything. On mount, restores `user` optimistically (as today) and also listens for the `rentis:auth-expired` event (dispatched by the api.js interceptor when a silent refresh ultimately fails) to clear context state — this is what keeps the React context in sync with a module-level axios interceptor that can't call `setUser` directly.

**`components/layout/ProtectedRoute.jsx`**: no changes needed — it already reacts to `user` becoming `null`.

## Build order

1. Backend: `security.py`, config + `.env` additions, install `pyjwt`/`bcrypt` into `backend/venv`
2. `refresh_tokens` table + Alembic migration
3. `crud/users.py` hashing, new `crud/refresh_tokens.py`
4. Schemas, `routers/auth.py` (signup/login/refresh/logout/me), `deps.py` bearer verification
5. Update and re-run `seed_demo_data.py --reset` (required — old plaintext demo passwords stop working)
6. Frontend `api.js` interceptors + `authApi` additions
7. Frontend `AuthContext.jsx` rewire + auth-expired event handling
8. End-to-end verification (below)

## Verification

- `alembic upgrade head`, reseed demo data, spot-check via `psql` that `users.password` is now a bcrypt hash, not plaintext.
- curl/Swagger: signup and login return a `TokenPair`; a protected endpoint (`GET /properties/mine`) returns 200 with a valid `Authorization: Bearer` header, 401 with none, 401 with a tampered token.
- Call `/auth/refresh` with a valid refresh token → get a new pair; call it again with the *same* now-rotated token → must fail (proves rotation/revocation actually works).
- Call `/auth/logout`, then try to refresh with that token → must fail.
- In the browser: log in, confirm requests now carry `Authorization: Bearer …` (devtools network tab) instead of `X-User-Id`; log out and confirm protected routes redirect to `/login`.
