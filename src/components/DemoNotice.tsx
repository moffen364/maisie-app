'use client';

import { IS_DEMO, DEMO_AI_MESSAGE } from '@/lib/demo';

/**
 * Explains why AI features are off, shown before the user tries one.
 * Renders nothing outside demo mode, so it's safe to drop into any page.
 */
export default function DemoNotice({ className = '' }: { className?: string }) {
  if (!IS_DEMO) return null;

  return (
    <div
      className={`bg-pink-50 border border-pink-200 rounded-xl p-3 flex items-start gap-2.5 text-sm text-pink-800 ${className}`}
    >
      <svg
        className="shrink-0 mt-0.5"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 7.25v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="5" r="0.85" fill="currentColor" />
      </svg>
      <p className="flex-1 leading-snug">{DEMO_AI_MESSAGE}</p>
    </div>
  );
}
