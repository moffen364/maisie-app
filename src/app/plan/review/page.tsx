'use client';

import { useState, useEffect, Suspense } from 'react';
import Spinner from '@/components/Spinner';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProposedDay {
  day: string;
  items: string[];
}

interface CalendarEntry {
  day: string;
  time: string | null;
  category: string;
  title: string;
  notes: string | null;
}

interface Todo {
  title: string;
  due_day: string | null;
}

interface ReviewData {
  positives: string[];
  issues: string[];
  proposedWeek: ProposedDay[];
  calendarEntries: CalendarEntry[];
  todos: Todo[];
  groceryItems: string[];
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekStart = searchParams.get('weekStart') ?? '';

  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [appliedIssues, setAppliedIssues] = useState<Set<number>>(new Set());
  const [applyingIssue, setApplyingIssue] = useState<number | null>(null);

  useEffect(() => {
    if (!weekStart) {
      setError('Missing week start date.');
      setLoading(false);
      return;
    }

    fetch('/api/plan/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Review failed');
        return r.json();
      })
      .then((data: ReviewData) => {
        setReview({ ...data, groceryItems: data.groceryItems ?? [] });
      })
      .catch(() => {
        setError('Could not generate your review. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [weekStart]);

  async function handleApplySuggestion(issueIndex: number, issueText: string) {
    if (!review || applyingIssue !== null) return;
    setApplyingIssue(issueIndex);
    try {
      const res = await fetch('/api/plan/apply-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart,
          issueText,
          proposedWeek: review.proposedWeek,
          calendarEntries: review.calendarEntries,
          todos: review.todos,
        }),
      });
      if (!res.ok) throw new Error('Apply failed');
      const updated = await res.json();
      setReview((prev) =>
        prev
          ? {
              ...prev,
              proposedWeek: updated.proposedWeek ?? prev.proposedWeek,
              calendarEntries: updated.calendarEntries ?? prev.calendarEntries,
              todos: updated.todos ?? prev.todos,
            }
          : prev,
      );
      setAppliedIssues((prev) => new Set(prev).add(issueIndex));
    } catch {
      setError('Could not apply suggestion. Please try again.');
    } finally {
      setApplyingIssue(null);
    }
  }

  function handleRemoveGroceryItem(index: number) {
    setReview((prev) =>
      prev ? { ...prev, groceryItems: prev.groceryItems.filter((_, i) => i !== index) } : prev,
    );
  }

  async function handleConfirm() {
    if (confirming || !review) return;
    setConfirming(true);
    try {
      const res = await fetch('/api/plan/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart,
          calendarEntries: review.calendarEntries,
          todos: review.todos,
          groceryItems: review.groceryItems,
        }),
      });
      if (!res.ok) throw new Error('Confirm failed');
      router.push('/');
    } catch {
      setError('Something went wrong. Please try again.');
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Spinner className="w-8 h-8 border-2 border-pink-200 border-t-pink-500" />
        <p className="text-sm text-gray-500">Reviewing your week…</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen pt-12 px-4">
        <h1 className="text-xl font-semibold text-gray-900">Your week review</h1>
        <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-sm text-red-700">{error || 'Something went wrong.'}</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 w-full border border-gray-200 h-12 rounded-xl text-gray-700 font-medium text-sm"
        >
          Go back and adjust
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="pt-12 px-4">
        <h1 className="text-xl font-semibold text-gray-900">Your week review</h1>
      </div>

      {/* What looks good */}
      <div className="mx-4 mt-4 bg-green-50 border border-green-100 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M2 7l3.5 3.5L12 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          What looks good
        </h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {review.positives.map((item, i) => (
            <li key={i} className="text-sm text-green-900 flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* What needs attention */}
      <div className="mx-4 mt-3 bg-orange-50 border border-orange-100 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-orange-800 flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M7 1v6M7 10v1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          What to fix
        </h2>
        {review.issues.length === 0 ? (
          <p className="mt-2 text-sm text-orange-900">Everything looks balanced!</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {review.issues.map((item, i) => {
              const applied = appliedIssues.has(i);
              const applying = applyingIssue === i;
              return (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${applied ? 'text-orange-400 line-through' : 'text-orange-900'}`}>
                      {item}
                    </p>
                    {applied ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-700">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Applied
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplySuggestion(i, item)}
                        disabled={applyingIssue !== null}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-orange-700 border border-orange-300 rounded-lg px-2.5 py-1 bg-white hover:bg-orange-50 transition-colors disabled:opacity-50"
                      >
                        {applying ? (
                          <>
                            <Spinner className="w-3 h-3 border border-orange-400 border-t-transparent" />
                            Applying…
                          </>
                        ) : (
                          'Apply suggestion'
                        )}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Proposed week */}
      {review.proposedWeek.length > 0 && (
        <div className="mx-4 mt-3 bg-white border border-pink-100 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your proposed week</h2>
          <div className="flex flex-col gap-3">
            {review.proposedWeek.map((dayPlan, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-gray-700">{dayPlan.day}</p>
                {dayPlan.items.length === 0 ? (
                  <p className="text-sm text-gray-400 mt-0.5">No plans yet</p>
                ) : (
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {dayPlan.items.map((item, j) => (
                      <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grocery list */}
      {review.groceryItems.length > 0 && (
        <div className="mx-4 mt-3 bg-white border border-pink-100 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Grocery list</h2>
          <ul className="flex flex-col gap-1.5">
            {review.groceryItems.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                <span className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-teal-500 flex-shrink-0" />
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveGroceryItem(i)}
                  aria-label={`Remove ${item}`}
                  className="text-gray-300 hover:text-gray-500 p-1 -mr-1"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTAs */}
      <div className="mx-4 mt-4 flex flex-col gap-3">
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="bg-brand text-white h-12 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {confirming ? (
            <>
              <Spinner />
              Building your week…
            </>
          ) : (
            'Looks good — build my week'
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={confirming}
          className="border border-pink-200 h-12 rounded-xl text-pink-700 font-medium text-sm hover:bg-pink-50 transition-colors disabled:opacity-40"
        >
          Go back and adjust
        </button>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner className="w-8 h-8 border-2 border-pink-200 border-t-pink-500" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
