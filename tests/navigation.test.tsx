import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Dock, useSectionNavigation } from '../registry/react-dock';

test('installed Dock handles hash navigation and holds the requested indicator without demo wiring', () => {
  const section = document.createElement('section'); section.id = 'target'; document.body.append(section);
  vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: 900 } as DOMRect);
  const request = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(123);
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const view = render(<Dock ariaLabel="Sections" activeId="home" items={[
    { id: 'home', label: 'Home', href: '#home', icon: 'H' },
    { id: 'target', label: 'Target', href: '#target', icon: 'T' },
  ]} />);
  const link = screen.getByRole('link', { name: 'Target' });
  fireEvent.click(link, { ctrlKey: true });
  expect(request).not.toHaveBeenCalled();
  expect(fireEvent.click(link)).toBe(false);
  expect(request).toHaveBeenCalledOnce();
  expect(link).toHaveAttribute('aria-current', 'page');
  fireEvent.click(link);
  expect(request).toHaveBeenCalledOnce();
  fireEvent.wheel(window);
  expect(cancel).toHaveBeenCalledWith(123);
  expect(link).not.toHaveAttribute('aria-current');
  view.rerender(<Dock ariaLabel="Sections" sectionNavigation={false} items={[{ id: 'target', label: 'Target', href: '#target', icon: 'T' }]} />);
  expect(fireEvent.click(screen.getByRole('link', { name: 'Target' }))).toBe(true);
  expect(request).toHaveBeenCalledOnce();
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.getElementById('target')?.remove(); });

test('retargets a single running scroll and settles at the last destination', () => {
  let position = 0;
  let target = 1600;
  let time = 0;
  let nextId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextId, callback); return nextId; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => position);
  vi.spyOn(window, 'scrollTo').mockImplementation((options) => { position = Math.round((options as ScrollToOptions).top ?? position); });
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(5000);
  const section = document.createElement('section'); section.id = 'target'; document.body.append(section);
  vi.spyOn(section, 'getBoundingClientRect').mockImplementation(() => ({ top: target - position } as DOMRect));
  const { result, unmount } = renderHook(() => useSectionNavigation());
  const step = () => act(() => {
    time += 16;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(time));
  });
  act(() => result.current.navigate('target'));
  for (let i = 0; i < 12; i++) step();
  const before = position;
  target = 300;
  act(() => { result.current.navigate('target'); result.current.navigate('target'); });
  expect(frames.size).toBe(1);
  expect(position).toBe(before);
  step();
  expect(Math.abs(position - before)).toBeLessThan(150);
  for (let i = 0; i < 180; i++) step();
  expect(position).toBeCloseTo(300, 0);
  expect(result.current.destination).toBeUndefined();
  expect(frames.size).toBe(0);
  expect(location.hash).toBe('#target');
  act(() => result.current.navigate('target'));
  act(() => { window.dispatchEvent(new WheelEvent('wheel')); });
  expect(frames.size).toBe(0);
  expect(result.current.destination).toBeUndefined();
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
  target = 900;
  act(() => result.current.navigate('target'));
  step();
  expect(position).toBe(900);
  expect(frames.size).toBe(0);
  act(() => result.current.navigate('target'));
  unmount();
  expect(frames.size).toBe(0);
});
