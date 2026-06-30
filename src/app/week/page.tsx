'use client';

import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import type { CalendarEntry } from '@/lib/types';
import { CATEGORY_DOT } from '@/lib/types';
import { formatTime, getTodayStr, sortByTime } from '@/lib/utils';
import { useCalendarEntries } from '@/hooks/useCalendarEntries';
import EntryDetailSheet from '@/components/EntryDetailSheet';
import CheckCircleButton from '@/components/CheckCircleButton';
import QuickAddSheet from '@/components/QuickAddSheet';

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ── Month grid ────────────────────────────────────────────────────────────────
function MonthGrid({
  year,
  month,
  entriesByDay,
  today,
  selectedDay,
  onSelectDay,
}: {
  year: number;
  month: number;
  entriesByDay: Record<string, CalendarEntry[]>;
  today: string;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
}) {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;

  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr });
  }

  return (
    <div className="mb-7">
      <h2 className="text-sm font-semibold text-gray-700 px-4 mb-2">
        {monthName} <span className="font-normal text-gray-400">{year}</span>
      </h2>
      <div className="px-4">
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_LABELS.map((l) => (
            <div key={l} className="text-center text-[10px] text-gray-400 font-medium py-0.5">{l}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} />;
            const { day, dateStr } = cell;
            const dayEntries = entriesByDay[dateStr] ?? [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDay;
            const isPast = dateStr < today;
            return (
              <button
                key={dateStr}
                onClick={() => onSelectDay(dateStr)}
                className="flex flex-col items-center py-1"
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center text-xs rounded-full font-medium
                    ${isSelected
                      ? 'bg-pink-500 text-white'
                      : isToday
                      ? 'bg-pink-100 text-pink-600 font-semibold'
                      : isPast
                      ? 'text-gray-400'
                      : 'text-gray-700'
                    }`}
                >
                  {day}
                </span>
                <div className="flex gap-0.5 mt-0.5 h-1.5">
                  {dayEntries.slice(0, 3).map((e, idx) => (
                    <span key={idx} className={`w-1 h-1 rounded-full ${CATEGORY_DOT[e.category]}`} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Day detail sheet ──────────────────────────────────────────────────────────
function DaySheet({
  dateStr,
  entries,
  onClose,
  onCheckEntry,
  onOpenEntry,
  onAddToDay,
}: {
  dateStr: string | null;
  entries: CalendarEntry[];
  onClose: () => void;
  onCheckEntry: (id: string, done: boolean) => void;
  onOpenEntry: (e: CalendarEntry) => void;
  onAddToDay: () => void;
}) {
  const [displayDateStr, setDisplayDateStr] = useState<string | null>(null);
  const [displayEntries, setDisplayEntries] = useState<CalendarEntry[]>([]);
  const [show, setShow] = useState(false);

  useLayoutEffect(() => {
    if (dateStr) {
      setDisplayDateStr(dateStr);
      setDisplayEntries(entries);
    } else {
      const t = setTimeout(() => {
        setDisplayDateStr(null);
        setDisplayEntries([]);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [dateStr, entries]);

  useEffect(() => {
    if (dateStr) {
      const frame = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setShow(false);
    }
  }, [dateStr]);

  if (!displayDateStr) return null;

  const label = new Date(displayDateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const sorted = sortByTime(displayEntries);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none`}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col pointer-events-auto transition-all duration-200 ease-out ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <button onClick={onClose} className="text-gray-400 active:text-gray-600 -ml-1 p-1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">{label}</h2>
              <button
                onClick={onAddToDay}
                className="flex items-center gap-1 text-sm font-medium text-pink-500 active:text-pink-700"
              >
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="10" y1="4" x2="10" y2="16" strokeLinecap="round" />
                  <line x1="4" y1="10" x2="16" y2="10" strokeLinecap="round" />
                </svg>
                Add
              </button>
            </div>

            {sorted.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-400">Nothing planned</p>
                <p className="text-xs text-gray-300 mt-1">Tap Add to schedule something</p>
              </div>
            ) : (
              sorted.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-pink-100 shadow-sm mb-1.5 cursor-pointer active:bg-brand-faint"
                  onClick={() => onOpenEntry(entry)}
                >
                  <CheckCircleButton
                    checked={entry.completed}
                    onClick={(ev) => { ev.stopPropagation(); onCheckEntry(entry.id, !entry.completed); }}
                    className="shrink-0 w-10 h-10"
                  />
                  <span className={`shrink-0 w-2 h-2 rounded-full ${CATEGORY_DOT[entry.category]}`} />
                  <span className={`flex-1 text-sm truncate ${entry.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {entry.title}
                  </span>
                  {entry.time && (
                    <span className="text-xs text-gray-400 shrink-0">{formatTime(entry.time)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Year loading skeleton ─────────────────────────────────────────────────────
function SkeletonYear() {
  return (
    <div className="animate-pulse px-4 pt-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="mb-7">
          <div className="h-3.5 w-24 bg-pink-100 rounded mb-3" />
          <div className="grid grid-cols-7 mb-1 gap-0.5">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="h-3 bg-pink-50 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: 35 }).map((_, j) => (
              <div key={j} className="flex justify-center py-0.5">
                <div className="w-7 h-7 rounded-full bg-pink-50" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function YearPage() {
  const today = getTodayStr();
  const year = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const { entries, setEntries, entriesByDay, updateEntry, deleteEntry, checkEntry } = useCalendarEntries();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<CalendarEntry | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const from = `${year}-01-01`;
        const to = `${year}-12-31`;
        const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
        const data = await res.json();
        setEntries(data.entries ?? []);
      } catch {
        setError('Could not load data. Try refreshing.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year]);

  useEffect(() => {
    if (!loading && monthRefs.current[currentMonth]) {
      monthRefs.current[currentMonth]?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [loading, currentMonth]);

  const handleToggleEntry = useCallback((id: string, done: boolean) => {
    updateEntry(id, { completed: done });
    setDetailEntry((prev) => prev?.id === id ? { ...prev, completed: done } : prev);
  }, [updateEntry]);

  async function handleCheckEntry(id: string, done: boolean) {
    await checkEntry(id, done, handleToggleEntry);
  }

  function handleDeleteEntry(id: string) {
    deleteEntry(id);
    setDetailEntry(null);
  }

  function handleNotesChange(id: string, notes: string | null) {
    updateEntry(id, { notes });
    setDetailEntry((prev) => prev?.id === id ? { ...prev, notes } : prev);
  }

  function handleQuickAddClose() {
    setShowQuickAdd(false);
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    fetch(`/api/calendar?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => {});
  }

  const selectedEntries = selectedDay ? (entriesByDay[selectedDay] ?? []) : [];

  return (
    <div className="font-sans">
      <div className="pt-12 px-4 pb-3">
        <p className="text-xs font-medium text-pink-400 uppercase tracking-widest mb-0.5">Calendar</p>
        <h1 className="text-xl font-semibold text-gray-900">{year}</h1>
      </div>

      {error && <p className="mx-4 mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <SkeletonYear />
      ) : (
        <div>
          {Array.from({ length: 12 }, (_, m) => (
            <div
              key={m}
              ref={(el) => { monthRefs.current[m] = el; }}
            >
              <MonthGrid
                year={year}
                month={m}
                entriesByDay={entriesByDay}
                today={today}
                selectedDay={selectedDay}
                onSelectDay={(day) => setSelectedDay((prev) => prev === day ? null : day)}
              />
            </div>
          ))}
          <div className="h-4" />
        </div>
      )}

      <DaySheet
        dateStr={selectedDay}
        entries={selectedEntries}
        onClose={() => setSelectedDay(null)}
        onCheckEntry={handleCheckEntry}
        onOpenEntry={(e) => { setDetailEntry(e); }}
        onAddToDay={() => setShowQuickAdd(true)}
      />

      <EntryDetailSheet
        entry={detailEntry}
        onClose={() => setDetailEntry(null)}
        onDelete={handleDeleteEntry}
        onToggle={handleToggleEntry}
        onNotesChange={handleNotesChange}
      />

      <QuickAddSheet
        open={showQuickAdd}
        onClose={handleQuickAddClose}
        targetDate={selectedDay ?? undefined}
      />
    </div>
  );
}
