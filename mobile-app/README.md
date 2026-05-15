# Service Hub Mobile App

React Native (Expo) mobile app for Service Hub — mirrors all features of the web app.

## Quick Start

```bash
cd mobile-app

# Install dependencies
npm install

# Start Expo (shows QR code for Expo Go)
npm start
```

Then scan the QR code in **Expo Go** (install from App Store / Play Store).

## Features

### Customer / Guest
- **Home & Explore** — Browse all businesses with search
- **Near Me** — GPS-based nearby shop discovery
- **Shop Detail** — View catalog, select services, choose date/time, book
- **Bookings** — View your booking history
- **Favourites** — Saved favourite businesses

### Shop Owner
- **Dashboard** — KPIs (total bookings, revenue, today's schedule, recent activity)
- **Services** — Add, edit, delete catalog items with images
- **Bookings** — View and filter all bookings, update status
- **Working Hours** — Set open/close times per day
- **Profile** — Edit shop info, logo, cover image
- **Scan QR Login** — Approve desktop login sessions from this app

## Navigation

```
App
├── Guest (Bottom Tabs)
│   ├── Explore
│   ├── Bookings
│   ├── Home
│   ├── Favourites
│   └── Near Me
│       └── ShopDetail (Stack)
│           └── BookingView (Stack)
└── Shop (Bottom Tabs) — requires login
    ├── Dashboard
    ├── Services
    │   └── CatalogEdit (Stack)
    ├── Bookings
    │   └── BookingAction (Stack)
    ├── Hours
    └── Profile
        └── ScanLogin (Stack)

Auth
├── Login
└── Register
```

## API

Connects to the same backend as the web app:
`https://api.eloquentservice.com/api`

To use a local backend, edit `src/utils/api.js` and change `BASE_URL` to your local IP:
```js
const BASE_URL = 'http://192.168.1.XXX:8000/api';
```

## Design

- Dark theme matching the web app (`#0B121B` background)
- Primary color: `#007AFF` (iOS blue)
- Manrope font via system font stack
- Bottom tab navigation for both guest and shop sections
