import { NextRequest, NextResponse } from 'next/server';
import sql, { getOrCreateWeek, getUserProfile } from '@/lib/db';
import { AI_MODEL, anthropic, parseClaudeJSON } from '@/lib/models';
import { getMondayOfWeek } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = getMondayOfWeek(now);
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : 'evening';

    const week = await getOrCreateWeek(weekStart);

    const [calendarRows, todoRows, profile] = await Promise.all([
      sql`
        SELECT day::text, time::text, category, title, completed
        FROM calendar_entries
        WHERE week_id = ${week.id}
        ORDER BY day, time NULLS LAST
      `,
      sql`
        SELECT title, due_day::text, completed
        FROM todos
        WHERE week_id = ${week.id}
        ORDER BY due_day NULLS LAST, title
      `,
      getUserProfile(),
    ]);

    const entriesSummary = calendarRows.length > 0
      ? calendarRows
          .map(e => `${e.day} ${e.time ?? 'no time'}: [${e.category}] ${e.title} (${e.completed ? 'done' : 'not done'})`)
          .join('\n')
      : 'No calendar entries this week.';

    const todosSummary = todoRows.length > 0
      ? todoRows
          .map(t => `${t.title} (due: ${t.due_day ?? 'no date'}) — ${t.completed ? 'done' : 'not done'}`)
          .join('\n')
      : 'No to-dos this week.';

    const systemPrompt = `You are Maisie's personal planner. Generate helpful nudges based on her week.

It is currently ${timeOfDay} on ${today}.

User profile:
${profile || 'No profile yet.'}

This week's calendar entries:
${entriesSummary}

This week's to-dos (with completion status):
${todosSummary}

Generate 1-3 relevant nudges for RIGHT NOW. Focus on:
- Things planned for today that haven't been marked done
- To-dos due today or overdue
- Social commitments or tasks she mentioned but may have forgotten
- Health/movement if it's evening and no exercise logged today

Return JSON array: [{ message: string, category: "todo"|"social"|"health"|"errand" }]
Only generate nudges that are genuinely useful right now. Return [] if nothing urgent.`;

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: 'Generate nudges for right now.' }],
      system: systemPrompt,
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from Claude' }, { status: 500 });
    }

    let nudges: { message: string; category: string }[] = [];
    try {
      nudges = parseClaudeJSON(rawContent.text);
    } catch {
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 });
    }

    for (const nudge of nudges) {
      await sql`
        INSERT INTO nudges (week_id, message, category)
        VALUES (${week.id}, ${nudge.message}, ${nudge.category})
      `;
    }

    return NextResponse.json({ nudgesGenerated: nudges.length });
  } catch (error) {
    console.error('[POST /api/cron/nudges]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
