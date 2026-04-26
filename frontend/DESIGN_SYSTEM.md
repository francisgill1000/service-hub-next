# Rezzy Design System

A single reference for colors, typography, spacing, and component patterns used across the Rezzy frontend. Use this when building new screens or reviewing existing ones for consistency.

---

## 1. Color Tokens

### Brand & accent

| Token | Hex | Usage |
|---|---|---|
| Primary | `#4b8eff` | All primary buttons, active/selected state, focus rings, links, brand accents |
| Success | `#4edea3` | Completed bookings, "Open Now" status, positive numbers, final-step CTAs |
| Warning | `#ffb690` | Upcoming/pending state, scheduling indicators |
| Danger | `#f87171` | Cancelled state, destructive actions |
| Yellow | `#facc15` | Star ratings only |

> **Do not use**: `#adc6ff` (legacy lavender) or any `from-[#4b8eff] to-[#adc6ff]` gradients. Solid `#4b8eff` is the standard.

### Surfaces (dark theme — shop side)

| Token | Hex | Usage |
|---|---|---|
| Page background | `#0d141d` | Body bg on shop pages |
| Card | `#151c25` | KPI cards, modals, panels |
| Card elevated | `#19202a` | Hover state, header gradients, input affordances |
| Card hover | `#242a34` | Hover for elevated cards |
| Input/well | `#080f17` | Form inputs, the deepest surface |
| Border | `#414755` | Always with opacity: `/20`, `/30`, `/40`. Never solid. |

### Text

| Token | Hex | Usage |
|---|---|---|
| White | `#ffffff` | All button text, headings, primary content |
| Body | `#dce3f0` | Long-form text, table cells |
| Subtle | `#c1c6d7` | Secondary content |
| Muted | `#8b90a0` | Labels, captions, placeholders, deselected states |

### Customer (glass) theme

Customer-facing pages use a `.glass-card` utility (defined in `globals.css`) over a deep navy background. Components:
- `bg-card-dark` — translucent surface
- `bg-navy-deep` / `text-navy-muted` — for page bg + secondary text
- `text-primary` — same `#4b8eff` token, exposed via Tailwind config

---

## 2. Typography

- **Family**: Manrope (loaded in `app/layout.js`).
- **Weights used**: 400, 500, 600, 700, 800, plus `font-black` for emphasis.
- **Section headings**: `text-2xl font-black tracking-tight text-white`
- **Card titles**: `text-sm font-black text-white`
- **Field labels**: `text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]`
- **Body**: `text-sm font-semibold`
- **Meta / captions**: `text-[11px] font-semibold text-[#8b90a0]`
- **Button text**: `text-sm font-black` (primary) or `text-xs font-black uppercase tracking-widest` (compact)

Numbers and KPI values are typeset bigger and bolder: `text-2xl font-black`.

---

## 3. Buttons

### Rules

1. **Text is always white.** Never `text-[#0d141d]` or `text-[#002e69]` on a colored button.
2. **No icons inside text buttons.** Icons are reserved for icon-only buttons (close X, add/check toggles, sidebar nav).
3. **No gradients.** Solid backgrounds with a `/90` hover state.
4. Heights: `h-9` (compact), `h-11` (default), `h-12`/`h-14` (full-width hero CTAs).
5. Always `rounded-xl` (sometimes `rounded-2xl` for hero CTAs).

### Variants

```jsx
// Primary
<button className="h-11 px-5 rounded-xl bg-[#4b8eff] hover:bg-[#4b8eff]/90 text-white font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
  Continue
</button>

// Success / final confirm
<button className="h-11 px-5 rounded-xl bg-[#4edea3] hover:bg-[#4edea3]/90 text-white font-black text-sm transition-all">
  Create booking
</button>

// Secondary / cancel
<button className="h-11 px-4 rounded-xl bg-[#19202a] hover:bg-[#242a34] text-white font-bold text-sm transition-all">
  Cancel
</button>

// Destructive
<button className="h-11 px-5 rounded-xl bg-[#f87171] hover:bg-[#f87171]/90 text-white font-black text-sm transition-all">
  Mark Cancelled
</button>

// Compact pill (e.g. "New booking" header action)
<button className="h-9 px-3 rounded-xl bg-[#4b8eff] hover:bg-[#4b8eff]/90 text-white text-[11px] font-black inline-flex items-center transition-all">
  New booking
</button>
```

### Icon-only buttons (allowed)

```jsx
// Close X (modal header)
<button className="size-9 rounded-xl bg-[#19202a] hover:bg-[#242a34] text-[#8b90a0] hover:text-white flex items-center justify-center transition-all">
  <span className="material-symbols-outlined text-[20px]">close</span>
</button>

// Add / check toggle (selectable item)
<div className={`size-9 rounded-xl flex items-center justify-center ${active ? 'bg-[#4b8eff] text-white' : 'bg-[#19202a] text-[#8b90a0] border border-[#414755]/30'}`}>
  <span className="material-symbols-outlined text-[18px]">{active ? 'check' : 'add'}</span>
</div>
```

---

## 4. Inputs

```jsx
<div className="relative">
  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none">
    person
  </span>
  <input
    type="text"
    placeholder="Full name"
    className="w-full h-12 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-4 text-sm font-semibold text-white placeholder:text-[#8b90a0] focus:ring-2 focus:ring-[#4b8eff]/20 focus:border-[#4b8eff]/40 outline-none transition-all"
  />
</div>
```

- Heights: `h-11` (compact) or `h-12` (form fields)
- Background: `bg-[#080f17]` — the deepest surface
- Always include `outline-none` and a focus ring scoped to the brand color

Field label above the input:

```jsx
<label className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">
  Customer name
</label>
```

---

## 5. Cards & surfaces

```jsx
// Standard panel
<div className="bg-[#151c25] rounded-xl p-5 border border-[#414755]/20">
  ...
</div>

// KPI card with watermark icon
<div className="bg-[#151c25] rounded-xl p-6 relative overflow-hidden border border-[#414755]/20">
  <div className="absolute -right-4 -bottom-4 opacity-[0.07] pointer-events-none select-none">
    <span style={{ fontFamily: "'Material Symbols Outlined'", fontSize: '100px', color: '#4b8eff' }}>
      payments
    </span>
  </div>
  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">Total Revenue</p>
  <p className="text-2xl font-black text-white mt-4">AED 2,090</p>
</div>
```

---

## 6. Modals

- **Backdrop**: `fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm`
- **Mobile**: bottom sheet — `items-end`, `rounded-t-2xl`
- **Desktop**: centered — `md:items-center`, `md:rounded-2xl`, `md:w-[640px]`
- **Max height**: `max-h-[95vh] md:max-h-[90vh]`
- **Layout**: header (sticky) + scrollable body + footer (sticky) using `flex flex-col`

### Multi-step modal

Use a stepper in the header with numbered circles connected by hairlines. States:

- Active: `bg-[#4b8eff] text-white`
- Done: `bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40` with check icon
- Pending: `bg-[#19202a] text-[#8b90a0] border border-[#414755]/40`

Footer auto-switches: **Cancel | Continue** → **Back | Continue** → **Back | Confirm**. Total amount lives bottom-left, action buttons bottom-right. See `CreateBookingModal.jsx` as the canonical example.

---

## 7. Selection patterns

### Service / option card

```jsx
<button className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all ${
  active
    ? 'bg-[#4b8eff]/10 border-[#4b8eff]/50'
    : 'bg-[#080f17] border-[#414755]/30 hover:border-[#414755]/60'
}`}>
  <img className="w-14 h-14 rounded-xl object-cover" src={image} />
  <div className="flex-1 min-w-0">
    <p className="text-sm font-black text-white truncate">{title}</p>
    <p className="text-[11px] text-[#8b90a0] truncate">{description}</p>
    <p className="text-sm font-black text-[#4edea3] mt-1">AED {price}</p>
  </div>
  <div className={`size-9 rounded-xl flex items-center justify-center ${
    active ? 'bg-[#4b8eff] text-white' : 'bg-[#19202a] text-[#8b90a0] border border-[#414755]/30'
  }`}>
    <span className="material-symbols-outlined text-[18px]">{active ? 'check' : 'add'}</span>
  </div>
</button>
```

### Date chip (horizontal scroll)

```jsx
<button className={`shrink-0 w-[72px] py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
  active
    ? 'bg-[#4b8eff] border-[#4b8eff] text-white'
    : 'bg-[#080f17] border-[#414755]/30 text-[#dce3f0] hover:border-[#4b8eff]/40'
}`}>
  <span className="text-[10px] font-black uppercase tracking-widest">Sun</span>
  <span className="text-xl font-black leading-none">26</span>
</button>
```

### Time slot

```jsx
<button className={`h-11 rounded-xl border text-xs font-black transition-all ${
  active
    ? 'bg-[#4b8eff] border-[#4b8eff] text-white'
    : 'bg-[#080f17] border-[#414755]/30 text-[#dce3f0] hover:border-[#4b8eff]/40 hover:text-[#4b8eff]'
}`}>
  17:30
</button>
```

Mobile: horizontal scroll. Desktop: 3- or 4-column grid.

---

## 8. Status indicators

| Status | Color | Pill style |
|---|---|---|
| Booked / Upcoming | `#4b8eff` | `bg-[#4b8eff]/10 border-[#4b8eff]/20 text-[#4b8eff]` |
| Completed | `#4edea3` | `bg-[#4edea3]/10 border-[#4edea3]/20 text-[#4edea3]` |
| Cancelled | `#f87171` | `bg-[#414755]/30 text-[#8b90a0]` (muted) or red variant |
| Open shop | `#4edea3` | with pulsing dot |
| Closed shop | `#8b90a0` | static dot |

---

## 9. Layout

### Shop pages (admin)

```jsx
<div className="min-h-screen bg-[#0d141d] text-[#dce3f0]">
  <div className="w-full px-6 pt-8 pb-10 space-y-6">
    {/* page heading */}
    {/* KPI grid: grid-cols-2 lg:grid-cols-3 */}
    {/* main content: lg:grid-cols-3 with col-span-2 + col-span-1 */}
  </div>
</div>
```

### Customer pages (responsive — mobile-first → web layout)

- **Mobile**: vertical scroll with sticky bottom action bar.
- **Desktop**: `md:max-w-7xl md:mx-auto md:px-8`, two-column grid (`md:grid md:grid-cols-12 md:gap-8`), services on left (col-span 7 / lg col-span 8), schedule + summary sidebar on right (col-span 5 / lg col-span 4) with `md:sticky md:top-6`.
- The mobile sticky bottom bar gets `md:hidden`; on desktop a checkout summary card replaces it inside the right column.

### Navigation

- **Customer**: `BottomNav` for mobile (`md:hidden`), `GuestHeader` for desktop (full-width sticky navbar with brand left, links center, account right).
- **Shop**: sidebar with icon + label (mobile becomes drawer/header). Shop's `Header` is `md:hidden`.

---

## 10. Iconography

- **Library**: Google Material Symbols Outlined (loaded in `app/layout.js`)
- **Sizes**: `text-[16px]`, `text-[18px]`, `text-[20px]`. KPI watermarks at `100px`.
- **Where to use**: input prefixes, icon-only buttons, empty states, info-card badges, sidebar nav.
- **Where NOT to use**: inside any text-bearing button.

---

## 11. Spacing & radii

- **Page padding**: `px-4` (mobile) → `md:px-6` or `md:px-8` (desktop)
- **Card padding**: `p-5` standard, `p-6` for KPI, `p-4` for compact rows
- **Gap between cards**: `gap-4` to `gap-6`
- **Radius scale**: `rounded-lg` (chips), `rounded-xl` (buttons / inputs / standard cards), `rounded-2xl` (modals, hero cards), `rounded-full` (avatars, pills)

---

## 12. Animation

- Universal transition: `transition-all` with default Tailwind duration (`150ms`).
- Scroll containers hide their scrollbar via the `.no-scrollbar` utility (defined in `globals.css`).
- Avoid `scale-105` on selected/active states — looks dated. Use solid background swap instead.

---

## 13. Reference implementations

When in doubt, copy from these:

- **Multi-step modal**: `src/components/Shop/CreateBookingModal.jsx`
- **KPI dashboard grid**: `src/app/shop/dashboard/page.js`
- **Responsive customer page (mobile + desktop)**: `src/app/detail/page.js`
- **Form page with image uploads + sidebar**: `src/app/shop/profile/page.js`
- **Web-style top nav**: `src/components/GuestHeader.jsx`
