'use client';

import type { MouseEvent } from 'react';

export default function CheckCircleButton({
  checked,
  onClick,
  className = 'shrink-0 w-11 h-11',
}: {
  checked: boolean;
  onClick: (e: MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${className} flex items-center justify-center -ml-2`}
      aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
    >
      {checked ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" fill="#22c55e" />
          <path d="M5.5 10.5l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="#d1d5db" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  );
}
