# Rezzy — Google Play Store Publishing Guide

## Prerequisites

- Node.js installed
- Expo account ([expo.dev](https://expo.dev))
- Google Play Developer account ($25 one-time fee) — [play.google.com/console](https://play.google.com/console)

---

## Step 1: Install & Login to EAS CLI

```bash
npm install -g eas-cli
eas login
```

---

## Step 2: Configure EAS Build

```bash
cd D:/Francis/projects/2026/service-hub-next/mobile-app
eas build:configure
```

`eas.json` is already created with three profiles:
- **development** — dev client for testing
- **preview** — generates APK for direct install on phone
- **production** — generates AAB for Play Store upload

---

## Step 3: Build

### Test build (APK for your phone):
```bash
eas build --platform android --profile preview
```
Download the APK from the link EAS gives you. Install on your phone and test everything.

### Production build (AAB for Play Store):
```bash
eas build --platform android --profile production
```
- EAS will ask to generate a **keystore** — say **Yes** (EAS manages it securely)
- Build happens in the cloud
- Download link provided when done

---

## Step 4: Google Play Console Setup

### 4a. Create Developer Account
1. Go to [play.google.com/console](https://play.google.com/console)
2. Pay **$25 one-time fee**
3. Complete identity verification (takes 1-2 days)

### 4b. Create the App
1. Click **"Create app"**
2. App name: **Rezzy**
3. Default language: English
4. App type: App (not Game)
5. Free or Paid: Free
6. Accept declarations

### 4c. Store Listing — Prepare These Assets

| Item | Requirement |
|---|---|
| **App icon** | 512x512 PNG (high-res) |
| **Feature graphic** | 1024x500 PNG (shown at top of listing) |
| **Screenshots** | Min 2 phone screenshots (min 320px, max 3840px) |
| **Short description** | Max 80 characters |
| **Full description** | Max 4000 characters |
| **Privacy policy URL** | Required — must be a live URL |
| **App category** | Business or Lifestyle |

#### Short description example:
> Book local services, manage your shop, and track appointments instantly.

#### Full description example:
> Rezzy powered by Eloquent — your all-in-one service booking platform.
>
> For Customers:
> - Discover local shops and service providers nearby
> - Book appointments with a few taps
> - Track your bookings and favourite shops
> - Find shops using GPS-based location search
>
> For Business Owners:
> - Manage your shop profile, services, and working hours
> - View and manage all bookings from a single dashboard
> - Track revenue and booking statistics
> - QR code login for seamless desktop-mobile authentication
>
> Features:
> - Dark-themed modern interface
> - Biometric login support (fingerprint/face)
> - Real-time booking management
> - Image uploads for shop logos and service catalogs
> - Remember me & saved credentials

### 4d. Content Rating
1. Go to **Policy > App content > Content rating**
2. Fill the questionnaire — select "No" for violence, gambling, etc.
3. Result: **Everyone** rating

### 4e. Data Safety Form
Declare what data your app collects:

| Data type | Collected | Shared | Purpose |
|---|---|---|---|
| Email address | Yes | No | Account login |
| Name | Yes | No | Account profile |
| Location | Yes | No | Finding nearby shops |
| Device ID | Yes | No | Booking tracking |
| Photos | Yes | No | Shop image uploads |

---

## Step 5: Upload the AAB

### Option A — Manual Upload
1. Download the `.aab` file from EAS build link
2. In Play Console → **Release > Production > Create new release**
3. Upload the `.aab` file
4. Add release notes (e.g., "Initial release of Rezzy")
5. Click **Review release** → **Start rollout**

### Option B — Auto Submit via EAS
```bash
eas submit --platform android --profile production
```

For auto-submit, you need a **Google Service Account key**:
1. Go to [Google Cloud Console](https://console.cloud.google.com) → **IAM & Admin > Service Accounts**
2. Create a service account
3. Grant it **"Service Account User"** role
4. Create a JSON key → download it
5. In Play Console → **Settings > API access** → link the service account
6. Save the JSON key as `mobile-app/google-service-account.json` (already in `.gitignore`)

---

## Step 6: Review Timeline

| Stage | Time |
|---|---|
| Identity verification | 1-2 days |
| First app review | 3-7 days (up to 14 for new accounts) |
| Subsequent updates | 1-3 days |

---

## Pre-Publish Checklist

- [ ] Replace placeholder icons with real branded assets:
  - `assets/icon.png` (1024x1024 recommended)
  - `assets/adaptive-icon.png` (1024x1024 with padding)
  - `assets/splash.png` (1284x2778 recommended)
- [ ] Test preview APK on a real device end-to-end
- [ ] Create Google Play Developer account ($25)
- [ ] Prepare store listing screenshots (take from real device)
- [ ] Write short & full descriptions
- [ ] Host a privacy policy page (can use a simple GitHub Pages or your website)
- [ ] Complete content rating questionnaire
- [ ] Complete data safety form
- [ ] Build production AAB
- [ ] Upload AAB and submit for review

---

## Quick Command Reference

```bash
# Install EAS
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Test build (APK)
eas build --platform android --profile preview

# Production build (AAB)
eas build --platform android --profile production

# Auto-submit to Play Store
eas submit --platform android --profile production

# Build + submit in one command
eas build --platform android --profile production --auto-submit
```

---

## App Details

- **Package name:** `com.eloquent.rezzy`
- **App name:** Rezzy
- **Version:** 1.0.0
- **API:** https://api.eloquentservice.com/api
