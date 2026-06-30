import { NextRequest, NextResponse } from 'next/server';
import sql, { getOrCreateWeek, getUserProfile, updateUserProfile } from '@/lib/db';
import { AI_MODEL, anthropic, parseClaudeJSON } from '@/lib/models';

interface CalendarEntryInput {
  day: string;
  time: string | null;
  category: string;
  title: string;
  notes: string | null;
}

interface TodoInput {
  title: string;
  due_day: string | null;
}

interface ReviewResult {
  calendarEntries: CalendarEntryInput[];
  todos: TodoInput[];
}

async function generateWeekPlan(
  weekStart: string,
  weekId: string,
  profile: string
): Promise<ReviewResult> {
  const sectionInputs = await sql`
    SELECT section, raw_input
    FROM section_inputs
    WHERE week_id = ${weekId}
    ORDER BY section
  `;

  const inputsSummary = sectionInputs.length > 0
    ? sectionInputs
        .map((s) => `## ${s.section}\n${s.raw_input}`)
        .join('\n\n')
    : 'No planning inputs yet.';

  const systemPrompt = `You are a personal planning assistant for Maisie. Review her week plan and provide structured feedback.

User profile:
${profile || 'No profile yet.'}

Return a JSON object with:
- positives: string[] (2-4 specific things that look good)
- issues: string[] (specific problems, gaps, or overloads — be direct, e.g. "No meals planned Thursday or Friday", "Thursday looks overloaded")
- proposedWeek: array of { day: "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday", items: string[] } for all 7 days
- calendarEntries: array of { day: YYYY-MM-DD, time: string|null, category: "exercise"|"food"|"social"|"event"|"task", title: string, notes: string|null } — the actual entries to create. IMPORTANT: for the meals section, do NOT create individual breakfast/lunch/dinner events. Instead create ONE grocery reminder on the Sunday or Monday of the week (whichever is the planning night) with category "task", title "Grocery shop", and the weekly meal plan summarised in notes.
- todos: array of { title: string, due_day: YYYY-MM-DD|null } — tasks and errands

The week starts on ${weekStart}.
Respond with ONLY valid JSON.`;

  const userMessage = `Here are my planning notes for this week:\n\n${inputsSummary}`;

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawContent = response.content[0];
  if (rawContent.type !== 'text') {
    throw new Error('Unexpected response from Claude');
  }

  return parseClaudeJSON<ReviewResult>(rawContent.text);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart, calendarEntries: prebuiltEntries, todos: prebuiltTodos } = body;

    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const week = await getOrCreateWeek(weekStart);
    const profile = await getUserProfile();

    // Use pre-built entries from the review page if provided (preserves applied suggestions),
    // otherwise fall back to generating via Claude
    let calendarEntries: CalendarEntryInput[];
    let todos: TodoInput[];
    if (prebuiltEntries && prebuiltTodos) {
      calendarEntries = prebuiltEntries;
      todos = prebuiltTodos;
    } else {
      const planData = await generateWeekPlan(weekStart, week.id, profile);
      calendarEntries = planData.calendarEntries ?? [];
      todos = planData.todos ?? [];
    }

    // Clean slate: delete existing entries for this week
    await sql`DELETE FROM calendar_entries WHERE week_id = ${week.id}`;
    await sql`DELETE FROM todos WHERE week_id = ${week.id}`;

    // Insert calendar entries
    for (const entry of calendarEntries) {
      await sql`
        INSERT INTO calendar_entries (week_id, day, time, category, title, notes, completed)
        VALUES (
          ${week.id},
          ${entry.day}::date,
          ${entry.time ?? null},
          ${entry.category},
          ${entry.title},
          ${entry.notes ?? null},
          false
        )
      `;
    }

    // Insert todos
    for (const todo of todos) {
      await sql`
        INSERT INTO todos (week_id, title, due_day, completed)
        VALUES (
          ${week.id},
          ${todo.title},
          ${todo.due_day ?? null},
          false
        )
      `;
    }

    // Fetch all section inputs for profile update
    const sectionInputs = await sql`
      SELECT section, raw_input FROM section_inputs WHERE week_id = ${week.id}
    `;

    const inputsSummary = sectionInputs.length > 0
      ? sectionInputs
          .map((s) => `## ${s.section}\n${s.raw_input}`)
          .join('\n\n')
      : '';

    // Append anything new learned to the profile — never replace it
    if (inputsSummary) {
      const profileUpdateResponse = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `Given this planning session, identify any NEW preferences, habits, or facts about Maisie that should be added to her profile. Only add things that aren't already captured. Be specific and brief.

Current profile:
${profile || 'No profile yet.'}

This session's inputs:
${inputsSummary}

Return ONLY the new lines to append (not the full profile). If nothing new was learned, return exactly: NONE`,
          },
        ],
      });

      const profileContent = profileUpdateResponse.content[0];
      if (profileContent.type === 'text') {
        const newFacts = profileContent.text.trim();
        if (newFacts && newFacts !== 'NONE') {
          const updatedProfile = profile
            ? `${profile}\n\n${newFacts}`
            : newFacts;
          await updateUserProfile(updatedProfile);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/plan/confirm]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
