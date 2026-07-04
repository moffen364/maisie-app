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
  groceryItems: string[];
}

async function generateWeekPlan(
  weekStart: string,
  weekId: string,
  profile: string
): Promise<ReviewResult> {
  const [sectionInputs, existingEntries, groceryItemRows] = await Promise.all([
    sql`
      SELECT section, raw_input
      FROM section_inputs
      WHERE week_id = ${weekId}
      ORDER BY section
    `,
    sql`
      SELECT day::text, time::text, category, title, notes
      FROM calendar_entries
      WHERE week_id = ${weekId}
      ORDER BY day, time NULLS LAST
    `,
    sql`
      SELECT list_items.title
      FROM list_items
      JOIN lists ON lists.id = list_items.list_id
      WHERE lists.name = 'Grocery' AND list_items.completed = false
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

  const groceryItemsSummary = groceryItemRows.length > 0
    ? groceryItemRows.map((r) => r.title).join(', ')
    : 'None.';

  const systemPrompt = `You are a personal planning assistant for Maisie. Review her week plan and provide structured feedback.

User profile:
${profile || 'No profile yet.'}

IMPORTANT: The user's message includes a section "Already in my calendar this week" — these entries already exist in the calendar. Do NOT re-add them to calendarEntries (they are already saved), and take them into account when identifying gaps or overloads.

Return a JSON object with:
- positives: string[] (2-4 specific things that look good)
- issues: string[] (specific problems, gaps, or overloads — be direct, e.g. "No meals planned Thursday or Friday", "Thursday looks overloaded")
- proposedWeek: array of { day: "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday", items: string[] } for all 7 days — include both existing and new entries
- calendarEntries: array of { day: YYYY-MM-DD, time: string|null, category: "exercise"|"food"|"social"|"event"|"task", title: string, notes: string|null } — NEW entries to create only (do not duplicate already-existing ones). IMPORTANT: do NOT create individual breakfast/lunch/dinner events, and do NOT create a grocery shop reminder here — grocery items go in the separate "groceryItems" field below instead.
- todos: array of { title: string, due_day: YYYY-MM-DD|null } — tasks and errands
- groceryItems: string[] — NEW grocery items to buy this week, derived from the meals discussion. Do not repeat items already in "Already unchecked on the Grocery list" below.

The week starts on ${weekStart}.
Respond with ONLY valid JSON.`;

  const userMessage = `Here are my planning notes for this week:\n\n${inputsSummary}\n\n## Already in my calendar this week\n${existingEntriesSummary}\n\n## Already unchecked on the Grocery list\n${groceryItemsSummary}`;

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
    const { weekStart, calendarEntries: prebuiltEntries, todos: prebuiltTodos, groceryItems: prebuiltGroceryItems } = body;

    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const week = await getOrCreateWeek(weekStart);
    const profile = await getUserProfile();

    // Use pre-built entries from the review page if provided (preserves applied suggestions),
    // otherwise fall back to generating via Claude
    let calendarEntries: CalendarEntryInput[];
    let todos: TodoInput[];
    let groceryItems: string[];
    if (prebuiltEntries && prebuiltTodos) {
      calendarEntries = prebuiltEntries;
      todos = prebuiltTodos;
      groceryItems = prebuiltGroceryItems ?? [];
    } else {
      const planData = await generateWeekPlan(weekStart, week.id, profile);
      calendarEntries = planData.calendarEntries ?? [];
      todos = planData.todos ?? [];
      groceryItems = planData.groceryItems ?? [];
    }

    // These lists represent NEW entries only (the review/generation prompts are instructed
    // not to re-propose what's already on the calendar) — never wipe existing entries here,
    // since that would also delete manually added (e.g. quick-add) items untouched by planning.
    const [existingEntries, existingTodos] = await Promise.all([
      sql`SELECT day::text, title FROM calendar_entries WHERE week_id = ${week.id}`,
      sql`SELECT due_day::text, title FROM todos WHERE week_id = ${week.id}`,
    ]);

    const normalize = (s: string) => s.trim().toLowerCase();
    const existingEntryKeys = new Set(
      existingEntries.map((e) => `${e.day}|${normalize(e.title)}`)
    );
    const existingTodoKeys = new Set(
      existingTodos.map((t) => `${t.due_day ?? ''}|${normalize(t.title)}`)
    );

    // Insert calendar entries, skipping anything that already exists on the same day
    for (const entry of calendarEntries) {
      const key = `${entry.day}|${normalize(entry.title)}`;
      if (existingEntryKeys.has(key)) continue;
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

    // Insert todos, skipping anything that already exists with the same due day
    for (const todo of todos) {
      const key = `${todo.due_day ?? ''}|${normalize(todo.title)}`;
      if (existingTodoKeys.has(key)) continue;
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

    // Insert grocery items into the Grocery list, skipping anything already unchecked there
    if (groceryItems.length > 0) {
      const [groceryList] = await sql`SELECT id FROM lists WHERE name = 'Grocery' LIMIT 1`;
      if (groceryList) {
        const existingGroceryItems = await sql`
          SELECT title FROM list_items WHERE list_id = ${groceryList.id} AND completed = false
        `;
        const existingGroceryKeys = new Set(existingGroceryItems.map((i) => normalize(i.title)));
        for (const title of groceryItems) {
          if (existingGroceryKeys.has(normalize(title))) continue;
          await sql`
            INSERT INTO list_items (list_id, title, completed)
            VALUES (${groceryList.id}, ${title}, false)
          `;
        }
      }
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
