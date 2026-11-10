import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Dock, useActiveSection } from '../registry/react-dock';
import type { DockItem, DockStyle } from '../registry/react-dock';
import '../registry/react-dock/styles.css';
import './demo.css';
import { AnimationSelect } from './animation-select';
import { Documentation } from './documentation';
import packageInfo from '../package.json';

function Icon({ name }: { name: 'home' | 'article' | 'props' | 'styling' | 'integration' | 'theme' | 'sun' | 'share' | 'check' | 'back' | 'house' | 'book' | 'braces' | 'palette' | 'plug' | 'contrast' | 'sunrise' | 'copy' | 'return' | 'disk' | 'sliders' | 'alert' | 'retry' | 'copyCheck' | 'diskCheck' | 'arrowLeftToLine' }) {
  const paths = {
    home: 'm3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
    article: 'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',
    props: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16',
    styling: 'M4 7h16M4 17h16M8 4v6m8 4v6',
    integration: 'm9 15 6-6m-8 4-2 2a4 4 0 0 0 6 6l2-2m-2-14 2-2a4 4 0 0 1 6 6l-2 2',
    theme: 'M20 14A9 9 0 0 1 10 4a9 9 0 1 0 10 10Z',
    sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
    share: 'M12 16V3m-5 5 5-5 5 5M5 13v8h14v-8',
    check: 'm5 12 4 4L19 6',
    back: 'm10 6-6 6 6 6M4 12h16',
    house: 'm2 10 10-8 10 8M4 9v12h16V9M8 21v-8h8v8M16 3v4',
    book: 'M12 5v16M3 3c4 0 7 0 9 2 2-2 5-2 9-2v16c-5 0-7 0-9 2-2-2-4-2-9-2Z',
    braces: 'M8 3H6v6l-3 3 3 3v6h2M16 3h2v6l3 3-3 3v6h-2M10 12h4',
    palette: 'M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h3a5 5 0 0 0 5-5c0-3-5-5-9-5ZM7 8h.01M11 6h.01M16 7h.01M6 13h.01',
    plug: 'M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0ZM12 17v5',
    contrast: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 3v18M12 7h5M12 11h8M12 15h7',
    sunrise: 'M3 20h18M5 16h14a7 7 0 0 0-14 0ZM12 2v3M3 7l2 2m14 0 2-2M1 14h2m18 0h2',
    copy: 'M9 8h12v13H9zM15 8V3H3v13h6',
    copyCheck: 'M9 8h12v13H9zM15 8V3H3v13h6M12 15l2 2 4-4',
    return: 'm9 4-6 6 6 6M3 10h12a6 6 0 0 1 6 6v4',
    arrowLeftToLine: 'M3 19V5M13 6l-6 6 6 6M7 12h14',
    disk: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
    diskCheck: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM7 3v5h8M9 15l2 2 4-4',
    sliders: 'M4 21v-7m0-4V3m8 21v-9m0-4V3m8 21v-5m0-4V3M1 14h6m2-6h6m2 8h6',
    alert: 'M12 9v4m0 4h.01M21.73 18 13.73 4a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z',
    retry: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5',
  };
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
export function App() {
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => header.parentElement?.style.setProperty('--demo-header-height', `${header.getBoundingClientRect().height}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    document.documentElement.lang = 'en';
    const title = 'React Dock - React Navigation, Docs & Playground';
    const description = 'React Dock: an editable React and TypeScript navigation component. Explore documentation, playground, themes, tooltips, and responsive item groups.';
    document.title = title;
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) document.querySelector(selector)?.setAttribute('content', title);
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) document.querySelector(selector)?.setAttribute('content', description);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', 'en_US');
  }, []);
  useEffect(() => {
    const finish = () => document.documentElement.setAttribute('data-ready', 'true');
    if (typeof window === 'undefined' || typeof Image === 'undefined' || (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom'))) {
      finish();
      return;
    }
    const logoSrc = `${import.meta.env.BASE_URL}branding/react-dock.svg`;
    const img = new Image();
    img.src = logoSrc;
    if (img.complete) {
      finish();
    } else {
      img.onload = finish;
      img.onerror = finish;
      const timer = setTimeout(finish, 300);
      return () => clearTimeout(timer);
    }
  }, []);
  const [article, setArticle] = useState(false);
  const [actions, setActions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copySaving, setCopySaving] = useState(false);
  const [copySaveFailed, setCopySaveFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copySharing, setCopySharing] = useState(false);
  const [copyShareFailed, setCopyShareFailed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!saving) return;
    const timer = setTimeout(() => { setSaving(false); setSaved(true); }, 1500);
    return () => clearTimeout(timer);
  }, [saving]);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  useEffect(() => {
    if (!copySaving) return;
    const timer = setTimeout(() => {
      setCopySaving(false);
      setCopySaveFailed(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [copySaving]);

  useEffect(() => {
    if (!copySaveFailed) return;
    const timer = setTimeout(() => setCopySaveFailed(false), 2000);
    return () => clearTimeout(timer);
  }, [copySaveFailed]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!copySharing) return;
    const timer = setTimeout(() => {
      setCopySharing(false);
      setCopyShareFailed(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [copySharing]);

  useEffect(() => {
    if (!copyShareFailed) return;
    const timer = setTimeout(() => setCopyShareFailed(false), 2000);
    return () => clearTimeout(timer);
  }, [copyShareFailed]);

  useEffect(() => {
    if (settingsOpen) dialogRef.current?.showModal();
    else if (dialogRef.current?.open) dialogRef.current.close();
  }, [settingsOpen]);
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('react-dock-theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return document.documentElement.getAttribute('data-dark') === 'true';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('react-dock-theme', dark ? 'dark' : 'light');
    } catch (_error) {
      void _error;
    }
    const root = document.documentElement;
    root.setAttribute('data-dark', dark ? 'true' : 'false');
    root.style.backgroundColor = dark ? '#19231d' : '#f5f4ec';
    root.style.colorScheme = dark ? 'dark' : 'light';
  }, [dark]);
  const [custom, setCustom] = useState(false);
  const [many, setMany] = useState(false);
  const [tooltips, setTooltips] = useState(true);
  const [animation, setAnimation] = useState('slide');
  const [duration, setDuration] = useState(240);
  const indicatorTransition = animation === 'none' ? 'none' : `transform ${duration}ms cubic-bezier(.22, 1, .36, 1), width ${duration}ms ease-out, height ${duration}ms ease-out`;
  const active = useActiveSection(['home', 'usage', 'props', 'styling', 'integration']);
  const theme: DockStyle = custom ? {
    ...(dark ? { '--rd-surface': '#203e35', '--rd-foreground': '#fff9e9', '--rd-border': '#526c61', '--rd-hover': '#36554a', '--rd-active': '#466c59' }
      : { '--rd-surface': '#fff8eb', '--rd-foreground': '#003049', '--rd-border': '#d8bd86', '--rd-hover': '#ffe7b0', '--rd-active': '#fcbf49' }),
    '--rd-radius': '8px', '--rd-gap': '4px', '--rd-padding': '4px', '--rd-tooltip-gap': '10px',
  } : dark ? { '--rd-surface': '#252b27', '--rd-foreground': '#f4f3e9', '--rd-border': '#4a554d', '--rd-hover': '#354139', '--rd-active': '#435747' } : {};
  const baseItems: DockItem[] = actions ? [
    {
      id: 'save',
      label: saved ? 'Draft saved' : 'Save draft',
      icon: <Icon name={saved ? 'diskCheck' : 'disk'} />,
      loading: saving,
      loadingLabel: 'Saving draft',
      onClick: () => { setSaved(false); setSaving(true); },
    },
    { id: 'settings', label: 'Draft settings', icon: <Icon name="styling" />, tooltipDismissOnActivate: true, tooltipSuppressed: settingsOpen, onClick: event => { dialogTrigger.current = event.currentTarget; setSettingsOpen(true); } },
    { id: 'theme', label: dark ? 'Light mode' : 'Dark mode', icon: <Icon name={dark ? 'sun' : 'theme'} />, onClick: () => setDark(value => !value) },
    { id: 'back', label: 'Back', icon: <Icon name="back" />, tooltip: false, onClick: () => { setActions(false); setSaved(false); setSaving(false); setCopySaving(false); setCopySaveFailed(false); } },
  ] : article ? [
    { id: 'theme', label: dark ? 'Light mode' : 'Dark mode', icon: <Icon name={dark ? 'sun' : 'theme'} />, onClick: () => setDark(value => !value) },
    { id: 'copy', label: copied ? 'Link copied' : 'Copy link', icon: <Icon name={copied ? 'copyCheck' : 'copy'} />, onClick: () => { void navigator.clipboard.writeText(location.href).then(() => setCopied(true)).catch(() => setCopied(false)); } },
    { id: 'back', label: 'Back', icon: <Icon name="back" />, tooltip: false, onClick: () => { setArticle(false); setCopied(false); setCopySharing(false); setCopyShareFailed(false); } },
  ] : [
    { id: 'home', label: 'Home', href: '#home', icon: <Icon name="home" /> },
    { id: 'usage', label: 'Usage', href: '#usage', icon: <Icon name="article" /> },
    { id: 'props', label: 'Props', href: '#props', icon: <Icon name="props" /> },
    { id: 'styling', label: 'Styling', href: '#styling', icon: <Icon name="styling" /> },
    { id: 'integration', label: 'Integration', href: '#integration', icon: <Icon name="integration" /> },
    { id: 'theme', label: dark ? 'Light mode' : 'Dark mode', icon: <Icon name={dark ? 'sun' : 'theme'} />, onClick: () => setDark(value => !value) },
  ];
  const alternateIcons = {
    home: 'house',
    usage: 'book',
    props: 'braces',
    styling: 'palette',
    integration: 'plug',
    copy: 'copy',
    back: 'arrowLeftToLine',
    save: 'disk',
    settings: 'sliders',
  } as const;
  const demoItems = many ? [
    ...baseItems,
    ...baseItems.map(item => {
      if (item.id === 'save') {
        return {
          id: 'save-copy',
          label: copySaveFailed ? 'Save failed' : 'Save draft',
          icon: <Icon name={copySaveFailed ? 'retry' : 'disk'} />,
          loading: copySaving,
          loadingLabel: 'Saving draft',
          onClick: () => {
            setCopySaveFailed(false);
            setCopySaving(true);
          },
        };
      }
      if (item.id === 'copy') {
        return {
          id: 'copy-copy',
          label: copyShareFailed ? 'Copy failed' : 'Copy link',
          icon: <Icon name={copyShareFailed ? 'retry' : 'copy'} />,
          loading: copySharing,
          loadingLabel: 'Copying link',
          onClick: () => {
            setCopyShareFailed(false);
            setCopySharing(true);
          },
        };
      }
      if (item.id === 'theme') {
        return { ...item, id: `${item.id}-copy`, icon: <Icon name={dark ? 'sun' : 'theme'} /> };
      }
      const alt = alternateIcons[item.id as keyof typeof alternateIcons];
      return { ...item, id: `${item.id}-copy`, icon: alt ? <Icon name={alt} /> : item.icon };
    }),
  ] : baseItems;
  return <div className="playground" data-dark={dark}>
    <a className="skip-link" href="#home">Skip to content</a>
    <header ref={headerRef}><div className="header-brand"><a href="#home" className="wordmark"><span className="brand-symbol" aria-hidden="true" />React Dock</a><span className="version">v{packageInfo.version}</span></div></header>
    <div className="docs-layout"><main>
      <section id="home" className="intro">
        <h1>A navigation dock for React.</h1>
        <p className="lede">Page navigation with icons, tooltips, responsive item groups, and actions for themes and link sharing.</p>
        <fieldset><legend>Try it here</legend>
          <label><input type="checkbox" checked={article} onChange={e => { setArticle(e.target.checked); if (e.target.checked) setActions(false); }} /> Article controls</label>
          <label><input type="checkbox" checked={actions} onChange={e => { setActions(e.target.checked); if (e.target.checked) setArticle(false); }} /> Draft actions</label>
          <label><input type="checkbox" checked={custom} onChange={e => setCustom(e.target.checked)} /> Custom styling</label>
          <label><input type="checkbox" checked={many} onChange={e => setMany(e.target.checked)} /> Many buttons demo</label>
          <label><input type="checkbox" checked={tooltips} onChange={e => setTooltips(e.target.checked)} /> Show tooltips</label>
          <label>Indicator animation <AnimationSelect value={animation} onChange={setAnimation} dark={dark} /></label>
          <label>Animation duration <input type="range" min="100" max="600" step="20" value={duration} disabled={animation === 'none'} onChange={e => setDuration(Number(e.target.value))} /><output>{duration} ms</output></label>
        </fieldset>
        <p className="hint">{article ? 'Theme and copy-link actions. Back returns to the documentation menu.' : 'Icons link to documentation sections. The indicator follows the section in view.'}</p>
      </section>
      <Documentation dark={dark} />
      {actions && <p role="status">{saving ? 'Saving your draft…' : saved ? 'Draft saved.' : 'Draft actions demo.'}</p>}
    </main><footer className="docs-footer"><span>React Dock</span><span>v{packageInfo.version}</span></footer></div>
    <dialog ref={dialogRef} className="draft-dialog" aria-labelledby="draft-dialog-title" onClose={() => { setSettingsOpen(false); dialogTrigger.current?.focus({ preventScroll: true }); }} onCancel={() => setSettingsOpen(false)} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setSettingsOpen(false);
    }}>
      <h2 id="draft-dialog-title">Draft settings</h2>
      <p>Choose how this draft is shared. This playground does not send or store your data.</p>
      <label><input type="checkbox" defaultChecked /> Keep draft private</label>
      <form method="dialog"><button className="demo-button">Done</button></form>
    </dialog>
    <Dock ariaLabel={actions ? 'Draft actions' : article ? 'Article controls' : 'Main navigation'} style={{ '--rd-surface': '#f8faf7', ...theme }} activeId={article || actions ? undefined : active}
      maxVisibleItems={many ? baseItems.length : undefined}
      styles={{ indicator: { transition: indicatorTransition } }}
      items={demoItems.map((item: DockItem) => ({ ...item, tooltip: tooltips ? item.tooltip : false }))} />
  </div>;
}
const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
