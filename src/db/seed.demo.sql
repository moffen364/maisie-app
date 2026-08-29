-- ─────────────────────────────────────────────────────────────────────────────
-- Demo seed data for the PUBLIC demo deployment.
--
-- Everything here is invented. It belongs to a fictional person ("Sam"), not
-- to the app's owner. Never point this at the production database.
--
--   psql $DEMO_DATABASE_URL -f src/db/schema.sql
--   psql $DEMO_DATABASE_URL -f src/db/seed.demo.sql
--
-- Dates are relative to CURRENT_DATE, so the demo always shows a populated
-- current week no matter when someone opens it.
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE transactions, section_inputs, todos, calendar_entries, weeks RESTART IDENTITY CASCADE;
TRUNCATE list_items RESTART IDENTITY CASCADE;

-- Monday of the current week, used for every relative date below.
CREATE TEMP VIEW wk AS
  SELECT (CURRENT_DATE - ((EXTRACT(ISODOW FROM CURRENT_DATE)::int - 1)))::date AS monday;

-- ─── Profile ─────────────────────────────────────────────────────────────────
UPDATE user_profile SET
  content = '## About me
Sam. Lives in a coastal city, works in an office three days a week.
This is demo data for a public showcase — every detail here is invented.

## Health & fitness
- Trying to run three times a week, building up to a 10k
- Swims on Saturday mornings when the weather is decent
- Vegetarian on weekdays, flexible on weekends

## Work
- Works Tuesday/Wednesday/Thursday in the office, Monday and Friday from home
- Standing team meeting first thing Tuesday

## Preferences
- Batch cooks on Sunday evening so weeknights are easy
- Likes the week planned but not scheduled to the minute',
  updated_at = NOW();

-- ─── Week ────────────────────────────────────────────────────────────────────
INSERT INTO weeks (id, week_start)
SELECT 'dddddddd-0000-0000-0000-000000000001', monday FROM wk;

-- ─── Calendar ────────────────────────────────────────────────────────────────
INSERT INTO calendar_entries (week_id, day, time, category, title, notes, completed)
SELECT 'dddddddd-0000-0000-0000-000000000001', monday + d, t, c, ttl, n, done
FROM wk, (VALUES
  (0, TIME '07:00', 'exercise', 'Morning run — 5k',            'Easy pace along the river.', true),
  (0, TIME '18:30', 'food',     'Batch cook — lentil curry',   'Makes four portions.',       true),
  (1, TIME '09:00', 'event',    'Team standup',                 NULL,                        true),
  (1, TIME '12:30', 'social',   'Lunch with Priya',            'The place near the office.', true),
  (2, TIME '07:00', 'exercise', 'Morning run — intervals',      '6 x 400m.',                 false),
  (2, TIME '19:00', 'event',    'Pottery class',               'Week four of six.',          false),
  (3, TIME '10:00', 'event',    'Quarterly planning session',  'Bring the roadmap notes.',   false),
  (4, TIME '17:30', 'social',   'Drinks with the team',        'Friday wrap-up.',            false),
  (5, TIME '08:00', 'exercise', 'Swim',                        '40 laps if the pool is quiet.', false),
  (5, TIME '11:00', 'task',     'Farmers market',              NULL,                          false),
  (6, TIME '17:00', 'food',     'Sunday roast with family',    NULL,                          false)
) AS v(d, t, c, ttl, n, done);

-- ─── To-dos ──────────────────────────────────────────────────────────────────
INSERT INTO todos (week_id, title, due_day, completed)
SELECT 'dddddddd-0000-0000-0000-000000000001', ttl, monday + d, done
FROM wk, (VALUES
  ('Book dentist appointment',        1, false),
  ('Renew library books',             2, true),
  ('Send Priya the recipe',           2, false),
  ('Pick up dry cleaning',            4, false),
  ('Water the plants',                5, false),
  ('Plan next week',                  6, false)
) AS v(ttl, d, done);

-- ─── Lists ───────────────────────────────────────────────────────────────────
-- schema.sql seeds Grocery / Top Ups / Wishlist; fill them with items.
INSERT INTO list_items (list_id, title, completed)
SELECT l.id, v.title, v.completed
FROM lists l
JOIN (VALUES
  ('Grocery',  'Oat milk',            false),
  ('Grocery',  'Red lentils',         false),
  ('Grocery',  'Spinach',             false),
  ('Grocery',  'Coffee beans',        true),
  ('Grocery',  'Tinned tomatoes',     false),
  ('Top Ups',  'Shampoo',             false),
  ('Top Ups',  'Toothpaste',          false),
  ('Top Ups',  'Dishwasher tablets',  true),
  ('Wishlist', 'Running shoes',       false),
  ('Wishlist', 'Cookbook — weeknight vegetarian', false),
  ('Wishlist', 'Good chef knife',     false)
) AS v(list_name, title, completed) ON l.name = v.list_name;

-- ─── Finance ─────────────────────────────────────────────────────────────────
-- Invented figures for a fictional person.
UPDATE finance_profile SET
  monthly_take_home = 5200.00,
  fixed_expenses = '[
    {"name": "Rent", "amount": 2100},
    {"name": "Utilities", "amount": 180},
    {"name": "Phone", "amount": 45},
    {"name": "Transport pass", "amount": 160},
    {"name": "Gym", "amount": 65},
    {"name": "Streaming", "amount": 35}
  ]'::jsonb,
  updated_at = NOW();

INSERT INTO transactions (week_id, date, amount, description, raw_description, category, confirmed)
SELECT 'dddddddd-0000-0000-0000-000000000001', monday + d, amt, descr, raw, cat, true
FROM wk, (VALUES
  (0,  4.80, 'Flat white',            'CORNER COFFEE CO',        'coffees_snacks'),
  (0, 62.40, 'Weekly grocery shop',   'SUPERMARKET 1123',        'groceries'),
  (1, 14.50, 'Lunch out',             'GREEN BOWL KITCHEN',      'eating_out'),
  (1,  4.80, 'Flat white',            'CORNER COFFEE CO',        'coffees_snacks'),
  (2,  3.60, 'Transport top-up',      'TRANSIT AUTHORITY',       'transport'),
  (2, 28.00, 'Pottery class',         'CLAY STUDIO',             'going_out'),
  (3, 18.90, 'Pharmacy',              'CITY PHARMACY',           'health_beauty'),
  (4, 42.00, 'Team drinks',           'THE ANCHOR',              'going_out'),
  (5, 24.30, 'Farmers market',        'MARKET STALLS',           'groceries'),
  (5, 12.00, 'Bakery',                'RISE BAKERY',             'eating_out')
) AS v(d, amt, descr, raw, cat);
