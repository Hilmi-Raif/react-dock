import { CodeBlock } from './code-block';
import { useEffect, useState } from 'react';

const basic = `import { Dock, useActiveSection } from '@/components/ui/react-dock';
import '@/components/ui/react-dock/styles.css';

export function Navigation() {
  const activeId = useActiveSection(['home', 'article']);
  return <Dock
    ariaLabel="Main navigation"
    activeId={activeId}
    items={[
      { id: 'home', label: 'Home', href: '#home', icon: <HomeIcon /> },
      { id: 'article', label: 'Article', href: '#article', icon: <ArticleIcon /> },
    ]}
  />;
}`;
const styling = `<Dock
  ariaLabel="Article controls"
  items={items}
  style={{
    '--rd-gap': '4px',
    '--rd-padding': '4px',
    '--rd-tooltip-gap': '10px',
    '--rd-bottom': '24px',
    '--rd-hover': '#36554a',
  }}
  styles={{
    tooltip: { borderRadius: '8px', fontSize: '13px' },
    surface: { boxShadow: '0 0 0 1px var(--rd-border), 0 4px 18px rgb(0 0 0 / 12%)' },
  }}
/>`;
const container = `import { useCallback, useRef } from 'react';

const areaRef = useRef<HTMLDivElement>(null);
const resolveArea = useCallback(() => areaRef.current, []);
const activeId = useActiveSection(['home', 'article'], resolveArea);

return <>
  <div ref={areaRef} style={{ height: '80vh', overflow: 'auto' }}>
    <section id="home">...</section>
    <section id="article">...</section>
  </div>
  <Dock ariaLabel="Navigation" items={items}
    activeId={activeId} scrollTarget={resolveArea} />
</>;`;
const props = [
  ['items', 'readonly DockItem[]', 'required', 'Links and actions with unique IDs.'],
  ['ariaLabel', 'string', 'required', 'Navigation name for screen readers.'],
  ['activeId', 'string', 'undefined', 'Active indicator ID, controlled by your app.'],
  ['sectionNavigation', 'boolean', 'true', 'Animate same-page hash links; set false for native or application navigation.'],
  ['visibility', "'all' | 'mobile' | 'desktop'", "'all'", 'Stylesheet breakpoint: 768px.'],
  ['scrollTarget', '() => HTMLElement | Window | null', 'window', 'Scroll surface; null does not fall back.'],
  ['maxVisibleItems', 'number', 'undefined', 'Upper limit per group; narrow screens may show fewer items.'],
  ['autoScrollDuration', 'number', '1200', 'Tooltip protection in ms after the last scroll event.'],
  ['className / style', 'string / DockStyle', 'undefined', 'Root class and CSS variables.'],
  ['classNames / styles', 'Partial<Record<DockSlot, …>>', 'undefined', 'Style each slot without replacing the markup.'],
  ['renderLink', '(props, item) => ReactNode', '<a>', 'Router adapter; forward the supplied props and events.'],
];

export function Documentation({ dark = false }: { dark?: boolean }) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const installCommand = 'npx shadcn@latest add Hilmi-Raif/react-dock/react-dock';
  useEffect(() => {
    if (copyStatus === 'idle') return;
    const timer = setTimeout(() => setCopyStatus('idle'), 1000);
    return () => clearTimeout(timer);
  }, [copyStatus]);
  const basicExample = basic;
  const containerExample = container;
  return <div className="documentation">
    <section id="usage" className="docs-section"><h2>Getting started</h2>
      <p>Add React Dock to your project with the command below. Edit the component files directly without a React Dock runtime dependency. Browse the source on <a href="https://github.com/Hilmi-Raif/react-dock">GitHub</a>.</p>
      <div className="install-block">
        <pre className="install-command"><code>{installCommand}</code></pre>
        <button type="button" className="install-copy" aria-label={copyStatus === 'copied' ? 'Command copied' : 'Copy install command'} onClick={() => {
          void Promise.resolve().then(() => navigator.clipboard.writeText(installCommand)).then(() => setCopyStatus('copied')).catch(() => setCopyStatus('error'));
        }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{copyStatus === 'copied' ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>}</svg></button>
      </div>
      {copyStatus === 'error' && <span role="status" className="copy-feedback">Could not copy</span>}
      <p>The CLI uses the UI directory alias in <code>components.json</code>. Manual installation uses the files in <code>registry/react-dock</code>. The stylesheet is imported once, in the Vite entry or Next.js root layout.</p>
      <p>Requires React and React DOM 18 or newer. <code>HomeIcon</code> and <code>ArticleIcon</code> are placeholders; hash links refer to sections with matching IDs.</p><CodeBlock code={basicExample} dark={dark} />
    </section>
    <section id="props" className="docs-section"><h2>Props</h2><div className="table-scroll" tabIndex={0} role="region" aria-label="Dock props"><table><thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody>{props.map(([name, type, value, description]) => <tr key={name}><th scope="row"><code>{name}</code></th><td><code>{type}</code></td><td><code>{value}</code></td><td>{description}</td></tr>)}</tbody></table></div>
      <h3>DockItem</h3><p>Required: <code>id</code>, <code>label</code>, <code>icon</code>. Optional: <code>href</code>, <code>onClick</code>, <code>disabled</code>, <code>loading</code>, <code>loadingLabel</code>, <code>tooltip</code>, <code>pinOnActivate</code>, <code>tooltipDismissOnActivate</code>, <code>tooltipSuppressed</code>. <code>href</code> renders a link; other items render buttons. <code>tooltip</code> defaults to true and <code>pinOnActivate</code> to false. Tooltips follow hover or keyboard focus and do not capture the pointer. Each item has a unique ID and a nonempty label.</p>
      <p><code>loading</code> displays a spinner and blocks activation while keeping the control focusable. <code>loadingLabel</code> supplies its accessible name and tooltip during that operation. The application controls when loading ends.</p>
      <p>Set <code>tooltipDismissOnActivate</code> for actions that open a dialog, and bind <code>tooltipSuppressed</code> to the dialog's open state. Restored focus does not reopen the tooltip; fresh hover or keyboard navigation can show it again. Enable Draft actions in the playground to try saving and opening settings.</p>
    </section>
    <section id="styling" className="docs-section"><h2>Styling</h2><p>Hover and press share the color set by <code>--rd-hover</code>. <code>--rd-active</code> is only for the active-section indicator. Tooltip fonts inherit from your app and can be overridden through a slot.</p><CodeBlock code={styling} dark={dark} />
      <p><strong>Slots:</strong> {['root', 'surface', 'dock', 'item', 'icon', 'indicator', 'tooltip'].map((name, index) => <span key={name}>{index > 0 && ', '}<code>{name}</code></span>)}.</p><p><strong>CSS variables:</strong> {['--rd-surface', '--rd-foreground', '--rd-border', '--rd-hover', '--rd-active', '--rd-radius', '--rd-item-size', '--rd-gap', '--rd-padding', '--rd-tooltip-gap', '--rd-bottom', '--rd-z-index'].map((name, index) => <span key={name}>{index > 0 && ', '}<code>{name}</code></span>)}.</p>
    </section>
    <section id="integration" className="docs-section"><h2>Scroll containers and routers</h2><CodeBlock code={containerExample} dark={dark} /><p>Hash links do not automatically scroll a custom container. Handle the item <code>onClick</code> and call <code>scrollIntoView</code> when needed. For Next Link, use <code>{'renderLink={(props) => <Link {...props} />}'}</code>. Keep the event handlers and ARIA attributes.</p>
      <h3>Hooks and accessibility</h3><p><code>useActiveSection(ids, scrollTarget?)</code> follows document section order. For custom dock UI, use <code>{'useDockInteraction({ rootRef, scrollTarget?, autoScrollDuration? })'}</code>. It provides {['openId', 'pinnedId', 'open', 'close', 'activate', 'dismiss', 'startAutoScroll', 'stopAutoScroll'].map((name, index) => <span key={name}>{index > 0 && ', '}<code>{name}</code></span>)}.</p><p><code>useSectionNavigation()</code> provides <code>destination</code>, <code>navigate(id)</code>, and <code>cancel()</code> for window scrolling. Use <code>destination ?? activeId</code> to keep the selected item steady during navigation. Section alignment follows <code>scroll-margin-top</code> and respects reduced motion.</p><p>Tab moves between controls, Enter/Space activates buttons, and Escape closes tooltips. The fixed-position dock belongs outside transformed ancestors, or inside the same dialog when used in a modal.</p>
    </section>
  </div>;
}
