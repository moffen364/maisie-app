# 🌸 Maisie's Planner

A little pink corner of the internet that plans my week, nudges me when I'm slacking, and tells me where my money went.

No login screen. No "Team" pricing tier. No onboarding wizard. Just one person's Sunday-night ritual, turned into an app.

---

## 🧠 What is this, actually?

It's a **personal weekly planner**, built as an installable phone app (PWA), with **Claude** doing the thinking:

- 📅 **Plan** — every Sunday, I answer five quick questions (exercise, meals, todos, social, events) plus a finance check-in. Claude reads them, writes a proposed week, and I approve or tweak it before it lands on the calendar.
- ✅ **Today / Week** — a running view of what's on, with one-tap complete and quick-add for anything that pops up mid-week.
- 📝 **To-Dos & Lists** — todos for the week, plus persistent lists (Grocery, Top Ups, Wishlist, or whatever I make up) that don't care what week it is.
- 💸 **Finance** — paste in a bank statement, Claude categorises every line, and I get a weekly budget bar without opening a spreadsheet.
- 🔔 **Nudges** — twice a day, a cron job asks Claude "does anything about this week need a gentle poke?" and drops a dismissible banner if so.

It's built entirely around **one user** (me). There's a single profile row in the database that Claude reads before every AI call — it's basically Claude's running notes on my habits, preferences, and patterns, and it gets to write back to it after planning sessions.

## 🎨 The vibe

Soft, warm, a little bit "pretty notebook you actually want to open." One accent color (**Petal Pink** 🌷) carries every button and active state; everything else is white cards on a barely-pink page with quiet borders instead of heavy shadows. See [`DESIGN.md`](./DESIGN.md) for the full breakdown if you're into that sort of thing — color tokens, component rules, the works.

Deliberately **not**: a stark Linear/Notion-style productivity tool, a fintech dashboard full of hero metrics, or anything trying to look like a flashy "AI product." Just a calm little planner.

## 🛠️ How it's put together

| Layer | Tech |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Styling | Tailwind CSS v4 |
| Database | [Neon](https://neon.tech/) Postgres |
| AI | [Anthropic's Claude](https://www.anthropic.com/claude) (Haiku for quick classification, Sonnet for planning/parsing) |
| Hosting | Vercel, with a cron job for the twice-daily nudges |

Everything's server-side for anything touching the database or the Claude API — the frontend is just React client components talking to Next.js API routes.

## 🚀 Running it yourself

```bash
npm install
npm run dev       # → localhost:3000
```

You'll need a `.env.local` with:

```
DATABASE_URL=      # Neon Postgres connection string
ANTHROPIC_API_KEY=
CRON_SECRET=       # optional — protects /api/cron/nudges in production
```

Then set up the schema once:

```bash
psql $DATABASE_URL -f src/db/schema.sql
```

(or just paste `schema.sql` into the Neon SQL editor if you'd rather click a button).

Other handy commands:

```bash
npm run build     # production build
npx tsc --noEmit  # type-check without building
```

There's no test suite or linter configured — this is a personal project kept deliberately simple, not a product with a team behind it.

## 📚 Want the deeper lore?

- [`PRODUCT.md`](./PRODUCT.md) — who it's for and the design principles behind it
- [`DESIGN.md`](./DESIGN.md) — the actual visual design system (colors, type, components)
- [`DECISIONS.md`](./DECISIONS.md) — deliberate product/architecture calls, so nobody (including future me) accidentally re-litigates them
- [`CLAUDE.md`](./CLAUDE.md) — the technical map of the codebase, written for AI coding agents working in this repo

---

Built by [Maisie](https://github.com/moffen364) for an audience of exactly one. 🌸
