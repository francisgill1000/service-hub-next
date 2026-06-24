# admin Provider Web App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `admin/`, a provider-facing PWA at full parity with the mobile app's shop screens, mirroring the `eloquent-bookings` stack and design, deployed to `admin.eloquentservice.com`.

**Architecture:** Clone the `eloquent-bookings` Vite + React + TypeScript scaffold (design tokens, `MobileLayout`, shared libs). Swap `CustomerContext`→`ShopContext` (auth token `shop_token`). Each page is a direct port of a named `mobile-app/src/screens/shop` or `auth` screen, calling the shared Laravel API. Ship as a static SPA behind nginx.

**Tech Stack:** Vite 5, React 18, TypeScript 5, react-router-dom 6, axios, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-31-admin-provider-web-design.md`

**Source-of-truth screens** (read these when porting a page):
- Auth: `mobile-app/src/screens/auth/{LoginScreen,RegisterScreen,ForgotPinScreen}.js`
- Shop: `mobile-app/src/screens/shop/{DashboardScreen,ShopBookingsScreen,BookingActionScreen,RemindersScreen,CatalogsScreen,CatalogEditScreen,StaffScreen,WorkingHoursScreen,ProfileScreen,ScanLoginScreen}.js`
- Design refs to copy verbatim: `eloquent-bookings/src/styles/{tokens,mobile,customer}.css`, `eloquent-bookings/src/components/Icons.tsx`, `eloquent-bookings/src/components/{Spinner,EmptyState,WhatsAppButton}.tsx`

> **Porting rule:** Provider pages reuse eloquent-bookings CSS classes (`mobile-app`, `mobile-main`, `m-appbar`, `m-tabbar`, card/list classes). Translate React Native (`View`/`Text`/`TouchableOpacity`/`StyleSheet`) to semantic HTML (`div`/`span`/`button`) with those classes. Drop native-only deps (`expo-*`, `react-navigation`, `SafeAreaView`, biometric). Use `react-router` (`useNavigate`, `useParams`, `Link`) for navigation.

---

## Task 1: Scaffold the admin project

**Files:**
- Create: `admin/package.json`, `admin/vite.config.ts`, `admin/tsconfig.json`, `admin/tsconfig.node.json`, `admin/index.html`, `admin/.gitignore`, `admin/.env.example`
- Create: `admin/src/main.tsx`, `admin/src/vite-env.d.ts`, `admin/src/test/setup.ts`
- Copy: `admin/src/styles/{tokens,mobile,customer}.css` (verbatim from `eloquent-bookings/src/styles/`)

- [ ] **Step 1: Copy the project skeleton.** From repo root:

```bash
mkdir -p admin/src/styles admin/src/test admin/public
cp eloquent-bookings/vite.config.ts        admin/vite.config.ts
cp eloquent-bookings/tsconfig.json         admin/tsconfig.json
cp eloquent-bookings/tsconfig.node.json    admin/tsconfig.node.json
cp eloquent-bookings/src/vite-env.d.ts     admin/src/vite-env.d.ts
cp eloquent-bookings/src/test/setup.ts     admin/src/test/setup.ts
cp eloquent-bookings/src/styles/tokens.css   admin/src/styles/tokens.css
cp eloquent-bookings/src/styles/mobile.css   admin/src/styles/mobile.css
cp eloquent-bookings/src/styles/customer.css admin/src/styles/customer.css
cp eloquent-bookings/.gitignore            admin/.gitignore 2>/dev/null || printf "node_modules\ndist\n*.tsbuildinfo\n.env\n" > admin/.gitignore
```

- [ ] **Step 2: Write `admin/package.json`.**

```json
{
  "name": "admin",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "icons": "node scripts/gen-icons.mjs"
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
    "sharp": "^0.34.5",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 3: Change the dev port.** In `admin/vite.config.ts`, change `server: { port: 5174, host: true }` to `server: { port: 5175, host: true }` (avoid clashing with eloquent-bookings).

- [ ] **Step 4: Write `admin/index.html`** (same as eloquent-bookings but title "admin"):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1" />
    <meta name="theme-color" content="#0a0e0c" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
    <title>admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write `admin/.env.example`.**

```
VITE_API_URL=https://api.eloquentservice.com/api
```

- [ ] **Step 6: Write `admin/src/main.tsx`.**

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

- [ ] **Step 7: Create a placeholder `admin/src/App.tsx`** so install/typecheck works (replaced in Task 7):

```tsx
export default function App() {
  return <div>admin</div>;
}
```

- [ ] **Step 8: Install dependencies.**

Run: `cd admin && npm install`
Expected: completes; `node_modules` created.

- [ ] **Step 9: Verify dev/test toolchain boots.**

Run: `cd admin && npm run test`
Expected: PASS — "No test files found" is acceptable (exit 0 with `--passWithNoTests` is not set; if it errors on no tests, that's fine to ignore until Task 4 adds the first test).

- [ ] **Step 10: Commit.**

```bash
git add admin
git commit -m "feat(admin): scaffold provider web app from eloquent-bookings"
```

---

## Task 2: Shared libs (storage, deviceId, date, api)

**Files:**
- Copy: `admin/src/lib/{storage.ts,deviceId.ts,date.ts}` (verbatim from eloquent-bookings)
- Create: `admin/src/lib/api.ts`
- Test: `admin/src/lib/api.test.ts`

- [ ] **Step 1: Copy the verbatim libs.**

```bash
mkdir -p admin/src/lib
cp eloquent-bookings/src/lib/storage.ts  admin/src/lib/storage.ts
cp eloquent-bookings/src/lib/deviceId.ts admin/src/lib/deviceId.ts
cp eloquent-bookings/src/lib/date.ts     admin/src/lib/date.ts
```

- [ ] **Step 2: Write the failing test `admin/src/lib/api.test.ts`.**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import api from './api';
import { storage } from './storage';

describe('api client', () => {
  beforeEach(() => localStorage.clear());

  it('uses the shop_token for Authorization', async () => {
    storage.set('shop_token', 'tok-123');
    const cfg = await (api.interceptors.request as any).handlers[0].fulfilled({ headers: {} });
    expect(cfg.headers.Authorization).toBe('Bearer tok-123');
  });

  it('attaches X-Device-Id', async () => {
    const cfg = await (api.interceptors.request as any).handlers[0].fulfilled({ headers: {} });
    expect(cfg.headers['X-Device-Id']).toBeTruthy();
  });

  it('does not set Authorization when no token', async () => {
    const cfg = await (api.interceptors.request as any).handlers[0].fulfilled({ headers: {} });
    expect(cfg.headers.Authorization).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails.**

Run: `cd admin && npx vitest run src/lib/api.test.ts`
Expected: FAIL — cannot resolve `./api`.

- [ ] **Step 4: Write `admin/src/lib/api.ts`** (eloquent-bookings's api.ts but reading `shop_token`):

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

  const token = storage.get('shop_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

- [ ] **Step 5: Run test to verify it passes.**

Run: `cd admin && npx vitest run src/lib/api.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit.**

```bash
git add admin/src/lib
git commit -m "feat(admin): add shared libs and shop-token api client"
```

---

## Task 3: Types

**Files:**
- Create: `admin/src/types.ts`

- [ ] **Step 1: Write `admin/src/types.ts`** (extends eloquent-bookings types with provider entities):

```ts
export type WorkingHours = {
  day?: string;
  start_time?: string;
  end_time?: string;
  is_closed?: boolean;
};

export type Service = {
  id: number;
  title?: string;
  name?: string;
  price?: number | string;
  duration?: number | string;
  description?: string;
  image?: string;
};

export type StaffMember = {
  id: number;
  name: string;
  is_active?: boolean;
};

export type Invoice = {
  id: number;
  status?: string;
  amount?: number | string;
  paid?: boolean;
};

export type Shop = {
  id: number;
  name: string;
  shop_code?: string;
  logo?: string;
  hero_image?: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  latitude?: number | string;
  longitude?: number | string;
  is_open?: boolean;
  working_hours?: WorkingHours[];
  catalogs?: Service[];
  [key: string]: unknown;
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
  reminder_sent?: boolean;
  customer_name?: string;
  customer?: { name?: string; phone?: string };
  staff?: StaffMember | null;
  shop?: { id?: number; name?: string; location?: string };
  services?: Service[];
  invoice?: Invoice | null;
};

export type ShopBookingsResponse = {
  data: Booking[];
  total_bookings?: number;
  total_revenue?: number | string;
  current_page?: number;
  last_page?: number;
};

export type Paginated<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
};
```

> Verify these field names against the JSON the API returns when porting each page; add fields as needed (the `[key: string]: unknown` on `Shop` allows extras).

- [ ] **Step 2: Typecheck.**

Run: `cd admin && npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit.**

```bash
git add admin/src/types.ts
git commit -m "feat(admin): add domain types"
```

---

## Task 4: ShopContext

**Files:**
- Create: `admin/src/context/ShopContext.tsx`
- Test: `admin/src/context/ShopContext.test.tsx`

- [ ] **Step 1: Write the failing test `admin/src/context/ShopContext.test.tsx`.**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ShopProvider, useShop } from './ShopContext';
import { storage } from '@/lib/storage';

function Probe() {
  const { shop, token, loginShop, logoutShop } = useShop();
  return (
    <div>
      <span data-testid="name">{shop?.name ?? 'none'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <button onClick={() => loginShop({ id: 1, name: 'Acme' }, 'tok')}>login</button>
      <button onClick={() => logoutShop()}>logout</button>
    </div>
  );
}

describe('ShopContext', () => {
  beforeEach(() => localStorage.clear());

  it('hydrates from storage', () => {
    storage.setJSON('shop_data', { id: 9, name: 'Saved' });
    storage.set('shop_token', 'persisted');
    render(<ShopProvider><Probe /></ShopProvider>);
    expect(screen.getByTestId('name').textContent).toBe('Saved');
    expect(screen.getByTestId('token').textContent).toBe('persisted');
  });

  it('login then logout updates state and storage', () => {
    render(<ShopProvider><Probe /></ShopProvider>);
    act(() => screen.getByText('login').click());
    expect(screen.getByTestId('name').textContent).toBe('Acme');
    expect(storage.get('shop_token')).toBe('tok');
    act(() => screen.getByText('logout').click());
    expect(screen.getByTestId('name').textContent).toBe('none');
    expect(storage.get('shop_token')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails.**

Run: `cd admin && npx vitest run src/context/ShopContext.test.tsx`
Expected: FAIL — cannot resolve `./ShopContext`.

- [ ] **Step 3: Write `admin/src/context/ShopContext.tsx`.**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { storage } from '@/lib/storage';
import type { Shop } from '@/types';

type ShopContextValue = {
  shop: Shop | null;
  token: string | null;
  loading: boolean;
  loginShop: (shop: Shop, token: string) => void;
  logoutShop: () => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = storage.getJSON<Shop>('shop_data');
    const savedToken = storage.get('shop_token');
    if (saved && savedToken) {
      setShop(saved);
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const loginShop = (s: Shop, t: string) => {
    setShop(s);
    setToken(t);
    storage.setJSON('shop_data', s);
    storage.set('shop_token', t);
  };

  const logoutShop = () => {
    setShop(null);
    setToken(null);
    storage.remove('shop_data');
    storage.remove('shop_token');
  };

  return (
    <ShopContext.Provider value={{ shop, token, loading, loginShop, logoutShop }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes.**

Run: `cd admin && npx vitest run src/context/ShopContext.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit.**

```bash
git add admin/src/context
git commit -m "feat(admin): add ShopContext auth state"
```

---

## Task 5: Typed API wrappers

**Files:**
- Create: `admin/src/lib/shops.ts`, `admin/src/lib/bookings.ts`, `admin/src/lib/catalogs.ts`
- Test: `admin/src/lib/bookings.test.ts`

- [ ] **Step 1: Write `admin/src/lib/bookings.ts`.**

```ts
import api from './api';
import type { Booking, ShopBookingsResponse } from '@/types';

export async function getShopBookings(shopId: number): Promise<ShopBookingsResponse> {
  const { data } = await api.get('/shop/bookings', { params: { shop_id: shopId } });
  return {
    data: Array.isArray(data?.data) ? data.data : [],
    total_bookings: data?.total_bookings,
    total_revenue: data?.total_revenue,
    current_page: data?.current_page,
    last_page: data?.last_page,
  };
}

export async function getBooking(id: number): Promise<Booking> {
  const { data } = await api.get(`/booking/${id}`);
  return data?.data ?? data;
}

export async function setBookingStatus(id: number, status: string): Promise<void> {
  await api.put(`/booking/${id}`, { status });
}

export async function reassignBooking(id: number, staffId: number): Promise<void> {
  await api.post(`/booking/${id}/reassign`, { staff_id: staffId });
}

export async function markReminderSent(id: number): Promise<void> {
  await api.post(`/booking/${id}/mark-reminder-sent`);
}

export async function markInvoicePaid(invoiceId: number): Promise<void> {
  await api.post(`/invoice/${invoiceId}/mark-paid`);
}
```

- [ ] **Step 2: Write `admin/src/lib/catalogs.ts`.**

```ts
import api from './api';
import type { Service } from '@/types';

export async function listCatalogs(): Promise<Service[]> {
  const { data } = await api.get('/shop/catalogs');
  return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
}

export async function getCatalog(id: number): Promise<Service> {
  const { data } = await api.get(`/shop/catalogs/${id}`);
  return data?.data ?? data;
}

export async function createCatalog(payload: Partial<Service>): Promise<Service> {
  const { data } = await api.post('/shop/catalogs', payload);
  return data?.data ?? data;
}

export async function updateCatalog(id: number, payload: Partial<Service>): Promise<Service> {
  const { data } = await api.put(`/shop/catalogs/${id}`, payload);
  return data?.data ?? data;
}

export async function deleteCatalog(id: number): Promise<void> {
  await api.delete(`/shop/catalogs/${id}`);
}
```

- [ ] **Step 3: Write `admin/src/lib/shops.ts`.**

```ts
import api from './api';
import type { Shop, StaffMember, WorkingHours } from '@/types';

export async function shopLogin(shopCode: string, pin: string): Promise<{ token: string; shop: Shop }> {
  const { data } = await api.post('shops/login', { shop_code: shopCode, pin });
  return { token: data.token, shop: data.shop };
}

export async function resetPin(shopCode: string): Promise<unknown> {
  const { data } = await api.post('shops/reset-pin', { shop_code: shopCode });
  return data;
}

export async function registerShop(form: Record<string, unknown>): Promise<{ token?: string; shop?: Shop }> {
  const { data } = await api.post('/shops', form);
  return data;
}

export async function reverseGeocode(lat: number, lon: number): Promise<{ location?: string; [k: string]: unknown }> {
  const { data } = await api.get('/location', { params: { lat: lat.toFixed(6), lon: lon.toFixed(6) } });
  return data;
}

export async function updateShop(id: number, payload: Partial<Shop> | { working_hours: WorkingHours[] }): Promise<Shop> {
  const { data } = await api.put(`/shops/${id}`, payload);
  return data?.data ?? data;
}

export async function getStaff(shopId: number): Promise<StaffMember[]> {
  const { data } = await api.get(`/shops/${shopId}/staff`);
  return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
}

export async function addStaff(shopId: number, name: string): Promise<StaffMember> {
  const { data } = await api.post(`/shops/${shopId}/staff`, { name });
  return data?.data ?? data;
}

export async function updateStaff(shopId: number, staffId: number, payload: Partial<StaffMember>): Promise<StaffMember> {
  const { data } = await api.put(`/shops/${shopId}/staff/${staffId}`, payload);
  return data?.data ?? data;
}

export async function approveQrLogin(token: string): Promise<unknown> {
  const { data } = await api.post(`/shops/qr-login/approve/${token}`);
  return data;
}
```

- [ ] **Step 4: Write the test `admin/src/lib/bookings.test.ts`.**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { getShopBookings, setBookingStatus } from './bookings';

describe('bookings wrappers', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('normalizes the shop bookings response', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [{ id: 1 }], total_bookings: 1, total_revenue: 50 } });
    const res = await getShopBookings(7);
    expect(api.get).toHaveBeenCalledWith('/shop/bookings', { params: { shop_id: 7 } });
    expect(res.data).toHaveLength(1);
    expect(res.total_revenue).toBe(50);
  });

  it('returns empty data array when response is malformed', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: {} });
    const res = await getShopBookings(7);
    expect(res.data).toEqual([]);
  });

  it('PUTs status changes', async () => {
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: {} });
    await setBookingStatus(3, 'confirmed');
    expect(put).toHaveBeenCalledWith('/booking/3', { status: 'confirmed' });
  });
});
```

- [ ] **Step 5: Run tests.**

Run: `cd admin && npx vitest run src/lib/bookings.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit.**

```bash
git add admin/src/lib
git commit -m "feat(admin): add typed api wrappers for shops, bookings, catalogs"
```

---

## Task 6: Shared components, layout, route guard

**Files:**
- Copy: `admin/src/components/{Icons,Spinner,EmptyState,WhatsAppButton}.tsx` (verbatim from eloquent-bookings)
- Create: `admin/src/layout/AppBar.tsx`, `admin/src/layout/MobileLayout.tsx`, `admin/src/layout/RequireShop.tsx`

- [ ] **Step 1: Copy components and AppBar.**

```bash
mkdir -p admin/src/components admin/src/layout
cp eloquent-bookings/src/components/Icons.tsx          admin/src/components/Icons.tsx
cp eloquent-bookings/src/components/Spinner.tsx        admin/src/components/Spinner.tsx
cp eloquent-bookings/src/components/EmptyState.tsx     admin/src/components/EmptyState.tsx
cp eloquent-bookings/src/components/WhatsAppButton.tsx admin/src/components/WhatsAppButton.tsx
cp eloquent-bookings/src/layout/AppBar.tsx             admin/src/layout/AppBar.tsx
```

- [ ] **Step 2: Verify icon names.** Open `admin/src/components/Icons.tsx` and note exported keys. The tab bar needs icons for Home, Calendar, Bell/Reminders, Grid/Services, Store/Profile. If `Bell`, `Grid`, or `Store` are missing, add minimal SVG icons following the existing pattern in that file (each icon is a function `({size}) => <svg .../>`).

- [ ] **Step 3: Write `admin/src/layout/MobileLayout.tsx`** (5 provider tabs):

```tsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Icons } from '@/components/Icons';

type Tab = { id: string; label: string; href: string; icon: keyof typeof Icons };

const tabs: Tab[] = [
  { id: 'home', label: 'Home', href: '/', icon: 'Home' },
  { id: 'bookings', label: 'Bookings', href: '/bookings', icon: 'Calendar' },
  { id: 'reminders', label: 'Reminders', href: '/reminders', icon: 'Bell' },
  { id: 'services', label: 'Services', href: '/services', icon: 'Grid' },
  { id: 'profile', label: 'Profile', href: '/profile', icon: 'Store' },
];

function activeTab(path: string): string {
  if (path === '/') return 'home';
  if (path.startsWith('/bookings') || path.startsWith('/booking')) return 'bookings';
  if (path.startsWith('/reminders')) return 'reminders';
  if (path.startsWith('/services')) return 'services';
  if (path.startsWith('/profile') || path.startsWith('/staff') || path.startsWith('/working-hours')) return 'profile';
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

> Use whatever icon keys actually exist after Step 2 — adjust the `icon:` values to match.

- [ ] **Step 4: Write `admin/src/layout/RequireShop.tsx`** (route guard):

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useShop } from '@/context/ShopContext';

export function RequireShop() {
  const { shop, token, loading } = useShop();
  if (loading) return null;
  if (!shop || !token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

- [ ] **Step 5: Typecheck.**

Run: `cd admin && npx tsc -b`
Expected: no errors (fix any icon-key typing issues from Step 3).

- [ ] **Step 6: Commit.**

```bash
git add admin/src/components admin/src/layout
git commit -m "feat(admin): add shared components, provider layout, route guard"
```

---

## Task 7: App routing

**Files:**
- Modify: `admin/src/App.tsx` (replace placeholder)

- [ ] **Step 1: Write `admin/src/App.tsx`.** Import the page components created in later tasks; create thin placeholder page stubs now (each exporting `export default function X(){return <div/>}`) so routing compiles, then flesh out per task. Recommended: create stub files first so this task compiles independently.

```tsx
import { Routes, Route } from 'react-router-dom';
import { ShopProvider } from '@/context/ShopContext';
import { MobileLayout } from '@/layout/MobileLayout';
import { RequireShop } from '@/layout/RequireShop';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPin from '@/pages/ForgotPin';
import ScanApprove from '@/pages/ScanApprove';
import Dashboard from '@/pages/Dashboard';
import Bookings from '@/pages/Bookings';
import BookingAction from '@/pages/BookingAction';
import Reminders from '@/pages/Reminders';
import Services from '@/pages/Services';
import ServiceEdit from '@/pages/ServiceEdit';
import Staff from '@/pages/Staff';
import WorkingHours from '@/pages/WorkingHours';
import Profile from '@/pages/Profile';

export default function App() {
  return (
    <ShopProvider>
      <Routes>
        {/* Public / full-screen */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-pin" element={<ForgotPin />} />
        <Route path="/scan/:token" element={<ScanApprove />} />

        {/* Authenticated full-screen */}
        <Route element={<RequireShop />}>
          <Route path="/booking/:id" element={<BookingAction />} />
          <Route path="/services/new" element={<ServiceEdit />} />
          <Route path="/services/:id/edit" element={<ServiceEdit />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/working-hours" element={<WorkingHours />} />

          {/* Authenticated tabbed */}
          <Route element={<MobileLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/services" element={<Services />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </ShopProvider>
  );
}
```

- [ ] **Step 2: Create stub page files** so the app compiles. For each of the 13 page modules referenced above, create `admin/src/pages/<Name>.tsx` with:

```tsx
export default function Name() {
  return <div className="mobile-page" />;
}
```

(Replace `Name` with the actual export name. These are filled in by Tasks 8–20.)

- [ ] **Step 3: Typecheck + dev boot.**

Run: `cd admin && npx tsc -b && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit.**

```bash
git add admin/src/App.tsx admin/src/pages
git commit -m "feat(admin): wire app routing with auth guard and page stubs"
```

---

## Tasks 8–20: Pages (port from mobile screens)

Each page task follows the same loop: **(a)** read the source mobile screen, **(b)** port it to a React + react-router page using the API wrappers from Task 5 and eloquent-bookings CSS classes, **(c)** write at least one render/interaction test, **(d)** run tests + `tsc -b`, **(e)** commit. Use `<AppBar>` for the header, `<Spinner>` for loading, `<EmptyState>` for empty lists. Show API errors inline (error banner state). On any `401`, call `logoutShop()` and navigate to `/login`.

For each: replace the stub file from Task 7 Step 2.

---

### Task 8: Login page

**Files:** `admin/src/pages/Login.tsx`, test `admin/src/pages/Login.test.tsx`
**Source:** `mobile-app/src/screens/auth/LoginScreen.js`

- [ ] **Step 1: Port behavior.** Two-step form: step `code` (enter `shop_code`) → step `pin` (enter PIN). Submit PIN calls `shopLogin(shopCode, pin)` from `@/lib/shops`. On success call `loginShop(shop, token)` from `useShop()` and `navigate('/')`. "Remember me" checkbox persists `remember_shop_login=true` + `remember_shop_code` (and PIN) via `storage`; prefill on mount. Drop all biometric / `expo-local-authentication` code. Links: "Forgot PIN?" → `/forgot-pin`, "Register" → `/register`. Show error text on failed login.

- [ ] **Step 2: Write failing test `Login.test.tsx`.**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ShopProvider } from '@/context/ShopContext';
import * as shops from '@/lib/shops';
import Login from './Login';

const nav = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig() as object), useNavigate: () => nav }));

function setup() {
  return render(<MemoryRouter><ShopProvider><Login /></ShopProvider></MemoryRouter>);
}

describe('Login', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); nav.mockReset(); });

  it('logs in through the two-step flow', async () => {
    vi.spyOn(shops, 'shopLogin').mockResolvedValue({ token: 't', shop: { id: 1, name: 'Acme' } });
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/shop code/i), 'ACME01');
    await user.click(screen.getByRole('button', { name: /continue|next/i }));
    await user.type(screen.getByLabelText(/pin/i), '1234');
    await user.click(screen.getByRole('button', { name: /log ?in|sign ?in/i }));
    expect(shops.shopLogin).toHaveBeenCalledWith('ACME01', '1234');
    expect(localStorage.getItem('shop_token')).toBe('t');
  });

  it('shows an error on failed login', async () => {
    vi.spyOn(shops, 'shopLogin').mockRejectedValue(new Error('bad'));
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/shop code/i), 'X');
    await user.click(screen.getByRole('button', { name: /continue|next/i }));
    await user.type(screen.getByLabelText(/pin/i), '0000');
    await user.click(screen.getByRole('button', { name: /log ?in|sign ?in/i }));
    expect(await screen.findByText(/invalid|incorrect|failed|wrong/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test, verify it fails** (stub renders empty `div`).
Run: `cd admin && npx vitest run src/pages/Login.test.tsx` — Expected: FAIL.

- [ ] **Step 4: Implement `Login.tsx`** per Step 1. Ensure inputs have accessible labels (`<label htmlFor>` or `aria-label`) matching the test regexes (`shop code`, `pin`), and buttons labelled "Continue"/"Log in".

- [ ] **Step 5: Run test, verify PASS.** Run the same command. Expected: PASS (2 tests).

- [ ] **Step 6: Commit.** `git add admin/src/pages/Login.tsx admin/src/pages/Login.test.tsx && git commit -m "feat(admin): login page"`

---

### Task 9: Register page

**Files:** `admin/src/pages/Register.tsx`, test `Register.test.tsx`
**Source:** `mobile-app/src/screens/auth/RegisterScreen.js`

- [ ] **Step 1: Port behavior.** Form to create a shop via `registerShop(form)`. Optional "use my location" button calls `navigator.geolocation.getCurrentPosition` → `reverseGeocode(lat, lon)` to prefill address/location. On success, if response includes token+shop, `loginShop(...)` + `navigate('/')`; else navigate to `/login`. Validate required fields; show errors inline. Use `navigator.geolocation` (not expo-location).
- [ ] **Step 2: Test** — render the form, fill required fields, mock `registerShop` resolved, submit, assert it was called with the entered values.
- [ ] **Step 3:** run/verify fail → **Step 4:** implement → **Step 5:** verify pass → **Step 6:** commit `"feat(admin): shop registration page"`.

---

### Task 10: Forgot PIN page

**Files:** `admin/src/pages/ForgotPin.tsx`, test `ForgotPin.test.tsx`
**Source:** `mobile-app/src/screens/auth/ForgotPinScreen.js`

- [ ] **Step 1: Port behavior.** Enter `shop_code` → `resetPin(shopCode)`. On success show confirmation message (PIN reset instructions sent) and a link back to `/login`. Mirror any prefill behavior the source uses (e.g., `post_reset_login_prefill`).
- [ ] **Step 2: Test** — mock `resetPin` resolved, submit, assert called with code and a success message appears.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): forgot-pin page"`.

---

### Task 11: Dashboard page

**Files:** `admin/src/pages/Dashboard.tsx`, test `Dashboard.test.tsx`
**Source:** `mobile-app/src/screens/shop/DashboardScreen.js`

- [ ] **Step 1: Port behavior.** On mount (when `shop?.id`), `getShopBookings(shop.id)`. Show stat cards: total bookings (`total_bookings`) and total revenue (`total_revenue`, fallback to summing `charges`). List **today's** bookings (filter `date`/`show_date` === today's ISO from `formatLocalDate(new Date())`). Each booking row links to `/booking/:id`. Refresh button re-fetches. `<AppBar title={shop.name}>`. Empty + loading states.
- [ ] **Step 2: Test** — mock `getShopBookings` (via `vi.spyOn(bookingsLib,'getShopBookings')`) returning stats + one today booking; render inside `ShopProvider` seeded with `shop_data`/`shop_token` in localStorage; assert the revenue and booking reference render.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): dashboard page"`.

---

### Task 12: Bookings list page

**Files:** `admin/src/pages/Bookings.tsx`, test `Bookings.test.tsx`
**Source:** `mobile-app/src/screens/shop/ShopBookingsScreen.js`

- [ ] **Step 1: Port behavior.** `getShopBookings(shop.id)`; render full list (the source's grouping/filters/tabs by status or date — replicate them). Each row → `/booking/:id`. Loading/empty states. `<AppBar title="Bookings">`.
- [ ] **Step 2: Test** — mock the wrapper with 2 bookings, assert both render and a row links to `/booking/<id>`.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): bookings list page"`.

---

### Task 13: Booking Action page

**Files:** `admin/src/pages/BookingAction.tsx`, test `BookingAction.test.tsx`
**Source:** `mobile-app/src/screens/shop/BookingActionScreen.js`

- [ ] **Step 1: Port behavior.** `useParams()` → `id`. `getBooking(id)` for detail; `getStaff(shop.id)` for reassignment options. Actions: confirm/cancel/complete via `setBookingStatus(id, status)`; reassign via `reassignBooking(id, staffId)`; mark invoice paid via `markInvoicePaid(booking.invoice.id)` (only when an invoice exists). After an action, re-fetch or update local state, and show success/error feedback. Back button → `navigate(-1)`.
- [ ] **Step 2: Test** — mock `getBooking` returning a pending booking + `getStaff` returning `[]`; render; click "Confirm"; assert `setBookingStatus` called with `(id,'confirmed')`.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): booking action page"`.

---

### Task 14: Reminders page

**Files:** `admin/src/pages/Reminders.tsx`, test `Reminders.test.tsx`
**Source:** `mobile-app/src/screens/shop/RemindersScreen.js`

- [ ] **Step 1: Port behavior.** `getShopBookings(shop.id)`, filter to bookings needing reminders (replicate the source's filter — typically upcoming + not `reminder_sent`). "Mark reminder sent" → `markReminderSent(booking.id)`, then update local state. A WhatsApp/contact affordance may exist in source — port using `WhatsAppButton` if present. Loading/empty states.
- [ ] **Step 2: Test** — mock wrapper returning one reminder-eligible booking; click "Mark sent"; assert `markReminderSent` called with its id.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): reminders page"`.

---

### Task 15: Services list page

**Files:** `admin/src/pages/Services.tsx`, test `Services.test.tsx`
**Source:** `mobile-app/src/screens/shop/CatalogsScreen.js`

- [ ] **Step 1: Port behavior.** `listCatalogs()` on mount. Render each service (title/name, price). "Add" button → `/services/new`. Each row → `/services/:id/edit`. Delete (with confirm) → `deleteCatalog(id)` then refresh. Loading/empty states.
- [ ] **Step 2: Test** — mock `listCatalogs` with 2 services; assert both render; assert "Add" links to `/services/new`.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): services list page"`.

---

### Task 16: Service Edit page

**Files:** `admin/src/pages/ServiceEdit.tsx`, test `ServiceEdit.test.tsx`
**Source:** `mobile-app/src/screens/shop/CatalogEditScreen.js`

- [ ] **Step 1: Port behavior.** `useParams()` → `id` (absent ⇒ create mode at `/services/new`). In edit mode, `getCatalog(id)` to prefill. Form fields per source (title/name, price, duration, description). Save: create ⇒ `createCatalog(payload)`, edit ⇒ `updateCatalog(id, payload)`, then `navigate('/services')`. Validate required fields; inline errors.
- [ ] **Step 2: Test** — render at create mode, fill title + price, mock `createCatalog` resolved, submit, assert called with the payload.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): service edit page"`.

---

### Task 17: Staff page

**Files:** `admin/src/pages/Staff.tsx`, test `Staff.test.tsx`
**Source:** `mobile-app/src/screens/shop/StaffScreen.js`

- [ ] **Step 1: Port behavior.** `getStaff(shop.id)` on mount. Add staff: input + `addStaff(shop.id, name)` then refresh/append. Rename / toggle active: `updateStaff(shop.id, member.id, payload)`. Back button. Loading/empty states.
- [ ] **Step 2: Test** — mock `getStaff` with one member; type a new name; click Add; assert `addStaff` called with `(shopId, name)`.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): staff page"`.

---

### Task 18: Working Hours page

**Files:** `admin/src/pages/WorkingHours.tsx`, test `WorkingHours.test.tsx`
**Source:** `mobile-app/src/screens/shop/WorkingHoursScreen.js`

- [ ] **Step 1: Port behavior.** Editable per-day rows (start/end time, closed toggle), seeded from `shop.working_hours`. Save → `updateShop(shop.id, { working_hours })`; on success update the shop in `ShopContext` (re-call `loginShop(updatedShop, token)` to persist) and show confirmation. Build the `working_hours` array shape the source PUTs.
- [ ] **Step 2: Test** — render seeded with a shop having one day; change a time; click Save; assert `updateShop` called with `(shopId, { working_hours: [...] })`.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): working hours page"`.

---

### Task 19: Profile page

**Files:** `admin/src/pages/Profile.tsx`, test `Profile.test.tsx`
**Source:** `mobile-app/src/screens/shop/ProfileScreen.js`

- [ ] **Step 1: Port behavior.** Editable shop profile (name, phone, email, location/address, description) seeded from `shop`. "Use my location" → `navigator.geolocation` + `reverseGeocode`. Save → `updateShop(shop.id, payload)` then update `ShopContext` (`loginShop(updated, token)`). Navigation links: Staff (`/staff`), Working Hours (`/working-hours`), Scan login (open camera/QR or manual token entry — see Task 20). Logout button → `logoutShop()` + `navigate('/login')`. `<AppBar title="Profile">`.
- [ ] **Step 2: Test** — render seeded shop; click Logout; assert `shop_token` removed from localStorage. Also: edit name, mock `updateShop`, save, assert called.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): profile page"`.

---

### Task 20: Scan Approve page

**Files:** `admin/src/pages/ScanApprove.tsx`, test `ScanApprove.test.tsx`
**Source:** `mobile-app/src/screens/shop/ScanLoginScreen.js`

- [ ] **Step 1: Port behavior.** `useParams()` → `token`. On mount (or on a confirm button) call `approveQrLogin(token)`. Show pending → success/failure states. (The mobile screen scans a QR to obtain the token; on web the token arrives via the `/scan/:token` URL — no camera needed. If unauthenticated, `RequireShop` is bypassed for this public route, so prompt login first if `!shop`, then approve.)
- [ ] **Step 2: Test** — render at `/scan/abc` via `MemoryRouter initialEntries={['/scan/abc']}` with a route; mock `approveQrLogin` resolved; assert it's called with `'abc'` and a success message shows.
- [ ] **Step 3–6:** fail → implement → pass → commit `"feat(admin): scan-approve page"`.

---

## Task 21: PWA manifest + icons

**Files:**
- Copy/adapt: `admin/scripts/gen-icons.mjs`, `admin/public/manifest.webmanifest`, `admin/public/*` icons
- Source: `eloquent-bookings/scripts/gen-icons.mjs`, `eloquent-bookings/public/manifest.webmanifest`

- [ ] **Step 1: Copy the icon generator and manifest.**

```bash
mkdir -p admin/scripts
cp eloquent-bookings/scripts/gen-icons.mjs       admin/scripts/gen-icons.mjs
cp eloquent-bookings/public/manifest.webmanifest admin/public/manifest.webmanifest
cp eloquent-bookings/public/favicon.svg          admin/public/favicon.svg 2>/dev/null || true
```

- [ ] **Step 2: Rebrand the manifest.** In `admin/public/manifest.webmanifest` set `"name": "admin"`, `"short_name": "admin"`, and a distinguishing description (e.g. "Rezzy for service providers"). Keep the mint theme/background colors. Reuse the favicon recipe (SVG monogram on mint tile) — see memory `favicon-recipe.md`; a "B" monogram distinguishes it from the customer app.

- [ ] **Step 3: Generate icons.**

Run: `cd admin && npm run icons`
Expected: PNG icons written to `public/` (sizes referenced by the manifest + `index.html`).

- [ ] **Step 4: Build to confirm assets resolve.**

Run: `cd admin && npm run build`
Expected: build succeeds with no missing-asset warnings for icons/manifest.

- [ ] **Step 5: Commit.**

```bash
git add admin/scripts admin/public
git commit -m "feat(admin): add PWA manifest and branded icons"
```

---

## Task 22: Deploy to admin.eloquentservice.com

**Files:** none in-repo (server config) unless a deploy script is added.

> The `deploy-eloquent-app` skill targets Laravel + Inertia on the shared droplet (`64.227.153.90`). This app is a **static SPA**, so reuse the skill's droplet access/DNS/TLS knowledge but serve `dist/` directly via nginx. Invoke the `deploy-eloquent-app` skill at execution time to get current server conventions, then adapt as below.

- [ ] **Step 1: Production build.**

Run: `cd admin && npm run build`
Expected: `admin/dist/` produced.

- [ ] **Step 2: DNS.** Add an A record `admin.eloquentservice.com` → `64.227.153.90` (confirm the DNS provider via the deploy skill / existing eloquentservice records).

- [ ] **Step 3: Upload build to the droplet.** Create `/var/www/admin` and copy `dist/` contents there (rsync/scp). Confirm the exact web root convention from the deploy skill.

- [ ] **Step 4: nginx server block** for `admin.eloquentservice.com` with SPA fallback:

```nginx
server {
    server_name admin.eloquentservice.com;
    root /var/www/admin;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and `nginx -t && systemctl reload nginx`.

- [ ] **Step 5: TLS.** `certbot --nginx -d admin.eloquentservice.com` (matching how other eloquentservice subdomains get certs).

- [ ] **Step 6: Verify.** Load `https://admin.eloquentservice.com`, log in with a real shop_code+PIN, confirm dashboard loads bookings from the API. Hard-refresh on a deep route (e.g. `/bookings`) to confirm SPA fallback works.

- [ ] **Step 7: Commit any deploy script/config added to the repo** (e.g. a `deploy-admin.ps1` mirroring `deploy-frontend.ps1`, if created).

```bash
git add -A && git commit -m "chore(admin): add deploy script and config"
```

---

## Self-Review Notes

- **Spec coverage:** auth (T8–10), all 5 tabs + full-screen screens (T11–20), shared design/layout (T1,6), API surface (T5), PWA (T21), deploy (T22). All spec sections mapped.
- **Type consistency:** wrapper return types match `types.ts` (`ShopBookingsResponse`, `Booking`, `Service`, `StaffMember`, `Shop`). `loginShop(shop, token)` / `logoutShop()` signatures consistent across context + pages.
- **Known judgement points for the implementer:** exact JSON field names from the API (verify against live responses while porting); exact icon keys in `Icons.tsx` (Task 6 Step 2); the precise list-filtering/grouping logic in Bookings/Reminders/Dashboard lives in the source screens — read them.
