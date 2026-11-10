"use client";

import { useEffect, useState } from 'react';
import type { ScrollTarget } from './types';
import { useScrollTarget } from './use-scroll-target';

// section ids follow document order
export function useActiveSection(sectionIds: readonly string[], scrollTarget?: ScrollTarget) {
  const [activeId, setActiveId] = useState<string | undefined>(sectionIds[0]);
  const idsKey = JSON.stringify(sectionIds);
  const target = useScrollTarget(scrollTarget);
  useEffect(() => {
    const ids: string[] = JSON.parse(idsKey);
    if (!target) { setActiveId(undefined); return; }
    const update = () => {
      const container = target instanceof HTMLElement ? target : null;
      const start = container ? container.getBoundingClientRect().top + container.clientTop : 0;
      const height = container ? container.clientHeight : window.innerHeight;
      const sections = ids.map(id => document.getElementById(id))
        .filter((node): node is HTMLElement => !!node && (!container || container.contains(node)));
      const line = start + height * .25;
      let current: string | undefined = sections[0]?.id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = section.id;
      }
      // select the last section at the page bottom
      const position = container ? container.scrollTop : window.scrollY;
      const total = container ? container.scrollHeight : document.documentElement.scrollHeight;
      if (position > 0 && total > height && position + height >= total - 2) current = sections.at(-1)?.id;
      setActiveId(previous => previous === current ? previous : current);
    };
    update();
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ids.forEach(id => { const element = document.getElementById(id); if (element) observer?.observe(element); });
    const mutations = new MutationObserver(() => {
      ids.forEach(id => { const element = document.getElementById(id); if (element) observer?.observe(element); });
      update();
    });
    mutations.observe(containerRoot(target), { childList: true, subtree: true });
    return () => {
      target.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer?.disconnect();
      mutations.disconnect();
    };
  }, [idsKey, target]);
  return activeId;
}

function containerRoot(target: HTMLElement | Window) {
  return target instanceof HTMLElement ? target : document.body;
}
