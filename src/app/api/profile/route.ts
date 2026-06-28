import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, updateUserProfile } from '@/lib/db';

export async function GET() {
  try {
    const content = await getUserProfile();
    return NextResponse.json({ content });
  } catch (error) {
    console.error('[GET /api/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    await updateUserProfile(content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
