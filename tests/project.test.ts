// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('defines a consistent project version', () => {
  const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
  const version = json('package.json').version;
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(json('package-lock.json').version).toBe(version);
  expect(json('package-lock.json').packages[''].version).toBe(version);
  expect(json('.release-please-manifest.json')['.']).toBe(version);
  expect(json('release-please-config.json').packages['.']['initial-version']).toBe('0.0.0');
});

test('documents navigation exports and opt-in tooltip pinning consistently', () => {
  const readme = readFileSync('README.md', 'utf8');
  expect(readme).toContain('`sectionNavigation`');
  expect(readme).toContain('`useSectionNavigation()`');
  expect(readme).not.toContain('Activating an item pins it until');
  expect(readFileSync('demo/documentation.tsx', 'utf8')).toContain("['sectionNavigation'");
});

test('exposes a stable surface slot independent of pagination', () => {
  expect(readFileSync('registry/react-dock/types.ts', 'utf8')).toContain("'surface'");
  expect(readFileSync('registry/react-dock/dock.tsx', 'utf8')).toContain("slot('surface')");
});

test('uses English copy in demo components', () => {
  for (const file of ['main.tsx', 'documentation.tsx', 'animation-select.tsx', 'code-block.tsx']) {
    const source = readFileSync(`demo/${file}`, 'utf8');
    expect(source).not.toMatch(/\benglish\b|\bt\('/);
  }
});
