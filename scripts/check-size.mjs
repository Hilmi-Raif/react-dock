import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { build } from 'esbuild';

const sizes = bytes => ({ bytes: bytes.length, gzip: gzipSync(bytes).length, brotli: brotliCompressSync(bytes).length });
const report = {};
for (const file of ['index.js', 'styles.css']) report[file] = sizes(await readFile(`dist/${file}`));
assert.ok(report['styles.css'].gzip <= 1600, 'Production CSS exceeds 1,600 bytes gzip');

for (const name of ['Dock', 'useActiveSection', 'useDockInteraction', 'useSectionNavigation']) {
  const result = await build({
    stdin: { contents: `export { ${name} } from './dist/index.js'`, resolveDir: process.cwd() },
    bundle: true, write: false, minify: true, format: 'esm',
    external: ['react', 'react/*', 'react-dom', 'react-dom/*'],
  });
  const output = result.outputFiles[0];
  report[name] = sizes(output.contents);
  if (name === 'Dock') {
    // navigation and overflow controls are included but section tracking stays separate
    assert.ok(!output.text.includes('IntersectionObserver'), 'Unused section tracking leaked into Dock');
    assert.ok(report[name].gzip <= 4900, 'Dock with navigation, loading, and overflow controls exceeds 4,900 bytes gzip');
  } else {
    assert.ok(!output.text.includes('data-react-dock'), 'Unused Dock leaked into hook');
    assert.ok(report[name].gzip <= (name === 'useSectionNavigation' ? 1400 : 1200), `${name} exceeds its gzip budget`);
  }
}
console.table(report);
console.log('Size budgets and isolated-import tree-shaking verified; React excluded.');
