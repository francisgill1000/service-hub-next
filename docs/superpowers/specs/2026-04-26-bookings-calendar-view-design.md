# Bookings Calendar View — Design Spec

**Date:** 2026-04-26
**Surface:** Frontend, shop-owner dashboard
**Page touched:** `frontend/src/app/shop/bookings/page.js`

## Goal

Add a Calendar view to the shop-owner Bookings page so owners can see appointment load at a glance (Month / Week / Day), triage bookings in-place, and quickly add walk-ins by clicking empty time slots. The existing list/table view remains and is selectable via a List ↔ Calendar toggle.

## Decisions (from brainstorming)

| # | Decision |
|---|----------|
| Q1 | Add a **List / Calendar toggle**; both views share the same filters. |
| Q2 | Calendar supports **Month + Week + Day** sub-views. |
| Q3 | Clicking a booking opens a **quick-action modal** (status change + link to full action page). |
| Q4 | Empty Week/Day time slots are **clickable** and open the existing `CreateBookingModal` pre-filled with date/time. |
| Q5 | **No drag-and-drop** for v1. Reschedule via the action page. |
| Tech | **Build views from scratch with `date-fns`** (already a dependency). No new calendar library. |

## File structure

```
src/app/shop/bookings/page.js                                  (orchestrator: state, filters, view toggle)
src/components/Shop/Bookings/
  ├─ BookingsListView.jsx                                       (existing table + mobile cards, extracted)
  ├─ BookingsCalendarView.jsx                                   (calendar shell: toolbar, sub-view switch, cursor)
  ├─ BookingQuickActionModal.jsx                                (NEW — quick-action modal)
  └─ calendar/
      ├─ MonthGrid.jsx                                          (6×7 month grid)
      ├─ WeekGrid.jsx                                           (7-col × hours time grid)
      ├─ DayGrid.jsx                                            (1-col × hours time grid)
      └─ utils.js                                                (date helpers, booking-by-date grouping)
src/components/Shop/CreateBookingModal.jsx                      (extend: + initialDate, + initialSlot props)
```

## Page-level state

```js
// src/app/shop/bookings/page.js
const [viewMode, setViewMode] = useState('list');                  // 'list' | 'calendar' (persisted)
const [bookings, setBookings] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [selectedStatus, setSelectedStatus] = useState(null);
const [dateFrom, setDateFrom] = useState('');                       // disabled in calendar mode
const [dateTo, setDateTo] = useState('');                           // disabled in calendar mode
```

**View-mode toggle UI** — segmented control beside the "New booking" button:

```
[ List ]  [ Calendar ]      …       [+ New booking]
```

**Persistence (localStorage):**
- `rezzy.bookings.viewMode` → `list` (default) | `calendar`
- `rezzy.bookings.calendarSubView` → `month` (default) | `week` | `day`

**Filter behavior:**
- Search and status filter apply to both views.
- Date-range filter is **hidden / disabled in calendar mode** — calendar nav (prev/next/today) replaces it. This avoids the confusing case where the cursor moves to a month outside the date-range and the grid looks empty.
- The same `filteredBookings` array is computed in the page and passed to both views.

## Component contracts

### `<BookingsCalendarView bookings shopId onCreated onUpdated />`

Internal state:
- `subView` — `'month' | 'week' | 'day'`
- `cursorDate` — `Date` (the focal date the grid renders around)
- `quickActionBooking` — booking object | null
- `createSlot` — `{ date: 'YYYY-MM-DD', time: 'HH:MM' | null } | null`

Renders: toolbar (sub-view switch + prev/today/next + cursor label) + active grid + the two modals.

**Toolbar layout:**
```
[ ‹ ] [ Today ] [ › ]   April 2026                [ Month ] [ Week ] [ Day ]
```

### `<MonthGrid cursorDate bookings onBookingClick onMoreClick />`

- 6 rows × 7 cols of dates around `cursorDate` (Sunday-start; week-start configurable later).
- Each cell: date label + up to **3 chips** (status-coloured dot + customer initial / time) + `+N more` link if overflow.
- Today highlighted with `#adc6ff` border.
- Clicking `+N more` calls `onMoreClick(date)` → parent switches to Day view for that date.
- Empty cells **not** clickable in Month view (no time precision).

### `<WeekGrid cursorDate bookings onBookingClick onSlotClick />`

- 7 columns (Mon-Sun based on `startOfWeek(cursorDate)`).
- Hour rows from **06:00 to 23:00** (v1 fixed range; can later read shop's working_hours).
- Each row = 1 hour, height ~48 px.
- Bookings rendered as **absolute-positioned blocks** inside their day column based on `start_time` and a duration assumption (see "Time/duration" below).
- Click on background hour cell → `onSlotClick({ date, time })` → opens CreateBookingModal pre-filled.
- Click on a booking block → `onBookingClick(booking)` → opens QuickActionModal.
- Horizontally scrollable on narrow screens (min-width 640 px for the grid body).

### `<DayGrid cursorDate bookings onBookingClick onSlotClick />`

- Same construction as Week, but a single day column at full width.
- Identical hour range and click behaviour.

### `<BookingQuickActionModal booking open onClose onStatusChange onViewFull />`

Shown on booking click. Body:
- Customer name, WhatsApp (if present), service list, date/time, amount, status chip.

Buttons (conditional on current status):
- **Mark Completed** — visible if status `Booked`. Calls `PUT /booking/{id}` with `{ status: 'Completed' }`.
- **Mark Cancelled** — visible if status `Booked`. Calls `PUT /booking/{id}` with `{ status: 'Cancelled' }`.
- **View full details** — always visible. Routes to `/shop/bookings/action?id={id}`.

After a successful status change: close modal, call `onUpdated()` (parent refetches), show toast via existing `notify` helper.

Errors are shown inline in the modal; modal stays open so the owner can retry or dismiss.

### `<CreateBookingModal>` — extension

Add two optional props:
- `initialDate?: 'YYYY-MM-DD'` — overrides the default `today` on open.
- `initialSlot?: 'HH:MM'` — pre-selects the matching slot once `slots` load (best-effort match; if the slot doesn't exist, no slot is pre-selected).

No behavioural change when both are absent (existing callers untouched).

## Data flow

1. Page mounts → fetches `/shop/all-bookings` (existing logic, unchanged).
2. `viewMode === 'list'` → renders `<BookingsListView bookings={filteredBookings} />` (existing table & cards).
3. `viewMode === 'calendar'` → renders `<BookingsCalendarView bookings={filteredBookings} shopId={shop.id} onCreated={fetchBookings} onUpdated={fetchBookings} />`.
4. Calendar groups bookings by date inside `calendar/utils.js` (one pass: `Map<YYYY-MM-DD, booking[]>`).
5. Status change in QuickActionModal → `PUT /booking/{id}` → on success, `onUpdated()` re-runs `fetchBookings()`.
6. Slot click in Week/Day → opens `CreateBookingModal` with `initialDate` + `initialSlot`. On submit, existing `onCreated` fires → re-fetch.

## Time / duration assumptions

- Bookings have `start_time` (`HH:MM`). Duration is **not currently a reliable field** on the booking record.
- v1 assumption: **each booking block occupies a fixed 60-minute slot**. This matches the typical service slot duration in the existing booking flow.
- If a booking record exposes a `duration` or `end_time`, the grid will use it; otherwise default to 60 min.
- Overlapping bookings in the same hour: stack side-by-side within the day column (`flex-1` split). v1 caps stack at 3 visible; 4+ collapses into a `+N` indicator.

## Mobile responsiveness

| View | Mobile behaviour |
|------|------------------|
| Month | Cells shrink; chips collapse to status dots only (count badge instead of names). Tapping a cell opens a bottom sheet listing that day's bookings as rows; tapping any row opens the QuickActionModal for that booking. |
| Week | Horizontal scroll (min-width 640 px). Toolbar stays sticky at the top. |
| Day | Full mobile width; single column, identical to desktop. |

## Styling / design tokens

Reuse existing palette already used on the page:
- Surface: `#0d141d`, `#151c25`, `#19202a`
- Borders: `#414755/20`-`/40`
- Accent (primary actions): `#adc6ff`
- Status colours: Booked `#adc6ff`, Completed `#4edea3`, Cancelled `#8b90a0`
- Text: `#dce3f0` (body), `#8b90a0` (muted), white (headings)
- Icons: `material-symbols-outlined` (already used across the page)

## Error handling

| Scenario | Handling |
|----------|----------|
| Initial bookings fetch fails | Existing red banner already in place; reused. |
| Status change fails in QuickActionModal | Inline error inside modal; modal stays open. |
| Create booking fails from slot click | `CreateBookingModal`'s existing error handling (no change). |

## Out of scope (v1)

- Drag-and-drop reschedule.
- Reading per-shop working hours to bound the time grid (hard-coded 06:00–23:00 for v1).
- Recurring bookings.
- Multi-day bookings.
- Calendar print / export.
- Real-time updates (websocket / polling).
- Per-staff calendar lanes.

## Open questions

None — all five clarifying questions answered, tech approach selected.

## Acceptance criteria

1. Toggle between List and Calendar at the top of the bookings page; selection persists across reloads.
2. Calendar supports Month, Week, Day sub-views; selection persists across reloads.
3. Toolbar prev / today / next moves the cursor by one month / week / day.
4. Search and status filters apply identically to both views; date-range picker is hidden in calendar mode.
5. Clicking a booking (in any sub-view) opens the QuickActionModal.
6. From the QuickActionModal, a Booked booking can be marked Completed or Cancelled and the calendar reflects the new status without a page reload.
7. "View full details" routes to the existing `/shop/bookings/action?id=...` page.
8. In Week and Day sub-views, clicking an empty hour slot opens `CreateBookingModal` with that date (and slot, when matchable) pre-filled.
9. After creating a booking from a slot click, the calendar re-fetches and the new booking appears.
10. Mobile: Month view collapses chips to dots and reveals day's bookings via a bottom sheet; Week scrolls horizontally; Day is full-width.
