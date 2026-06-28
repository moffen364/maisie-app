# Finance Feature Design

**Date:** 2026-06-24  
**Status:** Approved

## Overview

Add a Finance tab to the bottom nav, replacing the Nudges tab (which the user doesn't need as a permanent destination — nudges surface via notifications and are dismissed). Finance is a first-class feature alongside Today, Week, Plan, and the QuickAdd `+`.

The feature has two parts:
1. **One-time financial profile setup** — monthly take-home and fixed expenses, configured in Settings
2. **Weekly transaction import** — paste raw bank statement text each Sunday, Claude parses and categorizes it

---

## Data Model

### `finance_profile` table
One row (like `user_profile`). Stores the user's financial baseline.

```sql
CREATE TABLE finance_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_take_home NUMERIC(10,2) NOT NULL DEFAULT 0,
  fixed_expenses JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

`fixed_expenses` is a JSONB array of objects:
```json
[
  { "name": "Rent", "amount": 900.00, "category": "bills" },
  { "name": "Spotify", "amount": 9.99, "category": "subscriptions" }
]
```

### `transactions` table
One row per transaction, linked to a week.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,
  raw_description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'food', 'transport', 'going_out', 'health_beauty',
    'shopping', 'subscriptions', 'bills', 'income', 'other'
  )),
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- `description` — Claude's cleaned-up version of the merchant name
- `raw_description` — original text from the bank statement
- `confirmed` — false for transactions Claude is unsure about (flagged for user review)

### Derived budget figures (no extra table)
- **Weekly discretionary budget** = `(monthly_take_home - sum(fixed_expenses)) / 4.3`
- **Weekly spend** = sum of non-income transactions for the current week
- **Monthly spend by category** = sum of transactions grouped by category for the current calendar month

---

## Sunday Planning Integration

The Sunday planning flow (`/plan`) gains a 6th step: **Finance**.

Flow:
1. User pastes raw bank statement text into a textarea
2. `POST /api/finance/import` sends the text to Claude with the financial profile as context
3. Claude returns a structured list of parsed transactions, each with a suggested category and a `confirmed` flag
4. Confident matches (e.g. "Tesco £12.40" → food) come back as `confirmed: true`
5. Ambiguous ones (e.g. "PAYPAL *MERCHANT123") come back as `confirmed: false` and are shown at the top for the user to categorize with one tap
6. User confirms → `POST /api/finance/transactions` saves all to DB

This step can be skipped. The same import sheet is also available directly from the Finance tab via an "Import" button.

---

## Finance Tab UI (`/finance`)

Replaces the Nudges tab in the bottom nav. Nav label: **Finance**.

### Layout

**Header:** "Finance" title + "Import" button (top-right)

**This Week section:**
- Headline: "£230 spent of £380 this week"
- Progress bar (color shifts from green → amber → red as budget fills)
- Transaction list grouped by day, each row: merchant name, category dot, amount

**This Month section:**
- Category breakdown — each spending category with total amount and a simple bar showing proportion of monthly budget
- Categories: Food, Going Out, Transport, Health & Beauty, Shopping, Subscriptions, Other

**Empty state:** If no transactions exist for the current week, show a prompt to import instead of the summary sections.

### Category colours
Following the existing `CATEGORY_COLORS` / `CATEGORY_DOT` pattern in `src/lib/types.ts`:

| Category | Colour |
|---|---|
| food | amber |
| transport | sky |
| going_out | pink |
| health_beauty | rose |
| shopping | purple |
| subscriptions | indigo |
| bills | orange |
| income | green |
| other | gray |

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/finance/profile` | Fetch financial profile |
| PUT | `/api/finance/profile` | Update income + fixed expenses |
| POST | `/api/finance/import` | Parse pasted bank statement via Claude |
| POST | `/api/finance/transactions` | Save confirmed transactions |
| GET | `/api/finance/summary` | Weekly totals + budget remaining |
| GET | `/api/finance/monthly` | Category breakdown for current month |

---

## Settings Page

Add a **Finance** section to `/settings`:
- Monthly take-home field (number input)
- Fixed expenses list: each row has name, amount, category — add/remove rows
- Save button calls `PUT /api/finance/profile`

This is a one-time setup but editable at any time.

---

## Claude Prompt (import)

The import prompt receives:
- The raw pasted bank statement text
- The user's `finance_profile` (income + fixed expenses) for context
- The list of allowed categories

It returns a JSON array of transactions. For each transaction, it provides: `date`, `amount`, `description` (cleaned merchant name), `raw_description`, `category`, `confirmed` (boolean — false when uncertain).

Fixed expenses that appear as transactions (e.g. rent payment) should be categorized correctly and marked confirmed.

---

## Out of Scope

- Savings goals or investment tracking
- Multi-account support
- Automatic bank sync (open banking)
- Receipt scanning
- Budget alerts / nudges for overspending
- Historical trend charts beyond the monthly category breakdown
