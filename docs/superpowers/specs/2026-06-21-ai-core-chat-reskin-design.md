# AI Core reskin of the customer chat screen

**Date:** 2026-06-21
**App:** `eloquent-bookings` (customer PWA)
**Scope:** Presentation-only reskin of the existing `ShopChat` screen into the
"AI Core" aesthetic (an animated hero orb that reacts to real chat state). The
live backend chat flow is unchanged.

## Goal

Give the shop chat screen the look from the "AI Core" mockup: a large animated
orb that breathes/listens/thinks/talks, the dark-mint theme, and a polished
composer — while keeping the real, backend-connected conversation (text + voice
replies, polling, Ziina pay links) exactly as it works today.

## Decisions (locked)

| Decision | Value |
|---|---|
| Approach | Reskin the **real** chat; do **not** wire the mockup's booking chips |
| Layout | Orb **hero** at top, existing **scrollable bubble thread** kept below |
| Orb contents | Shop **monogram letter** (no face photo) |
| Theme | Built on existing CSS tokens → **adapts to light/dark** (`data-theme`) |
| Booking chips / confirm card | **Out of scope** (demo scaffolding, not wired) |

## What does NOT change

The entire data layer of `src/pages/ShopChat.tsx` stays as-is:
- `getChatMessages` initial load + `POLL_MS` (4s) polling and de-dup
- `sendChatMessage`, `sendChatVoice`, `MediaRecorder` recording
- `linkify` (Ziina links), bubble direction logic, auto-scroll
- `src/lib/chat.ts`, `src/lib/api.ts`, `src/types.ts` — untouched
- Backend — untouched

This is a UI change: new component + restyled markup + one piece of derived
state. No new network calls.

## Components

### 1. `AiCoreOrb` (new) — `src/components/AiCoreOrb.tsx`

A presentational hero orb. Ports the mockup's layered structure as CSS-only
animation (no JS animation loop).

- **Props:** `{ state: OrbState; letter: string }` where
  `type OrbState = 'idle' | 'listening' | 'thinking' | 'talking'`.
- **Structure** (all under `c-core-*` classes): outer glow, two static rings, a
  rotating rotor ring, the core disc containing the monogram `letter`, a
  rimlight overlay, and a 5-bar wave that shows in `listening`/`talking`.
- **State → animation** (driven by a wrapper class `state-<state>` like the
  mockup's `device` element):
  - `idle` — slow breathe on the glow, slow rotor.
  - `listening` — fast breathe, wave visible, ping pulse.
  - `thinking` — fast rotor spin + rimlight scan pulse.
  - `talking` — wave visible, gentle bob, medium breathe.
- **No timers inside the component.** It is a pure function of `state`.
- Styling uses existing tokens (`--mint-500`, `--mint-glow`, `--surface-2`,
  `--border-mint`, radii) so it themes automatically. Glow intensity is reduced
  under `:root[data-theme='light']` via a small override block so it stays
  legible on white.

### 2. `ShopChat` (modified) — `src/pages/ShopChat.tsx`

- **New derived state** (the only added logic):
  - `awaitingReply: boolean` — set `true` when a customer message/voice is sent;
    cleared when a newer `direction: 'out'` message arrives via load/poll (track
    the max `out` id, compare to the id present when the send happened).
  - `speaking: boolean` — lifted from the per-bubble voice player (see §3).
  - `orbState` is computed, in priority order:
    `recording → 'listening'`, else `speaking → 'talking'`,
    else `awaitingReply || uploading → 'thinking'`, else `'idle'`.
- **Layout:** header (kept, restyled) → `<AiCoreOrb state={orbState} letter={…}/>`
  + centered status line + sub-caption → existing `c-thread-scroll` bubble thread
  (unchanged markup) → restyled composer.
- **Header status text** mirrors `orbState`: `listening…` / `thinking…` /
  `replying…` / `AI assistant · online` (replaces the static
  "replies in seconds" sub-line, keeping the live dot).
- The monogram `letter` is `(Array.from(title)[0] || '?').toUpperCase()` — the
  same source as today's `c-thread-avatar`.

### 3. `VoiceOrb` (small change) — `src/components/VoiceOrb.tsx`

Keep it as the in-thread player for AI voice replies (tap to play). Add an
optional `onSpeakingChange?: (playing: boolean) => void` callback fired from its
existing `onPlay`/`onPause`/`onEnded` handlers, so `ShopChat` can raise the hero
orb to `talking` while a reply plays. Default-undefined → existing usages and
tests unaffected.

### 4. Styles — `src/styles/customer.css`

Add a `c-core-*` block (orb structure + `@keyframes` for breathe, spin, wave,
ping, scan, bob — ported from the mockup, values mapped to tokens) and restyle
the chat header/hero/composer to match. Reuse existing `c-thread-*` / `c-bubble`
classes for the thread. Add the light-theme override for orb glow.

## Data flow

```
load/poll ──► messages ──► (derive max 'out' id) ──► awaitingReply
recording ─┐
uploading ─┼─► orbState ──► AiCoreOrb (CSS animation only)
speaking ──┘                └─► header status text
send/voice ──► awaitingReply=true ──► 'thinking' until next 'out' arrives
```

## Error handling

Unchanged. The existing `error` box is kept (restyled to the dark-mint card).
If `awaitingReply` is set and a send fails, it is cleared so the orb returns to
`idle` (no stuck "thinking").

## Testing (`src/pages/ShopChat.test.tsx`)

Existing tests must stay green (thread render, empty hint, send, send-error).
Add:
- Orb renders with the shop monogram letter on load.
- After sending a message, the orb/region reflects `thinking`
  (assert the `state-thinking` wrapper class is present).
- A unit test for `AiCoreOrb`: given each `state` prop, the root carries the
  matching `state-<state>` class and renders the `letter`.

`MediaRecorder`/`getUserMedia` are not available in jsdom, so the
`listening` (recording) path is covered by the `AiCoreOrb` unit test driving the
prop directly, not by exercising the recorder.

## Out of scope

- The mockup's service/date/time **chips** and **confirmation card**.
- Any booking, availability, or pricing API work.
- Changes to `lib/chat`, `lib/api`, backend, or the provider app.
- Replacing the per-bubble `VoiceOrb` playback model.

## Verification

- `npm run build` succeeds; `npm test` passes (old + new tests).
- Manual: open a shop chat — orb breathes (idle); typing+send → thinking until
  the AI replies; recording a voice note → listening; an AI voice reply playing
  → talking; toggle light theme → orb still legible; Ziina links still tappable.
