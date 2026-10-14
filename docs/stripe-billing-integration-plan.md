# Rentis — Stripe Billing Integration (Pro / Business)

## Context

Phase 1 introduced plan entitlements (Free/Pro) as a toggle with no real billing. This phase wires real Stripe Billing to those tiers so the platform actually collects subscription fees from owners. Key decisions locked in before writing any code:

- **Plans in scope**: Free (no billing), Pro (max 10 listings, Connect allowed), Business (unlimited listings, Connect allowed). The old "Organization" placeholder is replaced by Business.
- **Connected accounts gated by plan**: only Pro and Business owners may set up a Stripe Connect account. Free owners cannot receive booking payments.
- **Fresh database**: the live DB will be replaced with a clean one using the same schema. Migrations create tables only — no seed rows. Migration `0014` (`0014_seed_vehicle_good_listings.py`) currently inserts demo vehicle/good listings and optionally creates a seed owner account — its `upgrade()` body must be emptied (keep the file and revision chain intact, just replace the body with `pass`) before running against the fresh DB. A separate admin seed script populates plan rows after migration (so `stripe_product_id` / `stripe_price_id` can be set from the real Stripe dashboard).
- **Trial**: 14-day free trial on Pro for every new owner. Stripe manages the trial; the platform just passes `trial_period_days=14` at subscription creation. Trial is one-time — tracked by a `has_used_trial` flag so it cannot be claimed again after a plan change.
- **Grace period**: 3 days after a failed payment before access is revoked. Stored as `grace_ends_at` (set when `invoice.payment_failed` fires); entitlement checks compare `utcnow()` against that column.
- **Downgrade / cancel**: all owner's non-archived listings are immediately archived the moment Stripe marks the subscription `canceled` or grace expires. No "until period end" grace on the listing cap.
- **Existing `POST /subscriptions/switch`** (instant, no payment): removed. Plan changes go through Stripe Checkout only.

---

## Two Stripe concepts — kept separate throughout

| | Stripe Connect | Stripe Billing |
|---|---|---|
| DB column | `users.stripe_account_id` (exists) | `users.stripe_customer_id` (new) |
| Stripe object | Express `Account` | `Customer` + `Subscription` |
| Purpose | Owner receives booking payouts | Platform charges owner monthly fee |
| Who can use it | Pro / Business only (`plan.allows_connect`) | Any owner upgrading from Free |
| Gated in | `routers/payments.py` Connect endpoints | `routers/subscriptions.py` + webhook |

---

## Schema changes

### Migration `0017` — add Stripe billing columns (no seed data)

**`plans` table — add:**
```
stripe_product_id   String(100)  nullable
stripe_price_id     String(100)  nullable
allows_connect      Boolean      not null  default false
```

**`users` table — add:**
```
stripe_customer_id  String(100)  nullable
```

**`owner_subscriptions` table — add:**
```
stripe_subscription_id       String(100)  nullable
stripe_subscription_item_id  String(100)  nullable
billing_status               String(20)   not null  default 'free'
trial_end                    DateTime     nullable
current_period_end           DateTime     nullable
cancel_at_period_end         Boolean      not null  default false
grace_ends_at                DateTime     nullable
has_used_trial               Boolean      not null  default false
```

`billing_status` values: `free` | `trialing` | `active` | `past_due` | `canceled`

`stripe_subscription_item_id` is stored separately from `stripe_subscription_id` because plan switches go through `stripe.SubscriptionItem.modify`, not the Subscription object directly.

`grace_ends_at` is set to `invoice.created + 3 days` when `invoice.payment_failed` fires. It is cleared (set to null) on `invoice.payment_succeeded`.

### Model updates

- `app/models/plan.py` — add `stripe_product_id`, `stripe_price_id`, `allows_connect`.
- `app/models/user.py` — add `stripe_customer_id`.
- `app/models/owner_subscription.py` — add all new billing columns.

---

## Entitlement logic (updated)

A single shared function in `crud/subscriptions.py`:

```python
def has_billing_access(subscription) -> bool:
    if subscription.billing_status == 'free':
        return True
    if subscription.billing_status in ('trialing', 'active'):
        return True
    if subscription.billing_status == 'past_due':
        return (
            subscription.grace_ends_at is not None
            and datetime.utcnow() <= subscription.grace_ends_at
        )
    return False  # canceled or unknown
```

`enforce_listing_quota` (`deps.py`) — calls `has_billing_access` first; 403 if false, then checks count vs cap as before.

`plan_allows_booking` (`crud/subscriptions.py`) — gates on `plan.allows_booking AND has_billing_access`.

New `enforce_connect_access` dependency (`deps.py`) — checks `plan.allows_connect AND has_billing_access`. Applied to Connect onboard and status endpoints.

---

## New file: `app/services/stripe_billing.py`

Pure Stripe API calls — no direct DB writes. Callers receive Stripe objects and write to DB themselves.

- `get_or_create_customer(db, user)` — checks `user.stripe_customer_id`; if None, calls `stripe.Customer.create(email, name)`, saves ID to user row, returns Customer.
- `create_checkout_session(db, user, plan, success_url, cancel_url)` — calls `get_or_create_customer`, then `stripe.checkout.Session.create` in `subscription` mode with `trial_period_days=14` when `not subscription.has_used_trial`. Returns the session URL.
- `switch_plan(stripe_subscription_item_id, new_price_id)` — calls `stripe.SubscriptionItem.modify` with `proration_behavior="always_invoice"`. Used for Pro ↔ Business switches via the portal.
- `cancel_subscription(stripe_subscription_id)` — calls `stripe.Subscription.delete` (immediate, not period-end). The webhook does the actual cleanup.
- `create_portal_session(stripe_customer_id, return_url)` — returns a Stripe Billing Portal URL for the owner to manage their card and download invoices.

---

## New file: `app/routers/webhooks.py`

Single endpoint: `POST /webhooks/stripe-billing` — no auth, signature verified with `stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)`. Returns 200 immediately for unrecognised event types.

Events handled:

| Event | Action |
|---|---|
| `customer.subscription.created` | Look up owner by `stripe_customer_id`. Store `stripe_subscription_id`, `stripe_subscription_item_id`, `billing_status`, `trial_end`, `current_period_end`. Set `has_used_trial=True`. |
| `customer.subscription.updated` | Sync `billing_status`, `current_period_end`, `cancel_at_period_end`, `trial_end`. If `status` changed to active plan that differs from current DB plan, sync plan too. |
| `customer.subscription.deleted` | Set `billing_status='canceled'`. Downgrade plan row to Free. Call `archive_owner_listings(db, owner_id)`. |
| `invoice.payment_succeeded` | Set `billing_status='active'`, clear `grace_ends_at`. |
| `invoice.payment_failed` | Set `billing_status='past_due'`, set `grace_ends_at = invoice.created + 3 days`. Create an in-app notification for the owner. |

All handlers share a helper `_find_subscription_by_customer(db, stripe_customer_id)` — returns the `OwnerSubscription` row or None (events for unknown customers are silently 200'd).

---

## Updated `app/routers/subscriptions.py`

**Remove:** `POST /subscriptions/switch`

**Add:**

- `POST /subscriptions/checkout` — owner-only. Payload: `{plan_code: str}`. Validates the plan has a `stripe_price_id` (Free plan does not — 400). Calls `stripe_billing.create_checkout_session`. Returns `{url: str}`. Frontend redirects to it.

- `POST /subscriptions/portal` — owner-only. Requires `billing_status != 'free'`. Calls `stripe_billing.create_portal_session`. Returns `{url: str}`.

- `POST /subscriptions/cancel` — owner-only. Only valid when `billing_status in ('active', 'trialing', 'past_due')`. Calls `stripe_billing.cancel_subscription`. Returns 200 — the actual status change happens via webhook.

**Keep:** `GET /subscriptions/mine`

---

## Updated `app/crud/subscriptions.py`

Add:
- `has_billing_access(subscription) -> bool` — as above.
- `archive_owner_listings(db, owner_id)` — sets `status=archived`, `archived_by_role='system'`, `archived_by_name='Subscription canceled'` on all non-archived listings for that owner. Called by the webhook on subscription deletion and by the grace-period expiry path.
- `sync_from_stripe(db, sub_row, stripe_sub)` — writes `billing_status`, `stripe_subscription_id`, `stripe_subscription_item_id`, `trial_end`, `current_period_end`, `cancel_at_period_end` from a Stripe Subscription object to the local row. Used by every webhook handler.

Update:
- `create_default(db, owner_id)` — sets `billing_status='free'`.
- `plan_allows_booking` — add `has_billing_access` gate.
- `serialize` — include `billing_status`, `trial_end`, `current_period_end`, `cancel_at_period_end`, `grace_ends_at`, `has_used_trial` in the returned dict.

---

## Updated `app/deps.py`

- `enforce_listing_quota` — call `has_billing_access` first; if false raise 403 before the count check.
- New `enforce_connect_access` — checks `subscription.plan.allows_connect AND has_billing_access(subscription)`. Returns the subscription on success; raises 403 otherwise.

---

## Updated `app/routers/payments.py`

Add `_: None = Depends(enforce_connect_access)` to:
- `POST /payments/connect/onboard`
- `GET /payments/connect/status`

Free owners hitting either endpoint get 403 "Connect accounts are available on Pro and Business plans."

---

## Seed script (not a migration)

`backend/scripts/seed_plans.py` — run once after `alembic upgrade head` against the fresh DB. Upserts by `code` so it is safe to re-run:

```
free:     max_active_listings=3,    allows_booking=false, allows_connect=false, stripe_product_id=null, stripe_price_id=null, sort_order=0
pro:      max_active_listings=10,   allows_booking=true,  allows_connect=true,  stripe_product_id='prod_...', stripe_price_id='price_...', sort_order=1
business: max_active_listings=null, allows_booking=true,  allows_connect=true,  stripe_product_id='prod_...', stripe_price_id='price_...', sort_order=2
```

Fill `stripe_product_id` and `stripe_price_id` after creating the Products and Prices in the Stripe dashboard (or via the Stripe CLI). Free plan has both as null — no billing object needed.

---

## Environment variables needed

```
STRIPE_SECRET_KEY=sk_test_...          # already present; switch to sk_live_ for prod
STRIPE_WEBHOOK_SECRET=whsec_...        # Stripe CLI gives this for local dev; dashboard for prod
FRONTEND_URL=http://localhost:5173     # used to build Checkout success/cancel redirect URLs
```

---

## Frontend changes

### `services/api.js`

- Remove `subscriptionsApi.switch`.
- Add `subscriptionsApi.checkout(planCode)` → `POST /subscriptions/checkout` → returns `{url}`.
- Add `subscriptionsApi.portal()` → `POST /subscriptions/portal` → returns `{url}`.
- Add `subscriptionsApi.cancel()` → `POST /subscriptions/cancel`.

### `PricingPage.jsx`

- Non-owners: show Free / Pro / Business cards with sign-up CTAs — unchanged.
- Owner on Free: "Start Pro (14-day free trial)" and "Upgrade to Business" buttons call `checkout(planCode)` then `window.location.href = url`.
- Owner on Pro or Business: show current plan badge + "Manage billing" button (calls `portal()`). No "Switch" button — plan changes go through the Stripe portal.
- Show trial callout on Pro card only when `!subscription.has_used_trial`.

### `OwnerDashboardPage.jsx` plan banner (update)

Extend the existing subscription info line to show:
- `billing_status` pill: green for `active`/`trialing`, yellow for `past_due` (with days-until-grace-expiry countdown), grey for `free`.
- "Manage billing →" link for Pro/Business owners (`billing_status != 'free'`) — calls `portal()` on click.
- `past_due` warning banner: "Payment failed — access expires in X days. Fix payment →" (link to portal).
- `canceled` warning: "Your subscription has been canceled. All your listings have been archived." with link to /pricing.

---

## Build order

1. **Gut `0014_seed_vehicle_good_listings.py`** — replace the `upgrade()` body with `pass` and the `downgrade()` body with `pass`. The revision chain (`0014` → `0013`) must stay intact; only the data-insertion statements are removed. Do this before touching the fresh DB.
2. **Migration `0017`** — add columns. Run `alembic upgrade head` against the fresh DB.
3. **Update models** — `Plan`, `User`, `OwnerSubscription`.
4. **`crud/subscriptions.py`** — add `has_billing_access`, `archive_owner_listings`, `sync_from_stripe`; update `create_default`, `plan_allows_booking`, `serialize`.
5. **`deps.py`** — update `enforce_listing_quota`; add `enforce_connect_access`.
6. **Create Products and Prices in Stripe dashboard** (test mode first). Run `seed_plans.py`.
7. **`services/stripe_billing.py`** — implement all wrappers. Test each in isolation against test keys.
8. **`routers/webhooks.py`** — implement. Run `stripe listen --forward-to localhost:8000/webhooks/stripe-billing` and test with `stripe trigger`.
9. **`routers/subscriptions.py`** — remove `switch`, add `checkout` / `portal` / `cancel`.
10. **`routers/payments.py`** — add `enforce_connect_access` to Connect endpoints.
11. **`main.py`** — register `webhooks` router.
12. **Frontend** — `api.js`, `PricingPage.jsx`, `OwnerDashboardPage.jsx`.
13. **End-to-end verification**.

---

## Verification (sandbox)

Use Stripe CLI and test card `4242 4242 4242 4242`. Run `stripe listen` before each step.

1. Sign up new owner → `GET /subscriptions/mine` → `billing_status='free'`, `plan.code='free'`.
2. Click "Start Pro" on Pricing page → Stripe Checkout opens in test mode → complete with test card → webhook fires `subscription.created` → `billing_status='trialing'`, `has_used_trial=true`, dashboard shows trial badge.
3. Create 10 listings (succeed) → 11th → 403 quota message.
4. Customer views listing → booking form visible (`owner_allows_booking=true`).
5. Run `stripe trigger invoice.payment_failed` → `billing_status='past_due'`, `grace_ends_at` set → dashboard shows warning with countdown.
6. Manually set `grace_ends_at` to a past timestamp (ask user to run query) → next request to create listing → 403 "subscription inactive".
7. Run `stripe trigger customer.subscription.deleted` → `billing_status='canceled'`, plan downgraded to Free, all listings archived automatically → owner dashboard shows empty listing tab and cancellation banner.
8. Free owner attempts Connect onboard → 403 "available on Pro and Business plans."
9. Owner upgrades to Pro again → `has_used_trial=true` → no trial, Stripe charges immediately after Checkout.
10. Upgrade from Pro to Business via billing portal → `subscription.updated` webhook → plan row updated to Business, listing cap lifted.
