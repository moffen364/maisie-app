'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { List, ListItem } from '@/lib/types';
import { LIST_PALETTE } from '@/lib/types';
import { QUICK_ADD_EVENT } from '@/lib/utils';
import CheckCircleButton from '@/components/CheckCircleButton';

function ListItemRow({
  item,
  onCheck,
  onDelete,
}: {
  item: ListItem;
  onCheck: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-pink-100 shadow-sm mb-1.5">
      <CheckCircleButton
        checked={item.completed}
        onClick={() => onCheck(item.id, !item.completed)}
      />
      <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {item.title}
      </span>
      <button
        onClick={() => onDelete(item.id)}
        className="text-gray-300 hover:text-red-400 flex-shrink-0 transition-colors"
        aria-label={`Delete ${item.title}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function ListsPanel() {
  const [lists, setLists] = useState<List[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteListId, setConfirmDeleteListId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newListInputRef = useRef<HTMLInputElement>(null);
  const confirmClearTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmDeleteListTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against double-submitting a new list: Enter and the blur that follows
  // it (as the input unmounts) can otherwise both fire, and blur must still save
  // when it's the *only* thing that fired (e.g. tapping away to dismiss a mobile
  // keyboard instead of pressing Enter).
  const addListHandledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (confirmClearTimeout.current) clearTimeout(confirmClearTimeout.current);
      if (confirmDeleteListTimeout.current) clearTimeout(confirmDeleteListTimeout.current);
    };
  }, []);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lists');
      const data = await res.json();
      setLists(data.lists ?? []);
      setItems(data.items ?? []);
      setActiveListId((prev) => prev ?? data.lists?.[0]?.id ?? null);
    } catch {
      setError('Could not load lists. Try refreshing.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    window.addEventListener(QUICK_ADD_EVENT, fetchLists);
    return () => window.removeEventListener(QUICK_ADD_EVENT, fetchLists);
  }, [fetchLists]);

  useEffect(() => {
    if (addingList) newListInputRef.current?.focus();
  }, [addingList]);

  async function handleCheck(id: string, completed: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed } : i)));
    try {
      const res = await fetch('/api/lists/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed: !completed } : i)));
    }
  }

  async function handleAdd() {
    const title = addInput.trim();
    if (!title || adding || !activeListId) return;
    setAdding(true);
    const optimisticId = `temp-${Date.now()}`;
    const optimistic: ListItem = { id: optimisticId, list_id: activeListId, title, completed: false };
    setItems((prev) => [...prev, optimistic]);
    setAddInput('');
    // Clear the DOM value synchronously too: a fast Enter-Enter-Enter can otherwise
    // land the next keystrokes in the input before React's state clear re-renders it,
    // concatenating the next item's text onto this one.
    if (inputRef.current) inputRef.current.value = '';
    try {
      const res = await fetch('/api/lists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: activeListId, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setItems((prev) => prev.map((i) => (i.id === optimisticId ? data.item : i)));
    } catch {
      setItems((prev) => prev.filter((i) => i.id !== optimisticId));
      setAddInput(title);
    } finally {
      setAdding(false);
      inputRef.current?.focus();
    }
  }

  async function handleDeleteItem(id: string) {
    const prevItems = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/lists/items?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prevItems);
      setError('Could not delete item.');
    }
  }

  function submitAddList() {
    if (addListHandledRef.current) return;
    addListHandledRef.current = true;
    handleAddList();
  }

  async function handleAddList() {
    const name = newListName.trim();
    setAddingList(false);
    setNewListName('');
    if (!name) return;
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setLists((prev) => [...prev, data.list]);
      setActiveListId(data.list.id);
    } catch {
      setError('Could not create list. Try again.');
    }
  }

  async function handleClearChecked() {
    if (!activeListId || clearing) return;
    setClearing(true);
    const clearedIds = new Set(items.filter((i) => i.list_id === activeListId && i.completed).map((i) => i.id));
    setItems((prev) => prev.filter((i) => !clearedIds.has(i.id)));
    try {
      const res = await fetch(`/api/lists/items?listId=${activeListId}&completed=true`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setError('Could not clear checked items.');
    } finally {
      setClearing(false);
    }
  }

  function handleClearClick() {
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmClearTimeout.current) clearTimeout(confirmClearTimeout.current);
      confirmClearTimeout.current = setTimeout(() => setConfirmClear(false), 2500);
      return;
    }
    if (confirmClearTimeout.current) clearTimeout(confirmClearTimeout.current);
    setConfirmClear(false);
    handleClearChecked();
  }

  async function handleDeleteList(id: string) {
    const prevLists = lists;
    const prevItems = items;
    const remaining = lists.filter((l) => l.id !== id);
    setLists(remaining);
    setItems((prev) => prev.filter((i) => i.list_id !== id));
    if (activeListId === id) setActiveListId(remaining[0]?.id ?? null);
    try {
      const res = await fetch(`/api/lists?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setLists(prevLists);
      setItems(prevItems);
      setActiveListId(id);
      setError('Could not delete list.');
    }
  }

  function handleDeleteListClick(id: string) {
    if (confirmDeleteListId !== id) {
      setConfirmDeleteListId(id);
      if (confirmDeleteListTimeout.current) clearTimeout(confirmDeleteListTimeout.current);
      confirmDeleteListTimeout.current = setTimeout(() => setConfirmDeleteListId(null), 2500);
      return;
    }
    if (confirmDeleteListTimeout.current) clearTimeout(confirmDeleteListTimeout.current);
    setConfirmDeleteListId(null);
    handleDeleteList(id);
  }

  const activeItems = items.filter((i) => i.list_id === activeListId);
  const active = activeItems.filter((i) => !i.completed);
  const done = activeItems.filter((i) => i.completed);
  const activeList = lists.find((l) => l.id === activeListId);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-9 bg-pink-100 rounded-xl w-2/3" />
        <div className="h-11 bg-pink-100 rounded-xl" />
        <div className="h-11 bg-pink-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      {/* Pill row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {lists.map((list) => {
          const palette = LIST_PALETTE[list.color];
          const isActive = list.id === activeListId;
          const confirmingDelete = confirmDeleteListId === list.id;

          if (!isActive) {
            return (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors bg-white text-gray-500 border-gray-200"
              >
                {list.name}
              </button>
            );
          }

          return (
            <div key={list.id} className={`flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium ${palette.activeBg}`}>
              <button onClick={() => setActiveListId(list.id)} className="max-w-[9rem] truncate">
                {list.name}
              </button>
              <button
                onClick={() => handleDeleteListClick(list.id)}
                aria-label={confirmingDelete ? `Confirm delete ${list.name}` : `Delete ${list.name}`}
                className={`shrink-0 rounded-full transition-colors ${
                  confirmingDelete
                    ? 'px-1.5 text-[11px] font-semibold text-red-600 bg-white/70'
                    : 'w-5 h-5 flex items-center justify-center opacity-50 hover:opacity-90'
                }`}
              >
                {confirmingDelete ? (
                  'Delete?'
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          );
        })}
        {addingList ? (
          <input
            ref={newListInputRef}
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitAddList();
              }
              if (e.key === 'Escape') {
                addListHandledRef.current = true;
                setAddingList(false);
                setNewListName('');
              }
            }}
            onBlur={() => {
              // Tapping elsewhere to dismiss the mobile keyboard blurs this input —
              // treat that as "save what I typed", not "discard it", unless Enter
              // or Escape already handled this submission.
              submitAddList();
            }}
            placeholder="List name"
            className="px-3 py-1.5 rounded-full text-sm border border-pink-200 focus:outline-none focus:ring-2 focus:ring-brand w-28"
          />
        ) : (
          <button
            onClick={() => {
              addListHandledRef.current = false;
              setAddingList(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
            aria-label="Add list"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!activeList ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-gray-400">No lists yet</p>
          <p className="text-xs text-gray-300 mt-0.5">Use the + above to create one</p>
        </div>
      ) : (
        <>
          {/* Inline add */}
          <div className="mb-5">
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
                placeholder={`Add to ${activeList.name}…`}
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

          {/* Active items */}
          {active.length === 0 ? (
            <div className="py-8 text-center">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="mx-auto mb-3 text-gray-200">
                <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 18l5 5 9-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm font-medium text-gray-400">Nothing here yet</p>
              <p className="text-xs text-gray-300 mt-0.5">Use the field above to add items</p>
            </div>
          ) : (
            active.map((item) => <ListItemRow key={item.id} item={item} onCheck={handleCheck} onDelete={handleDeleteItem} />)
          )}

          {/* Checked section */}
          {done.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setDoneOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-pink-100 shadow-sm text-sm text-gray-400"
              >
                <span className="font-medium">Checked ({done.length})</span>
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className={`transition-transform duration-200 ${doneOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {doneOpen && (
                <div className="mt-2">
                  <div className="flex justify-end mb-1.5">
                    <button
                      onClick={handleClearClick}
                      disabled={clearing}
                      className={`text-xs font-semibold disabled:opacity-40 transition-colors ${confirmClear ? 'text-red-500' : 'text-pink-500'}`}
                    >
                      {confirmClear ? 'Tap to confirm' : 'Clear'}
                    </button>
                  </div>
                  {done.map((item) => <ListItemRow key={item.id} item={item} onCheck={handleCheck} onDelete={handleDeleteItem} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
