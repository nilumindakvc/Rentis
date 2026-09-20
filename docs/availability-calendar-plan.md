# Rentis — Availability Calendar (Short-term & Rent-for-a-day)

## Context

The homepage now organizes listings into Long-term / Short-term / Rent-for-a-day sections, with the latter two flagged as "calendar coming soon." This plan builds that calendar: owners of `medium_term` and `short_term` listings can block off date ranges they're unavailable, and customers see those blocked dates before reaching out. This is deliberately just the calendar/availability piece — the full booking request → accept/reject workflow (which would consume this calendar) is a separate, later step, per the earlier discussion.

Confirmed scope:
- Applies to `medium_term` (weeks/months) and `short_term` (days) listings only, per the homepage's own duration split. `long_term` listings don't get a calendar.
- This restriction is a **UI decision, not a database constraint** — the backend stays generic (any property can technically have blocked periods); only the frontend decides which listings show the calendar, matching how the homepage's duration sections are already "curated, not enforced."
- Owners manually block/unblock date ranges (maintenance, already rented elsewhere, personal use, etc.) — there's no booking-request flow yet consuming this, so blocking is purely manual for now.

## Backend

**New table `property_unavailable_periods`**: `id`, `property_id` FK→properties (CASCADE), `start_date`, `end_date` (both `Date`, inclusive range), `reason` (nullable text), `created_at`.

**`app/models/availability_block.py`** — `AvailabilityBlock` model; add `Property.availability_blocks` relationship (`cascade="all, delete-orphan"`, matching the existing pattern for `photos`/`conversations` on `app/models/property.py`).

**Migration `0005`**: create the table + index on `property_id`.

**`app/schemas/availability.py`**: `AvailabilityBlockCreate` (`start_date`, `end_date`, `reason: str | None`), `AvailabilityBlockOut` (adds `id`, `property_id`, `created_at`).

**`app/crud/availability.py`**: `list_for_property(db, property_id)` (ordered by `start_date`), `overlaps(db, property_id, start_date, end_date)` (rejects a new block that overlaps an existing one — keeps the blocked-period list unambiguous), `create_block`, `get_block`, `delete_block`.

**New `app/routers/availability.py`**, mounted under the existing `/properties` prefix:
- `GET /properties/{property_id}/availability` — public (same visibility as viewing the listing itself), returns all blocks.
- `POST /properties/{property_id}/availability` — owner-only (reuses `get_current_owner` + an ownership check like `routers/properties.py`'s existing `_get_owned_property`), validates `start_date <= end_date`, 409s on overlap.
- `DELETE /properties/{property_id}/availability/{block_id}` — owner-only, 404 if the block doesn't belong to that property.

`app/main.py` registers the new router.

## Frontend

**Library**: add `react-day-picker` (npm) — a small, actively-maintained range-calendar component. Avoids hand-rolling month-grid/leap-year date math for what's otherwise a solved problem; the app already reaches for a focused library when the need is genuine (Leaflet for maps).

**`services/api.js`**: new `availabilityApi` — `list(propertyId)`, `create(propertyId, payload)`, `remove(propertyId, blockId)`.

**New `components/property/AvailabilityCalendar.jsx`** — shared, takes a list of blocks and renders a month calendar with those date ranges visually disabled/marked. Used both by the owner (as a visual reference while picking new ranges) and the customer-facing detail page (read-only).

**New `pages/OwnerAvailabilityPage.jsx`** at `/owner/listings/:id/availability` (owner-only `ProtectedRoute`): an interactive `react-day-picker` range picker + optional "reason" field + "Block these dates" button, the shared calendar showing existing blocks, and a list of current blocks each with a Remove button.

**`OwnerDashboardPage.jsx`**: add an "Availability" link per listing row, shown only when that row's `rental_term` is `medium_term` or `short_term` (the UI-level gate described above).

**`PropertyDetailView.jsx`**: when `property.rental_term` is `medium_term` or `short_term`, fetch and show the read-only `AvailabilityCalendar` in the sidebar (near the map card); not rendered for `long_term`.

## Build order

1. Backend model + migration `0005` → `alembic upgrade head`
2. `crud/availability.py`, `schemas/availability.py`, `routers/availability.py` → wire into `main.py`
3. `npm install react-day-picker`; `api.js` additions
4. `AvailabilityCalendar` shared component
5. `OwnerAvailabilityPage` + route + `OwnerDashboardPage` link
6. `PropertyDetailView` customer-facing integration
7. End-to-end verification

## Verification

- curl: owner creates a block on a `medium_term`/`short_term` listing; a second, overlapping block attempt gets 409; public `GET` returns it; owner deletes it and it's gone; a non-owner gets 403 on create/delete.
- A range spanning a month boundary (e.g. Jan 28 – Feb 3) stores and returns correctly.
- Frontend: confirm every new/changed file transforms cleanly through Vite (no browser access in this session, same limitation as prior features) — the visual calendar interaction itself is yours to click through.
