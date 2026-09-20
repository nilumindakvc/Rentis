# Real-Time Messaging (Conversations)

## Context

Stage 1's `inquiries` table was a one-shot contact form: a customer sends one message, the owner can only flip a status flag — no reply, no thread. With JWT auth now in place (identity can't be spoofed), this plan replaces it with real two-way messaging: persisted conversation threads, delivered live over a WebSocket while both sides are online, falling back to the existing notification/polling system when they're not.

Confirmed approach (from prior discussion): **REST for persistence, WebSocket purely for push** — sending a message is always a normal authenticated `POST`, and the socket only ever delivers `{"type": "new_message", ...}` events to whoever's connected. Single container, in-memory connection registry (`user_id → set of sockets`) — no Redis; this is the documented scaling limit if the app ever runs more than one backend process.

**`inquiries` is fully retired, not kept alongside.** A customer's first message becomes the first row in a `conversations`/`messages` pair rather than a separate concept — this touches every place `inquiries` currently appears (models, crud, router, schemas, seed data, owner stats, both dashboards, the property detail contact form). Since this is dev-stage data, the migration just drops the old table rather than migrating rows.

**Simplification**: conversations drop the old New/Contacted/Closed status. A chat doesn't really have a single status — instead, the conversation list sorts by most-recent-message and shows an unread badge per conversation, the standard pattern for any chat UI (WhatsApp/Messenger-style), which is also simpler to reason about than tri-state status juggling.

**Redis considered and deferred**: Redis pub/sub is the standard way to make the WebSocket layer scale past one process (every process keeps its own local socket dict; Redis just fans "user X has a new message" out to every process, which delivers locally if it holds that user's socket). Explicitly deferred since the app runs on a single container — the in-memory `ConnectionManager` covers that case with zero extra infra, and adding Redis later is a contained change to `ws_manager.py` alone, not a rewrite of anything else.

## Backend

**New tables** (`app/models/conversation.py`, `app/models/message.py`):
- `conversations`: `id`, `property_id` FK→properties (CASCADE), `owner_id`/`customer_id` FK→users, unique on `(property_id, owner_id, customer_id)` so re-contacting the same listing continues the same thread, `created_at`, `updated_at` (bumped on every new message, drives list ordering).
- `messages`: `id`, `conversation_id` FK→conversations (CASCADE), `sender_id` FK→users, `body` (text), `read_at` (nullable — unread = `read_at IS NULL AND sender_id != me`), `created_at`.

**Migration `0003`**: create both tables → `ALTER TYPE notification_type ADD VALUE 'new_message'` (safe in the same transaction since nothing *uses* the value until a later, separate transaction) → add `notifications.related_conversation_id` FK → drop `notifications.related_inquiry_id` → drop `inquiries` table → drop `inquiry_status` enum. (Order matters: conversations must exist before the FK is added; the inquiry FK/table must go before the enum type it depends on nothing else does.)

**Retire inquiries**: delete `app/models/inquiry.py`, `app/crud/inquiries.py`, `app/routers/inquiries.py`, `app/schemas/inquiry.py`; remove `InquiryStatus` from `app/models/enums.py`; remove `User.inquiries`/`Property.inquiries` relationships (replace the latter with `Property.conversations`).

**`app/crud/conversations.py`**: `get_or_create(db, property_id, customer_id)` (looks up the property to derive `owner_id` server-side — same trust model as the old `create_inquiry`, never client-supplied), `create_message(db, conversation, sender_id, body)` (inserts + touches `conversation.updated_at`), `list_for_user(db, user_id)` (conversations where the user is owner or customer, `selectinload`ed messages — collection load, so `selectinload` not `joinedload` — used in Python to derive `last_message`/`unread_count` per conversation; fine at this scale, same pragmatic trade-off as the in-memory WS registry), `list_messages(db, conversation_id, before_id, limit)` (id-cursor pagination, newest-first internally then reversed for chronological display), `mark_read(db, conversation_id, user_id)`, `is_participant(conversation, user_id)`.

**`app/ws_manager.py`**: `ConnectionManager` holding `dict[user_id, set[WebSocket]]` — `connect`/`disconnect`/`send_to_user(user_id, payload)` (drops dead sockets on send failure). Module-level singleton instance, imported wherever a push needs to fire.

**`app/routers/ws.py`**: `@router.websocket("/ws/messages")`. Browsers can't set custom headers on a WS handshake, so the access token comes in as `?token=...` on the URL and is verified with the exact same `decode_token()` used everywhere else. Accept → register in the manager → loop on `receive_text()` purely to detect disconnect (client never sends real data over this socket) → `WebSocketDisconnect` deregisters.

**`app/routers/conversations.py`**:
- `POST /conversations` (customer-only) — get-or-create + first message + owner notification + WS push. `async def` (the two endpoints that push need to `await manager.send_to_user(...)`; the rest of the app's sync-`def`/threadpool pattern is unaffected — FastAPI supports both styles side by side).
- `GET /conversations` (any logged-in user) — their conversation list, newest-activity first.
- `GET /conversations/{id}/messages` — paginated history; 403 if not a participant.
- `POST /conversations/{id}/messages` (`async def`, same reason as above) — persist, notify + WS-push the *other* participant.
- `PATCH /conversations/{id}/read` — bulk-marks the other side's messages read; called when a thread is opened.

**Notifications**: `NotificationType.new_message` replaces `new_inquiry` going forward; `related_conversation_id` replaces `related_inquiry_id` in the model/schema.

**Owner stats** (`crud/owner_stats.py`): swap the Inquiry-status breakdown for `total_conversations` + `unread_messages` (messages across the owner's conversations where they're not the sender and `read_at IS NULL`).

**`crud/properties.py`**: the per-listing inquiry count in `get_owner_properties` switches from counting `Inquiry` rows to counting `Conversation` rows (same "how many people reached out about this listing" meaning).

**`scripts/seed_demo_data.py`**: swap the `create_inquiry` calls for `get_or_create` + `create_message`, seeding a couple of short back-and-forth exchanges (not just one message) so the chat UI has something real to render.

## Frontend

**`services/ws.js`** — a small singleton: `connectSocket()` (reads the current access token, opens `wss://.../ws/messages?token=...`, no-ops if already open/no token), `disconnectSocket()`, `onSocketEvent(callback)` (pub/sub for incoming `{type, conversation_id, message}` frames). Auto-reconnects with a flat retry delay on close.

**`context/AuthContext.jsx`**: calls `connectSocket()` after login/signup and on mount if a session was restored; `disconnectSocket()` on logout and on the existing `rentis:auth-expired` event.

**`services/api.js`**: `conversationsApi` (`start`, `list`, `messages`, `send`, `markRead`) replaces `inquiriesApi`.

**New `components/messages/`**: `ConversationList.jsx` (other-party name, property title, last-message preview, relative time, unread badge) and `MessageThread.jsx` (loads history, renders bubbles aligned by `sender_id === me`, a send box, marks the thread read on open, appends live messages from `onSocketEvent` filtered to its own `conversation_id`).

**New `pages/MessagesPage.jsx`** at route `/messages/:id?` (`App.jsx`, `ProtectedRoute` with no `role` — either side can use it) — list + thread, list-only on narrow screens until a thread is selected (standard responsive chat layout).

**`components/property/ContactOwnerForm.jsx`** replaces `InquiryForm.jsx` — same customer-only gating, but on submit calls `conversationsApi.start(...)` and navigates straight into `/messages/{id}` instead of showing an inline "sent" message.

**`NotificationBell.jsx`**: subscribes to `onSocketEvent` to refresh the unread count instantly instead of waiting for the next 30s poll; clicking a `new_message` notification navigates to its `related_conversation_id`.

**Dashboards**: `CustomerDashboardPage.jsx` and `OwnerDashboardPage.jsx` drop their `InquiriesTab`s (Messages is now its own page, linked from `NavBar`); `OwnerDashboardPage`'s stat tiles swap to `total_conversations`/`unread_messages`, and the per-listing table's "Inquiries" column now reflects conversation count.

## Build order

1. Backend models + migration `0003` (create conversations/messages, retire inquiries) → `alembic upgrade head`
2. `crud/conversations.py`, `ws_manager.py`, `routers/ws.py`, `routers/conversations.py`; retire the inquiry files; wire both new routers into `main.py`
3. Update `notifications`/`owner_stats`/`properties` crud + schemas for the new model; update `seed_demo_data.py` and reseed with `--reset`
4. Frontend: `ws.js`, `AuthContext.jsx` socket wiring, `api.js` `conversationsApi`
5. `ConversationList`, `MessageThread`, `MessagesPage`, route in `App.jsx`
6. `ContactOwnerForm` (replacing `InquiryForm`), `NotificationBell` live-refresh + navigation, dashboard cleanup
7. End-to-end verification

## Verification

- `alembic upgrade head`, reseed demo data; confirm via `psql` that `conversations`/`messages` are populated and `inquiries` is gone.
- curl/Swagger: `POST /conversations` as a customer creates a conversation + first message + a notification for the owner; `GET /conversations` for both users shows it; `POST /conversations/{id}/messages` as the owner replies; a non-participant gets 403 on both message endpoints.
- WebSocket: connect two sessions (owner + customer, e.g. two browser profiles), send a message as one, confirm the other receives a live `new_message` push (network tab / WS frame inspector) without refreshing, and that the notification bell count updates immediately rather than on the next poll.
- Confirm a dropped connection (e.g. backend restart) reconnects on its own within a few seconds and delivery resumes.
- Full user journey: customer messages an owner from a property page → lands in the thread → owner replies from their dashboard's Messages link → conversation list on both sides reorders to the top and shows correct unread state as each side opens/reads it.
