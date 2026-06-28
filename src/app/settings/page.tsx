'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FixedExpense, FinanceCategory, FINANCE_CATEGORY_LABELS, FINANCE_CATEGORIES } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Finance state
  const [monthlyTakeHome, setMonthlyTakeHome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [financeSaving, setFinanceSaving] = useState(false);
  const [financeLoading, setFinanceLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data: { content: string }) => setProfile(data.content ?? ''))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/finance/profile')
      .then((res) => res.json())
      .then((data: { monthly_take_home: number; fixed_expenses: FixedExpense[] }) => {
        setMonthlyTakeHome(String(data.monthly_take_home ?? ''));
        setFixedExpenses(data.fixed_expenses ?? []);
      })
      .catch(() => {})
      .finally(() => setFinanceLoading(false));
  }, []);

  const handleEditStart = () => { setDraft(profile); setEditing(true); };
  const handleCancel = () => { setEditing(false); setDraft(''); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      if (res.ok) { setProfile(draft); setEditing(false); setDraft(''); }
    } catch {}
    finally { setSaving(false); }
  };

  function addExpense() {
    setFixedExpenses((prev) => [...prev, { name: '', amount: 0, category: 'bills' }]);
  }

  function removeExpense(i: number) {
    setFixedExpenses((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateExpense(i: number, field: keyof FixedExpense, value: string | number | FinanceCategory) {
    setFixedExpenses((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  async function handleFinanceSave() {
    setFinanceSaving(true);
    try {
      await fetch('/api/finance/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthly_take_home: parseFloat(monthlyTakeHome) || 0,
          fixed_expenses: fixedExpenses.filter((e) => e.name.trim()),
        }),
      });
    } catch {}
    finally { setFinanceSaving(false); }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-12 px-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-800 -ml-1 p-1"
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </div>

      {/* Profile section */}
      <div className="mx-4 mt-6">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">My Profile</p>
        <p className="text-xs text-gray-400 mb-3">
          Claude reads this to personalise your planning. Edit it to teach Claude about your habits,
          preferences, and patterns.
        </p>

        {loading ? (
          <div className="bg-white border border-pink-100 rounded-2xl p-4 flex items-center justify-center min-h-32">
            <div className="w-5 h-5 border-2 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full bg-white border border-pink-200 rounded-2xl p-4 text-sm text-gray-700 min-h-32 resize-none focus:outline-none focus:border-pink-400"
              placeholder="Describe your habits, preferences, and patterns…"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand text-white text-sm font-medium rounded-xl py-2.5 disabled:opacity-50 hover:bg-brand-dark transition-colors">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={handleCancel} disabled={saving} className="flex-1 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl py-2.5 disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-pink-100 rounded-2xl p-4 relative min-h-32">
            <button onClick={handleEditStart} className="absolute top-3 right-4 text-sm text-gray-500 font-medium hover:text-gray-800">
              Edit
            </button>
            {profile ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap pr-10">{profile}</p>
            ) : (
              <p className="text-sm text-gray-400">No profile yet — add your habits and preferences here.</p>
            )}
          </div>
        )}
      </div>

      {/* Finance section */}
      <div className="mx-4 mt-6">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Finance</p>
        <p className="text-xs text-gray-400 mb-3">
          Set your monthly take-home and fixed expenses so Claude can calculate your weekly discretionary budget.
        </p>

        {financeLoading ? (
          <div className="bg-white border border-pink-100 rounded-2xl p-4 flex items-center justify-center min-h-16">
            <div className="w-5 h-5 border-2 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white border border-pink-100 rounded-2xl p-4 space-y-4">
            {/* Monthly take-home */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Monthly take-home (AUD $)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={monthlyTakeHome}
                onChange={(e) => setMonthlyTakeHome(e.target.value)}
                className="w-full border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="e.g. 2500"
              />
            </div>

            {/* Fixed expenses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500">Fixed expenses</label>
                <button
                  onClick={addExpense}
                  className="text-xs font-medium text-brand hover:text-brand-dark"
                >
                  + Add
                </button>
              </div>

              {fixedExpenses.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No fixed expenses yet.</p>
              ) : (
                <div className="space-y-2">
                  {fixedExpenses.map((expense, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={expense.name}
                        onChange={(e) => updateExpense(i, 'name', e.target.value)}
                        placeholder="Name"
                        className="flex-1 min-w-0 border border-pink-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                      <div className="relative w-20 flex-shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={expense.amount || ''}
                          onChange={(e) => updateExpense(i, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full border border-pink-200 rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <select
                        value={expense.category}
                        onChange={(e) => updateExpense(i, 'category', e.target.value as FinanceCategory)}
                        className="flex-shrink-0 border border-pink-200 rounded-lg px-2 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                      >
                        {FINANCE_CATEGORIES.filter((c) => c !== 'income').map((cat) => (
                          <option key={cat} value={cat}>{FINANCE_CATEGORY_LABELS[cat]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeExpense(i)}
                        className="text-gray-300 hover:text-red-400 flex-shrink-0 transition-colors"
                        aria-label="Remove"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleFinanceSave}
              disabled={financeSaving}
              className="w-full bg-brand text-white text-sm font-medium rounded-xl py-2.5 disabled:opacity-50 hover:bg-brand-dark transition-colors"
            >
              {financeSaving ? 'Saving…' : 'Save Finance Settings'}
            </button>
          </div>
        )}
      </div>

      {/* About section */}
      <div className="mx-4 mt-6 mb-8">
        <p className="text-sm text-gray-400">Maisie&apos;s Planner · Personal weekly planning with AI</p>
      </div>
    </div>
  );
}
