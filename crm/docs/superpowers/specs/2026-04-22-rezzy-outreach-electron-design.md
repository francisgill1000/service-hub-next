# Rezzy Outreach — Electron Desktop App Design

**Date:** 2026-04-22
**Owner:** Francis
**Goal:** Dead-simple desktop app to work a list of Sharjah salon leads, send a WhatsApp pitch per lead, and track which numbers are useful vs. ignorable.

---

## Problem

Francis has a CSV of ~100+ Sharjah salon leads (`sharjah_salons_merged - Sharjah Salons.csv`) and 6 ready-made pitch templates in `marketing/whatsapp-pitch.md` (English, Arabic, Urdu, follow-up, interested-reply, not-interested-reply). Today he'd be tracking status in a spreadsheet and copy-pasting messages manually. That's slow, error-prone, and he loses track of who replied what.

He wants a desktop app that:

1. Holds the lead list in one place.
2. Sends the right pitch in the right language in one click (without risking his WhatsApp number).
3. Tracks per-lead status so he knows which numbers to ignore and which to follow up.
4. Enforces a daily send cap (30–40/day) to avoid WhatsApp flagging.
5. Is simple enough that a non-technical helper could run it.

## Non-goals

- No auto-sending or WhatsApp automation (would get his personal number banned).
- No WhatsApp Business API (overkill, costs money, needs Meta approval).
- No user accounts, cloud sync, or multi-device support.
- No analytics beyond basic counters.
- No CRM-style pipelines, tasks, or scheduling.

## Approach

**Click-to-open sending.** The app constructs a `https://wa.me/<phone>?text=<pitch>` URL and opens it. WhatsApp Desktop/Web opens with the number pre-loaded and the pitch pre-typed. Francis clicks *Send* in WhatsApp, then returns to the app and marks the lead's status. The app's value is the **queue + status tracking + daily guardrails**, not the sending itself.

This keeps the personal WhatsApp number safe, requires no automation libraries, and works on day one.

## Stack

| Layer | Choice | Why |
|------|--------|----|
| Shell | Electron | Cross-platform desktop, Francis already knows JS |
| DB | `better-sqlite3` | Single file, synchronous API, zero config |
| UI | Vanilla HTML/CSS/JS | No build step; total code stays ~500 lines |
| Packaging | `electron-builder` (later) | Deferred until app is working |

No React, no Vite, no bundler. Keeps the repo tiny and debuggable.

## UI: single window, three tabs

### Tab 1 — Queue (main workspace)

Top bar: **`Sent today: 12 / 35`** counter. Yellow at 30, red + disables send button at 35.

Left: lead list table with columns `Shop Name · Area · Status · Last Action`. Above it:
- Filter pills: `All · New · Sent · Interested · Not Interested · Invalid · Ignore`
- Search box (matches name or phone)
- Area dropdown (from distinct areas in DB)
- `Import CSV` button

Right: **Detail panel** (visible when a row is selected):
- Shop name, area, phone (read-only)
- **Language** dropdown: English / Arabic / Urdu
- **Template** dropdown: First message / Follow-up / Interested reply / Not interested reply
- **Message preview** (filled-in, read-only textarea) — shows exactly what will be sent
- Primary action: **📱 Open WhatsApp & Send** (large button, disabled when daily cap hit)
- Status row: `Sent` · `Interested` · `Not Interested` · `Invalid` · `Skip`
- **Notes** textarea (auto-saves on blur)
- After a status button is clicked → panel auto-advances to next lead with status `New`

### Tab 2 — Templates

List of templates with edit form. Seeded on first run from `marketing/whatsapp-pitch.md`. Editable freely. `{shop_name}` placeholder is replaced at send time.

### Tab 3 — Stats

- Today: Sent / Replied / Interested / Not Interested
- This week: same
- Reply rate: `(Interested + Not Interested) / Sent`
- Interested rate: `Interested / Sent`

## Data model

SQLite file lives at `app.getPath('userData')/rezzy-outreach.db`.

```sql
CREATE TABLE leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  no            INTEGER,                           -- original CSV row number
  name          TEXT NOT NULL,
  area          TEXT,
  phone         TEXT NOT NULL UNIQUE,              -- normalized digits only
  whatsapp_link TEXT,
  status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','sent','interested','not_interested','invalid','ignore')),
  language      TEXT,                              -- last language used
  notes         TEXT DEFAULT '',
  sent_at       DATETIME,
  replied_at    DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_area   ON leads(area);

CREATE TABLE templates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,                        -- e.g. "English — First message"
  language   TEXT NOT NULL,                        -- 'en' | 'ar' | 'ur'
  kind       TEXT NOT NULL,                        -- 'first' | 'followup' | 'interested_reply' | 'not_interested_reply'
  body       TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (language, kind)
);

CREATE TABLE activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id    INTEGER NOT NULL,
  action     TEXT NOT NULL,                        -- 'imported' | 'opened' | 'marked_sent' | 'marked_interested' | 'marked_not_interested' | 'marked_invalid' | 'marked_ignore' | 'note_updated'
  payload    TEXT,                                 -- optional JSON blob
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX idx_activity_lead_id    ON activity_log(lead_id);
CREATE INDEX idx_activity_created_at ON activity_log(created_at);
```

`activity_log` is the audit trail. "Sent today" count = `SELECT COUNT(*) FROM activity_log WHERE action='marked_sent' AND date(created_at) = date('now','localtime')`.

## File layout

```
crm/
  package.json
  main.js              Electron main process (window + IPC)
  preload.js           Safe IPC bridge (contextBridge)
  db.js                better-sqlite3 setup, migrations, seed templates
  ipc.js               All IPC handlers (leads, templates, stats, import)
  renderer/
    index.html
    styles.css
    renderer.js        UI state + event handlers
  docs/superpowers/specs/2026-04-22-rezzy-outreach-electron-design.md
```

Each file has one job:
- **main.js**: creates BrowserWindow, wires `ipc.js`, handles app lifecycle
- **db.js**: exports `getDb()`, runs migrations on first open, seeds 6 templates from hardcoded strings (sourced from `marketing/whatsapp-pitch.md`)
- **ipc.js**: exposes `leads:list`, `leads:update`, `leads:importCsv`, `templates:list`, `templates:update`, `stats:today`, `activity:log`
- **preload.js**: whitelists the above IPC channels via `contextBridge.exposeInMainWorld('api', {...})`
- **renderer.js**: renders tabs, table, detail panel; all DOM manipulation

## Import flow

1. User clicks `Import CSV`
2. `dialog.showOpenDialog` → user picks a `.csv` file
3. Main process parses with simple split-by-comma (CSV is known format). Expected columns: `No, Salon Name, Area, Phone, WhatsApp Link, Contacted, Replied, Notes`
4. For each row: normalize phone (strip non-digits), `INSERT OR IGNORE INTO leads` keyed on phone
5. Toast: `Imported 87 new leads (13 duplicates skipped)`

## Send flow

1. User selects a `New` lead
2. Picks language + template → preview updates with `{shop_name}` replaced
3. Clicks **Open WhatsApp & Send**
   - IPC: `leads:openWhatsapp(lead_id, language, kind)`
   - Main: `shell.openExternal('https://wa.me/<phone>?text=<encoded_pitch>')`
   - Logs `opened` action
4. User sends in WhatsApp, returns to app
5. Clicks `Sent` → status updated, `sent_at` stamped, log written, daily counter increments, panel jumps to next `New` lead (ordered by `id` ASC, matching CSV import order, filtered by the currently active area filter if one is set)

**Missing template fallback.** If the selected language+kind combo isn't seeded (e.g., Arabic follow-up), the preview area shows an empty warning: `No template for Arabic Follow-up — add one in the Templates tab, or switch to English.` The **Open WhatsApp** button stays disabled until a template is picked that exists.

## Daily guardrail

- Counter queries `activity_log` for today's `marked_sent` count
- Config in `db.js`: `const DAILY_CAP = 35;`
- UI shows `Sent today: N / 35`
  - N < 30: green
  - 30 ≤ N < 35: yellow, warning banner
  - N ≥ 35: red, **Open WhatsApp** button disabled with tooltip "Daily cap reached — come back tomorrow"

## Error handling

Only at boundaries:
- **CSV import**: catch parse errors per row, show `Skipped N rows (bad format)` in toast; don't abort the whole import
- **DB open failure**: show native error dialog on startup, exit
- **Invalid phone** (fewer than 7 digits after normalization): lead gets `status='invalid'` on import
- Everything else: let it throw. Single-user local app; errors bubbling to console is fine.

## Testing

Manual smoke test before each commit:
1. Fresh run → DB created, 6 templates seeded
2. Import the Sharjah CSV → expected count imported
3. Pick a lead, open WhatsApp → correct URL, correct message
4. Mark Sent → counter increments, panel advances
5. Hit cap of 35 → send button disables
6. Relaunch → state persists

No automated tests in v1. If the app grows, add `vitest` + a thin test for `db.js` and `ipc.js` handlers.

## Out of scope for v1 (captured for later)

- Export to CSV
- Bulk status edit
- Scheduled follow-ups ("remind me in 3 days")
- Image attachments (pitch rules mention attaching shop Google Maps photo)
- Multi-user / cloud sync
- Separate working-hours warnings ("don't send on Friday before 2 PM")
- Installer / auto-update

## Open questions

None. Proceeding to implementation plan.
