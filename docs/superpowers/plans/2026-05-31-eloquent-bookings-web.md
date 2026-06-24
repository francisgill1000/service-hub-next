# Rezzy Customer Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, responsive mobile-friendly **customer-side** web PWA (`eloquent-bookings/`) that mirrors the customer flows of the React Native `mobile-app/` and wears the salesagent mobile dark/mint design language, talking to the existing Rezzy Laravel API.

**Architecture:** Vite + React 18 + react-router-dom SPA. A single axios instance attaches `X-Device-Id` (persisted UUID) and an optional `customer_token`. A `CustomerContext` holds auth state. A `MobileLayout` renders a bottom tab bar around routed pages. The salesagent `mobile.css` + token block are ported verbatim; customer-specific UI (shop cards, booking date/slot UI, status pills) lives in an additional `customer.css`. Booking is guest-friendly — no forced login.

**Tech Stack:** Vite 5, React 18, TypeScript 5, react-router-dom 6, axios 1.7, Vitest 2 + @testing-library/react + jsdom.

**Spec:** `docs/superpowers/specs/2026-05-31-eloquent-bookings-web-design.md`

**Reference sources (read-only, for porting):**
- Functionality: `mobile-app/src/screens/guest/*`, `mobile-app/src/screens/customer/*`, `mobile-app/src/utils/api.js`, `mobile-app/src/context/CustomerContext.js`, `mobile-app/src/utils/support.js`
- Design: `D:\Francis\projects\2026\Eloquent\Solutions\salesagent\resources\css\mobile.css`, `...\pulse-styles.css` (`:root` block), `...\resources\js\Layouts\MobileLayout.tsx`

**Conventions for every task:** all commands run from the `eloquent-bookings/` directory unless stated. The dev server / tests assume Node 18+. Commit messages end with the Co-Authored-By trailer already configured for this repo.

---

## Task 1: Scaffold the Vite + React + TypeScript project

**Files:**
- Create: `eloquent-bookings/package.json`
- Create: `eloquent-bookings/vite.config.ts`
- Create: `eloquent-bookings/tsconfig.json`
- Create: `eloquent-bookings/tsconfig.node.json`
- Create: `eloquent-bookings/index.html`
- Create: `eloquent-bookings/.gitignore`
- Create: `eloquent-bookings/.env.example`
- Create: `eloquent-bookings/src/main.tsx`
- Create: `eloquent-bookings/src/App.tsx`
- Create: `eloquent-bookings/src/vite-env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "eloquent-bookings",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.7.0",
    "@types/react": "^18.3.10",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 5174, host: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1" />
    <meta name="theme-color" content="#0a0e0c" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
    <title>Rezzy</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `.gitignore`**

```gitignore
node_modules
dist
dist-ssr
*.local
.env
.env.local
.DS_Store
```

- [ ] **Step 7: Create `.env.example`**

```
VITE_API_URL=https://api.eloquentservice.com/api
```

- [ ] **Step 8: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 9: Create a placeholder `src/App.tsx`** (replaced in Task 6)

```tsx
export default function App() {
  return <div>Rezzy</div>;
}
```

- [ ] **Step 10: Create `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/tokens.css';
import './styles/mobile.css';
import './styles/customer.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

> Note: the three CSS imports are created in Tasks 2–? below; they must exist before `npm run dev`. They are created in Task 3 (styles) which you may run before first `dev`.

- [ ] **Step 11: Install dependencies**

Run: `npm install`
Expected: dependencies install with no errors; `node_modules/` created.

- [ ] **Step 12: Commit**

```bash
git add eloquent-bookings/package.json eloquent-bookings/package-lock.json eloquent-bookings/vite.config.ts eloquent-bookings/tsconfig.json eloquent-bookings/tsconfig.node.json eloquent-bookings/index.html eloquent-bookings/.gitignore eloquent-bookings/.env.example eloquent-bookings/src/main.tsx eloquent-bookings/src/App.tsx eloquent-bookings/src/vite-env.d.ts
git commit -m "chore(eloquent-bookings): scaffold vite + react + ts project"
```

---

## Task 2: Test setup harness

**Files:**
- Create: `eloquent-bookings/src/test/setup.ts`

- [ ] **Step 1: Create the Vitest setup file**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
```

- [ ] **Step 2: Verify Vitest runs with zero tests**

Run: `npm run test`
Expected: Vitest reports "No test files found" (exit 0) — confirms the runner and setup load without error.

- [ ] **Step 3: Commit**

```bash
git add eloquent-bookings/src/test/setup.ts
git commit -m "test(eloquent-bookings): add vitest setup harness"
```

---

## Task 3: Port the design system (CSS)

**Files:**
- Create: `eloquent-bookings/src/styles/tokens.css`
- Create: `eloquent-bookings/src/styles/mobile.css` (copied from salesagent)
- Create: `eloquent-bookings/src/styles/customer.css`

- [ ] **Step 1: Create `src/styles/tokens.css`** (the `:root` block + base reset, ported from salesagent `pulse-styles.css`)

```css
/* Rezzy customer — design tokens (dark + mint), ported from salesagent */
:root {
  --bg-0: #05070a;
  --bg-1: #0a0e0c;
  --bg-2: #0f1411;
  --surface-1: #131816;
  --surface-2: #1a201d;
  --surface-3: #232b27;

  --border-1: rgba(255, 255, 255, 0.06);
  --border-2: rgba(255, 255, 255, 0.09);
  --border-3: rgba(255, 255, 255, 0.14);
  --border-mint: rgba(0, 255, 204, 0.24);

  --text-1: #f3f5f4;
  --text-2: #c5cbc8;
  --text-3: #8a938f;
  --text-4: #5d6661;
  --text-5: #3d4541;

  --mint-50:  #e6fffa;
  --mint-100: #b6fae6;
  --mint-200: #6ff5cf;
  --mint-300: #00d4aa;
  --mint-400: #00e6b8;
  --mint-500: #00ffcc;
  --mint-600: #00b894;
  --mint-700: #00876d;

  --mint-glow: rgba(0, 255, 204, 0.22);
  --mint-soft: rgba(0, 255, 204, 0.08);

  --warn: #f4b860;
  --warn-soft: rgba(244, 184, 96, 0.12);
  --danger: #f87171;
  --danger-soft: rgba(248, 113, 113, 0.12);
  --info: #60a5fa;
  --info-soft: rgba(96, 165, 250, 0.12);
  --neutral-soft: rgba(255, 255, 255, 0.06);

  --r-xs: 6px;
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-xl: 22px;
  --r-pill: 999px;

  --shadow-1: 0 1px 0 rgba(255,255,255,0.03) inset, 0 1px 2px rgba(0,0,0,0.4);
  --shadow-2: 0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.6);
  --shadow-glow: 0 0 0 1px rgba(0,255,204,0.35), 0 12px 40px -10px rgba(0,255,204,0.35);

  --font-sans: 'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}

* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  background: var(--bg-0);
  color: var(--text-1);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
button { font-family: inherit; }
```

- [ ] **Step 2: Copy salesagent `mobile.css` verbatim into the project**

Run (PowerShell):
```powershell
Copy-Item "D:\Francis\projects\2026\Eloquent\Solutions\salesagent\resources\css\mobile.css" "eloquent-bookings\src\styles\mobile.css"
```
Expected: `eloquent-bookings/src/styles/mobile.css` exists (~51 KB). This provides `.mobile-app`, `.m-tabbar`, `.m-appbar`, `.m-scroll`, `.m-screen`, `.m-empty`, `.m-modal*`, `.m-history-search`, stat/banner classes, etc.

- [ ] **Step 3: Constrain the app to a centered mobile column for desktop responsiveness — append to `src/styles/customer.css`**

Create `src/styles/customer.css` with the responsive shell wrapper plus all customer-specific component styles:

```css
/* Responsive shell: full-bleed on phones, centered ~480px column on desktop */
.mobile-app {
  max-width: 480px;
  margin: 0 auto;
  border-left: 1px solid var(--border-1);
  border-right: 1px solid var(--border-1);
}
@media (max-width: 480px) {
  .mobile-app { border-left: none; border-right: none; }
}

/* Generic page scaffold reuse */
.c-page { display: flex; flex-direction: column; height: 100%; }

/* Search bar (reuses m-history-search look) */
.c-search {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface-1); border: 1px solid var(--border-1);
  border-radius: var(--r-lg); padding: 0 14px; height: 48px;
  margin: 4px 16px 12px; color: var(--text-3);
}
.c-search input {
  flex: 1; background: none; border: none; outline: none;
  color: var(--text-1); font-size: 15px; height: 100%;
}

/* Shop card */
.c-shop-card {
  display: flex; gap: 14px; background: var(--surface-1);
  border: 1px solid var(--border-1); border-radius: var(--r-lg);
  padding: 14px; margin: 0 16px 12px; cursor: pointer; text-align: left;
}
.c-shop-card .thumb {
  width: 90px; height: 90px; border-radius: var(--r-md);
  background: var(--surface-3); object-fit: cover; flex-shrink: 0;
}
.c-shop-card .body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.c-shop-card .top { display: flex; justify-content: space-between; align-items: center; }
.c-open { font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mint-400); }
.c-open.closed { color: var(--warn); }
.c-fav { background: none; border: none; cursor: pointer; color: var(--text-4); display: inline-flex; }
.c-fav.on { color: var(--mint-400); }
.c-shop-name { font-size: 16px; font-weight: 700; color: var(--text-1); margin-top: 2px; }
.c-code-pill {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 3px;
  background: var(--mint-soft); border: 1px solid var(--border-mint);
  color: var(--mint-300); font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: var(--r-xs); margin-top: 4px;
}
.c-shop-meta { font-size: 11px; color: var(--text-3); font-weight: 600; margin-top: 4px; display: flex; gap: 8px; }
.c-shop-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.c-hours { font-size: 12px; color: var(--text-2); }

/* Buttons */
.c-btn {
  background: var(--mint-500); color: #04140f; border: none;
  font-weight: 700; border-radius: var(--r-pill); padding: 8px 16px;
  font-size: 12px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.03em;
}
.c-btn-block {
  width: 100%; height: 54px; border-radius: var(--r-lg); font-size: 15px;
  text-transform: none; letter-spacing: 0; display: inline-flex;
  align-items: center; justify-content: center; gap: 8px;
}
.c-btn:disabled { opacity: 0.6; cursor: default; }
.c-btn-ghost {
  background: var(--surface-1); border: 1px solid var(--border-1);
  color: var(--text-2); border-radius: var(--r-lg); padding: 12px 20px;
  font-weight: 600; cursor: pointer;
}

/* Status pill */
.c-status { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 10px; border-radius: var(--r-pill); }
.c-status.booked { color: var(--info); background: var(--info-soft); }
.c-status.completed { color: var(--mint-300); background: var(--mint-soft); }
.c-status.cancelled { color: var(--text-3); background: var(--neutral-soft); }

/* Forms */
.c-field-label { font-size: 10px; color: var(--text-3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 8px 4px; }
.c-input-row {
  display: flex; align-items: center; gap: 10px; background: var(--surface-1);
  border: 1px solid var(--border-1); border-radius: var(--r-lg);
  height: 54px; padding: 0 16px; margin-bottom: 18px;
}
.c-input-row input { flex: 1; background: none; border: none; outline: none; color: var(--text-1); font-size: 15px; height: 100%; }
.c-error-box { background: var(--danger-soft); border: 1px solid rgba(248,113,113,0.25); border-radius: var(--r-md); padding: 12px; margin-bottom: 16px; color: var(--danger); font-size: 13px; text-align: center; }
.c-auth { padding: 24px; max-width: 480px; margin: 0 auto; }
.c-auth-title { font-size: 26px; font-weight: 800; text-align: center; margin: 8px 0; }
.c-auth-sub { font-size: 14px; color: var(--text-3); text-align: center; margin-bottom: 28px; }
.c-link { color: var(--mint-300); }
.c-muted-center { text-align: center; color: var(--text-3); font-size: 14px; margin-top: 22px; }

/* Date strip + slots (ShopDetail) */
.c-date-strip { display: flex; gap: 8px; overflow-x: auto; padding: 4px 16px 12px; }
.c-date-strip::-webkit-scrollbar { display: none; }
.c-date-cell {
  flex: 0 0 auto; width: 54px; padding: 8px 0; border-radius: var(--r-md);
  background: var(--surface-1); border: 1px solid var(--border-1);
  text-align: center; cursor: pointer; color: var(--text-2);
}
.c-date-cell.active { background: var(--mint-500); color: #04140f; border-color: transparent; }
.c-date-cell .dow { font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.8; }
.c-date-cell .dnum { font-size: 17px; font-weight: 800; }
.c-slot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 0 16px; }
.c-slot { padding: 10px 0; border-radius: var(--r-md); background: var(--surface-1); border: 1px solid var(--border-1); color: var(--text-2); font-size: 13px; font-weight: 600; cursor: pointer; }
.c-slot.active { background: var(--mint-500); color: #04140f; border-color: transparent; }

/* Service rows */
.c-service { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border-1); cursor: pointer; }
.c-service.on { background: var(--mint-soft); }
.c-service .price { color: var(--mint-300); font-weight: 700; }

/* Detail card */
.c-card { background: var(--surface-1); border: 1px solid var(--border-1); border-radius: var(--r-lg); padding: 16px; margin: 0 16px 12px; }
.c-row { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--border-1); }
.c-row:first-of-type { border-top: none; }
.c-row .k { color: var(--text-3); font-size: 13px; }
.c-row .v { color: var(--text-1); font-size: 13px; font-weight: 600; text-align: right; }

/* Sticky booking footer */
.c-book-bar {
  position: sticky; bottom: 0; padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(0deg, var(--bg-1) 70%, transparent);
  display: flex; align-items: center; gap: 12px;
}
.c-book-bar .total { font-size: 18px; font-weight: 800; }

/* Avatar (account) */
.c-avatar { width: 84px; height: 84px; border-radius: 26px; background: var(--mint-soft); border: 2px solid var(--border-mint); color: var(--mint-300); display: grid; place-items: center; font-size: 26px; font-weight: 800; margin: 24px auto 12px; }

/* WhatsApp button */
.c-wa { width: 36px; height: 36px; border-radius: 12px; background: var(--surface-1); border: 1px solid var(--border-1); display: grid; place-items: center; color: var(--mint-400); cursor: pointer; }

/* Floating account/back actions */
.c-back { display: inline-flex; align-items: center; gap: 4px; color: var(--text-3); background: none; border: none; font-size: 14px; cursor: pointer; padding: 8px 0; }
```

- [ ] **Step 4: Verify the CSS files exist and dev server boots**

Run: `npm run dev`
Expected: Vite starts on `http://localhost:5174`; the placeholder "Rezzy" renders on a dark background with no console errors. Stop the server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/styles/tokens.css eloquent-bookings/src/styles/mobile.css eloquent-bookings/src/styles/customer.css
git commit -m "feat(eloquent-bookings): port salesagent mobile design system"
```

---

## Task 4: Storage + device-id utilities

**Files:**
- Create: `eloquent-bookings/src/lib/storage.ts`
- Create: `eloquent-bookings/src/lib/deviceId.ts`
- Test: `eloquent-bookings/src/lib/deviceId.test.ts`

- [ ] **Step 1: Create `src/lib/storage.ts`** (thin localStorage helpers, web equivalent of mobile-app `storage`)

```ts
export const storage = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  },
  remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
  getJSON<T>(key: string): T | null {
    const raw = this.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  setJSON(key: string, value: unknown): void {
    this.set(key, JSON.stringify(value));
  },
};
```

- [ ] **Step 2: Write the failing test for `getDeviceId`** (`src/lib/deviceId.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { getDeviceId } from './deviceId';

describe('getDeviceId', () => {
  it('generates a v4 uuid and persists it', () => {
    const id = getDeviceId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(localStorage.getItem('device_id')).toBe(id);
  });

  it('returns the same id on subsequent calls', () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(second).toBe(first);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- deviceId`
Expected: FAIL — cannot find module `./deviceId`.

- [ ] **Step 4: Create `src/lib/deviceId.ts`**

```ts
import { storage } from './storage';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cached: string | null = null;

export function getDeviceId(): string {
  if (cached) return cached;
  let id = storage.get('device_id');
  if (!id) {
    id = uuidv4();
    storage.set('device_id', id);
  }
  cached = id;
  return id;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- deviceId`
Expected: PASS (2 tests). Note: the module-level `cached` persists within a run; the second test relies on the same generated id, which is correct behaviour.

- [ ] **Step 6: Commit**

```bash
git add eloquent-bookings/src/lib/storage.ts eloquent-bookings/src/lib/deviceId.ts eloquent-bookings/src/lib/deviceId.test.ts
git commit -m "feat(eloquent-bookings): add storage and device-id utilities"
```

---

## Task 5: API axios instance with interceptors

**Files:**
- Create: `eloquent-bookings/src/lib/api.ts`
- Test: `eloquent-bookings/src/lib/api.test.ts`

- [ ] **Step 1: Write the failing test** (`src/lib/api.test.ts`)

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import api from './api';

describe('api instance', () => {
  beforeEach(() => localStorage.clear());

  it('uses the default base URL when env is unset', () => {
    expect(api.defaults.baseURL).toBe('https://api.eloquentservice.com/api');
  });

  it('attaches X-Device-Id on every request', async () => {
    const config = await (api.interceptors.request as any).handlers[0].fulfilled({ headers: {} });
    expect(config.headers['X-Device-Id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('attaches the customer token as a Bearer header when present', async () => {
    localStorage.setItem('customer_token', 'tok123');
    const config = await (api.interceptors.request as any).handlers[0].fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer tok123');
  });

  it('omits Authorization when no token is stored', async () => {
    const config = await (api.interceptors.request as any).handlers[0].fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- api`
Expected: FAIL — cannot find module `./api`.

- [ ] **Step 3: Create `src/lib/api.ts`**

```ts
import axios from 'axios';
import { storage } from './storage';
import { getDeviceId } from './deviceId';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.eloquentservice.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers['X-Device-Id'] = getDeviceId();

  const token = storage.get('customer_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- api`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/lib/api.ts eloquent-bookings/src/lib/api.test.ts
git commit -m "feat(eloquent-bookings): add axios api instance with device-id and auth interceptors"
```

---

## Task 6: CustomerContext (auth state)

**Files:**
- Create: `eloquent-bookings/src/context/CustomerContext.tsx`
- Test: `eloquent-bookings/src/context/CustomerContext.test.tsx`

- [ ] **Step 1: Write the failing test** (`src/context/CustomerContext.test.tsx`)

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CustomerProvider, useCustomer } from './CustomerContext';

function Probe() {
  const { customer, loginCustomer, logoutCustomer } = useCustomer();
  return (
    <div>
      <span data-testid="name">{customer?.name ?? 'guest'}</span>
      <button onClick={() => loginCustomer({ id: 1, name: 'Ada', phone: '050' }, 'tok')}>login</button>
      <button onClick={() => logoutCustomer()}>logout</button>
    </div>
  );
}

describe('CustomerContext', () => {
  it('hydrates from localStorage on mount', () => {
    localStorage.setItem('customer_data', JSON.stringify({ id: 9, name: 'Stored', phone: '1' }));
    localStorage.setItem('customer_token', 'abc');
    render(<CustomerProvider><Probe /></CustomerProvider>);
    expect(screen.getByTestId('name').textContent).toBe('Stored');
  });

  it('login then logout updates state and storage', () => {
    render(<CustomerProvider><Probe /></CustomerProvider>);
    expect(screen.getByTestId('name').textContent).toBe('guest');
    act(() => { screen.getByText('login').click(); });
    expect(screen.getByTestId('name').textContent).toBe('Ada');
    expect(localStorage.getItem('customer_token')).toBe('tok');
    act(() => { screen.getByText('logout').click(); });
    expect(screen.getByTestId('name').textContent).toBe('guest');
    expect(localStorage.getItem('customer_token')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- CustomerContext`
Expected: FAIL — cannot find module `./CustomerContext`.

- [ ] **Step 3: Create `src/context/CustomerContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { storage } from '@/lib/storage';

export type Customer = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
};

type CustomerContextValue = {
  customer: Customer | null;
  customerToken: string | null;
  loading: boolean;
  loginCustomer: (user: Customer, token: string) => void;
  logoutCustomer: () => void;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = storage.getJSON<Customer>('customer_data');
    const token = storage.get('customer_token');
    if (user && token) {
      setCustomer(user);
      setCustomerToken(token);
    }
    setLoading(false);
  }, []);

  const loginCustomer = (user: Customer, token: string) => {
    setCustomer(user);
    setCustomerToken(token);
    storage.setJSON('customer_data', user);
    storage.set('customer_token', token);
  };

  const logoutCustomer = () => {
    setCustomer(null);
    setCustomerToken(null);
    storage.remove('customer_data');
    storage.remove('customer_token');
  };

  return (
    <CustomerContext.Provider value={{ customer, customerToken, loading, loginCustomer, logoutCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used inside CustomerProvider');
  return ctx;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- CustomerContext`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/context/CustomerContext.tsx eloquent-bookings/src/context/CustomerContext.test.tsx
git commit -m "feat(eloquent-bookings): add CustomerContext auth state"
```

---

## Task 7: Icon set + small UI primitives

**Files:**
- Create: `eloquent-bookings/src/components/Icons.tsx`
- Create: `eloquent-bookings/src/components/Spinner.tsx`
- Create: `eloquent-bookings/src/components/EmptyState.tsx`
- Create: `eloquent-bookings/src/components/WhatsAppButton.tsx`

- [ ] **Step 1: Create `src/components/Icons.tsx`** (inline SVG set, lucide-style, matching salesagent's stroke conventions)

```tsx
type P = { size?: number };
const base = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
};

export const Icons = {
  Home: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
  ),
  Calendar: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
  ),
  Heart: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M12 21s-7-4.5-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>
  ),
  HeartFilled: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>
  ),
  MapPin: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M12 22s-7-7.6-7-13a7 7 0 0 1 14 0c0 5.4-7 13-7 13z" /><circle cx="12" cy="9" r="2.5" /></svg>
  ),
  User: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  ),
  Search: ({ size = 18 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
  ),
  Locate: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
  ),
  Chevron: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M9 6l6 6-6 6" /></svg>
  ),
  ChevronLeft: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M15 6l-6 6 6 6" /></svg>
  ),
  Clock: ({ size = 14 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  Check: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>
  ),
  Logout: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
  ),
  WhatsApp: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.3-.9-2.8-1.2-4.5-4-4.7-4.2-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.6.2.4.9 1.4 1.9 2.2 1.2 1.1 2.1 1.4 2.4 1.5.2.1.4.1.5-.1l.7-.9c.2-.2.4-.2.6-.1l1.9.9c.3.1.5.2.5.4.1.2.1.8-.1 1.4z" /></svg>
  ),
  Store: ({ size = 28 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></svg>
  ),
};
```

- [ ] **Step 2: Create `src/components/Spinner.tsx`**

```tsx
export function Spinner({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 48, color: 'var(--text-3)' }}>
      <span
        style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '3px solid var(--border-2)', borderTopColor: 'var(--mint-400)',
          animation: 'c-spin 0.8s linear infinite',
        }}
      />
      {label && <span style={{ fontSize: 13 }}>{label}</span>}
      <style>{`@keyframes c-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/EmptyState.tsx`**

```tsx
import type { ReactNode } from 'react';

export function EmptyState({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="m-empty">
      {icon}
      <p style={{ fontWeight: 700, color: 'var(--text-1)', margin: '8px 0 0' }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>{subtitle}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/WhatsAppButton.tsx`** (constants ported from `mobile-app/src/utils/support.js`)

```tsx
import { Icons } from './Icons';

const SUPPORT_NUMBER = '971557369629';
const SUPPORT_MESSAGE = 'Hi Rezzy team, I need some help.';

export function WhatsAppButton() {
  const href = `https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;
  return (
    <a className="c-wa" href={href} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp support">
      <Icons.WhatsApp size={18} />
    </a>
  );
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -b`
Expected: completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add eloquent-bookings/src/components/Icons.tsx eloquent-bookings/src/components/Spinner.tsx eloquent-bookings/src/components/EmptyState.tsx eloquent-bookings/src/components/WhatsAppButton.tsx
git commit -m "feat(eloquent-bookings): add icon set and ui primitives"
```

---

## Task 8: Shared types + ShopCard component

**Files:**
- Create: `eloquent-bookings/src/types.ts`
- Create: `eloquent-bookings/src/components/ShopCard.tsx`
- Test: `eloquent-bookings/src/components/ShopCard.test.tsx`

- [ ] **Step 1: Create `src/types.ts`** (shapes inferred from the API responses the RN screens consume)

```ts
export type WorkingHours = { start_time?: string; end_time?: string };

export type Service = {
  id: number;
  title?: string;
  name?: string;
  price?: number | string;
  image?: string;
};

export type Shop = {
  id: number;
  name: string;
  logo?: string;
  hero_image?: string;
  location?: string;
  shop_code?: string;
  rating?: number | string;
  distance?: string;
  distance_km?: number | string;
  is_open?: boolean;
  is_favourite?: boolean;
  today_working_hours?: WorkingHours;
  catalogs?: Service[];
};

export type Booking = {
  id: number;
  status?: string;
  date?: string;
  show_date?: string;
  start_time?: string;
  end_time?: string;
  charges?: number | string;
  booking_reference?: string;
  customer_name?: string;
  customer?: { name?: string };
  shop?: { name?: string; location?: string };
  services?: Service[];
};

export type Paginated<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
};
```

- [ ] **Step 2: Write the failing test** (`src/components/ShopCard.test.tsx`)

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopCard } from './ShopCard';
import type { Shop } from '@/types';

const shop: Shop = {
  id: 7, name: 'Glow Salon', location: 'Marina', shop_code: 'GLOW7',
  is_open: true, is_favourite: false, rating: 4.8,
  today_working_hours: { start_time: '09:00', end_time: '21:00' },
};

describe('ShopCard', () => {
  it('renders name, open badge and code', () => {
    render(<ShopCard shop={shop} onOpen={() => {}} onFavourite={() => {}} />);
    expect(screen.getByText('Glow Salon')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('GLOW7')).toBeInTheDocument();
  });

  it('fires onFavourite without triggering onOpen', async () => {
    const onOpen = vi.fn();
    const onFavourite = vi.fn();
    render(<ShopCard shop={shop} onOpen={onOpen} onFavourite={onFavourite} />);
    await userEvent.click(screen.getByLabelText('Toggle favourite'));
    expect(onFavourite).toHaveBeenCalledWith(7);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test -- ShopCard`
Expected: FAIL — cannot find module `./ShopCard`.

- [ ] **Step 4: Create `src/components/ShopCard.tsx`**

```tsx
import type { Shop } from '@/types';
import { Icons } from './Icons';

export function ShopCard({ shop, onOpen, onFavourite }: {
  shop: Shop;
  onOpen: (id: number) => void;
  onFavourite: (id: number) => void;
}) {
  const distance = shop.distance
    ?? (shop.distance_km != null
      ? `${typeof shop.distance_km === 'number' ? shop.distance_km.toFixed(1) : shop.distance_km} km`
      : null);

  return (
    <button type="button" className="c-shop-card" onClick={() => onOpen(shop.id)}>
      {shop.logo
        ? <img className="thumb" src={shop.logo} alt="" />
        : <span className="thumb" />}
      <div className="body">
        <div className="top">
          <span className={`c-open ${shop.is_open ? '' : 'closed'}`}>{shop.is_open ? 'Open' : 'Closed'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              role="button"
              aria-label="Toggle favourite"
              className={`c-fav ${shop.is_favourite ? 'on' : ''}`}
              onClick={(e) => { e.stopPropagation(); onFavourite(shop.id); }}
            >
              {shop.is_favourite ? <Icons.HeartFilled size={20} /> : <Icons.Heart size={20} />}
            </span>
            {shop.rating != null && <span style={{ fontSize: 13, fontWeight: 700 }}>{shop.rating}</span>}
          </span>
        </div>
        <span className="c-shop-name">{shop.name}</span>
        {shop.shop_code && <span className="c-code-pill">#{shop.shop_code}</span>}
        <span className="c-shop-meta">
          {shop.location && <span>{shop.location}</span>}
          {distance && <span>{distance}</span>}
        </span>
        <span className="c-shop-foot">
          <span className="c-hours">
            {shop.today_working_hours?.start_time} - {shop.today_working_hours?.end_time}
          </span>
          <span className="c-btn" onClick={(e) => { e.stopPropagation(); onOpen(shop.id); }}>Book Now</span>
        </span>
      </div>
    </button>
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test -- ShopCard`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add eloquent-bookings/src/types.ts eloquent-bookings/src/components/ShopCard.tsx eloquent-bookings/src/components/ShopCard.test.tsx
git commit -m "feat(eloquent-bookings): add shared types and ShopCard"
```

---

## Task 9: MobileLayout, AppBar, and the router shell

**Files:**
- Create: `eloquent-bookings/src/layout/AppBar.tsx`
- Create: `eloquent-bookings/src/layout/MobileLayout.tsx`
- Modify: `eloquent-bookings/src/App.tsx`
- Create: stub pages so routes resolve: `eloquent-bookings/src/pages/Home.tsx`, `Explore.tsx`, `NearMe.tsx`, `Favourites.tsx`, `Bookings.tsx`, `BookingView.tsx`, `ShopDetail.tsx`, `Login.tsx`, `Register.tsx`, `Account.tsx`

- [ ] **Step 1: Create `src/layout/AppBar.tsx`**

```tsx
import type { ReactNode } from 'react';

export function AppBar({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="m-appbar">
      <div>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {actions && <div className="m-appbar-actions">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/layout/MobileLayout.tsx`** (ported from salesagent `MobileLayout.tsx`, tabs swapped for customer nav)

```tsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Icons } from '@/components/Icons';

type Tab = { id: string; label: string; href: string; icon: keyof typeof Icons };

const tabs: Tab[] = [
  { id: 'home', label: 'Home', href: '/', icon: 'Home' },
  { id: 'bookings', label: 'Bookings', href: '/bookings', icon: 'Calendar' },
  { id: 'favourites', label: 'Favourites', href: '/favourites', icon: 'Heart' },
  { id: 'near', label: 'Near Me', href: '/near-me', icon: 'MapPin' },
  { id: 'account', label: 'Account', href: '/account', icon: 'User' },
];

function activeTab(path: string): string {
  if (path === '/' || path.startsWith('/shop')) return 'home';
  if (path.startsWith('/bookings') || path.startsWith('/booking')) return 'bookings';
  if (path.startsWith('/favourites')) return 'favourites';
  if (path.startsWith('/near-me')) return 'near';
  if (path.startsWith('/account') || path.startsWith('/login') || path.startsWith('/register')) return 'account';
  return 'home';
}

export function MobileLayout() {
  const { pathname } = useLocation();
  const active = activeTab(pathname);

  return (
    <div className="mobile-app">
      <main className="mobile-main"><Outlet /></main>
      <div className="m-tabbar">
        {tabs.map((tab) => {
          const Icon = Icons[tab.icon];
          return (
            <Link key={tab.id} to={tab.href} className={`tab ${active === tab.id ? 'active' : ''}`}>
              <span className="icon"><Icon size={20} /></span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the 10 stub pages.** Each file uses this template with its own name (replace `Home`/`"Home"`):

```tsx
export default function Home() {
  return <div className="m-screen"><div className="m-scroll">Home</div></div>;
}
```

Create with the matching default export name and label for each: `Home.tsx` (Home), `Explore.tsx` (Explore), `NearMe.tsx` (NearMe), `Favourites.tsx` (Favourites), `Bookings.tsx` (Bookings), `BookingView.tsx` (BookingView), `ShopDetail.tsx` (ShopDetail), `Login.tsx` (Login), `Register.tsx` (Register), `Account.tsx` (Account).

- [ ] **Step 4: Replace `src/App.tsx` with the router**

```tsx
import { Routes, Route } from 'react-router-dom';
import { CustomerProvider } from '@/context/CustomerContext';
import { MobileLayout } from '@/layout/MobileLayout';
import Home from '@/pages/Home';
import Explore from '@/pages/Explore';
import NearMe from '@/pages/NearMe';
import Favourites from '@/pages/Favourites';
import Bookings from '@/pages/Bookings';
import BookingView from '@/pages/BookingView';
import ShopDetail from '@/pages/ShopDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Account from '@/pages/Account';

export default function App() {
  return (
    <CustomerProvider>
      <Routes>
        {/* Full-screen routes (no tab bar) */}
        <Route path="/shop/:id" element={<ShopDetail />} />
        <Route path="/booking/:id" element={<BookingView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Tabbed routes */}
        <Route element={<MobileLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/near-me" element={<NearMe />} />
          <Route path="/favourites" element={<Favourites />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Routes>
    </CustomerProvider>
  );
}
```

- [ ] **Step 5: Verify the app boots and tabs navigate**

Run: `npm run dev`
Expected: dark mobile column renders with a bottom tab bar; clicking tabs swaps the stub content and highlights the active tab. Stop the server.

- [ ] **Step 6: Type-check and commit**

```bash
npx tsc -b
git add eloquent-bookings/src/layout eloquent-bookings/src/App.tsx eloquent-bookings/src/pages
git commit -m "feat(eloquent-bookings): add mobile layout, tab bar, and router shell"
```

---

## Task 10: Home page (shop list, search, load-more, favourite)

**Files:**
- Create: `eloquent-bookings/src/lib/shops.ts` (shared shop-list hook)
- Modify: `eloquent-bookings/src/pages/Home.tsx`
- Test: `eloquent-bookings/src/pages/Home.test.tsx`

- [ ] **Step 1: Create `src/lib/shops.ts`** (reusable favourite toggle helper)

```ts
import api from './api';

export async function toggleFavourite(shopId: number): Promise<void> {
  await api.post(`/shops/${shopId}/favourite`);
}
```

- [ ] **Step 2: Write the failing test** (`src/pages/Home.test.tsx`)

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
import api from '@/lib/api';

beforeEach(() => {
  vi.clearAllMocks();
  (api.get as any).mockResolvedValue({
    data: { data: [{ id: 1, name: 'Acme Spa', is_open: true }], current_page: 1, last_page: 1 },
  });
});

describe('Home', () => {
  it('fetches and renders shops', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Acme Spa')).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith('/shops', expect.objectContaining({ params: expect.objectContaining({ page: 1, per_page: 10 }) }));
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test -- Home`
Expected: FAIL — `Home` still renders the stub (no "Acme Spa").

- [ ] **Step 4: Implement `src/pages/Home.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toggleFavourite } from '@/lib/shops';
import type { Shop, Paginated } from '@/types';
import { AppBar } from '@/layout/AppBar';
import { ShopCard } from '@/components/ShopCard';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Icons } from '@/components/Icons';

export default function Home() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  const fetchShops = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Shop>>('/shops', { params: { page: p, per_page: 10, search: q || undefined } });
      const data = res.data;
      setShops((prev) => (p === 1 ? data.data ?? [] : [...prev, ...(data.data ?? [])]));
      setPage(data.current_page ?? p);
      setLastPage(data.last_page ?? 1);
    } catch { /* surfaced via empty state */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchShops(1); }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { void fetchShops(1, search); }, 500);
    return () => clearTimeout(debounce.current);
  }, [search]);

  const onFavourite = async (id: number) => {
    setShops((prev) => prev.map((s) => (s.id === id ? { ...s, is_favourite: !s.is_favourite } : s)));
    try { await toggleFavourite(id); } catch { void fetchShops(page, search); }
  };

  return (
    <div className="m-screen">
      <AppBar title="Rezzy" actions={<WhatsAppButton />} />
      <div className="c-search">
        <Icons.Search size={18} />
        <input placeholder="Search businesses…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="m-scroll">
        {shops.map((s) => (
          <ShopCard key={s.id} shop={s} onOpen={(id) => navigate(`/shop/${id}`)} onFavourite={onFavourite} />
        ))}
        {loading && <Spinner />}
        {!loading && shops.length === 0 && (
          <EmptyState icon={<Icons.Search size={32} />} title="No results found" subtitle={search ? `Nothing matches "${search}".` : 'Try a different search.'} />
        )}
        {!loading && page < lastPage && (
          <button className="c-btn-ghost" style={{ display: 'block', margin: '8px auto 24px' }} onClick={() => fetchShops(page + 1, search)}>
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test -- Home`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add eloquent-bookings/src/lib/shops.ts eloquent-bookings/src/pages/Home.tsx eloquent-bookings/src/pages/Home.test.tsx
git commit -m "feat(eloquent-bookings): implement Home shop list with search and favourite"
```

---

## Task 11: Explore page

**Files:**
- Modify: `eloquent-bookings/src/pages/Explore.tsx`

> Explore behaves like Home (paginated `/shops` list with search) but is reached from the Account quick-links and Bookings empty state rather than a tab. Reuse the same structure.

- [ ] **Step 1: Implement `src/pages/Explore.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toggleFavourite } from '@/lib/shops';
import type { Shop, Paginated } from '@/types';
import { AppBar } from '@/layout/AppBar';
import { ShopCard } from '@/components/ShopCard';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';

export default function Explore() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  const fetchShops = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Shop>>('/shops', { params: { page: p, per_page: 10, search: q || undefined } });
      setShops((prev) => (p === 1 ? res.data.data ?? [] : [...prev, ...(res.data.data ?? [])]));
      setPage(res.data.current_page ?? p);
      setLastPage(res.data.last_page ?? 1);
    } catch { /* empty state */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchShops(1); }, []);
  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { void fetchShops(1, search); }, 500);
    return () => clearTimeout(debounce.current);
  }, [search]);

  const onFavourite = async (id: number) => {
    setShops((prev) => prev.map((s) => (s.id === id ? { ...s, is_favourite: !s.is_favourite } : s)));
    try { await toggleFavourite(id); } catch { void fetchShops(page, search); }
  };

  return (
    <div className="m-screen">
      <AppBar title="Explore" />
      <div className="c-search">
        <Icons.Search size={18} />
        <input placeholder="Search businesses…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="m-scroll">
        {shops.map((s) => (
          <ShopCard key={s.id} shop={s} onOpen={(id) => navigate(`/shop/${id}`)} onFavourite={onFavourite} />
        ))}
        {loading && <Spinner />}
        {!loading && shops.length === 0 && (
          <EmptyState icon={<Icons.Search size={32} />} title="No results found" />
        )}
        {!loading && page < lastPage && (
          <button className="c-btn-ghost" style={{ display: 'block', margin: '8px auto 24px' }} onClick={() => fetchShops(page + 1, search)}>
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the `/explore` route.** Modify `src/App.tsx` — it is already present in the tabbed routes block from Task 9 Step 4 (`<Route path="/explore" element={<Explore />} />`). Verify it exists; if not, add it.

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc -b
git add eloquent-bookings/src/pages/Explore.tsx
git commit -m "feat(eloquent-bookings): implement Explore page"
```

---

## Task 12: Near Me page (geolocation)

**Files:**
- Modify: `eloquent-bookings/src/pages/NearMe.tsx`
- Test: `eloquent-bookings/src/pages/NearMe.test.tsx`

- [ ] **Step 1: Write the failing test** (`src/pages/NearMe.test.tsx`)

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NearMe from './NearMe';

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
import api from '@/lib/api';

beforeEach(() => {
  vi.clearAllMocks();
  (api.get as any).mockResolvedValue({ data: { data: [{ id: 2, name: 'Near Spa', is_open: true, distance_km: 1.2 }] } });
  Object.defineProperty(global.navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: (ok: any) => ok({ coords: { latitude: 25.1, longitude: 55.2, accuracy: 10 } }) },
  });
});

describe('NearMe', () => {
  it('requests nearby shops with coordinates', async () => {
    render(<MemoryRouter><NearMe /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Near Spa')).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith('/shops/nearby', { params: { lat: 25.1, lon: 55.2, radius: 10 } });
  });

  it('shows an error state when geolocation is denied', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (_ok: any, err: any) => err({ code: 1, message: 'denied' }) },
    });
    render(<MemoryRouter><NearMe /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Location Unavailable')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- NearMe`
Expected: FAIL — stub has no "Near Spa".

- [ ] **Step 3: Implement `src/pages/NearMe.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Shop } from '@/types';
import { AppBar } from '@/layout/AppBar';
import { ShopCard } from '@/components/ShopCard';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('unsupported')); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
  });
}

export default function NearMe() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getPosition();
      const res = await api.get('/shops/nearby', { params: { lat: pos.coords.latitude, lon: pos.coords.longitude, radius: 10 } });
      setShops(res.data?.data ?? res.data ?? []);
    } catch {
      setError('Location permission denied or unavailable. Please enable location and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchNearby(); }, [fetchNearby]);

  return (
    <div className="m-screen">
      <AppBar title="Near Me" actions={
        <button className="c-wa" onClick={() => void fetchNearby()} aria-label="Refresh location"><Icons.Locate size={18} /></button>
      } />
      <div className="m-scroll">
        {loading && <Spinner label="Finding businesses near you…" />}
        {!loading && error && (
          <EmptyState
            icon={<Icons.MapPin size={32} />}
            title="Location Unavailable"
            subtitle={error}
            action={<button className="c-btn-ghost" onClick={() => void fetchNearby()}>Try again</button>}
          />
        )}
        {!loading && !error && shops.length === 0 && (
          <EmptyState icon={<Icons.Store size={32} />} title="No businesses found nearby" subtitle="Try again later." />
        )}
        {!loading && !error && shops.map((s) => (
          <ShopCard key={s.id} shop={s} onOpen={(id) => navigate(`/shop/${id}`)} onFavourite={() => {}} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- NearMe`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/pages/NearMe.tsx eloquent-bookings/src/pages/NearMe.test.tsx
git commit -m "feat(eloquent-bookings): implement Near Me with browser geolocation"
```

---

## Task 13: Favourites page

**Files:**
- Modify: `eloquent-bookings/src/pages/Favourites.tsx`

- [ ] **Step 1: Implement `src/pages/Favourites.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toggleFavourite } from '@/lib/shops';
import type { Shop, Paginated } from '@/types';
import { AppBar } from '@/layout/AppBar';
import { ShopCard } from '@/components/ShopCard';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';

export default function Favourites() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavourites = async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Shop>>('/shops', { params: { favourites: 1, per_page: 50 } });
      setShops(res.data.data ?? []);
    } catch { /* empty state */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchFavourites(); }, []);

  const onFavourite = async (id: number) => {
    setShops((prev) => prev.filter((s) => s.id !== id));
    try { await toggleFavourite(id); } catch { void fetchFavourites(); }
  };

  return (
    <div className="m-screen">
      <AppBar title="Favourites" />
      <div className="m-scroll">
        {loading && <Spinner />}
        {!loading && shops.length === 0 && (
          <EmptyState
            icon={<Icons.Heart size={32} />}
            title="No favourites yet"
            subtitle="Tap the heart on a business to save it here."
            action={<button className="c-btn-ghost" onClick={() => navigate('/explore')}>Explore</button>}
          />
        )}
        {!loading && shops.map((s) => (
          <ShopCard key={s.id} shop={{ ...s, is_favourite: true }} onOpen={(id) => navigate(`/shop/${id}`)} onFavourite={onFavourite} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc -b
git add eloquent-bookings/src/pages/Favourites.tsx
git commit -m "feat(eloquent-bookings): implement Favourites page"
```

---

## Task 14: Shop Detail + booking flow

**Files:**
- Create: `eloquent-bookings/src/lib/date.ts`
- Create: `eloquent-bookings/src/lib/booking.ts`
- Modify: `eloquent-bookings/src/pages/ShopDetail.tsx`
- Test: `eloquent-bookings/src/lib/booking.test.ts`

- [ ] **Step 1: Create `src/lib/date.ts`**

```ts
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function generateDates(count = 31): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dow(d: Date): string { return DOW[d.getDay()]; }
```

- [ ] **Step 2: Write the failing test for the booking payload builder** (`src/lib/booking.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { buildBookingPayload } from './booking';
import type { Service } from '@/types';

const catalogs: Service[] = [
  { id: 1, title: 'Cut', price: 50, image: 'a.png' },
  { id: 2, title: 'Color', price: 120, image: 'b.png' },
];

describe('buildBookingPayload', () => {
  it('includes date, time, total charges and strips images from services', () => {
    const payload = buildBookingPayload('2026-06-01', '10:00', catalogs, [1, 2]);
    expect(payload.date).toBe('2026-06-01');
    expect(payload.start_time).toBe('10:00');
    expect(payload.charges).toBe(170);
    expect(payload.services).toHaveLength(2);
    expect((payload.services[0] as any).image).toBeUndefined();
  });

  it('only includes selected services', () => {
    const payload = buildBookingPayload('2026-06-01', '10:00', catalogs, [2]);
    expect(payload.services).toHaveLength(1);
    expect(payload.charges).toBe(120);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test -- booking`
Expected: FAIL — cannot find module `./booking`.

- [ ] **Step 4: Create `src/lib/booking.ts`**

```ts
import type { Service } from '@/types';

export type BookingPayload = {
  date: string;
  start_time: string;
  charges: number;
  services: Omit<Service, 'image'>[];
};

export function buildBookingPayload(
  date: string,
  startTime: string,
  catalogs: Service[],
  selectedIds: number[],
): BookingPayload {
  const selected = catalogs.filter((c) => selectedIds.includes(c.id));
  const charges = selected.reduce((sum, s) => sum + (s.price != null ? parseFloat(String(s.price)) : 0), 0);
  const services = selected.map(({ image, ...rest }) => rest);
  return { date, start_time: startTime, charges, services };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test -- booking`
Expected: PASS (2 tests).

- [ ] **Step 6: Implement `src/pages/ShopDetail.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { toggleFavourite } from '@/lib/shops';
import { buildBookingPayload } from '@/lib/booking';
import { generateDates, formatLocalDate, dow } from '@/lib/date';
import type { Shop } from '@/types';
import { Spinner } from '@/components/Spinner';
import { Icons } from '@/components/Icons';

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dates = useMemo(() => generateDates(31), []);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShop = async () => {
    try {
      const res = await api.get(`/shops/${id}`, { params: { date: formatLocalDate(selectedDate) } });
      const data: Shop = res.data?.data ?? res.data;
      if (data && !Array.isArray(data.catalogs)) data.catalogs = [];
      setShop(data);
    } catch { /* not found handled below */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchShop(); /* eslint-disable-next-line */ }, [id, selectedDate]);

  const total = useMemo(() => {
    if (!shop?.catalogs) return 0;
    return selectedServices.reduce((sum, sid) => {
      const s = shop.catalogs!.find((c) => c.id === sid);
      return sum + (s?.price != null ? parseFloat(String(s.price)) : 0);
    }, 0);
  }, [shop, selectedServices]);

  const toggleService = (sid: number) =>
    setSelectedServices((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));

  // The shop API exposes time slots for the chosen date; fall back to none.
  const slots: string[] = ((shop as unknown as { slots?: string[] })?.slots) ?? [];

  const handleBook = async () => {
    if (!shop || booking || !selectedTime) return;
    setBooking(true);
    setError(null);
    try {
      const payload = buildBookingPayload(formatLocalDate(selectedDate), selectedTime, shop.catalogs ?? [], selectedServices);
      const res = await api.post(`/shops/${shop.id}/book`, payload);
      const bookingId = res.data?.data?.id ?? res.data?.id;
      navigate(`/booking/${bookingId}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Something went wrong. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="m-screen"><Spinner /></div>;
  if (!shop) return (
    <div className="m-screen">
      <div className="m-appbar"><button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back</button></div>
      <div className="m-scroll"><p style={{ textAlign: 'center', color: 'var(--text-3)' }}>Business not found.</p></div>
    </div>
  );

  return (
    <div className="m-screen">
      <div className="m-appbar">
        <button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back</button>
        <span className="c-fav on" role="button" aria-label="Toggle favourite" onClick={() => void toggleFavourite(shop.id)}>
          <Icons.HeartFilled size={22} />
        </span>
      </div>

      <div className="m-scroll">
        {shop.hero_image || shop.logo
          ? <img src={shop.hero_image || shop.logo} alt="" style={{ width: 'calc(100% - 32px)', height: 180, objectFit: 'cover', borderRadius: 'var(--r-lg)', margin: '0 16px 12px' }} />
          : null}
        <h2 style={{ margin: '0 16px', fontSize: 22 }}>{shop.name}</h2>
        {shop.location && <p style={{ margin: '4px 16px 16px', color: 'var(--text-3)', fontSize: 13 }}>{shop.location}</p>}

        <div className="m-section-title" style={{ padding: '0 16px' }}><h3>Select date</h3></div>
        <div className="c-date-strip">
          {dates.map((d) => {
            const active = formatLocalDate(d) === formatLocalDate(selectedDate);
            return (
              <button key={formatLocalDate(d)} className={`c-date-cell ${active ? 'active' : ''}`} onClick={() => { setSelectedDate(d); setSelectedTime(''); }}>
                <div className="dow">{dow(d)}</div>
                <div className="dnum">{d.getDate()}</div>
              </button>
            );
          })}
        </div>

        {slots.length > 0 && (
          <>
            <div className="m-section-title" style={{ padding: '0 16px' }}><h3>Select time</h3></div>
            <div className="c-slot-grid">
              {slots.map((t) => (
                <button key={t} className={`c-slot ${selectedTime === t ? 'active' : ''}`} onClick={() => setSelectedTime(t)}>{t}</button>
              ))}
            </div>
          </>
        )}

        {(shop.catalogs?.length ?? 0) > 0 && (
          <>
            <div className="m-section-title" style={{ padding: '16px 16px 0' }}><h3>Services</h3></div>
            <div style={{ margin: '8px 16px', border: '1px solid var(--border-1)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              {shop.catalogs!.map((s) => (
                <div key={s.id} className={`c-service ${selectedServices.includes(s.id) ? 'on' : ''}`} onClick={() => toggleService(s.id)}>
                  <span>{s.title || s.name}</span>
                  <span className="price">AED {parseFloat(String(s.price ?? 0)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {error && <p className="c-error-box" style={{ margin: '0 16px 12px' }}>{error}</p>}
      </div>

      <div className="c-book-bar">
        <span className="total">AED {total.toFixed(2)}</span>
        <button className="c-btn c-btn-block" style={{ flex: 1 }} disabled={booking || !selectedTime} onClick={() => void handleBook()}>
          {booking ? 'Booking…' : 'Book Now'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Type-check, manual smoke, commit**

Run: `npx tsc -b`
Expected: no errors.

```bash
git add eloquent-bookings/src/lib/date.ts eloquent-bookings/src/lib/booking.ts eloquent-bookings/src/lib/booking.test.ts eloquent-bookings/src/pages/ShopDetail.tsx
git commit -m "feat(eloquent-bookings): implement shop detail and guest booking flow"
```

---

## Task 15: Booking View page

**Files:**
- Modify: `eloquent-bookings/src/pages/BookingView.tsx`

- [ ] **Step 1: Implement `src/pages/BookingView.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import type { Booking } from '@/types';
import { Spinner } from '@/components/Spinner';
import { Icons } from '@/components/Icons';

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  return 'booked';
}

export default function BookingView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/booking/${id}`)
      .then((res) => setBooking(res.data?.data ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="m-screen"><Spinner /></div>;
  if (!booking) return (
    <div className="m-screen">
      <div className="m-appbar"><button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back</button></div>
      <div className="m-scroll"><p style={{ textAlign: 'center', color: 'var(--text-3)' }}>Booking not found.</p></div>
    </div>
  );

  const status = String(booking.status || 'Booked');
  const cls = statusClass(status);
  const ref = booking.booking_reference || `BK${String(booking.id).padStart(5, '0')}`;
  const services = booking.services ?? [];

  return (
    <div className="m-screen">
      <div className="m-appbar"><button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back</button></div>
      <div className="m-scroll">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, margin: '0 auto 12px', display: 'grid', placeItems: 'center', background: 'var(--mint-soft)', color: 'var(--mint-300)' }}>
            <Icons.Check size={40} />
          </div>
          <h2 style={{ margin: 0 }}>{cls === 'booked' ? 'Booking Confirmed!' : status}</h2>
          <p style={{ color: 'var(--text-3)', margin: '4px 0' }}>#{ref}</p>
          <span className={`c-status ${cls}`}>{status}</span>
        </div>

        <div className="c-card">
          <h3 style={{ margin: '0 0 8px' }}>{booking.shop?.name || 'Shop'}</h3>
          {booking.shop?.location && <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>{booking.shop.location}</p>}
        </div>

        <div className="c-card">
          <div className="c-field-label" style={{ margin: '0 0 8px' }}>Appointment details</div>
          <div className="c-row"><span className="k">Customer</span><span className="v">{booking.customer?.name || booking.customer_name || 'Guest'}</span></div>
          <div className="c-row"><span className="k">Date</span><span className="v">{booking.show_date || booking.date}</span></div>
          <div className="c-row"><span className="k">Time</span><span className="v">{booking.start_time ? `${booking.start_time}${booking.end_time ? ` – ${booking.end_time}` : ''}` : 'TBD'}</span></div>
        </div>

        {services.length > 0 && (
          <div className="c-card">
            <div className="c-field-label" style={{ margin: '0 0 8px' }}>Services booked</div>
            {services.map((s, i) => (
              <div key={i} className="c-row"><span className="k">{s.title || s.name}</span><span className="v">AED {parseFloat(String(s.price ?? 0)).toFixed(2)}</span></div>
            ))}
            <div className="c-row" style={{ borderTop: '1px solid var(--border-3)' }}>
              <span className="k" style={{ fontWeight: 700, color: 'var(--text-1)' }}>Total</span>
              <span className="v" style={{ color: 'var(--mint-300)', fontSize: 16 }}>AED {Number(booking.charges || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        <button className="c-btn c-btn-block" style={{ margin: '8px 16px 24px', width: 'calc(100% - 32px)' }} onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc -b
git add eloquent-bookings/src/pages/BookingView.tsx
git commit -m "feat(eloquent-bookings): implement booking detail view"
```

---

## Task 16: Bookings list page

**Files:**
- Modify: `eloquent-bookings/src/pages/Bookings.tsx`

- [ ] **Step 1: Implement `src/pages/Bookings.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Booking } from '@/types';
import { AppBar } from '@/layout/AppBar';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Icons } from '@/components/Icons';

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  return 'booked';
}

function dateParts(date?: string): { day: string; mon: string } {
  if (!date) return { day: '--', mon: '---' };
  const d = new Date(`${date}T00:00:00`);
  return { day: String(d.getDate()), mon: d.toLocaleString('en-US', { month: 'short' }) };
}

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings')
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="m-screen">
      <AppBar title="My Bookings" actions={<WhatsAppButton />} />
      <div className="m-scroll">
        {loading && <Spinner />}
        {!loading && bookings.length === 0 && (
          <EmptyState
            icon={<Icons.Calendar size={32} />}
            title="No bookings yet"
            subtitle="Browse businesses and make your first booking."
            action={<button className="c-btn-ghost" onClick={() => navigate('/explore')}>Explore</button>}
          />
        )}
        {!loading && bookings.map((b) => {
          const { day, mon } = dateParts(b.date);
          const status = b.status || 'Booked';
          const services = b.services?.map((s) => s.title || s.name).filter(Boolean).join(', ') || 'Service';
          return (
            <button key={b.id} className="c-shop-card" onClick={() => navigate(`/booking/${b.id}`)}>
              <span className="thumb" style={{ width: 56, height: 56, display: 'grid', placeItems: 'center', color: 'var(--mint-300)', background: 'var(--mint-soft)' }}>
                <span style={{ textAlign: 'center', lineHeight: 1 }}>
                  <span style={{ display: 'block', fontSize: 18, fontWeight: 800 }}>{day}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{mon}</span>
                </span>
              </span>
              <div className="body">
                <div className="top">
                  <span className="c-shop-name" style={{ marginTop: 0 }}>{b.shop?.name || 'Shop'}</span>
                  <span className={`c-status ${statusClass(status)}`}>{status}</span>
                </div>
                <span className="c-shop-meta">{services}</span>
                {b.start_time && <span className="c-hours" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}><Icons.Clock size={13} /> {b.start_time}</span>}
                <span style={{ fontWeight: 700, marginTop: 4 }}>AED {b.charges || 0}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc -b
git add eloquent-bookings/src/pages/Bookings.tsx
git commit -m "feat(eloquent-bookings): implement bookings list"
```

---

## Task 17: Login page

**Files:**
- Modify: `eloquent-bookings/src/pages/Login.tsx`
- Test: `eloquent-bookings/src/pages/Login.test.tsx`

> Web version drops the RN biometric flow (`expo-local-authentication`) but keeps phone+password login and a "remember me" checkbox persisted to localStorage.

- [ ] **Step 1: Write the failing test** (`src/pages/Login.test.tsx`)

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CustomerProvider } from '@/context/CustomerContext';
import Login from './Login';

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }));
import api from '@/lib/api';

const renderLogin = () => render(
  <MemoryRouter><CustomerProvider><Login /></CustomerProvider></MemoryRouter>,
);

beforeEach(() => vi.clearAllMocks());

describe('Login', () => {
  it('posts credentials and stores the token on success', async () => {
    (api.post as any).mockResolvedValue({ data: { token: 'tok', user: { id: 1, name: 'Ada', phone: '050' } } });
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('e.g. 0501234567'), '0501234567');
    await userEvent.type(screen.getByPlaceholderText('Your password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/login', { phone: '0501234567', password: 'secret' }));
    expect(localStorage.getItem('customer_token')).toBe('tok');
  });

  it('shows a validation error when fields are empty', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/enter your mobile number/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- Login`
Expected: FAIL — stub renders no inputs.

- [ ] **Step 3: Implement `src/pages/Login.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useCustomer } from '@/context/CustomerContext';
import { Icons } from '@/components/Icons';

export default function Login() {
  const navigate = useNavigate();
  const { loginCustomer } = useCustomer();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!phone.trim()) { setError('Please enter your mobile number.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/login', { phone: phone.trim(), password });
      if (res.data?.token && res.data?.user) {
        loginCustomer(res.data.user, res.data.token);
        navigate('/account');
      } else {
        setError('Invalid response from server.');
      }
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string; errors?: { phone?: string[] } } } })?.response?.data;
      setError(data?.message || data?.errors?.phone?.[0] || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-screen"><div className="m-scroll">
      <div className="c-auth">
        <button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back</button>
        <h1 className="c-auth-title">Welcome Back</h1>
        <p className="c-auth-sub">Sign in to view your bookings and favourites.</p>

        {error && <div className="c-error-box">{error}</div>}

        <div className="c-field-label">Mobile Number</div>
        <div className="c-input-row">
          <input type="tel" placeholder="e.g. 0501234567" value={phone} onChange={(e) => { setPhone(e.target.value); setError(''); }} />
        </div>

        <div className="c-field-label">Password</div>
        <div className="c-input-row">
          <input type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
          <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button className="c-btn c-btn-block" disabled={loading} onClick={() => void handleLogin()}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="c-muted-center">Don't have an account? <Link className="c-link" to="/register">Register</Link></p>
      </div>
    </div></div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- Login`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/pages/Login.tsx eloquent-bookings/src/pages/Login.test.tsx
git commit -m "feat(eloquent-bookings): implement customer login"
```

---

## Task 18: Register page

**Files:**
- Modify: `eloquent-bookings/src/pages/Register.tsx`
- Test: `eloquent-bookings/src/pages/Register.test.tsx`

- [ ] **Step 1: Write the failing test** (`src/pages/Register.test.tsx`)

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CustomerProvider } from '@/context/CustomerContext';
import Register from './Register';

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }));
import api from '@/lib/api';

const renderReg = () => render(
  <MemoryRouter><CustomerProvider><Register /></CustomerProvider></MemoryRouter>,
);

beforeEach(() => vi.clearAllMocks());

describe('Register', () => {
  it('errors when passwords do not match', async () => {
    renderReg();
    await userEvent.type(screen.getByPlaceholderText('John Smith'), 'Ada');
    await userEvent.type(screen.getByPlaceholderText('e.g. 0501234567'), '050');
    await userEvent.type(screen.getByPlaceholderText('Min 5 characters'), 'secret');
    await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'other1');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits the full form on success', async () => {
    (api.post as any).mockResolvedValue({ data: { token: 't', user: { id: 1, name: 'Ada', phone: '050' } } });
    renderReg();
    await userEvent.type(screen.getByPlaceholderText('John Smith'), 'Ada');
    await userEvent.type(screen.getByPlaceholderText('e.g. 0501234567'), '050');
    await userEvent.type(screen.getByPlaceholderText('Min 5 characters'), 'secret');
    await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(api.post).toHaveBeenCalledWith('/register', { name: 'Ada', phone: '050', password: 'secret', password_confirmation: 'secret' });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- Register`
Expected: FAIL — stub renders no inputs.

- [ ] **Step 3: Implement `src/pages/Register.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useCustomer } from '@/context/CustomerContext';
import { Icons } from '@/components/Icons';

type Form = { name: string; phone: string; password: string; password_confirmation: string };

export default function Register() {
  const navigate = useNavigate();
  const { loginCustomer } = useCustomer();
  const [form, setForm] = useState<Form>({ name: '', phone: '', password: '', password_confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof Form, value: string) => { setForm((f) => ({ ...f, [key]: value })); setError(''); };

  const handleRegister = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.phone.trim()) { setError('Mobile number is required.'); return; }
    if (!form.password) { setError('Password is required.'); return; }
    if (form.password.length < 5) { setError('Password must be at least 5 characters.'); return; }
    if (form.password !== form.password_confirmation) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/register', form);
      if (res.data?.token && res.data?.user) {
        loginCustomer(res.data.user, res.data.token);
        navigate('/account');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
      setError(firstError || data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-screen"><div className="m-scroll">
      <div className="c-auth">
        <button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back to Login</button>
        <h1 className="c-auth-title">Create Account</h1>
        <p className="c-auth-sub">Sign up to track your bookings and manage favourites.</p>

        {error && <div className="c-error-box">{error}</div>}

        <div className="c-field-label">Full Name</div>
        <div className="c-input-row"><input placeholder="John Smith" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>

        <div className="c-field-label">Mobile Number</div>
        <div className="c-input-row"><input type="tel" placeholder="e.g. 0501234567" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>

        <div className="c-field-label">Password</div>
        <div className="c-input-row">
          <input type={showPassword ? 'text' : 'password'} placeholder="Min 5 characters" value={form.password} onChange={(e) => set('password', e.target.value)} />
          <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="c-field-label">Confirm Password</div>
        <div className="c-input-row"><input type={showPassword ? 'text' : 'password'} placeholder="Repeat password" value={form.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)} /></div>

        <button className="c-btn c-btn-block" disabled={loading} onClick={() => void handleRegister()}>
          {loading ? 'Creating…' : 'Create Account'}
        </button>

        <p className="c-muted-center">Already have an account? <Link className="c-link" to="/login">Sign In</Link></p>
      </div>
    </div></div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- Register`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add eloquent-bookings/src/pages/Register.tsx eloquent-bookings/src/pages/Register.test.tsx
git commit -m "feat(eloquent-bookings): implement customer registration"
```

---

## Task 19: Account page (profile / guest prompt / logout)

**Files:**
- Modify: `eloquent-bookings/src/pages/Account.tsx`

- [ ] **Step 1: Implement `src/pages/Account.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/context/CustomerContext';
import { AppBar } from '@/layout/AppBar';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Icons } from '@/components/Icons';

function initials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Account() {
  const navigate = useNavigate();
  const { customer, logoutCustomer } = useCustomer();

  if (!customer) {
    return (
      <div className="m-screen">
        <AppBar title="Account" actions={<WhatsAppButton />} />
        <div className="m-scroll">
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ color: 'var(--text-4)', marginBottom: 12, display: 'grid', placeItems: 'center' }}><Icons.User size={56} /></div>
            <h2 style={{ margin: '0 0 8px' }}>Sign In</h2>
            <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>Log in to track your bookings and save favourites.</p>
            <button className="c-btn c-btn-block" style={{ marginBottom: 12 }} onClick={() => navigate('/login')}>Sign In</button>
            <button className="c-btn-ghost" style={{ width: '100%' }} onClick={() => navigate('/register')}>Create Account</button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) logoutCustomer();
  };

  const links: { label: string; to: string }[] = [
    { label: 'My Bookings', to: '/bookings' },
    { label: 'Favourites', to: '/favourites' },
    { label: 'Explore', to: '/explore' },
  ];

  return (
    <div className="m-screen">
      <AppBar title="My Account" actions={<WhatsAppButton />} />
      <div className="m-scroll">
        <div className="c-avatar">{initials(customer.name)}</div>
        <h2 style={{ textAlign: 'center', margin: 0 }}>{customer.name}</h2>
        {customer.email && <p style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 4 }}>{customer.email}</p>}

        <div className="c-card" style={{ padding: 0, marginTop: 20 }}>
          {links.map((l, i) => (
            <button
              key={l.to}
              onClick={() => navigate(l.to)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 16, background: 'none', border: 'none', borderBottom: i < links.length - 1 ? '1px solid var(--border-1)' : 'none', color: 'var(--text-1)', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
            >
              {l.label}
              <Icons.Chevron size={18} />
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: 'calc(100% - 32px)', margin: '20px 16px', height: 52, borderRadius: 'var(--r-lg)', border: '1px solid rgba(248,113,113,0.3)', background: 'var(--danger-soft)', color: 'var(--danger)', fontWeight: 700, cursor: 'pointer' }}
        >
          <Icons.Logout size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc -b
git add eloquent-bookings/src/pages/Account.tsx
git commit -m "feat(eloquent-bookings): implement account page with guest prompt and logout"
```

---

## Task 20: PWA manifest + final verification

**Files:**
- Create: `eloquent-bookings/public/manifest.webmanifest`
- Create: `eloquent-bookings/public/icons/icon-192.png` (copy from mobile-app assets)
- Create: `eloquent-bookings/public/icons/icon-512.png` (copy from mobile-app assets)
- Create: `eloquent-bookings/README.md`

- [ ] **Step 1: Create `public/manifest.webmanifest`**

```json
{
  "name": "Rezzy",
  "short_name": "Rezzy",
  "description": "Discover businesses and book appointments.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0e0c",
  "theme_color": "#0a0e0c",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Copy app icons from the mobile-app assets**

Run (PowerShell):
```powershell
New-Item -ItemType Directory -Force "eloquent-bookings\public\icons" | Out-Null
Copy-Item "mobile-app\assets\icon.png" "eloquent-bookings\public\icons\icon-512.png"
Copy-Item "mobile-app\assets\adaptive-icon.png" "eloquent-bookings\public\icons\icon-192.png"
```
Expected: both PNGs exist under `public/icons/`.

- [ ] **Step 3: Create `README.md`**

```markdown
# Rezzy Customer Web

Standalone responsive customer PWA for Rezzy. Vite + React + TypeScript, talking to the Rezzy Laravel API.

## Setup
```bash
npm install
cp .env.example .env   # set VITE_API_URL (defaults to production)
npm run dev            # http://localhost:5174
```

## Scripts
- `npm run dev` — dev server
- `npm run build` — type-check + production build to `dist/`
- `npm run preview` — preview the production build
- `npm run test` — run the Vitest suite

Design system is ported from the salesagent mobile app; functionality mirrors the `mobile-app/` customer screens.
```

- [ ] **Step 4: Run the full test suite**

Run: `npm run test`
Expected: PASS — all suites green (deviceId, api, CustomerContext, ShopCard, Home, NearMe, booking, Login, Register).

- [ ] **Step 5: Run the production build**

Run: `npm run build`
Expected: `tsc -b` reports no type errors and Vite writes `dist/` with no errors.

- [ ] **Step 6: Manual smoke against a running backend**

Set `VITE_API_URL` to a reachable backend (local Laravel `http://127.0.0.1:8000/api` or production), run `npm run dev`, and confirm: Home lists shops; search filters; opening a shop shows date strip + services; booking a slot navigates to the confirmation; Bookings lists; login/register works; Account toggles between guest prompt and profile.

- [ ] **Step 7: Commit**

```bash
git add eloquent-bookings/public eloquent-bookings/README.md
git commit -m "feat(eloquent-bookings): add PWA manifest, icons, and readme"
```

---

## Self-Review Notes (for the implementer)

- **Spec coverage:** Every spec page maps to a task — Home(10), Explore(11), NearMe(12), Favourites(13), ShopDetail+booking(14), BookingView(15), Bookings(16), Login(17), Register(18), Account(19). Infra: api(5), CustomerContext(6), MobileLayout/tabs(9), design system(3). PWA manifest(20).
- **Out of scope (per spec):** shop-owner side, QR login, biometric login, voice input, push notifications. The RN biometric login is intentionally dropped on web (Task 17 note).
- **Time slots:** `ShopDetail` reads `shop.slots` if the API returns them; if the backend exposes slots under a different key, adjust the `slots` selector in Task 14 Step 6. Booking requires a selected time (button disabled otherwise), matching the RN payload which always sends `start_time`.
- **Type consistency:** `Shop`, `Service`, `Booking`, `Paginated<T>` are defined once in `src/types.ts` (Task 8) and reused everywhere. `buildBookingPayload` (Task 14) is the single source for the booking POST body. `toggleFavourite` (Task 10) is shared by Home/Explore/Favourites/ShopDetail.
