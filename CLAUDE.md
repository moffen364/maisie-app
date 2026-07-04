# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (localhost:3000)
npm run build     # production build
npx tsc --noEmit  # type-check without building
```

No test suite or linter configured.

## Git workflow

After completing a task, commit related changes together in a single logical commit. Group by feature or fix — don't commit file-by-file. Use `git add <specific files>` rather than `git add -A`.

## Environment

Requires `.env.local` with:
```
DATABASE_URL=     # Neon Postgres connection string
ANTHROPIC_API_KEY=
CRON_SECRET=      # optional — protects /api/cron/nudges in production
```

Run `psql $DATABASE_URL -f src/db/schema.sql` once to set up the DB (or paste the file into the Neon SQL editor).

## Design decisions

See `DECISIONS.md` for deliberate product decisions (navigation structure, no-auth choice, etc.) that should not be reversed without checking there first.

When a task establishes a new deliberate decision (a product/architecture choice, or a "don't do X, we tried it, here's why" fix) — add it to `DECISIONS.md` rather than leaving it implicit in a commit message. Keep entries short: what was decided, and the concrete reason. Also fix any entry there that's gone stale (e.g. describes a nav/model/route setup that's since changed) instead of leaving it to mislead the next session.

## Architecture

**Single-user personal PWA.** No auth. One `user_profile` row in the DB holds a freeform markdown text block that Claude reads on every AI call and can write back to after a planning session.

### Key data flows

**Sunday planning:** user steps through 5 sections + 1 finance step in `/plan` → each section's text is saved to `section_inputs` via `POST /api/plan/section` → after all steps, `/plan/review` calls `POST /api/plan/review` which asks Claude to generate a structured plan (`{ positives, issues, proposedWeek, calendarEntries, todos, groceryItems }`) → individual suggestions can be fixed via `POST /api/plan/apply-suggestion` without leaving the review → the review page shows `groceryItems` as a removable checklist → confirming calls `POST /api/plan/confirm` which writes all `calendar_entries` + `todos` to the DB, inserts `groceryItems` into the Grocery list (skipping case-insensitive duplicates of already-unchecked items), and updates the user profile.

**Mid-week quick-add:** `QuickAddSheet` → `POST /api/quick-add` → Claude parses natural language → either inserts into `calendar_entries`/`todos`, or (if `isListItem`) into `list_items` — matching an existing list by name or creating a new one, supporting multi-item adds in one message (e.g. "add milk, eggs, and bread").

**Lists:** `/todos` has a segmented control (`SegmentedTabs`) switching between To-Dos and Lists. The Lists tab (`ListsPanel`) shows a pill row of `lists` (Grocery / Top Ups / Wishlist / custom) and the active list's `list_items`, via `GET /api/lists` and `POST/PATCH/DELETE /api/lists/items`.

**Finance:** Transactions imported via `POST /api/finance/import` (Claude parses raw bank statement text) → saved via `POST /api/finance/transactions`. Weekly budget is derived from `finance_profile` (monthly take-home minus fixed expenses, divided by 4.33) — set in `/settings` via `PUT /api/finance/profile`. Weekly spend and monthly breakdown are served by `/api/finance/summary` and `/api/finance/monthly`.

**Nudges:** Vercel Cron (`0 8,19 * * *`) calls `POST /api/cron/nudges` → Claude checks the week's entries/todos → writes rows to `nudges` table → shown as a dismissible banner on the Today page.

### Database (Neon Postgres)

Schema in `src/db/schema.sql`. Key tables: `user_profile`, `weeks`, `calendar_entries`, `todos`, `nudges`, `section_inputs`, `finance_profile`, `transactions`. All FK through `week_id → weeks.id`. Always cast date/time columns to text in queries (`day::text`, `time::text`) — the Neon driver returns them as JS Date objects otherwise.

`lists` and `list_items` are the one exception — not week-scoped (see `DECISIONS.md`). `lists` is seeded with three defaults (Grocery, Top Ups, Wishlist), each with a `color` from `ListColor`/`LIST_PALETTE` in `src/lib/types.ts`. `list_items.list_id → lists.id`, no `week_id`.

DB helpers in `src/lib/db.ts` (server-only): `sql` tagged template, `getOrCreateWeek`, `getUserProfile`, `updateUserProfile`. **Note:** `db.ts` also exports its own `getMondayOfWeek` for server-side use; the one in `src/lib/utils.ts` is for client components only — don't mix them.

Pure client-safe utils in `src/lib/utils.ts`: `getMondayOfWeek`, `getTodayStr`, `getWeekDays`, `formatDay`, `formatShortDay`, `formatTime`, `sortByTime`, `groupByDay`.

### AI (Anthropic SDK)

Two model tiers defined in `src/lib/models.ts` (both overridable via env vars):
- `AI_MODEL` (`CLAUDE_MODEL` env, default `claude-haiku-4-5-20251001`) — fast/cheap, used for simple classification tasks
- `AI_MODEL_SMART` (`CLAUDE_MODEL_SMART` env, default `claude-sonnet-4-6`) — used for planning, review, and natural-language parsing

All calls are server-side (API routes only — key never reaches the client). The chat route (`/api/plan/chat`) streams via `ReadableStream`; all other Claude calls are non-streaming.

### Frontend

Next.js App Router, Tailwind v4 (`@import "tailwindcss"` — no `tailwind.config`). All interactive components are client components (`'use client'`). No icon libraries — all SVGs are inline.

**Category colour system** is defined in `src/lib/types.ts` as `CATEGORY_COLORS`, `CATEGORY_DOT` — import from there rather than hardcoding Tailwind classes. Finance categories have their own parallel `FINANCE_CATEGORY_COLORS`, `FINANCE_CATEGORY_DOT`, and `FINANCE_CATEGORY_LABELS` in the same file.

**Bottom nav** is in `src/components/BottomNav.tsx` (included in root layout). Tabs: Week `/` | Year `/week` | + (QuickAddSheet) | To-Dos `/todos` | Finance `/finance`. It owns the `QuickAddSheet` modal state. The `+` tab opens a sheet, not a page. Note: the route names and nav labels are deliberately mismatched — the "Week" timeline view lives at `/` and the "Year" calendar lives at `/week`.

**Plan** (`/plan`) is accessible but not in the bottom nav. It is the Sunday planning wizard.

**Settings** (`/settings`) is not in the bottom nav — it is linked from the gear icon on the root `/` page. It manages the `user_profile` text and `finance_profile` (monthly take-home + fixed expenses list).

Layout sets `max-w-lg mx-auto pb-24` on the main content area — page components don't need to add bottom padding. `/plan/review` wraps its content in `<Suspense>` because it calls `useSearchParams()`.

### Prompts

`src/prompts/[section].ts` — one exported string per file: `exercise`, `meals`, `todos`, `social`, `events`, `finance`. Edit these to change how Claude behaves. Changes take effect on next deploy — no DB involvement.
