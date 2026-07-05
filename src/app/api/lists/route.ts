import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { LIST_COLOR_ORDER } from '@/lib/types';

export async function GET() {
  try {
    const [lists, items] = await Promise.all([
      sql`SELECT id, name, color, sort_order FROM lists ORDER BY sort_order, created_at`,
      sql`SELECT id, list_id, title, completed FROM list_items ORDER BY created_at`,
    ]);

    return NextResponse.json({ lists, items });
  } catch (error) {
    console.error('[GET /api/lists]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const existing = await sql`SELECT color, sort_order FROM lists ORDER BY sort_order`;
    const nextSortOrder = existing.length > 0 ? Math.max(...existing.map((l) => l.sort_order)) + 1 : 0;
    const nextColor = LIST_COLOR_ORDER[existing.length % LIST_COLOR_ORDER.length];

    const [list] = await sql`
      INSERT INTO lists (name, color, sort_order)
      VALUES (${name.trim()}, ${nextColor}, ${nextSortOrder})
      RETURNING id, name, color, sort_order
    `;

    return NextResponse.json({ list });
  } catch (error) {
    console.error('[POST /api/lists]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // list_items.list_id has ON DELETE CASCADE, so this also removes the list's items.
    await sql`DELETE FROM lists WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/lists]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
