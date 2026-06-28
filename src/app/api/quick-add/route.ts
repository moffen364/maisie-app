import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sql, { getOrCreateWeek, getUserProfile } from '@/lib/db';
import { getMondayOfWeek } from '@/lib/utils';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetDate } = body;

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const anchorDate = targetDate ?? today;
    const weekStart = getMondayOfWeek(new Date(anchorDate + 'T00:00:00'));
    const weekSunday = (() => {
      const d = new Date(weekStart + 'T00:00:00');
      d.setDate(d.getDate() + 6);
      return d.toISOString().split('T')[0];
    })();

    const week = await getOrCreateWeek(weekStart);

    const [calendarRows, profile] = await Promise.all([
      sql`
        SELECT day::text, time::text, category, title
        FROM calendar_entries
        WHERE week_id = ${week.id}
        ORDER BY day, time NULLS LAST
      `,
      getUserProfile(),
    ]);

    const calendarSummary = calendarRows.length > 0
      ? calendarRows
          .map(e => `${e.day} ${e.time ?? 'no time'}: ${e.category} — ${e.title}`)
          .join('\n')
      : 'No entries yet this week.';

    const systemPrompt = `You are a personal assistant for Maisie. Parse the following natural language input and return a JSON object.

User profile:
${profile || 'No profile yet.'}

Current week's calendar:
${calendarSummary}

Return a JSON object with these fields:
- title: string (concise title for the entry)
- category: one of "exercise", "food", "social", "event", "task"
- day: YYYY-MM-DD (which day this should go on — use context and "tomorrow", "Thursday" etc to determine)
- time: HH:MM or null
- notes: string or null
- isTask: boolean (true if this is a to-do/errand rather than a calendar entry)
- message: string (a short confirmation message like "Added to Thursday afternoon" or "Added to tomorrow")

${targetDate
  ? `The user has selected ${targetDate} in their calendar — use that as the "day" unless the text clearly specifies a different day.`
  : `Today is ${today}. The current week runs from ${weekStart} to ${weekSunday}.`}
Respond with ONLY valid JSON, no markdown.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from Claude' }, { status: 500 });
    }

    let data: {
      title: string;
      category: string;
      day: string;
      time: string | null;
      notes: string | null;
      isTask: boolean;
      message: string;
    };

    try {
      data = JSON.parse(rawContent.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    } catch {
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 });
    }

    if (data.isTask) {
      await sql`
        INSERT INTO todos (week_id, title, due_day, completed)
        VALUES (${week.id}, ${data.title}, ${data.day ?? null}, false)
      `;
    } else {
      await sql`
        INSERT INTO calendar_entries (week_id, day, time, category, title, notes, completed)
        VALUES (
          ${week.id},
          ${data.day}::date,
          ${data.time ?? null},
          ${data.category},
          ${data.title},
          ${data.notes ?? null},
          false
        )
      `;
    }

    return NextResponse.json({ message: data.message });
  } catch (error) {
    console.error('[POST /api/quick-add]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
