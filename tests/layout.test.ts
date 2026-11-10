import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('uses the same typography for the introduction and documentation headings', () => {
  const css = readFileSync('demo/demo.css', 'utf8');
  expect(css).toContain('h1, h2 { font-size: clamp(32px, 5vw, 48px);');
});

test('uses a contrasting lavender for JSX component names in dark code snippets', () => {
  const css = readFileSync('demo/demo.css', 'utf8');
  expect(css).toContain('.code-block[data-dark="true"] .hljs-name { color: #d2a8ff; }');
});

test('lets the introduction and playground hints use the full content column', () => {
  const css = readFileSync('demo/demo.css', 'utf8');
  expect(css).toContain('.lede { font-size: 19px; line-height: 1.65; max-width: 100%;');
  expect(css).toContain('.hint { max-width: 100%;');
});

test('aligns documentation paragraphs with the full width code blocks', () => {
  const css = readFileSync('demo/demo.css', 'utf8');
  expect(css).toContain('.docs-section p { max-width: 100%;');
});

test('styles documentation links consistently across visited hover and keyboard focus', () => {
  const css = readFileSync('demo/demo.css', 'utf8');
  expect(css).toContain('.playground .docs-section a, .playground .docs-section a:visited { color: var(--demo-accent);');
  expect(css).toContain('.playground .docs-section a:hover { color: var(--demo-ink);');
  expect(css).toContain('.playground .docs-section a:focus-visible { outline: 2px solid var(--demo-accent);');
  expect(css).not.toContain('background: color-mix(in srgb, var(--demo-accent)');
});

test('suppresses touch highlights on pagination controls too', () => {
  const css = readFileSync('registry/react-dock/styles.css', 'utf8');
  expect(css).toContain('[data-touch-input="true"] [data-dock-arrow]:is(:hover, :active)');
  expect(css).toContain('-webkit-tap-highlight-color: transparent;');
});

test('aligns the header version to the wordmark text baseline with a smaller gap', () => {
  const css = readFileSync('demo/demo.css', 'utf8');
  expect(css).toContain('.header-brand { display: flex; align-items: baseline; gap: 6px;');
  expect(css).toContain('.header-brand .version { line-height: 1;');
});

test('limits tooltip text to two lines without removing the full label', () => {
  const css = readFileSync('registry/react-dock/styles.css', 'utf8');
  expect(css).toContain('-webkit-line-clamp: 2;');
  expect(css).toContain('-webkit-box-orient: vertical;');
  expect(css).toContain('overflow-wrap: anywhere;');
});

test('centers the brand symbol optically beside the wordmark', () => {
  const css = readFileSync('demo/demo.css', 'utf8');
  const symbol = css.match(/\.wordmark \.brand-symbol \{([^}]+)\}/)?.[1];
  expect(symbol).toContain('transform: translateY(-1px);');
});

test('keeps tooltip spacing compact', () => {
  const css = readFileSync('registry/react-dock/styles.css', 'utf8');
  expect(css).toContain('bottom: calc(100% + var(--rd-tooltip-gap, 10px));');
  expect(css).not.toContain('[data-slot="tooltip"])::after');
  expect(css.slice(css.indexOf(':where([data-react-dock] [data-slot="tooltip"])'))).toContain('pointer-events: none;');
});

test('custom demo keeps item spacing and tooltip spacing independently compact', () => {
  const demo = readFileSync('demo/main.tsx', 'utf8');
  expect(demo).toContain("'--rd-gap': '4px'");
  expect(demo).toContain("'--rd-padding': '4px'");
  expect(demo).toContain("'--rd-tooltip-gap': '10px'");
});

test('pressed controls keep the hover color without a flash', () => {
  const css = readFileSync('registry/react-dock/styles.css', 'utf8');
  expect(css).toContain('[data-slot="item"] > :is(button, a):active)::before { opacity: 1; transition: none; }');
  expect(css).toContain('transition: opacity 160ms ease-out;');
  expect(css).not.toContain('transition: background-color');
});

test('uses the inter-button gap as default edge padding, including custom themes', () => {
  const css = readFileSync('registry/react-dock/styles.css', 'utf8');
  expect(css).toContain('--rd-padding: var(--rd-gap);');
});

test('keeps pagination centered without wrapping', () => {
  const css = readFileSync('registry/react-dock/styles.css', 'utf8');
  expect(css).toContain('justify-content: center;');
  expect(css).toContain('flex-wrap: nowrap;');
  expect(css).not.toContain(' - 120px)');
});
