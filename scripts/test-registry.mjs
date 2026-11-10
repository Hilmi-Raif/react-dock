import { mkdtemp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { transform } from 'esbuild';

const run = (command, cwd, input) => new Promise((resolve, reject) => {
  const child = spawn(command, { cwd, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  child.stdin.end(input);
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve(output) : reject(new Error(`${command}\n${output}`)));
});
const root = process.cwd();
const base = process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : join(tmpdir(), 'opencode');
await mkdir(base, { recursive: true });
const workspace = await mkdtemp(join(base, 'react-dock-registry-'));
console.log(`Consumer fixtures: ${workspace}`);
await run('npx --yes shadcn@4.23.0 build -o .registry-test', root);
const payload = await readFile(join(root, '.registry-test/react-dock.json'));
const server = createServer((request, response) => {
  response.setHeader('content-type', 'application/json');
  response.end(payload);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/react-dock.json`;
const json = (path, value) => writeFile(path, JSON.stringify(value, null, 2));
try {
  for (const [framework, reactVersion, typesVersion] of [['vite', '18.3.1', '^18.3.0'], ['vite', '19.2.3', '^19.2.0'], ['next', '19.2.3', '^19.2.0']]) {
    const label = `${framework}-react-${reactVersion}`;
    const cwd = join(workspace, label);
    await mkdir(join(cwd, 'src/app'), { recursive: true });
    await json(join(cwd, 'package.json'), {
      name: `registry-consumer-${framework}`, private: true, type: 'module',
      scripts: { build: framework === 'vite' ? 'tsc --noEmit && vite build' : 'next build --webpack' },
      dependencies: { react: reactVersion, 'react-dom': reactVersion, ...(framework === 'next' ? { next: '16.1.6' } : {}) },
      devDependencies: { typescript: '^5.9.0', '@types/react': typesVersion, '@types/react-dom': typesVersion, '@types/node': '^22.0.0', ...(framework === 'vite' ? { vite: '^6.4.0' } : {}) },
    });
    await json(join(cwd, 'tsconfig.json'), { compilerOptions: {
      target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], jsx: 'react-jsx',
      module: 'ESNext', moduleResolution: 'bundler', strict: true, skipLibCheck: true,
      esModuleInterop: true, resolveJsonModule: true, isolatedModules: true, noEmit: true,
      paths: { '~/*': ['./src/*'] },
    }, include: ['src', '.next/types/**/*.ts'] });
    await writeFile(join(cwd, 'src/app/globals.css'), 'body { margin: 0; }');
    await json(join(cwd, 'components.json'), {
      $schema: 'https://ui.shadcn.com/schema.json', style: 'new-york', rsc: framework === 'next', tsx: true,
      tailwind: { config: '', css: 'src/app/globals.css', baseColor: 'neutral', cssVariables: true },
      aliases: { components: '~/components', ui: '~/custom-ui', utils: '~/lib/utils', lib: '~/lib', hooks: '~/hooks' },
    });
    const install = await run(`npx --yes shadcn@4.23.0 add ${url} --yes`, cwd);
    console.log(`${label}: ${install.trim()}`);
    const installed = join(cwd, 'src/custom-ui/react-dock');
    assert.equal((await readdir(installed)).length, 8);
    for (const file of await readdir(installed)) {
      const actual = await readFile(join(installed, file), 'utf8');
      const expected = await readFile(join(root, 'registry/react-dock', file), 'utf8');
      if (file.endsWith('.css')) {
        assert.equal((await transform(actual, { loader: 'css', minify: true })).code,
          (await transform(expected, { loader: 'css', minify: true })).code);
      } else assert.equal(actual, expected);
    }
    const edited = join(installed, 'types.ts');
    const edit = `${await readFile(edited, 'utf8')}\n// consumer edit\n`;
    await writeFile(edited, edit);
    await run(`npx --yes shadcn@4.23.0 add ${url} --yes`, cwd, 'n\n'.repeat(10));
    assert.equal(await readFile(edited, 'utf8'), edit, 'Consumer edit must survive default reinstall');
    const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));
    assert.deepEqual(Object.keys(pkg.dependencies).sort(), framework === 'vite' ? ['react', 'react-dom'] : ['next', 'react', 'react-dom']);
    const component = `"use client";\nimport { Dock, useActiveSection } from '../custom-ui/react-dock';\nexport default function Page() { const activeId = useActiveSection(['home']); return <><section id="home">Hello</section><Dock ariaLabel="Navigation" activeId={activeId} items={[{id:'home',label:'Home',href:'#home',icon:<span>H</span>}]} /></>; }`;
    if (framework === 'next') {
      await writeFile(join(cwd, 'src/app/page.tsx'), component);
      await writeFile(join(cwd, 'src/app/layout.tsx'), `import '../custom-ui/react-dock/styles.css';\nexport default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }`);
    } else {
      await writeFile(join(cwd, 'src/app/page.tsx'), component);
      await writeFile(join(cwd, 'src/main.tsx'), `import { createRoot } from 'react-dom/client'; import Page from './app/page'; import './custom-ui/react-dock/styles.css'; createRoot(document.getElementById('root')!).render(<Page />);`);
      await writeFile(join(cwd, 'index.html'), '<div id="root"></div><script type="module" src="/src/main.tsx"></script>');
    }
    await run('npm install --no-audit --no-fund', cwd);
    const result = await run('npm run build', cwd);
    await writeFile(join(cwd, 'build.log'), result);
    console.log(`${label}: production build passed; custom alias, registry files, no runtime Dock dependency, and edit preservation verified`);
  }
} finally {
  server.close();
}
