'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FinanceCategory,
  CategoryBudgets,
  Transaction,
  FINANCE_CATEGORY_DOT,
  FINANCE_CATEGORY_LABELS,
  FINANCE_CATEGORIES,
} from '@/lib/types';

interface SummaryData {
  weeklyBudget: number;
  weeklySpend: number;
  transactions: Transaction[];
}

interface MonthlyData {
  breakdown: Record<FinanceCategory, number>;
  monthlyBudget: number;
  categoryBudgets: CategoryBudgets;
}

function formatAUD(amount: number) {
  return `$${amount.toFixed(2).replace(/\.00$/, '')}`;
}

function formatDateHeading(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' });
}

function groupByDay(transactions: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

function SkeletonFinance() {
  return (
    <div className="animate-pulse">
      <div className="mx-4 mt-5">
        <div className="h-2.5 w-16 bg-pink-100 rounded-full mb-2" />
        <div className="bg-white rounded-2xl p-4 border border-pink-100">
          <div className="h-8 w-20 bg-pink-100 rounded-lg mb-1.5" />
          <div className="h-3 w-28 bg-pink-50 rounded mb-3" />
          <div className="h-2.5 bg-pink-50 rounded-full" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-pink-100 flex-shrink-0" />
                <div className="flex-1 h-3 bg-pink-50 rounded" />
                <div className="w-14 h-3 bg-pink-50 rounded" />
                <div className="w-10 h-3 bg-pink-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetBar({ spend, budget }: { spend: number; budget: number }) {
  const pct = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;
  const color = pct < 50 ? 'bg-green-500' : pct < 80 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mt-2">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function FinancePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, monthlyRes] = await Promise.all([
        fetch('/api/finance/summary'),
        fetch('/api/finance/monthly'),
      ]);
      const [summaryData, monthlyData] = await Promise.all([summaryRes.json(), monthlyRes.json()]);
      setSummary(summaryData);
      setMonthly(monthlyData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasTransactions = summary && summary.transactions.length > 0;
  const groups = summary ? groupByDay(summary.transactions) : [];

  const spendCategories = (FINANCE_CATEGORIES.filter((c) => c !== 'income') as FinanceCategory[]);
  const monthlyTotal = monthly
    ? spendCategories.reduce((sum, c) => sum + (monthly.breakdown[c] ?? 0), 0)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-12 px-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Finance</h1>
        <button
          onClick={() => router.push('/finance/import')}
          className="text-sm font-medium text-pink-600 bg-white border border-pink-200 rounded-xl px-3 py-1.5 hover:bg-pink-50 transition-colors"
        >
          Import
        </button>
      </div>

      {loading ? (
        <SkeletonFinance />
      ) : !hasTransactions ? (
        /* Empty state */
        <div className="mx-4 mt-10 bg-white rounded-2xl p-6 border border-pink-100 text-center">
          <p className="text-gray-500 text-sm mb-1">No transactions this week</p>
          <p className="text-gray-400 text-xs mb-4">Import your bank statement to see your spending</p>
          <button
            onClick={() => router.push('/finance/import')}
            className="bg-brand text-white text-sm font-medium rounded-xl px-4 py-2.5"
          >
            Import transactions
          </button>
        </div>
      ) : (
        <>
          {/* This Week */}
          <div className="mx-4 mt-5">
            <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-2">This Week</p>
            <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm">
              <p className="text-3xl font-bold text-gray-900">{formatAUD(summary!.weeklySpend)}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                spent{summary!.weeklyBudget > 0 && ` of ${formatAUD(summary!.weeklyBudget)}`}
              </p>
              {summary!.weeklyBudget > 0 && (
                <BudgetBar spend={summary!.weeklySpend} budget={summary!.weeklyBudget} />
              )}

              <div className="mt-4 space-y-4">
                {groups.map(([date, txns]) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-gray-400 mb-2">{formatDateHeading(date)}</p>
                    <div className="space-y-2">
                      {txns.map((t) => (
                        <div key={t.id} className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${FINANCE_CATEGORY_DOT[t.category]}`} />
                          <span className="flex-1 text-sm text-gray-800 truncate">{t.description}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{FINANCE_CATEGORY_LABELS[t.category]}</span>
                          <span className={`text-sm font-medium flex-shrink-0 ${t.category === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                            {t.category === 'income' ? '+' : ''}{formatAUD(Number(t.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* This Month */}
          {monthly && monthlyTotal > 0 && (
            <div className="mx-4 mt-5 mb-6">
              <p className="text-xs font-semibold text-pink-400 uppercase tracking-widest mb-2">This Month</p>
              <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm">
                <div className="space-y-3">
                  {spendCategories
                    .filter((c) => monthly.breakdown[c] > 0)
                    .sort((a, b) => monthly.breakdown[b] - monthly.breakdown[a])
                    .map((cat) => {
                      const amount = monthly.breakdown[cat];
                      const budget = monthly.categoryBudgets?.[cat];
                      const barPct = budget
                        ? Math.min((amount / budget) * 100, 100)
                        : monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0;
                      const overBudget = budget && amount > budget;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${FINANCE_CATEGORY_DOT[cat]}`} />
                              <span className="text-sm text-gray-700">{FINANCE_CATEGORY_LABELS[cat]}</span>
                            </div>
                            <div className="text-right">
                              {budget ? (
                                <span className={`text-sm font-medium ${overBudget ? 'text-red-500' : 'text-gray-900'}`}>
                                  {formatAUD(amount)} <span className="text-gray-400 font-normal">of {formatAUD(budget)}</span>
                                </span>
                              ) : (
                                <span className="text-sm font-medium text-gray-900">{formatAUD(amount)}</span>
                              )}
                            </div>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${overBudget ? 'bg-red-400' : FINANCE_CATEGORY_DOT[cat]}`}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
