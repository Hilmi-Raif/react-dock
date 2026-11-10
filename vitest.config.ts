import { defineConfig } from 'vitest/config';
export default defineConfig({ test: {
  include: ['tests/**/*.test.{ts,tsx,mjs}'], environment: 'jsdom', setupFiles: ['tests/setup.ts'],
  coverage: { provider: 'v8', include: ['registry/react-dock/**/*.{ts,tsx}'],
    reporter: ['text', 'html', 'lcov', 'json-summary'],
    thresholds: { statements: 90, lines: 90, functions: 90, branches: 85 } },
} });
