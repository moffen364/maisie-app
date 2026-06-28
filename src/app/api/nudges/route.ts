import { NextRequest, NextResponse } from 'next/server';
import sql, { getOrCreateWeek } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const weekStart = request.nextUrl.searchParams.get('weekStart');
    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const week = await getOrCreateWeek(weekStart);

    const nudges = await sql`
      SELECT
        id,
        week_id,
        message,
        category,
        triggered_at::text,
        dismissed
      FROM nudges
      WHERE week_id = ${week.id}
      ORDER BY triggered_at DESC
    `;

    return NextResponse.json({ nudges });
  } catch (error) {
    console.error('[GET /api/nudges]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, dismissed } = body;

    if (!id || typeof dismissed !== 'boolean') {
      return NextResponse.json({ error: 'id and dismissed are required' }, { status: 400 });
    }

    await sql`
      UPDATE nudges SET dismissed = ${dismissed} WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/nudges]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
