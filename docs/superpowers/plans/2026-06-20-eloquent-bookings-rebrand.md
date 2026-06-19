# Eloquent Bookings Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the customer-facing app from "Rezzy" to "Eloquent Bookings" — display strings, favicon, internal identifiers (folder/package/deploy), customer-facing backend strings — and serve it at `bookings.eloquentservice.com` alongside the existing `rezzy.eloquentservice.com`.

**Architecture:** The customer app (`rezzy-customer/`, a Vite/React SPA) is renamed in place to `eloquent-bookings/`. Display strings and the favicon glyph change to "Eloquent Bookings" / "EB". The shared Laravel backend gets three customer-facing string edits (kept minimal — backend is not renamed). The droplet serves one renamed webroot under two domains via a single nginx site + a SAN cert.

**Tech Stack:** Vite, React, TypeScript, vitest, sharp (icon gen), Laravel/Blade, nginx, certbot, PowerShell deploy script.

## Global Constraints

- Display name string is exactly `Eloquent Bookings` (two words, title case).
- PWA `short_name` is exactly `Bookings`.
- Internal folder + package name is exactly `eloquent-bookings`.
- Favicon/app-icon monogram glyph is `EB` on the existing mint tile (gradients unchanged).
- New domain `bookings.eloquentservice.com`; old `rezzy.eloquentservice.com` stays live (same app, parallel).
- Provider app (`bizrezzy`) is OUT OF SCOPE — do not edit it.
- Work stays on branch `feat/rezzy-customer-web`. Do NOT checkout master or `git stash` (tree is normally dirty). Commit only the files each task names.
- Droplet: `root@64.227.153.90`, customer nginx site is `sites-enabled/frontend`, `*.eloquentservice.com` is a wildcard A-record (no DNS step).
- `deploy.ps1` stays ASCII-only (PS 5.1) and keeps the single-tarball upload model.

---

### Task 1: Rename the app folder and internal identifiers

Rename `rezzy-customer/` → `eloquent-bookings/` and update every internal identifier (package name, lockfile, README, deploy script) so the app builds from its new path. No display strings yet.

**Files:**
- Rename: `rezzy-customer/` → `eloquent-bookings/` (git mv)
- Modify: `eloquent-bookings/package.json:2`
- Modify: `eloquent-bookings/package-lock.json` (top-level + root-package `name`)
- Modify: `eloquent-bookings/README.md`
- Modify: `eloquent-bookings/deploy.ps1`

**Interfaces:**
- Produces: the app dir is now `eloquent-bookings/`; deploy webroot is `/var/www/eloquent-bookings`; verify URL is `https://bookings.eloquentservice.com/`. Later tasks edit files under `eloquent-bookings/`.

- [ ] **Step 1: Rename the directory preserving history**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git mv rezzy-customer eloquent-bookings
```

(If `git mv` reports the tree is dirty with untracked build artifacts that block it, move those aside or use `git mv -k`; `node_modules` and `dist` are gitignored and move with the plain OS rename that `git mv` performs.)

- [ ] **Step 2: Update `package.json` name**

In `eloquent-bookings/package.json`, line 2:

```json
  "name": "eloquent-bookings",
```

- [ ] **Step 3: Update `package-lock.json` name fields**

In `eloquent-bookings/package-lock.json`, replace the two `"name": "rezzy-customer"` occurrences (the top-level field and the `"packages": { "": { "name": ... } }` root entry) with:

```json
  "name": "eloquent-bookings",
```

- [ ] **Step 4: Update `deploy.ps1`**

In `eloquent-bookings/deploy.ps1`, make these exact replacements (keep ASCII-only):

- Line 2 comment:
```powershell
# Build eloquent-bookings and deploy the static SPA to bookings.eloquentservice.com.
```
- Line 9 webroot:
```powershell
$webroot = "/var/www/eloquent-bookings"
```
- Line 28 tarball path:
```powershell
$tar = Join-Path $env:TEMP "eloquent-bookings-dist.tar.gz"
```
- Line 32 scp remote temp path:
```powershell
scp -o BatchMode=yes -o ConnectTimeout=15 $tar "$server`:/tmp/eloquent-bookings-dist.tar.gz"
```
- Line 34 remote extract (swap the tmp tarball name):
```powershell
ssh -o BatchMode=yes $server "mkdir -p $webroot && rm -rf $webroot/* && tar -xzf /tmp/eloquent-bookings-dist.tar.gz -C $webroot && chown -R www-data:www-data $webroot && rm -f /tmp/eloquent-bookings-dist.tar.gz"
```
- Lines 39 & 41 verify URL + done message:
```powershell
curl.exe -sI https://bookings.eloquentservice.com/ | Select-Object -First 1
```
```powershell
Write-Host "==> Done - https://bookings.eloquentservice.com" -ForegroundColor Green
```

- [ ] **Step 5: Update `README.md`**

Replace "Rezzy" / "rezzy-customer" references in `eloquent-bookings/README.md` with "Eloquent Bookings" / "eloquent-bookings". (Title and any path/command examples.)

- [ ] **Step 6: Verify the app still builds from its new path**

Run:
```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/eloquent-bookings" && npm run build
```
Expected: build succeeds, `dist/` produced, exit 0. (No reinstall needed — `node_modules` moved with the folder.)

- [ ] **Step 7: Run the existing test suite (baseline, should be green)**

Run:
```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/eloquent-bookings" && npm test
```
Expected: PASS (no test asserts the brand string).

- [ ] **Step 8: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add eloquent-bookings
git commit -m "refactor(eloquent-bookings): rename rezzy-customer folder + internal identifiers"
```

---

### Task 2: Customer app display strings → "Eloquent Bookings"

Change every user-visible "Rezzy" string in the renamed app (favicon glyph handled separately in Task 3).

**Files:**
- Modify: `eloquent-bookings/index.html:15`
- Modify: `eloquent-bookings/public/manifest.webmanifest:2-4`
- Modify: `eloquent-bookings/src/pages/Home.tsx:50`
- Modify: `eloquent-bookings/src/components/WhatsAppButton.tsx:4`
- Modify: `eloquent-bookings/src/styles/tokens.css:1`

**Interfaces:**
- Consumes: the renamed `eloquent-bookings/` path from Task 1.
- Produces: nothing other tasks consume.

- [ ] **Step 1: Update the HTML title**

`eloquent-bookings/index.html` line 15:
```html
    <title>Eloquent Bookings</title>
```

- [ ] **Step 2: Update the web manifest**

`eloquent-bookings/public/manifest.webmanifest` lines 2-4:
```json
  "name": "Eloquent Bookings",
  "short_name": "Bookings",
  "description": "Book salon and service appointments with Eloquent Bookings.",
```
(Keep the rest of the manifest unchanged. If the existing `description` differs, replace whatever brand text it contains so no "Rezzy" remains.)

- [ ] **Step 3: Update the Home AppBar title**

`eloquent-bookings/src/pages/Home.tsx` line 50:
```tsx
      <AppBar title="Eloquent Bookings" actions={<><ThemeToggle /><WhatsAppButton /></>} />
```

- [ ] **Step 4: Update the WhatsApp support message**

`eloquent-bookings/src/components/WhatsAppButton.tsx` line 4:
```ts
const SUPPORT_MESSAGE = 'Hi Eloquent Bookings team, I need some help.';
```

- [ ] **Step 5: Update the tokens.css header comment**

`eloquent-bookings/src/styles/tokens.css` line 1:
```css
/* Eloquent Bookings — design tokens (dark + mint), ported from salesagent */
```

- [ ] **Step 6: Confirm no user-facing "Rezzy" remains in app source**

Run (ripgrep; expect zero hits):
```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/eloquent-bookings" && grep -rn "Rezzy" index.html public src || echo "clean"
```
Expected: `clean` (favicon.svg still says Rezzy until Task 3 — if it appears here that's expected and handled next; everything else must be gone).

- [ ] **Step 7: Build to confirm nothing broke**

Run:
```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/eloquent-bookings" && npm run build
```
Expected: build succeeds, exit 0.

- [ ] **Step 8: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add eloquent-bookings/index.html eloquent-bookings/public/manifest.webmanifest eloquent-bookings/src/pages/Home.tsx eloquent-bookings/src/components/WhatsAppButton.tsx eloquent-bookings/src/styles/tokens.css
git commit -m "feat(eloquent-bookings): rebrand display strings Rezzy -> Eloquent Bookings"
```

---

### Task 3: Favicon "EB" monogram + regenerated PNG icons

Replace the "R" stroke monogram with an "EB" glyph on the same mint tile, then regenerate all PNG icons from the SVG.

**Files:**
- Modify: `eloquent-bookings/public/favicon.svg`
- Regenerate (via script): `eloquent-bookings/public/favicon-32.png`, `favicon-16.png`, `apple-touch-icon.png`, `public/icons/icon-192.png`, `public/icons/icon-512.png`

**Interfaces:**
- Consumes: `gen-icons.mjs` reads `public/favicon.svg` and writes the PNG targets (verified: `scripts/gen-icons.mjs`).
- Produces: nothing other tasks consume.

- [ ] **Step 1: Replace `favicon.svg` with the EB monogram**

Overwrite `eloquent-bookings/public/favicon.svg` with (tile/gradients identical to the original; only the monogram group and aria-label change):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="Eloquent Bookings">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00ffcc"/>
      <stop offset="0.55" stop-color="#00e6b8"/>
      <stop offset="1" stop-color="#00b894"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.25" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- tile -->
  <rect x="2" y="2" width="96" height="96" rx="26" fill="url(#tile)"/>
  <rect x="2" y="2" width="96" height="96" rx="26" fill="url(#glow)"/>
  <rect x="2.75" y="2.75" width="94.5" height="94.5" rx="25.25" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1.5"/>

  <!-- EB monogram (dark ink) -->
  <text x="50" y="54" text-anchor="middle" dominant-baseline="central"
        font-family="Arial, 'Segoe UI', system-ui, -apple-system, sans-serif"
        font-size="44" font-weight="700" letter-spacing="-2" fill="#04140f">EB</text>
</svg>
```

- [ ] **Step 2: Regenerate the PNG icons**

Run:
```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/eloquent-bookings" && npm run icons
```
Expected: prints `wrote public/favicon-32.png (32x32)` … through `icon-512.png (512x512)`, exit 0.

- [ ] **Step 3: Visually verify the 512px icon shows "EB"**

Open `eloquent-bookings/public/icons/icon-512.png` and confirm a dark "EB" sits centered on the mint tile (not a blank tile — if the glyph is missing, the build machine lacks the font; fall back to converting the text to vector paths). Confirm `favicon.svg` no longer contains the string "Rezzy".

- [ ] **Step 4: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add eloquent-bookings/public/favicon.svg eloquent-bookings/public/favicon-16.png eloquent-bookings/public/favicon-32.png eloquent-bookings/public/apple-touch-icon.png eloquent-bookings/public/icons/icon-192.png eloquent-bookings/public/icons/icon-512.png
git commit -m "feat(eloquent-bookings): EB favicon + regenerated app icons"
```

---

### Task 4: Backend customer-facing strings

Change the three customer-facing "Rezzy" strings in the shared backend, updating the one test that asserts the persona string first (TDD).

**Files:**
- Modify: `backend/app/Support/Wa/Prompts.php:27`
- Modify: `backend/tests/Unit/WaPromptsTest.php:15`
- Modify: `backend/resources/views/invoices/booking-invoice.blade.php:402`
- Modify: `backend/resources/views/reports/_layout.blade.php:83`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing other tasks consume.

- [ ] **Step 1: Update the persona test to expect the new string (failing test)**

`backend/tests/Unit/WaPromptsTest.php` line 15:
```php
        $this->assertStringContainsString('Never mention Eloquent Bookings', $prompt);
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/backend" && php artisan test --filter=WaPromptsTest
```
Expected: FAIL — asserts "Never mention Eloquent Bookings" but prompt still says "Never mention Rezzy".

- [ ] **Step 3: Update the persona prompt**

`backend/app/Support/Wa/Prompts.php` line 27:
```php
            . "- You are simply {$shopName}'s assistant. Never mention Eloquent Bookings, software, AI, or sales — and never pitch anything.";
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/backend" && php artisan test --filter=WaPromptsTest
```
Expected: PASS.

- [ ] **Step 5: Update the booking invoice footer**

`backend/resources/views/invoices/booking-invoice.blade.php` line 402:
```blade
            Generated by Eloquent Bookings · Booking {{ $booking->booking_reference }} · Invoice {{ $invoice->invoice_number }}
```

- [ ] **Step 6: Update the report footer**

`backend/resources/views/reports/_layout.blade.php` line 83:
```blade
            Generated by Eloquent Bookings · {{ now()->format('d M Y H:i') }}
```

- [ ] **Step 7: Run the full backend suite to confirm nothing else regressed**

Run:
```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/backend" && php artisan test
```
Expected: PASS (green). If an unrelated test was already failing before this task, note it but do not fix here.

- [ ] **Step 8: Commit**

```bash
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy"
git add backend/app/Support/Wa/Prompts.php backend/tests/Unit/WaPromptsTest.php backend/resources/views/invoices/booking-invoice.blade.php backend/resources/views/reports/_layout.blade.php
git commit -m "feat(backend): customer-facing brand strings Rezzy -> Eloquent Bookings"
```

---

### Task 5: Domain migration — serve at bookings.eloquentservice.com (parallel with rezzy)

Point one renamed webroot at both domains via a single nginx site + SAN cert, then deploy the built app there. Requires SSH to the droplet (key already configured, BatchMode works).

**Files:**
- Remote: `/etc/nginx/sites-available/frontend` (the customer site; symlinked into `sites-enabled/frontend`)
- Remote webroot: `/var/www/eloquent-bookings` (new)
- Local: run `eloquent-bookings/deploy.ps1`

**Interfaces:**
- Consumes: `deploy.ps1` from Task 1 (webroot `/var/www/eloquent-bookings`, verify URL `bookings.eloquentservice.com`).
- Produces: live app at both domains over HTTPS.

- [ ] **Step 1: Inspect the current nginx site so the edit is exact**

Run:
```bash
ssh -o BatchMode=yes root@64.227.153.90 "cat /etc/nginx/sites-available/frontend"
```
Note the current `server_name` (expected `rezzy.eloquentservice.com`), the `root` directive, the `/assets/` cache block, and the `location / { try_files $uri /index.html; }` SPA fallback. Confirm any `listen 443`/`ssl_certificate` lines certbot previously injected.

- [ ] **Step 2: Update `server_name` and `root` to cover both domains and the new webroot**

Edit `/etc/nginx/sites-available/frontend` on the droplet so that **every** server block (the `:80` block and, if present, the certbot `:443` block) has:
```nginx
    server_name bookings.eloquentservice.com rezzy.eloquentservice.com;
    root /var/www/eloquent-bookings;
```
Leave the `/assets/` immutable-cache block, static-file cache, gzip, and `location / { try_files $uri /index.html; }` fallback unchanged. (Edit with `sed`/`vi` over SSH, e.g. a heredoc-driven `sed -i` for the two directives — verify with a re-`cat` afterward.)

- [ ] **Step 3: Create the new webroot and do the first deploy into it**

Run locally (builds, tars, uploads, extracts to `/var/www/eloquent-bookings`, chowns):
```powershell
cd "d:/Francis/projects/2026/Eloquent/Solutions/Rezzy/eloquent-bookings"; ./deploy.ps1
```
Expected: build succeeds, upload + extract succeed. The verify `curl` near the end may still 404/blank until nginx is reloaded with the new cert (Step 5) — that's fine.

- [ ] **Step 4: Expand the TLS cert to both names**

Run:
```bash
ssh -o BatchMode=yes root@64.227.153.90 "certbot --nginx -d bookings.eloquentservice.com -d rezzy.eloquentservice.com --non-interactive --agree-tos -m francisgill1000@gmail.com --redirect --expand"
```
Expected: certbot issues/expands a SAN cert covering both names and injects/keeps the HTTP→HTTPS redirect. (`--expand` because `rezzy` already had a cert.)

- [ ] **Step 5: Test and reload nginx**

Run:
```bash
ssh -o BatchMode=yes root@64.227.153.90 "nginx -t && systemctl reload nginx"
```
Expected: `nginx -t` reports syntax OK + test successful; reload returns no output (success).

- [ ] **Step 6: Verify both domains serve the rebranded app over HTTPS**

Run:
```bash
ssh -o BatchMode=yes root@64.227.153.90 "for h in bookings.eloquentservice.com rezzy.eloquentservice.com; do echo \"== \$h ==\"; curl -sI https://\$h/ | head -1; curl -sI http://\$h/ | head -1; curl -s https://\$h/ | grep -o '<title>[^<]*</title>'; done"
```
Expected per host: HTTPS `HTTP/.. 200`, HTTP `HTTP/.. 301`, title `<title>Eloquent Bookings</title>`. Also spot-check a deep route returns 200 (SPA fallback):
```bash
ssh -o BatchMode=yes root@64.227.153.90 "curl -sI https://bookings.eloquentservice.com/shops/1 | head -1"
```
Expected: `HTTP/.. 200`.

- [ ] **Step 7: Remove the stale old webroot (optional cleanup)**

Once both domains serve from `/var/www/eloquent-bookings`, the old path is dead. Confirm nothing references it, then:
```bash
ssh -o BatchMode=yes root@64.227.153.90 "rm -rf /var/www/rezzy-customer"
```
Expected: no output. (Skip if you prefer to keep it as a rollback snapshot.)

- [ ] **Step 8: No code commit needed**

Step 1's deploy-script change was already committed in Task 1; the nginx/webroot changes live on the droplet, not in git. Nothing to commit here.

---

## Post-implementation: update memory

After Task 5 verifies green, update the `eloquent-static-spa-deploy` memory: the customer app is now `eloquent-bookings/` → `/var/www/eloquent-bookings`, served at both `bookings.eloquentservice.com` and `rezzy.eloquentservice.com` (nginx site still file-named `frontend`). This is housekeeping, not a plan task.
