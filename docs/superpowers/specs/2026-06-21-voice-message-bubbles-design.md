# On-vibe voice message bubbles

**Date:** 2026-06-21
**App:** `eloquent-bookings` (customer PWA)
**Scope:** Presentation-only redesign of how voice messages render in the shop
chat. Replace the browser's native audio control (customer notes) and the
per-bubble `VoiceOrb` (AI replies) with one custom, dark-mint **voice player**.
The AI voice reply becomes voice-first, with its transcript tucked away.

## Goal

When the AI replies by voice, the bubble should clearly read as a *voice
message* in the same dark-mint vibe — not as a text block — and the customer's
own voice notes should use the same player instead of the clashing native
control. Behaviour is unchanged; only the look changes.

## Decisions (locked)

| Decision | Value |
|---|---|
| AI voice reply | **Voice-first**: player is the hero; transcript tucked behind a small toggle, collapsed by default |
| Customer voice note | Same custom player; **no** transcript |
| Player coverage | Both directions use the one `VoiceMessage` component |
| Hero orb | Still goes `talking` while an AI voice reply plays (`onSpeakingChange`) |

## Components

### 1. `VoiceMessage` (new) — `src/components/VoiceMessage.tsx`

A self-contained, themed voice player.

- **Props:** `{ src: string; onSpeakingChange?: (playing: boolean) => void }`.
- **Markup:** a round play/pause button, a faux **waveform** (a fixed array of
  bar heights), and a duration/elapsed readout, plus a hidden `<audio>`.
- **Progress:** the audio is cross-origin, so we can't analyse it; the waveform
  is decorative but **progress-accurate** — bars left of the playhead get an
  `on` class, driven by `timeupdate` (`currentTime / duration`).
- **Time readout:** show elapsed (`m:ss`) while playing/paused mid-clip, else the
  total duration; if duration isn't a finite number (some webm), show `0:00`.
- **Speaking:** fires `onSpeakingChange(true)` on `play`, `false` on
  `pause`/`ended`. (Only the AI side passes this, so the hero orb reacts.)
- **Theming:** default styling for the AI's dark bubble (mint accents); a
  `.c-bubble.out .c-vm-*` override set for the customer's mint bubble (dark ink).
- `preload="metadata"` so the duration can show before first play.

### 2. `VoiceTranscript` (new) — colocated in `src/components/VoiceMessage.tsx`

- **Props:** `{ text: string }`.
- A small "transcript" toggle (mono, uppercase) that expands/collapses the reply
  text. Collapsed by default. Renders the text via the shared `linkify` so a
  Ziina pay link inside a voice reply stays tappable.

### 3. `linkify` helper (extracted) — `src/lib/linkify.tsx`

Move the existing `linkify(text)` out of `ShopChat.tsx` into a shared module so
both `ShopChat` and `VoiceTranscript` use one copy. Same behaviour (splits on
`https?://…`, wraps matches in `<a target="_blank" rel="noopener noreferrer">`).

### 4. `ShopChat` (modified) — `src/pages/ShopChat.tsx`

Replace the audio branch. For each message:
- **Audio message** (`media_url` present and `type` is `audio`/`voice`): render
  `<VoiceMessage src onSpeakingChange={isBot ? setSpeaking : undefined} />`. If
  `isBot` and the caption is meaningful (non-empty, not `…`), also render
  `<VoiceTranscript text={caption} />`. Customer audio shows the player only.
- **Text message:** unchanged (`<span class="c-bubble-text">{linkify(body)}</span>`).
- Import `linkify` from `@/lib/linkify`; remove the local copy.
- Drop the `VoiceOrb` import/usage.

### 5. Styles — `src/styles/customer.css`

Add a `c-vm-*` block (player row + filled-waveform states + the two-direction
colour overrides + transcript toggle/caption). **Remove** the now-dead `c-orb*`
and `.c-bubble-audio` rules.

### 6. Removals

Delete `src/components/VoiceOrb.tsx` and `src/components/VoiceOrb.test.tsx`
(superseded by `VoiceMessage`). The hero orb is `AiCoreOrb` — unaffected.

## Data flow

```
audio message ─► VoiceMessage ─► <audio> timeupdate ─► waveform progress + elapsed
                              └─► onPlay/onPause ─► onSpeakingChange ─► (AI) hero orb 'talking'
AI audio + caption ─► VoiceTranscript (collapsed) ─► tap ─► linkify(caption)
```

No new network calls beyond the audio metadata/playback the browser already did.

## Error handling

- Non-finite/zero duration → time shows `0:00`; playback and waveform still work
  off `timeupdate` once it plays.
- `play()` rejection (autoplay policy etc.) is swallowed (user-initiated tap only).

## Out of scope

- Backend, polling, sending, recording, the hero orb, the influencer face.
- Auto-playing AI voice replies (still tap-to-play).
- Waveform that reflects real amplitude (cross-origin audio can't be analysed).

## Testing

`src/components/VoiceMessage.test.tsx` (new):
- Renders a play control.
- `fireEvent.play`/`pause` on the `<audio>` calls `onSpeakingChange(true/false)`.
- After a `timeUpdate` at 50% (`currentTime`/`duration`), about half the waveform
  bars carry the `on` class.

`src/pages/ShopChat.test.tsx` (update):
- An AI (`direction:'out'`) audio message renders the player and a transcript
  that is collapsed, then reveals the caption text on click.
- A customer (`direction:'in'`) audio message renders the player and **no**
  transcript toggle.
- Existing text-message tests stay green.

## Verification

- `npm test` passes (new + updated); `npm run build` clean.
- Manual on live: send a voice note → it shows the dark-mint player (not the
  native blob); AI voice reply shows the player with a collapsed "transcript"
  that expands; hero orb pulses "talking" while a reply plays; a Ziina link in a
  transcript is tappable.
