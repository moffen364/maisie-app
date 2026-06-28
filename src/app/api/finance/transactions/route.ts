import { NextResponse } from 'next/server';
import sql, { getOrCreateWeek } from '@/lib/db';
import { ParsedTransaction } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { weekStart, transactions }: { weekStart: string; transactions: ParsedTransaction[] } = await req.json();

    if (!weekStart || !transactions?.length) {
      return NextResponse.json({ error: 'weekStart and transactions are required' }, { status: 400 });
    }

    const week = await getOrCreateWeek(weekStart);

    await Promise.all(
      transactions.map((t) =>
        sql`
          INSERT INTO transactions (week_id, date, amount, description, raw_description, category, confirmed)
          VALUES (
            ${week.id},
            ${t.date}::date,
            ${t.amount},
            ${t.description},
            ${t.raw_description},
            ${t.category},
            ${t.confirmed}
          )
        `
      )
    );

    return NextResponse.json({ saved: transactions.length });
  } catch (error) {
    console.error('[POST /api/finance/transactions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
