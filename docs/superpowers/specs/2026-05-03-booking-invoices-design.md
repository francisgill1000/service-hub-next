# Booking Invoices — Design

**Date:** 2026-05-03
**Status:** Awaiting user spec review

## Problem

Shops currently mark bookings as "Completed" but have no formal record/document the customer can take away. We need a lightweight invoice generated automatically when a booking is completed, with a PDF for download, a status the shop can flip to "Paid", and a WhatsApp share path.

## Goals

- One invoice per completed booking, auto-generated when status flips to `Completed`.
- Shop-side UI on the booking action page: see invoice details, download PDF, mark paid, send via WhatsApp.
- PDF reflects shop info, booking reference, line items (one row per service), subtotal/total, status stamp.
- Idempotent: completing the same booking twice doesn't double-create.

## Non-goals

- VAT / tax (booked for Phase 2).
- Customer login or customer-side invoice access (Phase 2).
- Email delivery (WhatsApp only for Phase 1).
- Payment gateway / online payment (Phase 2).
- Editing invoices (you cancel the booking instead, which cancels the invoice).
- Multi-currency (AED only).

## Design

### 1. Schema — single new table

`booking_invoices`:

| Column | Type | Notes |
|---|---|---|
| `id` | bigint pk | |
| `booking_id` | bigint | FK to bookings, **unique** (one invoice per booking) |
| `invoice_number` | string | e.g. `INV-00042`. Globally unique. |
| `subtotal` | decimal(10,2) | snapshotted from `bookings.charges` at issue time |
| `total` | decimal(10,2) | == `subtotal` for Phase 1 (no VAT) |
| `status` | string | `issued` (default), `paid`, `cancelled` |
| `issued_at` | datetime | when generated |
| `paid_at` | datetime nullable | when shop marks paid |
| `created_at`, `updated_at` | timestamps | |

`invoice_number` formula: `INV-` + zero-padded `id` (5 digits). Same pattern as the existing `booking_reference` (`BK00042`).

### 2. Auto-generation on completion

In `BookingController::update`, when the new status is `completed` AND the previous status was `booked`:

```php
\App\Models\BookingInvoice::firstOrCreate(
    ['booking_id' => $booking->id],
    [
        'subtotal' => $booking->charges ?? 0,
        'total'    => $booking->charges ?? 0,
        'status'   => 'issued',
        'issued_at'=> now(),
    ]
);
```

`firstOrCreate` makes it idempotent. Cancelling the booking cascades to invoice via a separate trigger (next item).

### 3. Cancellation cascade

In `BookingController::update`, when the new status is `cancelled` AND an invoice exists for that booking:

```php
$booking->invoice?->update(['status' => 'cancelled']);
```

A cancelled invoice stays in the DB for audit but the PDF shows a "CANCELLED" stamp.

### 4. API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/booking/{booking}/invoice` | Returns invoice JSON for that booking |
| `GET` | `/api/booking/{booking}/invoice/pdf` | Returns PDF stream (Content-Type: application/pdf) |
| `POST` | `/api/invoice/{invoice}/mark-paid` | Flips status `issued` → `paid`, sets `paid_at = now()` |

The PDF endpoint is **public** (no auth) so the customer can open it from a WhatsApp link. To prevent enumeration, we use the `invoice_number` in the URL instead of the integer id, OR we keep the integer id but make invoice numbers non-sequential-looking. For Phase 1 simplicity, we use a numeric route `/booking/{booking}/invoice/pdf` keyed on the booking ID — the booking ID itself is the harder-to-guess token, and there's no sensitive billing info to protect at this scale.

(If we later need stronger access control, we can add a `share_token` column.)

### 5. PDF template

Blade view at `backend/resources/views/invoices/booking-invoice.blade.php`. Uses `barryvdh/laravel-dompdf` (already in composer). Layout:

```
┌──────────────────────────────────────────┐
│   {Shop Name}                            │
│   {Shop Address}                         │
│   {Shop WhatsApp / Phone}                │
│                                          │
│   INVOICE #INV-00042                     │
│   Issued: 03 May 2026                    │
│   Status: ISSUED | PAID | CANCELLED      │
│ ────────────────────────────────────────│
│   Bill to:                               │
│   {customer_name} · {customer_whatsapp}  │
│   Booking: BK00042 · 03 May 2026 10:00   │
│ ────────────────────────────────────────│
│   Service                          Price │
│   Haircut                       AED 50.00│
│   Beard trim                    AED 25.00│
│ ────────────────────────────────────────│
│                  Subtotal      AED 75.00 │
│                     Total      AED 75.00 │
│                                          │
│ {Status stamp: PAID / CANCELLED if any}  │
└──────────────────────────────────────────┘
```

When `status = paid`, show a green "PAID" stamp and the `paid_at` date. When `status = cancelled`, show a red "CANCELLED" stamp.

### 6. Frontend (shop-side)

On the booking action page (`frontend/src/app/shop/bookings/action/page.js`), below the existing Services section, add an **Invoice** section visible when the booking has an invoice (`bookingDetails.invoice` is present):

- Header: "Invoice {invoice_number}" + status pill
- Subtotal / Total summary
- Three buttons:
  - **Download PDF** → opens `/api/booking/{id}/invoice/pdf` in a new tab
  - **Mark as Paid** → POST to mark-paid endpoint, refresh booking (only when status='issued')
  - **Send via WhatsApp** → opens `https://wa.me/{customer_whatsapp}?text={pre-built message with PDF URL}` in a new tab (only when `customer_whatsapp` is set)

The booking's GET endpoint (`/api/booking/{id}`) is updated to eager-load the invoice relation so the frontend has the data without a second request.

### 7. Models

**`App\Models\BookingInvoice`** with:
- `$fillable` for all columns above
- `$casts`: `issued_at`, `paid_at` as datetime; `subtotal`, `total` as decimal:2
- Relationship: `belongsTo(Booking::class)`
- Boot hook to auto-generate `invoice_number` on creating: `INV` + 5-digit zero-padded id (using the same pattern as Booking)

**`App\Models\Booking`** gets a new `invoice()` hasOne relationship.

## Data flow

1. Shop opens a booked booking.
2. Shop clicks "Mark as Complete" → `PUT /api/booking/{id}` with `status: completed`.
3. Backend transitions status, calls `firstOrCreate` on `BookingInvoice` → invoice persisted with snapshotted total.
4. Frontend refreshes booking → invoice section now visible.
5. Shop clicks "Download PDF" → opens new tab, dompdf renders the invoice using the Blade template.
6. Shop clicks "Mark as Paid" → `POST /api/invoice/{id}/mark-paid` → status flips → frontend refreshes.
7. Optionally, shop clicks "Send via WhatsApp" → wa.me link opens with a message including the public invoice URL.

## Error handling

- `404` on PDF route if invoice doesn't exist for the booking.
- `409` on mark-paid if invoice is already paid or cancelled.
- `403` (deferred — Phase 1 has no auth on PDF route).

## Testing

- Unit: `BookingInvoice::generateInvoiceNumber()` produces `INV-` + zero-padded id.
- Feature: completing a booking creates exactly one invoice with correct snapshotted subtotal.
- Feature: completing the same booking twice is idempotent (no duplicate).
- Feature: cancelling a booking with an invoice flips invoice status to `cancelled`.
- Feature: `GET /api/booking/{id}/invoice/pdf` returns a 200 with `application/pdf` content type.
- Feature: `POST /api/invoice/{id}/mark-paid` sets status and `paid_at`.

## Out-of-scope follow-ups

- VAT support (per-shop toggle + line-item breakdown).
- Customer-side invoice viewing (customer app shows their invoices).
- Email delivery.
- Payment gateway integration (Stripe / local UAE gateway).
- Per-shop sequential invoice numbering for accounting cleanliness.
- Editable invoices (currently immutable except for status).
- Bulk reminders / overdue tracking.
