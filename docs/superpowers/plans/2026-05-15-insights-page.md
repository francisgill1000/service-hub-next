# Customer Insights Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3-tab `/shop/insights` page (Customers / Reminders / Report) that consolidates per-customer value tracking, lapsed-customer win-back, and revenue analytics — entirely frontend-side, no backend changes.

**Architecture:** New Next.js App Router page at `frontend/src/app/shop/insights/page.js` with three tabbed sub-components in `frontend/src/components/Shop/Insights/`. Reuses the existing `GET /shops/{id}/customers` endpoint (paginated for Tab 1, bulk `per_page=1000` for Tab 2) and the existing `RevenueReport` component (Tab 3). Reminders open `https://wa.me/<number>?text=<template>` directly — no campaign tracking, no backend writes.

**Tech Stack:** Next.js 15 App Router (React 19), Tailwind CSS 4, axios via `@/utils/api`, `react-datepicker`, sweetalert2 via `@/utils/alerts`. Material Symbols Outlined icons.

**Disambiguation:** The existing `/shop/reminders` page (sidebar entry "Reminders") is about **tomorrow's appointment reminders** and is unrelated to this work. The new Reminders **tab** inside `/shop/insights` is about **win-back of lapsed customers**. Both coexist; do not touch `frontend/src/components/Shop/RemindersList.jsx` or `frontend/src/app/shop/reminders/page.js`.

**Testing:** Frontend has no test runner (see `frontend/CLAUDE.md`). Each task ends with a manual browser-verification step. Run the dev server with `npm run dev` from the repo root. Use `npm run build` after the final task to surface type/build errors.

**File map (decomposition decisions):**

```
frontend/src/app/shop/insights/page.js                              # route + tab state + sticky header (Task 1)
frontend/src/components/Shop/Insights/sendWhatsApp.js               # WA helper: tokens, stagger, popup detect (Task 2)
frontend/src/components/Shop/Insights/InsightsCustomersTab.jsx      # Tab 1 (Task 3)
frontend/src/components/Shop/Insights/ReminderTemplateEditor.jsx    # textarea + preview (Task 4)
frontend/src/components/Shop/Insights/ReminderCustomerList.jsx      # shared checkbox list (Task 4)
frontend/src/components/Shop/Insights/ReminderBucketCard.jsx        # one auto bucket card (Task 5)
frontend/src/components/Shop/Insights/InsightsRemindersTab.jsx      # Tab 2 wrapper (Task 5 + 6)
frontend/src/components/Shop/Insights/ReminderManualFilters.jsx     # manual filter card (Task 6)
frontend/src/components/Shop/Insights/InsightsReportTab.jsx         # Tab 3 (Task 7)
frontend/src/app/shop/layout.js                                     # add sidebar entry (Task 1)
```

---

## Task 1: Scaffold page + tabs shell + sidebar entry

**Files:**
- Create: `frontend/src/app/shop/insights/page.js`
- Modify: `frontend/src/app/shop/layout.js` (add nav item)

- [ ] **Step 1: Add sidebar entry**

Open `frontend/src/app/shop/layout.js`. Find the `SHOP_NAV_ITEMS` array (around line 11-23). Insert a new entry immediately after the `Reports` entry (which has `path: "/shop/reports"`):

```js
  { label: "Insights", icon: "insights", path: "/shop/insights" },
```

The array should now contain (showing only changed neighborhood):

```js
  { label: "Reports", icon: "bar_chart", path: "/shop/reports" },
  { label: "Insights", icon: "insights", path: "/shop/insights" },
  { label: "Marketing", icon: "campaign", path: "/shop/marketing" },
```

- [ ] **Step 2: Create the page scaffold**

Create `frontend/src/app/shop/insights/page.js` with the following exact contents:

```jsx
"use client";

import React, { useEffect, useState } from "react";
import { useShop } from "@/context/ShopContext";

const TABS = [
  { key: "customers", label: "Customers", icon: "group" },
  { key: "reminders", label: "Reminders", icon: "notifications_active" },
  { key: "report",    label: "Report",    icon: "analytics" },
];

const STORAGE_KEY = "admin.insights.activeTab";

export default function InsightsPage() {
  const { shop } = useShop();
  const [activeTab, setActiveTab] = useState("customers");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && TABS.some((t) => t.key === saved)) setActiveTab(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, activeTab); } catch {}
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text pb-28 md:pb-10">
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-brand-text tracking-tight">Customer Insights</h2>
            <p className="text-brand-muted font-semibold mt-1 text-sm">
              Per-customer value, win-back reminders, and revenue — all in one place.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-20 bg-brand-bg pt-2 pb-1">
          <div className="flex items-center gap-1 bg-brand-bg border border-brand-border/30 rounded-xl p-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`h-9 px-4 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === t.key
                    ? "bg-brand-primary text-white"
                    : "text-brand-muted hover:text-brand-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active tab content (placeholder for now) */}
        <div>
          {!shop?.id && (
            <p className="text-brand-muted text-sm font-semibold">Loading shop…</p>
          )}
          {shop?.id && activeTab === "customers" && (
            <div className="text-brand-muted text-sm font-semibold p-8 text-center">Customers tab coming in Task 3.</div>
          )}
          {shop?.id && activeTab === "reminders" && (
            <div className="text-brand-muted text-sm font-semibold p-8 text-center">Reminders tab coming in Task 5–6.</div>
          )}
          {shop?.id && activeTab === "report" && (
            <div className="text-brand-muted text-sm font-semibold p-8 text-center">Report tab coming in Task 7.</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Run `npm run dev` from the repo root (if not already running). Open `http://localhost:3000/shop/insights`. Expected:
- "Insights" appears in the sidebar between "Reports" and "Marketing"
- Page renders with header "Customer Insights" + subheading
- Three pill tabs: Customers (active by default), Reminders, Report
- Clicking each tab swaps the placeholder text below
- Refreshing the page restores the previously-selected tab

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/shop/layout.js frontend/src/app/shop/insights/page.js
git commit -m "feat(insights): scaffold /shop/insights page with 3-tab shell"
```

---

## Task 2: WhatsApp helper module

**Files:**
- Create: `frontend/src/components/Shop/Insights/sendWhatsApp.js`

Pure JavaScript module — no UI. Provides token resolution, single-customer send, bulk send with stagger, popup-block detection, and `contactedToday` persistence.

- [ ] **Step 1: Create the helper**

Create `frontend/src/components/Shop/Insights/sendWhatsApp.js` with exact contents:

```js
// frontend/src/components/Shop/Insights/sendWhatsApp.js
//
// Single source of truth for sending WhatsApp reminders to shop customers.
// Token resolution, popup-block detection, bulk-send stagger, and
// "contacted today" persistence all live here.

export const DEFAULT_TEMPLATE =
  "Hi {name}, it's been a while since your last visit at {shop_name}. " +
  "We'd love to see you again — book your slot here: {shop_url}";

const templateKey  = (shopId) => `admin.insights.reminderTemplate.${shopId}`;
const contactedKey = (shopId) => `admin.insights.contactedToday.${shopId}`;

export function loadTemplate(shopId) {
  if (!shopId) return DEFAULT_TEMPLATE;
  try {
    return localStorage.getItem(templateKey(shopId)) || DEFAULT_TEMPLATE;
  } catch {
    return DEFAULT_TEMPLATE;
  }
}

export function saveTemplate(shopId, template) {
  if (!shopId) return;
  try {
    localStorage.setItem(templateKey(shopId), String(template ?? DEFAULT_TEMPLATE));
  } catch {}
}

// Returns a {id: iso} map of customers contacted today (auto-clears entries >24h old).
export function loadContactedToday(shopId) {
  if (!shopId) return {};
  try {
    const raw = localStorage.getItem(contactedKey(shopId));
    if (!raw) return {};
    const obj = JSON.parse(raw);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const cleaned = {};
    for (const [id, iso] of Object.entries(obj)) {
      if (new Date(iso).getTime() >= cutoff) cleaned[id] = iso;
    }
    return cleaned;
  } catch {
    return {};
  }
}

function markContacted(shopId, customerId) {
  if (!shopId || !customerId) return;
  try {
    const map = loadContactedToday(shopId);
    map[customerId] = new Date().toISOString();
    localStorage.setItem(contactedKey(shopId), JSON.stringify(map));
  } catch {}
}

// Replace {name}, {shop_name}, {shop_url}, {last_visit}, {total_visits}
export function resolveTemplate(template, { customer, shop }) {
  const tokens = {
    "{name}":          customer?.name || "there",
    "{shop_name}":     shop?.name || "us",
    "{shop_url}":      shop?.slug
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/detail/${shop.slug}`
      : (typeof window !== "undefined" ? window.location.origin : ""),
    "{last_visit}":    customer?.last_visit_date || "—",
    "{total_visits}":  String(customer?.bookings_count ?? 0),
  };
  let out = String(template || DEFAULT_TEMPLATE);
  for (const [k, v] of Object.entries(tokens)) {
    out = out.split(k).join(v);
  }
  return out;
}

function digitsOnly(s) {
  return String(s || "").replace(/\D/g, "");
}

// Build the wa.me URL for a customer (returns null if no phone digits).
export function waUrlFor(customer, message) {
  const num = digitsOnly(customer?.whatsapp_normalized || customer?.whatsapp);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

// Open WA for one customer. Returns { ok, reason }.
// reason ∈ "no_phone" | "popup_blocked" | "ok"
export function sendOne({ customer, template, shop }) {
  const message = resolveTemplate(template, { customer, shop });
  const url = waUrlFor(customer, message);
  if (!url) return { ok: false, reason: "no_phone" };
  const win = window.open(url, "_blank");
  if (!win) return { ok: false, reason: "popup_blocked" };
  markContacted(shop?.id, customer.id);
  return { ok: true, reason: "ok" };
}

// Bulk send with 400ms stagger so the browser doesn't treat us as popup spam.
// Returns a Promise<{ sent, skipped_no_phone, blocked }>.
export async function sendBulk({ customers, template, shop, staggerMs = 400 }) {
  const result = { sent: 0, skipped_no_phone: 0, blocked: 0 };
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const r = sendOne({ customer, template, shop });
    if (r.ok) result.sent += 1;
    else if (r.reason === "no_phone") result.skipped_no_phone += 1;
    else if (r.reason === "popup_blocked") result.blocked += 1;
    if (i < customers.length - 1) {
      await new Promise((res) => setTimeout(res, staggerMs));
    }
    // If the very first open was blocked, stop early — user needs to allow popups.
    if (i === 0 && r.reason === "popup_blocked") break;
  }
  return result;
}
```

- [ ] **Step 2: Verify with a quick browser check**

This module is consumed in Task 3+. To smoke-test it now, in the browser console on any logged-in shop page run:

```js
const m = await import("/_next/static/chunks/components_Shop_Insights_sendWhatsApp.js"); // path will vary
```

This is unreliable in Next.js. Instead, just confirm the file parses by running:

```bash
cd frontend && npx eslint src/components/Shop/Insights/sendWhatsApp.js
```

Expected: no errors. If eslint isn't configured, run `node -e "require('./frontend/src/components/Shop/Insights/sendWhatsApp.js')"` (will fail because of ESM `export` — that's fine, the goal here is just confirming the file exists and is committable; the real verification happens in Task 3).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Shop/Insights/sendWhatsApp.js
git commit -m "feat(insights): add WhatsApp helper with token resolution and bulk send"
```

---

## Task 3: Customers tab

**Files:**
- Create: `frontend/src/components/Shop/Insights/InsightsCustomersTab.jsx`
- Modify: `frontend/src/app/shop/insights/page.js` (import + render)

- [ ] **Step 1: Create the Customers tab component**

Create `frontend/src/components/Shop/Insights/InsightsCustomersTab.jsx` with exact contents:

```jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { useShop } from "@/context/ShopContext";
import { loadTemplate, sendOne } from "./sendWhatsApp";

const fmtAED = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (s) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return s;
  }
};
const initialsOf = (name) =>
  String(name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const daysSince = (iso) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

const SORTS = [
  { key: "recent",  label: "Most recent visit" },
  { key: "spend",   label: "Highest spend" },
  { key: "count",   label: "Most bookings" },
  { key: "lapsed",  label: "Longest lapsed" },
];

const DATE_FILTERS = [
  { key: "all",   label: "All time" },
  { key: "30d",   label: "Last 30 days" },
  { key: "90d",   label: "Last 90 days" },
  { key: "year",  label: "This year" },
];

function inDateFilter(iso, key) {
  if (key === "all" || !iso) return key === "all";
  const d = new Date(`${iso}T00:00:00`);
  const now = new Date();
  if (key === "30d") return (now - d) <= 30 * 86400000;
  if (key === "90d") return (now - d) <= 90 * 86400000;
  if (key === "year") return d.getFullYear() === now.getFullYear();
  return true;
}

export default function InsightsCustomersTab() {
  const { shop } = useShop();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, last_page: 1, per_page: 20 });
  const [sortKey, setSortKey] = useState("recent");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => {
    if (!shop?.id) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/shops/${shop.id}/customers`, {
          params: { search, page, per_page: 20 },
        });
        if (cancelled) return;
        setCustomers(data?.data || []);
        setMeta({
          total: data?.total || 0,
          last_page: data?.last_page || 1,
          per_page: data?.per_page || 20,
        });
        setError(null);
      } catch {
        if (!cancelled) setError("Failed to load customers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [shop?.id, search, page]);

  const visible = useMemo(() => {
    const filtered = customers.filter((c) => inDateFilter(c.last_visit_date, dateFilter));
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortKey === "spend")  return Number(b.total_spent || 0) - Number(a.total_spent || 0);
      if (sortKey === "count")  return Number(b.bookings_count || 0) - Number(a.bookings_count || 0);
      if (sortKey === "lapsed") {
        const da = daysSince(a.last_visit_date) ?? Infinity;
        const db = daysSince(b.last_visit_date) ?? Infinity;
        return db - da;
      }
      // recent
      const da = a.last_visit_date || "";
      const db = b.last_visit_date || "";
      return db.localeCompare(da);
    });
    return sorted;
  }, [customers, sortKey, dateFilter]);

  const kpis = useMemo(() => {
    const bookings = visible.reduce((s, c) => s + Number(c.bookings_count || 0), 0);
    const revenue  = visible.reduce((s, c) => s + Number(c.total_spent || 0), 0);
    const avg = visible.length ? revenue / visible.length : 0;
    return { customers: visible.length, bookings, revenue, avg };
  }, [visible]);

  const sendReminder = (c) => {
    const template = loadTemplate(shop?.id);
    const r = sendOne({ customer: c, template, shop });
    if (r.reason === "no_phone") alert("This customer has no WhatsApp number.");
    else if (r.reason === "popup_blocked") alert("WhatsApp tab was blocked. Allow pop-ups for this site.");
  };

  const goToBookings = (c) => {
    const q = c.name || c.whatsapp || "";
    router.push(`/shop/bookings${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Customers"      value={meta.total}             sub="(total)" accent="#4b8eff" />
        <Kpi label="Bookings"       value={kpis.bookings}          sub="(this page)" accent="#a78bfa" />
        <Kpi label="Revenue"        value={fmtAED(kpis.revenue)}   sub="(this page)" accent="#4edea3" />
        <Kpi label="Avg lifetime"   value={fmtAED(kpis.avg)}       sub="(this page)" accent="#f59e0b" />
      </div>

      {/* Controls */}
      <div className="bg-brand-surface rounded-xl p-4 border border-brand-border/20 space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-[20px] pointer-events-none">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or WhatsApp number"
            className="w-full h-12 bg-brand-bg border border-brand-border/30 rounded-xl pl-12 pr-4 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={sortKey} onChange={setSortKey} options={SORTS} icon="sort" />
          <Select value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS} icon="event" />
        </div>
      </div>

      {/* States */}
      {loading && <Empty msg="Loading customers…" />}
      {!loading && error && <Empty msg={error} tone="error" />}
      {!loading && !error && visible.length === 0 && (
        <Empty msg={search ? "No customers match that search." : "No customers yet."} />
      )}

      {/* Desktop table */}
      {!loading && !error && visible.length > 0 && (
        <>
          <div className="hidden md:block bg-brand-surface rounded-xl overflow-hidden border border-brand-border shadow-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-elevated border-b border-brand-border">
                  <Th>Customer</Th>
                  <Th>Bookings</Th>
                  <Th>Last visit</Th>
                  <Th>First visit</Th>
                  <Th className="text-right">Total spent</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {visible.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-elevated transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center font-bold text-xs text-brand-primary shrink-0">
                          {initialsOf(c.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-brand-text truncate">{c.name || "Unnamed customer"}</p>
                          <p className="text-[10px] text-brand-success font-semibold truncate mt-0.5">{c.whatsapp}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-black">
                        {c.bookings_count}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-brand-text">{fmtDate(c.last_visit_date)}</p>
                      {daysSince(c.last_visit_date) != null && (
                        <p className="text-[10px] text-brand-muted mt-0.5">{daysSince(c.last_visit_date)} days ago</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-brand-text">{fmtDate(c.first_visit_date)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-sm font-black text-brand-success">{fmtAED(c.total_spent)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => goToBookings(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => sendReminder(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <span className="material-symbols-outlined text-[12px]">send</span>
                          Remind
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-brand-border bg-brand-elevated flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-brand-muted">
                Showing {visible.length} of {meta.total}
              </p>
              <Pager page={page} lastPage={meta.last_page} setPage={setPage} />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {visible.map((c) => (
              <div key={c.id} className="bg-brand-surface rounded-xl p-4 border border-brand-border/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-brand-primary/10 flex items-center justify-center font-bold text-sm text-brand-primary shrink-0">
                    {initialsOf(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-brand-text truncate">{c.name || "Unnamed customer"}</p>
                    <p className="text-[11px] text-brand-success font-semibold truncate mt-0.5">{c.whatsapp}</p>
                  </div>
                  <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-black shrink-0">
                    {c.bookings_count}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-border/20">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Last visit</p>
                    <p className="text-xs font-semibold text-brand-text mt-0.5">{fmtDate(c.last_visit_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Total spent</p>
                    <p className="text-xs font-black text-brand-success mt-0.5">{fmtAED(c.total_spent)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => goToBookings(c)}
                    className="flex-1 h-10 rounded-xl bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest"
                  >View bookings</button>
                  <button
                    type="button"
                    onClick={() => sendReminder(c)}
                    className="flex-1 h-10 rounded-xl bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    Send reminder
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-brand-surface rounded-xl border border-brand-border/20 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold text-brand-muted">{visible.length} of {meta.total}</p>
              <Pager page={page} lastPage={meta.last_page} setPage={setPage} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div className="bg-brand-elevated border border-brand-border/30 rounded-2xl p-4" style={{ boxShadow: `inset 3px 0 0 0 ${accent}` }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</p>
      <p className="text-xl md:text-2xl font-black text-brand-text mt-1">{value}</p>
      {sub && <p className="text-[10px] text-brand-muted font-semibold mt-1">{sub}</p>}
    </div>
  );
}

function Select({ value, onChange, options, icon }) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-[18px] pointer-events-none">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full md:w-56 bg-brand-bg border border-brand-border/40 rounded-xl pl-11 pr-10 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all appearance-none cursor-pointer [color-scheme:dark]"
      >
        {options.map((o) => (<option key={o.key} value={o.key}>{o.label}</option>))}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted text-[20px] pointer-events-none">expand_more</span>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest ${className}`}>{children}</th>;
}

function Empty({ msg, tone }) {
  return (
    <div className={`bg-brand-elevated rounded-xl border border-brand-border/20 py-16 text-center text-sm font-semibold ${tone === "error" ? "text-red-400" : "text-brand-muted"}`}>
      {msg}
    </div>
  );
}

function Pager({ page, lastPage, setPage }) {
  if (lastPage <= 1) return null;
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
        className="h-9 w-9 rounded-lg bg-brand-elevated hover:bg-brand-hover text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Previous page">
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
      </button>
      <span className="text-[11px] text-brand-muted font-bold whitespace-nowrap">{page} / {lastPage}</span>
      <button type="button" onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage}
        className="h-9 w-9 rounded-lg bg-brand-elevated hover:bg-brand-hover text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Next page">
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire the tab into the page**

Edit `frontend/src/app/shop/insights/page.js`. Add this import after the existing imports:

```js
import InsightsCustomersTab from "@/components/Shop/Insights/InsightsCustomersTab";
```

Then replace the existing block:

```jsx
          {shop?.id && activeTab === "customers" && (
            <div className="text-brand-muted text-sm font-semibold p-8 text-center">Customers tab coming in Task 3.</div>
          )}
```

with:

```jsx
          {shop?.id && activeTab === "customers" && <InsightsCustomersTab />}
```

- [ ] **Step 3: Verify in browser**

Navigate to `/shop/insights` with the Customers tab active. Expected:
- 4 KPI cards across the top
- Search input + Sort dropdown + Date filter dropdown
- Table of customers (desktop) or card list (mobile)
- Each row has "View" and "Remind" buttons
- Clicking Remind opens a `wa.me` tab with the template populated
- Switching sort reorders the visible page
- Date filter narrows the list
- Search debounces and resets pagination
- "View" navigates to `/shop/bookings?search=<name>`

If you have no customers with a `whatsapp_normalized`, clicking Remind alerts "no WhatsApp number" — that's expected.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/shop/insights/page.js frontend/src/components/Shop/Insights/InsightsCustomersTab.jsx
git commit -m "feat(insights): customers tab with sort, date filter, per-row reminder"
```

---

## Task 4: Template editor + shared customer list

**Files:**
- Create: `frontend/src/components/Shop/Insights/ReminderTemplateEditor.jsx`
- Create: `frontend/src/components/Shop/Insights/ReminderCustomerList.jsx`

These two components are consumed by both Section A (Task 5) and Section B (Task 6) of the Reminders tab.

- [ ] **Step 1: Create the template editor**

Create `frontend/src/components/Shop/Insights/ReminderTemplateEditor.jsx`:

```jsx
"use client";

import React, { useEffect, useState } from "react";
import { useShop } from "@/context/ShopContext";
import { DEFAULT_TEMPLATE, loadTemplate, saveTemplate, resolveTemplate } from "./sendWhatsApp";

const TOKENS = ["{name}", "{shop_name}", "{shop_url}", "{last_visit}", "{total_visits}"];

export default function ReminderTemplateEditor({ sampleCustomer, onChange }) {
  const { shop } = useShop();
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shop?.id) return;
    const t = loadTemplate(shop.id);
    setTemplate(t);
    onChange?.(t);
  }, [shop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (next) => {
    setTemplate(next);
    saveTemplate(shop?.id, next);
    onChange?.(next);
  };

  const preview = resolveTemplate(template, { customer: sampleCustomer, shop });

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-brand-elevated transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-muted text-[18px]">edit_note</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-brand-text">Reminder template</span>
        </div>
        <span className="material-symbols-outlined text-brand-muted text-[20px]">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-brand-border/20 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => persist(`${template}${template.endsWith(" ") ? "" : " "}${t}`)}
                className="px-2 py-1 rounded-md bg-brand-bg border border-brand-border/40 text-[10px] font-bold text-brand-muted hover:text-brand-primary hover:border-brand-primary/40 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            value={template}
            onChange={(e) => persist(e.target.value)}
            rows={4}
            className="w-full bg-brand-bg border border-brand-border/30 rounded-xl px-4 py-3 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all resize-y"
          />
          <button
            type="button"
            onClick={() => persist(DEFAULT_TEMPLATE)}
            className="text-[10px] font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
          >
            Reset to default
          </button>
          <div className="bg-brand-bg border border-brand-border/30 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">Preview</p>
            <p className="text-sm text-brand-text whitespace-pre-wrap font-medium">{preview}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the shared customer list**

Create `frontend/src/components/Shop/Insights/ReminderCustomerList.jsx`:

```jsx
"use client";

import React, { useMemo, useState } from "react";
import { useShop } from "@/context/ShopContext";
import { sendBulk, loadContactedToday } from "./sendWhatsApp";
import { notify } from "@/utils/alerts";

const fmtAED = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (s) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return s; }
};

export default function ReminderCustomerList({ customers, template, emptyMsg = "No customers." }) {
  const { shop } = useShop();
  const [selected, setSelected] = useState(() => new Set());
  const [sending, setSending] = useState(false);
  const contacted = useMemo(() => loadContactedToday(shop?.id), [shop?.id, sending]);

  const allIds = customers.map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allIds.every((id) => prev.has(id))) return new Set();
      return new Set(allIds);
    });
  };
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const send = async () => {
    const chosen = customers.filter((c) => selected.has(c.id));
    if (chosen.length === 0) return;
    const result = await notify({
      icon: "warning",
      title: `Send ${chosen.length} reminders?`,
      text: `WhatsApp will open ${chosen.length} tab${chosen.length !== 1 ? "s" : ""} — one per customer. Allow pop-ups for this site if prompted.`,
      showCancelButton: true,
      confirmButtonText: "Send all",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setSending(true);
    const r = await sendBulk({ customers: chosen, template, shop });
    setSending(false);
    setSelected(new Set());
    let msg = `Opened ${r.sent} WhatsApp tab${r.sent === 1 ? "" : "s"}. You need to press Send in each one.`;
    if (r.skipped_no_phone) msg += ` ${r.skipped_no_phone} skipped (no WhatsApp).`;
    if (r.blocked)          msg += ` ${r.blocked} blocked — allow pop-ups and retry.`;
    await notify({ icon: r.blocked ? "error" : "success", title: "Reminders sent", text: msg });
  };

  if (customers.length === 0) {
    return <p className="text-brand-muted text-sm font-semibold p-6 text-center">{emptyMsg}</p>;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="size-4 rounded border-brand-border accent-brand-primary"
          />
          <span className="text-[11px] font-black uppercase tracking-widest text-brand-text">
            {selected.size === 0 ? "Select all" : `${selected.size} selected`}
          </span>
        </label>
        <button
          type="button"
          onClick={send}
          disabled={sending || selected.size === 0}
          className="h-10 px-4 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
          {sending ? "Sending…" : `Send to ${selected.size || "selected"}`}
        </button>
      </div>

      {/* List */}
      <div className="bg-brand-bg border border-brand-border/30 rounded-xl divide-y divide-brand-border/20">
        {customers.map((c) => {
          const wasContacted = !!contacted[c.id];
          return (
            <label key={c.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-brand-elevated transition-colors">
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggleOne(c.id)}
                className="size-4 rounded border-brand-border accent-brand-primary shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-brand-text truncate">{c.name || "Unnamed"}</p>
                  {wasContacted && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-success bg-brand-success/10 border border-brand-success/30 px-1.5 py-0.5 rounded">Sent today</span>
                  )}
                </div>
                <p className="text-[11px] text-brand-success font-semibold truncate">{c.whatsapp || "(no WhatsApp)"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-bold text-brand-text">{fmtDate(c.last_visit_date)}</p>
                <p className="text-[11px] font-black text-brand-success">{fmtAED(c.total_spent)}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the files parse**

Run from the repo root:

```bash
cd frontend && npx next build --no-lint 2>&1 | head -40
```

If `next build` doesn't fail here, the files compile. If it does fail, fix the syntax error reported and re-run.

(You can skip this if you'll just verify in Task 5 when these components first render.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Shop/Insights/ReminderTemplateEditor.jsx frontend/src/components/Shop/Insights/ReminderCustomerList.jsx
git commit -m "feat(insights): reminder template editor and shared customer list"
```

---

## Task 5: Reminders tab — Section A (auto buckets)

**Files:**
- Create: `frontend/src/components/Shop/Insights/ReminderBucketCard.jsx`
- Create: `frontend/src/components/Shop/Insights/InsightsRemindersTab.jsx` (Section A only; Section B added in Task 6)
- Modify: `frontend/src/app/shop/insights/page.js` (wire tab)

- [ ] **Step 1: Create the bucket card**

Create `frontend/src/components/Shop/Insights/ReminderBucketCard.jsx`:

```jsx
"use client";

import React from "react";

const fmtAED = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function ReminderBucketCard({ label, count, lifetimeValue, active, onClick, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left bg-brand-surface border rounded-2xl p-4 transition-all ${
        active
          ? "border-brand-primary shadow-md shadow-brand-primary/10"
          : "border-brand-border/20 hover:border-brand-border/60"
      }`}
      style={!active ? { boxShadow: `inset 3px 0 0 0 ${accent}` } : undefined}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">{label}</p>
      <p className="text-2xl font-black text-brand-text mt-1.5">{count}</p>
      <p className="text-[11px] font-semibold text-brand-muted mt-1">
        {fmtAED(lifetimeValue)} lifetime value at risk
      </p>
      <span className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${active ? "text-brand-primary" : "text-brand-muted"}`}>
        Review & send
        <span className="material-symbols-outlined text-[14px]">{active ? "expand_less" : "expand_more"}</span>
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Create the Reminders tab (Section A only)**

Create `frontend/src/components/Shop/Insights/InsightsRemindersTab.jsx`:

```jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import { useShop } from "@/context/ShopContext";
import { DEFAULT_TEMPLATE, loadTemplate } from "./sendWhatsApp";
import ReminderTemplateEditor from "./ReminderTemplateEditor";
import ReminderCustomerList   from "./ReminderCustomerList";
import ReminderBucketCard     from "./ReminderBucketCard";

const daysSince = (iso) => {
  if (!iso) return Infinity;
  const ms = Date.now() - new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(ms)) return Infinity;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

const BUCKETS = [
  { key: "30",  label: "Lapsed 30+",  min: 30,  max: 60,       accent: "#f59e0b" },
  { key: "60",  label: "Lapsed 60+",  min: 60,  max: 90,       accent: "#fb7185" },
  { key: "90",  label: "Lapsed 90+",  min: 90,  max: Infinity, accent: "#ef4444" },
];

export default function InsightsRemindersTab() {
  const { shop } = useShop();
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [activeBucket, setActiveBucket] = useState(null);
  const [showTruncationWarning, setShowTruncationWarning] = useState(false);

  useEffect(() => {
    if (!shop?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/shops/${shop.id}/customers`, { params: { per_page: 1000 } });
        if (cancelled) return;
        setAllCustomers(data?.data || []);
        setShowTruncationWarning((data?.total || 0) > 1000);
        setError(null);
      } catch {
        if (!cancelled) setError("Failed to load customers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shop?.id]);

  useEffect(() => {
    if (shop?.id) setTemplate(loadTemplate(shop.id));
  }, [shop?.id]);

  const bucketed = useMemo(() => {
    const out = { "30": [], "60": [], "90": [] };
    for (const c of allCustomers) {
      const d = daysSince(c.last_visit_date);
      if (d === Infinity) {
        out["90"].push(c);
        continue;
      }
      if (d >= 30 && d < 60)  out["30"].push(c);
      else if (d >= 60 && d < 90) out["60"].push(c);
      else if (d >= 90) out["90"].push(c);
    }
    return out;
  }, [allCustomers]);

  const sampleCustomer = useMemo(() => {
    return (
      bucketed["30"][0] ||
      bucketed["60"][0] ||
      bucketed["90"][0] ||
      allCustomers[0] ||
      { name: "Sample Customer", last_visit_date: "2026-02-01", bookings_count: 3, whatsapp: "+971500000000" }
    );
  }, [bucketed, allCustomers]);

  const sumLV = (list) => list.reduce((s, c) => s + Number(c.total_spent || 0), 0);

  if (loading) return <div className="text-brand-muted text-sm font-semibold p-12 text-center">Loading customers…</div>;
  if (error)   return <div className="text-red-400 text-sm font-semibold p-12 text-center">{error}</div>;

  return (
    <div className="space-y-5">
      {showTruncationWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[12px] font-semibold text-amber-400">
          Showing first 1000 customers. Use the manual section below to filter further.
        </div>
      )}

      {/* Template editor */}
      <ReminderTemplateEditor sampleCustomer={sampleCustomer} onChange={setTemplate} />

      {/* Section A — Auto buckets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-muted">Auto-suggested win-back</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {BUCKETS.map((b) => (
            <ReminderBucketCard
              key={b.key}
              label={b.label}
              count={bucketed[b.key].length}
              lifetimeValue={sumLV(bucketed[b.key])}
              active={activeBucket === b.key}
              onClick={() => setActiveBucket((cur) => (cur === b.key ? null : b.key))}
              accent={b.accent}
            />
          ))}
        </div>
        {activeBucket && (
          <div className="bg-brand-surface border border-brand-border/20 rounded-xl p-4">
            <ReminderCustomerList
              customers={bucketed[activeBucket]}
              template={template}
              emptyMsg="No customers in this bucket."
            />
          </div>
        )}
      </div>

      {/* Section B — placeholder for Task 6 */}
      <div className="text-brand-muted text-sm font-semibold p-6 text-center border border-dashed border-brand-border/40 rounded-xl">
        Manual reminder builder — coming in Task 6.
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire the tab into the page**

Edit `frontend/src/app/shop/insights/page.js`. Add this import:

```js
import InsightsRemindersTab from "@/components/Shop/Insights/InsightsRemindersTab";
```

Replace the existing placeholder block:

```jsx
          {shop?.id && activeTab === "reminders" && (
            <div className="text-brand-muted text-sm font-semibold p-8 text-center">Reminders tab coming in Task 5–6.</div>
          )}
```

with:

```jsx
          {shop?.id && activeTab === "reminders" && <InsightsRemindersTab />}
```

- [ ] **Step 4: Verify in browser**

Navigate to `/shop/insights` → Reminders tab. Expected:
- Template editor card at top (collapsed). Click it — expands with token chips, textarea, preview.
- Three bucket cards: "Lapsed 30+", "Lapsed 60+", "Lapsed 90+". Each shows a count and lifetime value.
- Click a bucket — expands an inline panel below the cards with a checkbox list of customers in that bucket.
- Select 1–3 customers, click "Send to N" — confirmation dialog → on confirm, opens that many WhatsApp tabs (one every ~400ms) with the template populated.
- After sending, a "Sent today" badge appears on those customers in the list.
- Refresh — the "Sent today" badge persists for 24h.
- Section B shows the placeholder text.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Shop/Insights/ReminderBucketCard.jsx frontend/src/components/Shop/Insights/InsightsRemindersTab.jsx frontend/src/app/shop/insights/page.js
git commit -m "feat(insights): reminders tab auto-bucket section (lapsed 30/60/90)"
```

---

## Task 6: Reminders tab — Section B (manual builder)

**Files:**
- Create: `frontend/src/components/Shop/Insights/ReminderManualFilters.jsx`
- Modify: `frontend/src/components/Shop/Insights/InsightsRemindersTab.jsx` (replace Section B placeholder)

- [ ] **Step 1: Create the manual filters card**

Create `frontend/src/components/Shop/Insights/ReminderManualFilters.jsx`:

```jsx
"use client";

import React from "react";

export default function ReminderManualFilters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  return (
    <div className="bg-brand-surface rounded-xl p-4 border border-brand-border/20 space-y-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-brand-muted">Manual filters</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Last visit from">
          <input type="date" value={filters.fromDate || ""} onChange={(e) => set({ fromDate: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </Field>
        <Field label="Last visit to">
          <input type="date" value={filters.toDate || ""} onChange={(e) => set({ toDate: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </Field>
        <Field label="Min total spent (AED)">
          <input type="number" min="0" value={filters.minSpend ?? ""} onChange={(e) => set({ minSpend: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="0" />
        </Field>
        <Field label="Max total spent (AED)">
          <input type="number" min="0" value={filters.maxSpend ?? ""} onChange={(e) => set({ maxSpend: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="∞" />
        </Field>
        <Field label="Min bookings">
          <input type="number" min="0" value={filters.minBookings ?? ""} onChange={(e) => set({ minBookings: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="0" />
        </Field>
        <Field label="Max bookings">
          <input type="number" min="0" value={filters.maxBookings ?? ""} onChange={(e) => set({ maxBookings: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="∞" />
        </Field>
      </div>
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!filters.excludeContactedToday}
          onChange={(e) => set({ excludeContactedToday: e.target.checked })}
          className="size-4 rounded border-brand-border accent-brand-primary"
        />
        <span className="text-[11px] font-bold text-brand-muted">Exclude customers already contacted today</span>
      </label>
      <button
        type="button"
        onClick={() => onChange({ fromDate: "", toDate: "", minSpend: "", maxSpend: "", minBookings: "", maxBookings: "", excludeContactedToday: false })}
        className="text-[10px] font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1.5">{label}</p>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Replace the Section B placeholder**

In `frontend/src/components/Shop/Insights/InsightsRemindersTab.jsx`, add this import near the top with the others:

```js
import ReminderManualFilters from "./ReminderManualFilters";
import { loadContactedToday } from "./sendWhatsApp";
```

Add this state and derivation near the top of the `InsightsRemindersTab` function body (right after the existing `const [showTruncationWarning, setShowTruncationWarning] = useState(false);` line):

```js
  const [manualFilters, setManualFilters] = useState({
    fromDate: "", toDate: "", minSpend: "", maxSpend: "", minBookings: "", maxBookings: "", excludeContactedToday: false,
  });

  const manualMatches = useMemo(() => {
    const contacted = manualFilters.excludeContactedToday ? loadContactedToday(shop?.id) : {};
    return allCustomers.filter((c) => {
      if (manualFilters.fromDate && (!c.last_visit_date || c.last_visit_date < manualFilters.fromDate)) return false;
      if (manualFilters.toDate   && (!c.last_visit_date || c.last_visit_date > manualFilters.toDate))   return false;
      const spent = Number(c.total_spent || 0);
      if (manualFilters.minSpend !== "" && spent < Number(manualFilters.minSpend)) return false;
      if (manualFilters.maxSpend !== "" && spent > Number(manualFilters.maxSpend)) return false;
      const count = Number(c.bookings_count || 0);
      if (manualFilters.minBookings !== "" && count < Number(manualFilters.minBookings)) return false;
      if (manualFilters.maxBookings !== "" && count > Number(manualFilters.maxBookings)) return false;
      if (manualFilters.excludeContactedToday && contacted[c.id]) return false;
      return true;
    });
  }, [allCustomers, manualFilters, shop?.id]);
```

Replace the entire Section B placeholder block:

```jsx
      {/* Section B — placeholder for Task 6 */}
      <div className="text-brand-muted text-sm font-semibold p-6 text-center border border-dashed border-brand-border/40 rounded-xl">
        Manual reminder builder — coming in Task 6.
      </div>
```

with:

```jsx
      {/* Section B — Manual builder */}
      <div className="space-y-3 pt-2">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-muted">Manual reminder builder</h3>
        <ReminderManualFilters filters={manualFilters} onChange={setManualFilters} />
        <div className="bg-brand-surface border border-brand-border/20 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-3">
            {manualMatches.length} match{manualMatches.length === 1 ? "" : "es"}
          </p>
          <ReminderCustomerList
            customers={manualMatches}
            template={template}
            emptyMsg="No customers match these filters."
          />
        </div>
      </div>
```

- [ ] **Step 3: Verify in browser**

Reload `/shop/insights` → Reminders tab. Expected:
- Below the auto-bucket section, "Manual reminder builder" header appears.
- 6 filter inputs (2 date, 4 numeric) + "Exclude contacted today" checkbox + "Clear filters" link.
- Adjusting any filter immediately updates the match count and list below.
- Selecting customers and clicking "Send to N" behaves identically to Section A.
- "Exclude contacted today" filters out customers already shown the "Sent today" badge.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Shop/Insights/ReminderManualFilters.jsx frontend/src/components/Shop/Insights/InsightsRemindersTab.jsx
git commit -m "feat(insights): reminders tab manual filter builder"
```

---

## Task 7: Report tab

**Files:**
- Create: `frontend/src/components/Shop/Insights/InsightsReportTab.jsx`
- Modify: `frontend/src/app/shop/insights/page.js`

The Report tab wraps the existing `DateRangePicker` + `RevenueReport`, and adds PDF/CSV export buttons that mirror the existing `/shop/reports` page.

- [ ] **Step 1: Create the Report tab**

Create `frontend/src/components/Shop/Insights/InsightsReportTab.jsx`:

```jsx
"use client";

import React, { useState } from "react";
import { useShop } from "@/context/ShopContext";
import DateRangePicker from "@/components/Shop/Reports/DateRangePicker";
import RevenueReport   from "@/components/Shop/Reports/RevenueReport";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function InsightsReportTab() {
  const { shop } = useShop();
  const [range, setRange] = useState(null);

  const exportUrl = (format) => {
    if (!shop?.id || !range) return "#";
    return `${apiBase}/shop/reports/export?shop_id=${shop.id}&from=${range.from}&to=${range.to}&type=revenue&format=${format}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <DateRangePicker value={range} onChange={setRange} />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportUrl("pdf")}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-xl bg-brand-primary/15 hover:bg-brand-primary/25 border border-brand-primary/30 text-brand-primary font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
            PDF
          </a>
          <a
            href={exportUrl("csv")}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-xl bg-brand-success/15 hover:bg-brand-success/25 border border-brand-success/30 text-brand-success font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">table_view</span>
            CSV
          </a>
        </div>
      </div>
      {shop?.id && range && <RevenueReport shopId={shop.id} from={range.from} to={range.to} />}
    </div>
  );
}
```

- [ ] **Step 2: Wire the tab into the page**

Edit `frontend/src/app/shop/insights/page.js`. Add import:

```js
import InsightsReportTab from "@/components/Shop/Insights/InsightsReportTab";
```

Replace:

```jsx
          {shop?.id && activeTab === "report" && (
            <div className="text-brand-muted text-sm font-semibold p-8 text-center">Report tab coming in Task 7.</div>
          )}
```

with:

```jsx
          {shop?.id && activeTab === "report" && <InsightsReportTab />}
```

- [ ] **Step 3: Verify in browser**

Navigate to `/shop/insights` → Report tab. Expected:
- Date range picker at top with presets ("This month" preselected)
- PDF and CSV buttons to the right
- Below: the same KPI cards, daily trend chart, and top-services table as the existing `/shop/reports` Revenue tab
- Switching presets refreshes the chart
- Clicking PDF/CSV opens a download (same backend endpoint as existing reports)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Shop/Insights/InsightsReportTab.jsx frontend/src/app/shop/insights/page.js
git commit -m "feat(insights): report tab with date range and PDF/CSV export"
```

---

## Task 8: Polish + full manual test pass

**Files:**
- Modify: any of the Insights components for polish issues found during testing

- [ ] **Step 1: Build check**

```bash
cd frontend && npm run build
```

Expected: build completes without errors. Any "Module not found" or syntax errors must be fixed before continuing.

- [ ] **Step 2: Full manual test plan**

Walk through this exact list and check each off:

- [ ] `/shop/insights` loads and defaults to Customers tab (or whichever was last active)
- [ ] Sidebar "Insights" item highlights when on this page
- [ ] **Customers tab:**
  - [ ] KPI cards render with sensible numbers
  - [ ] Search debounces (~250ms) and resets to page 1
  - [ ] Sort dropdown reorders the visible page
  - [ ] Date filter narrows the visible list by `last_visit_date`
  - [ ] Per-row "Remind" opens a `wa.me` tab with template populated
  - [ ] Per-row "View" navigates to `/shop/bookings?search=<name>`
  - [ ] Mobile: cards render correctly at ≤480px
- [ ] **Reminders tab:**
  - [ ] Template editor expands and collapses
  - [ ] Clicking token chips appends the token to the textarea
  - [ ] Template persists across page reloads
  - [ ] "Reset to default" restores the default template
  - [ ] Preview updates as the template changes
  - [ ] Three bucket cards show counts and lifetime value
  - [ ] Clicking a bucket expands the customer list below
  - [ ] Select-all checkbox toggles the whole list
  - [ ] "Send to N selected" opens a confirmation modal, then opens N WhatsApp tabs at ~400ms intervals
  - [ ] After sending, "Sent today" badges appear and persist for 24h (verify by reloading)
  - [ ] Customers without WhatsApp are skipped and counted in the success toast
  - [ ] Manual filter section filters across all 6 inputs combined
  - [ ] "Exclude contacted today" hides previously-contacted customers
  - [ ] "Clear filters" resets all inputs
- [ ] **Report tab:**
  - [ ] Default range is "This month"
  - [ ] Preset chips swap the range
  - [ ] KPI cards, daily trend, and top-services table render
  - [ ] PDF and CSV buttons download a file from `/shop/reports/export`
- [ ] **Tab state persists** across page reloads (`localStorage`)
- [ ] **Popup-block detection:** in a fresh browser profile, deny pop-ups on first attempt and verify an error toast appears

- [ ] **Step 3: Fix any issues**

If anything from Step 2 fails, fix it inline. Commit each fix as its own commit with message `fix(insights): <description>`.

- [ ] **Step 4: Final commit if no fixes were needed**

If everything passed without fixes, no additional commit is needed. Otherwise the fix commits above are sufficient. Confirm git status is clean:

```bash
git status
```

Expected: `nothing to commit, working tree clean` (or only the existing pre-task uncommitted files: `frontend/src/components/Shop/StaffList.jsx`, `backend/`, `frontend-build/`, `admin-release.keystore`).

---

## Self-review notes

**Spec coverage:**
- Tab 1 (Customers): Task 3
- Tab 2 (Reminders auto buckets): Task 5
- Tab 2 (Reminders manual builder): Task 6
- Tab 2 (Template editor): Task 4 (consumed by Task 5)
- Tab 3 (Report): Task 7
- WhatsApp helper (token resolution, stagger, popup-block, contactedToday): Task 2
- Sidebar entry: Task 1
- Tab state persistence: Task 1
- Manual test plan: Task 8
- Coexistence with existing `/shop/reminders`: addressed in plan preamble (no touch)

**Type/method consistency check:**
- `sendOne({ customer, template, shop })` and `sendBulk({ customers, template, shop })` — consistent shape across Task 2 / 3 / 4
- `loadTemplate(shopId)` / `saveTemplate(shopId, template)` / `loadContactedToday(shopId)` — all keyed by `shopId`, used consistently
- `daysSince(iso)` returns `Infinity` for unknown dates in Task 5 but `null` in Task 3 — these are used in different contexts (sorting vs label rendering) and both behaviors are intentional. Documented here.
- Customer field names match the existing endpoint contract: `id`, `name`, `whatsapp`, `whatsapp_normalized`, `bookings_count`, `total_spent`, `last_visit_date`, `first_visit_date`

**No placeholders.** All code blocks are complete and copy-pasteable.
