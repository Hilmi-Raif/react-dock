import { defineConfig } from 'vite';
import libraryConfig from './vite.config';
export default defineConfig({ root: 'demo', base: '/react-dock/', build: {
  outDir: '../demo-dist', emptyOutDir: true,
  rollupOptions: { onwarn: libraryConfig.build?.rollupOptions?.onwarn },
} });
