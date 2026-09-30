# Rentis — Stripe Connect Payments (test mode)

## Context

Once a booking is accepted, there's currently no way for the customer to actually pay, and no way for money to reach the owner rather than just Rentis. This plan implements the three-part architecture already agreed on: **Stripe Connect Express** accounts so owners can receive funds, a **Stripe Checkout** destination charge so the customer pays without us touching card data, and a **webhook** as the source of truth for confirming payment — all in Stripe test mode.

Confirmed decisions:
- **Amount**: flat `min_price` per booking, regardless of the date range (not multiplied by days) — captured once at booking-request time and stored on the `Booking` row, so a later price edit on the listing never retroactively changes what was already quoted.
- **No platform commission yet** — the full amount routes to the owner (`application_fee_amount` omitted). This is a one-parameter addition later when Stage 3's paid commission feature is built; not needed now.
- **Express connected accounts** for owners (Stripe-hosted onboarding, minimal compliance burden on us) — not Standard (owner would need their own full account) or Custom (we'd build the onboarding form ourselves).
- **Checkout Session (hosted)**, not Stripe Elements embedded in our own pages — no card data or Stripe.js touches our frontend at all; we just redirect the browser to a URL Stripe gives us and back.
- A webhook (`checkout.session.completed`) is what actually marks a booking paid — never trust the browser redirect alone, since a closed tab or network hiccup shouldn't be how "paid" gets decided.

**What I need from you before I can verify this end-to-end**: your Stripe **test** publishable key, secret key, and (once the endpoint exists) a webhook signing secret from either the Stripe CLI (`stripe listen --forward-to localhost:8000/webhooks/stripe`, recommended for local dev) or a dashboard-configured endpoint. I'll build and wire everything regardless; live verification of the Connect/Checkout calls needs your secret key in `backend/.env`, and full webhook-triggered verification needs the CLI running (or you can trigger the `account.updated`/`checkout.session.completed` flow manually and I'll confirm the booking updates correctly).

## Backend

**Schema**:
- `bookings` gains: `amount` (Numeric, copied from `property.min_price` at request time), `currency` (copied from `property.price_currency`), `payment_status` (`payment_status` enum: `unpaid`/`paid`), `stripe_checkout_session_id`, `stripe_payment_intent_id` (both nullable str).
- `users` gains: `stripe_account_id` (nullable str), `stripe_payouts_enabled` (bool, default `false`) — only ever populated for owners.
- `NotificationType` gains `booking_paid` (same `ALTER TYPE ... ADD VALUE` approach used for every prior addition to this enum).

**Migration `0007`**: the two enums/columns above, plus the notification type addition.

**`app/config.py`**: `stripe_secret_key`, `stripe_publishable_key`, `stripe_webhook_secret`. Added to `.env`/`.env.example` (values left blank in `.env.example`; you provide the real test keys in `backend/.env`, same pattern as Cloudinary/JWT).

**`app/stripe_client.py`** (new, mirrors `app/cloudinary_client.py`): sets `stripe.api_key = settings.stripe_secret_key` at import time.

**`app/crud/payments.py`** (new):
- `get_or_create_connect_account(db, owner)` — creates a `type="express"` Stripe account on first call, persists `stripe_account_id` on the `User` row, reuses it after.
- `create_account_link(account_id, return_url, refresh_url)` — one Stripe API call, returns the hosted onboarding URL.
- `sync_account_status(db, user, stripe_account)` — updates `stripe_payouts_enabled` from a Stripe Account object's `payouts_enabled` field.

**`app/crud/bookings.py`**: `create_booking` additionally sets `amount=prop.min_price`, `currency=prop.price_currency`, `payment_status=unpaid`. New `mark_checkout_started(db, booking, session_id)`, `mark_paid(db, booking, payment_intent_id)`.

**`app/routers/payments.py`** (new):
- `POST /payments/connect/onboard` (owner-only) — get-or-create the connected account, create an Account Link, return `{url}`.
- `GET /payments/connect/status` (owner-only) — `{connected, payouts_enabled}`.
- `POST /webhooks/stripe` (public, no JWT — authenticated instead by Stripe's signature header via `stripe_webhook_secret`, reading the **raw** request body since signature verification needs the exact bytes Stripe sent) — handles `checkout.session.completed` (look up the booking by `stripe_checkout_session_id`, `mark_paid`, notify+push the owner with `booking_paid`) and `account.updated` (look up the user by `stripe_account_id`, `sync_account_status`).

**`app/routers/bookings.py`** gains `POST /bookings/{id}/checkout` (customer-only, must own the booking; 400 if `status != accepted` or already `paid`; 400 if the owner hasn't finished Connect onboarding yet) — creates a Checkout Session (`line_items` built from `booking.amount`/`currency`, `payment_intent_data.transfer_data.destination = owner.stripe_account_id`, `success_url`/`cancel_url` pointing back at the customer dashboard's bookings tab), stores the session id via `mark_checkout_started`, returns `{url}`.

`app/main.py` registers `payments.router`.

## Frontend

**`services/api.js`**: new `paymentsApi` (`connectOnboard`, `connectStatus`) and a `checkout(bookingId)` added to the existing `bookingsApi`.

**`OwnerDashboardPage.jsx`**: third tab, **Payouts** — shows connection status (`GET /payments/connect/status`), a "Connect payout account" button when not connected (calls `connectOnboard`, then `window.location.href = url`), and a "Refresh status" action for after returning from Stripe's onboarding flow.

**`CustomerDashboardPage.jsx`**'s existing "My Bookings" tab: an `accepted` + `unpaid` booking gets a **Pay now** button (calls `bookingsApi.checkout(id)`, redirects via `window.location.href`); a `paid` booking shows a "Paid" badge instead. Stripe's `success_url`/`cancel_url` land back on `/customer/dashboard?tab=bookings` (the tab-routing already built for notification deep-links covers this for free).

## Build order

1. You add Stripe test keys to `backend/.env`; I add the config fields + `.env.example` placeholders
2. `pip install stripe`; migration `0007` → `alembic upgrade head`
3. `stripe_client.py`, `crud/payments.py`, `crud/bookings.py` additions, `routers/payments.py`, the new `bookings.py` checkout endpoint → wire into `main.py`
4. `api.js` additions
5. Owner Payouts tab, customer Pay-now button
6. Verification

## Verification

- Backend-only (no webhook needed): owner hits connect/onboard, gets a real Stripe-hosted onboarding URL; completing it with Stripe's test-mode fake data (auto-fillable in test mode) and returning shows `payouts_enabled` once synced.
- Customer hits checkout on an accepted booking they weren't the owner of another's → 403; on a still-`pending` booking → 400; on an owner without completed Connect onboarding → 400.
- Successful checkout with Stripe's test card `4242 4242 4242 4242` → webhook fires `checkout.session.completed` → booking flips to `payment_status=paid`, owner gets a `booking_paid` notification + live WS push (same mechanism already proven for messaging/bookings).
- Confirm the webhook endpoint rejects a request with a missing/invalid Stripe-Signature header (proves we're not blindly trusting unsigned POSTs to a public endpoint).
- Frontend: confirm every new/changed file transforms cleanly through Vite; the actual redirect-to-Stripe-and-back click-through is yours to run, same limitation as every prior feature (no browser access in this session).
