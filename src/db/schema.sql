-- Run this once against your Neon database to set up the schema.
-- psql $DATABASE_URL -f src/db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  end_day DATE,
  time TIME,
  category TEXT NOT NULL CHECK (category IN ('exercise', 'food', 'social', 'event', 'task')),
  title TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Migration for existing installs (run once):
-- ALTER TABLE calendar_entries ADD COLUMN IF NOT EXISTS end_day DATE;

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_day DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('todo', 'social', 'health', 'errand')),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS section_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('exercise', 'meals', 'todos', 'social', 'events')),
  raw_input TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed an empty user profile row
INSERT INTO user_profile (content) VALUES ('') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS finance_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_take_home NUMERIC(10,2) NOT NULL DEFAULT 0,
  fixed_expenses JSONB NOT NULL DEFAULT '[]',
  category_budgets JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,
  raw_description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'eating_out', 'coffees_snacks', 'transport', 'going_out', 'health_beauty',
    'shopping', 'subscriptions', 'expenses', 'groceries', 'income'
  )),
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed an empty finance profile row
INSERT INTO finance_profile (monthly_take_home, fixed_expenses) VALUES (0, '[]') ON CONFLICT DO NOTHING;
