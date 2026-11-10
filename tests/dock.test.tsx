import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Dock } from '../registry/react-dock/dock';
const items = [{ id: 'theme', label: 'Theme', icon: 'T' }, { id: 'back', label: 'Back', icon: 'B', tooltip: false }];
test('keeps loading controls accessible and blocks repeated actions and links', () => {
  const action = vi.fn();
  const item = { id: 'save', label: 'Save', icon: 'S', onClick: action };
  const view = render(<Dock ariaLabel="Actions" items={[item]} />);
  fireEvent.pointerEnter(screen.getByRole('button', { name: 'Save' }));
  const tooltip = screen.getByRole('tooltip');
  view.rerender(<Dock ariaLabel="Actions" items={[{ ...item, loading: true, loadingLabel: 'Saving' }]} />);
  const button = screen.getByRole('button', { name: 'Saving' });
  expect(button).toHaveAttribute('aria-busy', 'true');
  expect(button).toHaveAttribute('aria-disabled', 'true');
  expect(button).not.toBeDisabled();
  expect(screen.getByRole('tooltip')).toBe(tooltip);
  expect(tooltip).toHaveTextContent('Saving');
  fireEvent.click(button); fireEvent.click(button);
  expect(action).not.toHaveBeenCalled();
  expect(button.querySelector('[data-dock-spinner]')).not.toBeNull();
  view.rerender(<Dock ariaLabel="Actions" items={[{ ...item, href: '#save', loading: true }]} />);
  expect(fireEvent.click(screen.getByRole('link', { name: 'Save' }))).toBe(false);
  expect(action).not.toHaveBeenCalled();
});

test('dismisses dialog tooltips and requires fresh intent after suppression', () => {
  const item = { id: 'settings', label: 'Settings', icon: 'S', tooltipDismissOnActivate: true };
  const view = render(<Dock ariaLabel="Actions" items={[item]} />);
  const button = screen.getByRole('button', { name: 'Settings' });
  fireEvent.pointerEnter(button);
  fireEvent.click(button);
  expect(screen.queryByRole('tooltip')).toBeNull();
  view.rerender(<Dock ariaLabel="Actions" items={[{ ...item, tooltipSuppressed: true }]} />);
  fireEvent.focus(button);
  expect(screen.queryByRole('tooltip')).toBeNull();
  view.rerender(<Dock ariaLabel="Actions" items={[item]} />);
  expect(screen.queryByRole('tooltip')).toBeNull();
  fireEvent.pointerEnter(button);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Settings');
});
test('keeps the hovered tooltip mounted when another control loses focus', () => {
  render(<Dock ariaLabel="Actions" items={[
    { id: 'first', label: 'First', icon: '1' },
    { id: 'second', label: 'Second', icon: '2' },
  ]} />);
  const first = screen.getByRole('button', { name: 'First' });
  const second = screen.getByRole('button', { name: 'Second' });
  fireEvent.focus(first);
  fireEvent.pointerLeave(first);
  fireEvent.pointerEnter(second);
  const tooltip = screen.getByRole('tooltip');
  fireEvent.pointerDown(second, { pointerType: 'mouse', button: 0 });
  fireEvent.blur(first, { relatedTarget: second });
  fireEvent.focus(second);
  expect(screen.getByRole('tooltip')).toBe(tooltip);
  expect(tooltip).toHaveTextContent('Second');
  fireEvent.pointerUp(second);
  fireEvent.click(second);
  expect(screen.getByRole('tooltip')).toBe(tooltip);
});

test('removes a dismissed tooltip immediately without retaining an exit state', () => {
  render(<Dock ariaLabel="Actions" items={items} />);
  const button = screen.getByRole('button', { name: 'Theme' });
  fireEvent.pointerEnter(button);
  const tooltip = screen.getByRole('tooltip');
  fireEvent.pointerLeave(button);
  expect(screen.queryByRole('tooltip')).toBeNull();
  expect(tooltip).not.toBeInTheDocument();
});

test('prevents native dragging from links and nested image icons without blocking clicks', () => {
  const onClick = vi.fn();
  render(<Dock ariaLabel="Navigation" items={[{ id: 'docs', label: 'Docs', href: '#docs', icon: <img src="/icon.svg" alt="" />, onClick }]} />);
  const link = screen.getByRole('link', { name: 'Docs' });
  for (const target of [link, link.querySelector('img')!]) {
    expect(fireEvent.dragStart(target)).toBe(false);
  }
  fireEvent.click(link, { ctrlKey: true });
  expect(link).toHaveAttribute('href', '#docs');
  fireEvent.click(link);
  expect(onClick).toHaveBeenCalledOnce();
});

test('shows a temporary touch tooltip and clears pressed feedback on cancellation', () => {
  vi.useFakeTimers();
  render(<Dock ariaLabel="Actions" items={items} />);
  const button = screen.getByRole('button', { name: 'Theme' });
  const touchDown = () => {
    const event = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    fireEvent(button, event);
  };
  touchDown();
  expect(button).toHaveAttribute('data-touch-pressed', 'true');
  fireEvent.pointerUp(window);
  expect(button).not.toHaveAttribute('data-touch-pressed');
  fireEvent.click(button);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Theme');
  const tooltip = screen.getByRole('tooltip');
  act(() => vi.advanceTimersByTime(1600));
  expect(screen.getByRole('tooltip')).toBe(tooltip);
  touchDown();
  fireEvent.pointerUp(window);
  fireEvent.click(button);
  expect(screen.getByRole('tooltip')).toBe(tooltip);
  act(() => vi.advanceTimersByTime(1999));
  expect(screen.getByRole('tooltip')).toBe(tooltip);
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole('tooltip')).toBeNull();
  touchDown();
  fireEvent.pointerCancel(window);
  expect(button).not.toHaveAttribute('data-touch-pressed');
  touchDown();
  fireEvent.touchMove(window);
  expect(button).not.toHaveAttribute('data-touch-pressed');
  vi.useRealTimers();
});
test('keeps a touch tooltip mounted across pointer exit and repeated activation', () => {
  vi.useFakeTimers();
  try {
    render(<Dock ariaLabel="Actions" items={items} />);
    const button = screen.getByRole('button', { name: 'Theme' });
    const pointer = (type: string) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, 'pointerType', { value: 'touch' });
      fireEvent(button, event);
    };
    pointer('pointerdown'); pointer('pointerup'); fireEvent.click(button);
    const tooltip = screen.getByRole('tooltip');
    for (let index = 0; index < 4; index += 1) {
      pointer('pointerout');
      expect(screen.getByRole('tooltip')).toBe(tooltip);
      act(() => vi.advanceTimersByTime(1500));
      pointer('pointerdown'); pointer('pointerup'); fireEvent.click(button);
      expect(screen.getByRole('tooltip')).toBe(tooltip);
    }
    act(() => vi.advanceTimersByTime(1999));
    expect(screen.getByRole('tooltip')).toBe(tooltip);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('tooltip')).toBeNull();
  } finally { vi.useRealTimers(); }
});

test('animates unequal group widths and cancels the animation on unmount', () => {
  const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const width = this.hasAttribute('data-dock-frame') ? 100 + this.querySelectorAll('[data-slot="item"]').length * 44 : 44;
    return { x: 0, y: 0, top: 0, left: 0, right: width, bottom: 44, width, height: 44, toJSON() {} };
  });
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  const original = HTMLElement.prototype.animate;
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, writable: true, value: animate });
  const view = render(<Dock ariaLabel="Actions" maxVisibleItems={2} items={[...items, { id: 'extra', label: 'Extra', icon: 'E' }]} />);
  expect(animate).toHaveBeenCalledWith([{ width: '232px' }, { width: '188px' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  view.unmount();
  expect(cancel).toHaveBeenCalled();
  HTMLElement.prototype.animate = original;
  rect.mockRestore();
});
test('changes complete item groups without scrolling and preserves the selected page', () => {
  render(<Dock ariaLabel="Actions" items={items} />);
  const nav = screen.getByRole('navigation');
  const frame = nav.parentElement!;
  frame.style.padding = '4px';
  frame.style.columnGap = '4px';
  nav.style.columnGap = '4px';
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 130 });
  fireEvent.resize(window);
  expect(document.querySelector('[data-dock-arrow="previous"]')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next items' })).toBeEnabled();
  expect(nav.querySelectorAll('[data-slot="item"]')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Next items' }));
  expect(document.querySelector('[data-dock-pages]')).toBeNull();
  expect(screen.getByRole('button', { name: /^Back$/ })).toBeInTheDocument();
  fireEvent.scroll(window);
  expect(screen.getByRole('button', { name: /^Back$/ })).toBeInTheDocument();
  expect(document.querySelector('[data-dock-arrow="next"]')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Previous items' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Previous items' }));
  expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  fireEvent.resize(window);
  expect(screen.queryByRole('button', { name: 'Next items' })).not.toBeInTheDocument();
});
test('preserves hover tooltips and active state without a hover toggle', () => {
  render(<Dock ariaLabel="Actions" items={items} activeId="back" />);
  expect(document.querySelector('[data-react-dock]')).not.toHaveAttribute('data-hover-animation');
  fireEvent.pointerEnter(screen.getByRole('button', { name: 'Theme' }));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Theme');
  expect(screen.getByRole('button', { name: 'Back' }).closest('[data-active]')).toHaveAttribute('data-active', 'true');
});
test('moves tooltip on intentional hover during navigation scroll protection', () => {
  render(<Dock ariaLabel="Navigation" items={[
    { id: 'home', label: 'Home', href: '#home', icon: 'H' },
    { id: 'article', label: 'Article', href: '#article', icon: 'A' },
  ]} />);
  fireEvent.pointerEnter(screen.getByRole('link', { name: 'Article' }));
  fireEvent.click(screen.getByRole('link', { name: 'Article' }));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Article');
  fireEvent.pointerEnter(screen.getByRole('link', { name: 'Home' }));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Home');
  // smooth scroll continues after hover
  fireEvent.scroll(window);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Home');
  expect(screen.getByRole('link', { name: 'Article' }).closest('[data-pinned]')).toHaveAttribute('data-pinned', 'false');
  fireEvent.wheel(window);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
test('keeps one indicator mounted across active changes and tooltip interactions', () => {
  const view = render(<Dock ariaLabel="Actions" items={items} activeId="theme" />);
  const indicator = document.querySelector('[data-slot="indicator"]');
  expect(indicator).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Theme' }));
  view.rerender(<Dock ariaLabel="Actions" items={items} activeId="back" />);
  expect(document.querySelector('[data-slot="indicator"]')).toBe(indicator);
  expect(screen.getByRole('button', { name: 'Back' }).closest('[data-active]')).toHaveAttribute('data-active', 'true');
});
afterEach(() => { Object.defineProperty(window, 'scrollY', { value: 0, configurable: true }); vi.restoreAllMocks(); });
test('renders active actions independently from pinned tooltip and updates label', () => {
  const view = render(<Dock ariaLabel="Actions" items={items} activeId="back" />);
  fireEvent.pointerEnter(screen.getByRole('button', { name: 'Theme' }));
  fireEvent.click(screen.getByRole('button', { name: 'Theme' }));
  expect(screen.getByRole('tooltip')).toHaveTextContent('Theme');
  expect(screen.getByRole('button', { name: 'Back' }).closest('[data-active]')).toHaveAttribute('data-active', 'true');
  view.rerender(<Dock ariaLabel="Actions" items={[{ ...items[0], label: 'Light mode' }, items[1]]} />);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Light mode');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
test('does not pin a default action or keep its tooltip after pointer exit', () => {
  render(<Dock ariaLabel="Actions" items={items} />);
  const button = screen.getByRole('button', { name: 'Theme' });
  fireEvent.pointerEnter(button);
  const tooltip = screen.getByRole('tooltip');
  fireEvent.click(button);
  fireEvent.click(button);
  expect(screen.getByRole('tooltip')).toBe(tooltip);
  expect(button.closest('[data-pinned]')).toHaveAttribute('data-pinned', 'false');
  fireEvent.pointerLeave(button);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
test('keeps explicit pinning available and dismisses it with Escape', () => {
  render(<Dock ariaLabel="Actions" items={[{ ...items[0], pinOnActivate: true }]} />);
  const button = screen.getByRole('button', { name: 'Theme' });
  fireEvent.click(button);
  fireEvent.pointerLeave(button);
  expect(screen.getByRole('tooltip')).toHaveTextContent('Theme');
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
test('does not open a tooltip from an unhovered click', () => {
  render(<Dock ariaLabel="Actions" items={items} />);
  fireEvent.click(screen.getByRole('button', { name: 'Theme' }));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
test('keeps native links, skips modified-click pinning, blocks disabled actions and applies slots', () => {
  const click = vi.fn();
  render(<Dock ariaLabel="Navigation" classNames={{ dock: 'my-dock' }} styles={{ item: { borderRadius: 9 } }} items={[
    { id: 'home', label: 'Home', icon: 'H', href: '#home' },
    { id: 'disabled', label: 'Disabled', icon: 'D', disabled: true, onClick: click },
  ]} />);
  const link = screen.getByRole('link'); expect(link).toHaveAttribute('href', '#home');
  fireEvent.click(link, { ctrlKey: true }); expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button')); expect(click).not.toHaveBeenCalled();
  expect(screen.getByRole('button')).toBeDisabled();
  expect(document.querySelector('.my-dock')).toBeInTheDocument();
  expect(link.closest('[data-slot="item"]')).toHaveStyle({ borderRadius: '9px' });
});
test('renders actions while an explicit scroll target is unavailable', () => {
  Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });
  render(<Dock ariaLabel="Actions" items={items} scrollTarget={() => null} />);
  expect(screen.getByRole('navigation', { name: 'Actions' }).querySelectorAll('[data-slot="item"]')).toHaveLength(2);
});
test('uses latest action callback after rerender', () => {
  const first = vi.fn(); const next = vi.fn();
  const view = render(<Dock ariaLabel="Actions" items={[{ ...items[0], onClick: first }]} />);
  view.rerender(<Dock ariaLabel="Actions" items={[{ ...items[0], onClick: next }]} />);
  fireEvent.click(screen.getByRole('button')); expect(first).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledOnce();
});
