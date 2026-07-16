'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Todo } from '@/lib/types';
import { getMondayOfWeek, QUICK_ADD_EVENT } from '@/lib/utils';
import CheckCircleButton from '@/components/CheckCircleButton';
import ListsPanel from '@/components/ListsPanel';

function TodoRow({
  todo,
  onCheck,
}: {
  todo: Todo;
  onCheck: (id: string, completed: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-pink-100 shadow-sm mb-1.5">
      <CheckCircleButton
        checked={todo.completed}
        onClick={() => onCheck(todo.id, !todo.completed)}
      />
      <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {todo.title}
      </span>
    </div>
  );
}

export default function TodosPage() {
  return (
    <Suspense fallback={null}>
      <TodosContent />
    </Suspense>
  );
}

function TodosContent() {
  const weekStart = getMondayOfWeek();
  const searchParams = useSearchParams();
  const tab = searchParams.get('view') === 'lists' ? 'lists' : 'todos';

  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/todos?weekStart=${weekStart}`);
      const data = await res.json();
      setTodos(data.todos ?? []);
    } catch {
      setError('Could not load to-dos. Try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    window.addEventListener(QUICK_ADD_EVENT, fetchTodos);
    return () => window.removeEventListener(QUICK_ADD_EVENT, fetchTodos);
  }, [fetchTodos]);

  async function handleCheck(id: string, completed: boolean) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    try {
      const res = await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
    }
  }

  async function handleAdd() {
    const title = addInput.trim();
    if (!title || adding) return;
    setAdding(true);
    const optimisticId = `temp-${Date.now()}`;
    const optimistic: Todo = { id: optimisticId, week_id: '', title, due_day: null, completed: false };
    setTodos((prev) => [...prev, optimistic]);
    setAddInput('');
    // Clear the DOM value synchronously too: a fast Enter-Enter-Enter can otherwise
    // land the next keystrokes in the input before React's state clear re-renders it,
    // concatenating the next item's text onto this one.
    if (inputRef.current) inputRef.current.value = '';
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, weekStart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setTodos((prev) => prev.map((t) => (t.id === optimisticId ? data.todo : t)));
    } catch {
      setTodos((prev) => prev.filter((t) => t.id !== optimisticId));
      setAddInput(title);
    } finally {
      setAdding(false);
      inputRef.current?.focus();
    }
  }

  const active = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);

  return (
    <div className="font-sans pt-12 pb-28">
      {/* Header */}
      <div className="px-4 mb-3">
        <h1 className="text-xl font-semibold text-gray-900">
          {tab === 'lists' ? 'Lists' : 'To-Dos'}
          {tab === 'todos' && !loading && active.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">{active.length} left</span>
          )}
        </h1>
      </div>

      {tab === 'lists' && (
        <div className="mx-4">
          <ListsPanel />
        </div>
      )}

      {tab === 'todos' && (
        <>
      {/* Inline add */}
      <div className="mx-4 mb-5">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-pink-200 px-3 shadow-sm focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-pink-300">
            <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Add a to-do…"
            className="flex-1 h-11 text-sm bg-transparent focus:outline-none placeholder-gray-400 text-gray-800"
          />
          {addInput.trim() && (
            <button
              onClick={handleAdd}
              disabled={adding}
              className="shrink-0 text-xs font-semibold text-brand disabled:opacity-40"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {error && <p className="mx-4 mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="mx-4 space-y-2 animate-pulse">
          <div className="h-11 bg-pink-100 rounded-xl" />
          <div className="h-11 bg-pink-100 rounded-xl" />
          <div className="h-11 bg-pink-100 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Active todos */}
          <div className="mx-4">
            {active.length === 0 ? (
              <div className="py-8 text-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="mx-auto mb-3 text-gray-200">
                  <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 18l5 5 9-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium text-gray-400">All done for the week</p>
                <p className="text-xs text-gray-300 mt-0.5">Use the field above to add more</p>
              </div>
            ) : (
              active.map((todo) => (
                <TodoRow key={todo.id} todo={todo} onCheck={handleCheck} />
              ))
            )}
          </div>

          {/* Done section */}
          {done.length > 0 && (
            <div className="mx-4 mt-4">
              <button
                onClick={() => setDoneOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-pink-100 shadow-sm text-sm text-gray-400"
              >
                <span className="font-medium">Done this week ({done.length})</span>
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className={`transition-transform duration-200 ${doneOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {doneOpen && (
                <div className="mt-2">
                  {done.map((todo) => (
                    <TodoRow key={todo.id} todo={todo} onCheck={handleCheck} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
        </>
      )}
    </div>
  );
}
