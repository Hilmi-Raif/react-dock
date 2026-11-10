import { render } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { App } from '../demo/main';

vi.mock('../package.json', () => ({ default: { version: '0.2.0' } }));

test('takes the header and footer version from the release package', () => {
  render(<App />);
  expect(document.querySelector('.header-brand .version')).toHaveTextContent('v0.2.0');
  expect(document.querySelector('.docs-footer')).toHaveTextContent('v0.2.0');
});
