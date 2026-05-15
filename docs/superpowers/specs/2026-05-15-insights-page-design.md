# Customer Insights Page — Design

**Date:** 2026-05-15
**Status:** Draft (pending user review)
**Scope:** Frontend-only (no backend changes)

## Goal

Give shop owners a single page to track per-customer value (bookings + revenue) and send WhatsApp reminders, without flipping between Customers, Bookings, and Reports.

## Non-goals

- New backend endpoints
- Persisting reminders sent (no campaign tracking / no ROI attribution)
- Replacing or deleting the existing `/shop/customers`, `/shop/bookings`, or `/shop/reports` pages
- WhatsApp Business API integration

## Page

**Route:** `/shop/insights`
**Sidebar entry:** "Insights" (new item, separate from Customers / Bookings / Reports)
**Component:** `frontend/src/app/shop/insights/page.js`

Three tabs across the top, sticky on scroll:

1. **Customers** — per-customer value directory
2. **Reminders** — auto buckets + manual WhatsApp blast
3. **Report** — date-range revenue analytics (embeds existing `RevenueReport`)

Active tab persisted in `localStorage` key `rezzy.insights.activeTab`.

## Tab 1: Customers

**Data source:** `GET /shops/{shopId}/customers?search=&page=&per_page=20` (existing endpoint, no changes).

Endpoint already returns per row:
- `id`, `name`, `whatsapp`
- `bookings_count`, `total_spent`
- `first_visit_date`, `last_visit_date`

### Header KPIs (4 cards)

Computed client-side from the **current page** of results (matches behavior of existing Customers page — flag this in UI copy as "(this page)"):

- Total customers (`meta.total`, full count)
- Total bookings on page
- Total revenue on page
- Avg lifetime value on page (`total_spent / customers_count`, page-level)

### Controls row

- Search input (name or WhatsApp) — debounced 250ms, resets to page 1
- **Sort dropdown** (client-side sort of the current page):
  - Most recent visit (default)
  - Highest spend
  - Most bookings
  - Longest lapsed
- **Date filter** (client-side on `last_visit_date`):
  - "All time" / "Last 30 days" / "Last 90 days" / "This year" / "Custom range"

### Table / cards

Same columns as existing Customers page plus a per-row **"Send reminder"** button:

| Customer | Bookings | Last visit | First visit | Total spent | Action |

- Action column has two buttons: **"View bookings"** (current behavior — route to `/shop/bookings?search=<name>`) and **"Send reminder"** (opens `https://wa.me/<whatsapp_normalized>?text=<urlencoded template>` in new tab)
- Mobile: card layout (same as existing Customers page) with action buttons stacked

### Reminder template

- Stored in `localStorage` under `rezzy.insights.reminderTemplate.<shop_id>`
- Default: `"Hi {name}, it's been a while since your last visit at {shop_name}. We'd love to see you again — book your slot here: {shop_url}"`
- Tokens: `{name}`, `{shop_name}`, `{shop_url}`, `{last_visit}`, `{total_visits}` — substituted at click time
- Template editor lives in Reminders tab (Tab 2); referenced from Tab 1

## Tab 2: Reminders

**Data source:** `GET /shops/{shopId}/customers?per_page=1000` (single bulk fetch on tab mount; existing endpoint accepts arbitrary `per_page`).

If a shop has more than 1000 customers, show a banner: "Showing first 1000 customers — narrow your view to send to a specific segment."

### Section A: Auto-suggested buckets (top half)

Three side-by-side cards (mobile: stacked):

| Bucket | Definition |
|---|---|
| **Lapsed 30+** | `last_visit_date` between 30 and 60 days ago |
| **Lapsed 60+** | `last_visit_date` between 60 and 90 days ago |
| **Lapsed 90+** | `last_visit_date` more than 90 days ago |

Each card shows:
- Bucket label
- Count of customers in bucket
- Sum of `total_spent` (lifetime value at risk)
- "Review & send" button

Clicking "Review & send" expands an inline panel below the three cards showing the selected bucket's customers as a checkbox list:
- Header checkbox for select-all
- Each row: name, WhatsApp, last visit, total spent, individual checkbox
- Footer: "Send WhatsApp to N selected" button → opens one `wa.me` tab per customer with a 400ms stagger (so the browser doesn't block as popup spam) → on completion, show a toast: "Opened N WhatsApp chats. Send each message manually."

### Section B: Manual reminder builder (bottom half)

Filter card with controls:

- **Last visit range** — date range picker (defaults: empty = all time)
- **Total spent range** — min/max numeric inputs
- **Bookings count range** — min/max numeric inputs
- **Exclude customers contacted today** — checkbox (defaults to off; checks `localStorage.rezzy.insights.contactedToday.<shop_id>` which is a `{ [customer_id]: iso_date }` map auto-cleared after 24h)

Result table below with same checkbox pattern as Section A. Footer: "Send WhatsApp to N selected".

### Template editor

Collapsible card at the top of Tab 2. Textarea pre-loaded with template from `localStorage`. Live preview shows the message for the first selected customer (or a sample customer if none selected). Save button writes to `localStorage`.

### Send mechanics

When "Send WhatsApp to N selected" is clicked:
1. For each selected customer:
   - Resolve template tokens (`{name}`, `{shop_name}`, `{shop_url}`, `{last_visit}`, `{total_visits}`)
   - `window.open(\`https://wa.me/${whatsapp_normalized}?text=${encodeURIComponent(message)}\`, '_blank')`
   - Wait 400ms before next open (avoids popup blocker)
   - Record `localStorage.rezzy.insights.contactedToday.<shop_id>[customer_id] = today_iso`
2. On completion, toast notification + an info banner: "WhatsApp opened in N tabs. You need to press Send in each one."

**Edge cases:**
- Customer without `whatsapp_normalized` — skip + count in summary toast: "3 customers skipped (no WhatsApp number)"
- Popup blocker triggered — detect via `window.open` returning `null` on the first attempt; show a one-time modal: "Allow pop-ups for this site to send reminders in bulk"

## Tab 3: Report

**Data source:** `GET /shop/reports/revenue?shop_id=&from=&to=` (existing).

- Reuse `frontend/src/components/Shop/Reports/RevenueReport.jsx` component as-is
- Reuse `frontend/src/components/Shop/Reports/DateRangePicker.jsx` for date selection above the embedded component
- PDF/CSV export buttons (same `${apiBase}/shop/reports/export` URL as existing Reports page)
- Default range: "Last 30 days" on tab mount

## Sidebar / navigation

Add a new item to the shop sidebar between "Reports" and "Marketing":

- Icon: `material-symbols-outlined` `insights`
- Label: "Insights"
- Route: `/shop/insights`

Existing /shop/customers, /shop/bookings, /shop/reports pages remain untouched.

## Component structure

```
frontend/src/app/shop/insights/page.js                              (route entry, tab state, sticky header)
frontend/src/components/Shop/Insights/InsightsCustomersTab.jsx      (Tab 1)
frontend/src/components/Shop/Insights/InsightsRemindersTab.jsx      (Tab 2 — wraps both sections)
frontend/src/components/Shop/Insights/ReminderBucketCard.jsx        (auto bucket card)
frontend/src/components/Shop/Insights/ReminderManualFilters.jsx     (manual filter card)
frontend/src/components/Shop/Insights/ReminderCustomerList.jsx      (shared checkbox list — used by both sections)
frontend/src/components/Shop/Insights/ReminderTemplateEditor.jsx    (template textarea + preview)
frontend/src/components/Shop/Insights/InsightsReportTab.jsx         (Tab 3 — wraps DateRangePicker + RevenueReport)
frontend/src/components/Shop/Insights/sendWhatsApp.js               (bulk-send helper with stagger + popup-block detection)
```

`sendWhatsApp.js` is the single source of truth for: template resolution, `wa.me` URL construction, stagger, popup-block detection, contactedToday persistence. Used by Customers tab single-send and Reminders tab bulk-send.

## Visual design

- Match existing design tokens: `bg-brand-bg`, `text-brand-text`, `border-brand-border/30`, `bg-brand-surface`, `bg-brand-primary`, etc. (see `frontend/DESIGN_SYSTEM.md`)
- Page width / padding: copy `ReportsPage.jsx` (`max-w` mobile-first, `px-4 md:px-6 pt-6 md:pt-8`)
- Tab bar: copy the pattern from `ReportsPage.jsx` — pill tabs with `material-symbols-outlined` icons
- Icons:
  - Customers tab: `group`
  - Reminders tab: `notifications_active`
  - Report tab: `analytics`

## Testing

Manual test plan only (no test runner configured for frontend — see `frontend/CLAUDE.md`):

- [ ] Open `/shop/insights` — defaults to Customers tab
- [ ] Sort changes reorder the visible page
- [ ] Date filter narrows the list based on `last_visit_date`
- [ ] Per-row "Send reminder" opens one `wa.me` tab with template populated
- [ ] Switch to Reminders tab — three bucket cards render with non-zero counts (requires test data)
- [ ] Click a bucket — list expands, select-all works, "Send to N selected" opens N tabs staggered
- [ ] Manual filter section filters correctly across all three filter dimensions combined
- [ ] Template editor saves to localStorage and tokens substitute correctly
- [ ] Popup-block detection triggers when browser blocks pop-ups
- [ ] Customers without WhatsApp are skipped with a toast count
- [ ] Switch to Report tab — date range picker + revenue report render, PDF/CSV export URLs work
- [ ] Refresh page — active tab persists via localStorage
- [ ] Mobile (≤480px): tabs scroll horizontally, customer/reminder lists become cards
- [ ] Sidebar shows new "Insights" item between Reports and Marketing

## Out of scope (deferred)

- Server-side persistence of reminders sent (would require backend changes)
- Integration with existing `MarketingCampaignController` for campaign tracking
- Customer detail drawer (full booking history per customer)
- Churn-risk scoring, predicted next booking date
- Cohort analysis or retention curves
- Birthday-based reminders (existing `birthday` segment requires a DB column not yet added)
