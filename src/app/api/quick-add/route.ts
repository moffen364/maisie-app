import { NextRequest, NextResponse } from 'next/server';
import sql, { getOrCreateWeek, getUserProfile } from '@/lib/db';
import { AI_MODEL, anthropic, parseClaudeJSON } from '@/lib/models';
import { getMondayOfWeek } from '@/lib/utils';
import { LIST_COLOR_ORDER } from '@/lib/types';

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

    const [calendarRows, profile, lists, listItems] = await Promise.all([
      sql`
        SELECT day::text, time::text, category, title
        FROM calendar_entries
        WHERE week_id = ${week.id}
        ORDER BY day, time NULLS LAST
      `,
      getUserProfile(),
      sql`SELECT id, name FROM lists ORDER BY sort_order`,
      sql`SELECT list_id, title FROM list_items WHERE completed = false`,
    ]);

    const calendarSummary = calendarRows.length > 0
      ? calendarRows
          .map(e => `${e.day} ${e.time ?? 'no time'}: ${e.category} — ${e.title}`)
          .join('\n')
      : 'No entries yet this week.';

    const listsSummary = lists.length > 0
      ? lists
          .map((l) => {
            const openItems = listItems.filter((i) => i.list_id === l.id).map((i) => i.title);
            return `- ${l.name}: ${openItems.length > 0 ? openItems.join(', ') : '(empty)'}`;
          })
          .join('\n')
      : 'No lists yet.';

    const systemPrompt = `You are a personal assistant for Maisie. Parse the following natural language input and return a JSON object.

User profile:
${profile || 'No profile yet.'}

Current week's calendar:
${calendarSummary}

Existing lists and their open (unchecked) items:
${listsSummary}

First, decide: is this adding one or more items to a list (e.g. groceries, top-ups, wishlist items — "add milk, eggs, and bread", "need more dog food"), or a calendar/task entry (an event, appointment, or to-do with a day)?

If it's list items, return a JSON object with these fields:
- isListItem: true
- listName: string (match an existing list by name if it clearly fits, e.g. groceries/food items go to "Grocery"; otherwise pick a short sensible new list name)
- items: string[] (one entry per item mentioned — split "milk, eggs, and bread" into 3 items)
- message: string (a short confirmation, e.g. "Added milk, eggs, bread to Grocery")

Otherwise, return a JSON object with these fields:
- isListItem: false
- title: string (concise title for the entry)
- category: one of "exercise", "food", "social", "event", "task"
- day: YYYY-MM-DD (start date — use context and "tomorrow", "Thursday", "24th August" etc to determine)
- end_day: YYYY-MM-DD or null — ONLY set for multi-day events spanning more than one day (e.g. "trip to Noosa 24–26 Aug" → end_day: "2026-08-26"). Must be after "day". null for all other entries.
- time: HH:MM or null (always null when end_day is set)
- notes: string or null
- isTask: boolean (true if this is a to-do/errand rather than a calendar entry; always false when end_day is set)
- message: string (a short confirmation message — for multi-day: "Trip to Noosa added, 24–26 Aug")

${targetDate
  ? `The user has selected ${targetDate} in their calendar — use that as the "day" unless the text clearly specifies a different day.`
  : `Today is ${today}. The current week runs from ${weekStart} to ${weekSunday}.`}
Always schedule in the future: if a named weekday (e.g. "Tuesday") would fall on or before today, use next week's occurrence.
Respond with ONLY valid JSON, no markdown.`;

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from Claude' }, { status: 500 });
    }

    let data: {
      isListItem?: boolean;
      listName?: string;
      items?: string[];
      title: string;
      category: string;
      day: string;
      end_day: string | null;
      time: string | null;
      notes: string | null;
      isTask: boolean;
      message: string;
    };

    try {
      data = parseClaudeJSON(rawContent.text);
    } catch {
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 });
    }

    if (data.isListItem) {
      const items = (data.items ?? []).map((s) => s.trim()).filter(Boolean);
      if (!data.listName || items.length === 0) {
        return NextResponse.json({ error: 'Claude did not return list items' }, { status: 500 });
      }

      let list = lists.find((l) => l.name.toLowerCase() === data.listName!.trim().toLowerCase());
      if (!list) {
        const nextSortOrder = lists.length > 0 ? Math.max(...(await sql`SELECT sort_order FROM lists`).map((l) => l.sort_order)) + 1 : 0;
        const nextColor = LIST_COLOR_ORDER[lists.length % LIST_COLOR_ORDER.length];
        const [created] = await sql`
          INSERT INTO lists (name, color, sort_order)
          VALUES (${data.listName.trim()}, ${nextColor}, ${nextSortOrder})
          RETURNING id, name
        `;
        list = created as { id: string; name: string };
      }

      for (const title of items) {
        await sql`
          INSERT INTO list_items (list_id, title, completed)
          VALUES (${list.id}, ${title}, false)
        `;
      }
    } else if (data.isTask) {
      await sql`
        INSERT INTO todos (week_id, title, due_day, completed)
        VALUES (${week.id}, ${data.title}, ${data.day ?? null}, false)
      `;
    } else {
      await sql`
        INSERT INTO calendar_entries (week_id, day, end_day, time, category, title, notes, completed)
        VALUES (
          ${week.id},
          ${data.day}::date,
          ${data.end_day ?? null},
          ${data.end_day ? null : (data.time ?? null)},
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
