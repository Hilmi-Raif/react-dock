import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { App } from '../demo/main';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

test('keeps the clicked destination active while passing sections and releases on scroll end', () => {
  vi.useFakeTimers();
  let current = 'home';
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { top: this.id === current ? 0 : 2000, height: 80 } as DOMRect;
  });
  render(<App />);
  const home = screen.getByRole('link', { name: 'Home' });
  const destination = screen.getByRole('link', { name: 'Integration' });
  fireEvent.click(destination);
  expect(destination).toHaveAttribute('aria-current', 'page');
  current = 'props'; fireEvent.scroll(window);
  expect(destination).toHaveAttribute('aria-current', 'page');
  current = 'integration'; fireEvent.scroll(window); fireEvent(window, new Event('scrollend'));
  expect(destination).toHaveAttribute('aria-current', 'page');
  fireEvent.click(home);
  current = 'styling'; fireEvent.scroll(window);
  expect(home).toHaveAttribute('aria-current', 'page');
  fireEvent.wheel(window);
  expect(screen.getByRole('link', { name: 'Styling' })).toHaveAttribute('aria-current', 'page');
});

test('releases a navigation destination after scroll idle or manual interruption', () => {
  vi.useFakeTimers();
  render(<App />);
  const destination = screen.getByRole('link', { name: 'Usage' });
  for (const interrupt of [() => fireEvent.touchMove(window), () => fireEvent.keyDown(window, { key: 'PageDown' })]) {
    fireEvent.click(destination);
    expect(destination).toHaveAttribute('aria-current', 'page');
    interrupt();
    expect(destination).not.toHaveAttribute('aria-current');
  }
});

test('ignores stale completion and idle events after rapid navigation including repeated targets', () => {
  vi.useFakeTimers();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(5000);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { top: this.id === 'home' ? 0 : 2000, height: 80 } as DOMRect;
  });
  render(<App />);
  const usage = screen.getByRole('link', { name: 'Usage' });
  const integration = screen.getByRole('link', { name: 'Integration' });
  fireEvent.click(integration);
  fireEvent.click(usage);
  fireEvent(window, new Event('scrollend'));
  expect(usage).toHaveAttribute('aria-current', 'page');
  fireEvent.scroll(window);
  act(() => vi.advanceTimersByTime(170));
  fireEvent.click(usage);
  act(() => vi.advanceTimersByTime(20));
  expect(usage).toHaveAttribute('aria-current', 'page');
  fireEvent.scroll(window);
  act(() => vi.advanceTimersByTime(180));
  expect(usage).toHaveAttribute('aria-current', 'page');
  fireEvent.wheel(window);
  expect(usage).not.toHaveAttribute('aria-current');
});

test('uses dock section links without a sidebar on desktop too', () => {
  render(<App />);
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  expect(screen.getByRole('contentinfo')).toHaveTextContent('React Dock');
  const dock = screen.getByRole('navigation', { name: 'Main navigation' });
  for (const id of ['home', 'usage', 'props', 'styling', 'integration']) {
    expect(dock.querySelector(`a[href="#${id}"]`)).not.toBeNull();
    expect(document.getElementById(id)).not.toBeNull();
  }
  expect(document.querySelector('a[href="#article"]')).toBeNull();
});

test('lets visitors disable tooltips and adjust indicator animation live', () => {
  render(<App />);
  fireEvent.click(screen.getByLabelText('Show tooltips'));
  fireEvent.pointerEnter(screen.getByRole('link', { name: 'Home' }));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  const animation = screen.getByRole('combobox', { name: 'Indicator animation' });
  expect(animation.tagName).toBe('BUTTON');
  fireEvent.keyDown(animation, { key: 'ArrowDown' });
  fireEvent.click(screen.getByRole('option', { name: 'No animation' }));
  expect(document.querySelector('[data-slot="indicator"]')).toHaveStyle({ transition: 'none' });
  fireEvent.keyDown(animation, { key: 'ArrowDown' });
  fireEvent.click(screen.getByRole('option', { name: 'Slide' }));
  fireEvent.change(screen.getByLabelText('Animation duration'), { target: { value: '400' } });
  expect(document.querySelector('[data-slot="indicator"]')?.getAttribute('style')).toContain('400ms');
});

test('switches custom colors in both directions without losing the selected styling', () => {
  render(<App />);
  fireEvent.click(screen.getByLabelText('Custom styling'));
  const dock = document.querySelector('[data-react-dock]') as HTMLElement;
  const light = dock.style.getPropertyValue('--rd-surface');
  expect(light).toBe('#fff8eb');
  expect(dock.style.getPropertyValue('--rd-foreground')).toBe('#003049');
  expect(dock.style.getPropertyValue('--rd-border')).toBe('#d8bd86');
  expect(dock.style.getPropertyValue('--rd-hover')).toBe('#ffe7b0');
  expect(dock.style.getPropertyValue('--rd-active')).toBe('#fcbf49');
  for (let index = 0; index < 2; index += 1) {
    fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
    expect(document.querySelector('.playground')).toHaveAttribute('data-dark', 'true');
    expect(dock.style.getPropertyValue('--rd-surface')).not.toBe(light);
    expect(dock.style.getPropertyValue('--rd-radius')).toBe('8px');
    fireEvent.click(screen.getByRole('button', { name: 'Light mode' }));
    expect(document.querySelector('.playground')).toHaveAttribute('data-dark', 'false');
    expect(dock.style.getPropertyValue('--rd-surface')).toBe(light);
    expect(screen.getByLabelText('Custom styling')).toBeChecked();
  }
});

test('changes share icon after copying and restores it after one second', async () => {
  vi.useFakeTimers();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
  render(<App />);
  fireEvent.click(screen.getByLabelText('Article controls'));
  const copyBtn = screen.getByRole('button', { name: 'Copy link' });
  const original = copyBtn.querySelector('path')?.getAttribute('d');
  await act(async () => { fireEvent.click(copyBtn); });
  expect(screen.getByRole('button', { name: 'Link copied' }).querySelector('path')?.getAttribute('d')).not.toBe(original);
  act(() => { vi.advanceTimersByTime(2000); });
  expect(screen.getByRole('button', { name: 'Copy link' }).querySelector('path')?.getAttribute('d')).toBe(original);
});

test('demonstrates success and failure lifecycles on draft actions and article controls across groups', () => {
  vi.useFakeTimers();
  render(<App />);

  fireEvent.click(screen.getByLabelText('Draft actions'));
  const saveBtn = screen.getByRole('button', { name: 'Save draft' });
  fireEvent.click(saveBtn);
  expect(saveBtn).toHaveAttribute('aria-busy', 'true');
  act(() => vi.advanceTimersByTime(1500));
  expect(screen.getByRole('button', { name: 'Draft saved' })).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Many buttons demo'));
  const nextBtn = screen.getByRole('button', { name: 'Next items' });
  fireEvent.click(nextBtn);
  const copySaveBtn = screen.getByRole('button', { name: 'Save draft' });
  fireEvent.click(copySaveBtn);
  expect(copySaveBtn).toHaveAttribute('aria-busy', 'true');
  act(() => vi.advanceTimersByTime(1500));
  const failedSaveBtn = screen.getByRole('button', { name: 'Save failed' });
  expect(failedSaveBtn).toBeInTheDocument();
  fireEvent.click(failedSaveBtn);
  expect(failedSaveBtn).toHaveAttribute('aria-busy', 'true');

  fireEvent.click(screen.getByLabelText('Article controls'));
  expect(screen.getByLabelText('Draft actions')).not.toBeChecked();
  fireEvent.click(nextBtn);
  const copyShareBtn = screen.getByRole('button', { name: 'Copy link' });
  fireEvent.click(copyShareBtn);
  expect(copyShareBtn).toHaveAttribute('aria-busy', 'true');
  act(() => vi.advanceTimersByTime(1500));
  const failedShareBtn = screen.getByRole('button', { name: 'Copy failed' });
  expect(failedShareBtn).toBeInTheDocument();
  fireEvent.click(failedShareBtn);
  expect(failedShareBtn).toHaveAttribute('aria-busy', 'true');
});

test('renders non-empty icons for all controls when many buttons demo is active with draft actions and article controls', () => {
  render(<App />);
  const manyCheckbox = screen.getByLabelText('Many buttons demo');
  const draftCheckbox = screen.getByLabelText('Draft actions');
  const articleCheckbox = screen.getByLabelText('Article controls');

  fireEvent.click(manyCheckbox);
  fireEvent.click(draftCheckbox);
  const dockButtons = document.querySelectorAll('[data-slot="item"] > :is(button, a)');
  expect(dockButtons.length).toBeGreaterThan(0);
  dockButtons.forEach(button => {
    const path = button.querySelector('svg path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('d')?.trim()).toBeTruthy();
  });

  fireEvent.click(articleCheckbox);
  const articleButtons = document.querySelectorAll('[data-slot="item"] > :is(button, a)');
  expect(articleButtons.length).toBeGreaterThan(0);
  articleButtons.forEach(button => {
    const path = button.querySelector('svg path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute('d')?.trim()).toBeTruthy();
  });
});

test('persists theme selection in localStorage and restores it on mount', () => {
  localStorage.clear();
  const { unmount } = render(<App />);
  expect(document.querySelector('.playground')).toHaveAttribute('data-dark', 'false');

  fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
  expect(document.querySelector('.playground')).toHaveAttribute('data-dark', 'true');
  expect(localStorage.getItem('react-dock-theme')).toBe('dark');
  expect(document.documentElement.getAttribute('data-dark')).toBe('true');
  unmount();

  render(<App />);
  expect(document.querySelector('.playground')).toHaveAttribute('data-dark', 'true');
  expect(document.documentElement.getAttribute('data-dark')).toBe('true');
});
