'use client';

import { useEffect, useState, useCallback } from 'react';
import type { CalendarEntry, Nudge } from '@/lib/types';
import { CATEGORY_DOT } from '@/lib/types';
import { getMondayOfWeek, formatShortDay, formatTime, getTodayStr, getWeekDays, sortByTime } from '@/lib/utils';
import { useCalendarEntries } from '@/hooks/useCalendarEntries';
import EntryDetailSheet from '@/components/EntryDetailSheet';
import CheckCircleButton from '@/components/CheckCircleButton';
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
      <CheckCircleButton
        checked={entry.completed}
        onClick={(e) => { e.stopPropagation(); onCheck(entry.id, !entry.completed); }}
      />
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

  const sorted = sortByTime(entries);

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

  const sorted = sortByTime(entries);
  const date = new Date(day + 'T00:00:00');
  const weekdayLabel = date.toLocaleDateString('en-GB', { weekday: 'short' });
  const dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="mx-4 mb-4">
      <div className="mb-2.5">
        <p className="text-[10px] font-semibold text-pink-400 uppercase tracking-widest mb-0.5">{weekdayLabel}</p>
        <p className="text-base font-semibold text-gray-800">{dateLabel}</p>
      </div>
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
            return (
              <div key={day}>
                <p className="text-sm font-medium text-gray-400 mb-2">{formatShortDay(day)}</p>
                {sortByTime(dayEntries).map((entry) => (
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

export default function WeekPage() {
  const weekStart = getMondayOfWeek();
  const today = getTodayStr();
  const days = getWeekDays(weekStart);

  const { entries, setEntries, entriesByDay, updateEntry, deleteEntry, checkEntry } = useCalendarEntries();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [calRes, nudgeRes] = await Promise.all([
          fetch(`/api/calendar?weekStart=${weekStart}`),
          fetch(`/api/nudges?weekStart=${weekStart}`),
        ]);
        const [calData, nudgeData] = await Promise.all([
          calRes.json(), nudgeRes.json(),
        ]);
        setEntries(calData.entries ?? []);
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
    updateEntry(id, { completed: done });
    setSelectedEntry((prev) => prev?.id === id ? { ...prev, completed: done } : prev);
  }, [updateEntry]);

  async function handleCheckEntry(id: string, done: boolean) {
    await checkEntry(id, done, handleToggleEntry);
  }

  function handleDeleteEntry(id: string) {
    deleteEntry(id);
  }

  function handleNotesChange(id: string, notes: string | null) {
    updateEntry(id, { notes });
    setSelectedEntry((prev) => prev?.id === id ? { ...prev, notes } : prev);
  }

  const activeNudge = nudges.filter((n) => !n.dismissed)
    .sort((a, b) => b.triggered_at.localeCompare(a.triggered_at))[0] ?? null;

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

      <div className="mt-4 pb-28">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <PastDaysDropdown
              days={pastDays}
              entriesByDay={entriesByDay}
              onOpenEntry={setSelectedEntry}
              onCheckEntry={handleCheckEntry}
            />

            {days.includes(today) && (
              <TodayCard
                day={today}
                entries={entriesByDay[today] ?? []}
                onOpenEntry={setSelectedEntry}
                onCheckEntry={handleCheckEntry}
              />
            )}

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
                <p className="text-xs text-gray-400">Tap <span className="font-semibold">+</span> to plan your week</p>
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
    </div>
  );
}
