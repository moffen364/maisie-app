'use client';

import type { ReactNode } from 'react';

interface CenteredModalProps {
  show: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  maxHeight?: string;
}

export default function CenteredModal({
  show,
  onClose,
  children,
  maxWidth = 'max-w-sm',
  maxHeight = 'max-h-[80vh]',
}: CenteredModalProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none">
        <div
          className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} ${maxHeight} flex flex-col pointer-events-auto transition-all duration-200 ease-out ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          {children}
        </div>
      </div>
    </>
  );
}
