# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (localhost:3000)
npm run build     # production build
npx tsc --noEmit  # type-check without building
```

No test suite or linter configured.

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

## Architecture

**Single-user personal PWA.** No auth. One `user_profile` row in the DB holds a freeform markdown text block that Claude reads on every AI call and can write back to after a planning session.

### Key data flows

**Sunday planning:** user steps through 5 sections in `/plan` → each section's text is saved to `section_inputs` via `POST /api/plan/section` → after all 5, `/plan/review` calls `POST /api/plan/review` which asks Claude to generate a structured plan (`{ positives, issues, proposedWeek }`) → confirming calls `POST /api/plan/confirm` which writes all `calendar_entries` + `todos` to the DB and updates the user profile.

**Mid-week quick-add:** `QuickAddSheet` → `POST /api/quick-add` → Claude parses natural language → inserts into `calendar_entries` or `todos`.

**Finance:** Transactions imported via `POST /api/finance/import` (Claude parses raw bank statement text) → saved via `POST /api/finance/transactions`. Weekly budget is derived from `finance_profile` (monthly take-home minus fixed expenses, divided by 4.33) — set in `/settings` via `PUT /api/finance/profile`. Weekly spend and monthly breakdown are served by `/api/finance/summary` and `/api/finance/monthly`.

**Nudges:** Vercel Cron (`0 8,19 * * *`) calls `POST /api/cron/nudges` → Claude checks the week's entries/todos → writes rows to `nudges` table → shown as a dismissible banner on the Today page.

### Database (Neon Postgres)

Schema in `src/db/schema.sql`. Key tables: `user_profile`, `weeks`, `calendar_entries`, `todos`, `nudges`, `section_inputs`, `finance_profile`, `transactions`. All FK through `week_id → weeks.id`. Always cast date/time columns to text in queries (`day::text`, `time::text`) — the Neon driver returns them as JS Date objects otherwise.

DB helpers in `src/lib/db.ts` (server-only): `sql` tagged template, `getOrCreateWeek`, `getUserProfile`, `updateUserProfile`. **Note:** `db.ts` also exports its own `getMondayOfWeek` for server-side use; the one in `src/lib/utils.ts` is for client components only — don't mix them.

Pure client-safe utils in `src/lib/utils.ts`: `getMondayOfWeek`, `getTodayStr`, `getWeekDays`, `formatDay`, `formatShortDay`, `formatTime`.

### AI (Anthropic SDK)

Model: `claude-sonnet-4-6`. All calls are server-side (API routes only — key never reaches the client). The chat route (`/api/plan/chat`) streams via `ReadableStream`; all other Claude calls are non-streaming.

### Frontend

Next.js App Router, Tailwind v4 (`@import "tailwindcss"` — no `tailwind.config`). All interactive components are client components (`'use client'`). No icon libraries — all SVGs are inline.

**Category colour system** is defined in `src/lib/types.ts` as `CATEGORY_COLORS` and `CATEGORY_DOT` — import from there rather than hardcoding Tailwind classes. Finance categories have their own parallel `FINANCE_CATEGORY_DOT` and `FINANCE_CATEGORY_LABELS` in the same file.

**Bottom nav** is in `src/components/BottomNav.tsx` (included in root layout). Tabs: Today `/` | Week `/week` | + (QuickAddSheet) | Plan `/plan` | Finance `/finance`. It owns the `QuickAddSheet` modal state. The `+` tab opens a sheet, not a page.

**Settings** (`/settings`) is not in the bottom nav — it is linked from the gear icon on the `/nudges` page. It manages the `user_profile` text and `finance_profile` (monthly take-home + fixed expenses list).

Layout sets `max-w-lg mx-auto pb-24` on the main content area — page components don't need to add bottom padding. `/plan/review` wraps its content in `<Suspense>` because it calls `useSearchParams()`.

### Prompts

`src/prompts/[section].ts` — one exported string per file: `exercise`, `meals`, `todos`, `social`, `events`, `finance`. Edit these to change how Claude behaves. Changes take effect on next deploy — no DB involvement.
