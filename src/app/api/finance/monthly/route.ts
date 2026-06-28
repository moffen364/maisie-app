import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { FinanceCategory } from '@/lib/types';

export async function GET() {
  try {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthEnd = tomorrow.toISOString().split('T')[0];

    const profileRows = await sql`SELECT monthly_take_home, fixed_expenses FROM finance_profile LIMIT 1`;
    const profile = profileRows[0] ?? { monthly_take_home: 0, fixed_expenses: [] };
    const fixedExpenses = Array.isArray(profile.fixed_expenses) ? profile.fixed_expenses : [];
    const fixedTotal = fixedExpenses.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);
    const monthlyBudget = Number(profile.monthly_take_home) - fixedTotal;

    const rows = await sql`
      SELECT category, SUM(amount)::numeric as total
      FROM transactions
      WHERE date >= ${monthStart}::date
        AND date < ${monthEnd}::date
        AND category != 'income'
      GROUP BY category
    `;

    const breakdown: Record<FinanceCategory, number> = {
      food: 0, transport: 0, going_out: 0, health_beauty: 0,
      shopping: 0, subscriptions: 0, bills: 0, income: 0, other: 0,
    };

    for (const row of rows) {
      breakdown[row.category as FinanceCategory] = Math.round(Number(row.total) * 100) / 100;
    }

    return NextResponse.json({ breakdown, monthlyBudget: Math.round(monthlyBudget * 100) / 100 });
  } catch (error) {
    console.error('[GET /api/finance/monthly]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
