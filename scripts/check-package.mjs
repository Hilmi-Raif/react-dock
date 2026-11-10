import { readFile, writeFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import assert from 'node:assert/strict';
// minify distributed css only
const css = await transform(await readFile('registry/react-dock/styles.css', 'utf8'), { loader: 'css', minify: true });
await writeFile('dist/styles.css', css.code);
const js = await readFile('dist/index.js', 'utf8');
assert.match(js, /^"use client"/);
assert.match(js, /from ["']react(?:\/jsx-runtime)?["']/);
assert.doesNotMatch(js, /react\.production|react\.development/);
await readFile('dist/index.d.ts');
await readFile('dist/styles.css');
console.log('Package contract verified: client directive, external React, declarations, CSS.');
