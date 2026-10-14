# Rentis — Owner Subscription Plans (Free / Pro / Organization placeholder)

## Context

Right now every owner has identical capabilities — unlimited listings, full booking/payment access. This plan introduces two real tiers to gate those capabilities (**Free**: 3 active listings, messaging only, no booking; **Pro**: 15 active listings, messaging + booking + Stripe checkout), plus a third **Organization** tier reserved as a "coming soon" marketing placeholder with no backend behavior yet.

Confirmed scope:
- Plan data lives in a DB-backed `plans` table (not hardcoded), so limits/features are editable later without a deploy — but there is **no admin UI for managing plans** and **no real billing** in this phase. An owner self-serve-switches plans by clicking a button on the Pricing page; it flips their plan assignment instantly with no payment involved.
- The role-vs-plan split mirrors the pattern already used for `role`: `get_current_owner`/`get_current_customer` in `app/deps.py` answer "who are you"; this adds a second layer answering "what can you do right now," composed on top rather than by duplicating routes per plan.
- Free-tier owners have booking **hidden entirely** from customers viewing their listings (not just payment blocked) — customers only see "message owner." Messaging and real-time notifications are unconditional for both tiers.
- Downgrade is a soft cap: if an owner ends up over their new plan's listing count (e.g. Pro→Free with 10 listings), existing listings are **not** deleted/archived — only new listing creation is blocked until they're back under the cap.
- "Active listing" for quota purposes = `properties.status != 'archived'` (draft + published count). Decided in exactly one place (`crud/subscriptions.count_active_listings`), so it's a one-line change later if that definition needs to change.
- Every owner gets an `owner_subscriptions` row at signup (default `free`) — no "missing row means free" special-casing anywhere else in the code.

## Backend

**New tables** (migration `0015`, `down_revision = "0014"`):
- `plans`: `id`, `code` (unique `String(30)` — **not** a Postgres enum, since rows must stay data-editable), `name`, `description`, `max_active_listings` (nullable int, null = unlimited), `allows_booking` (bool), `monthly_price_lkr` (numeric, display-only, no billing wired to it), `sort_order`, `created_at`.
- `owner_subscriptions`: `id`, `owner_id` (FK→users, `ondelete="CASCADE"`, **unique** — one row per owner), `plan_id` FK→plans, `created_at`, `updated_at`.
- Same migration seeds `free` (cap 3, `allows_booking=false`) and `pro` (cap 15, `allows_booking=true`), then backfills an `owner_subscriptions` row pointing at `free` for every existing user with `role = 'owner'`.

**`app/models/plan.py`** / **`app/models/owner_subscription.py`** — `Plan`, `OwnerSubscription` (`plan = relationship("Plan")`, `owner = relationship("User", back_populates="subscription")`). **`app/models/user.py`** gains `subscription = relationship("OwnerSubscription", back_populates="owner", uselist=False, cascade="all, delete-orphan")`, parallel to the existing `properties`/`favorites`/etc. relationships. Both new models registered in `app/models/__init__.py`.

**`app/schemas/plan.py`** — `PlanOut` (`from_attributes=True`, same style as `schemas/partner.py`). **`app/schemas/subscription.py`** — `SubscriptionSwitchIn {plan_code}`, `OwnerSubscriptionOut {id, owner_id, plan: PlanOut, active_listings_count, created_at, updated_at}` (hand-built dict, like `properties_crud.serialize_full`, since `active_listings_count` is computed). **`app/schemas/property.py`** gains `owner_allows_booking: bool = False` on both `PropertySummaryOut` and `PropertyOut`.

**`app/crud/plans.py`** — `list_all(db)`, `get_by_code(db, code)`.

**`app/crud/subscriptions.py`** — `get_for_owner`, `create_default` (looks up `free` by `code`, used at signup), `switch_plan(db, owner_id, plan_code)` (raises `ValueError` on unknown code — `"organization"` 400s naturally, no special-casing needed), `count_active_listings`, `plan_allows_booking`, `serialize`.

**`app/crud/properties.py`** — add `joinedload(Property.owner).joinedload(User.subscription).joinedload(OwnerSubscription.plan)` to the existing `PROPERTY_RELATIONSHIPS` tuple to avoid N+1; `serialize_summary`/`serialize_full` add `"owner_allows_booking": bool(prop.owner.subscription and prop.owner.subscription.plan.allows_booking)`.

**`app/crud/bookings.py`** `create_booking` — right after the existing rental-term check, add a `plan_allows_booking` check raising `PermissionError("This owner's current plan does not support booking requests")`. No router change needed — `routers/bookings.py` already maps `PermissionError` → 400.

**`app/crud/users.py`** `create_user` — after `db.refresh(user)`, if `role == UserRole.owner`, call `subscriptions_crud.create_default(db, user.id)`.

**`app/deps.py`** — new `enforce_listing_quota` dependency: loads the owner's plan, counts active listings, raises `HTTPException(403, ...)` directly if at/over the cap — same direct-raise style as `_get_owned_property` in `routers/properties.py`, reusing 403 rather than introducing a new status code (keeps the existing 400/403/404/409 vocabulary intact).

**New `app/routers/plans.py`** — `GET /plans` (public, no auth) → `list[PlanOut]`. **New `app/routers/subscriptions.py`** — `GET /subscriptions/mine`, `POST /subscriptions/switch` (both owner-only, no payment step). **`app/routers/properties.py`** `create_property` gains `_: None = Depends(enforce_listing_quota)`. `app/main.py` registers both new routers.

## Frontend

**`services/api.js`** — new `plansApi = { list }`, `subscriptionsApi = { mine, switch }`, same object-literal-of-axios-calls style as the existing `bookingsApi`/`partnersApi`.

**`PricingPage.jsx`** — full rewrite: fetch `plansApi.list()`, render a Free and a Pro card (name, price, listing cap, booking access), plus a third static "Organization — Coming soon" card with no button/network call. For a logged-in owner, also fetch `subscriptionsApi.mine()` and show a "Switch to this plan" button (disabled on their current plan) calling `subscriptionsApi.switch(plan.code)`.

**`components/property/PropertyDetailView.jsx` / `VehicleDetailView.jsx` / `GoodDetailView.jsx`** — `canBook` also requires `property.owner_allows_booking`. The existing `canBook ? <BookingRequestForm/> : <AvailabilityCalendar/>` branch already falls through to the read-only calendar when false — no new UI.

**`OwnerDashboardPage.jsx`** `ListingsTab` — add `subscriptionsApi.mine()` to the existing `Promise.all`, show a plan banner ("Plan: Free — 3/3 active listings") above the stats row, with an `Alert` + link to `/pricing` at the cap. Also add a persistent header "Add listing" button above the listings table — today the button only exists in the empty state, so once an owner has any listing there's currently no visible way to try adding another and discover the cap. `CreateEditListingPage.jsx` needs no change — it already surfaces `error.response.data.detail` via the existing `ErrorAlert` component, so the 403 quota message shows automatically.

## Build order

1. Migration `0015` → `alembic upgrade head`
2. `models/plan.py`, `models/owner_subscription.py`, `User.subscription`, `models/__init__.py`
3. `schemas/plan.py`, `schemas/subscription.py`, `property.py` field additions
4. `crud/plans.py`, `crud/subscriptions.py`
5. `crud/properties.py` eager-load + serializer fields; `crud/bookings.py` plan check; `crud/users.py` signup hook
6. `deps.py` `enforce_listing_quota`
7. `routers/plans.py`, `routers/subscriptions.py`, `routers/properties.py` quota dependency, `main.py` wiring
8. `api.js` `plansApi`/`subscriptionsApi`
9. `PricingPage.jsx` rewrite
10. `canBook` edits in the three property view components
11. `OwnerDashboardPage.jsx` plan banner + persistent "Add listing" button
12. End-to-end verification

## Verification

- `alembic upgrade head` — confirm 2 `plans` rows and every existing owner backfilled with a `free` `owner_subscriptions` row.
- Sign up a new owner → `GET /subscriptions/mine` → `plan.code == "free"`.
- Create 3 properties (succeed) → 4th `POST /properties` → 403 with the quota message; dashboard shows "3/3" + upgrade alert.
- As a customer, view that owner's listing → `owner_allows_booking: false`, UI shows the read-only calendar not the booking form; direct `POST /bookings` → 400.
- Switch the owner to `pro` via the Pricing page (or `POST /subscriptions/switch`) → `owner_allows_booking` flips to `true`, booking form appears, `POST /bookings` now succeeds; cap now allows up to 15 listings, 16th still 403s.
- Downgrade back to `free` with >3 listings → 200, all existing listings untouched (not archived/deleted), but new `POST /properties` immediately 403s, and `owner_allows_booking` flips back to `false` for customers.
- Pricing page's Organization card is static with no button; `POST /subscriptions/switch {"plan_code":"organization"}` → 400 Unknown plan code.
