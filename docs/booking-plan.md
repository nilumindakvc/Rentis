# Rentis — Booking Requests (Accept/Reject) tied to the Availability Calendar

## Context

The availability calendar (short-term & medium-term listings) currently only supports owners manually blocking dates — there's no way for a customer to actually request specific dates. This plan adds the structured booking workflow discussed earlier: a customer picks a period (or a single day), submits a request, the owner accepts or rejects it, and an accepted booking automatically blocks those dates on the calendar we already built.

Confirmed scope:
- Booking requests apply only to **`short_term`** and **`medium_term`** listings — the same two that already have a calendar. **`long_term`** listings are unaffected and keep working via messaging only, no date-range request/accept flow (a lease doesn't fit a calendar-range model).
- **Messaging stays completely separate**, as promised earlier — bookings get their own notification types and their own WS push, no Conversation/Message involvement. A booking's own `status` field is the record of what happened; it doesn't need a chat thread to convey "accepted."
- **Accepting a booking auto-blocks the calendar** (creates an `AvailabilityBlock` for that range) and **auto-rejects any other still-pending requests for the property that now overlap it** — closing the obvious gap where two customers request overlapping dates and the owner accepts one.
- A booking request is itself validated against the existing calendar at creation time (can't request already-blocked dates) — same `overlaps()` check already used for manual blocks (`app/crud/availability.py`), reused here rather than reimplemented.

## Backend

**New table `bookings`**: `id`, `property_id` FK→properties (CASCADE), `customer_id`/`owner_id` FK→users, `start_date`/`end_date` (Date), `status` (`booking_status` enum: `pending`/`accepted`/`rejected`/`cancelled`), `message` (nullable text, customer's optional note), `created_at`/`updated_at`.

**`app/models/enums.py`**: new `BookingStatus` enum. `NotificationType` gains `booking_request`, `booking_accepted`, `booking_rejected` (same `ALTER TYPE ... ADD VALUE` approach already used for `new_message` in migration `0003`).

**`app/models/notification.py`**: add `related_booking_id` (nullable FK→bookings), parallel to the existing `related_property_id`/`related_conversation_id`.

**`app/models/booking.py`** — `Booking` model; `Property.bookings` relationship (`cascade="all, delete-orphan"`, same pattern as `conversations`/`availability_blocks`).

**Migration `0006`**: `booking_status` enum, `bookings` table, `notification_type` gains the three new values, `notifications.related_booking_id` column.

**`app/schemas/booking.py`**: `BookingCreate` (`property_id`, `start_date`, `end_date`, `message?`), `BookingOut` (id, property fields for display, customer/owner names, dates, status, timestamps).

**`app/crud/bookings.py`**:
- `create_booking(db, customer_id, payload)` — looks up the property to derive `owner_id` (never client-supplied, same trust model as `conversations_crud.get_or_create`), validates `start_date <= end_date` and rental_term is `short_term`/`medium_term`, checks `availability_crud.overlaps(...)` and rejects (409) if the range is already blocked, inserts the row as `pending`.
- `accept(db, booking)` — re-checks overlap (defensive — something could have changed since the request was made), creates an `AvailabilityBlock` for the range (reason like `f"Booked by {customer.name}"`), sets `status=accepted`, finds and rejects other `pending` bookings on the same property whose range now overlaps (returns them so the router can notify each).
- `reject(db, booking)`, `cancel(db, booking)` (customer-only, only while `pending`).
- `list_for_customer(db, customer_id)`, `list_for_owner(db, owner_id, status=None)`.

**New `app/routers/bookings.py`**:
- `POST /bookings` (customer-only, `async def` — pushes over WS) — creates the booking, notifies + pushes the owner (`booking_request`).
- `GET /bookings/mine` (customer) — their own requests.
- `GET /bookings/owner` (owner) — requests across their properties, optional `status` filter.
- `PATCH /bookings/{id}/accept` (owner-only, `async def`) — 409 if the dates are no longer free; on success, notifies+pushes the customer (`booking_accepted`) and every auto-rejected customer (`booking_rejected`).
- `PATCH /bookings/{id}/reject` (owner-only, `async def`) — notifies+pushes the customer.
- `PATCH /bookings/{id}/cancel` (customer-only) — no notification needed (the customer is the one acting).

`app/main.py` registers the new router.

## Frontend

**`services/api.js`**: new `bookingsApi` — `create`, `mine`, `forOwner`, `accept`, `reject`, `cancel`.

**New `components/property/BookingRequestForm.jsx`** (parallel to `ContactOwnerForm.jsx`): renders `AvailabilityCalendar` in interactive `mode="range"`, an optional message field, and "Request to book" — calls `bookingsApi.create`, shows an inline confirmation with the requested dates on success (no thread to jump to, unlike messaging).

**`PropertyDetailView.jsx`**: for `short_term`/`medium_term` listings, a logged-in **customer** sees `BookingRequestForm` instead of the plain read-only calendar; everyone else (logged-out, owners, other listing types) keeps the existing read-only `AvailabilityCalendar`.

**Dashboards** — both currently show a single section (no tabs, since messaging/inquiries were removed earlier); this reintroduces a second section now that there's a real second concern:
- `CustomerDashboardPage.jsx`: `Tabs` with **Favorites** (existing) and **My Bookings** (new — list with status badges, Cancel button while pending).
- `OwnerDashboardPage.jsx`: `Tabs` with **My Listings** (existing) and **Booking Requests** (new — list with Accept/Reject buttons on pending ones).

**`NotificationBell.jsx`**: the WS-event refresh condition (`if (event.type === 'new_message')`) broadens to refresh on any received event, not just messages, since bookings now push over the same socket. `handleItemClick` gains a branch for `related_booking_id`: navigate to `/owner/dashboard` or `/customer/dashboard` depending on the current user's role (needs `useAuth()`, not currently imported there).

## Build order

1. Backend model + migration `0006` → `alembic upgrade head`
2. `crud/bookings.py`, `schemas/booking.py`, `routers/bookings.py` → wire into `main.py`
3. `api.js` `bookingsApi`
4. `BookingRequestForm` + `PropertyDetailView` integration
5. Dashboard tabs (owner + customer) for booking requests / my bookings
6. `NotificationBell` broaden-refresh + role-aware navigation
7. End-to-end verification

## Verification

- curl: customer requests dates on a `medium_term`/`short_term` listing → owner gets a notification + WS push; requesting already-blocked dates 409s.
- Owner accepts → `AvailabilityBlock` is created (confirm via `GET /properties/{id}/availability`), customer gets `booking_accepted`.
- A second, overlapping pending request on the same property gets auto-rejected on accept, and that customer gets `booking_rejected`.
- Owner rejects a request directly → customer notified, no calendar change.
- Customer cancels a still-pending request → status becomes `cancelled`; cannot cancel an already-accepted one.
- Attempting to request booking on a `long_term` listing is rejected (400).
- Frontend: confirm every new/changed file transforms cleanly through Vite (no browser access in this session) — the actual click-through (request → accept/reject → calendar updates) is yours to confirm.
