import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

export async function getOrCreateWeek(weekStart: string): Promise<{ id: string; week_start: string }> {
  const existing = await sql`
    SELECT id, week_start::text FROM weeks WHERE week_start = ${weekStart}
  `;
  if (existing.length > 0) return existing[0] as { id: string; week_start: string };

  const created = await sql`
    INSERT INTO weeks (week_start) VALUES (${weekStart}::date)
    RETURNING id, week_start::text
  `;
  return created[0] as { id: string; week_start: string };
}

export function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export async function getUserProfile(): Promise<string> {
  const rows = await sql`SELECT content FROM user_profile LIMIT 1`;
  return rows[0]?.content ?? '';
}

export async function updateUserProfile(content: string): Promise<void> {
  const existing = await sql`SELECT id FROM user_profile LIMIT 1`;
  if (existing.length > 0) {
    await sql`UPDATE user_profile SET content = ${content}, updated_at = NOW() WHERE id = ${existing[0].id}`;
  } else {
    await sql`INSERT INTO user_profile (content) VALUES (${content})`;
  }
}
