# Service Hub Next

Service Hub is a Next.js + Laravel project for service shops, bookings, favourites, near-me discovery, and shop-side dashboard management.

This README explains local setup and the new **WhatsApp-style QR login flow**:

- Desktop opens login and shows QR
- Mobile shop app scans the QR in-app
- Mobile approves the session
- Desktop is logged in automatically

## Tech Stack

- Frontend: Next.js (App Router), React, Axios, Tailwind
- Backend: Laravel API (Sanctum tokens)
- Auth: Token-based shop login (`shop_token`)

## Project Structure

- `src/` → Next.js frontend
- `backend/` → Laravel API

## Run Locally

### 1) Install dependencies

```bash
npm install
cd backend
composer install
```

### 2) Configure frontend API URL

Create `.env.local` in project root:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### 3) Start backend

From `backend/`:

```bash
php artisan serve
```

### 4) Start frontend

From root:

```bash
npm run dev
```

### 5) Production build check

```bash
npm run build
```

## QR Login (WhatsApp Style)

## User Experience

1. On desktop, open `/login` and select **Scan QR**.
2. Desktop generates a short-lived QR token and displays QR.
3. On mobile (already logged-in shop user), open **Shop Dashboard → Scan QR Login**.
4. Mobile scans desktop QR and auto-approves login.
5. Desktop polls token status and signs in once approved.

This removes the need to open native camera app manually.

## Frontend Pages

- Desktop login with QR + fallback ID/PIN:
	- `src/app/login/page.js`
- Mobile QR approval by token URL:
	- `src/app/login/qr/page.js`
- In-app scanner for logged-in mobile shop users:
	- `src/app/shop/scan-login/page.js`
- Dashboard entry button to scanner:
	- `src/app/shop/dashboard/page.js`

## Backend Endpoints

Registered in `backend/routes/api.php`:

- `POST /api/shops/qr-login/request`
	- Creates pending QR login request
	- Response includes `token` and `expires_in`

- `GET /api/shops/qr-login/status/{token}`
	- Desktop polling endpoint
	- Returns `pending`, `approved`, or `expired`

- `POST /api/shops/qr-login/approve/{token}` (requires `auth:sanctum`)
	- Mobile approval endpoint
	- Creates shop token and marks QR request approved

Controller:

- `backend/app/Http/Controllers/ShopQrLoginController.php`

## Nearby Shops

Nearby search is based on shop `lat/lon` and user location.

- Endpoint: `GET /api/shops/nearby`
- Required query: `lat`, `lon`
- Optional query: `radius_km` (default `25`), `per_page`, `search`, `is_favourite_only`

Used by page:

- `src/app/near-me/page.js`

## Image Upload Notes

Profile hero/logo uploads are compressed client-side before request to reduce 413 payload errors.

- `src/app/shop/profile/page.js`
- `src/utils/image.js`

Server should still be configured with enough limits:

- Nginx: `client_max_body_size`
- PHP: `upload_max_filesize`, `post_max_size`

## Common Troubleshooting

- **QR expired**
	- Refresh QR on desktop and rescan.

- **Mobile scanner not opening camera**
	- Allow camera permission.
	- If browser lacks QR detector support, use fallback paste URL in scanner page.

- **Desktop not auto-login after approval**
	- Ensure frontend can reach backend API.
	- Check polling endpoint response in network tab.

- **Build fails on query-param pages**
	- For client pages, read URL params in `useEffect` using `window.location.search`.

## Scripts

From root:

- `npm run dev` → frontend dev server
- `npm run build` → production build
- `npm run start` → production run
- `npm run serve-backend` → Laravel dev serve command (as configured)
- `npm run dev:all` → run frontend + backend together
