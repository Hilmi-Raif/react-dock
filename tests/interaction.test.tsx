import { StrictMode, useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useDockInteraction } from '../registry/react-dock/use-dock-interaction';

function Fixture() {
  const rootRef = useRef<HTMLDivElement>(null);
  const state = useDockInteraction({ rootRef });
  return <><input aria-label="Outside" /><div ref={rootRef} onPointerLeave={state.close}>
    <button onClick={() => state.activate('theme')} onMouseEnter={() => state.open('theme')}>Theme</button>
    <button onMouseEnter={() => state.open('share')}>Share</button>
    <button onClick={() => { state.activate('top'); state.startAutoScroll(); }}>Top</button>
    <output>{state.openId ?? 'closed'}:{state.pinnedId ?? 'none'}</output>
  </div></>;
}
afterEach(() => vi.useRealTimers());
test('pins an action through pointer leave, then replaces pin on another hover', () => {
  render(<Fixture />);
  fireEvent.click(screen.getByText('Theme'));
  fireEvent.pointerLeave(screen.getByText('Theme').parentElement!);
  expect(screen.getByText('theme:theme')).toBeInTheDocument();
  fireEvent.mouseEnter(screen.getByText('Share'));
  expect(screen.getByText('share:none')).toBeInTheDocument();
});
test('protects auto-scroll for 1200ms, then dismisses on scroll', () => {
  vi.useFakeTimers(); render(<Fixture />);
  fireEvent.click(screen.getByText('Top')); fireEvent.scroll(window);
  expect(screen.getByText('top:top')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1200)); fireEvent.scroll(window);
  expect(screen.getByText('closed:none')).toBeInTheDocument();
});
test.each(['wheel', 'touchmove', 'blur'])('manual %s interrupts protection', (event) => {
  render(<Fixture />); fireEvent.click(screen.getByText('Top'));
  fireEvent(window, new Event(event));
  expect(screen.getByText('closed:none')).toBeInTheDocument();
});
test('outside press and scrolling keys dismiss without blurring unrelated input', () => {
  render(<Fixture />); fireEvent.click(screen.getByText('Theme'));
  const input = screen.getByLabelText('Outside'); input.focus();
  fireEvent.pointerDown(input);
  expect(input).toHaveFocus(); expect(screen.getByText('closed:none')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Top')); fireEvent.keyDown(window, { key: 'PageDown' });
  expect(screen.getByText('closed:none')).toBeInTheDocument();
});
test('cleans timers under StrictMode and unmount', () => {
  vi.useFakeTimers(); const view = render(<StrictMode><Fixture /></StrictMode>);
  fireEvent.click(screen.getByText('Top')); view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
