import { NextRequest, NextResponse } from 'next/server';
import sql, { getOrCreateWeek } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const weekStart = searchParams.get('weekStart');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let entries;

    if (from && to) {
      entries = await sql`
        SELECT
          id,
          week_id,
          day::text,
          time::text,
          category,
          title,
          notes,
          completed
        FROM calendar_entries
        WHERE day >= ${from}::date AND day <= ${to}::date
        ORDER BY day, time NULLS LAST
      `;
    } else if (weekStart) {
      const week = await getOrCreateWeek(weekStart);
      entries = await sql`
        SELECT
          id,
          week_id,
          day::text,
          time::text,
          category,
          title,
          notes,
          completed
        FROM calendar_entries
        WHERE week_id = ${week.id}
        ORDER BY day, time NULLS LAST
      `;
    } else {
      return NextResponse.json({ error: 'weekStart or from/to required' }, { status: 400 });
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('[GET /api/calendar]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, completed, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (typeof completed === 'boolean') {
      await sql`UPDATE calendar_entries SET completed = ${completed} WHERE id = ${id}`;
    }

    if ('notes' in body) {
      const notesValue: string | null = typeof notes === 'string' ? notes || null : null;
      await sql`UPDATE calendar_entries SET notes = ${notesValue} WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/calendar]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM calendar_entries WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/calendar]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
