# Real-time LiveAvatar in the customer chat

**Date:** 2026-06-21
**Apps:** `eloquent-bookings` (customer PWA, frontend) + `backend` (Laravel API)
**Scope:** Add a HeyGen **LiveAvatar** real-time streaming avatar to the in-app
shop chat. The avatar lip-syncs the **actual** AI reply text live (REPEAT mode).
Replaces the static-photo orb while a session is live, with graceful fallback.

## Goal

When a customer is in a shop chat, a live streaming avatar speaks each AI reply
out loud in real time, lip-synced to the exact words — the genuine "it speaks my
messages" experience (not a canned clip, not pre-rendered).

## Decisions (locked)

| Decision | Value |
|---|---|
| Provider | HeyGen **LiveAvatar** (`streaming.create_token` + LiveAvatar web SDK). Old Interactive Avatar API sunsets 2026-03-31 — do not use it. |
| Avatar | A **stock** streaming avatar (photo avatars cannot stream). Young-female, to match the persona. |
| Session mode | **Always-on while the chat screen is open** (start on mount, stop on unmount). |
| Spoken content | New AI **text** replies, via `speak(text)` in **REPEAT** mode (our brain writes the words; HeyGen only voices them). |
| TTS while live | **Muted** — the avatar is the voice; no double audio. |
| Surface | In-app Live Chat only (`ShopChat`). WhatsApp is unaffected. |
| Key location | Server-side only (`HEYGEN_API_KEY` env on the droplet). Never in the browser or git. |

## Prerequisites (outside code)

1. A paid HeyGen **LiveAvatar** plan active on the account (token creation fails without streaming access).
2. `HEYGEN_API_KEY` set in the backend `.env` on the droplet (a fresh key — the earlier one is to be revoked).
3. A chosen stock streaming `avatar_id` (from HeyGen's streaming avatar list).

Until 1–2 are in place the feature **degrades gracefully** to today's static orb + TTS; nothing breaks.

## Architecture

### A. Backend — token endpoint (`backend/`, Laravel, deploys from `main`)

- **Route:** `POST /api/streaming/token` → `StreamingController@token`.
- **Behaviour:** server-to-server `POST https://api.heygen.com/v1/streaming.create_token`
  with header `x-api-key: {config('services.heygen.key')}`; return `{ token }` (the
  one-time streaming token) as JSON. The API key never leaves the server.
- **Config:** add `'heygen' => ['key' => env('HEYGEN_API_KEY')]` to `config/services.php`.
- **Abuse protection:** `throttle` middleware (e.g. 20/min per IP) — each token can
  start a paid session.
- **Failure:** if HeyGen returns non-2xx or the key is unset, respond `503` with
  `{ error: 'streaming_unavailable' }` so the client falls back cleanly.

### B. Frontend — `StreamingAvatar` integration (`eloquent-bookings/`)

- **New module** `src/lib/streamingAvatar.ts` — a thin wrapper over the LiveAvatar
  web SDK exposing a small, testable interface:
  - `createAvatarSession({ tokenUrl, avatarId, onVideo, onTalkingChange, onError })`
    → returns `{ speak(text), stop() }`.
  - Internally: fetch token from the backend, init the SDK, start the session with
    `avatarId`, hand the live `MediaStream` to `onVideo`, wire start/stop-talking to
    `onTalkingChange`, and surface failures via `onError`.
- **New component** `src/components/StreamingAvatar.tsx` — renders the live
  `<video autoPlay playsInline>` (the avatar feed) sized to fill the orb disc.
  Props: `{ stream: MediaStream | null }`.
- **`AiCoreOrb`** gains an optional `liveStream?: MediaStream`. When present it
  renders the live video in the disc (above the photo/letter fallback chain).
- **`ShopChat` wiring:**
  - On mount (shop chat open) start a session via `createAvatarSession`. Store the
    returned handle; `stop()` on unmount.
  - Track the live `MediaStream` in state → pass to `AiCoreOrb` as `liveStream`.
  - When a new `direction:'out'` **text** message arrives (existing poll/append),
    call `handle.speak(textWithoutEmoji)`.
  - While a session is live, set a `liveActive` flag → `VoiceMessage` for AI replies
    is rendered **muted / not auto-played** (avatar voices it). Customer voice notes
    are unaffected.
  - Orb `talking` state is driven by the avatar's talking events while live (falls
    back to the existing `speaking` signal otherwise).
  - On `onError` (no plan, concurrency full, network) → clear `liveStream`,
    `liveActive=false` → orb reverts to the static photo, TTS resumes. A small,
    non-blocking notice ("Live assistant unavailable") is acceptable.

## Data flow

```
ShopChat mount ─► POST /api/streaming/token ─► HeyGen token
   └─► SDK start(avatarId) ─► MediaStream ─► AiCoreOrb liveStream ─► <video>
new AI text reply (poll) ─► handle.speak(text, REPEAT) ─► avatar lip-syncs live
avatar talking events ─► orb 'talking'   |   liveActive ─► mute TTS
ShopChat unmount / error ─► handle.stop() / fallback to static orb + TTS
```

## Cost & limits (acknowledged)

- Always-on means **one live session per open chat**. The entry LiveAvatar tier
  allows ~**5 concurrent sessions**; the 6th simultaneous customer falls back to the
  static orb (by design). Streaming bills ~$0.10–0.20/min of session.
- Mitigation kept minimal per the chosen "always-on" mode; revisit tap-to-start or
  idle-timeout later if cost is high.

## Out of scope

- WhatsApp (no video surface).
- The provider app (`bizrezzy`).
- Recording a custom Instant Avatar (using stock for now).
- Changing the AI brain — it still produces the reply text; the avatar only voices it.

## Testing

**Backend** (`backend/tests/Feature/StreamingTokenTest.php`):
- `POST /api/streaming/token` returns `{ token }` when HeyGen is mocked to succeed
  (HTTP fake), and the request carries the `x-api-key` header server-side.
- Returns `503 streaming_unavailable` when HeyGen errors or the key is unset.

**Frontend:**
- `streamingAvatar.ts`: with the SDK mocked, `createAvatarSession` fetches the
  token, starts the session, forwards the stream to `onVideo`, and `speak()` calls
  the SDK's speak with REPEAT task type; `onError` fires on a failed token fetch.
- `ShopChat`: when a session is active (mocked handle), a new AI text reply calls
  `handle.speak` with the reply text; the AI `VoiceMessage` is muted; on session
  error the orb shows the static photo. Existing chat tests stay green.

## Verification

- Backend: `php artisan test --filter=StreamingTokenTest` passes.
- Frontend: `npm test` + `npm run build` pass.
- Live (after plan + key set): open a shop chat → avatar video appears in the orb →
  an AI reply is spoken live, lip-synced → leaving the chat ends the session.
