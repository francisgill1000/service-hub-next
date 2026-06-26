# Owner Voice Assistant — Design

**Date:** 2026-06-27
**Status:** Approved (pending written-spec review)
**Apps:** `backend` (Laravel API) + `admin` (provider PWA)

## Problem

Shop owners using the admin app are non-technical. Reading dashboards and report
screens is friction. They want to **ask their business questions out loud** —
"How much did I make this month?", "How many bookings tomorrow?", "Cancel Sara's
2pm" — and hear the answer back, in English or Arabic.

## Goal

A floating voice assistant, available on every admin screen, that lets an owner
speak a request and get a spoken + written answer, grounded in their own shop's
live data. It can **report** (read), perform **booking actions**, and make
**business-config changes** — with spoken confirmation before any change.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Scope | Full assistant: reporting + booking actions + config changes |
| Placement | Floating mic button (FAB) on every screen → opens a voice panel |
| Language | English + Arabic, auto-detected; reply in the same language |
| Output | Speak the answer aloud **and** show it as text |
| Safety | Spoken confirmation required before any data mutation |
| Rollout | Phase 1 reporting (read-only); Phase 2 mutations (actions + config) |

## Non-goals (v1)

- `create_booking` by voice — too error-prone (misheard name/phone/time). Excluded.
- Cross-shop / master-admin analytics. The assistant only ever sees the
  authenticated shop's data.
- Persisted conversation history across sessions. History lives in the open
  panel only; closing it starts fresh.

## Architecture

### Approach (chosen)

Synchronous, dedicated owner-assistant endpoint. One HTTP request does the whole
turn inline: **transcribe → Claude tool-loop (shop-scoped) → synthesize speech**,
returning transcript + answer text + answer audio together. No queue worker
needed (unlike the customer Live-Chat pipeline, which is async/polling).

Rejected alternatives:
- Reuse customer Live-Chat queue pipeline — wrong semantics (async, customer-facing).
- Browser-native Web Speech API + browser TTS — unreliable on iOS PWA, weak Arabic.

### Backend

**Routes** (group `auth:sanctum`, so `$request->user()` is the authenticated Shop):
```
POST /api/shop/assistant/voice   OwnerAssistantController@voice
POST /api/shop/assistant/text    OwnerAssistantController@text
```

**`OwnerAssistantController`**
- `voice(Request)`: validates an uploaded `audio` file + optional `history` JSON.
  Transcribes via `Transcriber`. Then shared `respond()` path.
- `text(Request)`: validates `text` + optional `history`. Then shared `respond()`.
- `respond(Shop $shop, string $userText, array $history)`:
  1. Build system prompt (see below) + append `$history` + the new user turn.
  2. `ClaudeClient->toolLoop($prompt, $messages, OwnerAssistantTools::defs(), executor)`.
  3. `Speech->synthesize($replyText)` → store ogg under
     `storage/app/public/assistant/{shopId}/reply-*.ogg`; return its `media_url`.
  4. Return JSON `{ transcript, reply_text, reply_audio_url, history }` where
     `history` is the updated turn list the client echoes back next turn.
- Fail-soft: any transcription/TTS error returns a graceful text-only reply
  ("Sorry, I didn't catch that — could you try again?"); the controller never 500s
  on a downstream API hiccup. (The `ClaudeClient` connection-reset retry from the
  WhatsApp work already covers transient Anthropic failures.)

**`App\Services\Assistant\OwnerAssistantTools`** — mirrors the `BookingTools`
pattern (`defs()` returns Anthropic tool schemas; `execute($shop, $tool, $input)`
returns a JSON string). All tools are implicitly scoped to `$shop->id`.

*Read tools (Phase 1):* built on the existing `ReportsAggregator`
(`revenueSummary`, `staffSummary`, `servicesSummary`, `timePatternsSummary`) plus
direct `Booking` queries.
- `get_revenue(period)` — period ∈ {today, yesterday, this_week, this_month,
  last_month, this_year}. Returns total, booking count, currency AED.
- `get_bookings(date?|period?, status?)` — counts + a short list (ref, time,
  customer, service, status). Caps the spoken list to ~5, reports the overflow count.
- `get_top_services(period)` — ranked services by count + revenue.
- `get_staff_performance(period)` — bookings/revenue per staff member.
- `get_busy_times(period)` — busiest weekday + hour buckets.

*Write tools (Phase 2, confirm-gated):*
- `cancel_booking(reference | {date,time,customer})` — resolves to one booking;
  ambiguity → returns candidates for the agent to disambiguate by voice.
- `update_booking_status(reference, status)` — status ∈ {booked, completed, cancelled, queued}.
- `update_hours(day_of_week, start_time, end_time)`.
- `update_service_price(service_title | catalog_id, price)`.

**System prompt** (key rules):
- Reply in the **same language the owner spoke** (English or Arabic).
- Keep answers short and speech-friendly: spell out money ("571 dirhams"), avoid
  tables/markdown, summarize lists.
- **Never call a write tool until the owner explicitly confirms in a later turn.**
  On a change request, first state what will change and ask for a yes/no; only on
  the confirming turn call the mutating tool. (Confirmation is conversational —
  no separate confirm token — which the stateless history naturally supports.)
- Today's date and the shop name/currency are injected into the prompt.

### Frontend (admin)

- **`VoiceAssistantFab`** mounted once in `MobileLayout`, so it renders on every
  screen, fixed bottom-right above the tab bar.
- Tapping opens **`VoiceAssistantPanel`** (bottom sheet):
  - Big mic button: press to record (`MediaRecorder`, webm/opus), press to stop
    and send. Recording + "thinking" states shown.
  - Conversation transcript as bubbles (owner turns + assistant turns).
  - Assistant answers **auto-play** the returned audio and display the text.
  - Typed-input fallback row (for noisy environments).
  - Close button; closing clears the in-memory history.
- **`lib/assistant.ts`** — `postVoice(blob, history)`, `postText(text, history)`;
  sends/receives the `history` array each turn (stateless server).
- Small reusable helpers: a recorder hook (modeled on `eloquent-bookings`
  `ShopChat.tsx`) and an audio-player that plays the reply ogg.

### Data flow (one voice turn)

```
owner taps mic → MediaRecorder captures webm
  → POST /api/shop/assistant/voice (audio + prior history)
    → Transcriber (Whisper, auto-language)         → userText
    → ClaudeClient.toolLoop(prompt, history+userText, OwnerAssistantTools)
        → tool calls hit ReportsAggregator / Booking / Shop (scoped to shop)
      → replyText (owner's language)
    → Speech.synthesize(replyText)                 → reply.ogg (public url)
  ← { transcript, reply_text, reply_audio_url, history }
panel: append bubbles, auto-play reply.ogg, keep history for next turn
```

## Error handling

- No mic permission → panel shows a hint and the typed fallback.
- Whisper empty/failed → "Sorry, I didn't catch that — try again?" (text only).
- TTS failed → return text reply with `reply_audio_url: null`; panel shows text,
  skips autoplay.
- Anthropic transient failure → already retried in `ClaudeClient`; on hard
  failure, friendly text-only error.
- Write-tool resolves to 0 or many bookings → agent asks the owner to clarify;
  no mutation happens.

## Testing

Backend feature tests (fake Whisper/Anthropic/TTS HTTP, like `WaClaudeClientTest`):
- Each read tool returns correct shop-scoped figures for a seeded month.
- **Shop-scoping:** shop A's assistant cannot read or mutate shop B's data.
- **Confirm-gate:** a write tool is NOT executed on the first request; only after
  a confirming turn. Asserts the mutation did/didn't happen.
- `cancel_booking` ambiguity → returns candidates, no mutation.
- TTS failure path → `reply_audio_url` is null, reply_text still present.

Frontend tests (vitest):
- `lib/assistant.ts` posts audio + history and parses the response.
- Panel renders bubbles and calls play on an audio reply (mocked).

## Rollout

1. **Phase 1 — Reporting:** endpoints + read tools + FAB/panel + autoplay. Shippable.
2. **Phase 2 — Mutations:** write tools + confirm-gate + tests. Built on Phase 1.

## Files (estimate)

*Backend (new):* `app/Http/Controllers/OwnerAssistantController.php`,
`app/Services/Assistant/OwnerAssistantTools.php`, routes,
tests under `tests/Feature/OwnerAssistant*`.
*Backend (reuse):* `Transcriber`, `Speech`, `ClaudeClient`, `ReportsAggregator`.
*Admin (new):* `components/VoiceAssistantFab.tsx`, `components/VoiceAssistantPanel.tsx`,
`lib/assistant.ts`, a recorder hook, styles; mount in `layout/MobileLayout.tsx`.
