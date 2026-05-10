# Rezzy Brand Theme Migration

## Goal
Migrate the Rezzy dashboard from the current dark theme to the new warm brand light theme that matches the Instagram ad creative (rose gold + deep plum + blush white).

---

## Step 1 — Add tokens to `globals.css`

Find the file `src/app/globals.css` (or wherever your global styles live) and add this inside `:root`:

```css
:root {
  --rezzy-primary:    #4A1B45;
  --rezzy-accent:     #C9A0A0;
  --rezzy-bg:         #FAF4F4;
  --rezzy-surface:    #FFFFFF;
  --rezzy-elevated:   #FFF8F8;
  --rezzy-hover:      #F5ECEC;
  --rezzy-border:     #E8DCDC;
  --rezzy-text:       #3D2C2C;
  --rezzy-muted:      #9B7E7E;
  --rezzy-success:    #1D9E75;
  --rezzy-warning:    #C97B3A;
  --rezzy-danger:     #C0392B;
  --rezzy-cta:        #25D366;
}
```

---

## Step 2 — Extend `tailwind.config.js`

Inside the `theme.extend.colors` object add:

```js
brand: {
  primary:  '#4A1B45',
  accent:   '#C9A0A0',
  bg:       '#FAF4F4',
  surface:  '#FFFFFF',
  elevated: '#FFF8F8',
  hover:    '#F5ECEC',
  border:   '#E8DCDC',
  text:     '#3D2C2C',
  muted:    '#9B7E7E',
},
```

---

## Step 3 — Global find & replace

Do these replacements across the **entire `src/` folder**. Use VS Code find & replace with "Search across files" (`Cmd+Shift+H` / `Ctrl+Shift+H`).

| Find (current dark value) | Replace with (new brand value) |
|---|---|
| `bg-[#0d141d]` | `bg-brand-bg` |
| `bg-[#151c25]` | `bg-brand-surface` |
| `bg-[#19202a]` | `bg-brand-elevated` |
| `bg-[#242a34]` | `bg-brand-hover` |
| `bg-[#080f17]` | `bg-brand-surface` |
| `bg-[#4b8eff]` | `bg-brand-primary` |
| `hover:bg-[#4b8eff]/90` | `hover:bg-brand-primary/90` |
| `text-[#4b8eff]` | `text-brand-primary` |
| `border-[#4b8eff]` | `border-brand-primary` |
| `ring-[#4b8eff]` | `ring-brand-primary` |
| `text-[#dce3f0]` | `text-brand-text` |
| `text-[#c1c6d7]` | `text-brand-text` |
| `text-[#8b90a0]` | `text-brand-muted` |
| `border-[#414755]` | `border-brand-border` |
| `#0d141d` (inline style) | `#FAF4F4` |
| `#4b8eff` (inline style, non-CTA) | `#4A1B45` |

> **Important:** Do NOT replace `#4b8eff` inside the WhatsApp CTA button — that one uses `#25D366` (already set correctly).

---

## Step 4 — Fix headings and KPI numbers

Search for all instances of `text-2xl font-black text-white` and `text-white` used on headings or numbers (not buttons). Replace `text-white` with `text-brand-primary` in those contexts.

Buttons keep `text-white` — that rule stays the same.

---

## Step 5 — Fix these 3 files manually

### `src/app/shop/dashboard/page.js`
- Page wrapper: change `bg-[#0d141d]` → `bg-brand-bg`
- KPI card background: change `bg-[#151c25]` → `bg-brand-surface border border-brand-border`
- KPI number: change `text-white` → `text-brand-primary`
- KPI watermark icon color: change `color: '#4b8eff'` → `color: '#4A1B45'`
- Label text: change `text-[#8b90a0]` → `text-brand-muted`

### Sidebar nav component (whichever file it lives in)
- Sidebar background: change dark bg → `bg-brand-primary` (deep plum)
- All nav item text: keep `text-white` (white text on plum bg has good contrast)
- Active/selected nav item: change `bg-[#4b8eff]/10` → `bg-white/20`
- Active text: keep `text-white`
- Inactive text: change to `text-white/60`
- Brand logo text: keep `text-white`

### `src/components/Shop/CreateBookingModal.jsx`
- Modal backdrop: keep `bg-black/70 backdrop-blur-sm` (unchanged)
- Modal surface: change `bg-[#151c25]` → `bg-brand-surface`
- Modal border: change `border-[#414755]/20` → `border-brand-border`
- Stepper active circle: change `bg-[#4b8eff]` → `bg-brand-primary`
- Stepper done circle: change to `bg-brand-primary/20 text-brand-primary border-brand-primary/40`
- Input background: change `bg-[#080f17]` → `bg-brand-bg`
- Input border: change `border-[#414755]/40` → `border-brand-border`
- Input text: change `text-white` → `text-brand-text`
- Input placeholder: change `placeholder:text-[#8b90a0]` → `placeholder:text-brand-muted`
- Input focus ring: change `focus:ring-[#4b8eff]/20 focus:border-[#4b8eff]/40` → `focus:ring-brand-primary/20 focus:border-brand-primary/40`

---

## Step 6 — Status badges (keep semantic meaning, update colors)

| Status | Old style | New style |
|---|---|---|
| Booked/Upcoming | `bg-[#4b8eff]/10 border-[#4b8eff]/20 text-[#4b8eff]` | `bg-brand-primary/10 border-brand-primary/20 text-brand-primary` |
| Completed | `bg-[#4edea3]/10 border-[#4edea3]/20 text-[#4edea3]` | `bg-[#1D9E75]/10 border-[#1D9E75]/20 text-[#1D9E75]` |
| Cancelled | keep muted style | `bg-brand-border text-brand-muted` |

---

## Step 7 — Selection components (date chips, time slots, service cards)

For all selected/active states, replace:
- `bg-[#4b8eff]` → `bg-brand-primary`
- `border-[#4b8eff]` → `border-brand-primary`
- `bg-[#4b8eff]/10 border-[#4b8eff]/50` → `bg-brand-primary/10 border-brand-primary/50`

For unselected/default states:
- `bg-[#080f17]` → `bg-brand-bg`
- `border-[#414755]/30` → `border-brand-border`

---

## What stays UNCHANGED — do not touch

- Font family: Manrope (keep as is)
- Font weights: 400, 500, 600, 700, 800, font-black (keep as is)
- Border radius scale: rounded-lg, rounded-xl, rounded-2xl, rounded-full (keep as is)
- Spacing and padding values (keep as is)
- Modal structure and layout (keep as is)
- Animation rules — `transition-all` (keep as is)
- Icon library — Material Symbols Outlined (keep as is)
- `.no-scrollbar` utility (keep as is)
- `.glass-card` — customer-facing pages (keep as is, separate theme)
- Yellow `#facc15` star ratings (keep as is)
- WhatsApp CTA `#25D366` (keep as is)

---

## Prompt to paste into Claude Code (VS Code)

Copy and paste this prompt directly into Claude Code:

```
I need to migrate the Rezzy dashboard from a dark theme to a warm brand light theme. 
I have attached the migration instructions in rezzy-theme-migration.md. 

Please follow the steps in order:
1. Add CSS tokens to globals.css
2. Extend tailwind.config.js with brand colors
3. Do the global find & replace across src/ as listed in the table
4. Manually fix dashboard/page.js, the sidebar nav component, and CreateBookingModal.jsx
5. Update status badges and selection components

Do not change fonts, spacing, radii, modal structure, animations, or the customer-facing glass theme.
Do not touch the WhatsApp CTA green #25D366 or the star rating yellow #facc15.

After each file is changed, confirm what was updated.
```

---

## Color reference card

| Token | Hex | Used for |
|---|---|---|
| `--rezzy-primary` | `#4A1B45` | Sidebar bg, all buttons, headings, active states |
| `--rezzy-accent` | `#C9A0A0` | Rose gold highlights, active nav item |
| `--rezzy-bg` | `#FAF4F4` | Page background, inputs |
| `--rezzy-surface` | `#FFFFFF` | Cards, modals |
| `--rezzy-elevated` | `#FFF8F8` | Hover cards, secondary buttons |
| `--rezzy-hover` | `#F5ECEC` | Card hover state |
| `--rezzy-border` | `#E8DCDC` | All borders and dividers |
| `--rezzy-text` | `#3D2C2C` | Body text, input text |
| `--rezzy-muted` | `#9B7E7E` | Labels, captions, placeholders |
| `--rezzy-success` | `#1D9E75` | Completed status |
| `--rezzy-warning` | `#C97B3A` | Pending/upcoming status |
| `--rezzy-danger` | `#C0392B` | Cancelled, destructive actions |
| `--rezzy-cta` | `#25D366` | WhatsApp CTA button only |