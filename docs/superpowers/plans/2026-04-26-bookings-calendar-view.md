# Bookings Calendar View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Calendar view (Month / Week / Day) to the shop-owner Bookings page, alongside the existing list view, with in-place quick actions and click-to-create on empty slots.

**Architecture:** The page becomes an orchestrator with a List ↔ Calendar toggle. The existing list/cards UI is extracted unchanged into `BookingsListView`. The new `BookingsCalendarView` hosts a toolbar (sub-view + prev/today/next + cursor label) and switches between three grid components (Month, Week, Day) built from scratch with `date-fns`. Booking clicks open a `BookingQuickActionModal` (status change / view full); empty Week/Day slots open the existing `CreateBookingModal` pre-filled with date/time. View preferences persist to localStorage.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, `date-fns` v4 (already installed), Axios via `@/utils/api`. No new dependencies. No frontend test runner is configured (per `frontend/CLAUDE.md`) — verification is manual through the dev server.

**Spec:** `docs/superpowers/specs/2026-04-26-bookings-calendar-view-design.md`

**Working directory for all paths below:** `frontend/`

---

## Conventions

- Run the dev server with `npm run dev` from the repo root (or `cd frontend && npm run dev`). Visit http://localhost:3000/shop/bookings (sign in as a shop owner first).
- All new components use `"use client";` at the top — they read state, dates, and localStorage.
- Reuse the existing palette (see spec §"Styling / design tokens"). Do not introduce new colour tokens.
- Reuse the existing `material-symbols-outlined` icon font (already loaded site-wide).
- Date strings are always `YYYY-MM-DD`; time strings are always `HH:MM` (24h). Use the `toISO`/`fromISO` helpers from `calendar/utils.js`.
- Commit after every task. Commit message style: `feat(bookings):` or `refactor(bookings):` prefixes, present tense.

---

## Task 1: Extract the existing list view into its own component (refactor)

This is a pure refactor — no behaviour changes. It carves the existing table + mobile cards out of `page.js` so the next tasks can swap views cleanly.

**Files:**
- Create: `frontend/src/components/Shop/Bookings/BookingsListView.jsx`
- Modify: `frontend/src/app/shop/bookings/page.js`

- [ ] **Step 1: Create the new component file**

Path: `frontend/src/components/Shop/Bookings/BookingsListView.jsx`

```jsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

const STATUS_CHIP = {
  Booked:    "bg-[#adc6ff]/15 text-[#adc6ff] border border-[#adc6ff]/20",
  Completed: "bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20",
  Cancelled: "bg-[#414755]/40 text-[#8b90a0] border border-[#414755]/30",
};
const STATUS_DOT = {
  Booked:    "bg-[#adc6ff]",
  Completed: "bg-[#4edea3]",
  Cancelled: "bg-[#8b90a0]",
};

export default function BookingsListView({ bookings, totalCount }) {
  const router = useRouter();

  return (
    <>
      {/* Desktop — table */}
      <div className="hidden md:block bg-[#19202a] rounded-xl overflow-hidden border border-[#414755]/20 shadow-xl shadow-black/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2e353f]/30 border-b border-[#414755]/20">
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Customer</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Service</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Date & Time</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Status</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest text-right">Amount</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#414755]/10">
            {bookings.map((booking) => {
              const customerName = booking.customer?.name || booking.customer_name || "Guest";
              const initials = customerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
              const services = booking.services?.map(s => s.title || s.name).join(", ") || "—";
              const chipClass = STATUS_CHIP[booking.status] ?? STATUS_CHIP.Booked;
              const dotClass  = STATUS_DOT[booking.status]  ?? STATUS_DOT.Booked;

              return (
                <tr
                  key={booking.id}
                  className="hover:bg-[#2e353f]/20 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/shop/bookings/action?id=${booking.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#2e353f] flex items-center justify-center font-bold text-xs text-[#adc6ff] shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#adc6ff] transition-colors">{customerName}</p>
                        <p className="text-[10px] text-[#8b90a0] font-medium">
                          {booking.booking_reference}
                          {booking.customer_whatsapp && (
                            <span className="ml-2 text-[#4edea3]">· {booking.customer_whatsapp}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-[#dce3f0] max-w-[180px] truncate">{services}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-[#dce3f0]">{booking.show_date || booking.date || "—"}</p>
                    {booking.start_time && (
                      <p className="text-[11px] text-[#8b90a0] font-medium mt-0.5">{booking.start_time}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-sm font-black text-white">AED {booking.charges || "0"}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/shop/bookings/action?id=${booking.id}`); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#adc6ff]/10 hover:bg-[#adc6ff]/20 text-[#adc6ff] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      View
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-[#414755]/20 bg-[#151c25]">
          <p className="text-[11px] font-semibold text-[#8b90a0]">
            Showing {bookings.length} of {totalCount} bookings
          </p>
        </div>
      </div>

      {/* Mobile — cards */}
      <div className="md:hidden space-y-3">
        {bookings.map((booking) => {
          const customerName = booking.customer?.name || booking.customer_name || "Guest";
          const services    = booking.services?.map(s => s.title || s.name).join(", ") || "—";
          const chipClass   = STATUS_CHIP[booking.status] ?? STATUS_CHIP.Booked;
          const dotClass    = STATUS_DOT[booking.status]  ?? STATUS_DOT.Booked;

          return (
            <div
              key={booking.id}
              onClick={() => router.push(`/shop/bookings/action?id=${booking.id}`)}
              className="bg-[#151c25] rounded-xl p-4 border border-[#414755]/20 hover:border-[#414755]/50 cursor-pointer transition-all active:scale-[0.98] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">{booking.booking_reference}</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  {booking.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-white">{customerName}</p>
                {booking.customer_whatsapp && (
                  <p className="text-[11px] text-[#4edea3] mt-0.5 font-semibold">{booking.customer_whatsapp}</p>
                )}
                <p className="text-xs text-[#8b90a0] mt-0.5 font-medium">{services}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#414755]/20">
                <div>
                  <p className="text-[10px] text-[#8b90a0] uppercase tracking-widest font-bold">Date</p>
                  <p className="text-xs font-semibold text-[#dce3f0] mt-0.5">
                    {booking.show_date || booking.date || "—"}{booking.start_time ? ` · ${booking.start_time}` : ""}
                  </p>
                </div>
                <p className="text-base font-black text-white">AED {booking.charges || "0"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Replace the inlined list/cards block in `page.js` with the new component**

In `frontend/src/app/shop/bookings/page.js`, delete the constants `STATUS_CHIP` and `STATUS_DOT` at lines 11-20 (they now live in `BookingsListView`). Add this import near the top with the other imports:

```js
import BookingsListView from '@/components/Shop/Bookings/BookingsListView';
```

Then replace the entire `{!loading && filteredBookings.length > 0 && ( ... )}` block (the table + mobile cards section) with:

```jsx
{!loading && filteredBookings.length > 0 && (
  <BookingsListView bookings={filteredBookings} totalCount={bookings.length} />
)}
```

Also remove `useRouter` from the page if it's no longer used after the refactor (check: it was only used for the row-click navigation, which now lives inside `BookingsListView`).

- [ ] **Step 3: Manual verification**

Run `npm run dev` from the repo root. Navigate to `/shop/bookings`. Verify:
- The page renders identically to before (table on desktop, cards on mobile).
- Clicking a row / card still navigates to `/shop/bookings/action?id=...`.
- Search, status filter, and date-range filter still work.
- Summary pills (`X total`, `X upcoming`, `X done`) still show correct counts.
- "New booking" button still opens the create modal.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Shop/Bookings/BookingsListView.jsx frontend/src/app/shop/bookings/page.js
git commit -m "refactor(bookings): extract list view into its own component"
```

---

## Task 2: Build calendar date utilities

Pure functions used by all three grids. No React, no DOM. Lives in its own file so the grids can stay focused on rendering.

**Files:**
- Create: `frontend/src/components/Shop/Bookings/calendar/utils.js`

- [ ] **Step 1: Create the utils file**

Path: `frontend/src/components/Shop/Bookings/calendar/utils.js`

```js
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameDay,
  isSameMonth,
  parse,
} from "date-fns";

// Calendar week starts on Sunday (matches Gulf region default).
const WEEK_STARTS_ON = 0;

// Hour range for Week / Day grids (v1 fixed).
export const HOUR_START = 6;   // 06:00
export const HOUR_END   = 23;  // 23:00 (last row label)

// ---------- date <-> string ----------

export const toISO = (d) => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fromISO = (s) => (s ? new Date(`${s}T00:00:00`) : null);

// ---------- grid builders ----------

export function buildMonthMatrix(cursorDate) {
  const start = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: WEEK_STARTS_ON });
  const end   = endOfWeek(endOfMonth(cursorDate),   { weekStartsOn: WEEK_STARTS_ON });
  const days = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  // Always 6 rows for stable layout
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1));
  return days;
}

export function buildWeekDays(cursorDate) {
  const start = startOfWeek(cursorDate, { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function buildHourRows() {
  return Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
}

// ---------- booking grouping ----------

// Returns Map<'YYYY-MM-DD', Booking[]>
export function groupBookingsByDate(bookings) {
  const map = new Map();
  for (const b of bookings) {
    const key = b.date || b.show_date;
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(b);
  }
  // Sort each day's bookings by start_time
  for (const list of map.values()) {
    list.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }
  return map;
}

// ---------- time math for Week/Day blocks ----------

// Parse HH:MM (or HH:MM:SS) into minutes since midnight. Returns null if unparseable.
export function timeToMinutes(t) {
  if (!t) return null;
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

// Default duration when booking has no end_time / duration field.
export const DEFAULT_DURATION_MIN = 60;

// Pixel layout for a booking inside a day column.
// rowHeightPx = visual height of one hour row.
export function bookingBlockStyle(booking, rowHeightPx) {
  const startMin = timeToMinutes(booking.start_time);
  if (startMin == null) return null;

  const gridStartMin = HOUR_START * 60;
  const top = ((startMin - gridStartMin) / 60) * rowHeightPx;

  const durationMin = (() => {
    if (booking.duration_minutes) return Number(booking.duration_minutes);
    const endMin = timeToMinutes(booking.end_time);
    if (endMin != null && endMin > startMin) return endMin - startMin;
    return DEFAULT_DURATION_MIN;
  })();

  const height = (durationMin / 60) * rowHeightPx;
  return { top, height };
}

// ---------- nav helpers ----------

export function shiftCursor(cursorDate, subView, direction) {
  const sign = direction === "next" ? 1 : -1;
  if (subView === "month") return addMonths(cursorDate, sign);
  if (subView === "week")  return addWeeks(cursorDate, sign);
  return addDays(cursorDate, sign);
}

export function cursorLabel(cursorDate, subView) {
  if (subView === "month") return format(cursorDate, "MMMM yyyy");
  if (subView === "week") {
    const start = startOfWeek(cursorDate, { weekStartsOn: WEEK_STARTS_ON });
    const end   = addDays(start, 6);
    if (isSameMonth(start, end)) return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return format(cursorDate, "EEEE, MMM d, yyyy");
}

// Re-exports so consumers don't have to import from date-fns directly.
export { startOfDay, isSameDay, isSameMonth, format };
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Shop/Bookings/calendar/utils.js
git commit -m "feat(bookings): add calendar date utilities"
```

---

## Task 3: Build the BookingQuickActionModal

Self-contained modal — needed by all three grids.

**Files:**
- Create: `frontend/src/components/Shop/Bookings/BookingQuickActionModal.jsx`

- [ ] **Step 1: Create the modal**

Path: `frontend/src/components/Shop/Bookings/BookingQuickActionModal.jsx`

```jsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { notify } from "@/utils/alerts";

const STATUS_CHIP = {
  Booked:    "bg-[#adc6ff]/15 text-[#adc6ff] border border-[#adc6ff]/20",
  Completed: "bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20",
  Cancelled: "bg-[#414755]/40 text-[#8b90a0] border border-[#414755]/30",
};
const STATUS_DOT = {
  Booked:    "bg-[#adc6ff]",
  Completed: "bg-[#4edea3]",
  Cancelled: "bg-[#8b90a0]",
};

export default function BookingQuickActionModal({ booking, open, onClose, onUpdated }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);     // 'Completed' | 'Cancelled' | null
  const [error, setError] = useState(null);

  if (!open || !booking) return null;

  const customerName = booking.customer?.name || booking.customer_name || "Guest";
  const services = booking.services?.map(s => s.title || s.name).join(", ") || "—";
  const chipClass = STATUS_CHIP[booking.status] ?? STATUS_CHIP.Booked;
  const dotClass  = STATUS_DOT[booking.status]  ?? STATUS_DOT.Booked;
  const isBooked  = booking.status === "Booked";

  const changeStatus = async (status) => {
    setError(null);
    setBusy(status);
    try {
      await api.put(`/booking/${booking.id}`, { status });
      await notify({
        title: "Updated",
        text: `Booking marked ${status.toLowerCase()}.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      onUpdated?.();
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Could not update booking.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="w-full md:w-[460px] bg-[#151c25] md:rounded-2xl rounded-t-2xl border border-[#414755]/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#414755]/30">
          <div>
            <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">{booking.booking_reference}</p>
            <h3 className="text-lg font-black text-white tracking-tight mt-0.5">{customerName}</h3>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-xl bg-[#19202a] hover:bg-[#242a34] text-[#8b90a0] hover:text-white flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
              {booking.status}
            </span>
            <p className="text-base font-black text-white">AED {booking.charges || "0"}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Date</p>
              <p className="font-semibold text-[#dce3f0] mt-0.5">{booking.show_date || booking.date || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Time</p>
              <p className="font-semibold text-[#dce3f0] mt-0.5">{booking.start_time || "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Services</p>
            <p className="text-sm font-semibold text-[#dce3f0] mt-1">{services}</p>
          </div>

          {booking.customer_whatsapp && (
            <div>
              <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">WhatsApp</p>
              <p className="text-sm font-semibold text-[#4edea3] mt-1">{booking.customer_whatsapp}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-[#414755]/30 flex flex-col sm:flex-row gap-2">
          {isBooked && (
            <>
              <button
                onClick={() => changeStatus("Completed")}
                disabled={busy !== null}
                className="flex-1 h-11 rounded-xl bg-[#4edea3] hover:bg-[#4edea3]/90 text-[#0d141d] text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {busy === "Completed" ? "Saving…" : "Mark Completed"}
              </button>
              <button
                onClick={() => changeStatus("Cancelled")}
                disabled={busy !== null}
                className="flex-1 h-11 rounded-xl bg-[#414755]/40 hover:bg-[#414755]/60 text-[#dce3f0] text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                {busy === "Cancelled" ? "Saving…" : "Mark Cancelled"}
              </button>
            </>
          )}
          <button
            onClick={() => { onClose?.(); router.push(`/shop/bookings/action?id=${booking.id}`); }}
            className="flex-1 h-11 rounded-xl bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#0d141d] text-xs font-black uppercase tracking-widest transition-all inline-flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            View full details
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Shop/Bookings/BookingQuickActionModal.jsx
git commit -m "feat(bookings): add quick-action modal for calendar booking clicks"
```

---

## Task 4: Build MonthGrid

The simplest grid — fixed 6×7 layout, one chip per booking up to 3, then `+N more`.

**Files:**
- Create: `frontend/src/components/Shop/Bookings/calendar/MonthGrid.jsx`

- [ ] **Step 1: Create the month grid**

Path: `frontend/src/components/Shop/Bookings/calendar/MonthGrid.jsx`

```jsx
"use client";

import React from "react";
import { buildMonthMatrix, groupBookingsByDate, toISO, isSameDay, isSameMonth, format } from "./utils";

const STATUS_DOT = {
  Booked:    "bg-[#adc6ff]",
  Completed: "bg-[#4edea3]",
  Cancelled: "bg-[#8b90a0]",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthGrid({ cursorDate, bookings, onBookingClick, onMoreClick }) {
  const days = buildMonthMatrix(cursorDate);
  const byDate = groupBookingsByDate(bookings);
  const today = new Date();

  return (
    <div className="bg-[#19202a] border border-[#414755]/20 rounded-xl overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 bg-[#2e353f]/30 border-b border-[#414755]/20">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-3 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest text-center">
            {d}
          </div>
        ))}
      </div>

      {/* 6 rows × 7 cols */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const iso = toISO(day);
          const dayBookings = byDate.get(iso) || [];
          const inMonth = isSameMonth(day, cursorDate);
          const isToday = isSameDay(day, today);
          const visible = dayBookings.slice(0, 3);
          const overflow = dayBookings.length - visible.length;

          return (
            <div
              key={iso + idx}
              className={`min-h-[96px] md:min-h-[112px] border-b border-r border-[#414755]/10 p-1.5 md:p-2 ${
                inMonth ? "bg-[#19202a]" : "bg-[#151c25]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black ${
                    isToday
                      ? "bg-[#adc6ff] text-[#0d141d]"
                      : inMonth
                        ? "text-white"
                        : "text-[#8b90a0]"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayBookings.length > 0 && (
                  <span className="hidden md:inline-block text-[9px] font-bold text-[#8b90a0]">
                    {dayBookings.length}
                  </span>
                )}
              </div>

              {/* Desktop: chips */}
              <div className="hidden md:flex flex-col gap-1">
                {visible.map((b) => {
                  const dotClass = STATUS_DOT[b.status] ?? STATUS_DOT.Booked;
                  const customerName = b.customer?.name || b.customer_name || "Guest";
                  return (
                    <button
                      key={b.id}
                      onClick={() => onBookingClick(b)}
                      className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-[#080f17] hover:bg-[#2e353f]/40 text-left transition-colors"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                      <span className="text-[10px] font-semibold text-[#dce3f0] truncate">
                        {b.start_time ? `${b.start_time} ` : ""}{customerName}
                      </span>
                    </button>
                  );
                })}
                {overflow > 0 && (
                  <button
                    onClick={() => onMoreClick(day)}
                    className="text-[10px] font-bold text-[#adc6ff] text-left px-1.5"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>

              {/* Mobile: dots only — tap cell opens day list */}
              <button
                onClick={() => dayBookings.length > 0 && onMoreClick(day)}
                className="md:hidden flex flex-wrap gap-1 w-full"
                aria-label={dayBookings.length > 0 ? `View ${dayBookings.length} bookings` : "No bookings"}
              >
                {dayBookings.slice(0, 6).map((b) => (
                  <span
                    key={b.id}
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[b.status] ?? STATUS_DOT.Booked}`}
                  />
                ))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Shop/Bookings/calendar/MonthGrid.jsx
git commit -m "feat(bookings): add month grid for calendar view"
```

---

## Task 5: Build WeekGrid

7-column time grid with absolute-positioned booking blocks.

**Files:**
- Create: `frontend/src/components/Shop/Bookings/calendar/WeekGrid.jsx`

- [ ] **Step 1: Create the week grid**

Path: `frontend/src/components/Shop/Bookings/calendar/WeekGrid.jsx`

```jsx
"use client";

import React from "react";
import {
  buildWeekDays,
  buildHourRows,
  groupBookingsByDate,
  bookingBlockStyle,
  toISO,
  isSameDay,
  format,
} from "./utils";

const ROW_HEIGHT = 56;     // px per hour row
const TIME_COL_W = 60;     // px

const STATUS_BG = {
  Booked:    "bg-[#adc6ff]/20 border-[#adc6ff]/40 text-[#adc6ff]",
  Completed: "bg-[#4edea3]/20 border-[#4edea3]/40 text-[#4edea3]",
  Cancelled: "bg-[#414755]/40 border-[#414755]/40 text-[#8b90a0]",
};

export default function WeekGrid({ cursorDate, bookings, onBookingClick, onSlotClick }) {
  const days  = buildWeekDays(cursorDate);
  const hours = buildHourRows();
  const byDate = groupBookingsByDate(bookings);
  const today = new Date();

  return (
    <div className="bg-[#19202a] border border-[#414755]/20 rounded-xl overflow-hidden">
      {/* Day header */}
      <div className="grid border-b border-[#414755]/20 bg-[#2e353f]/30" style={{ gridTemplateColumns: `${TIME_COL_W}px repeat(7, minmax(80px, 1fr))` }}>
        <div />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={toISO(d)} className="px-2 py-3 text-center border-l border-[#414755]/10">
              <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">{format(d, "EEE")}</p>
              <p className={`text-sm font-black mt-0.5 ${isToday ? "text-[#adc6ff]" : "text-white"}`}>
                {format(d, "d")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Body — horizontally scrollable on mobile */}
      <div className="overflow-x-auto">
        <div
          className="relative"
          style={{
            display: "grid",
            gridTemplateColumns: `${TIME_COL_W}px repeat(7, minmax(80px, 1fr))`,
            gridAutoRows: `${ROW_HEIGHT}px`,
            minWidth: TIME_COL_W + 7 * 80,
          }}
        >
          {/* Hour rows */}
          {hours.map((h) => (
            <React.Fragment key={h}>
              <div className="border-r border-b border-[#414755]/10 px-2 pt-1 text-right text-[10px] font-bold text-[#8b90a0]">
                {String(h).padStart(2, "0")}:00
              </div>
              {days.map((d) => (
                <button
                  key={toISO(d) + h}
                  onClick={() => onSlotClick({ date: toISO(d), time: `${String(h).padStart(2, "0")}:00` })}
                  className="border-l border-b border-[#414755]/10 hover:bg-[#adc6ff]/5 transition-colors"
                  aria-label={`Create booking on ${toISO(d)} at ${h}:00`}
                />
              ))}
            </React.Fragment>
          ))}

          {/* Booking blocks (absolute over their day column) */}
          {days.map((d, dayIdx) => {
            const list = byDate.get(toISO(d)) || [];
            return list.map((b) => {
              const style = bookingBlockStyle(b, ROW_HEIGHT);
              if (!style) return null;
              const colorClass = STATUS_BG[b.status] ?? STATUS_BG.Booked;
              const customerName = b.customer?.name || b.customer_name || "Guest";
              return (
                <button
                  key={b.id}
                  onClick={() => onBookingClick(b)}
                  className={`absolute rounded-lg border px-2 py-1 text-left overflow-hidden hover:brightness-125 transition-all ${colorClass}`}
                  style={{
                    top: style.top,
                    height: Math.max(style.height - 2, 22),
                    left: `calc(${TIME_COL_W}px + ((100% - ${TIME_COL_W}px) / 7) * ${dayIdx} + 2px)`,
                    width: `calc((100% - ${TIME_COL_W}px) / 7 - 4px)`,
                  }}
                >
                  <p className="text-[10px] font-bold truncate">{b.start_time}</p>
                  <p className="text-[11px] font-semibold text-white truncate">{customerName}</p>
                </button>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Shop/Bookings/calendar/WeekGrid.jsx
git commit -m "feat(bookings): add week time-grid for calendar view"
```

---

## Task 6: Build DayGrid

Single-column variant of WeekGrid. Same time math, full-width blocks.

**Files:**
- Create: `frontend/src/components/Shop/Bookings/calendar/DayGrid.jsx`

- [ ] **Step 1: Create the day grid**

Path: `frontend/src/components/Shop/Bookings/calendar/DayGrid.jsx`

```jsx
"use client";

import React from "react";
import {
  buildHourRows,
  groupBookingsByDate,
  bookingBlockStyle,
  toISO,
} from "./utils";

const ROW_HEIGHT = 64;
const TIME_COL_W = 60;

const STATUS_BG = {
  Booked:    "bg-[#adc6ff]/20 border-[#adc6ff]/40 text-[#adc6ff]",
  Completed: "bg-[#4edea3]/20 border-[#4edea3]/40 text-[#4edea3]",
  Cancelled: "bg-[#414755]/40 border-[#414755]/40 text-[#8b90a0]",
};

export default function DayGrid({ cursorDate, bookings, onBookingClick, onSlotClick }) {
  const hours = buildHourRows();
  const byDate = groupBookingsByDate(bookings);
  const list = byDate.get(toISO(cursorDate)) || [];

  return (
    <div className="bg-[#19202a] border border-[#414755]/20 rounded-xl overflow-hidden">
      <div
        className="relative"
        style={{
          display: "grid",
          gridTemplateColumns: `${TIME_COL_W}px 1fr`,
          gridAutoRows: `${ROW_HEIGHT}px`,
        }}
      >
        {hours.map((h) => (
          <React.Fragment key={h}>
            <div className="border-r border-b border-[#414755]/10 px-2 pt-1 text-right text-[10px] font-bold text-[#8b90a0]">
              {String(h).padStart(2, "0")}:00
            </div>
            <button
              onClick={() => onSlotClick({ date: toISO(cursorDate), time: `${String(h).padStart(2, "0")}:00` })}
              className="border-l border-b border-[#414755]/10 hover:bg-[#adc6ff]/5 transition-colors"
              aria-label={`Create booking at ${h}:00`}
            />
          </React.Fragment>
        ))}

        {list.map((b) => {
          const style = bookingBlockStyle(b, ROW_HEIGHT);
          if (!style) return null;
          const colorClass = STATUS_BG[b.status] ?? STATUS_BG.Booked;
          const customerName = b.customer?.name || b.customer_name || "Guest";
          const services = b.services?.map(s => s.title || s.name).join(", ") || "";
          return (
            <button
              key={b.id}
              onClick={() => onBookingClick(b)}
              className={`absolute rounded-lg border px-3 py-2 text-left overflow-hidden hover:brightness-125 transition-all ${colorClass}`}
              style={{
                top: style.top,
                height: Math.max(style.height - 2, 28),
                left: `calc(${TIME_COL_W}px + 4px)`,
                right: 4,
              }}
            >
              <p className="text-[10px] font-bold">{b.start_time}{b.charges ? ` · AED ${b.charges}` : ""}</p>
              <p className="text-sm font-bold text-white truncate">{customerName}</p>
              {services && <p className="text-[10px] text-white/70 truncate">{services}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Shop/Bookings/calendar/DayGrid.jsx
git commit -m "feat(bookings): add day time-grid for calendar view"
```

---

## Task 7: Extend CreateBookingModal with `initialDate` and `initialSlot` props

Backwards-compatible — existing callers (the page's "New booking" button) pass nothing and behave identically.

**Files:**
- Modify: `frontend/src/components/Shop/CreateBookingModal.jsx`

- [ ] **Step 1: Update the component signature and effects**

Open `frontend/src/components/Shop/CreateBookingModal.jsx`. Make three changes:

1. Update the function signature on line 19:

```jsx
export default function CreateBookingModal({ open, onClose, shopId, onCreated, initialDate, initialSlot }) {
```

2. Update the initial state for `date` (line 20) so it falls back to `initialDate`:

```jsx
const [date, setDate] = useState(initialDate || toISO(new Date()));
```

3. Find the second `useEffect` (the one that resets state when `open` becomes false — currently around lines 67-76). It looks like:

```jsx
useEffect(() => {
    if (!open) {
        setDate(toISO(new Date()));
        setSlot("");
        setSelectedServices([]);
        setChargesOverride(null);
        setCustomerName("");
        setCustomerWhatsapp("");
    }
}, [open]);
```

Replace it with:

```jsx
useEffect(() => {
    if (open) {
        // When the modal opens, honour initialDate / initialSlot.
        if (initialDate) setDate(initialDate);
    } else {
        setDate(initialDate || toISO(new Date()));
        setSlot("");
        setSelectedServices([]);
        setChargesOverride(null);
        setCustomerName("");
        setCustomerWhatsapp("");
    }
}, [open, initialDate]);
```

4. Find the first `useEffect` (around lines 43-66) — the one that fetches catalogs/slots when `open && date && shopId`. After `setSlots(data?.slots || []);` and before the catch block, add a slot-preselect line so that once slots arrive we honour `initialSlot` if it's available:

```jsx
if (initialSlot && (data?.slots || []).includes(initialSlot)) {
    setSlot(initialSlot);
}
```

The full updated block should look like:

```jsx
if (cancelled) return;
setCatalogs(data?.catalogs || []);
setSlots(data?.slots || []);
if (initialSlot && (data?.slots || []).includes(initialSlot)) {
    setSlot(initialSlot);
}
```

Add `initialSlot` to the dep array of this effect:

```jsx
}, [open, date, shopId, initialSlot]);
```

- [ ] **Step 2: Manual verification**

Run `npm run dev`. From the existing list view, click "New booking". Verify the date defaults to today and no slot is pre-selected (existing behaviour unchanged).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Shop/CreateBookingModal.jsx
git commit -m "feat(bookings): support initialDate and initialSlot props in CreateBookingModal"
```

---

## Task 8: Build BookingsCalendarView (the shell)

Wires the toolbar, grids, modals, and click handlers together.

**Files:**
- Create: `frontend/src/components/Shop/Bookings/BookingsCalendarView.jsx`

- [ ] **Step 1: Create the calendar view**

Path: `frontend/src/components/Shop/Bookings/BookingsCalendarView.jsx`

```jsx
"use client";

import React, { useEffect, useState } from "react";
import MonthGrid from "./calendar/MonthGrid";
import WeekGrid from "./calendar/WeekGrid";
import DayGrid from "./calendar/DayGrid";
import BookingQuickActionModal from "./BookingQuickActionModal";
import CreateBookingModal from "@/components/Shop/CreateBookingModal";
import { shiftCursor, cursorLabel } from "./calendar/utils";

const SUB_VIEWS = [
  { value: "month", label: "Month" },
  { value: "week",  label: "Week" },
  { value: "day",   label: "Day" },
];

const SUBVIEW_KEY = "admin.bookings.calendarSubView";

export default function BookingsCalendarView({ bookings, shopId, onCreated, onUpdated }) {
  const [subView, setSubView] = useState("month");
  const [cursorDate, setCursorDate] = useState(new Date());
  const [quickBooking, setQuickBooking] = useState(null);
  const [createSlot, setCreateSlot] = useState(null); // { date, time } | null

  // Load persisted sub-view on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SUBVIEW_KEY);
      if (saved === "month" || saved === "week" || saved === "day") setSubView(saved);
    } catch {}
  }, []);

  // Persist sub-view.
  useEffect(() => {
    try { localStorage.setItem(SUBVIEW_KEY, subView); } catch {}
  }, [subView]);

  const goPrev   = () => setCursorDate((d) => shiftCursor(d, subView, "prev"));
  const goNext   = () => setCursorDate((d) => shiftCursor(d, subView, "next"));
  const goToday  = () => setCursorDate(new Date());

  const handleBookingClick = (b) => setQuickBooking(b);
  const handleSlotClick    = (slot) => setCreateSlot(slot);
  const handleMonthMore    = (date) => { setSubView("day"); setCursorDate(date); };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-[#151c25] rounded-xl p-3 md:p-4 border border-[#414755]/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="size-9 rounded-xl bg-[#080f17] border border-[#414755]/40 hover:border-[#adc6ff]/40 text-[#dce3f0] hover:text-[#adc6ff] flex items-center justify-center transition-all"
            aria-label="Previous"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button
            onClick={goToday}
            className="h-9 px-3 rounded-xl bg-[#080f17] border border-[#414755]/40 hover:border-[#adc6ff]/40 text-[11px] font-black text-[#dce3f0] hover:text-[#adc6ff] uppercase tracking-widest transition-all"
          >
            Today
          </button>
          <button
            onClick={goNext}
            className="size-9 rounded-xl bg-[#080f17] border border-[#414755]/40 hover:border-[#adc6ff]/40 text-[#dce3f0] hover:text-[#adc6ff] flex items-center justify-center transition-all"
            aria-label="Next"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
          <p className="ml-2 text-sm md:text-base font-black text-white">{cursorLabel(cursorDate, subView)}</p>
        </div>

        <div className="inline-flex bg-[#080f17] border border-[#414755]/40 rounded-xl p-1 self-start md:self-auto">
          {SUB_VIEWS.map((v) => (
            <button
              key={v.value}
              onClick={() => setSubView(v.value)}
              className={`h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                subView === v.value
                  ? "bg-[#adc6ff] text-[#0d141d]"
                  : "text-[#8b90a0] hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {subView === "month" && (
        <MonthGrid
          cursorDate={cursorDate}
          bookings={bookings}
          onBookingClick={handleBookingClick}
          onMoreClick={handleMonthMore}
        />
      )}
      {subView === "week" && (
        <WeekGrid
          cursorDate={cursorDate}
          bookings={bookings}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
        />
      )}
      {subView === "day" && (
        <DayGrid
          cursorDate={cursorDate}
          bookings={bookings}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
        />
      )}

      {/* Modals */}
      <BookingQuickActionModal
        booking={quickBooking}
        open={!!quickBooking}
        onClose={() => setQuickBooking(null)}
        onUpdated={onUpdated}
      />

      <CreateBookingModal
        open={!!createSlot}
        onClose={() => setCreateSlot(null)}
        shopId={shopId}
        initialDate={createSlot?.date}
        initialSlot={createSlot?.time}
        onCreated={() => {
          setCreateSlot(null);
          onCreated?.();
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Shop/Bookings/BookingsCalendarView.jsx
git commit -m "feat(bookings): add calendar view shell with toolbar and grids"
```

---

## Task 9: Wire the view-mode toggle into the page

Replace the list-only render in `page.js` with a List ↔ Calendar toggle that swaps between the two views. Persist the choice. Disable the date-range picker in calendar mode.

**Files:**
- Modify: `frontend/src/app/shop/bookings/page.js`

- [ ] **Step 1: Add imports and view-mode state**

Open `frontend/src/app/shop/bookings/page.js`. Add the new import alongside the existing `BookingsListView` import:

```jsx
import BookingsCalendarView from '@/components/Shop/Bookings/BookingsCalendarView';
```

Add the view-mode state right after `const [createOpen, setCreateOpen] = useState(false);`:

```jsx
const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

// Load persisted view-mode on mount.
useEffect(() => {
  try {
    const saved = localStorage.getItem('admin.bookings.viewMode');
    if (saved === 'list' || saved === 'calendar') setViewMode(saved);
  } catch {}
}, []);

// Persist view-mode.
useEffect(() => {
  try { localStorage.setItem('admin.bookings.viewMode', viewMode); } catch {}
}, [viewMode]);
```

- [ ] **Step 2: Add the View toggle UI**

In the page heading row (the `flex flex-col sm:flex-row sm:items-end justify-between` div), inside the right-hand `flex items-center gap-2 flex-wrap` cluster, insert this segmented control **before** the summary pills:

```jsx
{/* View toggle */}
<div className="inline-flex bg-[#080f17] border border-[#414755]/40 rounded-xl p-1">
  <button
    onClick={() => setViewMode('list')}
    className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
      viewMode === 'list' ? 'bg-[#adc6ff] text-[#0d141d]' : 'text-[#8b90a0] hover:text-white'
    }`}
  >
    List
  </button>
  <button
    onClick={() => setViewMode('calendar')}
    className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
      viewMode === 'calendar' ? 'bg-[#adc6ff] text-[#0d141d]' : 'text-[#8b90a0] hover:text-white'
    }`}
  >
    Calendar
  </button>
</div>
```

- [ ] **Step 3: Hide the date-range picker in calendar mode**

Find the `{/* Date range */}` block in the filter card. Wrap it so it only renders when `viewMode === 'list'`:

```jsx
{viewMode === 'list' && (
  <div className="relative booking-range-picker w-full md:w-64">
    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none z-10">date_range</span>
    <DatePicker
      selectsRange
      startDate={fromISO(dateFrom)}
      endDate={fromISO(dateTo)}
      onChange={([start, end]) => {
        setDateFrom(toISO(start));
        setDateTo(toISO(end));
      }}
      isClearable
      placeholderText="Select date range"
      dateFormat="yyyy-MM-dd"
      calendarClassName="booking-range-cal"
      popperPlacement="bottom-start"
      monthsShown={2}
    />
  </div>
)}
```

- [ ] **Step 4: Render the correct view**

Find the empty-state and list-render blocks (the `{!loading && filteredBookings.length === 0 && ...}` and `{!loading && filteredBookings.length > 0 && (<BookingsListView ... />)}` sections). Replace them with:

```jsx
{/* Empty (list mode only — calendar shows empty grid by design) */}
{!loading && viewMode === 'list' && filteredBookings.length === 0 && (
  <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-[#151c25] border border-[#414755]/30 flex items-center justify-center">
      <span className="material-symbols-outlined text-3xl text-[#8b90a0]">event_busy</span>
    </div>
    <div>
      <p className="text-white font-black">No bookings found</p>
      <p className="text-[#8b90a0] text-sm font-semibold mt-1">
        {searchTerm || hasDateFilter
          ? 'Try adjusting your search or date range.'
          : 'Bookings will appear here once customers start scheduling.'}
      </p>
    </div>
  </div>
)}

{/* List view */}
{!loading && viewMode === 'list' && filteredBookings.length > 0 && (
  <BookingsListView bookings={filteredBookings} totalCount={bookings.length} />
)}

{/* Calendar view */}
{!loading && viewMode === 'calendar' && (
  <BookingsCalendarView
    bookings={filteredBookings}
    shopId={shop?.id}
    onCreated={fetchBookings}
    onUpdated={fetchBookings}
  />
)}
```

- [ ] **Step 5: Manual verification**

Run `npm run dev` and visit `/shop/bookings`.

- The List/Calendar toggle is visible at the top right.
- Default view is List (matches what was there before this task).
- Click **Calendar** → toolbar appears (prev / Today / next / month label) + a Month grid with bookings as chips on their dates.
- Reload the page — Calendar stays selected (localStorage works).
- In Calendar mode, the date-range picker is gone from the filter card; search and status dropdown still work and they affect the calendar.
- Click **Week** in the toolbar → 7-day time grid renders. Bookings appear as coloured blocks at their start time.
- Click **Day** → single-day time grid.
- Click prev/next/Today — cursor moves; cursor label updates.
- Click a booking chip / block → the QuickActionModal opens with details. Click **View full details** → routes to the action page.
- For a `Booked` booking, click **Mark Completed** → toast appears, modal closes, calendar refetches and the booking now shows as Completed (green dot/block).
- In Week or Day view, click an empty hour cell → CreateBookingModal opens with the date pre-filled (and the slot pre-selected if the shop has a slot at that hour).
- Switch back to **List** → the list/table renders with all original behaviour intact.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shop/bookings/page.js
git commit -m "feat(bookings): add list/calendar view toggle with persistence"
```

---

## Task 10: Mobile bottom sheet for Month view (cell tap → day's bookings)

Final polish — on mobile, tapping a Month cell should reveal the day's bookings as a list (already partially wired via `onMoreClick` jumping to Day view; we'll make the mobile experience match the spec by surfacing a bottom sheet instead).

**Files:**
- Modify: `frontend/src/components/Shop/Bookings/BookingsCalendarView.jsx`

- [ ] **Step 1: Add a bottom-sheet state and component inline**

Open `frontend/src/components/Shop/Bookings/BookingsCalendarView.jsx`. Import the grouping helper at the top:

```jsx
import { shiftCursor, cursorLabel, groupBookingsByDate, toISO, format } from "./calendar/utils";
```

Add new state alongside the existing state:

```jsx
const [daySheet, setDaySheet] = useState(null); // Date | null
```

Replace the existing `handleMonthMore` so on mobile it opens the sheet, on desktop it switches to Day view:

```jsx
const handleMonthMore = (date) => {
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    setDaySheet(date);
  } else {
    setSubView("day");
    setCursorDate(date);
  }
};
```

Then, just before the closing `</div>` of the component (after the `<CreateBookingModal />`), add the bottom sheet:

```jsx
{daySheet && (
  <div className="fixed inset-0 z-[80] flex items-end bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setDaySheet(null)}>
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-h-[70vh] flex flex-col bg-[#151c25] rounded-t-2xl border-t border-[#414755]/30"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#414755]/30">
        <div>
          <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Bookings</p>
          <h3 className="text-base font-black text-white tracking-tight">{format(daySheet, "EEEE, MMM d")}</h3>
        </div>
        <button
          onClick={() => setDaySheet(null)}
          className="size-9 rounded-xl bg-[#19202a] hover:bg-[#242a34] text-[#8b90a0] hover:text-white flex items-center justify-center transition-all"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {(groupBookingsByDate(bookings).get(toISO(daySheet)) || []).map((b) => {
          const customerName = b.customer?.name || b.customer_name || "Guest";
          return (
            <button
              key={b.id}
              onClick={() => { setDaySheet(null); setQuickBooking(b); }}
              className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl bg-[#080f17] border border-[#414755]/30 hover:border-[#adc6ff]/40 transition-all text-left"
            >
              <div>
                <p className="text-xs font-bold text-white">{b.start_time || "—"} · {customerName}</p>
                <p className="text-[10px] text-[#8b90a0] mt-0.5 font-semibold">{b.booking_reference} · {b.status}</p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#8b90a0]">chevron_right</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Manual verification**

In the dev server, switch to a mobile viewport (DevTools device toolbar). In Calendar > Month view, tap a day cell with bookings. The bottom sheet slides up listing that day's bookings. Tap a booking row → QuickActionModal opens with that booking. Close. Tap an empty cell → no sheet.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Shop/Bookings/BookingsCalendarView.jsx
git commit -m "feat(bookings): add mobile day bottom-sheet for month view"
```

---

## Task 11: Final end-to-end manual verification

Go through the full Acceptance Criteria from the spec and confirm each:

- [ ] **Step 1: Acceptance walk-through**

Run the dev server and confirm each item in turn (these are the ACs from `docs/superpowers/specs/2026-04-26-bookings-calendar-view-design.md`):

1. List/Calendar toggle visible; selection persists across reloads.
2. Calendar Month/Week/Day toggle works; selection persists across reloads.
3. Toolbar prev / Today / next moves cursor correctly per sub-view.
4. Search and status filters affect both views; date-range picker is hidden in calendar mode.
5. Clicking any booking opens QuickActionModal with correct details.
6. Mark Completed / Mark Cancelled on a Booked booking updates the calendar without page reload.
7. View full details routes to `/shop/bookings/action?id=...`.
8. In Week/Day, clicking an empty hour cell opens CreateBookingModal with date (and matching slot, if available) pre-filled.
9. After creating from a slot click, calendar refetches and the new booking appears.
10. On mobile: Month shows status dots; tapping a cell with bookings opens a bottom sheet; Week scrolls horizontally; Day is full-width.

If any item fails, fix in place and commit a small follow-up before declaring done.

- [ ] **Step 2: Final commit (if any fixes)**

```bash
# Only if Step 1 surfaced any tweaks
git add -A
git commit -m "fix(bookings): address calendar-view AC follow-ups"
```

---

## Done

The bookings page now has a fully working calendar view with three sub-views, in-place quick actions, click-to-create on empty slots, and persisted preferences. No new dependencies were added. The list view continues to work exactly as before.
