'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLAN_SECTIONS, PlanSection, ParsedTransaction, FinanceCategory } from '@/lib/types';
import { getMondayOfWeek } from '@/lib/utils';
import ChatPanel from '@/components/ChatPanel';
import Spinner from '@/components/Spinner';
import TransactionRow from '@/components/TransactionRow';
import DemoNotice from '@/components/DemoNotice';

const TOTAL_STEPS = PLAN_SECTIONS.length + 1; // +1 for finance

export default function PlanPage() {
  const router = useRouter();
  // On Sunday, plan for the coming week (next Monday), not the one that just ended
  const weekStart = (() => {
    const now = new Date();
    if (now.getDay() === 0) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return getMondayOfWeek(tomorrow);
    }
    return getMondayOfWeek();
  })();

  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<Record<PlanSection, string>>({
    exercise: '',
    meals: '',
    todos: '',
    social: '',
    events: '',
  });
  const [showChat, setShowChat] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isFinanceStep = currentStep === PLAN_SECTIONS.length;
  const section = !isFinanceStep ? PLAN_SECTIONS[currentStep] : null;
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  async function saveSection(sectionKey: PlanSection, input: string) {
    if (!input.trim()) return;
    await fetch('/api/plan/section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, section: sectionKey, input }),
    });
  }

  async function handleNext() {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!isFinanceStep && section) {
        await saveSection(section.key, inputs[section.key]);
      }
      if (isLastStep) {
        router.push('/plan/review?weekStart=' + weekStart);
      } else {
        setCurrentStep((s) => s + 1);
        setShowChat(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    if (isLastStep) {
      router.push('/plan/review?weekStart=' + weekStart);
    } else {
      setCurrentStep((s) => s + 1);
      setShowChat(false);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setShowChat(false);
    }
  }

  function handleAddSuggestion(text: string) {
    if (!section) return;
    setInputs((prev) => ({
      ...prev,
      [section.key]: prev[section.key] ? prev[section.key] + '\n' + text : text,
    }));
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-12 px-4 pb-0">
        <h1 className="text-xl font-semibold text-gray-900">Plan your week</h1>
      </div>

      <DemoNotice className="mx-4 mt-3" />

      {/* Progress bar */}
      <div className="mx-4 mt-3">
        <div className="h-1.5 bg-pink-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </p>
      </div>

      {isFinanceStep ? (
        <FinanceStep
          weekStart={weekStart}
          onSkip={handleSkip}
          onDone={() => router.push('/plan/review?weekStart=' + weekStart)}
          onBack={handleBack}
        />
      ) : (
        <>
          {/* Section card */}
          <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-pink-100">
            <h2 className="text-base font-semibold text-gray-900">{section!.label}</h2>
            <p className="text-sm text-gray-500 mt-0.5 mb-3">{section!.prompt}</p>

            <textarea
              className="w-full h-36 text-sm resize-none border border-pink-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand placeholder-gray-400"
              placeholder={`Type anything — this is just for you…`}
              value={inputs[section!.key]}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, [section!.key]: e.target.value }))
              }
            />

            <button
              type="button"
              onClick={() => setShowChat((v) => !v)}
              className="mt-3 w-full h-11 border border-pink-200 rounded-xl text-sm font-medium text-pink-700 flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5L7 0Z" fill="currentColor" />
              </svg>
              Ask Claude
            </button>
          </div>

          {showChat && (
            <div className="mx-4 transition-all duration-200">
              <ChatPanel
                section={section!.key}
                currentInput={inputs[section!.key]}
                userProfile=""
                onAddSuggestion={handleAddSuggestion}
              />
            </div>
          )}

          {/* Nav buttons */}
          <div className="mx-4 mt-4 flex items-center gap-2 pb-24">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="h-11 px-4 rounded-xl text-sm font-medium text-pink-700 border border-pink-200 disabled:opacity-40 hover:bg-pink-50 transition-colors"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="h-11 px-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="ml-auto h-11 px-5 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Spinner />
                  Saving…
                </>
              ) : (
                'Next →'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FinanceStep({
  weekStart,
  onSkip,
  onDone,
  onBack,
}: {
  weekStart: string;
  onSkip: () => void;
  onDone: () => void;
  onBack: () => void;
}) {
  type Stage = 'paste' | 'review';
  const [stage, setStage] = useState<Stage>('paste');
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleParse() {
    if (!rawText.trim()) return;
    setParsing(true);
    setError('');
    try {
      const res = await fetch('/api/finance/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTransactions(data.transactions);
      setStage('review');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setParsing(false);
    }
  }

  function updateCategory(index: number, category: FinanceCategory) {
    setTransactions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], category, confirmed: true };
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, transactions }),
      });
      if (!res.ok) throw new Error();
      onDone();
    } catch {
      setError('Failed to save. Try again.');
      setSaving(false);
    }
  }

  const unconfirmed = transactions.filter((t) => !t.confirmed);
  const confirmed = transactions.filter((t) => t.confirmed);

  return (
    <div className="mx-4 mt-4 pb-24">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 mb-4">
        <h2 className="text-base font-semibold text-gray-900">Finance</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {stage === 'paste'
            ? 'Paste your bank statement to log this week\'s spending.'
            : `${transactions.length} transactions parsed — review and confirm.`}
        </p>
      </div>

      {stage === 'paste' ? (
        <>
          <textarea
            className="w-full h-48 text-sm resize-none border border-pink-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand placeholder-gray-400 font-mono"
            placeholder="Paste bank statement here…"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex items-center gap-2 mt-3">
            <button onClick={onBack} className="h-11 px-4 rounded-xl text-sm font-medium text-pink-700 border border-pink-200 hover:bg-pink-50">
              ← Back
            </button>
            <button onClick={onSkip} className="h-11 px-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
              Skip
            </button>
            <button
              onClick={handleParse}
              disabled={!rawText.trim() || parsing}
              className="ml-auto h-11 px-5 rounded-xl text-sm font-semibold bg-brand text-white disabled:opacity-50 flex items-center gap-2"
            >
              {parsing ? (
                <>
                  <Spinner />
                  Parsing…
                </>
              ) : (
                'Parse →'
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          {unconfirmed.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Needs your input ({unconfirmed.length})
              </p>
              <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
                {unconfirmed.map((t) => (
                  <TransactionRow
                    key={transactions.indexOf(t)}
                    transaction={t}
                    globalIndex={transactions.indexOf(t)}
                    onCategoryChange={updateCategory}
                  />
                ))}
              </div>
            </div>
          )}

          {confirmed.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Confirmed ({confirmed.length})
              </p>
              <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
                {confirmed.map((t) => (
                  <TransactionRow
                    key={transactions.indexOf(t)}
                    transaction={t}
                    globalIndex={transactions.indexOf(t)}
                    onCategoryChange={updateCategory}
                  />
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <div className="flex items-center gap-2">
            <button onClick={() => setStage('paste')} className="h-11 px-4 rounded-xl text-sm font-medium text-pink-700 border border-pink-200 hover:bg-pink-50">
              ← Back
            </button>
            <button onClick={onSkip} className="h-11 px-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
              Skip
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto h-11 px-5 rounded-xl text-sm font-semibold bg-brand text-white disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Spinner />
                  Saving…
                </>
              ) : (
                'Save & Review →'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

