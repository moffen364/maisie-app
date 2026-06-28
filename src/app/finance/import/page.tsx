'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ParsedTransaction, FinanceCategory, FINANCE_CATEGORY_LABELS, FINANCE_CATEGORIES, FINANCE_CATEGORY_DOT } from '@/lib/types';
import { getMondayOfWeek } from '@/lib/utils';

type Stage = 'paste' | 'review';

export default function FinanceImportPage() {
  const router = useRouter();
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
      if (!res.ok) throw new Error('Import failed');
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
      const weekStart = getMondayOfWeek();
      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, transactions }),
      });
      if (!res.ok) throw new Error('Save failed');
      router.push('/finance');
    } catch {
      setError('Failed to save. Try again.');
      setSaving(false);
    }
  }

  const unconfirmed = transactions.filter((t) => !t.confirmed);
  const confirmed = transactions.filter((t) => t.confirmed);

  return (
    <div className="min-h-screen">
      <div className="pt-12 px-4 flex items-center gap-3">
        <button
          onClick={() => (stage === 'review' ? setStage('paste') : router.back())}
          className="text-gray-500 hover:text-gray-800 -ml-1 p-1"
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Import Transactions</h1>
      </div>

      {stage === 'paste' ? (
        <div className="mx-4 mt-5">
          <p className="text-sm text-gray-500 mb-3">
            Paste your bank statement text below. Claude will parse and categorise each transaction.
          </p>
          <textarea
            className="w-full h-64 text-sm resize-none border border-pink-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand placeholder-gray-400 font-mono"
            placeholder="Paste bank statement here…"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => router.back()}
              className="h-11 px-4 rounded-xl text-sm font-medium text-pink-700 border border-pink-200 hover:bg-pink-50"
            >
              Cancel
            </button>
            <button
              onClick={handleParse}
              disabled={!rawText.trim() || parsing}
              className="flex-1 h-11 rounded-xl text-sm font-semibold bg-brand text-white disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors"
            >
              {parsing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Parsing…
                </>
              ) : (
                'Parse with Claude'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-5 pb-24">
          {unconfirmed.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-2">
                Needs your input ({unconfirmed.length})
              </p>
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                {unconfirmed.map((t, i) => (
                  <TransactionRow
                    key={i}
                    transaction={t}
                    globalIndex={transactions.indexOf(t)}
                    onCategoryChange={updateCategory}
                  />
                ))}
              </div>
            </div>
          )}

          {confirmed.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-2">
                Confirmed ({confirmed.length})
              </p>
              <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
                {confirmed.map((t, i) => (
                  <TransactionRow
                    key={i}
                    transaction={t}
                    globalIndex={transactions.indexOf(t)}
                    onCategoryChange={updateCategory}
                  />
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => router.push('/finance')}
              className="h-11 px-4 rounded-xl text-sm font-medium text-pink-700 border border-pink-200 hover:bg-pink-50"
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 rounded-xl text-sm font-semibold bg-brand text-white disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                `Save ${transactions.length} transactions`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionRow({
  transaction,
  globalIndex,
  onCategoryChange,
}: {
  transaction: ParsedTransaction;
  globalIndex: number;
  onCategoryChange: (index: number, category: FinanceCategory) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-pink-50 last:border-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${FINANCE_CATEGORY_DOT[transaction.category]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">{transaction.description}</p>
          <p className="text-xs text-gray-400">{transaction.date}</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`text-xs font-medium px-2 py-1 rounded-lg border flex-shrink-0 ${
            transaction.confirmed
              ? 'text-pink-600 border-pink-200 bg-pink-50'
              : 'text-amber-700 border-amber-200 bg-amber-50'
          }`}
        >
          {FINANCE_CATEGORY_LABELS[transaction.category]}
        </button>
        <span className="text-sm font-medium text-gray-900 flex-shrink-0 ml-1">
          ${Number(transaction.amount).toFixed(2)}
        </span>
      </div>

      {open && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {FINANCE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                onCategoryChange(globalIndex, cat);
                setOpen(false);
              }}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                cat === transaction.category
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300'
              }`}
            >
              {FINANCE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
