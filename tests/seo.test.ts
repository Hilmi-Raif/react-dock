// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('serves descriptive metadata and one canonical in the initial HTML', () => {
  const html = readFileSync('demo/index.html', 'utf8');
  expect(html).toContain('name="description"');
  expect(html.match(/rel="canonical"/g)).toHaveLength(1);
  expect(html).toContain('https://hilmi-raif.github.io/react-dock/');
  expect(html).toContain('property="og:title"');
  expect(html).toContain('name="twitter:card"');
  expect(html).toContain('rel="icon"');
  expect(html).toContain('React Dock - React Navigation, Docs &amp; Playground');
  expect(html).toContain('rel="apple-touch-icon"');
  expect(html).toContain('property="og:image"');
  expect(html).not.toContain('name="keywords"');
});

test('lists only the actual document URL in the sitemap', () => {
  const sitemap = readFileSync('demo/public/sitemap.xml', 'utf8');
  expect(sitemap).toContain('<loc>https://hilmi-raif.github.io/react-dock/</loc>');
  expect(sitemap).not.toContain('#');
});
