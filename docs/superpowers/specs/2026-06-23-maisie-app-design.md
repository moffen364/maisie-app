# Maisie App — Design Spec
**Date:** 2026-06-23
**Status:** Approved

---

## Overview

A personal AI-powered weekly planning PWA for a single user (Maisie). Every Sunday she plans her week through a conversational input flow; the AI organises it into a calendar, calls out gaps and imbalances, and surfaces timely nudges throughout the week. Mid-week, she can quick-add things in natural language and the AI slots them in. The app is installed to her iPhone home screen via Safari.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (React) |
| Deployment | Vercel |
| Database | Neon (Postgres) |
| AI | Anthropic API — `claude-sonnet-4-6` |
| App delivery | PWA — installed from Safari, no App Store |
| Auth | None — single user |

All Anthropic API calls are made server-side via Next.js API routes so the key is never exposed to the client.

---

## Configuration

### User Profile (`user_profile` table)
Stores Maisie's preferences, habits, and patterns as a markdown text field. Pre-populated by her before first use via a Settings screen in the app. Claude reads this on every AI call and appends to it automatically when it learns something new (e.g. she mentions she hates cooking on Thursdays).

Stored in the DB (not a repo file) so Claude can write back to it from the deployed app. Editable in-app via Settings → Edit Profile.

Covers:
- Favourite foods and dietary preferences
- Exercise habits and preferred days/times
- Friends she sees regularly and cadence
- Recurring errands and commitments
- Patterns Claude has noticed across weeks

### Section Prompts (`prompts/[section].ts`)
One prompt string per Sunday planning section, defined in the codebase. Controls Claude's behaviour when "Ask Claude" is tapped within that section. Files:
- `prompts/exercise.ts`
- `prompts/meals.ts`
- `prompts/todos.ts`
- `prompts/social.ts`
- `prompts/events.ts`

Maisie edits these by updating the code and redeploying — acceptable for a personal app where she controls the codebase.

---

## Navigation

Bottom tab bar with 5 items:

```
[ Today ]  [ Week ]  [ + ]  [ Plan ]  [ Nudges ]
```

- **Today** — home screen, opens by default mid-week
- **Week** — full Mon–Sun calendar view
- **+** — mid-week quick-add (opens as a modal/sheet, not a full screen)
- **Plan** — Sunday planning flow (step-through sections)
- **Nudges** — accumulated in-app reminders

---

## Screens

### 1. Today (Home)

Default screen when opening the app during the week.

**Layout — top to bottom:**
1. Date header ("Monday · 23 Jun")
2. AI nudge banner — shown if Claude has flagged something (e.g. "No movement logged and it's 7pm"). Dismissible.
3. **Today's timeline** — time-ordered entries for today: workouts, meals, events. Colour-coded by category (see categories below). Tappable to mark done or view detail.
4. **This week's to-dos** — flat list of uncompleted tasks, labelled with due day. Tasks due today appear first. Checkable inline.

### 2. Week

Mon–Sun grid showing all entries per day.

- Colour-coded by category: green (exercise), yellow (food), pink (social), purple (events/commitments), blue (tasks/errands)
- Tapping an entry opens a detail sheet — see detail, mark done, or delete
- Editing existing entries is out of scope for v1 — delete via the detail sheet and re-add via + if needed

### 3. Plan (Sunday Flow)

A step-through input flow, one section at a time. Accessible any day but intended as a Sunday ritual.

**Sections (in order):**
1. Exercise
2. Meals
3. To-dos & Errands
4. Social
5. Events & Commitments

**Each section:**
- Progress bar at top (e.g. "Step 2 of 5")
- Section title and prompt question
- Free-text area — she dumps whatever she has in mind
- "Ask Claude" button — opens a chat panel below the text area, pulling in `profile.md` and `prompts/[section].md` as context. Claude suggests ideas, asks follow-ups, and can propose content to add. She can accept suggestions ("Add all") or continue chatting. The chat is bidirectional — she can ask anything.
- "Next section →" and "Skip" options
- "Go back" to previous section

**After all sections are complete → AI Review Screen:**

A full-screen review before the calendar is built. Layout:
1. **What looks good** — green section, positive callouts
2. **What needs fixing** — red/orange callouts, direct and specific (e.g. "No meals Thursday or Friday — add something", "Thursday is overloaded — move the car insurance call")
3. **Your proposed week** — day-by-day summary of what Claude has scheduled
4. Two CTAs: **"Looks good — build my calendar"** / **"Go back and adjust"**

Confirming builds all `calendar_entries` and `todos` for the week in the database.

### 4. Nudges

A feed of in-app reminders generated throughout the week. Claude generates these based on the calendar and what hasn't been actioned.

Types:
- **To-do nudges** — "You said you'd buy olive oil — you haven't yet"
- **Social nudges** — "You planned to text Mia — haven't done it"
- **Health nudges** — "No movement logged today and it's 7pm"
- **Errand reminders** — tied loosely to day

Nudges are dismissible. The tab shows a badge count of unread nudges.

Nudge generation: triggered by a Vercel Cron job (twice daily — morning and evening). Claude checks the current week's calendar against what's been marked done and generates relevant nudges.

### 5. Quick Add (+)

Opens as a bottom sheet from any screen.

- Single text input: natural language (e.g. "pick up dry cleaning tomorrow", "dentist Thursday 3pm")
- Submit → API call → Claude reads the current week's calendar and `profile.md`, determines the best slot, creates the entry
- Sheet dismisses and a toast appears: **"Added to Thursday afternoon"** (or wherever Claude placed it)

---

## Data Model (Postgres)

### `user_profile`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| content | text | Markdown — preferences, habits, patterns |
| updated_at | timestamp | |

### `weeks`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| week_start | date | Monday of the week |
| created_at | timestamp | |

### `calendar_entries`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| week_id | uuid | FK → weeks |
| day | date | |
| time | time | nullable |
| category | enum | exercise, food, social, event, task |
| title | text | |
| notes | text | nullable |
| completed | boolean | default false |

### `todos`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| week_id | uuid | FK → weeks |
| title | text | |
| due_day | date | nullable |
| completed | boolean | default false |

### `nudges`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| week_id | uuid | FK → weeks |
| message | text | |
| category | enum | todo, social, health, errand |
| triggered_at | timestamp | |
| dismissed | boolean | default false |

### `section_inputs`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| week_id | uuid | FK → weeks |
| section | text | exercise, meals, todos, social, events |
| raw_input | text | what she typed |
| created_at | timestamp | |

---

## Key Flows

### Sunday Planning
1. Maisie opens **Plan** tab
2. Steps through 5 sections, brain-dumping into each free-text area
3. Optionally taps "Ask Claude" in any section — Claude reads `profile.md` + section prompt, helps her think, suggests content
4. After all sections → AI Review screen
5. Claude reads all section inputs + `profile.md`, generates review (positives, issues, proposed week)
6. Maisie confirms → calendar entries and todos written to DB
7. Claude updates `profile.md` with any new preferences learned during the session

### Mid-Week Quick Add
1. Maisie taps **+** from any screen
2. Types in natural language
3. Claude reads current week calendar + `profile.md`, determines best day/time/category
4. Entry written to DB
5. Toast: "Added to [day] [time]"

### Nudge Generation
1. Server-side job runs on a schedule (morning + evening)
2. Claude checks current week calendar entries and todos — what's incomplete, what's overdue, what's been missed
3. Generates nudge messages, writes to `nudges` table
4. Badge appears on Nudges tab

### Profile Learning
- Whenever Claude processes Sunday input or a quick-add, it may append to the user profile in the DB
- Additions are specific and factual (e.g. "Dislikes meal prepping on Thursdays", "Usually runs at 7am", "Sees Sarah most Fridays")
- The profile is readable and editable by Maisie via Settings → Edit Profile

---

## Persistent Memory

The app tracks across weeks:
- Friend frequency (who she saw and when)
- Exercise consistency (e.g. "You've skipped workouts 3 weeks running")
- Recurring errands
- Patterns in meals, habits, social life

These are surfaced in AI review insights and nudges, drawing from historical `calendar_entries` + `profile.md`.

---

## Category Colour Coding

| Category | Colour |
|---|---|
| Exercise | Green |
| Food / Meals | Yellow/Amber |
| Social | Pink |
| Events / Commitments | Purple |
| Tasks / Errands | Blue |

---

## Out of Scope (for now)
- Push notifications (browser push notifications are a stretch goal — in-app only for v1)
- Multiple users or accounts
- Calendar sync (Google Calendar etc.)
- Native app (Expo/React Native) — PWA first
