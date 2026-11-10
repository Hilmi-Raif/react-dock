// @vitest-environment node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { expect, test } from 'vitest';

test('registry distributes the canonical source with alias-relative targets and no runtime packages', () => {
  expect(existsSync('registry.json')).toBe(true);
  const registry = JSON.parse(readFileSync('registry.json', 'utf8'));
  expect(registry.items).toHaveLength(1);
  const item = registry.items[0];
  expect(item.name).toBe('react-dock');
  expect(item.dependencies ?? []).toEqual([]);
  expect(item.registryDependencies ?? []).toEqual([]);
  const files = readdirSync('registry/react-dock').sort();
  expect(item.files.map((file: { path: string }) => file.path.split('/').pop()).sort()).toEqual(files);
  for (const file of item.files) {
    expect(file.target).toBe(`@ui/react-dock/${file.path.split('/').pop()}`);
    expect(readFileSync(file.path, 'utf8').length).toBeGreaterThan(0);
  }
  expect(existsSync('src')).toBe(false);
});

test('every runtime entry is client-marked and internal imports remain relative', () => {
  for (const file of readdirSync('registry/react-dock').filter(name => /\.(ts|tsx)$/.test(name))) {
    const source = readFileSync(`registry/react-dock/${file}`, 'utf8');
    if (file !== 'types.ts') expect(source.startsWith('"use client";')).toBe(true);
    const imports = [...source.matchAll(/from ['"]([^'"]+)['"]/g)].map(match => match[1]);
    expect(imports.every(path => path === 'react' || path.startsWith('./'))).toBe(true);
  }
});
