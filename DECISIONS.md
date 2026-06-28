# Design & Architecture Decisions

Decisions made during the creation of this app, so future Claude sessions don't relitigate them.

---

## Navigation

**Finance replaced the Nudges tab.**
The bottom nav has: Week | Year | + | Plan | Finance. There is no Nudges tab. Nudges are a notification mechanism only — they appear as a dismissible banner on the main page (`activeNudge` in `page.tsx`). The `/nudges` page and `NudgeItem` component have been deleted — do not recreate them.

**QuickAdd is not a page — it's a sheet.**
The `+` button in the bottom nav opens `QuickAddSheet` as a modal bottom sheet. `BottomNav` owns this modal state.

---

## Authentication

**No auth. Single user only.**
This is a personal PWA. There is one `user_profile` row in the DB. No login, no sessions, no multi-user support planned.

---

## Frontend

**No icon libraries — all SVGs are inline.**
Avoids bundle weight for a personal app. Keep SVGs inline in components.

**Tailwind v4 — no config file.**
Uses `@import "tailwindcss"` in `globals.css`. There is no `tailwind.config.js/ts`. Don't create one.

**Category colour system lives in `src/lib/types.ts`.**
`CATEGORY_COLORS` and `CATEGORY_DOT` are the source of truth. Never hardcode category colours elsewhere — always import from types.

**All interactive components are client components.**
`'use client'` on every component that uses state or effects. No server components below the layout.

---

## AI / Claude

**All Claude calls are server-side only.**
The Anthropic API key must never reach the client. All AI calls go through API routes under `src/app/api/`.

**Model: `claude-sonnet-4-6`.**
Used consistently across all API routes.

**The chat route (`/api/plan/chat`) streams; all others are non-streaming.**

**Section prompts live in `src/prompts/[section].ts`.**
Changing a prompt takes effect on next deploy. No DB involvement.

---

## Database

**Neon Postgres. Schema in `src/db/schema.sql`.**
Run once to set up: `psql $DATABASE_URL -f src/db/schema.sql`

**Always cast date/time columns to text in queries.**
The Neon driver returns `date` and `time` columns as JS Date objects. Prevent this by casting: `day::text`, `time::text`.

**All foreign keys go through `week_id → weeks.id`.**
There is no direct user FK on entries/todos/nudges — everything is scoped to a week.

---

## No test suite or linter configured.

Deliberately kept simple for a personal project. Don't add one unless asked.
