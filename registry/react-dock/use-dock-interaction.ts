"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DockInteractionOptions } from './types';
import { useScrollTarget } from './use-scroll-target';

export function useDockInteraction({ rootRef, scrollTarget, autoScrollDuration = 1200 }: DockInteractionOptions) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const pinned = useRef<string | null>(null);
  const auto = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const target = useScrollTarget(scrollTarget);
  const stopAutoScroll = useCallback(() => {
    auto.current = false;
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const dismiss = useCallback((blur = true) => {
    stopAutoScroll(); pinned.current = null; setPinnedId(null); setOpenId(null);
    const focused = document.activeElement;
    if (blur && focused instanceof HTMLElement && rootRef.current?.contains(focused)) focused.blur();
  }, [rootRef, stopAutoScroll]);
  const open = useCallback((id: string, intentional = false) => {
    if (auto.current && !intentional) return;
    // keep scroll protection when switching tooltips
    if (pinned.current !== id) { pinned.current = null; setPinnedId(null); }
    setOpenId(id);
  }, []);
  const close = useCallback(() => {
    if (!auto.current && !pinned.current) setOpenId(null);
  }, []);
  const activate = useCallback((id: string, pin = true) => {
    pinned.current = pin ? id : null; setPinnedId(pinned.current); setOpenId(id);
  }, []);
  const startAutoScroll = useCallback(() => {
    stopAutoScroll(); auto.current = true;
    timer.current = setTimeout(() => { auto.current = false; timer.current = undefined; }, autoScrollDuration);
  }, [autoScrollDuration, stopAutoScroll]);

  useEffect(() => {
    const onScroll = (event: Event) => {
      const relevant = target === window
        ? event.target instanceof Window || event.target === document
        : target && (event.target === target || target instanceof HTMLElement && target.contains(event.target as Node));
      if (relevant) {
        // keep tooltips open while hovered or focused
        if (rootRef.current?.querySelector('[data-slot="item"] > :is(button,a):is(:hover,:focus-visible)')) return;
        if (auto.current) startAutoScroll();
        else dismiss();
      }
    };
    const outside = (event: Event) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) dismiss();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { dismiss(false); return; }
      if (event.defaultPrevented || event.target instanceof HTMLElement &&
        (event.target.isContentEditable || event.target.closest('input, textarea, select, button, a, [role="button"]'))) return;
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(event.key)) dismiss();
    };
    const interrupt = () => dismiss();
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('wheel', interrupt, { capture: true, passive: true });
    window.addEventListener('touchmove', interrupt, { capture: true, passive: true });
    window.addEventListener('pointerdown', outside, true);
    window.addEventListener('touchstart', outside, { capture: true, passive: true });
    window.addEventListener('keydown', key);
    window.addEventListener('blur', interrupt);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('wheel', interrupt, true);
      window.removeEventListener('touchmove', interrupt, true);
      window.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('touchstart', outside, true);
      window.removeEventListener('keydown', key);
      window.removeEventListener('blur', interrupt);
      stopAutoScroll();
    };
  }, [rootRef, target, dismiss, stopAutoScroll, startAutoScroll]);
  return { openId, pinnedId, open, close, activate, dismiss, startAutoScroll, stopAutoScroll };
}
