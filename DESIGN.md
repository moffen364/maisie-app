---
name: Maisie's Planner
description: A pocket-diary-soft personal weekly planner — pink-and-white, rounded, one accent color, no corporate edges.
colors:
  brand-faint: "oklch(0.977 0.010 355)"
  brand-light: "oklch(0.942 0.045 355)"
  brand: "oklch(0.660 0.207 355)"
  brand-dark: "oklch(0.560 0.210 355)"
  brand-nav-active: "#db2777"
  ink: "oklch(0.19 0.01 355)"
  neutral-white: "#ffffff"
  neutral-100: "#f3f4f6"
  neutral-200: "#e5e7eb"
  neutral-300: "#d1d5db"
  neutral-400: "#9ca3af"
  neutral-500: "#6b7280"
  neutral-700: "#374151"
  neutral-900: "#111827"
  category-exercise: "#22c55e"
  category-food: "#fbbf24"
  category-social: "#ec4899"
  category-event: "#a855f7"
  category-task: "#3b82f6"
  semantic-success: "#16a34a"
  semantic-warning: "#f59e0b"
  semantic-danger: "#ef4444"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.neutral-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.brand-dark}"
  button-secondary:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.neutral-700}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.neutral-white}"
    rounded: "{rounded.lg}"
    padding: "16px"
  fab:
    backgroundColor: "{colors.brand}"
    rounded: "{rounded.full}"
    height: "56px"
    width: "56px"
  chip-active:
    backgroundColor: "{colors.brand-light}"
    textColor: "{colors.brand-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
  chip-inactive:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.neutral-500}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
---

# Design System: Maisie's Planner

## 1. Overview

**Creative North Star: "The Pocket Diary"**

This is a personal notebook that happens to run on a phone, not a productivity tool that happens to be pink. Every surface — the week view, the plan flow, the finance ledger — is built from the same small vocabulary of white cards on a barely-pink page, rounded corners, quiet pink borders, and one accent color that shows up only where something needs a tap. The app is meant to disappear into a Sunday-night or a Tuesday-morning glance: fast to scan, fast to add to, never demanding attention it hasn't earned.

It explicitly rejects the aesthetics of corporate productivity software — no Linear-style stark dark mode, no Notion-dense information hierarchy, no Jira-grade chrome. It also rejects fintech-dashboard energy even on the Finance tab: no hero metric cards with gradient accents, no data-dense grids. And it isn't performing "AI product" either — no gradient text, no glassmorphism, nothing trying to look impressive to anyone but Maisie.

**Key Characteristics:**
- One accent color (Petal Pink) carrying interactivity and nothing else — never used as page-filling decoration
- White cards, barely-pink page wash, pale pink borders instead of shadows to separate surfaces
- Rounded everywhere: 12px on interactive rows/buttons, 16px on cards/sheets, full pills on chips
- A single sans (Geist) at a tight, fixed rem scale — no display font, no fluid clamp() sizing
- Flat by default; elevation is reserved for things that are genuinely floating (FAB, modals)

## 2. Colors

The palette is Restrained: tinted neutrals plus a single warm pink accent. Category and finance-category colors are the one place the app goes wider than one hue, and even there each color is scoped to a small dot/tag, never a background wash beyond a pale tint.

### Primary
- **Petal Pink** (`oklch(0.660 0.207 355)` / `{colors.brand}`): the only color used for primary actions — buttons, the FAB, active nav state, focus rings, links. Roughly Tailwind's pink-500; used sparingly, never as a large fill.
- **Petal Pink Deep** (`oklch(0.560 0.210 355)` / `{colors.brand-dark}`): hover/active/pressed state for anything using Petal Pink. Never used at rest.
- **Petal Pink Faint** (`oklch(0.977 0.010 355)` / `{colors.brand-faint}`): the page background itself — a wash so light it reads as "warm white," not "pink page." This is the body background everywhere.
- **Petal Pink Light** (`oklch(0.942 0.045 355)` / `{colors.brand-light}`): hover backgrounds and the palest tag/chip fills (e.g. the pressed state on `EntryPill`, `bg-brand-faint` press states).

### Neutral
- **Ink** (`oklch(0.19 0.01 355)` / `{colors.ink}`): the CSS `--foreground` default text color — a near-black tinted toward the brand hue, not a flat gray-900.
- **White** (`#ffffff`): every card, sheet, row, and input surface.
- **Neutral 900** (`#111827`): page headings and primary data values (e.g. finance totals) via Tailwind `text-gray-900`.
- **Neutral 700 / 500 / 400 / 300** (`#374151` / `#6b7280` / `#9ca3af` / `#d1d5db`): body text, secondary labels, muted metadata (timestamps, placeholders), and disabled/inactive nav icons, in descending emphasis.
- **Neutral 200 / 100** (`#e5e7eb` / `#f3f4f6`): progress-bar tracks and the rare non-pink border (e.g. the "Cancel" button border in Settings).

### Category system (calendar + finance)
Each `Category` (exercise/food/social/event/task) and each `FinanceCategory` gets exactly one hue, expressed consistently as a dot, a light background+border tag, and a muted text tone — sourced only from `CATEGORY_COLORS` / `CATEGORY_DOT` / `FINANCE_CATEGORY_DOT` in `src/lib/types.ts`.
- **Exercise** — green (`#22c55e`)
- **Food / groceries** — amber (`#fbbf24`)
- **Social / going out** — pink (`#ec4899`) — the one category that overlaps the brand hue, since social is the emotionally "warmest" category
- **Event** — purple (`#a855f7`)
- **Task** — blue (`#3b82f6`)
- Finance adds sky (transport), rose (health & beauty), indigo (subscriptions), orange (expenses), teal (groceries), yellow (coffees & snacks) on the same dot+tag pattern

### Semantic
- **Success** (`#16a34a` / `#22c55e`): completed-state checkmarks, budget bars under 50%, "added!" confirmation states.
- **Warning** (`#f59e0b`): budget bars between 50–80% of a category's budget.
- **Danger** (`#ef4444` / `#dc2626`): budget bars over budget, delete affordances, error text.

### Named Rules
**The One Accent Rule.** Petal Pink is the only color used for chrome and actions (buttons, active states, focus rings, the FAB). It never appears as a large background fill outside the page wash itself — category and finance colors carry all other meaning, each scoped to a 2px dot or a pale tag.

**The Borders-Not-Shadows Rule.** Surface separation on cards, rows, and inputs comes from a 1px pale pink border (`border-pink-100` / `border-pink-200`), not from drop shadows. `shadow-sm` is layered on top as a soft assist, but the border is doing the real work — this is why the system reads flat and paper-like rather than "card UI."

## 3. Typography

**Body Font:** Geist (via `next/font/google`), falling back to `ui-sans-serif, system-ui`.

**Character:** One family carries everything — headings, buttons, labels, data, body copy. There is no display/body pairing and no serif; per the product register, a well-tuned single sans at a tight fixed scale reads calmer and more trustworthy for a tool used in short, frequent glances than a fluid, dramatically-scaled display face would.

### Hierarchy
- **Display** (700, 1.875rem/30px, 1.2 line-height): reserved for the single hero number on a screen — currently only the weekly spend total on Finance (`text-3xl font-bold`). Used at most once per screen.
- **Headline** (700, 1.5rem/24px, 1.25 line-height): the "Today" card's date inside its pink header band, and equivalent single big moments.
- **Title** (600, 1.25rem/20px, 1.3 line-height): every page's `<h1>` — "This week", "To-Dos", "Finance", "Settings", "Plan your week".
- **Body** (400–600, 0.875rem/14px, 1.5 line-height): the workhorse size — row text, button labels, form inputs, descriptions. Line length isn't a concern at this width (max-w-lg container), so no ch-cap is enforced.
- **Label** (600, 0.75rem/12px, 0.08em tracking, uppercase): section eyebrows ("Today", "This Week", "This Month", "My Profile") and the smallest metadata (nav labels at 10–11px use the same weight/tracking treatment one notch down).

### Named Rules
**The One Family Rule.** Geist is the only typeface in the system. Never introduce a second family for "personality" — warmth here comes from color and roundness, not from font pairing.

## 4. Elevation

The system is flat by default. Depth is conveyed almost entirely through the pale pink 1px border plus a light `shadow-sm`, not through layered shadow depth. Heavier shadows are reserved for things that are literally floating above the page: the FAB, its fanned-out mini-actions, and centered modals/sheets. This scarcity is what makes the FAB and modals read as interactive overlays rather than "more of the same card stack."

### Shadow Vocabulary
- **Resting** (`shadow-sm`): the default for every card, row, and pill — cards, `EntryPill`, `TodoRow`, `ListItemRow`, the pill-row chips. Paired with a border, never used alone.
- **Floating — brand-tinted** (`shadow-lg shadow-pink-300/50`): the FAB only. The colored shadow (pink, not black) is the one deliberate elevation flourish in the system — it signals "this is the one thing floating above everything else."
- **Floating — neutral** (`shadow-md` / `shadow-lg`): the FAB's mini-action labels and icon buttons when fanned out.
- **Overlay** (`shadow-2xl`): `CenteredModal` (Quick Add, Entry Detail) — the deepest shadow in the system, used exactly once per open sheet.

### Named Rules
**The Flat-By-Default Rule.** Nothing gets a shadow just for being a card. Shadows appear only on things that are genuinely elevated above the page (FAB, sheets/modals) or as the minimum `shadow-sm` assist alongside a border on every other surface.

## 5. Components

Component feel across the system: **gentle and rounded** — soft corners everywhere, quiet pale-pink borders, nothing sharp-edged. Interactive elements are generously sized for touch (44px+ tap targets) but visually quiet at rest.

### Buttons
- **Shape:** 12px radius (`rounded-xl`) on all buttons; the FAB is the one full-circle exception.
- **Primary:** solid Petal Pink background, white text, `font-semibold`, full-width or content-width, `h-11` (44px) or `py-2.5`. Disabled state drops to `opacity-40`. Hover/active shifts to Petal Pink Deep with a `transition-colors`.
- **Secondary / Ghost:** white background with a `border-gray-200` or `border-pink-200` border and gray-600/700 text — used for "Cancel", "Import", and other non-committal actions. No fill, no shadow.
- **Text link:** bare Petal Pink text, `font-semibold`, no background — used for small inline actions ("+ Add", "Edit", "Clear").
- **Icon-only:** 44×44px hit area, `currentColor` stroke SVGs at 1.5–2px stroke width, gray-400 default shifting to pink-500/600 or red-400 on hover/danger.

### Chips / Pills
- **Style:** `rounded-full`, `px-3 py-1.5`, `text-sm font-medium`. Inactive = white background + `border-gray-200` + gray-500 text. Active = the list's own palette color at light-tint background + matching dark text + matching border (`LIST_PALETTE`), no border on plain nav-style pills.
- **State:** a pill's own delete affordance sits inline within the active pill (an ×), not as a separate row action — keeps the "one thing at a time" density low.

### Cards / Containers
- **Corner Style:** 16px radius (`rounded-2xl`) — the card standard. Rows nested inside a card (transaction rows, budget bars) don't get their own radius; only the outer container does.
- **Background:** white, always, on top of the pink-faint page.
- **Shadow Strategy:** `shadow-sm` + `border-pink-100`, per the Borders-Not-Shadows Rule above.
- **Border:** 1px, pink-100 (quiet) or pink-200 (slightly more present, used on inputs and the "Today" card's outer ring).
- **Internal Padding:** 16px (`p-4`) standard; compact rows use `px-3 py-2`.

### Inputs / Fields
- **Style:** white background, `border-pink-200`, `rounded-xl` (12px) for standalone fields, `rounded-lg` (8px) for dense inline fields inside a row (e.g. Settings' expense name/amount).
- **Focus:** `focus:ring-2 focus:ring-brand focus:border-transparent` — a solid pink ring replaces the border rather than a glow/shadow.
- **Error / Disabled:** no distinct visual language yet for input error state — text-level error messages (`text-red-600`) appear below the field instead of on the border itself.

### Navigation
- **Bottom nav:** fixed, white, `border-t border-pink-100`, 5 tabs (Week · Year · Plan · To-Dos · Finance) at even width, each a custom inline SVG icon + 10px uppercase-weight label. Active = `#db2777` (Petal Pink 600); inactive = `#9ca3af` (neutral-400). No background pill or underline for the active tab — color alone carries the state.
- **Floating Action Button:** the one non-nav navigation-adjacent control. 56×56px circle, Petal Pink, pink-tinted shadow, fixed bottom-right above the nav bar (`--fab-clear` handles safe-area). Rotates 45° into an implicit "×" when expanded. On `/todos` only, it fans out into two labeled mini-actions (pill label + circular icon button) over a dimming scrim — the system's only speed-dial pattern, and deliberately confined to that one screen.

### Checkbox (signature component)
`CheckCircleButton` is the recurring completion affordance across calendar entries, todos, and list items: a 20×20 SVG circle, filled green with a white check mark when complete, an unfilled gray-300 outline ring when not. Always paired with a 44×44px tap target and `line-through text-gray-400` on the label text once checked.

### Destructive confirm (signature interaction)
Deletions never use `window.confirm()` or a modal. The trigger button itself swaps its label to "Delete?" / "Tap to confirm" in red for ~2.5 seconds, auto-reverting if untapped — used for clearing checked list items and deleting a list. This keeps destructive actions low-ceremony and consistent with the gentle, non-jarring feel.

## 6. Do's and Don'ts

### Do:
- **Do** keep Petal Pink (`{colors.brand}`) as the only accent used for chrome/actions — buttons, FAB, active nav, focus rings.
- **Do** separate every card/row/input with a 1px pale pink border (`border-pink-100`/`200`) plus `shadow-sm`, not a heavier shadow alone.
- **Do** use 12px radius (`rounded-xl`) for anything interactive (buttons, inputs, rows) and 16px (`rounded-2xl`) for containers (cards, sheets, modals); full-round only for pills, dots, the FAB, and the checkbox.
- **Do** route every category/finance-category color through `CATEGORY_COLORS`/`CATEGORY_DOT`/`FINANCE_CATEGORY_*` in `src/lib/types.ts` — never hardcode a Tailwind color class for a category elsewhere.
- **Do** use the inline two-tap confirm pattern ("Delete?" → "Tap to confirm") for destructive actions, never a native `confirm()` dialog or a full modal.
- **Do** keep all icons as inline SVG, `currentColor` or explicit hex stroke — no icon library.
- **Do** use Geist at the fixed rem scale (12/14/20/24/30px) — no fluid `clamp()` type sizing; this is a product surface, not a marketing page.

### Don't:
- **Don't** introduce a Linear/Notion-dark/Jira-style stark, anonymous palette — this app is explicitly not a corporate productivity tool.
- **Don't** build fintech-dashboard hero-metric cards with gradient accents on the Finance tab, even though it's the most "data" screen in the app.
- **Don't** use gradient text, glassmorphism, or any "generic AI tool" visual trope — the app should never look like it's trying to impress anyone but Maisie.
- **Don't** add a second typeface for "personality" — warmth comes from color and roundness, not font pairing.
- **Don't** add drop shadows to a card just because it's a card — shadows are reserved for the FAB, its mini-actions, and modals/sheets.
- **Don't** use `border-left`/`border-right` colored stripes as a card accent — category color is always a dot or a full-tint tag, never a side stripe.
- **Don't** put the FAB's fan-out speed-dial pattern anywhere except `/todos` — every other screen gets single-tap-to-Quick-Add or no FAB at all (`/plan`, `/finance`).
