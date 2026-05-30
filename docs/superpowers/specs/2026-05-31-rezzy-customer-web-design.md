# Rezzy Customer Web — Responsive Mobile PWA

**Date:** 2026-05-31
**Status:** Approved design, pending implementation plan

## Summary

A fresh, standalone **Vite + React (TypeScript)** single-page PWA living in a new
top-level repo folder `rezzy-customer/`. It reproduces the **customer-side** flows
from the existing React Native app (`mobile-app/`) and wears the **salesagent
mobile** dark/mint design language (`salesagent/resources/css/mobile.css` +
`pulse-styles.css` tokens).

"Responsive mobile-friendly" means: a centered ~480px app column on desktop,
full-bleed on phones — identical behaviour to salesagent's `MobileLayout`.

It is fully separate from the existing Next.js `frontend/` and talks to the
**existing Rezzy Laravel backend** (no backend changes required beyond minor
additions, if any).

## Decisions (locked)

| Decision | Choice |
|---|---|
| Stack | Vite + React 18 + react-router-dom, TypeScript (`.tsx`) |
| Folder | `rezzy-customer/` (new top-level folder in the Rezzy repo) |
| Scope (this phase) | Customer / guest side only |
| Backend | Reuse existing Rezzy Laravel API |
| Styling | Port salesagent `mobile.css` + token block; no Tailwind |
| Booking auth | Match mobile-app — guest booking allowed via `X-Device-Id`; no forced login |

## Goals

- Mirror the customer-side feature set of `mobile-app/`.
- Look and feel like the salesagent mobile app (dark theme, mint accent,
  bottom tab bar, app-bar header, bottom-sheet modals, mono labels).
- Be a real PWA (installable, basic manifest) but not over-engineer offline.

## Non-goals (this phase)

- Shop-owner dashboard (Dashboard, Bookings management, Reminders, Services/
  Catalog edit, Profile, Staff, Working hours).
- QR scan-login flow.
- Voice input, push notifications, advanced offline caching.

These become a separate phase-2 spec.

## Architecture

### Tech & dependencies
- **Vite** + **React 18** + **react-router-dom v6**.
- **axios** for HTTP.
- **TypeScript** (`.tsx`), matching the salesagent design source.
- Plain CSS design system (ported), Geist / Geist Mono fonts.

### Folder structure
```
rezzy-customer/
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  public/
    manifest.webmanifest
    icons/ (192, 512)
  src/
    main.tsx
    App.tsx                 # router + providers
    lib/
      api.ts                # axios instance + interceptors
      deviceId.ts           # UUID in localStorage
      storage.ts            # thin localStorage helpers (get/set/JSON)
    context/
      CustomerContext.tsx   # logged-in customer + token
    layout/
      MobileLayout.tsx      # bottom tab bar + outlet
      AppBar.tsx            # reusable top app bar
    components/
      ShopCard.tsx
      BottomSheet.tsx       # ported m-modal
      SearchBar.tsx
      Icons.tsx             # inline SVG icon set (ported from salesagent)
      WhatsAppButton.tsx
      EmptyState.tsx
      Spinner.tsx
      StatusPill.tsx        # booking status badge
    pages/
      Home.tsx
      Explore.tsx
      NearMe.tsx
      Favourites.tsx
      Bookings.tsx
      BookingView.tsx
      ShopDetail.tsx
      Login.tsx
      Register.tsx
      Account.tsx
    styles/
      tokens.css            # :root tokens from pulse-styles.css
      mobile.css            # ported m-* design system + app additions
```

### API layer (`src/lib/api.ts`)
Mirrors `mobile-app/src/utils/api.js`:
- Base URL from `import.meta.env.VITE_API_URL`, default
  `https://api.eloquentservice.com/api`.
- Request interceptor attaches:
  - `X-Device-Id`: a UUID v4 generated once and stored in `localStorage`
    (`device_id`).
  - `Authorization: Bearer <token>` where token = `customer_token` from
    localStorage if present (no shop token in this app).
- `Content-Type: application/json`.

### State (`CustomerContext`)
Ported from `mobile-app/src/context/CustomerContext.js`:
- Holds `customer`, `customerToken`, `loading`.
- Hydrates from localStorage (`customer_data`, `customer_token`) on mount.
- `loginCustomer(userData, token)` / `logoutCustomer()` persist to localStorage.

### Layout
`MobileLayout` (ported from salesagent `MobileLayout.tsx`):
- `.mobile-app` shell, `.mobile-main` outlet, `.m-tabbar` bottom nav.
- 5 tabs: **Home · Bookings · Favourites · Near Me · Account**.
- Active tab derived from current route.
- Desktop: centered max-width column (~480px) with the salesagent artboard look.

## Pages and their API contracts

All endpoints already exist on the Rezzy backend (confirmed from `mobile-app`
usage). Responses are consumed exactly as the RN screens consume them.

| Page | Source RN screen | Endpoints |
|---|---|---|
| Home | `HomeScreen` | `GET /shops?page&per_page&search` (paginated, load-more, debounced search); `POST /shops/:id/favourite` |
| Explore | `ExploreScreen` | `GET /shops` (paginated, search); favourite toggle |
| Near Me | `NearMeScreen` | `GET /shops/nearby?lat&lon&radius` — uses browser `navigator.geolocation` |
| Favourites | `FavouritesScreen` | `GET /shops?favourites=1&per_page=50`; favourite toggle |
| Shop Detail | `ShopDetailScreen` | `GET /shops/:id?date=YYYY-MM-DD` (working hours + catalogs/slots); `POST /shops/:id/book` `{ date, start_time, charges, services[] }`; `POST /shops/:id/favourite` |
| Bookings | `BookingsScreen` | `GET /bookings` |
| Booking View | `BookingViewScreen` | `GET /booking/:id` |
| Login | `CustomerLoginScreen` | `POST /login { phone, password }` |
| Register | `CustomerRegisterScreen` | `POST /register { ...form }` |
| Account | `CustomerProfileScreen` | Renders stored profile + logout; sign-in/register prompt when guest |

WhatsApp support: opens `https://wa.me/971557369629?text=...`
(constants ported from `mobile-app/src/utils/support.js`).

### Shop Detail / booking flow specifics
- Date strip: next 31 days (`generateDates(31)`), default today; selecting a date
  refetches `GET /shops/:id?date=…`.
- Service selection: multi-select from `shop.catalogs`; running total of `price`.
- Time-slot selection: from the shop's working hours / slot data for the date.
- `POST /shops/:id/book` payload: `{ date, start_time, charges: total,
  services: selectedCatalogs (minus image field) }`.
- On success, read `res.data?.data?.id || res.data?.id` and navigate to
  `/booking/:id` (Booking View).
- **No forced login** — booking succeeds for guests via `X-Device-Id`; a
  customer token is attached automatically if the user is logged in.
- Show backend `message` on error.

## Design system port

1. Copy the `:root` token block from `pulse-styles.css` into `styles/tokens.css`
   (`--bg-1:#0a0e0c`, `--surface-1:#131816`, `--border-1`, `--text-1:#f3f5f4`,
   `--text-2/4`, `--mint-400:#00e6b8`, `--mint-300/600/soft`, `--border-mint`,
   `--font-sans: Geist`, `--font-mono: Geist Mono`).
2. Copy salesagent `mobile.css` into `styles/mobile.css` (the `.m-*` classes:
   appbar, scroll, shift banner, stat row, section title, search, day list,
   cards, modal/bottom-sheet, tabbar, empty state).
3. Add customer-specific pieces not present in the agent app:
   - **ShopCard**: logo thumbnail, Open/Closed badge, rating, shop-code pill,
     location + distance, today's hours, "Book Now" button.
   - **Date strip + time-slot grid** for booking.
   - **Booking status pills** (reuse badge styling).
4. Load Geist / Geist Mono (self-host or CDN) so typography matches.

## Error handling & edge cases
- Network/API errors: inline error text on forms; toast/empty-state elsewhere.
- Empty results: ported `.m-empty` states ("No results found…").
- Geolocation denied on Near Me: show a prompt/empty state with a retry button.
- Loading: spinner matching salesagent style; skeleton optional, not required.
- Auth-gated favourites: if the backend requires a token to favourite and the
  user is a guest, surface the sign-in prompt (match mobile-app behaviour).

## Testing
- Vitest + React Testing Library for component/page logic.
- Mock the axios instance (`src/lib/api.ts`) — never hit the real API in tests.
- Cover: api interceptor header attachment, CustomerContext hydrate/login/logout,
  Home search debounce + pagination, ShopDetail booking payload construction,
  NearMe geolocation success/denied paths.

## Configuration
- `.env` / `.env.example`: `VITE_API_URL=https://api.eloquentservice.com/api`
  (override to local backend for dev).
- `package.json` scripts: `dev`, `build`, `preview`, `test`.

## Open questions / future phases
- Phase 2: shop-owner side (Dashboard, Bookings mgmt, Reminders, Catalog edit,
  Profile, Staff, Working hours, QR scan-login).
- Deployment target for the static build (separate subdomain vs. served by
  Laravel `public/`) — decide at deploy time.
