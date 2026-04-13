# Service Hub — Style Guide

Use this as the reference when designing in Stitch or implementing new screens.

---

## Typography

| Token | Value |
|---|---|
| Font family | **Manrope** (Google Fonts) |
| Base weight | 400 |
| Label / caption | `text-[10px] font-bold uppercase tracking-wider` |
| Body small | `text-xs font-medium` |
| Body | `text-sm font-semibold` |
| Sub-heading | `text-base font-bold` |
| Heading | `text-lg font-bold` |
| Large heading | `text-xl font-bold` |
| Stat / display | `text-3xl font-extrabold leading-tight` |

---

## Color Palette

### Dark theme (guest / customer screens)

| Name | Hex | Usage |
|---|---|---|
| `brand-dark` | `#0B121B` | App background |
| `card-dark` | `#16202A` | Card background |
| `navy-bg` | `#0B121E` | Alternate page background |
| `navy-card` | `#151F2D` | Alternate card background |
| `navy-border` | `#1E293B` | Border on dark cards |
| `surface-dark` | `#161B22` | Elevated surface |
| `border-dark` | `#232931` | Subtle border |
| `muted-text` | `#94a3b8` | Secondary / placeholder text |
| `navy-muted` | `#64748b` | Tertiary text |

### Light/dark theme (shop dashboard)

| Name | Hex (light) | Tailwind dark override | Usage |
|---|---|---|---|
| Page bg | `#f5f6f8` | `dark:bg-[#101622]` | Dashboard background |
| Card bg | `white` | `dark:bg-[#1c2331]` | Stat cards, booking rows |
| Card border | `border-slate-100` | `dark:border-slate-800` | Card borders |
| Sidebar bg | `#f5f6f8` | `dark:bg-[#101622]` | Sidebar panel |
| Sidebar border | `border-slate-200` | `dark:border-slate-800` | Sidebar divider |

### Brand / accent colors

| Token | Value | Usage |
|---|---|---|
| `primary` | `#007AFF` | CTAs, active nav, links, icons |
| Primary tint | `bg-blue-600/15` | Icon backgrounds |
| Primary badge | `bg-blue-600/20 text-blue-600` | Status chips |
| Success | `text-emerald-500` | Revenue trends, positive states |
| Open | `text-green-500` | Shop open indicator |
| Closed | `text-orange-500` | Shop closed indicator |
| Destructive | `hover:text-red-600 hover:bg-red-50` | Logout, delete |

---

## Spacing & Layout

| Use | Classes |
|---|---|
| Page horizontal padding | `px-4` |
| Page bottom padding (mobile, BottomNav) | `pb-28` |
| Page bottom padding (desktop) | `pb-8` |
| Card padding | `p-4` or `p-5` |
| Section gap | `gap-3` or `gap-4` |
| Inline icon + label | `flex items-center gap-3` |

### Layout widths

| Breakpoint | Content max-width |
|---|---|
| Mobile (default) | `max-w-[480px]` or `max-w-md` (448 px) |
| Desktop dashboard / lists | `md:max-w-5xl` (1024 px) |
| Desktop forms / profile | `md:max-w-3xl` (768 px) |
| Desktop sidebar | `w-64` (256 px fixed) |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-lg` | 8 px | Small chips, date badges |
| `rounded-xl` | 12 px | Cards, buttons, input fields |
| `rounded-2xl` | 16 px | Search bar, large cards |
| `rounded-full` | 9999 px | Pills, avatars, nav indicator |
| `rounded-t-[32px]` | 32 px top | Bottom nav sheet |

---

## Shadows & Elevation

| Class | Usage |
|---|---|
| `shadow-sm` | Cards in dashboard |
| `shadow-lg` | CTAs, floating elements |
| `shadow-lg shadow-primary/20` | Primary action buttons |
| `shadow-primary/40` | Active nav indicator bubble |
| `glass-card` | `bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl` — dark glass surfaces |

---

## Components

### Primary button
```
bg-primary px-5 py-2 rounded-full text-xs font-bold uppercase shadow-lg shadow-primary/20
```

### Ghost / outline button (pagination)
```
px-4 py-2 rounded-lg bg-primary/20 text-primary font-semibold hover:bg-primary/30 transition-all
disabled:opacity-50 disabled:cursor-not-allowed
```

### Card (shop dashboard)
```
rounded-xl p-4 bg-white dark:bg-[#1c2331] border border-slate-100 dark:border-slate-800 shadow-sm
```

### Card (dark / guest screens)
```
rounded-2xl bg-card-dark p-4 border border-white/5 shadow-lg
```

### Input field
```
w-full h-14 bg-card-dark border border-white/5 rounded-2xl pl-12 pr-4 text-white
placeholder:text-muted-text focus:ring-2 focus:ring-primary focus:border-transparent
transition-all outline-none
```

### Status chip
```
px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
/* Booked    */ bg-blue-500/10 text-blue-500 border border-blue-500/20
/* Completed */ bg-green-500/10 text-green-500 border border-green-500/20
/* Cancelled */ bg-gray-500/10 text-gray-500 border border-gray-500/20
```

### Sidebar nav item
```
/* Default  */ flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
               text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900
/* Active   */ bg-blue-600/15 text-blue-600
```

### Avatar / logo circle
```
size-10 rounded-full border-2 border-blue-600/30 bg-slate-300 bg-cover bg-center
```

---

## Icons

- Library: **Material Symbols Outlined** (Google Fonts)
- Usage: `<span className="material-symbols-outlined">{icon_name}</span>`
- Filled active state: add `[font-variation-settings:'FILL'_1]` or `.fill-icon` class
- Scales with parent `font-size` via the global `material-symbols-outlined` CSS rule

Common icon names used in navigation:
`dashboard`, `inventory_2`, `calendar_today`, `schedule`, `person`, `logout`,
`explore`, `home`, `favorite`, `near_me`, `search`, `chevron_left`, `chevron_right`

---

## Motion

All interactive elements use:
```
transition-all duration-300
active:scale-[0.98]   /* tap feedback on cards */
active:scale-95       /* tap feedback on icon buttons */
```

The BottomNav active indicator uses Framer Motion `layoutId="nav-indicator"` with:
```
{ type: "spring", stiffness: 380, damping: 30 }
```

---

## Breakpoints (Tailwind defaults)

| Prefix | Min-width | Usage in this app |
|---|---|---|
| *(default)* | 0 | Mobile layout, BottomNav, mobile max-widths |
| `md:` | 768 px | Sidebar appears, BottomNav/Header hidden on shop routes |
| `lg:` | 1024 px | Content reaches `max-w-5xl` comfortably |

---

## Dark Mode

- Enabled via the `.dark` class on `<html>` (always dark by default)
- Custom variant: `@custom-variant dark (&:is(.dark *))`
- Shop dashboard uses both light and dark overrides (`bg-white dark:bg-[#1c2331]`)
- Guest/customer screens are dark-only (`bg-brand-dark`, `bg-card-dark`)
