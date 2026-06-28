## Maisie App

Personal Weekly Planner App — Product Brief
Overview
A personal AI-powered weekly planning app for a woman - 25. Every Sunday, she inputs her week — and the app organises it into a structured calendar, analyses it for gaps and imbalances, and drip-feeds smart, direct nudges throughout the week.

Who It's For
A single user (no accounts, no multi-user). Female, 25, working full-time. Data-driven, loves tracking patterns about herself. Goal: stay healthy and balanced. Wants the AI to be direct and call her out when something's off — no sugarcoating.

Core Flow
Sunday Input
A mixed input screen: some free-text dump (she can write naturally), alongside guided fields for:

Exercise — type, duration, which days
Meals — what she plans to eat each day
To-dos — tasks and errands to get done
Social — who she wants to see, what kind of hangout
Events / commitments — things already in the diary

Once submitted, the AI processes everything and:

Organises it all into a weekly calendar view (Mon–Sun)
Schedules social plans (e.g. suggests Tuesday evening walk with Sarah, Friday drinks with group)
Generates a week summary with direct insights — what looks good, what's missing, what she needs to fix


AI Insights (Direct & Personal)
After processing the week, the AI calls out things like:

"You've got no fibre this week — add vegetables to at least 3 of those meals"
"You haven't planned to see anyone since last week — add a social event"
"You've only got one workout in. That's not enough. Add at least two more."
"You've got 11 errands and 3 evening events — Thursday is going to break you. Redistribute."

The tone is direct, honest, and personal — like a smart friend who knows her well, not a wellness app.

In-Week Drip Notifications
Throughout the week, the app surfaces timely reminders pulled from the calendar:

To-do nudges: "You said you'd buy olive oil this week — you haven't yet"
Social nudges: "You planned to text Mia — haven't done it"
Health nudges: "No movement logged today and it's 7pm"
Errand reminders tied loosely to location or day


Calendar View

Mon–Sun grid, showing all events, meals, workouts, tasks per day
Colour-coded by category (exercise, social, food, errands, events)
Tappable entries to see detail or mark as done


Persistent Memory
The app remembers across weeks:

Her preferences (e.g. doesn't like running on Mondays, prefers morning workouts)
Friends she sees regularly and how often
Recurring errands and habits
Past week data to spot longer-term patterns (e.g. "You've skipped exercise 3 Sundays in a row")


Tech Notes for Claude Code

Built as a web app (React preferred)
Uses the Anthropic API (claude-sonnet-4-6) for all AI processing and insight generation
Persistent storage for user data, preferences, and weekly history
No login required — single user only
Notifications can be in-app for now (browser push notifications as a stretch goal)
Mobile-friendly layout is important — she'll check it on her phone throughout the week