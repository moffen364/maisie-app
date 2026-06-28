import { NextResponse } from 'next/server';
import sql, { getOrCreateWeek } from '@/lib/db';
import { getMondayOfWeek } from '@/lib/utils';

export async function GET() {
  try {
    const weekStart = getMondayOfWeek();
    const week = await getOrCreateWeek(weekStart);

    const [profileRows, transactionRows] = await Promise.all([
      sql`SELECT monthly_take_home, fixed_expenses FROM finance_profile LIMIT 1`,
      sql`
        SELECT id, date::text, amount, description, raw_description, category, confirmed
        FROM transactions
        WHERE week_id = ${week.id}
        ORDER BY date DESC, created_at DESC
      `,
    ]);

    const profile = profileRows[0] ?? { monthly_take_home: 0, fixed_expenses: [] };
    const fixedExpenses = Array.isArray(profile.fixed_expenses) ? profile.fixed_expenses : [];
    const fixedTotal = fixedExpenses.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);
    const weeklyBudget = Math.round(((Number(profile.monthly_take_home) - fixedTotal) / 4.3) * 100) / 100;

    const weeklySpend = transactionRows
      .filter((t) => t.category !== 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return NextResponse.json({
      weeklyBudget,
      weeklySpend: Math.round(weeklySpend * 100) / 100,
      transactions: transactionRows,
    });
  } catch (error) {
    console.error('[GET /api/finance/summary]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
