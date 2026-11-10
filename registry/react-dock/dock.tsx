"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { DockLinkProps, DockProps, DockSlot } from './types';
import { useDockInteraction } from './use-dock-interaction';
import { useSectionNavigation } from './use-section-navigation';

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Dock({ items, ariaLabel, activeId, maxVisibleItems, visibility = 'all', scrollTarget, sectionNavigation = true,
  autoScrollDuration, className, style, classNames, styles, renderLink }: DockProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(items.length || 1);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / capacity));
  const currentPage = Math.min(page, pages - 1);
  const visibleItems = items.slice(currentPage * capacity, (currentPage + 1) * capacity);
  const widthAnimation = useRef<Animation | null>(null);
  const previousWidth = useRef(0);
  const hovered = useRef<string | null>(null);
  const focused = useRef<string | null>(null);
  const dismissedActivation = useRef(new Set<string>());
  const touchActivation = useRef(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pressedControl = useRef<HTMLElement | null>(null);
  const [indicator, setIndicator] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const itemIds = JSON.stringify(items.map(item => item.id));
  const interaction = useDockInteraction({ rootRef, scrollTarget, autoScrollDuration });
  const { destination, navigate } = useSectionNavigation();
  const activeItem = items.find(item => item.id === activeId);
  const selectedId = destination
    ? visibleItems.find(item => item.href && new URL(item.href, window.location.href).hash === `#${encodeURIComponent(destination)}`)?.id ?? activeId
    : visibleItems.find(item => item.id === activeId || (activeItem?.href && item.href === activeItem.href))?.id ?? activeId;
  const { openId, dismiss } = interaction;
  const previousLoading = useRef<Record<string, boolean>>({});
  useEffect(() => {
    for (const item of items) {
      const wasLoading = previousLoading.current[item.id];
      if (wasLoading && !item.loading && openId === item.id && rootRef.current?.getAttribute('data-touch-input') === 'true') {
        clearTimeout(touchTimer.current);
        touchTimer.current = setTimeout(() => dismiss(false), 2000);
      }
      previousLoading.current[item.id] = Boolean(item.loading);
    }
  }, [items, openId, dismiss]);
  useEffect(() => {
    const release = () => {
      pressedControl.current?.removeAttribute('data-touch-pressed');
      pressedControl.current = null;
    };
    const cancel = () => { release(); touchActivation.current = false; clearTimeout(touchTimer.current); dismiss(false); };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', cancel, { passive: true });
    window.addEventListener('blur', cancel);
    return () => {
      release(); clearTimeout(touchTimer.current);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, [dismiss]);
  const id = useId();
  const slot = (name: DockSlot) => ({ 'data-slot': name, className: classNames?.[name], style: styles?.[name] });

  useClientLayoutEffect(() => {
    const nav = navRef.current;
    const frame = frameRef.current;
    if (!nav || !frame) return;
    const update = () => {
      const control = nav.querySelector<HTMLElement>('[data-slot="item"] > :is(button,a)');
      const size = Math.max(44, control?.getBoundingClientRect().width || 44);
      const navCss = getComputedStyle(nav);
      const frameCss = getComputedStyle(frame);
      const gap = parseFloat(navCss.columnGap) || 0;
      const frameGap = parseFloat(frameCss.columnGap) || 0;
      const padding = (parseFloat(frameCss.paddingLeft) || 0) + (parseFloat(frameCss.paddingRight) || 0)
        + (parseFloat(frameCss.borderLeftWidth) || 0) + (parseFloat(frameCss.borderRightWidth) || 0);
      const available = window.innerWidth - 32;
      const count = Math.max(1, Math.floor((available - padding + gap) / (size + gap)));
      const limit = maxVisibleItems && Number.isFinite(maxVisibleItems) ? Math.max(1, Math.floor(maxVisibleItems)) : items.length;
      const next = count >= items.length && limit >= items.length ? Math.max(1, items.length) : Math.min(limit, Math.max(1, Math.floor((available - padding - 88 - frameGap * 2 + gap) / (size + gap))));
      setCapacity(next);
    };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(nav);
    observer?.observe(frame);
    window.addEventListener('resize', update);
    return () => { observer?.disconnect(); window.removeEventListener('resize', update); };
  }, [itemIds, maxVisibleItems]);

  useClientLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const from = widthAnimation.current ? frame.getBoundingClientRect().width : previousWidth.current;
    widthAnimation.current?.cancel();
    const to = frame.getBoundingClientRect().width;
    previousWidth.current = to;
    if (from && Math.abs(from - to) > 1 && frame.animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      widthAnimation.current = frame.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      widthAnimation.current.onfinish = () => { widthAnimation.current = null; };
    }
  }, [currentPage, capacity, itemIds]);

  useEffect(() => () => { widthAnimation.current?.cancel(); }, []);

  const changePage = (direction: number) => {
    clearTimeout(touchTimer.current);
    touchActivation.current = false;
    previousWidth.current = frameRef.current?.getBoundingClientRect().width ?? 0;
    widthAnimation.current?.cancel();
    widthAnimation.current = null;
    hovered.current = null;
    focused.current = null;
    dismiss(false);
    setPage(Math.max(0, Math.min(pages - 1, currentPage + direction)));
  };

  useEffect(() => {
    for (const item of items) if (item.tooltipSuppressed) dismissedActivation.current.add(item.id);
    if (openId && !items.some(item => item.id === openId && !item.disabled && item.tooltip !== false && !item.tooltipSuppressed)) dismiss(false);
  }, [items, openId, dismiss]);

  useClientLayoutEffect(() => {
    const tooltip = rootRef.current?.querySelector<HTMLElement>('[role="tooltip"]');
    if (!tooltip) return;
    const update = () => {
      const item = navRef.current?.querySelector<HTMLElement>('[data-open="true"]');
      if (!item) return;
      const anchor = item.getBoundingClientRect();
      const root = rootRef.current!.getBoundingClientRect();
      tooltip.style.left = `${anchor.left + anchor.width / 2 - root.left}px`;
      tooltip.style.bottom = `calc(${root.bottom - anchor.top}px + var(--rd-tooltip-gap, 10px))`;
      tooltip.style.setProperty('--rd-tooltip-shift', '0px');
      const rect = tooltip.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = (viewport?.offsetLeft ?? 0) + 8;
      const right = (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - 8;
      const shift = rect.left < left ? left - rect.left : rect.right > right ? right - rect.right : 0;
      tooltip.style.setProperty('--rd-tooltip-shift', `${shift}px`);
    };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(tooltip);
    window.addEventListener('resize', update);
    navRef.current?.addEventListener('scroll', update, { passive: true });
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      navRef.current?.removeEventListener('scroll', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [interaction.openId, items]);

  useClientLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () => {
      const active = nav.querySelector<HTMLElement>('[data-slot="item"][data-active="true"]');
      if (!active) { setIndicator(null); return; }
      const next = { x: active.offsetLeft, y: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight };
      setIndicator(previous => previous && previous.x === next.x && previous.y === next.y && previous.width === next.width && previous.height === next.height ? previous : next);
    };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(nav);
    nav.querySelectorAll<HTMLElement>('[data-slot="item"]').forEach(item => observer?.observe(item));
    window.addEventListener('resize', update);
    return () => { observer?.disconnect(); window.removeEventListener('resize', update); };
  }, [selectedId, itemIds, currentPage, capacity]);

  return <div {...slot('root')} ref={rootRef} data-react-dock="" data-visibility={visibility} onDragStartCapture={event => event.preventDefault()}
    onKeyDownCapture={event => { if (event.key === 'Tab') dismissedActivation.current.clear(); }}
    onPointerDownCapture={event => {
      if (event.pointerType === 'touch') event.currentTarget.setAttribute('data-touch-input', 'true');
      else if (event.pointerType === 'mouse') event.currentTarget.removeAttribute('data-touch-input');
    }}
    className={[classNames?.root, className].filter(Boolean).join(' ') || undefined}
    style={{ ...styles?.root, ...style }}>
    <div {...slot('surface')} ref={frameRef} data-dock-frame="" data-paginated={pages > 1}>
    {pages > 1 && <button type="button" data-dock-arrow="previous" aria-label="Previous items" disabled={currentPage === 0} onClick={() => changePage(-1)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button>}
    <nav {...slot('dock')} ref={navRef} aria-label={ariaLabel}>
      <span {...slot('indicator')} aria-hidden="true" data-visible={!!indicator}
        style={{ transform: `translate(${indicator?.x ?? 0}px, ${indicator?.y ?? 0}px)`, width: indicator?.width ?? 0, height: indicator?.height ?? 0, ...styles?.indicator }} />
      {visibleItems.map((item) => {
        const index = items.indexOf(item);
        const open = interaction.openId === item.id && item.tooltip !== false && !item.disabled && !item.tooltipSuppressed;
        const label = item.loading ? item.loadingLabel ?? item.label : item.label;
        const tooltipId = `${id}-tooltip-${index}`;
        const props: Omit<DockLinkProps, 'href'> = {
          children: <span {...slot('icon')} aria-hidden="true">{item.loading ? <svg data-dock-spinner="" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" opacity=".2" /><path d="M12 3a9 9 0 0 1 9 9" /></svg> : item.icon}</span>,
          'aria-label': label,
          'aria-busy': item.loading || undefined,
          'aria-disabled': item.loading || undefined,
          'aria-describedby': open ? tooltipId : undefined,
          'aria-current': item.href && selectedId === item.id ? 'page' : undefined,
          onPointerEnter: (event) => {
            if (event.pointerType === 'touch' || item.disabled || item.tooltip === false || item.tooltipSuppressed) return;
            clearTimeout(touchTimer.current);
            rootRef.current?.removeAttribute('data-touch-input');
            hovered.current = item.id;
            dismissedActivation.current.delete(item.id);
            interaction.open(item.id, true);
          },
          onPointerLeave: (event) => {
            if (event.pointerType === 'touch') return;
            hovered.current = null;
            if (focused.current !== item.id && interaction.pinnedId !== item.id) interaction.dismiss(false);
          },
          onFocus: (event) => {
            if (!event.currentTarget.matches(':focus-visible') || item.disabled || item.tooltip === false || item.tooltipSuppressed || dismissedActivation.current.has(item.id)) return;
            clearTimeout(touchTimer.current);
            focused.current = item.id;
            interaction.open(item.id, true);
          },
          onBlur: () => {
            if (focused.current === item.id) focused.current = null;
            if (interaction.openId === item.id && hovered.current !== item.id && interaction.pinnedId !== item.id) interaction.dismiss(false);
          },
          onPointerDown: (event) => {
            touchActivation.current = event.pointerType === 'touch';
            pressedControl.current?.removeAttribute('data-touch-pressed');
            pressedControl.current = null;
            if (!touchActivation.current || item.disabled) return;
            hovered.current = null;
            focused.current = null;
            rootRef.current?.setAttribute('data-touch-input', 'true');
            pressedControl.current = event.currentTarget;
            event.currentTarget.setAttribute('data-touch-pressed', 'true');
          },
          onClick: (event) => {
            if (item.disabled) { event.preventDefault(); return; }
            if (item.href && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)) return;
            if (item.tooltip === false || item.tooltipSuppressed || item.tooltipDismissOnActivate) {
              if (item.tooltipDismissOnActivate || item.tooltipSuppressed) dismissedActivation.current.add(item.id);
              interaction.dismiss(false);
            }
            else if (touchActivation.current) {
              clearTimeout(touchTimer.current);
              interaction.open(item.id, true);
              touchTimer.current = setTimeout(() => dismiss(false), 2000);
            }
            else if (item.pinOnActivate === true) interaction.activate(item.id);
            else if (hovered.current === item.id || focused.current === item.id) interaction.open(item.id, true);
            else interaction.dismiss(false);
            touchActivation.current = false;
            if (item.loading) { event.preventDefault(); return; }
            if (item.href) interaction.startAutoScroll();
            item.onClick?.(event);
            if (!event.defaultPrevented && item.href && sectionNavigation && !scrollTarget) {
              const url = new URL(item.href, window.location.href);
              if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search && url.hash) {
                let sectionId: string;
                try { sectionId = decodeURIComponent(url.hash.slice(1)); } catch { return; }
                if (document.getElementById(sectionId)) { event.preventDefault(); navigate(sectionId); }
              }
            }
          },
        };
        return <div {...slot('item')} key={item.id} data-active={selectedId === item.id}
          data-open={open} data-pinned={interaction.pinnedId === item.id} data-disabled={!!item.disabled}>
          {item.href && !item.disabled
            ? renderLink ? renderLink({ ...props, href: item.href }, item) : <a {...props} href={item.href} />
            : <button {...props} type="button" disabled={item.disabled} />}
        </div>;
      })}
    </nav>
    {pages > 1 && <button type="button" data-dock-arrow="next" aria-label="Next items" disabled={currentPage === pages - 1} onClick={() => changePage(1)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button>}
    </div>
    {items.map((item, index) => visibleItems.includes(item) && interaction.openId === item.id && item.tooltip !== false && !item.disabled && !item.tooltipSuppressed
      ? <span {...slot('tooltip')} key={item.id} id={`${id}-tooltip-${index}`} role="tooltip">{item.loading ? item.loadingLabel ?? item.label : item.label}</span> : null)}
  </div>;
}
