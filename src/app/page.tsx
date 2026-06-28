'use client';

import { useEffect, useState, useCallback } from 'react';
import type { CalendarEntry, Todo, Nudge } from '@/lib/types';
import { CATEGORY_DOT } from '@/lib/types';
import { getMondayOfWeek, formatShortDay, formatTime, getTodayStr, getWeekDays } from '@/lib/utils';
import EntryDetailSheet from '@/components/EntryDetailSheet';
import Link from 'next/link';

function SkeletonCard() {
  return (
    <div className="mx-4 mb-4 animate-pulse">
      <div className="h-14 bg-pink-100 rounded-t-2xl" />
      <div className="bg-white rounded-b-2xl border border-pink-100 p-3">
        <div className="h-8 bg-brand-faint rounded-xl mb-2" />
        <div className="h-8 bg-brand-faint rounded-xl" />
      </div>
    </div>
  );
}

function EntryPill({
  entry,
  onOpen,
  onCheck,
}: {
  entry: CalendarEntry;
  onOpen: (e: CalendarEntry) => void;
  onCheck: (id: string, done: boolean) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-pink-100 shadow-sm mb-1.5 cursor-pointer active:bg-brand-faint"
      onClick={() => onOpen(entry)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onCheck(entry.id, !entry.completed); }}
        className="shrink-0 w-11 h-11 flex items-center justify-center -ml-2"
        aria-label={entry.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {entry.completed ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill="#22c55e" />
            <path d="M5.5 10.5l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="#d1d5db" strokeWidth="1.5" />
          </svg>
        )}
      </button>
      <span className={`shrink-0 w-2 h-2 rounded-full ${CATEGORY_DOT[entry.category]}`} />
      <span className={`flex-1 text-sm truncate ${entry.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {entry.title}
      </span>
      {entry.time && (
        <span className="text-xs text-gray-400 shrink-0">{formatTime(entry.time)}</span>
      )}
    </div>
  );
}

function TodayCard({
  day,
  entries,
  onOpenEntry,
  onCheckEntry,
}: {
  day: string;
  entries: CalendarEntry[];
  onOpenEntry: (e: CalendarEntry) => void;
  onCheckEntry: (id: string, done: boolean) => void;
}) {
  const label = new Date(day + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const sorted = [...entries].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="mx-4 mb-5 rounded-2xl overflow-hidden shadow-sm border border-pink-200">
      <div className="bg-brand px-4 pt-4 pb-3">
        <p className="text-[11px] font-semibold text-white/70 uppercase tracking-widest mb-0.5">Today</p>
        <p className="text-2xl font-bold text-white leading-tight">{label}</p>
      </div>
      <div className="bg-white px-3 pt-3 pb-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 py-2 text-center">Nothing scheduled — enjoy the free time</p>
        ) : (
          sorted.map((entry) => (
            <EntryPill key={entry.id} entry={entry} onOpen={onOpenEntry} onCheck={onCheckEntry} />
          ))
        )}
      </div>
    </div>
  );
}

function FutureDay({
  day,
  entries,
  onOpenEntry,
  onCheckEntry,
}: {
  day: string;
  entries: CalendarEntry[];
  onOpenEntry: (e: CalendarEntry) => void;
  onCheckEntry: (id: string, done: boolean) => void;
}) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="mx-4 mb-4">
      <p className="text-sm font-medium text-gray-400 mb-2">{formatShortDay(day)}</p>
      {sorted.map((entry) => (
        <EntryPill key={entry.id} entry={entry} onOpen={onOpenEntry} onCheck={onCheckEntry} />
      ))}
    </div>
  );
}

function PastDaysDropdown({
  days,
  entriesByDay,
  onOpenEntry,
  onCheckEntry,
}: {
  days: string[];
  entriesByDay: Record<string, CalendarEntry[]>;
  onOpenEntry: (e: CalendarEntry) => void;
  onCheckEntry: (id: string, done: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  if (days.length === 0) return null;

  const labels = days.map((d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })
  );

  return (
    <div className="mx-4 mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-pink-100 shadow-sm text-sm text-gray-400"
      >
        <span className="font-medium">{labels.join(' · ')}</span>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 space-y-4">
          {days.map((day) => {
            const dayEntries = entriesByDay[day] ?? [];
            if (dayEntries.length === 0) return null;
            const sorted = [...dayEntries].sort((a, b) => {
              if (!a.time && !b.time) return 0;
              if (!a.time) return 1;
              if (!b.time) return -1;
              return a.time.localeCompare(b.time);
            });
            return (
              <div key={day}>
                <p className="text-sm font-medium text-gray-400 mb-2">{formatShortDay(day)}</p>
                {sorted.map((entry) => (
                  <EntryPill key={entry.id} entry={entry} onOpen={onOpenEntry} onCheck={onCheckEntry} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TodosPanel({
  todos,
  onCheck,
}: {
  todos: Todo[];
  onCheck: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none">
      <div className="w-full max-w-lg bg-white border-t border-pink-100 shadow-[0_-8px_24px_rgba(219,39,119,0.08)] pointer-events-auto">
        <div className="w-10 h-1 bg-pink-200 rounded-full mx-auto mt-3 mb-2" />
        <div className="px-4 pb-1 flex items-center justify-between">
          <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest">To-Dos</p>
          {todos.length > 0 && (
            <span className="text-xs text-gray-400">{todos.length} remaining</span>
          )}
        </div>
        <div className="overflow-y-auto px-4 pb-16" style={{ maxHeight: '200px' }}>
          {todos.length === 0 ? (
            <p className="py-4 text-sm text-center text-gray-400">All done for the week</p>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 px-3 py-2 mb-1.5 bg-white rounded-xl border border-pink-100 shadow-sm"
              >
                <button
                  onClick={() => onCheck(todo.id)}
                  className="shrink-0 w-10 h-10 flex items-center justify-center -ml-2"
                  aria-label="Complete todo"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="#d1d5db" strokeWidth="1.5" />
                  </svg>
                </button>
                <span className="text-sm text-gray-800 flex-1 truncate">{todo.title}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function WeekPage() {
  const weekStart = getMondayOfWeek();
  const today = getTodayStr();
  const days = getWeekDays(weekStart);

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [calRes, todoRes, nudgeRes] = await Promise.all([
          fetch(`/api/calendar?weekStart=${weekStart}`),
          fetch(`/api/todos?weekStart=${weekStart}`),
          fetch(`/api/nudges?weekStart=${weekStart}`),
        ]);
        const [calData, todoData, nudgeData] = await Promise.all([
          calRes.json(), todoRes.json(), nudgeRes.json(),
        ]);
        setEntries(calData.entries ?? []);
        setTodos(todoData.todos ?? []);
        setNudges(nudgeData.nudges ?? []);
      } catch {
        setError('Could not load data. Try refreshing.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [weekStart]);

  async function dismissNudge(id: string) {
    setNudges((prev) => prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n)));
    try {
      await fetch('/api/nudges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, dismissed: true }),
      });
    } catch { /* silently fail */ }
  }

  const handleToggleEntry = useCallback((id: string, done: boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, completed: done } : e)));
    setSelectedEntry((prev) => prev && prev.id === id ? { ...prev, completed: done } : prev);
  }, []);

  async function handleCheckEntry(id: string, done: boolean) {
    handleToggleEntry(id, done);
    try {
      const res = await fetch('/api/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: done }),
      });
      if (!res.ok) throw new Error();
    } catch {
      handleToggleEntry(id, !done);
    }
  }

  function handleDeleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleNotesChange(id: string, notes: string | null) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, notes } : e)));
    setSelectedEntry((prev) => prev && prev.id === id ? { ...prev, notes } : prev);
  }

  async function handleCheckTodo(id: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)));
    try {
      const res = await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: true }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: false } : t)));
    }
  }

  const activeNudge = nudges.filter((n) => !n.dismissed)
    .sort((a, b) => b.triggered_at.localeCompare(a.triggered_at))[0] ?? null;

  const activeTodos = todos.filter((t) => !t.completed);

  const entriesByDay = entries.reduce<Record<string, CalendarEntry[]>>((acc, e) => {
    if (!acc[e.day]) acc[e.day] = [];
    acc[e.day].push(e);
    return acc;
  }, {});

  const pastDays = days.filter((d) => d < today);
  const futureDays = days.filter((d) => d > today);

  const weekRangeLabel = (() => {
    const first = new Date(weekStart + 'T00:00:00');
    const last = new Date(weekStart + 'T00:00:00');
    last.setDate(last.getDate() + 6);
    return `${first.toLocaleDateString('en-GB', { day: 'numeric' })}–${last.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  })();

  return (
    <div className="font-sans">
      <div className="pt-12 px-4 pb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-pink-400 uppercase tracking-widest mb-0.5">This week</p>
          <h1 className="text-xl font-semibold text-gray-900">{weekRangeLabel}</h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="mt-1 p-1.5 text-gray-400 hover:text-pink-500 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.1 4.1l1.05 1.05M14.85 14.85l1.05 1.05M4.1 15.9l1.05-1.05M14.85 5.15l1.05-1.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>

      {!loading && activeNudge && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl mx-4 mt-3 p-3 flex items-start gap-2 text-sm text-pink-700">
          <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1a5 5 0 0 1 3.536 8.536A3 3 0 0 1 10 11.5V13H6v-1.5a3 3 0 0 1-1.536-1.964A5 5 0 0 1 8 1z" stroke="#db2777" strokeWidth="1.2" fill="none" />
            <path d="M6 14h4" stroke="#db2777" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <p className="flex-1 leading-snug">{activeNudge.message}</p>
          <button
            onClick={() => dismissNudge(activeNudge.id)}
            aria-label="Dismiss nudge"
            className="shrink-0 text-pink-400 hover:text-pink-600 leading-none text-base"
          >×</button>
        </div>
      )}

      {error && <p className="mx-4 mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 pb-[260px]">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            {/* Past days — collapsed by default */}
            <PastDaysDropdown
              days={pastDays}
              entriesByDay={entriesByDay}
              onOpenEntry={setSelectedEntry}
              onCheckEntry={handleCheckEntry}
            />

            {/* Today — featured card */}
            {days.includes(today) && (
              <TodayCard
                day={today}
                entries={entriesByDay[today] ?? []}
                onOpenEntry={setSelectedEntry}
                onCheckEntry={handleCheckEntry}
              />
            )}

            {/* Future days */}
            {futureDays.map((day) => (
              <FutureDay
                key={day}
                day={day}
                entries={entriesByDay[day] ?? []}
                onOpenEntry={setSelectedEntry}
                onCheckEntry={handleCheckEntry}
              />
            ))}

            {entries.length === 0 && (
              <div className="mx-4 mt-2 bg-white rounded-2xl border border-pink-100 p-6 text-center">
                <div className="flex justify-center mb-3">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-gray-300">
                    <rect x="4" y="6" width="28" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="4" y1="13" x2="32" y2="13" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="12" y1="3" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="24" y1="3" x2="24" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Nothing planned this week</p>
                <p className="text-xs text-gray-400">Head to <span className="font-semibold">Plan</span> to set up your week</p>
              </div>
            )}
          </>
        )}
      </div>

      <EntryDetailSheet
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onDelete={handleDeleteEntry}
        onToggle={handleToggleEntry}
        onNotesChange={handleNotesChange}
      />

      <TodosPanel todos={activeTodos} onCheck={handleCheckTodo} />
    </div>
  );
}
