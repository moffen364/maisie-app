# Design & Architecture Decisions

Decisions made during the creation of this app, so future Claude sessions don't relitigate them.

---

## Navigation

**Finance replaced the Nudges tab.**
There is no Nudges tab. Nudges are a notification mechanism only — they appear as a dismissible banner on the main page (`activeNudge` in `page.tsx`). The `/nudges` page and `NudgeItem` component have been deleted — do not recreate them.

**QuickAdd is not a page — it's a sheet.**
`QuickAddSheet` opens as a modal bottom sheet, triggered from the floating action button (see below). It no longer has an internal tab bar — it's always just the add textarea, scoped to `targetDate` when opened from a specific day.

**The bottom nav is 5 even tabs, no floating button in the row: Week | Year | Plan | To-Dos | Finance.**
Superseded: the nav used to have a raised inline `+` button in the center slot that opened `QuickAddSheet`, and Plan lived only inside that sheet as a second tab ("Plan my week"). Both changed in the FAB redesign below — **Plan now has its own nav tab**, deliberately reversing the earlier decision that pulled it out to make room for To-Dos. If a future session is tempted to move Plan again, check this file's git history for why, twice.

**Quick Add and Lists moved to a floating action button (FAB), not the nav row.**
`FloatingActionButton.tsx` renders a pink circular button fixed to the bottom-right of the screen, above the nav bar (`--fab-clear` in `globals.css` controls the clearance, safe-area aware). Behavior is route-dependent:
- On `/` and `/week`: single tap opens `QuickAddSheet` directly. No fan-out.
- On `/plan` and `/finance` (and subroutes): the FAB doesn't render at all — both pages already have their own primary action, so a FAB there would be redundant.
- On `/todos`: tapping the FAB fans out into two labeled mini-actions ("Quick Add" and "Lists"/"To-Dos") with a dimming scrim behind them, Google Calendar-speed-dial style. This is the *only* place the FAB expands.

**`/todos` no longer has a top segmented tab bar for To-Dos/Lists.**
That switch is now driven entirely by the FAB's "Lists" mini-action, tracked via the `?view=lists` search param on `/todos` (so back/reload preserve it). The old `SegmentedTabs` component is deleted — don't recreate a top tab bar for this; the FAB is the intended, only way to switch. If a new segmented-tab need comes up elsewhere, it's fine to rebuild the component then, but this specific switch was moved on purpose.

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

**Destructive actions use an inline two-tap confirm, never `window.confirm()`.**
Deleting a list or bulk-clearing checked items in `ListsPanel.tsx` requires tapping the same button twice within ~2.5s (first tap swaps the label to "Delete?"/"Tap to confirm", second tap executes; it auto-reverts if not confirmed). This was chosen over a native browser dialog to keep the "gentle" brand feel and avoid a jarring modal for a personal, low-stakes app. Follow this pattern for any new destructive action rather than introducing native `confirm()` or a full modal.

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

**`lists`/`list_items` are the one exception — not week-scoped.**
A grocery list or wishlist persists past Sunday; it has no "week" to belong to. These two tables have no `week_id` FK, unlike every other table. Three default lists (Grocery, Top Ups, Wishlist) are seeded by `schema.sql`.

**The old single "Grocery shop" calendar task is gone.**
`/plan/review` and `/plan/confirm` used to create one `calendar_entries` row (category `task`, title "Grocery shop") with the week's meal plan summarised in `notes`. That's been replaced by itemized `groceryItems` inserted directly into the Grocery list — meal planning now proposes actual grocery items instead of a single reminder task. Don't reintroduce the old single-task pattern.

---

## No test suite or linter configured.

Deliberately kept simple for a personal project. Don't add one unless asked.
