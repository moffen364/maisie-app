import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { FixedExpense, CategoryBudgets } from '@/lib/types';

async function getOrCreateProfile() {
  const rows = await sql`SELECT id, monthly_take_home, fixed_expenses, category_budgets, updated_at::text FROM finance_profile LIMIT 1`;
  if (rows.length > 0) return rows[0];
  const created = await sql`
    INSERT INTO finance_profile (monthly_take_home, fixed_expenses, category_budgets)
    VALUES (0, '[]', '{}')
    RETURNING id, monthly_take_home, fixed_expenses, category_budgets, updated_at::text
  `;
  return created[0];
}

export async function GET() {
  try {
    const profile = await getOrCreateProfile();
    return NextResponse.json(profile);
  } catch (error) {
    console.error('[GET /api/finance/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { monthly_take_home, fixed_expenses, category_budgets }: {
      monthly_take_home: number;
      fixed_expenses: FixedExpense[];
      category_budgets: CategoryBudgets;
    } = await req.json();
    const profile = await getOrCreateProfile();
    const updated = await sql`
      UPDATE finance_profile
      SET monthly_take_home = ${monthly_take_home},
          fixed_expenses = ${JSON.stringify(fixed_expenses)}::jsonb,
          category_budgets = ${JSON.stringify(category_budgets ?? {})}::jsonb,
          updated_at = NOW()
      WHERE id = ${profile.id}
      RETURNING id, monthly_take_home, fixed_expenses, category_budgets, updated_at::text
    `;
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('[PUT /api/finance/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
