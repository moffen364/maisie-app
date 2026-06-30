# Changelog

Personal life planning app — release history.

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
