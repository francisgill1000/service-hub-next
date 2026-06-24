# admin — Service Provider Web App

**Date:** 2026-05-31
**Status:** Approved design, pending implementation plan
**Deploy target:** `admin.eloquentservice.com`

## Summary

A provider-facing PWA for Rezzy shops, mirroring the **stack and design** of
`eloquent-bookings/` and the **functionality** of the `mobile-app/` shop screens.
Built once at full feature parity with the mobile shop experience, then deployed
as a static SPA to `admin.eloquentservice.com`.

- **Functionality reference:** `mobile-app/src/screens/shop/*` + `mobile-app/src/screens/auth/*`
- **Design reference:** `eloquent-bookings/` (Vite + React + TypeScript PWA, dark+mint tokens)
- **Backend:** shared Laravel API at `https://api.eloquentservice.com/api`

## Goals

- Full parity with the mobile app's shop side (all shop screens).
- Visual and structural consistency with `eloquent-bookings`.
- Deployable static SPA at `admin.eloquentservice.com`.

## Non-Goals

- Customer-side features (those live in `eloquent-bookings`).
- Native-only capabilities: biometric unlock (no web equivalent).
- Backend/API changes — the API already exists and is consumed by the mobile app.

## Architecture

- **Directory:** `admin/` alongside `eloquent-bookings/`.
- **Stack:** Vite + React 18 + TypeScript, `react-router-dom`, `axios`.
  Identical toolchain to `eloquent-bookings` (same `vite.config.ts`, `tsconfig`,
  Vitest setup, PWA manifest pattern, icon generation script).
- **Design system:** copy `src/styles/tokens.css`, `customer.css`, `mobile.css`
  verbatim (dark + mint). Reuse `MobileLayout` + `AppBar` shell.
- **API base:** `VITE_API_URL ?? 'https://api.eloquentservice.com/api'`.

### Reused plumbing (copied from eloquent-bookings)

- `lib/api.ts` — axios instance + interceptor. **Change:** auth token read from
  `shop_token` (not `customer_token`).
- `lib/storage.ts`, `lib/deviceId.ts`, `lib/date.ts` — copied verbatim.
- `layout/MobileLayout.tsx`, `layout/AppBar.tsx` — copied; tab config swapped.
- `components/Spinner.tsx`, `components/EmptyState.tsx`, `components/Icons.tsx`,
  `components/WhatsAppButton.tsx` — copied, extended with provider icons as needed.

### New code

- `context/ShopContext.tsx` — holds `{ shop, token, loading, loginShop, logoutShop }`,
  persisted to `localStorage` (`shop_token`, `shop_data`). Mirrors
  `mobile-app/src/context/ShopContext.js`.
- `lib/shops.ts`, `lib/bookings.ts`, `lib/catalogs.ts` — typed API wrappers.
- `types.ts` — extend with `Shop`, `Booking`, `Catalog`, `StaffMember`,
  `WorkingHours`, `Invoice`.

## Authentication

Two-step shop login, mirroring `mobile-app/src/screens/auth/LoginScreen.js`:

1. Enter `shop_code`.
2. Enter PIN → `POST shops/login { shop_code, pin }` → `{ token, shop }`.

- "Remember me" persists `shop_code` (and optionally PIN) in `localStorage`.
- **No biometric** (web). The mobile biometric/`expo-local-authentication` path
  is dropped.
- Forgot PIN: `POST shops/reset-pin { shop_code }`.
- Shop registration: `POST /shops` (form), with `GET /location { lat, lon }`
  reverse-geocode to prefill address.
- axios interceptor attaches `Authorization: Bearer <shop_token>` and `X-Device-Id`.
- Unauthenticated users are redirected to `/login`; a route guard wraps the
  tabbed routes.

## Navigation

**Bottom tab bar (5 tabs)**, from `mobile-app/src/navigation/ShopNavigator.js`:

| Tab | Route | Source screen |
|-----|-------|---------------|
| Home | `/` | DashboardScreen |
| Bookings | `/bookings` | ShopBookingsScreen |
| Reminders | `/reminders` | RemindersScreen |
| Services | `/services` | CatalogsScreen |
| Profile | `/profile` | ProfileScreen |

**Full-screen routes (no tab bar):**

| Route | Source screen | Purpose |
|-------|---------------|---------|
| `/login` | LoginScreen | Shop login |
| `/register` | RegisterScreen | Shop sign-up |
| `/forgot-pin` | ForgotPinScreen | PIN reset |
| `/booking/:id` | BookingActionScreen | Booking detail + actions |
| `/services/:id/edit` | CatalogEditScreen | Create/edit a service (`/services/new` for create) |
| `/staff` | StaffScreen | Manage staff |
| `/working-hours` | WorkingHoursScreen | Edit working hours |
| `/scan/:token` | ScanLoginScreen | Approve a QR web-login |

## Pages & behavior

Each page reproduces the behavior of its source mobile screen.

- **Dashboard** (`/`): stat cards (total bookings, revenue) + today's bookings list.
  `GET /shop/bookings { shop_id }` → `{ data, total_bookings, total_revenue }`.
  Pull-to-refresh becomes a refresh affordance.
- **Bookings** (`/bookings`): full bookings list, tap → `/booking/:id`.
  `GET /shop/bookings { shop_id }`.
- **Booking Action** (`/booking/:id`): `GET /booking/:id`; status changes via
  `PUT /booking/:id { status }` (confirm/cancel/complete); reassign staff via
  `GET /shops/:id/staff` + `POST /booking/:id/reassign { staff_id }`; mark invoice
  paid via `POST /invoice/:invoiceId/mark-paid`.
- **Reminders** (`/reminders`): bookings needing reminders from
  `GET /shop/bookings`; `POST /booking/:id/mark-reminder-sent`.
- **Services** (`/services`): `GET /shop/catalogs`; delete via
  `DELETE /shop/catalogs/:id`; add → `/services/new`.
- **Service Edit** (`/services/:id/edit`, `/services/new`):
  `GET /shop/catalogs/:id`; create `POST /shop/catalogs`; update
  `PUT /shop/catalogs/:id`.
- **Staff** (`/staff`): `GET /shops/:id/staff`; add `POST /shops/:id/staff { name }`;
  rename/update `PUT /shops/:id/staff/:id`.
- **Working Hours** (`/working-hours`): edit per-day hours; save via
  `PUT /shops/:id { working_hours }`.
- **Profile** (`/profile`): shop details; `GET /location` geocode; save via
  `PUT /shops/:id`. Includes logout and links to Staff, Working Hours, Scan.
- **Scan Approve** (`/scan/:token`): `POST /shops/qr-login/approve/:token`.

## Error handling

- API failures surface inline (toast/banner) and fall back to empty states,
  matching the mobile screens' try/catch behavior.
- 401 → clear `shop_token`/`shop_data` and redirect to `/login`.
- Network/loading states use the shared `Spinner` and `EmptyState` components.

## Testing

Vitest + Testing Library (same config as `eloquent-bookings`):

- Unit tests for `lib/shops.ts`, `lib/bookings.ts`, `lib/catalogs.ts` wrappers.
- `ShopContext` login/logout + persistence tests.
- Render/interaction tests for Login, Dashboard, Bookings, and Booking Action
  (the highest-traffic, highest-risk paths).

## Deployment

- `npm run build` → static `dist/`.
- Served by nginx on the shared droplet (`64.227.153.90`) at
  `admin.eloquentservice.com`, with SPA fallback (`try_files ... /index.html`).
- DNS: A-record `admin` → `64.227.153.90`; Let's Encrypt TLS cert.
- The existing `deploy-eloquent-app` skill targets Laravel + Inertia apps; the
  static-SPA nginx server block and deploy steps will be adapted from it during
  the deploy phase. Exact steps confirmed against the skill at deploy time.

## Build phasing (single app)

1. Scaffold (`admin/`) + tokens + `MobileLayout` + `ShopContext` + auth
   (Login, Register, Forgot PIN, route guard).
2. Dashboard + Bookings + Booking Action.
3. Services + Service Edit + Staff.
4. Reminders + Working Hours + Profile + Scan Approve.
5. PWA manifest + icons + deploy to `admin.eloquentservice.com`.
