import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Dock } from '../registry/react-dock/dock';

const items = [{ id: 'theme', label: 'Theme', icon: 'T' }];

test('preserves long accessible labels and updates an open tooltip when the label changes', () => {
  const label = 'Configure integration '.repeat(30);
  const view = render(<Dock ariaLabel="Actions" items={[{ ...items[0], label }]} />);
  const button = screen.getByRole('button', { name: label.trim() });
  fireEvent.pointerEnter(button);
  expect(screen.getByRole('tooltip')).toHaveTextContent(label.trim());
  view.rerender(<Dock ariaLabel="Actions" items={[{ ...items[0], label: 'Updated label' }]} />);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Updated label');
  expect(screen.getByRole('button', { name: 'Updated label' })).toBe(button);
  view.rerender(<Dock ariaLabel="Actions" items={[{ ...items[0], tooltip: false }]} />);
  expect(screen.queryByRole('tooltip')).toBeNull();
});

test('space preserves button focus and escape closes tooltip without blurring', () => {
  render(<Dock ariaLabel="Actions" items={items} />);
  const button = screen.getByRole('button', { name: 'Theme' });
  button.focus();
  fireEvent.keyDown(button, { key: ' ' });
  expect(button).toHaveFocus();
  fireEvent.click(button);
  fireEvent.keyDown(button, { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  expect(button).toHaveFocus();
});

test('removed items do not restore stale pinned tooltips', () => {
  const view = render(<Dock ariaLabel="Actions" items={items} />);
  fireEvent.click(screen.getByRole('button', { name: 'Theme' }));
  view.rerender(<Dock ariaLabel="Actions" items={[]} />);
  view.rerender(<Dock ariaLabel="Actions" items={items} />);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

test('connects a scroll container mounted after the dock', async () => {
  let container: HTMLDivElement | null = null;
  const resolve = () => container;
  render(<Dock ariaLabel="Actions" items={items} scrollTarget={resolve} />);
  await act(async () => {
    container = document.createElement('div');
    container.scrollTop = 500;
    document.body.append(container);
  });
  await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());
  container!.remove();
});

test('keeps protection during a long smooth scroll then expires after scrolling stops', () => {
  vi.useFakeTimers();
  render(<Dock ariaLabel="Actions" items={[{ ...items[0], href: '#section', pinOnActivate: true }]} />);
  fireEvent.click(screen.getByRole('link'));
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.scroll(window);
  act(() => vi.advanceTimersByTime(500));
  fireEvent.scroll(window);
  expect(screen.getByRole('tooltip')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1200));
  fireEvent.scroll(window);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  vi.useRealTimers();
});

test('pointer leave does not close a keyboard focused tooltip', () => {
  render(<Dock ariaLabel="Actions" items={items} />);
  act(() => screen.getByRole('button').focus());
  fireEvent.pointerLeave(screen.getByRole('button'));
  expect(screen.getByRole('tooltip')).toBeInTheDocument();
});

test('secondary pointer presses do not pin action tooltips', () => {
  render(<Dock ariaLabel="Actions" items={items} />);
  fireEvent(screen.getByRole('button'), new MouseEvent('pointerdown', { button: 2, bubbles: true }));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
