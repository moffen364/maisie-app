-- Example seed data for local/staging development.
-- Copy to seed.sql (gitignored) and customize with your own data, then run:
-- Run: psql $DATABASE_URL -f src/db/seed.sql

-- Clear existing data (preserve schema, truncate in FK-safe order)
TRUNCATE transactions, nudges, section_inputs, todos, calendar_entries, weeks RESTART IDENTITY CASCADE;
UPDATE user_profile SET content = '', updated_at = NOW();
UPDATE finance_profile SET monthly_take_home = 0, fixed_expenses = '[]', updated_at = NOW();

-- ─── User profile ────────────────────────────────────────────────────────────
UPDATE user_profile SET
  content = '## About me
I live in a big city and try to stay active during the week.

## Health & fitness
- Exercise goal: a few sessions per week
- Trying to eat well and sleep on a consistent schedule

## Work
- Currently working on a big project with a deadline coming up
- Mix of remote and office days

## Social
- Close friends: Alex, Sam, Jordan
- Trying to see people regularly in person

## Notes from last week
Good week overall. Made progress on the big project.',
  updated_at = NOW();

-- ─── Finance profile ─────────────────────────────────────────────────────────
UPDATE finance_profile SET
  monthly_take_home = 5000.00,
  fixed_expenses = '[
    {"name": "Rent", "amount": 1800},
    {"name": "Electricity", "amount": 80},
    {"name": "Internet", "amount": 70},
    {"name": "Phone", "amount": 45},
    {"name": "Gym", "amount": 60},
    {"name": "Streaming", "amount": 20}
  ]',
  updated_at = NOW();

-- ─── Weeks ───────────────────────────────────────────────────────────────────
INSERT INTO weeks (id, week_start) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '2026-06-15'),  -- last week
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-06-22');  -- current week

-- ─── Calendar entries — current week ─────────────────────────────────────────
INSERT INTO calendar_entries (week_id, day, time, category, title, notes, completed) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-06-22', '06:30', 'exercise', 'Morning run — 5k', NULL, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-06-22', NULL, 'task', 'Work on project deliverable', NULL, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-06-23', '09:00', 'event', 'Team standup', NULL, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-06-23', '18:00', 'exercise', 'Gym session', NULL, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-06-24', '19:30', 'social', 'Catch up with a friend', NULL, false);

-- ─── Todos ───────────────────────────────────────────────────────────────────
INSERT INTO todos (week_id, title, due_day, completed) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Book an appointment', NULL, false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Reply to an email', '2026-06-24', false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Buy a gift', '2026-06-27', false);

-- ─── Section inputs — current week ───────────────────────────────────────────
INSERT INTO section_inputs (week_id, section, raw_input) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'exercise', 'Run Mon, Wed, Fri. Gym Tuesday.'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'meals', 'Meal prep on the weekend. Cook at home on WFH days.'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'todos', 'Book appointment. Reply to email. Buy a gift.'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'social', 'Catch up with a friend midweek.'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'events', 'Team standup Tuesday morning.');

-- ─── Nudges — current week ────────────────────────────────────────────────────
INSERT INTO nudges (week_id, message, category, triggered_at, dismissed) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'You have not logged a run yet today.', 'health', NOW() - INTERVAL '2 hours', false);

-- ─── Transactions ─────────────────────────────────────────────────────────────
INSERT INTO transactions (week_id, date, amount, description, raw_description, category, confirmed) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-06-22', 5.50, 'Coffee', 'LOCAL CAFE', 'food', true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-06-22', 18.50, 'Lunch delivery', 'FOOD DELIVERY ORDER', 'food', true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '2026-06-23', 4.60, 'Public transport top-up', 'TRANSIT AUTHORITY', 'transport', true);
