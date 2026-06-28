---
name: project-design-system
description: Baby pink design system established for Maisie's personal planner PWA — token names, palette, and conventions to follow when editing UI files
metadata:
  type: project
---

Baby pink theme established June 2026. PRODUCT.md written at project root.

**Tailwind v4 custom tokens** (defined in `src/app/globals.css` `@theme` block):
- `bg-brand` / `text-brand` / `border-brand` — primary interactive pink `oklch(0.660 0.207 355)` ≈ pink-500/600
- `bg-brand-dark` / `hover:bg-brand-dark` — pressed/hover state `oklch(0.560 0.210 355)`
- `bg-brand-light` — soft pink bg `oklch(0.942 0.045 355)`
- `bg-brand-faint` — barely-pink page wash `oklch(0.977 0.010 355)` (replaces `bg-gray-50`)

**Key conventions:**
- Page wrappers: `min-h-screen` (no bg class — inherits `bg-brand-faint` from body in layout.tsx)
- Card borders: `border-pink-100` (replaces `border-gray-100`)
- Input borders: `border-pink-200` with `focus:ring-brand`
- Primary buttons: `bg-brand text-white hover:bg-brand-dark`
- Secondary/back buttons: `border-pink-200 text-pink-700 hover:bg-pink-50`
- Section labels: `text-xs font-semibold text-pink-400 uppercase tracking-widest`
- Spinners: `border-pink-100 border-t-pink-500`
- Drag handles (sheets): `bg-pink-200`
- Active nav labels: `text-pink-600`; active nav SVG stroke: `#db2777`
- FAB button: `bg-brand shadow-pink-200`
- Nudge banner: `bg-pink-50 border-pink-200 text-pink-700`
- Notes/aside bg: `bg-pink-50` with `text-pink-800` (not gray on pink bg — hook will flag it)

**Absolute ban fixed:** `border-l-4` side-stripe removed from EntryCard; replaced with `CATEGORY_DOT` colored dot.

**Why:** Maisie said baby pink is her favourite colour. Register: product (design serves the planner, not vice versa).
