import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useActiveSection } from '../registry/react-dock/use-active-section';

test('tracks the section crossing the reading line without clicks and keeps last at bottom', () => {
  let articleTop = 800;
  const home = document.createElement('section'); home.id = 'home';
  const article = document.createElement('section'); article.id = 'article';
  document.body.append(home, article);
  vi.spyOn(home, 'getBoundingClientRect').mockImplementation(() => ({ top: -100, bottom: articleTop } as DOMRect));
  vi.spyOn(article, 'getBoundingClientRect').mockImplementation(() => ({ top: articleTop, bottom: 1800 } as DOMRect));
  function Fixture() { return <output>{useActiveSection(['home', 'article'])}</output>; }
  render(<Fixture />);
  expect(screen.getByText('home')).toBeInTheDocument();
  articleTop = 50; fireEvent.scroll(window);
  expect(screen.getByText('article')).toBeInTheDocument();
  articleTop = 800; fireEvent.scroll(window);
  expect(screen.getByText('home')).toBeInTheDocument();
  home.remove(); article.remove(); vi.restoreAllMocks();
});

test('detects sections inserted asynchronously without a scroll', async () => {
  function Fixture() { return <output data-testid="active">{useActiveSection(['late'])}</output>; }
  render(<Fixture />);
  expect(screen.getByTestId('active')).toBeEmptyDOMElement();
  const section = document.createElement('section'); section.id = 'late';
  await act(async () => { document.body.append(section); });
  await waitFor(() => expect(screen.getByTestId('active')).toHaveTextContent('late'));
  section.remove();
});

test('tracks only contained sections and selects the last section at the container bottom', () => {
  const container = document.createElement('div');
  const first = document.createElement('section'); first.id = 'contained-first';
  const last = document.createElement('section'); last.id = 'contained-last';
  const outside = document.createElement('section'); outside.id = 'outside-section';
  container.append(first, last); document.body.append(container, outside);
  Object.defineProperties(container, { clientHeight: { value: 400 }, scrollHeight: { value: 1200 } });
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect);
  vi.spyOn(first, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect);
  vi.spyOn(last, 'getBoundingClientRect').mockReturnValue({ top: 900 } as DOMRect);
  function Fixture() { return <output data-testid="container-active">{useActiveSection(['missing', first.id, outside.id, last.id], () => container)}</output>; }
  const view = render(<Fixture />);
  expect(screen.getByTestId('container-active')).toHaveTextContent(first.id);
  act(() => { container.scrollTop = 800; fireEvent.scroll(container); });
  expect(screen.getByTestId('container-active')).toHaveTextContent(last.id);
  view.unmount(); container.remove(); outside.remove(); vi.restoreAllMocks();
});

test('returns no active section for an empty list or unresolved target without ResizeObserver', () => {
  vi.stubGlobal('ResizeObserver', undefined);
  function Fixture({ missing }: { missing: boolean }) { return <output data-testid="empty-active">{useActiveSection([], missing ? () => null : undefined)}</output>; }
  const view = render(<Fixture missing={false} />);
  expect(screen.getByTestId('empty-active')).toBeEmptyDOMElement();
  view.rerender(<Fixture missing />);
  expect(screen.getByTestId('empty-active')).toBeEmptyDOMElement();
  view.unmount(); vi.unstubAllGlobals();
});
