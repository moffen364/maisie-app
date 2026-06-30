'use client';

import { useState } from 'react';
import type { ParsedTransaction, FinanceCategory } from '@/lib/types';
import { FINANCE_CATEGORY_DOT, FINANCE_CATEGORY_LABELS, FINANCE_CATEGORIES } from '@/lib/types';

export default function TransactionRow({
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
              onClick={() => { onCategoryChange(globalIndex, cat); setOpen(false); }}
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
