import { renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useScrollTarget } from '../registry/react-dock/use-scroll-target';

test('resolves a missing target once per commit rather than twice on mount', () => {
  const resolve = vi.fn(() => null);
  const view = renderHook(() => useScrollTarget(resolve));
  expect(resolve).toHaveBeenCalledTimes(1);
  view.rerender();
  expect(resolve).toHaveBeenCalledTimes(2);
});
