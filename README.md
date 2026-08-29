# 🌸 Maisie's Planner

A little pink corner of the internet that plans my week and tells me where my money went.

No "Team" pricing tier. No onboarding wizard. Just one person's Sunday-night
ritual, turned into an app — behind a single password, because it holds real
calendars and real bank transactions.

**👀 Want a look inside?** There's a [live demo](https://maisie-app-demo.vercel.app)
with invented data and no login. The AI features are switched off there —
it's public, and they'd run on my API key.

---

## 🧠 What is this, actually?

It's a **personal weekly planner**, built as an installable phone app (PWA), with **Claude** doing the thinking:

- 📅 **Plan** — every Sunday, I answer five quick questions (exercise, meals, todos, social, events) plus a finance check-in. Claude reads them, writes a proposed week, and I approve or tweak it before it lands on the calendar.
- ✅ **Today / Week** — a running view of what's on, with one-tap complete and quick-add for anything that pops up mid-week.
- 📝 **To-Dos & Lists** — todos for the week, plus persistent lists (Grocery, Top Ups, Wishlist, or whatever I make up) that don't care what week it is.
- 💸 **Finance** — paste in a bank statement, Claude categorises every line, and I get a weekly budget bar without opening a spreadsheet.

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
| Hosting | Vercel |

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
APP_PASSWORD=      # gates the app — pick a long passphrase
AUTH_SECRET=       # signs the auth cookie: openssl rand -hex 32
```

`APP_PASSWORD` and `AUTH_SECRET` are both required. The app **fails closed** —
without them every route returns 503 rather than falling open, which is rather
the point.

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

## 🔐 Two deployments, one repo

The repo is public; the app holds real data. So it runs twice:

| | Production | Demo |
|---|---|---|
| Who gets in | Me, with a password | Anyone |
| Data | Real, private Neon DB | Invented — a fictional "Sam" |
| AI features | On | Off, with a note explaining why |

The split is one env var: `NEXT_PUBLIC_DEMO_MODE=true` on the demo only. It
skips the password (a login wall on a portfolio link defeats the point) and
turns off anything that calls Claude.

**The separation is two databases, not a `WHERE` clause.** Filtering demo data
from real data inside one deployment means getting it right on every query
forever; one miss and a stranger sees my bank statement. The demo simply never
holds the connection string to the real database.

AI blocking is layered: each AI route checks the flag, *and* the Anthropic
client itself throws in demo mode — so a route added later that forgets the
check still can't spend my credits. The demo needs no API key at all.

Demo data lives in [`src/db/seed.demo.sql`](./src/db/seed.demo.sql), written
from scratch rather than adapted from mine — lightly-edited personal data keeps
details you don't notice.

---

## 📚 Want the deeper lore?

- [`PRODUCT.md`](./PRODUCT.md) — who it's for and the design principles behind it
- [`DESIGN.md`](./DESIGN.md) — the actual visual design system (colors, type, components)
- [`DECISIONS.md`](./DECISIONS.md) — deliberate product/architecture calls, so nobody (including future me) accidentally re-litigates them
- [`CLAUDE.md`](./CLAUDE.md) — the technical map of the codebase, written for AI coding agents working in this repo

---

Built by [Maisie](https://github.com/moffen364) for an audience of exactly one. 🌸
