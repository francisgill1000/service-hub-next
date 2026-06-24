# Ziina Payment Integration — Design

**Date:** 2026-06-18
**Status:** Approved, implementing

## Goal

Let customers pay a booking invoice online via Ziina, replacing the manual
`POST /invoice/{invoice}/mark-paid` step. Customer pays on Ziina's hosted page;
a Ziina **webhook** flips the invoice to `paid` automatically. Ship in **test
mode** first (no real charges).

## Decisions

- **Surface:** eloquent-bookings app — a *Pay now* button on the booking/invoice view.
- **Amount:** full invoice `total`, in AED.
- **Confirmation:** webhook is authoritative; redirect is UX only. Test mode first.
- **Account:** single platform-level Ziina account (one API key). Per-shop wallets
  are out of scope (future, mirroring `wa_accounts.token`).

## Existing context

- Invoices (`booking_invoices`) are created when a booking is marked `completed`
  (`BookingController::update`), with `total = booking.charges`, `status = issued`.
- `BookingInvoiceController::markPaid` already flips `issued → paid` + sets `paid_at`.
  The webhook reuses this transition (extracted into an idempotent path).

## Ziina API (verified from docs)

- Create: `POST https://api-v2.ziina.com/api/payment_intent`, Bearer token.
  - `amount` in fils (`round(total * 100)`), `currency_code: "AED"`,
    `success_url` / `cancel_url` / `failure_url`, `test` (bool), `operation_id` (UUID, idempotency), `message`.
  - Returns `id`, `redirect_url`, `status`.
- Retrieve: `GET /payment_intent/{id}` → `status` ∈
  `requires_payment_instrument | pending | requires_user_action | completed | failed | canceled`.
- Webhook: `POST /webhook` with `{ url, secret? }` registers (overwrites) the account webhook.
  - Events: `payment_intent.status.updated`, `refund.status.updated`.
  - Body: `{ event, data }`. If a secret was set, header `X-Hmac-Signature` =
    hex SHA-256 HMAC of the raw body.
  - Trusted source IPs: 3.29.184.186, 3.29.190.95, 20.233.47.127, 13.202.161.181.

## Components

### config/services.php — `ziina`
`api_key`, `webhook_secret`, `base_url` (default `https://api-v2.ziina.com/api`),
`test` (default true).

### Migration — `booking_invoices`
Add nullable: `ziina_intent_id` (string, indexed), `ziina_operation_id` (uuid).
Reuse existing `status` / `paid_at`.

### App\Services\Ziina
- `createIntent(BookingInvoice $invoice, array $urls): array`
- `getIntent(string $id): array`
- `registerWebhook(string $url, ?string $secret): array`

Wraps `Http::withToken(config('services.ziina.api_key'))`.

### Endpoints (routes/api.php)
- `POST /booking/{booking}/invoice/pay` → `BookingInvoiceController::pay`.
  Requires an `issued` invoice. Generates/reuses `ziina_operation_id`, creates (or
  reuses a still-pending) intent, stores `ziina_intent_id`, returns `{ redirect_url }`.
  success/cancel/failure URLs point to the customer app:
  `{APP_URL}/booking/{id}?pay=success|cancel|failed`.
- `POST /ziina/webhook` (public) → `ZiinaWebhookController::handle`.
  Verifies `X-Hmac-Signature` (when secret set). On `payment_intent.status.updated`
  + `data.status === completed`, finds invoice by `ziina_intent_id` and marks paid
  (idempotent — no-op if already `paid`). Always returns 200.

### Artisan — `ziina:register-webhook`
Calls `Ziina::registerWebhook(config app_url + /api/ziina/webhook, webhook_secret)`.
One-time setup; prints the result.

### eloquent-bookings — BookingView.tsx
- Fetch the invoice; if `status === issued`, show **Pay now** → `POST .../invoice/pay`
  → `window.location = redirect_url`.
- On return, read `?pay=` query param → show a success/cancelled/failed banner and
  re-fetch the invoice (already `paid` via webhook; falls back gracefully).

## Error handling

- `pay`: 409 if already paid/cancelled or no invoice; surfaces Ziina HTTP errors as 502.
- webhook: never throws to Ziina (try/catch, log, 200). Unknown intent id → log + 200.
- markPaid path guarded so duplicate/late webhooks are no-ops.

## Out of scope

Per-shop Ziina wallets, refunds, deposits/partial payments, tips.
