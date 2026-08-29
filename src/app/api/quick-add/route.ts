import { NextRequest, NextResponse } from 'next/server';
import sql, { getOrCreateWeek, getUserProfile } from '@/lib/db';
import { AI_MODEL, anthropic, parseClaudeJSON } from '@/lib/models';
import { getMondayOfWeek, toDateStr } from '@/lib/utils';
import { LIST_COLOR_ORDER } from '@/lib/types';
import { assertAIEnabled, DemoModeError } from '@/lib/demo';

export async function POST(request: NextRequest) {
  try {
    assertAIEnabled();
    const body = await request.json();
    const { text, targetDate } = body;

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Server runs in UTC; toISOString() would silently roll back to the previous
    // day for Sydney local times before ~10-11am. Format directly in Sydney's zone.
    const now = new Date();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const todayWeekday = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      weekday: 'long',
    }).format(now);
    const anchorDate = targetDate ?? today;
    const weekStart = getMondayOfWeek(new Date(anchorDate + 'T00:00:00'));
    const weekSunday = (() => {
      const d = new Date(weekStart + 'T00:00:00');
      d.setDate(d.getDate() + 6);
      return toDateStr(d);
    })();

    // Spell out each weekday's actual date for the next 14 days so Claude never has
    // to derive "what date is next Tuesday" itself — that arithmetic is exactly what
    // was producing off-by-one day errors even after the prompt stated today's name.
    // Use toDateStr (local-field reads), not toISOString (UTC reads) — construction
    // here is in the server's local time, and mixing local construction with UTC
    // reads is exactly the bug this whole route was already patched for once.
    const upcomingWeekdays = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today + 'T00:00:00');
      d.setDate(d.getDate() + i);
      const label = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'long' }).format(d);
      return `${label} ${toDateStr(d)}`;
    }).join(', ');

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
- isTask: boolean (true only for an undated-feeling errand with no fixed time, e.g. "pick up dry cleaning", "call the bank"; if the text gives a specific time, it's schedule-bound and belongs on the calendar — isTask: false — even if it reads like a chore, e.g. "haircut tomorrow at 11am" or "dentist Thursday 3pm" are calendar entries, not tasks; always false when end_day is set)
- message: string (a short confirmation message — for multi-day: "Trip to Noosa added, 24–26 Aug")

Today is ${todayWeekday}, ${today}.
Dates for the next 14 days, so you never need to calculate a weekday yourself — look up the name mentioned in the text directly: ${upcomingWeekdays}.
${targetDate
  ? `The user has selected ${targetDate} in their calendar — use that as the "day" unless the text clearly specifies a different day.`
  : `The current week runs from ${weekStart} to ${weekSunday}.`}
Always schedule in the future: if a named weekday (e.g. "Tuesday") would fall on or before today, use its occurrence next week instead (still found in the list above, or 7 days after the listed date if not).
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
      const entryWeek = data.day
        ? await getOrCreateWeek(getMondayOfWeek(new Date(data.day + 'T00:00:00')))
        : week;
      await sql`
        INSERT INTO todos (week_id, title, due_day, completed)
        VALUES (${entryWeek.id}, ${data.title}, ${data.day ?? null}, false)
      `;
    } else {
      const entryWeek = await getOrCreateWeek(getMondayOfWeek(new Date(data.day + 'T00:00:00')));
      await sql`
        INSERT INTO calendar_entries (week_id, day, end_day, time, category, title, notes, completed)
        VALUES (
          ${entryWeek.id},
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
    if (error instanceof DemoModeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[POST /api/quick-add]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
