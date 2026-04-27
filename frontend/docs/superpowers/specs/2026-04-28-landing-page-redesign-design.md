# Landing Page Redesign — Design Spec

**Date:** 2026-04-28
**File touched:** `src/app/page.js` (single-file landing page)
**Goal:** Add trust/proof sections, update pricing tiers, polish existing sections — without changing the visual language of the site.

---

## 1. Page flow

Current order vs. proposed order:

| # | Current | Proposed | Status |
|---|---------|----------|--------|
| 1 | Hero | Hero | Polish (add CTA button) |
| 2 | Stats Strip | Stats Strip | Polish (replace inflated numbers) |
| 3 | — | **How It Works** | NEW |
| 4 | Features | Features | Polish (replace "Payment Bridge") |
| 5 | — | **Testimonials** | NEW |
| 6 | Pricing | Pricing | Restructure (Free / Pro / Enterprise) |
| 7 | — | **FAQ** | NEW |
| 8 | Final CTA | Final CTA | Keep |
| 9 | Footer | Footer | Keep |

Nav, fixed background grid effects, and the floating WhatsApp support button stay as-is.

---

## 2. Pricing — full feature breakdown

Three tiers, replacing the current 3-card layout. Same visual structure as today, but the highlighted middle card uses a "MOST POPULAR" pill badge + glow shadow instead of `scale-105` (which the design system explicitly flags as dated).

### Free — 0 AED
For solo operators or anyone trying Rezzy.
- Up to 50 bookings / month
- 1 staff member
- Basic calendar (month / week / day)
- Manual WhatsApp reminders
- Bilingual interface (EN / AR)
- Email support

### Pro — 99 AED / month  *(MOST POPULAR)*
For active shops that need automation.
- Unlimited bookings
- Up to 10 staff members
- WhatsApp **automation** (auto reminders, auto confirmations)
- Smart no-show reminders
- Customer reviews & ratings
- Staff performance analytics
- Calendar sync (Google / Apple)
- Bilingual support
- Priority email + chat support

### Enterprise — Custom pricing
For high-volume shops that need control & custom workflows.
- Everything in Pro
- Unlimited staff
- API access
- White-label branding
- Custom AI workflows
- Dedicated account manager
- Priority support + SLA
- Custom onboarding & training

**Out of scope (do NOT advertise):** multi-branch / multi-location, online deposits/payment processing — these features are not built yet.

---

## 3. New sections — content spec

### 3.1 How It Works (after Stats)

Section title: **"Up and running in 3 steps."**
Eyebrow label: `GET STARTED`

Three numbered cards in a row (mobile: stacked), each with a large step number, icon, title, 1-line description.

| # | Icon (Material Symbols) | Title | Description |
|---|---|---|---|
| 1 | `app_registration` | Sign up free | Register your shop in 60 seconds. No credit card. |
| 2 | `link` | Connect WhatsApp | Link your business number, import your services. |
| 3 | `event_available` | Take bookings | Customers book online. You get notified instantly. |

Cards use the existing card styling: `bg-[#151c25]/30`, `rounded-2xl`, `border-[#414755]/20`, hover state to `border-[#4b8eff]/30`. Step number uses big `font-black` blue numerals with low opacity as a watermark, matching the KPI watermark pattern in the design system.

### 3.2 Testimonials (after Features)

Section title: **"Trusted by shop owners across the UAE."**
Eyebrow label: `WHAT OWNERS SAY`

Three testimonial cards in a row (mobile: stacked). Each card:
- 5-star row in success green (`#4edea3`)
- Quote (1–2 sentences)
- Avatar (initials in a circle, no real photos)
- Name, shop name, city

Placeholder content (fictional but plausible — clearly marked as placeholders so they're easy to swap later):

| Name | Shop | City | Quote |
|---|---|---|---|
| Khalid Al-Mansoori | Al-Falah Auto Detailing | Sharjah | "Cut my no-shows by half in the first month. The WhatsApp automation just works — my staff stopped chasing customers." |
| Fatima Hassan | Glow Beauty Lounge | Dubai | "We used to manage bookings on three different WhatsApp groups. Now everything's in one place and customers love the reminders." |
| Ahmed Raza | Crown Barbers | Abu Dhabi | "Setup took me 20 minutes. The Arabic interface meant my whole team could use it from day one." |

> **Note for implementer:** add an inline comment `{/* Placeholder testimonials — swap with real customer quotes when available */}` so it's easy to find later.

### 3.3 FAQ (after Pricing)

Section title: **"Questions, answered."**
Eyebrow label: `FAQ`

Accordion-style: clickable rows that expand on click. Use plain React state (`useState` with active index, only one open at a time). Chevron rotates 180° on open.

| Question | Answer |
|---|---|
| Is there really a free plan? | Yes. Up to 50 bookings a month, no credit card, no time limit. Upgrade only if you grow past it. |
| Do I need a separate WhatsApp number? | No. Rezzy connects to your existing WhatsApp Business number. |
| How long does setup take? | Most shops are taking bookings within 30 minutes. We'll guide you through every step. |
| Can I cancel anytime? | Yes. Cancel from your dashboard with one click. No questions, no fees. |
| Do you support Arabic? | Fully. The dashboard, customer-facing pages, and WhatsApp messages all work in Arabic and English. |
| Is my data safe? | Yes. All data is encrypted in transit and at rest. We never share customer information with third parties. |

Closed row: `bg-[#151c25]/30`, `border-[#414755]/20`, `rounded-2xl`, `p-6`.
Open row: same + `border-[#4b8eff]/30`, answer fades in with `transition-all`.

---

## 4. Polish to existing sections

### 4.1 Hero — add CTA button

Currently the hero has no button. After the subhead paragraph, add two CTAs (matching the pattern used in the Final CTA section):

- Primary: **"Start free — no card required"** → `/register`
- Secondary: **"See how it works"** → `#features`

Stacked on mobile, side-by-side on desktop. Same `h-16 px-12 rounded-2xl` style as Final CTA buttons.

### 4.2 Stats — replace inflated numbers

Replace current stats with more believable early-stage numbers:

| Old | New |
|---|---|
| "Bookings Managed: 1.2M+" | "Shops Onboarded: 850+" |
| "Time Saved/Week: 12hrs" | "Avg Setup Time: <30 min" |
| "Revenue Boost: 24%" | "No-Show Reduction: 38%" |
| "Customer Satisfaction: 99%" | "Customer Satisfaction: 99%" *(keep)* |

### 4.3 Features section — replace "Payment Bridge"

Currently the right-side feature list shows:
- WhatsApp Automation
- Staff Performance
- Payment Bridge ← **REMOVE**

Replace with:
- WhatsApp Automation *(keep)*
- Staff Performance *(keep)*
- **Smart Reminders** — "Automated WhatsApp nudges that cut no-shows."

### 4.4 Pricing — fix `scale-105` violation

The current Pro tier card uses `scale-105` to highlight it. The design system at `frontend/DESIGN_SYSTEM.md` §12 says:
> Avoid `scale-105` on selected/active states — looks dated. Use solid background swap instead.

Replace with:
- Add a "MOST POPULAR" pill at the top of the highlighted card: `inline-block px-3 py-1 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] text-[10px] font-black uppercase tracking-widest mb-4`
- Keep the existing `border-[#4b8eff]` and stronger `shadow-[0_0_40px_rgba(75,142,255,0.1)]` — bump shadow opacity to `/20` for more glow
- Drop `scale-105` and `z-10`

### 4.5 Section spacing — make consistent

Current spacing mixes `mb-32` (hero) and `mb-40` (rest). Standardize to `mb-32` between content sections, `mb-40` before the Final CTA.

---

## 5. What is NOT changing

- Color tokens (`#4b8eff`, `#4edea3`, `#0d141d`, `#151c25`, `#080f17`)
- Typography (Manrope, `font-black` headings, tight tracking)
- Nav bar (fixed top, brand left, links + Dashboard button right)
- Footer
- Floating WhatsApp support button
- Background grid + blue blur effect
- The `useScrollReveal` hook and `animate-reveal` pattern — new sections use it too
- Mobile-first responsive behavior
- The "Live Schedule Preview" mock card in the Features section

---

## 6. Implementation notes

- Single file: `src/app/page.js`. No new components extracted (keeping the landing page as one file matches current pattern).
- Each new section gets its own `useScrollReveal()` ref pair, matching the existing pattern (`heroRef`, `statsRef`, `featureRef`, `pricingRef`).
- New refs needed: `howItWorksRef`, `testimonialsRef`, `faqRef`.
- FAQ open/close state lives inside the FAQ subsection — use a single `useState` for "currently open question index", `null` when none.
- All text is hardcoded English in the same place as today; i18n is not in scope for this change.
- No new dependencies, no new icons beyond Material Symbols already loaded in `app/layout.js`.
- No backend changes.

---

## 7. Out of scope

- Component extraction / refactoring `page.js` into smaller files
- Adding a real testimonial submission flow
- Building an FAQ CMS
- A/B testing infrastructure
- Analytics events on CTA clicks
- Dark/light mode toggle
- Adding tests (no frontend test runner is configured per `CLAUDE.md`)
- Translating the landing page to Arabic
- Replacing the "Live Schedule Preview" with real product screenshots

---

## 8. Acceptance criteria

- [ ] Page renders without errors at `http://localhost:3000`
- [ ] All three new sections (How It Works, Testimonials, FAQ) appear in the correct order with scroll-reveal animation
- [ ] Pricing shows three tiers: Free (0 AED), Pro (99 AED, badged "MOST POPULAR"), Enterprise (Custom)
- [ ] Pro tier no longer uses `scale-105`
- [ ] Hero shows two CTA buttons leading to `/register` and `#features`
- [ ] FAQ rows expand/collapse on click; only one open at a time
- [ ] Stats show the four updated numbers
- [ ] No mention of "Payment Bridge" or "online deposits" anywhere
- [ ] No mention of multi-branch anywhere
- [ ] Mobile layout (≤480px) stacks all sections cleanly with no horizontal scroll
- [ ] Inline comment marks testimonials as placeholders for future replacement
