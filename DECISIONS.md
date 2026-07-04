# Design & Architecture Decisions

Decisions made during the creation of this app, so future Claude sessions don't relitigate them.

---

## Navigation

**Finance replaced the Nudges tab.**
The bottom nav has: Week | Year | + | To-Dos | Finance. There is no Nudges tab. Nudges are a notification mechanism only — they appear as a dismissible banner on the main page (`activeNudge` in `page.tsx`). The `/nudges` page and `NudgeItem` component have been deleted — do not recreate them.

**QuickAdd is not a page — it's a sheet.**
The `+` button in the bottom nav opens `QuickAddSheet` as a modal bottom sheet. `BottomNav` owns this modal state.

**Plan lives inside the + sheet, not the bottom nav.**
`QuickAddSheet` has a "Plan my week" option that routes to `/plan`. Plan used to occupy a nav slot directly; that slot was replaced by To-Dos. Don't move Plan back into the bottom nav without checking why it was moved out.

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

**Two model tiers, not one.**
`src/lib/models.ts` exports `AI_MODEL` (Haiku — simple/cheap classification tasks) and `AI_MODEL_SMART` (`claude-sonnet-4-6` — planning, review, natural-language parsing). Both are env-overridable. Don't collapse back to a single model without checking why routes were split.

**The chat route (`/api/plan/chat`) streams; all others are non-streaming.**

**Section prompts live in `src/prompts/[section].ts`.**
Changing a prompt takes effect on next deploy. No DB involvement.

**Plan confirm is additive, never destructive, toward existing calendar data.**
`POST /api/plan/confirm` used to `DELETE` all `calendar_entries`/`todos` for the week before inserting the AI-proposed ones. This wiped manually added (e.g. quick-add) entries, since the review flow only ever returns *new* entries, not the full set. Confirm now only inserts, skipping exact day+title duplicates — it must never delete existing rows for the week. The review/generation prompts are given existing entries as context specifically so they can judge what's already covered instead of re-proposing it.

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
