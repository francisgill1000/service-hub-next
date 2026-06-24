# Live Chat channel (in-app, parallel to WhatsApp)

**Date:** 2026-06-12 · **Approved by:** Francis (chat) — "go for 1", AI always replies, owner reply optional, both apps, deploy.

## Purpose

Stop relying on WhatsApp as the only chat channel. Customers in eloquent-bookings get a native
**Live Chat** with each shop, answered by the same AI agent that already powers WhatsApp
auto-replies (`ProcessWaReply` → Claude + per-shop persona). Shop owners see live-chat threads
in the same admin Chats inbox, alongside WhatsApp, and may reply manually (optional —
the AI always answers first). On the shop page the customer chooses **WhatsApp** or **Live Chat**.

## Approach (chosen: channel column on the existing pipeline)

One brain, one inbox. The WA tables/pipeline grow a `channel` discriminator instead of a
parallel `conversations` abstraction. A third channel later (IG DM, web widget) would justify
the bigger refactor; not now.

## Backend (separate repo `eloquent-backend`, deploys to api.eloquentservice.com)

**Migration** `add_channel_to_wa_chat_tables`:
- `wa_contacts`: `channel` varchar(8) default `'wa'`; nullable `shop_id`; nullable `device_id` varchar(64);
  `wa_account_id` and `wa_number` become nullable; index `(shop_id, channel, last_message_at)`,
  unique `(shop_id, device_id)` (app-channel identity).
- `wa_messages`: `wa_account_id` becomes nullable.

**Identity:** the customer app already sends `X-Device-Id` on every request. App-channel contact
= `(shop_id, device_id, channel='app')`. Logged-in customer's name/phone are attached to the
contact when available. No auth required (same guest-first model as favourites/booking).

**New customer endpoints** (public + `throttle`, `ChatController`):
- `POST /api/chat/shops/{shop}/messages` `{text}` → find/create app contact, `recordMessage('in')`,
  dispatch `ProcessWaReply`, return the stored message.
- `GET /api/chat/shops/{shop}/messages?since_id=` → thread for this device (empty if none).

**`ProcessWaReply`:** branches on `$contact->channel === 'app'`:
- shop comes from `contact->shop` (no `WaAccount` needed); persona via new
  `PersonaResolver::promptForShop(?Shop)` (shop persona or category default; never the
  onboarding tool); greeting/canned path unchanged; voice/media paths don't apply (text-only v1);
- reply is stored with `recordMessage('out', …)` only — no Graph API call, no 24h window.
- Same idempotency rule: any later outbound on the thread cancels the auto-reply.

**`WaChatController` (owner side):**
- `contacts()` returns WA contacts **plus** app contacts for the shop; works even with no
  WA account connected (`connected` keeps meaning "WA connected").
- `requireOwnedContact` accepts contacts owned via `shop_id` (app) as well as via account.
- `send()` on an app contact stores the outbound row only (no Graph call, no 24h limit).

## eloquent-bookings

- `lib/chat.ts`: `getShopMessages(shopId, sinceId?)`, `sendShopMessage(shopId, text)`.
- New page `ShopChat` (`/shops/:id/chat`): thread view in the existing customer style —
  4s polling (same pattern as admin ChatThread), bubbles (customer's `in` messages on the
  right), composer. Header shows shop name + "AI assistant · replies instantly".
- `ShopDetail`: a chat row with two options — **Live Chat** (→ `/shops/:id/chat`) and
  **WhatsApp** (`wa.me/<shop.phone>`, only when the shop has a phone).

## admin

- `WaContact` type gains `channel`; `wa_number` nullable.
- Chats list: renders when WA is not connected but app chats exist; **Live** badge on
  app-channel rows; WhatsApp rows unchanged. Search tolerates null number.
- ChatThread: subtitle "Live chat" for app contacts; the 24h-window error copy only applies
  to WA sends.

## Testing & deploy

- Backend: feature tests for customer endpoints (create/poll/auto-reply dispatch/throttle/device
  isolation), owner-side mixed inbox, app-channel send, ProcessWaReply app branch (no HTTP to
  Graph; reply row stored). Run full phpunit.
- SPAs: vitest for chat lib + screens; full suites + `tsc` builds.
- Deploy: backend → push `main`, droplet `git pull` + `php artisan migrate --force` +
  `optimize:clear`; SPAs → `deploy.ps1` each (tarball upload). Verify live with curl smoke test.

## Out of scope (v1)

Voice/media in live chat, websockets/SSE (polling is fine), customer-side chat list across
shops, merging a customer's WA + app history, read receipts.
