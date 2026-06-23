# App-aware AI assistant — design

**Date:** 2026-06-24
**Branch:** feat/rezzy-customer-web
**App:** eloquent-bookings (customer web SPA)

## Problem

The customer app's center-nav voice mic opens `/ai`, which today only finds
*services near me*. The backend endpoint `POST /ai/search` does single-shot
intent classification (map message → one of 10 service categories; `find` /
`list` / `off_topic`) and returns shop cards. It has no memory, no awareness of
the user's own data, and cannot perform any app action.

We want the AI page to become a **full app-aware assistant** that can:

- **Read the user's data** — favourites, bookings (upcoming + history), account.
- **Browse the catalogue** — shops & services across the app (superset of today's
  finder).
- **Navigate anywhere** — open any screen on command (login, register, favourites,
  bookings, a specific shop, account, …).
- **Conversational auth** — register a new account and log in end-to-end, through
  the conversation.
- **Booking actions** — check availability, create, cancel, reschedule (reusing the
  existing booking tools); mutations require explicit confirmation.

## Approach (chosen)

**Server-side Claude tool loop + client-action directives.** Evolve
`POST /ai/search` into a proper tool loop, reusing the proven mechanics in
`backend/app/Services/Wa/ClaudeClient.php::toolLoop()` rather than copy-pasting.

Rejected alternatives:
- *Frontend-orchestrated function calling* — would expose the Anthropic key or
  need a proxy anyway, and throws away the working backend tool loop.
- *Two brains (finder + separate command classifier)* — duplicated prompts, no
  single coherent conversation.

Two tool categories:

- **Read / data tools** run fully on the backend inside the loop.
- **Action tools** cannot run server-side because they change the *frontend*.
  When the model calls one, the backend ends the loop and returns
  `{ reply, action: {...} }`; the React app executes it.

This matches the pattern already proven in the codebase, keeps the Anthropic key
server-side, and keeps passwords on the client.

## Components

### 1. Backend — `AiController` becomes a tool-loop agent

File: `backend/app/Http/Controllers/AiController.php` (endpoint `POST /ai/search`,
route unchanged, throttle unchanged).

- **Request body:** `{ messages: [{role, content}, …], coords?: {lat, lon} }`.
  Multi-turn — the thread already lives in
  `eloquent-bookings/src/context/VoiceSearchContext.tsx`. Auth via the existing
  bearer token / `X-Device-Id` header (already attached by `lib/api.ts`).
- **Response body:** `{ reply: string, action?: Action, results?: Shop[] }`.
  `results` preserves today's shop-card rendering when the model searched shops.
- **System prompt** (replaces the current classifier prompt): "You are Rezzy's
  in-app assistant. You can answer about the user's favourites, bookings,
  account, and the shop/service catalogue, and you can take the user to any
  screen, sign them in or up, and manage bookings. Prefer tools over guessing.
  Reply in one or two short, friendly sentences. Never ask for or repeat
  passwords."
- Reuse `ClaudeClient::toolLoop()` (extract/share it so the WA pipeline and the
  customer assistant use one implementation). Loop capped at ~5 turns (existing
  default).

### 2. Tools

**Read tools — execute server-side inside the loop:**

| Tool | Backs onto | Auth |
|---|---|---|
| `list_favourites` | existing favourites query | user (token/device) |
| `list_bookings` (scope: upcoming \| history) | `my_bookings` logic in `BookingTools.php` | user |
| `get_account` | current customer profile | logged-in |
| `search_shops` (query, category, near) | existing `GET /shops` | public |
| `get_shop` (services, working hours) | existing `GET /shops/{id}` | public |
| `list_categories` | the 10 fixed categories | public |
| `check_availability` (shop, date) | `BookingTools.php` | public |

Read tools chain naturally (e.g. "what does my favourite barber offer?" →
`list_favourites` → `get_shop`).

**Action tools — end the loop, return an `action` directive to the client:**

| Tool | `action` returned |
|---|---|
| `navigate` | `{ type: "navigate", route }` (`/favourites`, `/bookings`, `/shop/:id`, `/account`, `/login`, `/register`, …) |
| `register` | `{ type: "register", fields: { name, phone } }` |
| `login` | `{ type: "login", fields: { phone } }` |
| `create_booking` | `{ type: "confirm_booking", payload: { shop_id, service_ids, date, time } }` |
| `cancel_booking` | `{ type: "confirm_cancel", payload: { booking_id } }` |
| `reschedule_booking` | `{ type: "confirm_reschedule", payload: { booking_id, date, time } }` |

Booking *mutations* return a **confirmation** action, not an immediate write — see
§4.

### 3. Frontend — action executor

A `useAiActions()` hook in `eloquent-bookings/src/pages/AI.tsx` consumes
`action` from the response:

- `navigate` → react-router `navigate(route)`.
- `register` / `login` → the conversational-auth handshake (§4).
- `confirm_booking` / `confirm_cancel` / `confirm_reschedule` → render an inline
  confirmation card in the thread; on confirm, the frontend calls the existing
  booking endpoint, then feeds the result back into the next AI turn.

`results` (shop cards) keep rendering exactly as today.

### 4. Sensitive-action handshakes

**Conversational auth.** The AI gathers only non-secret fields (name, phone)
over the conversation, then emits `register` / `login`. The frontend then:

1. Renders an inline **password field** in the chat thread (typed — never spoken,
   never sent to Claude), prefilled with the name/phone the AI collected.
2. On submit, the frontend calls the **existing** `POST /register` or
   `POST /login` directly and stores the token in
   `eloquent-bookings/src/context/CustomerContext.tsx`.
3. The thread shows "✅ You're signed in"; the next AI turn sees the user as
   authenticated (auth-gated tools now succeed).

No credentials ever pass through the LLM.

**Booking mutations.** `create_booking` / `cancel_booking` /
`reschedule_booking` never write on the model's say-so. They return a confirm
action; the frontend shows a summary card ("Book Barber X, Sat 3pm — confirm?");
only the user's tap calls the real endpoint. Mirrors the guardrail used in the
chat pipeline.

### 5. Error handling

- A tool error returns a short error string back into the loop so the model can
  recover gracefully ("I couldn't find that shop").
- Loop capped at ~5 turns; if it exhausts, return the last text with no action.
- Not-logged-in + asked for "my bookings / favourites / account" → the auth-gated
  tool returns a "needs login" signal; the model offers to log the user in
  (emits `login`).
- `off_topic` → friendly one-line decline (unchanged behaviour).
- Unknown/!whitelisted `navigate` route → ignored client-side, AI just replies in
  text.

### 6. Out of scope (this version)

- No new payment flows in the AI page (Ziina stays where it is; the AI can
  navigate to an invoice).
- No editing of favourites via AI beyond navigation (toggle stays a tap on shop
  cards) — revisit if wanted.
- No multi-language prompt tuning beyond what the model already does.

## Data flow (happy path)

```
mic → VoiceSearchContext.send(text)
   → POST /ai/search { messages, coords }   (token + X-Device-Id)
      → AiController runs Claude tool loop
         read tools execute server-side (favourites/bookings/shops/…)
         model calls an action tool → loop ends
      ← { reply, action?, results? }
   → AI.tsx renders reply (+ shop cards)
   → useAiActions(action):
        navigate         → router.navigate(route)
        register/login   → inline password field → /register|/login → store token
        confirm_*        → confirmation card → existing booking endpoint → feed back
```

## Testing

**Backend (PHP feature tests):**
- Each read tool: returns correct data for the authed user; `search_shops` /
  `get_shop` / `list_categories` work for guests.
- Auth-gated tools (`list_bookings`, `list_favourites`, `get_account`) return the
  "needs login" signal for guests and real data when authed.
- Tool-loop integration test with a fake Claude client: assert correct tool
  dispatch and that an action tool short-circuits the loop into `{ reply, action }`.
- Booking mutation tools return a confirm action and do **not** write.

**Frontend (unit tests):**
- `useAiActions` handles each action type (navigate / register / login /
  confirm_*).
- Password handshake calls `/register` and `/login` (mocked) and stores the token
  in `CustomerContext`; password is never included in any payload to `/ai/search`.
- Shop-card `results` still render.

## Reuse notes

- Share `toolLoop()` between `Wa\ClaudeClient` and the customer assistant — one
  implementation.
- Reuse `BookingTools.php` definitions (`my_bookings`, `check_availability`,
  `create_booking`, `cancel_booking`, `reschedule_booking`) rather than
  re-authoring them.
- Reuse existing `/shops`, `/shops/{id}`, `/login`, `/register`, favourites and
  booking endpoints — the AI orchestrates existing capabilities, it does not add
  parallel ones.
