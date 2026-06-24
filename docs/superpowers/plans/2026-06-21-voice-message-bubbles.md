# Voice Message Bubbles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the native audio control (customer voice notes) and the per-bubble `VoiceOrb` (AI replies) with one custom dark-mint `VoiceMessage` player, and make AI voice replies voice-first with a tucked-away transcript.

**Architecture:** A new presentational `VoiceMessage` player (play/pause + progress-accurate faux waveform + time) is used for both directions; a colocated `VoiceTranscript` toggle reveals the AI reply text on demand. The `linkify` helper is extracted to a shared module so the transcript and the thread share one copy. `ShopChat`'s audio branch is rewritten to use them; `VoiceOrb` and its dead CSS are removed.

**Tech Stack:** Vite, React 18, TypeScript, vitest + @testing-library/react, plain CSS (`customer.css`, tokens in `tokens.css`).

## Global Constraints

- App dir: `eloquent-bookings/`. Branch `feat/eloquent-bookings-web` — stay on it; do NOT checkout master or `git stash` (unrelated untracked files at repo root must never be committed).
- Presentation-only: do NOT change `src/lib/chat.ts`, `src/lib/api.ts`, the backend, recording, polling, or the hero `AiCoreOrb`.
- `VoiceMessage` props: `{ src: string; onSpeakingChange?: (playing: boolean) => void }`. `VoiceTranscript` props: `{ text: string }`.
- AI voice reply = player + collapsed transcript (only when caption is non-empty and not `…`). Customer voice note = player only.
- `onSpeakingChange` is passed only for AI replies (`direction === 'out'`), so the hero orb still goes `talking`.
- Build on existing tokens; new CSS uses the `c-vm-*` prefix. Customer (mint) bubble overrides live under `.c-bubble.out .c-vm-*`.
- Shell is Git Bash; run `npm`/`npx vitest`/`npm run build` from `eloquent-bookings/`.

---

### Task 1: Extract `linkify` into a shared module

Move the `linkify` helper out of `ShopChat` so the new transcript toggle can reuse it. Pure refactor — no behaviour change.

**Files:**
- Create: `eloquent-bookings/src/lib/linkify.tsx`
- Create: `eloquent-bookings/src/lib/linkify.test.tsx`
- Modify: `eloquent-bookings/src/pages/ShopChat.tsx`

**Interfaces:**
- Produces: `export function linkify(text: string): (string | JSX.Element)[]` in `@/lib/linkify`.

- [ ] **Step 1: Write the failing test**

Create `eloquent-bookings/src/lib/linkify.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { linkify } from './linkify';

describe('linkify', () => {
  it('wraps a url in a new-tab anchor and leaves text alone', () => {
    const { container } = render(<div>{linkify('pay here https://ziina.com/x thanks')}</div>);
    const a = container.querySelector('a')!;
    expect(a).toHaveAttribute('href', 'https://ziina.com/x');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container.textContent).toBe('pay here https://ziina.com/x thanks');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd eloquent-bookings && npx vitest run src/lib/linkify.test.tsx`
Expected: FAIL — cannot resolve `./linkify`.

- [ ] **Step 3: Create the shared helper**

Create `eloquent-bookings/src/lib/linkify.tsx`:

```tsx
/** Render message text with URLs (e.g. a Ziina pay link) as tappable links. */
export function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
      : part,
  );
}
```

- [ ] **Step 4: Point `ShopChat` at the shared helper**

In `eloquent-bookings/src/pages/ShopChat.tsx`:

Add this import directly after the existing `import { getChatMessages, sendChatMessage, sendChatVoice } from '@/lib/chat';` line:
```tsx
import { linkify } from '@/lib/linkify';
```

Then delete the local definition (the `/** Render message text … */` comment and the whole `function linkify(text: string) { … }` block, lines that currently start at `/** Render message text with URLs`).

- [ ] **Step 5: Run tests + build to verify nothing regressed**

Run: `cd eloquent-bookings && npx vitest run src/lib/linkify.test.tsx src/pages/ShopChat.test.tsx && npm run build`
Expected: all PASS; build exit 0.

- [ ] **Step 6: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add eloquent-bookings/src/lib/linkify.tsx eloquent-bookings/src/lib/linkify.test.tsx eloquent-bookings/src/pages/ShopChat.tsx
git commit -m "refactor(eloquent-bookings): extract linkify into shared module"
```

---

### Task 2: `VoiceMessage` player + `VoiceTranscript` toggle + CSS

Build the custom player and transcript toggle in isolation (no `ShopChat` wiring yet).

**Files:**
- Create: `eloquent-bookings/src/components/VoiceMessage.tsx`
- Create: `eloquent-bookings/src/components/VoiceMessage.test.tsx`
- Modify: `eloquent-bookings/src/styles/customer.css` (append the `c-vm-*` block)

**Interfaces:**
- Consumes: `linkify` from `@/lib/linkify` (Task 1); `Icons.Play` / `Icons.Pause` from `./Icons`.
- Produces:
  `export function VoiceMessage({ src, onSpeakingChange }: { src: string; onSpeakingChange?: (playing: boolean) => void }): JSX.Element`
  and `export function VoiceTranscript({ text }: { text: string }): JSX.Element`.
  `VoiceMessage` renders a `.c-vm` row containing a play button (aria-label `Play voice message` / `Pause voice message`), 28 `.c-vm-wave span` bars (lit ones get class `on`), a `.c-vm-time`, and a hidden `<audio>`.

- [ ] **Step 1: Write the failing tests**

Create `eloquent-bookings/src/components/VoiceMessage.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceMessage, VoiceTranscript } from './VoiceMessage';

describe('VoiceMessage', () => {
  it('renders a play control', () => {
    render(<VoiceMessage src="https://x/a.mp3" />);
    expect(screen.getByRole('button', { name: /play voice message/i })).toBeInTheDocument();
  });

  it('reports speaking on play and pause', () => {
    const cb = vi.fn();
    const { container } = render(<VoiceMessage src="https://x/a.mp3" onSpeakingChange={cb} />);
    const audio = container.querySelector('audio')!;
    fireEvent.play(audio);
    expect(cb).toHaveBeenLastCalledWith(true);
    fireEvent.pause(audio);
    expect(cb).toHaveBeenLastCalledWith(false);
  });

  it('fills about half the waveform at 50% progress', () => {
    const { container } = render(<VoiceMessage src="https://x/a.mp3" />);
    const audio = container.querySelector('audio') as HTMLAudioElement;
    Object.defineProperty(audio, 'duration', { configurable: true, value: 10 });
    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 5 });
    fireEvent.timeUpdate(audio);
    expect(container.querySelectorAll('.c-vm-wave span').length).toBe(28);
    const on = container.querySelectorAll('.c-vm-wave span.on').length;
    expect(on).toBeGreaterThan(10);
    expect(on).toBeLessThan(18);
  });
});

describe('VoiceTranscript', () => {
  it('is collapsed, then reveals linkified text on click', async () => {
    const user = userEvent.setup();
    render(<VoiceTranscript text="Sure! pay here https://ziina.com/x" />);
    expect(screen.queryByText(/sure! pay here/i)).toBeNull();
    await user.click(screen.getByRole('button', { name: /transcript/i }));
    expect(await screen.findByText(/sure! pay here/i)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://ziina.com/x');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd eloquent-bookings && npx vitest run src/components/VoiceMessage.test.tsx`
Expected: FAIL — cannot resolve `./VoiceMessage`.

- [ ] **Step 3: Create the component**

Create `eloquent-bookings/src/components/VoiceMessage.tsx`:

```tsx
import { useRef, useState } from 'react';
import { Icons } from './Icons';
import { linkify } from '@/lib/linkify';

// A fixed, voice-note-ish waveform (bar heights in %). Decorative — the audio is
// cross-origin so it can't be analysed — but progress is accurate: bars left of
// the playhead light up.
const WAVE = [
  28, 46, 68, 40, 84, 56, 100, 72, 50, 88, 62, 34, 76, 92,
  54, 70, 44, 82, 60, 38, 66, 90, 48, 74, 58, 42, 80, 52,
];

function fmt(sec: number): string {
  const s = Number.isFinite(sec) && sec > 0 ? sec : 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** A custom, on-vibe voice-message player used for both sent and received audio. */
export function VoiceMessage(
  { src, onSpeakingChange }: { src: string; onSpeakingChange?: (playing: boolean) => void },
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play()?.catch(() => undefined);
    else a.pause();
  };

  const started = playing || elapsed > 0;

  return (
    <div className="c-vm">
      <button
        type="button"
        className="c-vm-btn"
        onClick={toggle}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
      >
        {playing ? <Icons.Pause size={15} /> : <Icons.Play size={15} />}
      </button>
      <div className="c-vm-wave" aria-hidden="true">
        {WAVE.map((h, i) => (
          <span
            key={i}
            className={(i + 0.5) / WAVE.length <= progress ? 'on' : ''}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <span className="c-vm-time">{fmt(started ? elapsed : duration)}</span>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : 0);
        }}
        onPlay={() => { setPlaying(true); onSpeakingChange?.(true); }}
        onPause={() => { setPlaying(false); onSpeakingChange?.(false); }}
        onEnded={() => { setPlaying(false); setProgress(0); setElapsed(0); onSpeakingChange?.(false); }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (Number.isFinite(a.duration) && a.duration > 0) setProgress(a.currentTime / a.duration);
          setElapsed(a.currentTime);
        }}
      />
    </div>
  );
}

/** A small toggle that reveals the AI voice reply's text (transcript) on demand. */
export function VoiceTranscript({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="c-vm-tr">
      <button
        type="button"
        className="c-vm-transcript"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? 'Hide transcript' : 'Transcript'}
      </button>
      {open && <div className="c-vm-caption">{linkify(text)}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd eloquent-bookings && npx vitest run src/components/VoiceMessage.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Append the player CSS**

Append to the end of `eloquent-bookings/src/styles/customer.css`:

```css
/* ===== voice message player (chat) ===== */
.c-vm{display:flex;align-items:center;gap:10px;min-width:196px;max-width:min(260px,64vw)}
.c-vm-btn{width:34px;height:34px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;border:none;cursor:pointer;background:var(--mint-500);color:#04140f;box-shadow:0 0 0 1px var(--border-mint),0 0 14px -5px var(--mint-glow)}
.c-vm-btn:active{transform:scale(.95)}
.c-vm-wave{flex:1;display:flex;align-items:center;gap:2px;height:26px}
.c-vm-wave span{flex:1;min-width:2px;border-radius:2px;background:var(--text-4);opacity:.45;transition:background .12s,opacity .12s}
.c-vm-wave span.on{background:var(--mint-400);opacity:1}
.c-vm-time{font-family:var(--font-mono);font-size:10.5px;color:var(--text-3);flex-shrink:0;min-width:28px;text-align:right}

/* on the customer's mint bubble: dark ink so it reads on mint */
.c-bubble.out .c-vm-btn{background:#04140f;color:var(--mint-400);box-shadow:none}
.c-bubble.out .c-vm-wave span{background:rgba(4,20,15,0.3)}
.c-bubble.out .c-vm-wave span.on{background:#04140f;opacity:1}
.c-bubble.out .c-vm-time{color:rgba(4,20,15,0.6)}

/* AI voice reply transcript toggle */
.c-vm-tr{display:flex;flex-direction:column;gap:3px;margin-top:5px}
.c-vm-transcript{appearance:none;background:none;border:none;cursor:pointer;font-family:var(--font-mono);font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--text-4);padding:0;align-self:flex-start}
.c-vm-transcript:hover{color:var(--mint-400)}
.c-vm-caption{font-size:13px;line-height:1.45;color:var(--text-2);white-space:pre-wrap;word-break:break-word}
.c-vm-caption a{color:var(--mint-400)}
```

- [ ] **Step 6: Build to confirm compile**

Run: `cd eloquent-bookings && npm run build`
Expected: build succeeds, exit 0.

- [ ] **Step 7: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add eloquent-bookings/src/components/VoiceMessage.tsx eloquent-bookings/src/components/VoiceMessage.test.tsx eloquent-bookings/src/styles/customer.css
git commit -m "feat(eloquent-bookings): custom voice message player + transcript toggle"
```

---

### Task 3: Wire into `ShopChat`; remove `VoiceOrb` + dead CSS

Use `VoiceMessage`/`VoiceTranscript` in the thread, delete the superseded `VoiceOrb`, and drop its dead styles.

**Files:**
- Modify: `eloquent-bookings/src/pages/ShopChat.tsx`
- Modify: `eloquent-bookings/src/pages/ShopChat.test.tsx`
- Modify: `eloquent-bookings/src/styles/customer.css` (remove `c-orb*` + `.c-bubble-audio`)
- Delete: `eloquent-bookings/src/components/VoiceOrb.tsx`
- Delete: `eloquent-bookings/src/components/VoiceOrb.test.tsx`

**Interfaces:**
- Consumes: `VoiceMessage`, `VoiceTranscript` (Task 2); `linkify` (Task 1, already imported).

- [ ] **Step 1: Add the failing tests**

In `eloquent-bookings/src/pages/ShopChat.test.tsx`, add these two tests inside the `describe('ShopChat', …)` block (before its closing `});`):

```tsx
  it('renders an AI voice reply as a player with a collapsible transcript', async () => {
    vi.spyOn(chatLib, 'getChatMessages').mockResolvedValue([
      { id: 3, direction: 'out', type: 'audio', media_url: 'https://x/r.mp3', body: '🔊 Sure, 3pm works!', created_at: '2026-06-12T10:00:00Z' },
    ]);

    setup();
    const user = userEvent.setup();
    expect(await screen.findByRole('button', { name: /play voice message/i })).toBeInTheDocument();
    expect(screen.queryByText(/sure, 3pm works/i)).toBeNull();
    await user.click(screen.getByRole('button', { name: /transcript/i }));
    expect(await screen.findByText(/sure, 3pm works/i)).toBeInTheDocument();
  });

  it('renders a customer voice note as a player with no transcript', async () => {
    vi.spyOn(chatLib, 'getChatMessages').mockResolvedValue([
      { id: 4, direction: 'in', type: 'audio', media_url: 'https://x/m.mp3', body: '🎤 i need a haircut', created_at: '2026-06-12T10:00:00Z' },
    ]);

    setup();
    expect(await screen.findByRole('button', { name: /play voice message/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /transcript/i })).toBeNull();
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd eloquent-bookings && npx vitest run src/pages/ShopChat.test.tsx`
Expected: FAIL — no `play voice message` button (still rendering `VoiceOrb`/native audio).

- [ ] **Step 3: Swap the imports**

In `eloquent-bookings/src/pages/ShopChat.tsx`, replace:
```tsx
import { VoiceOrb } from '@/components/VoiceOrb';
```
with:
```tsx
import { VoiceMessage, VoiceTranscript } from '@/components/VoiceMessage';
```

- [ ] **Step 4: Rewrite the audio branch**

In `eloquent-bookings/src/pages/ShopChat.tsx`, replace this block:
```tsx
                {isAudio && (isBot
                  ? <VoiceOrb src={m.media_url!} letter={monogram} onSpeakingChange={setSpeaking} />
                  : <audio controls preload="none" src={m.media_url!} className="c-bubble-audio" />
                )}
                {(!isAudio || (caption && caption !== '…')) && (
                  <span className="c-bubble-text">{linkify(isAudio ? caption : m.body)}</span>
                )}
```
with:
```tsx
                {isAudio ? (
                  <>
                    <VoiceMessage src={m.media_url!} onSpeakingChange={isBot ? setSpeaking : undefined} />
                    {isBot && caption && caption !== '…' && <VoiceTranscript text={caption} />}
                  </>
                ) : (
                  <span className="c-bubble-text">{linkify(m.body)}</span>
                )}
```

- [ ] **Step 5: Run the ShopChat tests**

Run: `cd eloquent-bookings && npx vitest run src/pages/ShopChat.test.tsx`
Expected: PASS — all 8 tests (6 prior + 2 new).

- [ ] **Step 6: Delete the superseded `VoiceOrb`**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/eloquent-bookings"
git rm src/components/VoiceOrb.tsx src/components/VoiceOrb.test.tsx
```

- [ ] **Step 7: Remove the dead CSS**

In `eloquent-bookings/src/styles/customer.css`, delete the now-unused rules:
- the `.c-bubble-audio { … }` line and the `.c-bubble.out .c-bubble-audio { … }` line;
- the whole `.c-orb` group: every rule whose selector starts with `.c-orb` (`.c-orb`, `.c-orb-face`, `.c-orb-letter`, `.c-orb-toggle`, `.c-orb-face:hover …`, `.c-orb.playing …`, `.c-orb-ring`, `.c-orb-bars`, `.c-orb-bars span`, and the `.c-orb.playing` keyframe-trigger rules) and the `@keyframes orbRing` it uses.

Use the editor to remove each matching rule. After removing, confirm none remain:
Run: `grep -n "c-orb\|c-bubble-audio\|orbRing" src/styles/customer.css || echo "clean"`
Expected: `clean`.

- [ ] **Step 8: Full suite + build**

Run: `cd eloquent-bookings && npm test && npm run build`
Expected: all tests PASS; build succeeds, exit 0. (If the build fails on an unused `monogram`, it is still used by `AiCoreOrb` and the header avatar — leave it; do not remove it.)

- [ ] **Step 9: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add eloquent-bookings/src/pages/ShopChat.tsx eloquent-bookings/src/pages/ShopChat.test.tsx eloquent-bookings/src/styles/customer.css
git commit -m "feat(eloquent-bookings): voice-first chat bubbles; drop VoiceOrb"
```

---

## Post-implementation

- Deploy: `cd eloquent-bookings && ./deploy.ps1` → ships to `bookings.eloquentservice.com`.
- Manual on live: send a voice note → dark-mint player (no native blob); AI voice
  reply → player + collapsed "Transcript" that expands; hero orb pulses while a
  reply plays; a Ziina link inside a transcript is tappable.
