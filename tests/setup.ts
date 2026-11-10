import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
    document.documentElement.removeAttribute('data-dark');
    document.documentElement.removeAttribute('data-ready');
  } catch (_error) {
    void _error;
  }
});
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
}
if (typeof window !== 'undefined' && !globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}
