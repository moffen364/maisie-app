import { useEffect, useState } from 'react';

// Drives mount/show flags for a modal so exit animations can play before unmount.
export function useModalTransition(active: boolean, exitDelayMs = 300) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
      return () => cancelAnimationFrame(frame);
    } else {
      setShow(false);
      const t = setTimeout(() => setMounted(false), exitDelayMs);
      return () => clearTimeout(t);
    }
  }, [active, exitDelayMs]);

  return { mounted, show };
}
