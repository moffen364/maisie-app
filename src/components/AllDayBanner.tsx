'use client';

import type { CalendarEntry } from '@/lib/types';
import { CATEGORY_ALLDAY_BG, CATEGORY_ALLDAY_TEXT, CATEGORY_ALLDAY_MUTED } from '@/lib/types';
import { formatDateRange } from '@/lib/utils';

export default function AllDayBanner({
  entry,
  onOpen,
}: {
  entry: CalendarEntry;
  onOpen: (e: CalendarEntry) => void;
}) {
  return (
    <div
      onClick={() => onOpen(entry)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-1.5 cursor-pointer active:opacity-80 ${CATEGORY_ALLDAY_BG[entry.category]}`}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={`shrink-0 ${CATEGORY_ALLDAY_MUTED[entry.category]}`}>
        <rect x="0.75" y="2" width="11.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <line x1="0.75" y1="5" x2="12.25" y2="5" stroke="currentColor" strokeWidth="1.25"/>
        <line x1="3.5" y1="0.75" x2="3.5" y2="3.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <line x1="9.5" y1="0.75" x2="9.5" y2="3.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <line x1="3.25" y1="8.25" x2="9.75" y2="8.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
      <span className={`flex-1 text-sm font-medium truncate ${CATEGORY_ALLDAY_TEXT[entry.category]}`}>
        {entry.title}
      </span>
      <span className={`text-xs shrink-0 ${CATEGORY_ALLDAY_MUTED[entry.category]}`}>
        {formatDateRange(entry.day, entry.end_day!)}
      </span>
    </div>
  );
}
