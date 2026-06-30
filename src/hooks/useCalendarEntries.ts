'use client';

import { useState, useCallback, useMemo } from 'react';
import type { CalendarEntry } from '@/lib/types';

export function useCalendarEntries(initialEntries: CalendarEntry[] = []) {
  const [entries, setEntries] = useState<CalendarEntry[]>(initialEntries);

  const entriesByDay = useMemo(
    () =>
      entries.reduce<Record<string, CalendarEntry[]>>((acc, e) => {
        (acc[e.day] ??= []).push(e);
        return acc;
      }, {}),
    [entries],
  );

  const updateEntry = useCallback((id: string, patch: Partial<CalendarEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Calls onToggle optimistically, rolls back on failure.
  const checkEntry = useCallback(
    async (id: string, done: boolean, onToggle: (id: string, done: boolean) => void) => {
      onToggle(id, done);
      try {
        const res = await fetch('/api/calendar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, completed: done }),
        });
        if (!res.ok) throw new Error();
      } catch {
        onToggle(id, !done);
      }
    },
    [],
  );

  return { entries, setEntries, entriesByDay, updateEntry, deleteEntry, checkEntry };
}
