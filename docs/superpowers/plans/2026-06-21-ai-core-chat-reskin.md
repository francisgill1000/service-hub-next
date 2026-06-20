# AI Core Chat Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the `eloquent-bookings` shop chat screen into the "AI Core" look — an animated hero orb that reacts to real chat state — without changing the live backend chat flow.

**Architecture:** Add a presentational `AiCoreOrb` component (pure function of a `state` prop, CSS-only animation). `ShopChat` keeps its entire data layer and derives one `orbState` from existing signals (recording / awaiting reply / a voice reply playing). `VoiceOrb` gains an optional callback so the hero orb can show "talking" while a reply plays. All visuals use existing CSS tokens so they theme light/dark.

**Tech Stack:** Vite, React 18, TypeScript, vitest + @testing-library/react, plain CSS (`customer.css`, design tokens in `tokens.css`).

## Global Constraints

- App dir: `eloquent-bookings/`. Branch `feat/rezzy-customer-web` — stay on it; do NOT checkout master or `git stash` (tree has unrelated untracked files at repo root — never commit those).
- Presentation-only: do NOT change `src/lib/chat.ts`, `src/lib/api.ts`, `src/types.ts`, the backend, or the provider app.
- `OrbState` is exactly the union `'idle' | 'listening' | 'thinking' | 'talking'`.
- `orbState` priority (highest first): `recording`→`listening`, else `speaking`→`talking`, else `awaitingReply || uploading`→`thinking`, else `idle`.
- Orb shows the shop **monogram letter** (no photo): `(Array.from(title)[0] || '?').toUpperCase()`.
- Build everything on existing tokens (`--mint-500`, `--mint-glow`, `--surface-2`, `--border-mint`, `--font-sans`, `--font-mono`, radii). New `@keyframes` are prefixed `core-` to avoid collisions.
- Out of scope: the mockup's service/date/time chips and confirmation card.
- The composer keeps its current markup and styling — it is already on the dark-mint theme, so no composer restyle is needed; the hero orb + dynamic header status are the visual change. (Refines the spec's "restyle composer" to "no change required".)
- Shell is Git Bash; `npm` runs from `eloquent-bookings/`. Run `npm test` and `npm run build` from there.

---

### Task 1: `AiCoreOrb` component + orb CSS

**Files:**
- Create: `eloquent-bookings/src/components/AiCoreOrb.tsx`
- Create: `eloquent-bookings/src/components/AiCoreOrb.test.tsx`
- Modify: `eloquent-bookings/src/styles/customer.css` (append the `c-core-*` block)

**Interfaces:**
- Produces: `export type OrbState = 'idle' | 'listening' | 'thinking' | 'talking'` and
  `export function AiCoreOrb({ state, letter }: { state: OrbState; letter: string }): JSX.Element`.
  Root element is `<div class="c-core state-<state>" data-testid="ai-core">` and renders `letter` inside `.c-core-letter`.

- [ ] **Step 1: Write the failing test**

Create `eloquent-bookings/src/components/AiCoreOrb.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AiCoreOrb } from './AiCoreOrb';

describe('AiCoreOrb', () => {
  it('renders the monogram letter', () => {
    render(<AiCoreOrb state="idle" letter="G" />);
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('carries the matching state class for every state', () => {
    for (const s of ['idle', 'listening', 'thinking', 'talking'] as const) {
      const { getByTestId, unmount } = render(<AiCoreOrb state={s} letter="G" />);
      expect(getByTestId('ai-core')).toHaveClass('c-core', `state-${s}`);
      unmount();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd eloquent-bookings && npx vitest run src/components/AiCoreOrb.test.tsx`
Expected: FAIL — cannot resolve `./AiCoreOrb`.

- [ ] **Step 3: Create the component**

Create `eloquent-bookings/src/components/AiCoreOrb.tsx`:

```tsx
export type OrbState = 'idle' | 'listening' | 'thinking' | 'talking';

/**
 * The chat "AI Core" hero: a layered, animated orb that reflects the
 * assistant's current state. Pure presentation — all motion is CSS-driven
 * (see the c-core-* block in customer.css); this component holds no timers.
 */
export function AiCoreOrb({ state, letter }: { state: OrbState; letter: string }) {
  return (
    <div className={`c-core state-${state}`} data-testid="ai-core">
      <div className="c-core-glow" />
      <div className="c-core-ping" />
      <div className="c-core-ring r1" />
      <div className="c-core-ring r2" />
      <div className="c-core-rotor" />
      <div className="c-core-disc">
        <span className="c-core-letter">{letter}</span>
      </div>
      <div className="c-core-rimlight" />
      <div className="c-core-wave" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd eloquent-bookings && npx vitest run src/components/AiCoreOrb.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Append the orb CSS**

Append to the end of `eloquent-bookings/src/styles/customer.css`:

```css
/* ===== AI Core hero orb (chat) ===== */
.c-core-hero{display:flex;flex-direction:column;align-items:center;padding:16px 16px 4px;gap:8px;flex-shrink:0}
.c-core-sub{font-family:var(--font-mono);font-size:10.5px;color:var(--text-3);text-transform:uppercase;letter-spacing:1.4px}

.c-core{position:relative;width:148px;height:148px;flex-shrink:0}
.c-core-glow{position:absolute;inset:-26px;border-radius:50%;background:radial-gradient(circle,var(--mint-glow),transparent 65%);filter:blur(6px);animation:core-breathe 4.5s ease-in-out infinite}
.c-core-ring{position:absolute;border-radius:50%;border:1px solid var(--border-mint)}
.c-core-ring.r1{inset:7px}
.c-core-ring.r2{inset:22px;border-color:rgba(0,255,204,0.14)}
.c-core-rotor{position:absolute;inset:0;border-radius:50%;border:1.5px solid transparent;border-top-color:var(--mint-500);border-right-color:rgba(0,255,204,0.3);animation:core-spin 5.5s linear infinite}
.c-core-disc{position:absolute;inset:26px;border-radius:50%;overflow:hidden;background:var(--surface-2);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px -6px var(--mint-glow),0 0 0 1px rgba(0,255,204,0.45) inset}
.c-core-letter{font-family:var(--font-sans);font-weight:700;font-size:40px;color:var(--mint-400);animation:core-letter 7s ease-in-out infinite}
.c-core-rimlight{position:absolute;inset:26px;border-radius:50%;pointer-events:none;box-shadow:0 0 0 2px rgba(0,255,204,0.16) inset;background:radial-gradient(120% 90% at 78% 8%,rgba(0,255,204,0.20),transparent 46%)}
.c-core-ping{position:absolute;inset:7px;border-radius:50%;border:1px solid var(--mint-500);opacity:0}
.c-core-wave{position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);display:flex;align-items:center;gap:4px;height:26px;padding:0 12px;background:rgba(5,7,10,0.82);border:1px solid var(--border-mint);border-radius:var(--r-pill);opacity:0;transition:.3s;box-shadow:0 8px 24px -8px var(--mint-glow)}
.c-core-wave span{width:3px;height:7px;border-radius:4px;background:var(--mint-500);box-shadow:0 0 8px var(--mint-glow)}
.c-core-wave span:nth-child(1){animation:core-wave 1s 0s infinite ease-in-out}
.c-core-wave span:nth-child(2){animation:core-wave 1s -.2s infinite ease-in-out}
.c-core-wave span:nth-child(3){animation:core-wave 1s -.4s infinite ease-in-out}
.c-core-wave span:nth-child(4){animation:core-wave 1s -.1s infinite ease-in-out}
.c-core-wave span:nth-child(5){animation:core-wave 1s -.3s infinite ease-in-out}

.c-core.state-listening .c-core-glow{animation:core-breathe 1.4s ease-in-out infinite}
.c-core.state-listening .c-core-wave{opacity:1}
.c-core.state-listening .c-core-ping{animation:core-ping 1.6s ease-out infinite}
.c-core.state-thinking .c-core-rotor{animation:core-spin 1.1s linear infinite}
.c-core.state-thinking .c-core-rimlight{animation:core-scan 1.1s ease-in-out infinite}
.c-core.state-talking .c-core-wave{opacity:1}
.c-core.state-talking .c-core-glow{animation:core-breathe 1.6s ease-in-out infinite}
.c-core.state-talking{animation:core-bob 1.7s ease-in-out infinite}

@keyframes core-breathe{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.92}}
@keyframes core-spin{to{transform:rotate(360deg)}}
@keyframes core-wave{0%,100%{height:7px}50%{height:26px}}
@keyframes core-ping{0%{transform:scale(.9);opacity:.7}100%{transform:scale(1.6);opacity:0}}
@keyframes core-scan{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes core-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes core-letter{0%,100%{transform:scale(1.02)}50%{transform:scale(1.06)}}

/* light theme: soften the dark-glass bits so the orb reads on white */
:root[data-theme='light'] .c-core-disc{background:var(--surface-3)}
:root[data-theme='light'] .c-core-letter{color:var(--mint-300)}
:root[data-theme='light'] .c-core-wave{background:rgba(255,255,255,0.9)}
```

- [ ] **Step 6: Build to confirm CSS/TS compile**

Run: `cd eloquent-bookings && npm run build`
Expected: build succeeds, exit 0.

- [ ] **Step 7: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add eloquent-bookings/src/components/AiCoreOrb.tsx eloquent-bookings/src/components/AiCoreOrb.test.tsx eloquent-bookings/src/styles/customer.css
git commit -m "feat(eloquent-bookings): Ai Core hero orb component + styles"
```

---

### Task 2: `VoiceOrb` reports speaking state

Add an optional callback so the parent can know when an AI voice reply is playing. Backwards-compatible — existing usages and tests are unaffected.

**Files:**
- Modify: `eloquent-bookings/src/components/VoiceOrb.tsx`
- Create: `eloquent-bookings/src/components/VoiceOrb.test.tsx`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `VoiceOrb` now accepts an optional prop:
  `onSpeakingChange?: (playing: boolean) => void`, fired `true` on play and `false` on pause/end.

- [ ] **Step 1: Write the failing test**

Create `eloquent-bookings/src/components/VoiceOrb.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { VoiceOrb } from './VoiceOrb';

describe('VoiceOrb', () => {
  it('reports speaking state on play and pause', () => {
    const onSpeakingChange = vi.fn();
    const { container } = render(
      <VoiceOrb src="https://example.com/a.mp3" letter="G" onSpeakingChange={onSpeakingChange} />,
    );
    const audio = container.querySelector('audio')!;
    fireEvent.play(audio);
    expect(onSpeakingChange).toHaveBeenLastCalledWith(true);
    fireEvent.pause(audio);
    expect(onSpeakingChange).toHaveBeenLastCalledWith(false);
    fireEvent.ended(audio);
    expect(onSpeakingChange).toHaveBeenLastCalledWith(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd eloquent-bookings && npx vitest run src/components/VoiceOrb.test.tsx`
Expected: FAIL — `onSpeakingChange` is never called (prop not wired yet).

- [ ] **Step 3: Wire the callback**

In `eloquent-bookings/src/components/VoiceOrb.tsx`, change the signature and the three audio handlers.

Replace the function signature line:
```tsx
export function VoiceOrb({ src, letter }: { src: string; letter: string }) {
```
with:
```tsx
export function VoiceOrb(
  { src, letter, onSpeakingChange }:
  { src: string; letter: string; onSpeakingChange?: (playing: boolean) => void },
) {
```

Replace the three audio event props:
```tsx
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
```
with:
```tsx
        onPlay={() => { setPlaying(true); onSpeakingChange?.(true); }}
        onPause={() => { setPlaying(false); onSpeakingChange?.(false); }}
        onEnded={() => { setPlaying(false); onSpeakingChange?.(false); }}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd eloquent-bookings && npx vitest run src/components/VoiceOrb.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add eloquent-bookings/src/components/VoiceOrb.tsx eloquent-bookings/src/components/VoiceOrb.test.tsx
git commit -m "feat(eloquent-bookings): VoiceOrb reports speaking state via callback"
```

---

### Task 3: Wire the orb into `ShopChat`

Add the derived `orbState`, render the hero, make the header status dynamic, and raise the orb to "talking" while a voice reply plays. The data layer is untouched.

**Files:**
- Modify: `eloquent-bookings/src/pages/ShopChat.tsx`
- Modify: `eloquent-bookings/src/pages/ShopChat.test.tsx`

**Interfaces:**
- Consumes: `AiCoreOrb`, `OrbState` (Task 1); `VoiceOrb`'s `onSpeakingChange` (Task 2).
- Produces: nothing other tasks consume.

- [ ] **Step 1: Add the failing tests**

In `eloquent-bookings/src/pages/ShopChat.test.tsx`, change the import line:
```tsx
import { render, screen } from '@testing-library/react';
```
to:
```tsx
import { render, screen, within } from '@testing-library/react';
```

Then add these two tests inside the `describe('ShopChat', …)` block (before its closing `});`):

```tsx
  it('shows the AI core orb with the shop monogram, idle on load', async () => {
    vi.spyOn(chatLib, 'getChatMessages').mockResolvedValue([]);

    setup();
    await screen.findByText(/say hi/i);
    const orb = screen.getByTestId('ai-core');
    expect(within(orb).getByText('G')).toBeInTheDocument(); // Glow Salon
    expect(orb).toHaveClass('state-idle');
  });

  it('moves the orb to thinking after sending a message', async () => {
    vi.spyOn(chatLib, 'getChatMessages').mockResolvedValue([]);
    vi.spyOn(chatLib, 'sendChatMessage').mockResolvedValue({
      id: 9, direction: 'in', body: 'How much is a haircut?', created_at: '2026-06-12T10:02:00Z',
    });

    setup();
    const user = userEvent.setup();
    await user.type(await screen.findByPlaceholderText(/type a message/i), 'How much is a haircut?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('How much is a haircut?')).toBeInTheDocument();
    expect(screen.getByTestId('ai-core')).toHaveClass('state-thinking');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd eloquent-bookings && npx vitest run src/pages/ShopChat.test.tsx`
Expected: FAIL — no element with `data-testid="ai-core"` exists yet.

- [ ] **Step 3: Import the orb**

In `eloquent-bookings/src/pages/ShopChat.tsx`, immediately after the line:
```tsx
import { VoiceOrb } from '@/components/VoiceOrb';
```
add:
```tsx
import { AiCoreOrb, type OrbState } from '@/components/AiCoreOrb';
```

- [ ] **Step 4: Add the orb-state hooks**

In `ShopChat`, immediately after the line:
```tsx
  const [uploading, setUploading] = useState(false);
```
add:
```tsx
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [speaking, setSpeaking] = useState(false);
```

And immediately after the line:
```tsx
  const chunksRef = useRef<Blob[]>([]);
```
add:
```tsx
  const outCountRef = useRef(0);
```

- [ ] **Step 5: Clear "thinking" when the AI replies**

In `eloquent-bookings/src/pages/ShopChat.tsx`, immediately after the auto-scroll effect (the block ending with `}, [messages.length]);`), add:

```tsx
  // The orb is "thinking" from when I send until the AI's next reply lands.
  useEffect(() => {
    const outCount = messages.reduce((n, m) => (m.direction === 'out' ? n + 1 : n), 0);
    if (outCount > outCountRef.current) setAwaitingReply(false);
    outCountRef.current = outCount;
  }, [messages]);
```

- [ ] **Step 6: Set "thinking" on send + voice success**

In `handleSend`, replace:
```tsx
      const sent = await sendChatMessage(shopId, text);
      appendMessages([sent]);
      setDraft('');
```
with:
```tsx
      const sent = await sendChatMessage(shopId, text);
      appendMessages([sent]);
      setDraft('');
      setAwaitingReply(true);
```

In `uploadVoice`, replace:
```tsx
      const sent = await sendChatVoice(shopId, blob);
      appendMessages([sent]);
```
with:
```tsx
      const sent = await sendChatVoice(shopId, blob);
      appendMessages([sent]);
      setAwaitingReply(true);
```

- [ ] **Step 7: Derive monogram, orbState, statusText**

Replace the line:
```tsx
  const title = shopName || 'Chat';
```
with:
```tsx
  const title = shopName || 'Chat';
  const monogram = (Array.from(title)[0] || '?').toUpperCase();
  const orbState: OrbState =
    recording ? 'listening'
      : speaking ? 'talking'
        : (awaitingReply || uploading) ? 'thinking'
          : 'idle';
  const statusText =
    orbState === 'listening' ? 'listening…'
      : orbState === 'thinking' ? 'thinking…'
        : orbState === 'talking' ? 'replying…'
          : 'AI assistant · online';
```

- [ ] **Step 8: Restyle the header and insert the hero**

Replace the header block:
```tsx
        <div className="c-thread-avatar">{(Array.from(title)[0] || '?').toUpperCase()}</div>
        <div className="c-thread-head-text">
          <span className="c-thread-title">{title}</span>
          <span className="c-thread-sub">
            <span className="c-live-dot" />
            AI assistant · replies in seconds
          </span>
        </div>
      </div>
```
with:
```tsx
        <div className="c-thread-avatar">{monogram}</div>
        <div className="c-thread-head-text">
          <span className="c-thread-title">{title}</span>
          <span className="c-thread-sub">
            <span className="c-live-dot" />
            {statusText}
          </span>
        </div>
      </div>

      <div className="c-core-hero">
        <AiCoreOrb state={orbState} letter={monogram} />
        <span className="c-core-sub">Ask about prices, timings or availability</span>
      </div>
```

- [ ] **Step 9: Raise the orb to "talking" while a reply plays**

Replace:
```tsx
                  ? <VoiceOrb src={m.media_url!} letter={(Array.from(title)[0] || '?').toUpperCase()} />
```
with:
```tsx
                  ? <VoiceOrb src={m.media_url!} letter={monogram} onSpeakingChange={setSpeaking} />
```

- [ ] **Step 10: Run the ShopChat tests**

Run: `cd eloquent-bookings && npx vitest run src/pages/ShopChat.test.tsx`
Expected: PASS — all 6 tests (4 original + 2 new).

- [ ] **Step 11: Run the full suite + build**

Run: `cd eloquent-bookings && npm test && npm run build`
Expected: all tests PASS; build succeeds, exit 0.

- [ ] **Step 12: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add eloquent-bookings/src/pages/ShopChat.tsx eloquent-bookings/src/pages/ShopChat.test.tsx
git commit -m "feat(eloquent-bookings): AI Core orb reskin wired into ShopChat"
```

---

## Post-implementation

- Manual smoke (optional, real device/browser): open a shop chat — orb breathes
  (idle); send a message → thinking until the AI replies; record a voice note →
  listening; an AI voice reply playing → talking; toggle light theme → orb still
  legible; Ziina links still tappable.
- Deploy is separate (`eloquent-bookings/deploy.ps1`) — not part of this plan;
  ship when ready.
