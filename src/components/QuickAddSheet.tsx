'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/Spinner';
import { useModalTransition } from '@/hooks/useModalTransition';
import CenteredModal from '@/components/CenteredModal';

interface Props {
  open: boolean;
  onClose: () => void;
  targetDate?: string; // YYYY-MM-DD — if set, scopes the add to that day
}

export default function QuickAddSheet({ open, onClose, targetDate }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const { mounted, show } = useModalTransition(open);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Focus synchronously on mount (not via setTimeout) so this stays inside the
  // same task as the tap that opened the sheet — mobile browsers only raise the
  // on-screen keyboard for a programmatic focus() if it's tied to the user gesture.
  useLayoutEffect(() => {
    if (mounted) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) {
      setInput('');
      setToast('');
    }
  }, [mounted]);

  async function handleSubmit() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim(), ...(targetDate && { targetDate }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setToast(data.message || 'Added!');
      setInput('');
      setTimeout(() => {
        onClose();
        setToast('');
      }, 1800);
    } catch {
      setToast('Something went wrong — try again');
    } finally {
      setLoading(false);
    }
  }

  function handlePlanTab() {
    onClose();
    router.push('/plan');
  }

  if (!mounted) return null;

  return (
    <CenteredModal show={show} onClose={onClose} maxHeight="max-h-[80vh]">
        <div className="p-4">
          {/* Tab bar — only when not scoped to a specific day */}
          {!targetDate && (
            <div className="flex items-center justify-between border-b border-pink-100 mb-4 -mx-4 px-4">
              <div className="flex">
                <span className="pb-2 mr-6 text-sm font-semibold border-b-2 border-brand text-brand -mb-px">
                  Quick Add
                </span>
                <button
                  onClick={handlePlanTab}
                  className="pb-2 text-sm font-semibold border-b-2 border-transparent text-gray-400 -mb-px hover:text-gray-600 transition-colors"
                >
                  Plan my week
                </button>
              </div>
              <button onClick={onClose} className="text-gray-400 active:text-gray-600 p-1 mb-2 -mr-1">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}

          {targetDate && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-pink-500">
                {new Date(targetDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
              <button onClick={onClose} className="text-gray-400 active:text-gray-600 p-1 -mr-1">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}

          {toast ? (
            <div className="py-6 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10.5l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 text-center">{toast}</p>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="e.g. pick up dry cleaning tomorrow, dentist Thursday 3pm"
                className="w-full h-24 text-sm resize-none border border-pink-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-gray-400"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || loading}
                className="mt-3 w-full h-11 bg-brand text-white text-sm font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Adding…
                  </>
                ) : (
                  'Add'
                )}
              </button>
            </>
          )}
        </div>
    </CenteredModal>
  );
}
