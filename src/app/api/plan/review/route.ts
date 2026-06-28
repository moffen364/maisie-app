import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sql, { getOrCreateWeek, getUserProfile } from '@/lib/db';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart } = body;

    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const week = await getOrCreateWeek(weekStart);

    const [sectionInputs, profile, existingEntries] = await Promise.all([
      sql`
        SELECT section, raw_input
        FROM section_inputs
        WHERE week_id = ${week.id}
        ORDER BY section
      `,
      getUserProfile(),
      sql`
        SELECT day::text, time::text, category, title, notes
        FROM calendar_entries
        WHERE week_id = ${week.id}
        ORDER BY day, time NULLS LAST
      `,
    ]);

    const inputsSummary = sectionInputs.length > 0
      ? sectionInputs
          .map((s) => `## ${s.section}\n${s.raw_input}`)
          .join('\n\n')
      : 'No planning inputs yet.';

    const existingEntriesSummary = existingEntries.length > 0
      ? existingEntries
          .map((e) => `- ${e.day}${e.time ? ` at ${e.time}` : ''} [${e.category}] ${e.title}${e.notes ? ` (${e.notes})` : ''}`)
          .join('\n')
      : 'None.';

    const systemPrompt = `You are a personal planning assistant for Maisie. Review her week plan and provide structured feedback.

User profile:
${profile || 'No profile yet.'}

IMPORTANT: The user's message includes a section "Already in my calendar this week" — these entries already exist in the calendar. You must:
- Include them in proposedWeek so the full week is visible
- Do NOT re-add them to calendarEntries (they are already saved)
- Take them into account when identifying gaps or overloads

Return a JSON object with:
- positives: string[] (2-4 specific things that look good)
- issues: string[] (specific problems, gaps, or overloads — be direct, e.g. "No meals planned Thursday or Friday", "Thursday looks overloaded")
- proposedWeek: array of { day: "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday", items: string[] } for all 7 days — include both existing and new entries
- calendarEntries: array of { day: YYYY-MM-DD, time: string|null, category: "exercise"|"food"|"social"|"event"|"task", title: string, notes: string|null } — NEW entries to create only (do not duplicate already-existing ones). IMPORTANT: for the meals section, do NOT create individual breakfast/lunch/dinner events. Instead create ONE grocery reminder on the Sunday or Monday of the week (whichever is the planning night) with category "task", title "Grocery shop", and the weekly meal plan summarised in notes.
- todos: array of { title: string, due_day: YYYY-MM-DD|null } — tasks and errands

The week starts on ${weekStart}.
Respond with ONLY valid JSON.`;

    const userMessage = `Here are my planning notes for this week:\n\n${inputsSummary}\n\n## Already in my calendar this week\n${existingEntriesSummary}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from Claude' }, { status: 500 });
    }

    let reviewData: unknown;
    try {
      const cleaned = rawContent.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      reviewData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[plan/review] JSON parse failed. Stop_reason:', response.stop_reason, 'Raw text (first 500):', rawContent.text.slice(0, 500));
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 });
    }

    return NextResponse.json(reviewData);
  } catch (error) {
    console.error('[POST /api/plan/review]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
