'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const from = params.get('from');
      // Only follow same-site relative paths — never an attacker-supplied host.
      router.push(from && from.startsWith('/') && !from.startsWith('//') ? from : '/');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌸</div>
          <h1 className="text-xl font-semibold text-gray-900">
            Maisie&apos;s Planner
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Private. Enter your password to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light transition"
            placeholder="••••••••"
          />

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full mt-4 bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition"
          >
            {loading ? 'Checking…' : 'Unlock'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Looking for the public demo?{' '}
          <a
            href="https://github.com/moffen364/maisie-app"
            className="underline hover:text-gray-600"
          >
            See the repo
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
