import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function classifyChanges(paths, full = false) {
  const result = { quality: full, registry: full, e2e: full, deploy: full };
  for (const path of paths) {
    if (/^(README\.md|CHANGELOG\.md|LICENSE(?:\.md)?|docs\/.*\.md)$/.test(path)) continue;
    result.quality = true;
    if (path.startsWith('tests/')) continue;
    if (['.release-please-manifest.json', 'release-please-config.json', '.github/dependabot.yml', '.gitignore', 'eslint.config.mjs', 'vitest.config.ts'].includes(path)) continue;
    if (path.startsWith('demo/') || path === 'vite.demo.config.ts') {
      result.e2e = true;
      result.deploy = true;
      continue;
    }
    if (path === 'scripts/test-registry.mjs') {
      result.registry = true;
      continue;
    }
    if (path.startsWith('e2e/') || path === 'playwright.config.ts') {
      result.e2e = true;
      continue;
    }
    Object.assign(result, { registry: true, e2e: true, deploy: true });
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { CI_BASE: base, CI_HEAD: head, GITHUB_EVENT_NAME: event } = process.env;
  const full = event === 'workflow_dispatch' || !base || /^0+$/.test(base);
  const paths = full ? [] : execFileSync('git', ['diff', '--no-renames', '--name-only', '-z', base, head], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const result = classifyChanges(paths, full);
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(result).map(([key, value]) => `${key}=${value}\n`).join(''));
}
