"use client";

import { useEffect, useState } from 'react';
import type { ScrollTarget } from './types';

export function useScrollTarget(resolve?: ScrollTarget) {
  const [target, setTarget] = useState<HTMLElement | Window | null>(null);
  useEffect(() => {
    const update = () => setTarget(resolve ? resolve() : window);
    if (!resolve) return;
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [resolve]);
  // recheck refs each render even with a stable resolver
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTarget(resolve ? resolve() : window); });
  return target;
}
