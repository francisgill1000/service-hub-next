# FULL-mode Talking Avatar ("Video Assistant") — Design

Date: 2026-06-21
App: `eloquent-bookings` (React + Vite + TS) + Laravel API (`api.eloquentservice.com`)
Status: Approved design, pending implementation plan

## Goal

Add a new, isolated "Video Assistant" feature to the customer web app: a full-screen
screen where a customer has a **voice conversation** with a **talking AI avatar**. The
avatar is powered by **LiveAvatar FULL mode** (LiveAvatar handles speech recognition,
voice, and video) but the answers come from the **existing Rezzy chat brain** (the same
logic behind Live Chat / WhatsApp that knows the shop's services, working hours, and can
make bookings), wired in via LiveAvatar's **custom-LLM** integration.

This is a fresh feature. It must not disturb existing functionality.

## Non-goals / Isolation guarantees (what must NOT change)

- No edits to: `src/pages/ShopChat.tsx`, `src/lib/chat.ts`, `src/components/AiCoreOrb.tsx`,
  or any existing chat route.
- No edits to the Live Chat / WhatsApp backend: `ProcessWaReply` job, existing chat
  routes/controllers, WhatsApp webhook flow.
- The Rezzy brain is **reused read-only**. A new backend service method calls the
  existing reply-generation logic and returns text. It must NOT persist chat messages,
  send WhatsApp, or change the existing job behaviour. If the brain's reply logic is not
  cleanly callable without side effects, extract a thin read-only wrapper around the
  shared core — without changing the existing path's behaviour.
- All new code lives in **new files**, **additive DB columns**, and **new routes**.
- Reverted past experiments (LiveAvatar embed, HeyGen orb clip) are irrelevant; we start
  fresh.

## Decisions (locked)

- **Avatar brain:** existing Rezzy chat brain (not LiveAvatar's built-in LLM).
- **Interaction:** voice conversation (mic, LiveAvatar "Conversational" auto turn-taking).
- **Avatar identity:** per-salon avatar (each shop can have its own `avatar_id`/`voice_id`),
  with a shared default fallback when unset.
- **Mode:** FULL mode (2 credits/min) — chosen for simplicity over LITE; brain swapped in
  via custom-LLM endpoint.
- **Button label:** "Video Assistant". **Route:** `/shop/:id/avatar`.
- **Build Approach A with Approach C as a baked-in fallback** (see Approaches).

## Approaches considered

- **A (chosen): Web SDK + backend session broker + custom-LLM bridge.** Avatar uses the
  real Rezzy brain (knowledge + bookings). Most work; the only option that meets the
  "Rezzy brain" decision.
- **B (rejected): hosted iframe embed.** Almost no code, but cannot inject per-shop live
  data or route through the brain/bookings. This is the previously-reverted approach.
- **C (fallback): Web SDK, LiveAvatar's own LLM + shop knowledge base.** Same screen and
  button as A, no custom-LLM streaming bridge. Avatar can talk about the shop but cannot
  run brain logic or make bookings. Use if A's streaming bridge proves heavy.

## Architecture

```
Customer (browser)
  └─ AvatarCall screen (eloquent-bookings)
       │  1) POST /avatar/shops/{id}/session   ──► Laravel AvatarController
       │        (returns session creds; API key stays server-side)
       │  2) connect via @heygen/liveavatar-web-sdk (WebRTC, voice conversation)
       ▼
LiveAvatar (FULL mode: ASR + voice + video)
       │  3) for each user turn, POSTs OpenAI-style request to:
       ▼
Laravel:  POST /avatar/llm/{id}/chat/completions   (custom-LLM bridge, streaming SSE)
       │        maps {id} → shop, runs reused Rezzy brain
       ▼
Rezzy brain (existing reply generation, read-only) ──► reply text ──► streamed back as
OpenAI SSE ──► LiveAvatar speaks it as voice + video.
```

## Frontend (`eloquent-bookings`)

- **Button:** add one `.c-chat-btn` ("Video Assistant") to the existing `.c-chat-row` in
  `src/pages/ShopDetail.tsx` — additive JSX, navigates to `/shop/:id/avatar`.
- **Route:** add `<Route path="/shop/:id/avatar" element={<AvatarCall />} />` in `App.tsx`
  as a full-screen route (outside `MobileLayout`).
- **Page:** new `src/pages/AvatarCall.tsx`:
  - Request session via new `src/lib/avatar.ts` → `POST /avatar/shops/{id}/session`.
  - Connect with `@heygen/liveavatar-web-sdk`; render avatar video.
  - "Conversational" interactivity (auto turn-taking on speech pauses).
  - Prompt for mic permission; show states: connecting / live / mic-denied / error.
  - Visible **End** button; auto-teardown on unmount / route exit.
- **Lib:** new `src/lib/avatar.ts` — single `createSession(shopId)` call using the shared
  axios client (`src/lib/api.ts`).
- Styling reuses existing `.c-chat-btn` / customer.css tokens; new screen styles namespaced
  (e.g. `.c-avatar-*`) so they cannot affect other screens.

## Backend (Laravel — all new/isolated)

New `AvatarController`, a new route group, and a `LiveAvatarClient` service:

1. **`POST /avatar/shops/{id}/session`**
   - Load shop; build `system_prompt` from shop data (name, services, hours).
   - Resolve `avatar_id` / `voice_id` (shop columns, else default config).
   - Ensure the shop's custom-LLM config exists (lazily create + cache
     `llm_configuration_id` on the shop), with `base_url = .../avatar/llm/{id}`.
   - Call LiveAvatar token + start with `avatar_id`, `voice_id`, `llm_configuration_id`,
     `system_prompt`, conversational interactivity.
   - Return connection creds to the browser. **`LIVEAVATAR_API_KEY` never leaves the
     server.**

2. **`POST /avatar/llm/{id}/chat/completions`** (custom-LLM bridge)
   - OpenAI-compatible **streaming** endpoint LiveAvatar calls each user turn.
   - Map `{id}` → shop; run the **reused Rezzy brain** read-only; stream the reply back as
     OpenAI chat-completion SSE chunks.
   - Shop identity is carried by the URL path (each shop's LLM config `base_url` includes
     its id), avoiding reliance on undocumented per-turn context fields.

## Data / config

- Additive nullable columns on the shops table: `avatar_id`, `voice_id`,
  `llm_configuration_id` (cached after first creation). Set manually / via seeder for MVP.
- New env/config: `LIVEAVATAR_API_KEY`, `LIVEAVATAR_BASE_URL`, default `avatar_id` /
  `voice_id`. Frontend receives no secret.
- One-time setup (out of the request path, documented as ops step): register the API key
  with LiveAvatar to obtain `secret_id`; this seeds custom-LLM config creation.

## Cost guardrails (FULL = 2 credits/min)

- Visible **End** button + automatic session teardown on screen exit / component unmount.
- Idle timeout: end the session after N seconds of silence.
- Daily/session cap noted as a later enhancement, not MVP.

## Error handling

- Session mint failure, mic denied, SDK connect failure, brain/stream error → friendly
  inline message + retry. Always tear down the session so credits do not leak.

## Testing

- Backend unit tests (mocked dependencies):
  - OpenAI-SSE shaping of the custom-LLM bridge response.
  - Rezzy-brain read-only wrapper returns text without side effects (no message persisted,
    no WhatsApp sent).
  - Session-mint request payload to LiveAvatar (mocked client).
- Manual end-to-end: real session, speak, confirm avatar answers with shop-aware replies.
- Frontend: manual verification of the call screen states (WebRTC/SDK not cheaply
  unit-testable).

## Open items to resolve during planning/implementation

- Exact custom-LLM streaming SSE shape and whether/how LiveAvatar passes per-turn context
  (verify against live LiveAvatar docs while implementing). If the streaming bridge is
  heavy, fall back to Approach C (same screen + button, shop knowledge base, no bridge).
- Whether the Rezzy brain needs a small read-only extraction to be callable without side
  effects.
- Exact LiveAvatar token/start endpoint field names and Web SDK init API (confirm against
  docs at implementation time; the SDK package is `@heygen/liveavatar-web-sdk`).

## References

- LiveAvatar overview: https://docs.liveavatar.com/
- Custom LLM integration: https://docs.liveavatar.com/docs/custom-llm-integration
- FULL mode configuration: https://docs.liveavatar.com/docs/full-mode-configurations
- Web SDK: https://github.com/heygen-com/liveavatar-web-sdk
