import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Documentation } from '../demo/documentation';
import { App } from '../demo/main';
import { CodeBlock } from '../demo/code-block';
import packageInfo from '../package.json';

test.each(['snippet', 'installation'])('resets %s copy feedback after one second like the dock', async kind => {
  vi.useFakeTimers();
  try {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(kind === 'snippet' ? <CodeBlock code="const value = 1;" /> : <Documentation />);
    const button = screen.getByRole('button', { name: kind === 'snippet' ? 'Copy code' : 'Copy install command' });
    await act(async () => { fireEvent.click(button); });
    expect(button.querySelector('path[d="m5 12 4 4L19 6"]')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(999); });
    expect(button.querySelector('path[d="m5 12 4 4L19 6"]')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(button.querySelector('path[d="m5 12 4 4L19 6"]')).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

test('renders the demo introduction in English', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { level: 1, name: 'A navigation dock for React.' });
  expect(heading.querySelector('br')).toBeNull();
  expect(screen.queryByText('React + TypeScript · Navigation component')).not.toBeInTheDocument();
  expect(document.querySelector('.lede')).toHaveTextContent('Page navigation with icons, tooltips, responsive item groups, and actions for themes and link sharing.');
  expect(document.documentElement.lang).toBe('en');
});

test('copies the installation command and confirms success', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<Documentation />);
  const button = screen.getByRole('button', { name: 'Copy install command' });
  fireEvent.click(button);
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('npx shadcn@latest add Hilmi-Raif/react-dock/react-dock'));
  await waitFor(() => expect(button).toHaveAttribute('aria-label', 'Command copied'));
});

test('groups the wordmark and package version in the header', () => {
  render(<App />);
  const header = document.querySelector('header')!;
  const logo = screen.getByRole('link', { name: 'React Dock' });
  expect(logo).toHaveTextContent('React Dock');
  expect(header.querySelector('img')).toBeNull();
  expect(header.querySelector('.header-brand')).toContainElement(logo);
  expect(header.querySelector('.header-brand .version')).toHaveTextContent(`v${packageInfo.version}`);
  expect(header.querySelector('.header-actions .version')).toBeNull();
  expect(header.querySelector('.header-actions')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
  expect(logo).toHaveTextContent('React Dock');
});

test('uses a consistent dock surface in each demo theme', () => {
  render(<App />);
  const root = document.querySelector<HTMLElement>('[data-react-dock]')!;
  expect(root.style.getPropertyValue('--rd-surface')).toBe('#f8faf7');
  fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
  expect(root.style.getPropertyValue('--rd-surface')).toBe('#252b27');
  fireEvent.click(screen.getByLabelText('Custom styling'));
  expect(root.style.getPropertyValue('--rd-surface')).toBe('#203e35');
});

test('formats API names inside documentation paragraphs as inline code', () => {
  render(<Documentation />);
  for (const text of ['HomeIcon', 'pinOnActivate', '--rd-active', 'scrollIntoView']) {
    expect(Array.from(document.querySelectorAll('p code')).some(node => node.textContent === text)).toBe(true);
  }
});

test('renders the documentation in English', () => {
  render(<Documentation />);
  expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).toBeNull();
});

test('passes the page theme to code snippets and back to light', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Dark mode' }));
  expect(document.querySelector('.code-block')).toHaveAttribute('data-dark', 'true');
  expect(document.documentElement).toHaveAttribute('data-mantine-color-scheme', 'dark');
  fireEvent.click(screen.getByRole('button', { name: 'Light mode' }));
  expect(document.querySelector('.code-block')).toHaveAttribute('data-dark', 'false');
});

test('provides English document metadata and playground labels', () => {
  render(<App />);
  expect(document.documentElement.lang).toBe('en');
  expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument();
  expect(screen.getByLabelText('Show tooltips')).toBeInTheDocument();
  expect(screen.queryByText('View tooltip and animation settings')).not.toBeInTheDocument();
});

test('documents the public navigation API', () => {
  render(<Documentation />);
  expect(screen.getByText('autoScrollDuration')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument();
  expect(screen.getByText(/Add React Dock to your project with the command below/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/Hilmi-Raif/react-dock');
});

test('copies code with feedback and reports clipboard failure', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<Documentation />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Copy code' })[0]);
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Copy code' })[0].querySelector('path')?.getAttribute('d')).toBe('m5 12 4 4L19 6'));
  expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  expect(writeText).toHaveBeenCalled();
  writeText.mockRejectedValueOnce(new Error('denied'));
  fireEvent.click(screen.getAllByRole('button', { name: 'Copy code' })[0]);
  expect(await screen.findByText('Could not copy')).toBeInTheDocument();
});
