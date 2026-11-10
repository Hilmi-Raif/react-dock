import { expect, test } from 'vitest';
import { classifyChanges } from '../scripts/ci-changes.mjs';
import { readFileSync } from 'node:fs';

test('workflow gates releases on successful or deliberately skipped checks', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  expect(workflow).toContain('needs: [changes, quality, registry, e2e]');
  expect(workflow).toContain("contains(needs.*.result, 'failure')");
  expect(workflow).toContain("contains(needs.*.result, 'cancelled')");
  expect(workflow).toContain("needs.changes.outputs.registry == 'true'");
  expect(workflow).toContain("needs.changes.outputs.deploy == 'true'");
});

test('runs main branch publishing without repository variable switches', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8').replace(/\r\n/g, '\n');
  expect(workflow).not.toMatch(/vars\.(?:RELEASE_ENABLED|PAGES_ENABLED)/);
  expect(workflow).toContain("if: ${{ !cancelled() && needs.verify.result == 'success' && github.event_name == 'push' && github.ref == 'refs/heads/main' }}\n");
  expect(workflow).toContain("if: ${{ !cancelled() && needs.verify.result == 'success' && github.event_name != 'pull_request' && github.ref == 'refs/heads/main' && needs.changes.outputs.deploy == 'true' }}\n");
});

test('skips expensive jobs for prose changes only', () => {
  expect(classifyChanges(['README.md', 'CHANGELOG.md', 'docs/guide.md'])).toEqual({ quality: false, registry: false, e2e: false, deploy: false });
});
test('keeps dependencies, runtime, CI and unknown paths fully checked', () => {
  for (const path of ['package.json', 'package-lock.json', '.github/workflows/ci.yml', 'scripts/ci-changes.mjs', 'registry/react-dock/dock.tsx', 'new-config.json']) {
    expect(classifyChanges([path])).toEqual({ quality: true, registry: true, e2e: true, deploy: true });
  }
});
test('checks repository metadata without browser tests or publishing artifacts', () => {
  for (const path of ['.release-please-manifest.json', 'release-please-config.json', '.github/dependabot.yml', '.gitignore', 'eslint.config.mjs', 'vitest.config.ts']) {
    expect(classifyChanges([path])).toEqual({ quality: true, registry: false, e2e: false, deploy: false });
  }
});
test('checks demo changes without reinstalling registry fixtures', () => {
  for (const path of ['demo/documentation.tsx', 'demo/styles.css', 'vite.demo.config.ts']) {
    expect(classifyChanges([path])).toEqual({ quality: true, registry: false, e2e: true, deploy: true });
  }
});
test('checks registry tooling without browser tests or demo deployment', () => {
  expect(classifyChanges(['scripts/test-registry.mjs'])).toEqual({ quality: true, registry: true, e2e: false, deploy: false });
});
test('combines mixed changes without downgrading required checks', () => {
  expect(classifyChanges(['demo/main.tsx', 'scripts/test-registry.mjs', 'README.md'])).toEqual({ quality: true, registry: true, e2e: true, deploy: true });
  expect(classifyChanges(['.release-please-manifest.json', 'registry/react-dock/styles.css'])).toEqual({ quality: true, registry: true, e2e: true, deploy: true });
});
test('routes test changes without rebuilding deployments', () => {
  expect(classifyChanges(['tests/docs.test.tsx'])).toEqual({ quality: true, registry: false, e2e: false, deploy: false });
  expect(classifyChanges(['e2e/demo.spec.ts'])).toEqual({ quality: true, registry: false, e2e: true, deploy: false });
});
test('manual and initial runs check everything', () => {
  expect(Object.values(classifyChanges([], true))).toEqual([true, true, true, true]);
});
test('handles empty, deleted and renamed path sets conservatively', () => {
  expect(classifyChanges([])).toEqual({ quality: false, registry: false, e2e: false, deploy: false });
  expect(classifyChanges(['registry/react-dock/dock.tsx', 'docs/old-dock.md'])).toEqual({ quality: true, registry: true, e2e: true, deploy: true });
  expect(classifyChanges(['docs/old.md', 'docs/new.md'])).toEqual({ quality: false, registry: false, e2e: false, deploy: false });
});
