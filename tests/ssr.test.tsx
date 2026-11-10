// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, test } from 'vitest';
import { Dock } from '../registry/react-dock/index';
test('renders semantic controls on server without browser globals', () => {
  expect(typeof window).toBe('undefined');
  const html = renderToString(<Dock ariaLabel="Article" visibility="mobile" items={[{ id: 'back', label: 'Back', icon: 'B', href: '/' }]} />);
  expect(html).toContain('aria-label="Article"'); expect(html).toContain('href="/"');
});
