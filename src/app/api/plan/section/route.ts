import { NextRequest, NextResponse } from 'next/server';
import sql, { getOrCreateWeek } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart, section, input } = body;

    if (!weekStart || !section || input === undefined) {
      return NextResponse.json({ error: 'weekStart, section, and input are required' }, { status: 400 });
    }

    const week = await getOrCreateWeek(weekStart);
    const weekId = week.id;

    const existing = await sql`
      SELECT id FROM section_inputs WHERE week_id = ${weekId} AND section = ${section}
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE section_inputs SET raw_input = ${input} WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO section_inputs (week_id, section, raw_input) VALUES (${weekId}, ${section}, ${input})
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/plan/section]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
