# Staffing Phase 1 — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the multi-staff backend in the shop dashboard: admin can manage staff, every booking shows its assigned staff (or a "Queued" badge), the bookings page can filter by staff, and the booking action modal supports manual reassignment.

**Architecture:** A new `/shop/staff` page for CRUD. Two existing components get small extensions: `BookingsListView` and `BookingsCalendarView` (and its `DayGrid`/`WeekGrid`/`MonthGrid` children) gain a staff label on each card. The bookings page gains a staff filter dropdown and a "Queued" status option. The `BookingQuickActionModal` gets a "Reassign staff" action that calls `POST /api/booking/{id}/reassign`.

**Tech Stack:** Next.js 16 App Router (React 19), Tailwind 4, axios via `@/utils/api`, sweetalert2 via `@/utils/alerts`, lucide-react and Material Symbols outlined for icons.

**Scope of this plan:** `frontend/` only — admin-facing pages and components. Customer-facing UI doesn't change in this phase. Backend was shipped in `2026-04-30-staffing-phase-1-backend.md`. Mobile (React Native) is a separate plan.

**Spec:** [docs/superpowers/specs/2026-04-30-staffing-phase-1-design.md](../specs/2026-04-30-staffing-phase-1-design.md)

**Backend API the frontend consumes:**
- `GET /api/shops/{shop_id}/staff` → `{ data: [Staff] }`
- `POST /api/shops/{shop_id}/staff` body `{ name, is_active? }` → `{ data: Staff }`
- `PUT /api/shops/{shop_id}/staff/{staff_id}` body `{ name?, is_active? }` → `{ data: Staff }`
- `DELETE /api/shops/{shop_id}/staff/{staff_id}` (soft-deactivate) → `{ data: Staff }`
- `POST /api/booking/{booking_id}/reassign` body `{ staff_id }` → `{ data: Booking }` (409 on conflict)
- Booking objects from `/shop/all-bookings` already include `staff_id` (and the backend will need to eager-load `.staff` for the name — call this out as a backend follow-up if missing).

**Design simplification noted vs spec §5:** The spec describes the calendar day view "grouped by staff (column per staff)". This plan ships Phase 1 with a simpler treatment — staff name as a badge on each booking card plus a staff filter dropdown — and defers per-staff columns to a Phase 2 calendar refactor. Rationale: avoids a structural rewrite of `DayGrid.jsx` while still giving the admin all the information they need.

**Testing approach:** The frontend has no test runner configured (per `CLAUDE.md`). Verification is manual: each task ends with a "smoke test in browser" step. The implementer must start `npm run dev` and click through the affected pages.

---

## File Structure

| Path | Status | Responsibility |
|---|---|---|
| `frontend/src/app/shop/staff/page.js` | Create | Thin page wrapper |
| `frontend/src/components/Shop/StaffList.jsx` | Create | Full staff CRUD UI (list + inline add form + edit modal + active toggle) |
| `frontend/src/app/shop/layout.js` | Modify | Add "Staff" nav item |
| `frontend/src/components/Shop/Bookings/BookingsListView.jsx` | Modify | Show assigned staff name (or "Queued" badge) per row |
| `frontend/src/components/Shop/Bookings/calendar/DayGrid.jsx` | Modify | Show staff name on each booking block |
| `frontend/src/components/Shop/Bookings/calendar/WeekGrid.jsx` | Modify | Show staff name on each booking block |
| `frontend/src/components/Shop/Bookings/calendar/MonthGrid.jsx` | Modify | Show staff initial on each booking pill |
| `frontend/src/app/shop/bookings/page.js` | Modify | Add "Queued" status filter option, add staff filter dropdown |
| `frontend/src/components/Shop/Bookings/BookingQuickActionModal.jsx` | Modify | Add "Reassign staff" action (dropdown + API call) |

No new context files, no new utility files. The existing `@/utils/api` and `@/utils/alerts` cover all I/O.

---

## Task 1: Staff management page (CRUD)

**Files:**
- Create: `frontend/src/app/shop/staff/page.js`
- Create: `frontend/src/components/Shop/StaffList.jsx`

This task ships a working `/shop/staff` page with no dependency on changes elsewhere, so it can land independently.

- [ ] **Step 1.1: Create the page wrapper**

Create `frontend/src/app/shop/staff/page.js`:

```jsx
"use client";

import StaffList from "@/components/Shop/StaffList";

export default function StaffPage() {
  return <StaffList />;
}
```

- [ ] **Step 1.2: Create the `StaffList` component**

Create `frontend/src/components/Shop/StaffList.jsx`:

```jsx
"use client";

import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import { useShop } from "@/context/ShopContext";
import { notify } from "@/utils/alerts";

export default function StaffList() {
  const { shop } = useShop();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [busyRow, setBusyRow] = useState(null);

  useEffect(() => {
    if (shop?.id) fetchStaff();
  }, [shop?.id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/shops/${shop.id}/staff`);
      setStaff(data.data || []);
    } catch (e) {
      console.error("Error fetching staff:", e);
      await notify({ icon: "error", title: "Error", text: "Failed to load staff" });
    } finally {
      setLoading(false);
    }
  };

  const addStaff = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post(`/shops/${shop.id}/staff`, { name: newName.trim() });
      setStaff((s) => [...s, data.data]);
      setNewName("");
    } catch (e) {
      await notify({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Could not add staff",
      });
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditingName(s.name);
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;
    setBusyRow(id);
    try {
      const { data } = await api.put(`/shops/${shop.id}/staff/${id}`, {
        name: editingName.trim(),
      });
      setStaff((s) => s.map((x) => (x.id === id ? data.data : x)));
      setEditingId(null);
    } catch (e) {
      await notify({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Could not save",
      });
    } finally {
      setBusyRow(null);
    }
  };

  const toggleActive = async (s) => {
    setBusyRow(s.id);
    try {
      const { data } = await api.put(`/shops/${shop.id}/staff/${s.id}`, {
        is_active: !s.is_active,
      });
      setStaff((arr) => arr.map((x) => (x.id === s.id ? data.data : x)));
    } catch (e) {
      await notify({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Could not toggle",
      });
    } finally {
      setBusyRow(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dce3f0] pb-28 md:pb-10">
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Staff</h2>
            <p className="text-[#8b90a0] font-semibold mt-1 text-sm">
              {staff.length > 0
                ? `${staff.length} member${staff.length !== 1 ? "s" : ""} on the team.`
                : "Add the people who handle bookings."}
            </p>
          </div>
        </div>

        {/* Add form */}
        <form
          onSubmit={addStaff}
          className="bg-[#151c25] rounded-xl p-4 md:p-5 border border-[#414755]/20 flex gap-3"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New staff name (e.g. Ali)"
            className="flex-1 h-11 bg-[#080f17] border border-[#414755]/40 rounded-xl px-4 text-sm font-semibold text-white placeholder:text-[#8b90a0] focus:ring-2 focus:ring-[#4b8eff]/20 focus:border-[#4b8eff]/40 outline-none"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="h-11 px-4 rounded-xl bg-[#4b8eff] hover:bg-[#4b8eff]/90 disabled:opacity-50 text-sm font-black text-white"
          >
            {adding ? "Adding…" : "Add staff"}
          </button>
        </form>

        {/* List */}
        <div className="bg-[#19202a] rounded-xl border border-[#414755]/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#8b90a0] text-sm font-semibold">Loading…</div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center text-[#8b90a0] text-sm font-semibold">
              No staff yet. Add one above.
            </div>
          ) : (
            <ul className="divide-y divide-[#414755]/10">
              {staff.map((s) => (
                <li key={s.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2e353f] flex items-center justify-center font-bold text-sm text-[#4b8eff] shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>

                  {editingId === s.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(s.id)}
                      autoFocus
                      className="flex-1 h-9 bg-[#080f17] border border-[#414755]/40 rounded-lg px-3 text-sm font-semibold text-white"
                    />
                  ) : (
                    <p className="flex-1 text-sm font-bold text-white">{s.name}</p>
                  )}

                  <span
                    className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                      s.is_active
                        ? "bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20"
                        : "bg-[#414755]/40 text-[#8b90a0] border border-[#414755]/30"
                    }`}
                  >
                    {s.is_active ? "Active" : "Inactive"}
                  </span>

                  {editingId === s.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(s.id)}
                        disabled={busyRow === s.id}
                        className="h-8 px-3 rounded-lg bg-[#4b8eff] text-[11px] font-black text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="h-8 px-3 rounded-lg bg-[#2e353f] text-[11px] font-black text-[#dce3f0]"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(s)}
                        className="h-8 px-3 rounded-lg bg-[#2e353f] text-[11px] font-black text-[#dce3f0] hover:bg-[#414755]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(s)}
                        disabled={busyRow === s.id}
                        className={`h-8 px-3 rounded-lg text-[11px] font-black ${
                          s.is_active
                            ? "bg-[#414755]/40 text-[#8b90a0] hover:bg-[#414755]"
                            : "bg-[#4edea3]/20 text-[#4edea3] hover:bg-[#4edea3]/30"
                        }`}
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 1.3: Smoke test in browser**

```bash
cd frontend && npm run dev
```

Then in a logged-in shop browser session:
1. Navigate to `http://localhost:3000/shop/staff`.
2. Add a staff "Ali". Confirm the row appears with "Active" badge.
3. Add a staff "Sara".
4. Click "Edit" on Ali, change name to "Ali B.", press Save. Row updates.
5. Click "Deactivate" on Ali. Badge flips to "Inactive", button label flips to "Activate".
6. Click "Activate" on Ali. Flips back.
7. Reload the page. List repopulates from API.

**Expected:** all interactions work; backend `staff` table reflects changes (verify with `php artisan tinker --execute='echo json_encode(\App\Models\Staff::all()->toArray(), JSON_PRETTY_PRINT) . "\n";'` if needed).

If a step fails, **stop and report** rather than guessing.

- [ ] **Step 1.4: Commit (do NOT push)**

The user's preference: stage the two created files only, no commit. **For now, leave the changes uncommitted.** When the entire frontend plan is done, the user will choose what to commit and when.

```bash
# DO NOT commit yet — user is reviewing as we go.
git status frontend/src/app/shop/staff frontend/src/components/Shop/StaffList.jsx
```

Just verify the files are present and report.

---

## Task 2: Add "Staff" link to shop sidebar nav

**Files:**
- Modify: `frontend/src/app/shop/layout.js`

- [ ] **Step 2.1: Add the nav item**

In `frontend/src/app/shop/layout.js`, find `SHOP_NAV_ITEMS` (around line 8). Currently:

```js
const SHOP_NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", path: "/shop/dashboard" },
  { label: "Bookings", icon: "calendar_today", path: "/shop/bookings" },
  { label: "Services", icon: "inventory_2", path: "/shop/catalogs" },
  { label: "Working Hours", icon: "schedule", path: "/shop/working_hours" },
  { label: "Profile", icon: "person", path: "/shop/profile" },
];
```

Replace with (adding a new entry between Services and Working Hours):

```js
const SHOP_NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", path: "/shop/dashboard" },
  { label: "Bookings", icon: "calendar_today", path: "/shop/bookings" },
  { label: "Services", icon: "inventory_2", path: "/shop/catalogs" },
  { label: "Staff", icon: "groups", path: "/shop/staff" },
  { label: "Working Hours", icon: "schedule", path: "/shop/working_hours" },
  { label: "Profile", icon: "person", path: "/shop/profile" },
];
```

- [ ] **Step 2.2: Smoke test**

Reload `http://localhost:3000/shop/dashboard` (or any shop page). Confirm:
- The desktop sidebar shows "Staff" with the people icon, between "Services" and "Working Hours".
- Clicking it goes to `/shop/staff` and the link shows the active highlight.
- Hover state works.

---

## Task 3: Show assigned staff name on bookings list view

**Files:**
- Modify: `frontend/src/components/Shop/Bookings/BookingsListView.jsx`

The list view already has columns Customer, Service, Date & Time, Status, Amount, Action. Add staff next to the Customer cell (under the booking reference, where `customer_whatsapp` already is) so we don't break the column layout.

- [ ] **Step 3.1: Add a "Staff" line under the customer name**

In `BookingsListView.jsx`, locate the `<td>` containing the customer cell — it has the inner `<p className="text-[10px] text-[#8b90a0] font-medium">` showing the booking reference and whatsapp. Right after the closing `</p>` of that block, add:

```jsx
<p className="text-[10px] text-[#8b90a0] font-medium mt-0.5">
  {booking.staff?.name ? (
    <span>
      <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">person</span>
      <span className="align-middle">{booking.staff.name}</span>
    </span>
  ) : booking.staff_id == null && booking.status === "Booked" ? null : booking.staff_id == null ? (
    <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] font-bold text-[9px] uppercase tracking-wider">
      Queued — no staff
    </span>
  ) : null}
</p>
```

(Logic: if backend returned the eager-loaded `booking.staff.name`, show it. If `staff_id` is null, show the "Queued" pill — these are bookings waiting for a staff to free up. Booked bookings without staff_id shouldn't happen but we don't render anything for that edge case.)

- [ ] **Step 3.2: Add staff to the mobile card view too**

Below the desktop table block, the file has a mobile card view. Find the booking `.map(...)` block in that mobile section. After the existing `<p>` showing booking reference, add the same `<p>...</p>` snippet from Step 3.1.

- [ ] **Step 3.3: Smoke test**

In the browser, switch to the bookings page, list view. Verify each booking row shows the staff name (or the "Queued" pill if `staff_id` is null). Test on both desktop (≥768px) and a narrow viewport.

If `booking.staff.name` is empty for every row, the backend isn't eager-loading the relation. Report it as **needs backend follow-up:** the `/shop/all-bookings` controller needs `->with('staff')` (Booking model) added to its query. Don't fix that here — it's out of scope for the frontend plan.

---

## Task 4: Show assigned staff on calendar booking blocks

**Files:**
- Modify: `frontend/src/components/Shop/Bookings/calendar/DayGrid.jsx`
- Modify: `frontend/src/components/Shop/Bookings/calendar/WeekGrid.jsx`
- Modify: `frontend/src/components/Shop/Bookings/calendar/MonthGrid.jsx`

- [ ] **Step 4.1: Read the three grid files first**

Run:

```bash
cat frontend/src/components/Shop/Bookings/calendar/DayGrid.jsx | head -120
cat frontend/src/components/Shop/Bookings/calendar/WeekGrid.jsx | head -120
cat frontend/src/components/Shop/Bookings/calendar/MonthGrid.jsx | head -120
```

Locate the JSX where each booking is rendered. Each grid renders blocks that include service text and customer initials.

- [ ] **Step 4.2: Add a staff line to `DayGrid` blocks**

In `DayGrid.jsx`, find the booking-block JSX (it uses `bookingBlockStyle(...)`). Inside the block, after the existing service/customer text, add this fragment:

```jsx
{b.staff?.name && (
  <span className="block text-[10px] font-bold opacity-80 truncate">
    <span className="material-symbols-outlined text-[10px] align-middle">person</span>
    {b.staff.name}
  </span>
)}
{b.staff_id == null && (
  <span className="inline-block mt-0.5 px-1 py-0.5 rounded bg-[#f59e0b]/30 text-[#f59e0b] font-black text-[8px] uppercase tracking-wider">
    Queued
  </span>
)}
```

(Use the same `b` variable name the existing block already uses for the booking; if it's named `booking` instead, adjust to match.)

- [ ] **Step 4.3: Same for `WeekGrid`**

Apply the same fragment in the booking-block render. Week blocks are typically narrower — the `truncate` classname on the staff line will keep it from overflowing.

- [ ] **Step 4.4: For `MonthGrid`, show only an initial**

Month grid renders very small pills. Don't show the full name; show one initial:

```jsx
{b.staff?.name && (
  <span className="ml-1 text-[8px] font-black opacity-90">
    {b.staff.name.charAt(0).toUpperCase()}
  </span>
)}
{b.staff_id == null && (
  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#f59e0b] inline-block" title="Queued" />
)}
```

- [ ] **Step 4.5: Smoke test**

Switch to calendar view on `/shop/bookings`. Cycle through Day, Week, Month sub-views. In each:
- Booked bookings show their staff name (Day/Week) or initial (Month).
- Queued bookings show the orange "Queued" pill (Day/Week) or orange dot (Month).

If the staff names don't appear, same diagnosis as Task 3 — backend eager-load missing.

---

## Task 5: Add "Queued" status filter and staff filter to the bookings page

**Files:**
- Modify: `frontend/src/app/shop/bookings/page.js`

- [ ] **Step 5.1: Add "Queued" to `STATUS_FILTERS`**

In `bookings/page.js`, the `STATUS_FILTERS` array currently has All / Booked / Completed / Cancelled. Add `Queued`:

```js
const STATUS_FILTERS = [
  { label: 'All',       value: null },
  { label: 'Queued',    value: 'queued' },
  { label: 'Booked',    value: 'booked' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];
```

- [ ] **Step 5.2: Fetch staff list on page load**

Add at the top of the component, alongside other state:

```jsx
const [staffList, setStaffList] = useState([]);
const [selectedStaffId, setSelectedStaffId] = useState(null);
```

Add a new effect (placed near the existing `useEffect`s):

```jsx
useEffect(() => {
  if (!shop?.id) return;
  api.get(`/shops/${shop.id}/staff`)
    .then(({ data }) => setStaffList(data.data || []))
    .catch(() => setStaffList([]));
}, [shop?.id]);
```

- [ ] **Step 5.3: Add the staff filter dropdown to the JSX**

Find the existing status `<select>` element (the one with `STATUS_FILTERS.map(...)`). Immediately after that `<div>` containing the status filter, add a parallel `<div>` for staff:

```jsx
<div className="relative">
  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none">person</span>
  <select
    value={selectedStaffId ?? ''}
    onChange={(e) => setSelectedStaffId(e.target.value === '' ? null : Number(e.target.value))}
    className="h-11 w-full md:w-52 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-10 text-sm font-semibold text-white focus:ring-2 focus:ring-[#4b8eff]/20 focus:border-[#4b8eff]/40 outline-none transition-all appearance-none cursor-pointer [color-scheme:dark]"
  >
    <option value="">All staff</option>
    {staffList.map((s) => (
      <option key={s.id} value={s.id}>{s.name}{!s.is_active ? ' (inactive)' : ''}</option>
    ))}
  </select>
  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px] pointer-events-none">expand_more</span>
</div>
```

- [ ] **Step 5.4: Apply staff filter to `filteredBookings`**

Find the `filteredBookings = bookings.filter((b) => { ... })` block. Add a `matchStaff` clause:

```js
const filteredBookings = bookings.filter((b) => {
  const ref      = b.booking_reference?.toString().toLowerCase() ?? '';
  const customer = b.customer?.name?.toLowerCase() ?? '';
  const matchSearch = searchTerm === '' ||
    ref.includes(searchTerm.toLowerCase()) ||
    customer.includes(searchTerm.toLowerCase());

  const bDate = b.date ?? b.booking_date ?? '';
  const matchFrom = !dateFrom || bDate >= dateFrom;
  const matchTo   = !dateTo   || bDate <= dateTo;

  const matchStaff = selectedStaffId == null || b.staff_id === selectedStaffId;

  return matchSearch && matchFrom && matchTo && matchStaff;
});
```

- [ ] **Step 5.5: Smoke test**

On `/shop/bookings`:
- The status dropdown now has a "Queued" option. Selecting it shows only queued bookings (or empty if none).
- The new staff dropdown shows your staff. Selecting one filters the list/calendar to only that staff's bookings.
- "All staff" returns to showing everything.

---

## Task 6: Reassign action on the booking quick-action modal

**Files:**
- Modify: `frontend/src/components/Shop/Bookings/BookingQuickActionModal.jsx`

Add an inline staff dropdown + "Reassign" button to the modal. Visible only when status is "Booked" (no point reassigning a cancelled or completed booking).

- [ ] **Step 6.1: Read the existing modal**

```bash
cat frontend/src/components/Shop/Bookings/BookingQuickActionModal.jsx
```

Note the existing layout: customer details, status chip, action buttons (Mark completed / Cancel). Find the section with the action buttons.

- [ ] **Step 6.2: Add staff state and reassign handler**

At the top of the component (after the existing `useState`s), add:

```jsx
const [staffList, setStaffList] = useState([]);
const [reassignTo, setReassignTo] = useState("");
const [reassigning, setReassigning] = useState(false);

useEffect(() => {
  if (!open || !booking?.shop_id) return;
  api.get(`/shops/${booking.shop_id}/staff`)
    .then(({ data }) => setStaffList((data.data || []).filter((s) => s.is_active)))
    .catch(() => setStaffList([]));
}, [open, booking?.shop_id]);
```

Add the import at the top of the file:

```jsx
import { useState, useEffect } from "react";
```

(If `useEffect` isn't already imported alongside `useState`, add it. Check existing imports first.)

Add the reassign handler near `changeStatus`:

```jsx
const reassign = async () => {
  if (!reassignTo) return;
  setError(null);
  setReassigning(true);
  try {
    await api.post(`/booking/${booking.id}/reassign`, { staff_id: Number(reassignTo) });
    await notify({
      title: "Reassigned",
      text: "Staff updated.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
    onUpdated?.();
    onClose?.();
  } catch (e) {
    if (e?.response?.status === 409) {
      setError("That staff is already booked at this slot.");
    } else {
      setError(e?.response?.data?.message || e.message || "Could not reassign.");
    }
  } finally {
    setReassigning(false);
  }
};
```

- [ ] **Step 6.3: Render the reassign control**

In the JSX, below where status chip is shown but above the existing action buttons (Mark completed / Cancel), add:

```jsx
{isBooked && staffList.length > 0 && (
  <div className="bg-[#151c25] rounded-xl p-3 border border-[#414755]/20">
    <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest mb-2">Reassign staff</p>
    <div className="flex gap-2">
      <select
        value={reassignTo}
        onChange={(e) => setReassignTo(e.target.value)}
        className="flex-1 h-9 bg-[#080f17] border border-[#414755]/40 rounded-lg px-3 text-sm font-semibold text-white outline-none [color-scheme:dark]"
      >
        <option value="">Pick a staff…</option>
        {staffList.map((s) => (
          <option key={s.id} value={s.id} disabled={s.id === booking.staff_id}>
            {s.name}{s.id === booking.staff_id ? " (current)" : ""}
          </option>
        ))}
      </select>
      <button
        onClick={reassign}
        disabled={!reassignTo || reassigning}
        className="h-9 px-4 rounded-lg bg-[#4b8eff] hover:bg-[#4b8eff]/90 disabled:opacity-50 text-[11px] font-black text-white"
      >
        {reassigning ? "Saving…" : "Reassign"}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 6.4: Smoke test**

In the browser:
1. Create or have at least 2 active staff and a booked booking assigned to one of them.
2. Open the booking from the calendar / list — the quick action modal opens.
3. The "Reassign staff" section is visible (because status is Booked).
4. Pick a different staff from the dropdown. Click "Reassign". Modal closes, bookings refresh, the booking now shows the new staff.
5. Try to reassign back to the original staff who is still busy on a different booking at the same slot — confirm 409 error message displays inline ("That staff is already booked at this slot.").
6. On a Cancelled or Completed booking, the Reassign section does NOT appear.

---

## Task 7: End-to-end smoke test

This is the final verification — no code changes, just walking through the whole feature.

- [ ] **Step 7.1: Reset + scenario**

Backend should be running (`composer dev` or `php artisan serve` from `backend/`). Frontend dev server should be running (`npm run dev`).

Set up data:
1. Log in as a shop.
2. Go to `/shop/staff`. Add 2 active staff (e.g., "Ali", "Sara").
3. Go to `/shop/bookings`. Click "New booking". Create a booking for an upcoming slot.
4. Verify it appears in the list/calendar with one of the staff's name on it (load-balanced — likely Ali if both have 0 bookings).
5. Create another booking at the same slot (same date + time). Verify it gets assigned to the other staff (Sara).
6. Create a third booking at the same slot. Verify it appears with the orange "Queued" pill (no staff free).
7. Open the first booking and mark it cancelled. Verify the queued booking is now booked and assigned to Ali (the freed staff).
8. Filter the bookings page by `Staff = Ali`. Verify only Ali's bookings show.
9. Filter by `Status = Queued`. Verify the queue is now empty (since the queued one was just promoted).
10. Open one of Ali's bookings, reassign to Sara. Verify the booking moves.

- [ ] **Step 7.2: Report**

Report DONE if all steps pass. Report DONE_WITH_CONCERNS or BLOCKED with specifics if anything fails.

---

## Out-of-scope follow-ups (next plans / phases)

- **Mobile (React Native)** — staff management screen, staff filter, queue indicator, manual assign action. Tracked in `2026-04-30-staffing-phase-1-mobile.md`.
- **Backend eager-load** — the `/shop/all-bookings` and other list endpoints need `->with('staff')` so frontend can show `booking.staff.name`. If Tasks 3 and 4 reveal that staff names are missing in the response, file this as a small backend follow-up.
- **Per-staff calendar columns** — Phase 2 calendar refactor of `DayGrid` to render bookings in per-staff columns instead of a single timeline.
- **Staff capability matrix, staff login, leave/days off** — Phase 2/3.

---

## Self-review notes (run after writing this plan)

- ✅ Spec coverage:
  - Spec §5 staff CRUD page → Task 1.
  - Spec §5 calendar shows staff per booking → Task 4 (simplified to badge-on-card; documented as a deliberate Phase 1 simplification).
  - Spec §5 queue list → Task 5 (status filter + visible "Queued" pills on cards rather than a separate tab — pragmatic equivalent at this scale).
  - Spec §5 reassign action → Task 6.
  - Spec §6 customer side: no change. ✅
- ✅ Files referenced exist (verified by reading them while drafting).
- ✅ Each task ends in a manual smoke test step (no test runner exists for the frontend).
- ✅ Tasks are independently shippable; the plan deliberately defers the per-staff column refactor.
