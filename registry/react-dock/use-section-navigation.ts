"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

export function useSectionNavigation() {
  const [destination, setDestination] = useState<string>();
  const target = useRef<string | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const velocity = useRef(0);
  const previousTime = useRef<number | undefined>(undefined);
  const cancel = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    target.current = undefined;
    velocity.current = 0;
    previousTime.current = undefined;
    setDestination(undefined);
  }, []);
  const navigate = useCallback((id: string) => {
    if (!document.getElementById(id)) return;
    target.current = id;
    setDestination(id);
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    if (frame.current !== undefined) return;
    let position = window.scrollY;
    const tick = (time: number) => {
      const section = target.current && document.getElementById(target.current);
      if (!section) { cancel(); return; }
      const margin = Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
      const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const goal = Math.min(maximum, Math.max(0, window.scrollY + section.getBoundingClientRect().top - margin));
      const dt = Math.min((time - (previousTime.current ?? time - 16)) / 1000, .032);
      previousTime.current = time;
      const distance = goal - position;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || (Math.abs(distance) < 1.5 && Math.abs(velocity.current) < 16)) {
        window.scrollTo({ top: goal, behavior: 'instant' });
        cancel(); return;
      }
      // preserve velocity when the destination changes
      velocity.current += (distance * 100 - velocity.current * 20) * dt;
      position = Math.min(maximum, Math.max(0, position + velocity.current * dt));
      window.scrollTo({ top: position, behavior: 'instant' });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [cancel]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable], button, a'))) return;
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Escape'].includes(event.key)) cancel();
    };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchmove', cancel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', cancel);
    return () => {
      cancel();
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', cancel);
    };
  }, [cancel]);
  return { destination, navigate, cancel };
}
