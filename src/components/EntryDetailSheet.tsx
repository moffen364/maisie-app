'use client';

import { useState, useEffect, useRef } from 'react';
import type { CalendarEntry, Category } from '@/lib/types';
import { CATEGORY_COLORS, CATEGORY_DOT } from '@/lib/types';
import { formatShortDay, formatTime, formatDateRange } from '@/lib/utils';
import { useModalTransition } from '@/hooks/useModalTransition';
import CenteredModal from '@/components/CenteredModal';

interface EntryDetailSheetProps {
  entry: CalendarEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onNotesChange?: (id: string, notes: string | null) => void;
}

const CATEGORY_LABEL: Record<Category, string> = {
  exercise: 'Exercise',
  food: 'Food',
  social: 'Social',
  event: 'Event',
  task: 'Task',
};

export default function EntryDetailSheet({
  entry,
  onClose,
  onDelete,
  onToggle,
  onNotesChange,
}: EntryDetailSheetProps) {
  // Keep displayEntry alive during the close animation
  const [displayEntry, setDisplayEntry] = useState<CalendarEntry | null>(null);
  const { mounted, show } = useModalTransition(entry !== null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (entry) setDisplayEntry(entry);
  }, [entry]);

  useEffect(() => {
    if (!mounted) {
      setDisplayEntry(null);
      setConfirmDelete(false);
      setError(null);
    }
  }, [mounted]);

  // Reset notes when a different entry is opened
  useEffect(() => {
    setNotesValue(displayEntry?.notes ?? '');
    setEditingNotes(false);
  }, [displayEntry?.id]);

  if (!mounted || !displayEntry) return null;

  const colorClasses = CATEGORY_COLORS[displayEntry.category];
  const dotClass = CATEGORY_DOT[displayEntry.category];

  async function handleToggle() {
    if (!displayEntry) return;
    setToggling(true);
    setError(null);
    const newDone = !displayEntry.completed;
    onToggle(displayEntry.id, newDone);
    try {
      const res = await fetch('/api/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: displayEntry.id, completed: newDone }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      onToggle(displayEntry.id, displayEntry.completed);
      setError('Could not update entry. Try again.');
    } finally {
      setToggling(false);
    }
  }

  async function handleSaveNotes() {
    if (!displayEntry) return;
    setEditingNotes(false);
    const trimmed = notesValue.trim();
    const newNotes = trimmed || null;
    if (newNotes === (displayEntry.notes ?? null)) return;
    setNotesSaving(true);
    try {
      await fetch('/api/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: displayEntry.id, notes: newNotes }),
      });
      onNotesChange?.(displayEntry.id, newNotes);
    } catch {
      setError('Could not save notes. Try again.');
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleDelete() {
    if (!displayEntry) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: displayEntry.id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      onDelete(displayEntry.id);
      onClose();
    } catch {
      setError('Could not delete entry. Try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <CenteredModal show={show} onClose={onClose}>
        <div className="p-4 pb-2 flex justify-end">
          <button onClick={onClose} className="text-gray-400 active:text-gray-600 p-1 -mr-1">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="px-4 pb-6 overflow-y-auto flex-1">

        {/* Category badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses} mb-3`}
        >
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          {CATEGORY_LABEL[displayEntry.category]}
        </span>

        {/* Title */}
        <h2
          className={`text-lg font-semibold text-gray-900 mb-1 ${
            displayEntry.completed ? 'line-through text-gray-400' : ''
          }`}
        >
          {displayEntry.title}
        </h2>

        {/* Day + time */}
        <p className="text-sm text-gray-500 mb-3">
          {displayEntry.end_day
            ? formatDateRange(displayEntry.day, displayEntry.end_day)
            : formatShortDay(displayEntry.day) + (displayEntry.time ? ` · ${formatTime(displayEntry.time)}` : '')}
        </p>

        {/* Notes */}
        <div className="mb-4">
          {editingNotes ? (
            <textarea
              ref={notesRef}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Add notes…"
              rows={4}
              className="w-full text-sm text-pink-900 bg-pink-50 border border-pink-200 rounded-xl p-3 leading-relaxed resize-none outline-none focus:border-pink-400 placeholder:text-pink-300"
              autoFocus
            />
          ) : notesValue.trim() ? (
            <button
              onClick={() => { setEditingNotes(true); setTimeout(() => notesRef.current?.focus(), 0); }}
              className="w-full text-left text-sm text-pink-900 bg-pink-50 rounded-xl p-3 leading-relaxed border border-pink-100 group relative"
            >
              <span className="block pr-6 whitespace-pre-wrap">{notesValue.trim()}</span>
              <span className="absolute top-2.5 right-2.5 text-pink-300 group-hover:text-pink-400 transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          ) : (
            <button
              onClick={() => { setEditingNotes(true); setTimeout(() => notesRef.current?.focus(), 0); }}
              className="w-full text-left text-sm text-pink-300 bg-pink-50/60 rounded-xl px-3 py-2.5 border border-dashed border-pink-200 hover:border-pink-300 hover:text-pink-400 transition-colors"
            >
              + Add notes…
            </button>
          )}
          {notesSaving && <p className="text-xs text-pink-400 mt-1 text-right">Saving…</p>}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-2">
          {!displayEntry.end_day && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="w-full py-3 rounded-xl bg-brand text-sm font-semibold text-white active:bg-brand-dark disabled:opacity-50"
            >
              {displayEntry.completed ? 'Mark incomplete' : 'Mark done'}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`w-full mt-2 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              confirmDelete
                ? 'bg-red-50 text-red-700 border border-red-300'
                : 'text-red-500 bg-transparent'
            }`}
          >
            {deleting
              ? 'Deleting…'
              : confirmDelete
              ? 'Tap again to confirm'
              : displayEntry.end_day ? 'Delete event' : 'Delete entry'}
          </button>
        </div>
        </div>
    </CenteredModal>
  );
}
