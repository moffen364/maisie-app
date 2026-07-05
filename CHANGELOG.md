# Changelog

Personal life planning app — release history.

---

## 5 July 2026

### ✨ New
- **Lists** — a new tab next to To-Dos for persistent lists that aren't tied to a week: Grocery, Top Ups, and Wishlist come built in, and you can add your own. Quick-add now recognises list items too (e.g. "add milk, eggs, and bread"), and Sunday meal planning proposes itemized grocery items straight into the Grocery list instead of one generic "Grocery shop" reminder.
- **Delete and undo in Lists** — remove a single item, delete a whole list, or clear all checked items. Deleting a list or clearing checked items now needs a confirming second tap first, so a stray tap can't wipe anything by accident.

### 🐛 Fixed
- **New list names could vanish without saving** — tapping away to dismiss the keyboard after typing a new list name (the natural thing to do on a phone) discarded it silently instead of saving it. It now saves the same way pressing Enter does.
- **Typing quickly into Lists or To-Dos could merge two entries into one** — adding items in fast succession (e.g. "Milk", "Eggs", one after another) could occasionally concatenate one item's text onto the next. Fixed by clearing the input immediately rather than waiting on a render.
- **"Plan my week" could wipe manually added entries** — confirming a Sunday plan used to delete all of that week's calendar entries and todos before re-inserting the AI-proposed ones, destroying anything added via quick-add in between. It now only inserts, skipping exact duplicates.
- **Multi-day events and the week view could land on the wrong day** — a timezone bug in date handling silently shifted dates back a day for anyone ahead of UTC (i.e. Australia), which could drop Sunday from the week view and split a multi-day event's highlight bar across the wrong days.
- **Quick Add didn't reliably open the keyboard on mobile** — the text field's auto-focus was deferred in a way mobile browsers don't treat as a real tap, so the keyboard sometimes wouldn't appear. It now focuses synchronously when the sheet opens.
- The Quick Add "+" sheet could, in rare cases, mount without ever becoming visible if its opening animation stalled (e.g. switching apps mid-tap).

---

## 1 July 2026

### 🐛 Fixed
- **Quick Add now matches other modals** — tapping "Add" (from the `+` nav button or inside Year view) opens the same centered modal used for viewing days and events, instead of sliding up as a bottom sheet. The text field is auto-selected on open so the keyboard appears immediately.

### ⚡ Under the hood
- Extracted a shared `CenteredModal` component and `useModalTransition` hook, used by Quick Add, day detail, and event detail so all three stay visually consistent.

---

## 30 June 2026

### ✨ New
- **Apply suggestions in one tap** — on the plan review screen, you can now apply Claude's suggestions directly without going back to re-edit each section.
- **Todos page in nav** — Todos now has its own dedicated spot in the bottom nav. Planning has moved into the `+` sheet to keep the nav focused on daily use.
- **Clearer future day labels** — upcoming days in the week view now use a two-tier header so they stand out at a glance.

### 🐛 Fixed
- Year view calendar popup opening incorrectly.
- Transactions being matched to the wrong week.
- Future dates not scheduling as expected.

### ⚡ Under the hood
- Switched faster AI routes (finance import, nudges, quick-add) to a lighter model — same quality, lower cost and latency.
- New pixel-art character app icons.
- Code cleanup: shared utilities and components to reduce repetition.

---

## 28 June 2026

### ✨ New
- **Per-category budgets** — set spending limits for each finance category (groceries, eating out, transport, etc.) and track against them week by week.
- **Refined finance categories** — food is now split into Groceries vs. Eating Out for better insight. Removed vague "Bills" and "Other" buckets.
- **Smoother iOS experience** — native-feeling tap highlights, touch callout disabled, page transitions added. No more horizontal scroll on iPhone.
- **Profile updates are additive** — after a planning session, Claude appends new profile notes rather than replacing existing ones.

### 🐛 Fixed
- Year calendar popup not working after deploy.
- Sunday planning flow broken on first use.
- Todo side panel not opening correctly.

### ⚡ Under the hood
- App deployed to Sydney region for lower database latency.
- Daily nudge cron corrected to fire once per day (was firing twice).

---

## 28 June 2026 — Initial launch

**Initial launch.** 🎉

Core features shipped:
- **Sunday planning** — 5-section guided input (exercise, meals, todos, social, events) → Claude reviews and proposes the week → confirm to lock in the plan.
- **Today view** — see today's calendar entries, todos, and AI nudges at a glance.
- **Week view** — scrollable week calendar with a year overview.
- **Finance tracker** — paste bank statement text → Claude categorises transactions → weekly spend summary and monthly breakdown.
- **Quick-add** — natural language entry from the `+` button (e.g. "gym Tuesday 7am", "buy milk").
- **AI nudges** — twice-daily check-ins from Claude surfaced as a banner on the Today page.
- **Settings** — edit your profile text and finance profile (take-home pay + fixed expenses).
- **PWA** — installable on iPhone home screen, works offline-ready.
