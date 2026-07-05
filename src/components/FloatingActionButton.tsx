'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import QuickAddSheet from './QuickAddSheet';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <line x1="8" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="20" y2="12" />
      <line x1="8" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MiniAction({
  label,
  icon,
  expanded,
  delayMs,
  bottomClass,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  expanded: boolean;
  delayMs: number;
  bottomClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-hidden={!expanded}
      tabIndex={expanded ? 0 : -1}
      style={{ transitionDelay: expanded ? `${delayMs}ms` : '0ms' }}
      className={`fixed right-4 ${bottomClass} z-45 flex items-center gap-2.5 transition-all duration-200 ease-out ${
        expanded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90 pointer-events-none'
      }`}
    >
      <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap">
        {label}
      </span>
      <span className="w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-brand-dark shrink-0">
        {icon}
      </span>
    </button>
  );
}

export default function FloatingActionButton() {
  return (
    <Suspense fallback={null}>
      <FloatingActionButtonInner />
    </Suspense>
  );
}

function FloatingActionButtonInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const isTodos = pathname === '/todos';
  const hidden = pathname.startsWith('/plan') || pathname.startsWith('/finance');
  const onLists = isTodos && searchParams.get('view') === 'lists';

  // Collapse the fan-out if the route changes out from under it.
  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  useEffect(() => {
    if (!expanded) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpanded(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expanded]);

  if (hidden) return null;

  function handleFabClick() {
    if (isTodos) {
      setExpanded((v) => !v);
    } else {
      setShowQuickAdd(true);
    }
  }

  function openQuickAdd() {
    setExpanded(false);
    setShowQuickAdd(true);
  }

  function toggleListsView() {
    setExpanded(false);
    router.replace(onLists ? '/todos' : '/todos?view=lists', { scroll: false });
  }

  return (
    <>
      {isTodos && (
        <div
          onClick={() => setExpanded(false)}
          aria-hidden="true"
          className={`fixed inset-0 bg-black/25 z-40 transition-opacity duration-200 ${
            expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      {isTodos && (
        <>
          <MiniAction
            label={onLists ? 'To-Dos' : 'Lists'}
            icon={<ListIcon />}
            expanded={expanded}
            delayMs={80}
            bottomClass="bottom-[calc(var(--fab-clear)+7.75rem)]"
            onClick={toggleListsView}
          />
          <MiniAction
            label="Quick Add"
            icon={<PlusIcon className="w-4 h-4" />}
            expanded={expanded}
            delayMs={0}
            bottomClass="bottom-[calc(var(--fab-clear)+4.25rem)]"
            onClick={openQuickAdd}
          />
        </>
      )}

      <button
        onClick={handleFabClick}
        aria-label={isTodos ? (expanded ? 'Close actions' : 'Open actions') : 'Quick add'}
        aria-expanded={isTodos ? expanded : undefined}
        className={`fixed right-4 bottom-[var(--fab-clear)] z-45 w-14 h-14 rounded-full bg-brand shadow-lg shadow-pink-300/50 flex items-center justify-center transition-transform duration-200 ease-out active:scale-95 ${
          expanded ? 'rotate-45' : ''
        }`}
      >
        <PlusIcon className="w-6 h-6 text-white" />
      </button>

      <QuickAddSheet open={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </>
  );
}
