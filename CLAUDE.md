# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Service Hub Next is a full-stack service booking and shop management platform. Shops register and manage bookings/catalogs/customers; customers discover nearby shops, make bookings, and save favorites. It includes a WhatsApp-style QR login system and CRM features (leads, deals, invoices).

## Development Commands

### Running the Project

```bash
# Run both frontend and backend concurrently (from repo root)
npm run dev:all

# Frontend only (Next.js on port 3000)
npm run dev

# Backend only (Laravel on port 8000)
npm run serve-backend
# or from backend/
cd backend && php artisan serve
```

### Backend (from `backend/`)

```bash
composer install          # Install PHP dependencies
composer setup            # Full setup: install + key generate + migrate + build
composer test             # Run PHPUnit tests (clears config first)
php artisan migrate       # Run migrations
php artisan db:seed       # Seed test data
php artisan queue:work    # Start queue worker
php artisan pail          # Monitor logs
```

### Running a single backend test

```bash
cd backend && php artisan test --filter=TestClassName
# or with PHPUnit directly:
cd backend && ./vendor/bin/phpunit --filter=TestMethodName
```

### Frontend (from repo root)

```bash
npm install
npm run build   # Production build
npm run start   # Serve production build
```

## Testing

### Backend tests

Place Feature tests in `backend/tests/Feature/` and Unit tests in `backend/tests/Unit/`. Every new controller action or model method should have a corresponding test.

- Feature tests should use `RefreshDatabase` and test the full HTTP layer via `$this->getJson()`/`$this->postJson()` etc.
- Use in-memory SQLite (already configured in `phpunit.xml`) — never rely on a real database in tests.
- Factories are in `backend/database/factories/`. Create a factory for any new model that needs test data.
- Seeders in `backend/database/seeders/` can be called with `$this->seed(ShopSeeder::class)` inside a test when fuller data sets are needed.

```bash
cd backend && composer test                          # run all tests
cd backend && php artisan test --filter=ClassName    # run one class
cd backend && php artisan test --filter=methodName   # run one method
```

### Frontend tests

There is no test runner configured yet. When adding one, place tests colocated with their component (`ComponentName.test.jsx`) or in a `__tests__/` folder beside the route segment. Mock the Axios instance from `src/utils/api.js` rather than making real HTTP calls.

## Environment Setup

**Frontend** — create `.env.local` at repo root:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_APP_URL=http://192.168.1.205:3000
```

**Backend** — `backend/.env` requires:
- `DB_CONNECTION=sqlite` (local dev uses `backend/database/database.sqlite`)
- `ANTHROPIC_API_KEY` — for AI/Claude features
- `GOOGLE_MAPS_KEY` — for geolocation/nearby shops
- Mail and Pusher settings for real-time/broadcast features

## Architecture

### Frontend (`src/`)

Built with Next.js App Router. Pages live in `src/app/`, reusable components in `src/components/`.

Key architectural points:
- **API layer**: All HTTP calls go through `src/utils/api.js`, which is an Axios instance with interceptors that automatically attach `shop_token` from localStorage and `X-Device-Id` header to every request.
- **State**: React Context in `src/context/` for shared state.
- **Image uploads**: Compressed client-side via `src/utils/image.js` before sending to the backend.
- **Layout**: Mobile-first at 480px max-width using Tailwind CSS 4.

Main route groups:
- `/shop/*` — Shop owner dashboard (bookings, catalog, profile, address, QR scan-login)
- `/near-me`, `/explore`, `/detail/*` — Customer-facing shop discovery
- `/booking/*`, `/bookings` — Booking creation and history
- `/login`, `/register` — Authentication

### Backend (`backend/`)

Laravel 12 REST API. All routes defined in `backend/routes/api.php` under the `/api` prefix.

- **Auth**: Laravel Sanctum token auth. Token is `shop_token` on the frontend side. Device ID tracked via `X-Device-Id` for QR login session pairing.
- **QR Login flow**: `ShopQrLoginController` — desktop generates a QR with a session token; mobile polls/approves it; desktop polls until approved and then auto-authenticates.
- **Nearby shops**: Uses the Haversine formula in `ShopController` with a default 2 km radius (configurable per request).
- **AI**: `ClaudeController` integrates with Anthropic SDK via `ANTHROPIC_API_KEY`.
- **Invoices**: PDF generation via Laravel DomPDF (`InvoiceController`), with payment tracking and reminder system.
- **CRM**: `LeadController` / `DealController` for agent-facing sales pipeline.
- **Queue**: Database-backed queue (local). Used for async jobs.
- **Tests**: PHPUnit 11 with Feature and Unit suites; uses in-memory SQLite (`DB_CONNECTION=sqlite` with `:memory:`).

### Frontend ↔ Backend Contract

- Base URL: `NEXT_PUBLIC_API_URL` (defaults to `http://127.0.0.1:8000/api`)
- Auth header: `Authorization: Bearer <shop_token>`
- Device header: `X-Device-Id: <uuid>`
- Key endpoints: `/shops/nearby`, `/shops/login`, `/shops/qr-login/*`, `/shop/catalogs`, `/booking`, `/invoices`, `/leads`, `/deals`
