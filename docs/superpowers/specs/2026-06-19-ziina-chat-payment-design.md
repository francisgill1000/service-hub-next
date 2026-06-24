# Ziina Payment in the Bot Chat Flow — Design

**Date:** 2026-06-19
**Status:** Approved, implementing

## Goal

When the chat bot creates a booking (WhatsApp or in-app Live Chat), also return a
Ziina **payment link** so the customer can pay to confirm. Same pending-until-paid
model and same channel-agnostic webhook as the web flow. Dynamic pricing via the
Payment Intent API (per-booking amount, unique one-time link) — no static links.

## Reuses (no changes)

- `App\Services\Ziina::createIntent` / `getIntent` — payment intent API.
- `POST /api/ziina/webhook` — flips invoice to `paid` by `ziina_intent_id`,
  channel-agnostic, already live.
- Env / key / secret / `ZIINA_TEST` toggle. No new endpoint, env, or migration.

## Components

### 1. `Ziina::paymentLinkForBooking(Booking $booking): ?array`
New helper that centralises "ensure invoice + create intent → link":
- Loads/creates the `issued` invoice on demand from `booking.charges`.
- Returns `null` if the booking is cancelled, already paid, or the total is
  **under 2 AED** (Ziina minimum) — caller then skips payment.
- Generates `ziina_operation_id` (idempotency), calls `createIntent` with the
  same `success/cancel/failure` return URLs (`{return_base}/booking/{id}?pay=...`),
  stores `ziina_intent_id`, returns `['url' => redirect_url, 'intent_id' => id]`.

### 2. `BookingInvoiceController::pay` refactor
Replace its inline invoice+intent logic with a call to `paymentLinkForBooking`.
Behaviour on web is unchanged; the 2-AED/paid/cancelled cases map to the existing
HTTP responses.

### 3. `BookingTools::createBooking`
After creating the booking, call `paymentLinkForBooking`. If a link comes back,
add `payment_url` to the tool result. If `null` (e.g. price < 2 AED), omit it.

### 4. `create_booking` tool description
Instruct the bot: when the result includes `payment_url`, share it and tell the
customer payment confirms the booking (e.g. "You're booked, <ref>. Tap to pay and
confirm: <link>"). Keep the existing guardrail — never claim paid/confirmed until
the payment actually settles.

## Data flow

bot `create_booking` → booking + issued invoice + Ziina intent → `payment_url` in
result → bot sends link in chat → customer pays on Ziina hosted page → webhook →
invoice `paid` → booking confirmed (same as web).

## Channel rendering

- **WhatsApp:** URLs auto-render as tappable. No change.
- **In-app Live Chat:** verify the chat bubble renders URLs as clickable links;
  if it renders plain text, add minimal link auto-linking in the chat message
  component.

## Error handling

- `paymentLinkForBooking` returns `null` on any non-payable case; the bot path
  simply confirms without a link, and `Notify`/booking creation are unaffected.
- Ziina HTTP failure: helper logs and returns `null` (chat) / the controller maps
  to 502 (web). A booking is never lost because payment link generation failed.

## Out of scope

admin admin collection, gating notifications on payment, per-shop wallets,
embedded checkout. (Tracked in `docs/ziina-integration.md`.)
