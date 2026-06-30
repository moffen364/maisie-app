import { NextRequest, NextResponse } from 'next/server';
import { AI_MODEL, anthropic, parseClaudeJSON } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart, issueText, proposedWeek, calendarEntries, todos } = body;

    if (!weekStart || !issueText) {
      return NextResponse.json({ error: 'weekStart and issueText are required' }, { status: 400 });
    }

    const systemPrompt = `You are a personal planning assistant. The user has approved a specific suggestion to apply to their week plan. Apply ONLY that suggestion — do not change anything else.

You will receive:
- The suggestion to apply (a specific issue/fix)
- The current proposedWeek (human-readable display items per day)
- The current calendarEntries (structured DB entries — these are the actual events)
- The current todos

Return a JSON object with the updated:
- proposedWeek: array of { day: "Monday"|...|"Sunday", items: string[] } — all 7 days, updated to reflect the suggestion
- calendarEntries: array of { day: YYYY-MM-DD, time: string|null, category: "exercise"|"food"|"social"|"event"|"task", title: string, notes: string|null }
- todos: array of { title: string, due_day: YYYY-MM-DD|null }

The week starts on ${weekStart}.
Only modify what is necessary to apply the suggestion. Respond with ONLY valid JSON.`;

    const userMessage = `Apply this suggestion to the plan:
"${issueText}"

Current proposed week:
${JSON.stringify(proposedWeek, null, 2)}

Current calendar entries:
${JSON.stringify(calendarEntries, null, 2)}

Current todos:
${JSON.stringify(todos, null, 2)}`;

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from Claude' }, { status: 500 });
    }

    const updated = parseClaudeJSON(rawContent.text);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[POST /api/plan/apply-suggestion]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
