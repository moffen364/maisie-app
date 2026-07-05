import { useEffect, useState } from 'react';

// Drives mount/show flags for a modal so exit animations can play before unmount.
export function useModalTransition(active: boolean, exitDelayMs = 300) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setMounted(true);
      // Fallback timer guards against a stalled rAF chain (e.g. a tab that was
      // backgrounded the instant it opened) leaving the modal mounted but invisible.
      const fallback = setTimeout(() => setShow(true), 100);
      const frame = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          clearTimeout(fallback);
          setShow(true);
        })
      );
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(fallback);
      };
    } else {
      setShow(false);
      const t = setTimeout(() => setMounted(false), exitDelayMs);
      return () => clearTimeout(t);
    }
  }, [active, exitDelayMs]);

  return { mounted, show };
}
