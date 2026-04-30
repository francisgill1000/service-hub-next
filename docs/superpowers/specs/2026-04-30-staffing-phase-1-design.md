# Staffing — Phase 1 (Auto-Assign + Queue) Design

**Date:** 2026-04-30
**Status:** Awaiting user spec review

## Problem

Bookings today are owned by the shop, not by any individual staff member. There's no way to track "Sara is doing the 10:00 booking" or to allow multiple bookings at the same time when the shop has multiple chairs/stylists. Shops with several staff have to mentally fan out the schedule themselves.

## Goals

- Shop admin can create, list, edit and deactivate staff members.
- Every booking gets assigned to a specific staff (or queued if none free).
- Multiple bookings at the same `start_time` are allowed, one per active staff.
- Auto-assignment picks the staff with the fewest bookings today (load balanced).
- Bookings that find no free staff at creation are saved as **queued** and become assignable as staff free up.
- Admin can manually override an assignment from the booking calendar.

## Non-goals

- Per-staff working hours / days off (Phase 2).
- Customer picking a preferred staff (Phase 3).
- Service-staff capability matrix — every staff can do every service (Phase 3).
- Staff login (Phase 3).
- Variable-duration bookings — bookings remain a single 30-min slot in this phase.

## Design

### 1. Schema changes

**New table `staff`:**

| Column | Type | Notes |
|---|---|---|
| `id` | bigint pk | |
| `shop_id` | bigint | FK to `shops`, indexed |
| `name` | string | Required |
| `is_active` | boolean | default true. Inactive = excluded from auto-assign and queue sweep. |
| `created_at`, `updated_at` | timestamps | |

**`bookings` table:**

- Add `staff_id` (bigint, nullable, FK to `staff`).
- Extend `status` with new value `queued`. Existing values continue to work.
- Drop the existing `unique(shop_id, date, start_time)` index.
- Add `unique(staff_id, date, start_time)` — prevents the same staff being double-booked for the same slot. `staff_id = null` (queued) is exempt because MySQL/Postgres treat NULLs as distinct in unique indexes; this is the desired behavior.

### 2. Auto-assignment algorithm

When a booking is created via `bookSlot`:

1. Load active staff for `shop_id`.
2. Filter to those who do **not** already have a booking on `(date, start_time)`.
3. If the filtered set is non-empty, sort by `(today's booking count ASC, id ASC)` and pick the first. Save booking with that `staff_id` and `status = booked`.
4. If empty, save with `staff_id = null` and `status = queued`.

"Today's booking count" = number of bookings that staff has on the same `date` as the new booking, excluding `status = cancelled`. If two staff are tied, lower `id` wins (first-created admin staff is the consistent fallback).

If no active staff exist at all for the shop, the booking is queued. (Edge case: a shop just signed up and hasn't added staff yet.)

### 3. Queue sweep — when a staff becomes free

The sweep runs **synchronously** within the same DB transaction as the event that freed the staff (cancel / delete / reassign / activate). This keeps the queue and assigned bookings consistent and avoids "queue invisible for a few seconds" gaps.

A staff becomes "newly free" for `(date, start_time)` when any of these happen:

- A booking on that staff/date/start_time is **cancelled**.
- A booking on that staff/date/start_time is **deleted**.
- A booking is **reassigned** to a different staff (the source staff frees up).
- A new staff is **activated** (added or `is_active` flipped to true) — they're free for every slot they don't already have.

After any of these events, run the sweep:

1. Find queued bookings on the same `shop_id` whose `(date, start_time)` matches a slot the now-free staff has open.
2. Order by `created_at ASC` (FIFO).
3. For each, run the same auto-assign algorithm. If it finds a staff, assign and flip status to `booked`. (Usually it finds the freed staff, but the algorithm runs full so load-balancing still applies if multiple staff are free.)
4. Notify the shop on each promotion (reuses `Notify::push`).

Stale queued bookings whose `start_time` has passed stay in the queue. They never auto-cancel — admin must close them manually. (User's explicit choice.)

### 4. Admin override

The shop calendar / booking detail view gets a **"Reassign staff"** action. Admin picks any active staff from a dropdown. The reassign endpoint:

1. Validates the target staff has no booking at the same `(date, start_time)`.
2. Updates `staff_id`. Records who was the previous staff in memory only (no audit log this phase).
3. Triggers the queue sweep for the source (vacated) staff.

### 5. Admin UIs

**Staff management page** (web shop dashboard, also mobile shop screen):
- List of staff for the shop with active toggle.
- Add/edit form: just `name` and `is_active`.
- Deactivating a staff does not retro-unassign their existing bookings; it only excludes them from future auto-assignment and queue sweeps.

**Calendar view** ([BookingsCalendarView.jsx](frontend/src/components/Shop/Bookings/BookingsCalendarView.jsx)):
- Day view groups bookings by staff (column per staff). With many staff, columns scroll horizontally.
- Each booking card shows the staff name.

**Queue list** (new tab or section under Bookings):
- Lists queued bookings (those with `staff_id = null, status = queued`) ordered by `created_at`.
- Each row: customer name, services, requested date/time, "Manually assign" action (same dropdown as override).

**Mobile shop bookings screen** ([ShopBookingsScreen.js](mobile-app/src/screens/shop/ShopBookingsScreen.js)):
- Filter dropdown: "All staff" or a specific staff.
- Booking card shows staff name.

### 6. Customer-side changes

None. Customer flow is unchanged — they pick a slot, the system handles staff assignment behind the scenes. If the customer's booking ends up queued, the customer-facing booking confirmation should say "Your booking is being processed — you'll get confirmation shortly" (status badge), and switch to confirmed once promoted.

## Data flow

**Happy path (free staff exists):**
1. Customer books 10:00.
2. `bookSlot`: 4 active staff, 1 already booked at 10:00 → 3 candidates → fewest-today wins → booking saved with that `staff_id`, `status = booked`.

**Queued path (all staff busy at 10:00):**
1. Customer books 10:00.
2. All 4 staff already have a 10:00 booking → no candidate → booking saved with `staff_id = null, status = queued`.
3. Customer sees "queued / waiting for confirmation".
4. Admin sees it in the Queue tab.

**Promotion (existing booking cancelled):**
1. Admin cancels Ali's 10:00 booking.
2. Sweep runs: finds the queued 10:00 booking → re-runs auto-assign → Ali (or whoever is now free with fewest today) gets it → status becomes `booked`.
3. Shop gets a push notification.

**Override:**
1. Admin reassigns a 10:00 booking from Ali → Sara.
2. Sara has no 10:00 booking → assignment succeeds.
3. Sweep runs (Ali now free at 10:00) → if any queued booking matches, promote.

## Error handling

- `409 Conflict` on reassign — target staff already booked at that slot.
- `422 Unprocessable Entity` on staff create/edit — missing or duplicate name.
- `404` on staff that doesn't belong to the requesting shop.
- Queue sweep is best-effort: if the sweep fails to assign (e.g., the freed staff was deactivated mid-flight), it logs and moves on.

## Testing

- Unit: auto-assign picks correct staff under various tie / load conditions.
- Unit: auto-assign returns `null` (queue) when all staff busy.
- Unit: tie-breaker by id when today's counts equal.
- Integration: cancelling a booking promotes the oldest matching queued booking.
- Integration: reassign vacates the source staff and triggers a promotion.
- Integration: deactivating a staff does not break their existing bookings but excludes them from new assignment.
- Integration: shop with zero active staff queues every new booking.

## Migration

- New `staff` table.
- New `bookings.staff_id` column (nullable). Existing bookings stay with `staff_id = null` and `status` unchanged. They're treated as legacy / pre-staffing and will not be auto-promoted.
- Drop old unique index, add new one. Run during a low-traffic window — both indexes touch `bookings`.

## Out-of-scope follow-ups

- Per-staff working hours and leave.
- Customer-visible staff selection.
- Service-staff capability matrix.
- Staff app login.
- Audit log of reassignments.
- Auto-cancellation of stale queued bookings.
- Per-staff statistics dashboard (revenue / bookings handled).
