'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  targetDate?: string; // YYYY-MM-DD — if set, scopes the add to that day
}

export default function QuickAddSheet({ open, onClose, targetDate }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
      setTimeout(() => textareaRef.current?.focus(), 150);
      return () => cancelAnimationFrame(frame);
    } else {
      setShow(false);
      const t = setTimeout(() => {
        setMounted(false);
        setInput('');
        setToast('');
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

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
    } catch (err) {
      setToast('Something went wrong — try again');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className={`fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl safe-area-pb transition-transform duration-300 ease-out ${show ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="p-4">
          {/* Handle */}
          <div className="w-10 h-1 bg-pink-200 rounded-full mx-auto mb-4" />

          <h2 className={`text-base font-semibold text-gray-900 ${targetDate ? 'mb-0.5' : 'mb-3'}`}>Quick add</h2>
          {targetDate && (
            <p className="text-xs text-pink-500 mb-3">
              {new Date(targetDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
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
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding…
                  </>
                ) : (
                  'Add'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
