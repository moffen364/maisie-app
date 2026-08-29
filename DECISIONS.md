# Design & Architecture Decisions

Decisions made during the creation of this app, so future Claude sessions don't relitigate them.

---

## Navigation

**Nudges are removed entirely.**
The feature never earned its keep — the cron fired twice a day and the banner
went unread. Removed in full: the `/api/cron/nudges` and `/api/nudges` routes,
the `/nudges` page, the Today-page banner, the `Nudge`/`NudgeCategory` types,
the `crons` block in `vercel.json`, and the `nudges` table (dropped; it was
empty). Don't recreate it without a clearer reason than "it'd be nice to be
reminded".

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

**Single shared password, one user. No user accounts.**
This is a personal PWA — there is still one `user_profile` row and no
multi-user support planned. But the deployment URL is linked from the public
GitHub repo, so "no auth at all" meant strangers could read and write real
finance and profile data. `src/proxy.ts` requires a password cookie on every
route.

Requires `APP_PASSWORD` and `AUTH_SECRET`. It fails closed — if either is
unset the app returns 503 rather than serving. Don't "fix" that by letting it
fall through; an unset password on a public URL is the exact failure it
prevents.

Chose a password cookie over Vercel Authentication because this is an
installed standalone PWA: Vercel's flow bounces to vercel.com to authenticate,
which breaks out of the standalone window on iOS and re-prompts often.

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

**Any page that reads data Quick Add can write to must listen for the `quickadd:success` window event.**
Quick Add lives in the global floating action button (`FloatingActionButton`/`QuickAddSheet`), outside every page's own component tree, so there's no prop or state path back to a page's data after a successful add — writes landed correctly but the currently-open page never refetched, making Quick Add look completely broken until a manual reload. `QuickAddSheet` now does `window.dispatchEvent(new Event(QUICK_ADD_EVENT))` (constant in `src/lib/utils.ts`) on success; `/`, `/week`, `/todos`, and `ListsPanel` each extract their fetch into a `useCallback` and re-run it on that event. Give any new page/view with the same "Quick Add can write here" property the same listener rather than assuming a reload will happen.

---

## AI / Claude

**All Claude calls are server-side only.**
The Anthropic API key must never reach the client. All AI calls go through API routes under `src/app/api/`.

**Two model tiers, not one.**
`src/lib/models.ts` exports `AI_MODEL` (Haiku — simple/cheap classification tasks) and `AI_MODEL_SMART` (`claude-sonnet-4-6` — planning, review, natural-language parsing). Both are env-overridable. Don't collapse back to a single model without checking why routes were split.

**The chat route (`/api/plan/chat`) streams; all others are non-streaming.**

**Prompts doing relative-weekday parsing must list out each upcoming date, not just state today's weekday name.**
Stating `Today is Tuesday, 2026-07-14` (a prior fix) still wasn't enough — the cheap `AI_MODEL` tier kept landing "Saturday" on the wrong calendar date because it was still doing the day-of-week arithmetic itself, just from a better starting point. It reliably got it right once the prompt spelled out `Tuesday 2026-07-14, Wednesday 2026-07-15, ...` for the next 14 days and told it to look up the mentioned weekday rather than compute it. Applies currently to `/api/quick-add`; give any future prompt doing relative-day parsing the same treatment rather than reintroducing "just state today."

**Quick Add: anything with a specific time is a calendar entry, never a task, even if it reads like a chore.**
"Haircut tomorrow at 11am" and "dentist Thursday 3pm" were being classified `isTask: true` (errand wording) and filed into `todos` — invisible on the Week view, which only shows `calendar_entries`. A todo has no time field at all, so a time-bound appointment silently lost its time and its visibility the moment it got classified this way. The `isTask` rule in `/api/quick-add` now keys off "does the text give a specific time," not "does it read like an errand" — `isTask` is reserved for undated, time-flexible errands only.

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

**Server-side "today" must be computed in `Australia/Sydney`, never `new Date().toISOString()`.**
Vercel's serverless functions run in UTC, not Sydney. `toISOString().split('T')[0]` silently rolls back to the previous calendar day for any Sydney local time before ~10-11am (the UTC+10/+11 gap). This is a single-user app for someone in Sydney, so hardcode the zone with `Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', ... })` rather than relying on the server's local time. `src/lib/utils.ts`'s `toDateStr`/`getTodayStr` avoid `toISOString()` too, but only fix the UTC-shift problem for *client* components, where local time is already Sydney's — they don't help on the server. Grep for `toISOString().split('T')[0]` before adding a new date route; a few older ones (`/api/calendar`, `/api/finance/monthly`) still have this pattern and haven't been audited yet.

**All foreign keys go through `week_id → weeks.id`.**
There is no direct user FK on entries/todos — everything is scoped to a week.

**`lists`/`list_items` are the one exception — not week-scoped.**
A grocery list or wishlist persists past Sunday; it has no "week" to belong to. These two tables have no `week_id` FK, unlike every other table. Three default lists (Grocery, Top Ups, Wishlist) are seeded by `schema.sql`.

**`week_id` must be derived from the entry's actual `day`, never from request-time context.**
`POST /api/quick-add` used to compute `week_id` from the anchor date (today, or whatever day was selected) *before* asking Claude to parse the text, then reused that same `week_id` regardless of what day Claude returned. Since the Week view (`/`) filters `calendar_entries`/`todos` by `week_id` (not by date range — see `/api/calendar`'s `weekStart` branch), an entry parsed for a different week than the anchor date silently vanished from Week view while still showing correctly in Year view (which filters by actual date). Always compute `week_id` from the parsed `day` after Claude responds, not from context captured earlier in the request.

**The old single "Grocery shop" calendar task is gone.**
`/plan/review` and `/plan/confirm` used to create one `calendar_entries` row (category `task`, title "Grocery shop") with the week's meal plan summarised in `notes`. That's been replaced by itemized `groceryItems` inserted directly into the Grocery list — meal planning now proposes actual grocery items instead of a single reminder task. Don't reintroduce the old single-task pattern.

---

## No test suite or linter configured.

Deliberately kept simple for a personal project. Don't add one unless asked.
