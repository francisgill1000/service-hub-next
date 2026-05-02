# Variable-Duration Bookings — Design

**Date:** 2026-04-30
**Status:** Awaiting user spec review

## Problem

Today every booking occupies exactly one 30-min slot, regardless of what services were selected. A 1-hour haircut and a 30-min beard trim both block only the slot the customer tapped, so a back-to-back booking can be created in the next 30-min cell that the longer service would actually still be running through. Shops can't sell services longer than 30 minutes without the schedule lying to them.

## Goals

- Each service in a shop's catalog has its own duration.
- A booking's total duration is the sum of the durations of its selected services.
- The booking blocks every 30-min cell its duration covers — no double-booking.
- Customers only see start times that the booking will actually fit into.
- Single-staff model preserved (one booking at a time per shop). Multi-staff explicitly out of scope.

## Non-goals

- Multiple concurrent bookings / staff or chair management.
- Customer-selected staff member.
- Per-service durations that vary by time of day or staff.
- Real-time tracking of overruns ("the 60-min cut is taking 75 min").
- Migration of historical bookings (none in production yet).

## Design

### 1. Schema changes

**`catalogs` table** — add `duration_minutes` (int, default 30, not null). Set by shop admin when creating or editing a service.

**`bookings` table** — add `duration_minutes` (int, default 30, not null). Snapshotted at booking creation time so later edits to a service's duration do not silently change historical bookings.

**`bookings` table** — drop the `unique(shop_id, date, start_time)` index. Same-start collisions are no longer the only conflict shape: e.g., booking A from 10:00–11:30 conflicts with booking B at 10:30 even though their start times differ. Conflict prevention moves to an application-level range overlap check.

### 2. Slot generation (snap to service-aware starts)

A new dedicated endpoint computes available start times given the customer's selected services:

```
GET /shops/{shop}/slots?date=YYYY-MM-DD&service_ids[]=1&service_ids[]=4
```

Returns: `{ "slots": ["09:00", "10:30", "12:00", ...], "duration_minutes": 90 }`.

The existing `ShopController::show` no longer embeds `slots` in its response — the frontend calls the slot endpoint after the customer picks services. (`shop.slots` is removed from the show payload.)

Rule:

1. Compute `D = sum(catalog.duration_minutes)` for the selected services. If `service_ids` is omitted or empty, `D = shop.slot_duration` (default 30, preserves walk-in flow).
2. Anchor at the shop's working-hour `start_time` for that day-of-week.
3. Candidate starts are `anchor + k * D` for `k = 0, 1, 2, …` while `anchor + k * D < working_hour.end_time`. The booking itself may end after `end_time` (A2 — overrun allowed).
4. A start is filtered out if `[start, start + D)` overlaps any existing booking on that date for that shop.

Example — shop open 9:00–17:00, no existing bookings:

| Service duration | Start times shown |
|---|---|
| 30 min | 9:00, 9:30, 10:00, … 16:30 (16 starts) |
| 60 min | 9:00, 10:00, 11:00, … 16:00 (8 starts) |
| 90 min | 9:00, 10:30, 12:00, 13:30, 15:00, 16:30 (6 starts; 16:30 ends 18:00 — overrun OK) |

### 3. Booking creation

`BookSlotRequest` accepts the existing `services` array (catalog IDs) plus `start_time` and `date`.

Server logic on `bookSlot`:

1. Look up the selected catalog rows; sum `duration_minutes` to get `D`. If empty, use `shop.slot_duration`.
2. Validate that `start_time` is on the snap grid: `(start_time - working_hour.start_time)` must be a non-negative integer multiple of `D`, and `start_time < working_hour.end_time`. Return `422` if not.
3. Compute `end_time = start_time + D minutes`.
4. Check no existing booking on `(shop_id, date)` overlaps `[start_time, end_time)`. If one does, return `409 Conflict` with a message like "This slot is no longer available."
5. Insert the booking with `start_time`, `end_time`, and the snapshotted `duration_minutes`.

### 4. Shop admin: catalog form

Adding/editing a service in the shop's catalog gets a `duration_minutes` input. Sensible presets: 15, 30, 45, 60, 90, 120. Default 30. Required field.

### 5. Calendar / list views

The shop-side calendar view ([BookingsCalendarView.jsx](frontend/src/components/Shop/Bookings/BookingsCalendarView.jsx)) renders each booking as a block spanning its full duration in 30-min cells, instead of a single fixed-height box. A 90-min booking visually occupies 3 cells.

Mobile shop bookings screen ([ShopBookingsScreen.js](mobile-app/src/screens/shop/ShopBookingsScreen.js)) shows the duration on the booking card.

### 6. Conflict on the create-booking path (shop side)

The shop's manual create-booking modal ([CreateBookingModal.jsx](frontend/src/components/Shop/CreateBookingModal.jsx)) uses the same slot endpoint, so it benefits from the same snap and overlap filtering automatically.

## Data flow

1. Customer opens a shop's booking screen. Frontend calls `GET /shops/{shop}` (no slots embedded).
2. Customer picks one or more services from the catalog (or none).
3. Frontend calls `GET /shops/{shop}/slots?date=…&service_ids[]=…` with the current selection.
4. Backend computes `D`, generates snap starts, filters for overlaps, returns the valid list and `duration_minutes`.
5. Customer picks a start time.
6. Frontend POSTs to `bookSlot` with the service IDs and chosen `start_time`.
7. Backend re-validates snap and overlap (defense against race), inserts booking, returns it.
8. Notification fires to the shop.

Whenever the customer adds or removes a service mid-flow, the frontend re-fetches the slot list — `D` has changed.

## Error handling

- `409 Conflict` — overlap detected at insert time (someone else booked between the slot fetch and the submit).
- `422 Unprocessable Entity` — invalid catalog IDs, `start_time` not on the snap grid, `start_time` past `working_hour.end_time`, or missing required fields.
- The frontend on `409` re-fetches the slot list so the customer picks again.

## Testing

- Unit: `Shop::getSlots` with combinations of `D = 30/60/90`, with and without existing bookings, anchored at non-trivial opening times.
- Unit: booking creation sums durations correctly, snapshots `duration_minutes`, computes correct `end_time`.
- Integration: overlap check rejects `[10:00, 11:30)` when a `[10:30, 11:00)` booking already exists.
- Integration: empty `services` array defaults to 30-min booking.
- Integration: a service that would overrun closing is allowed (A2).

## Out-of-scope follow-ups

- Multi-staff / multi-chair concurrent bookings.
- Customer-visible staff selection.
- Buffer/cleanup time between bookings.
- Service-specific working hours (e.g., "we only do hair color before 3 PM").
