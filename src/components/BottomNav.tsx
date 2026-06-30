'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import QuickAddSheet from './QuickAddSheet';

const ACTIVE_COLOR = '#db2777';
const INACTIVE_COLOR = '#9ca3af';

function WeekIcon({ active }: { active: boolean }) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      {/* Calendar frame */}
      <rect x="2" y="3" width="20" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <line x1="2" y1="8" x2="22" y2="8" stroke={color} strokeWidth="1" />
      <line x1="7" y1="1.5" x2="7" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="1.5" x2="17" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* 7 day cells — today (4th) is taller and fully opaque */}
      <rect x="3.5" y="10.5" width="1.6" height="7" rx="0.8" fill={color} opacity="0.35" />
      <rect x="5.9" y="10.5" width="1.6" height="7" rx="0.8" fill={color} opacity="0.35" />
      <rect x="8.3" y="10.5" width="1.6" height="7" rx="0.8" fill={color} opacity="0.35" />
      <rect x="10.7" y="9.5" width="2.6" height="9" rx="1" fill={color} />
      <rect x="13.9" y="10.5" width="1.6" height="7" rx="0.8" fill={color} opacity="0.25" />
      <rect x="16.3" y="10.5" width="1.6" height="7" rx="0.8" fill={color} opacity="0.25" />
      <rect x="18.7" y="10.5" width="1.6" height="7" rx="0.8" fill={color} opacity="0.25" />
    </svg>
  );
}

function YearGridIcon({ active }: { active: boolean }) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      {/* 4 rows × 3 cols = 12 months */}
      <rect x="2" y="2" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.85" />
      <rect x="9.25" y="2" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.85" />
      <rect x="16.5" y="2" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.85" />
      <rect x="2" y="7.5" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.65" />
      <rect x="9.25" y="7.5" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.65" />
      <rect x="16.5" y="7.5" width="5.5" height="4.5" rx="0.8" fill={color} />
      <rect x="2" y="13" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.35" />
      <rect x="9.25" y="13" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.35" />
      <rect x="16.5" y="13" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.35" />
      <rect x="2" y="18.5" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.15" />
      <rect x="9.25" y="18.5" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.15" />
      <rect x="16.5" y="18.5" width="5.5" height="4.5" rx="0.8" fill={color} opacity="0.15" />
    </svg>
  );
}

function TodosIcon({ active }: { active: boolean }) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      {/* Circle checkbox — checked */}
      <circle cx="5" cy="6" r="2" stroke={color} strokeWidth="1.5" />
      <path d="M3.8 6l.9.9 1.8-1.8" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Circle checkbox — unchecked */}
      <circle cx="5" cy="12" r="2" stroke={color} strokeWidth="1.5" opacity="0.7" />
      {/* Circle checkbox — unchecked */}
      <circle cx="5" cy="18" r="2" stroke={color} strokeWidth="1.5" opacity="0.4" />
      {/* Text lines */}
      <line x1="10" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="10" y1="18" x2="18" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function FinanceIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke={active ? ACTIVE_COLOR : INACTIVE_COLOR} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v1m0 8v1m-3.5-5h5a1.5 1.5 0 010 3H10a1.5 1.5 0 010-3h1m0 0V9.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-pink-100 safe-area-pb z-40">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <WeekIcon active={pathname === '/'} />
            <span className={`text-[10px] font-medium ${pathname === '/' ? 'text-pink-600' : 'text-gray-400'}`}>
              Week
            </span>
          </Link>

          <Link
            href="/week"
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <YearGridIcon active={pathname === '/week'} />
            <span className={`text-[10px] font-medium ${pathname === '/week' ? 'text-pink-600' : 'text-gray-400'}`}>
              Year
            </span>
          </Link>

          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center justify-center w-12 h-12 bg-brand rounded-full shadow-lg shadow-pink-200 -mt-4"
            aria-label="Quick add"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-6 h-6">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <Link
            href="/todos"
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <TodosIcon active={pathname === '/todos'} />
            <span className={`text-[10px] font-medium ${pathname === '/todos' ? 'text-pink-600' : 'text-gray-400'}`}>
              To-Dos
            </span>
          </Link>

          <Link
            href="/finance"
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <FinanceIcon active={pathname === '/finance' || pathname.startsWith('/finance/')} />
            <span className={`text-[10px] font-medium ${pathname === '/finance' || pathname.startsWith('/finance/') ? 'text-pink-600' : 'text-gray-400'}`}>
              Finance
            </span>
          </Link>
        </div>
      </nav>

      <QuickAddSheet open={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </>
  );
}
