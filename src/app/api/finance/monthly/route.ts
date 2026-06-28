import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { FinanceCategory, CategoryBudgets } from '@/lib/types';

export async function GET() {
  try {
    const now = new Date();
    const day = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    // Pay cycle runs 15th → 14th. If today is before the 15th, period started last month.
    const periodStartDate = day >= 15
      ? new Date(year, month, 15)
      : new Date(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, 15);
    const monthStart = periodStartDate.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthEnd = tomorrow.toISOString().split('T')[0];

    const profileRows = await sql`SELECT monthly_take_home, fixed_expenses, category_budgets FROM finance_profile LIMIT 1`;
    const profile = profileRows[0] ?? { monthly_take_home: 0, fixed_expenses: [], category_budgets: {} };
    const fixedExpenses = Array.isArray(profile.fixed_expenses) ? profile.fixed_expenses : [];
    const fixedTotal = fixedExpenses.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);
    const monthlyBudget = Number(profile.monthly_take_home) - fixedTotal;
    const categoryBudgets: CategoryBudgets = (profile.category_budgets && typeof profile.category_budgets === 'object')
      ? profile.category_budgets as CategoryBudgets
      : {};

    const rows = await sql`
      SELECT category, SUM(amount)::numeric as total
      FROM transactions
      WHERE date >= ${monthStart}::date
        AND date < ${monthEnd}::date
        AND category != 'income'
      GROUP BY category
    `;

    const breakdown: Record<FinanceCategory, number> = {
      eating_out: 0, coffees_snacks: 0, transport: 0, going_out: 0, health_beauty: 0,
      shopping: 0, subscriptions: 0, expenses: 0, groceries: 0, income: 0,
    };

    for (const row of rows) {
      breakdown[row.category as FinanceCategory] = Math.round(Number(row.total) * 100) / 100;
    }

    return NextResponse.json({ breakdown, monthlyBudget: Math.round(monthlyBudget * 100) / 100, categoryBudgets });
  } catch (error) {
    console.error('[GET /api/finance/monthly]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
