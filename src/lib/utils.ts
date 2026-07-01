export function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

export function formatDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function formatShortDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  return m === '00' ? `${displayHour}${ampm}` : `${displayHour}:${m}${ampm}`;
}

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function sortByTime<T extends { time: string | null }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}

export function formatDateRange(startStr: string, endStr: string): string {
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('en-GB', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-GB', { month: 'short' });
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) return `${startDay}–${endDay} ${startMonth}`;
  return `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}

export function groupByDay<T extends { day: string }>(entries: T[]): Record<string, T[]> {
  return entries.reduce<Record<string, T[]>>((acc, e) => {
    (acc[e.day] ??= []).push(e);
    return acc;
  }, {});
}

export function getWeekDays(mondayStr: string): string[] {
  const result: string[] = [];
  const monday = new Date(mondayStr + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}
