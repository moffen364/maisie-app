import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listId, title } = body;

    if (!listId || !title?.trim()) {
      return NextResponse.json({ error: 'listId and title are required' }, { status: 400 });
    }

    const [item] = await sql`
      INSERT INTO list_items (list_id, title, completed)
      VALUES (${listId}, ${title.trim()}, false)
      RETURNING id, list_id, title, completed
    `;

    return NextResponse.json({ item });
  } catch (error) {
    console.error('[POST /api/lists/items]', error);
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
      UPDATE list_items SET completed = ${completed} WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/lists/items]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const listId = request.nextUrl.searchParams.get('listId');
    const completed = request.nextUrl.searchParams.get('completed');

    if (id) {
      await sql`DELETE FROM list_items WHERE id = ${id}`;
      return NextResponse.json({ success: true });
    }

    if (listId && completed === 'true') {
      await sql`DELETE FROM list_items WHERE list_id = ${listId} AND completed = true`;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'id, or listId + completed=true, is required' }, { status: 400 });
  } catch (error) {
    console.error('[DELETE /api/lists/items]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
