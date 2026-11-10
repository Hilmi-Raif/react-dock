import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    lib: { entry: 'registry/react-dock/index.ts', formats: ['es'], fileName: 'index' },
    rollupOptions: {
      onwarn(warning, warn) {
        // banner restores use client
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) return;
        if (warning.code === 'SOURCEMAP_ERROR' && warning.loc?.line === 1) return;
        warn(warning);
      },
      external: (id) => /^react(?:-dom)?(?:\/|$)/.test(id),
      output: { banner: '"use client";' },
    },
  },
});
