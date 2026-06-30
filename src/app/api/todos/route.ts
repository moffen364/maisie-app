import { NextRequest, NextResponse } from 'next/server';
import sql, { getOrCreateWeek } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const weekStart = request.nextUrl.searchParams.get('weekStart');
    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const week = await getOrCreateWeek(weekStart);

    const todos = await sql`
      SELECT
        id,
        week_id,
        title,
        due_day::text,
        completed
      FROM todos
      WHERE week_id = ${week.id}
      ORDER BY due_day NULLS LAST, title
    `;

    return NextResponse.json({ todos });
  } catch (error) {
    console.error('[GET /api/todos]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, weekStart } = body;

    if (!title?.trim() || !weekStart) {
      return NextResponse.json({ error: 'title and weekStart are required' }, { status: 400 });
    }

    const week = await getOrCreateWeek(weekStart);

    const [todo] = await sql`
      INSERT INTO todos (week_id, title, completed)
      VALUES (${week.id}, ${title.trim()}, false)
      RETURNING id, week_id, title, due_day::text, completed
    `;

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('[POST /api/todos]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, completed } = body;

    if (!id || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'id and completed are required' }, { status: 400 });
    }

    await sql`
      UPDATE todos SET completed = ${completed} WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/todos]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
