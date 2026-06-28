'use client';

import { useEffect, useState } from 'react';
import type { Nudge, NudgeCategory } from '@/lib/types';
import { getMondayOfWeek } from '@/lib/utils';
import Link from 'next/link';

const NUDGE_DOT: Record<NudgeCategory, string> = {
  todo: 'bg-blue-500',
  social: 'bg-pink-500',
  health: 'bg-green-500',
  errand: 'bg-amber-400',
};

function formatNudgeTime(triggered_at: string) {
  const date = new Date(triggered_at);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function NudgesPage() {
  const weekStart = getMondayOfWeek();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNudges() {
      try {
        const res = await fetch(`/api/nudges?weekStart=${weekStart}`);
        const data = await res.json();
        setNudges(data.nudges ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchNudges();
  }, [weekStart]);

  async function dismissNudge(id: string) {
    setNudges((prev) => prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n)));
    try {
      await fetch('/api/nudges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, dismissed: true }),
      });
    } catch {
      setNudges((prev) => prev.map((n) => (n.id === id ? { ...n, dismissed: false } : n)));
    }
  }

  const active = nudges.filter((n) => !n.dismissed);
  const dismissed = nudges.filter((n) => n.dismissed);

  return (
    <div className="font-sans">
      <div className="pt-12 px-4 pb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-pink-400 uppercase tracking-widest mb-0.5">This week</p>
          <h1 className="text-xl font-semibold text-gray-900">Nudges</h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="mt-1 p-1.5 text-gray-400 hover:text-pink-500 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.1 4.1l1.05 1.05M14.85 14.85l1.05 1.05M4.1 15.9l1.05-1.05M14.85 5.15l1.05-1.05"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>

      <div className="px-4 mt-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-pink-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : active.length === 0 && dismissed.length === 0 ? (
          <div className="mt-12 text-center">
            <div className="flex justify-center mb-3">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-gray-300">
                <path
                  d="M18 5a7 7 0 0 1 4.95 11.95A4.2 4.2 0 0 1 21 19.6V21.5H15v-1.9a4.2 4.2 0 0 1-1.95-2.65A7 7 0 0 1 18 5z"
                  stroke="currentColor" strokeWidth="1.4" fill="none"
                />
                <path d="M15 23h6M16.5 25.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">No nudges yet</p>
            <p className="text-xs text-gray-400">Claude checks in at 8am and 7pm</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {active.map((nudge) => (
                <div
                  key={nudge.id}
                  className="bg-pink-50 border border-pink-100 rounded-2xl p-4 flex items-start gap-3"
                >
                  <span
                    className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${NUDGE_DOT[nudge.category as NudgeCategory] ?? 'bg-gray-400'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{nudge.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatNudgeTime(nudge.triggered_at)}</p>
                  </div>
                  <button
                    onClick={() => dismissNudge(nudge.id)}
                    aria-label="Dismiss nudge"
                    className="shrink-0 text-pink-300 hover:text-pink-500 transition-colors p-0.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {dismissed.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2 px-1">Dismissed</p>
                <div className="space-y-2 opacity-50">
                  {dismissed.map((nudge) => (
                    <div
                      key={nudge.id}
                      className="bg-white border border-pink-100 rounded-2xl p-4 flex items-start gap-3"
                    >
                      <span
                        className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${NUDGE_DOT[nudge.category as NudgeCategory] ?? 'bg-gray-400'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 leading-snug line-through">{nudge.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatNudgeTime(nudge.triggered_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
