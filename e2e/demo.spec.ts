import { expect, test } from '@playwright/test';

test('keeps hover painted beneath the moving active indicator without a handoff delay', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop hover handoff');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const control = page.getByRole('navigation').getByRole('link', { name: 'Integration', exact: true });
  await control.hover();
  await page.waitForTimeout(180);
  const feedback = await control.evaluate(element => new Promise<{ delay: string; opacity: number }>(resolve => {
    const observer = new MutationObserver(() => {
      if (element.parentElement?.dataset.active !== 'true') return;
      observer.disconnect();
      const style = getComputedStyle(element, '::before');
      resolve({ delay: style.transitionDelay, opacity: Number(style.opacity) });
    });
    observer.observe(element.parentElement!, { attributes: true });
    (element as HTMLElement).click();
  }));
  expect(feedback.delay).toBe('0s');
  expect(feedback.opacity).toBeGreaterThan(.9);
  await page.waitForTimeout(450);
  expect(await control.evaluate(element => Number(getComputedStyle(element, '::before').opacity))).toBe(1);
  expect(await control.evaluate(element => {
    const indicator = element.closest('nav')!.querySelector('[data-slot="indicator"]')!;
    const icon = element.querySelector('[data-slot="icon"]')!;
    return {
      hover: getComputedStyle(element, '::before').zIndex,
      indicator: getComputedStyle(indicator).zIndex,
      icon: getComputedStyle(icon).zIndex,
      isolation: getComputedStyle(element).isolation,
    };
  })).toEqual({ hover: '0', indicator: '1', icon: '2', isolation: 'auto' });
});

test('keeps tooltips mounted while holding successive navigation controls', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Requires a mouse');
  await page.setViewportSize({ width: 1440, height: 900 });
  for (let index = 0; index < 12; index += 1) {
    const label = ['Usage', 'Styling', 'Integration'][index % 3];
    const control = page.getByRole('navigation').getByRole('link', { name: label, exact: true });
    await control.hover();
    await expect(page.getByRole('tooltip')).toHaveText(label);
    await page.getByRole('tooltip').evaluate(node => {
      Object.assign(window, { heldTooltip: node, heldTooltipRemovals: 0 });
      const observer = new MutationObserver(records => {
        for (const record of records) for (const removed of record.removedNodes) {
          if (removed === node) Reflect.set(window, 'heldTooltipRemovals', Number(Reflect.get(window, 'heldTooltipRemovals')) + 1);
        }
      });
      observer.observe(document.querySelector('[data-react-dock]')!, { childList: true });
      Reflect.set(window, 'heldTooltipObserver', observer);
    });
    await page.mouse.down();
    await page.waitForTimeout([20, 200, 650][index % 3]);
    await expect(page.getByRole('tooltip')).toHaveText(label);
    await page.mouse.up();
    await expect(page.getByRole('tooltip')).toHaveText(label);
    expect(await page.evaluate(() => {
      (Reflect.get(window, 'heldTooltipObserver') as MutationObserver).disconnect();
      return { same: document.querySelector('[role="tooltip"]') === Reflect.get(window, 'heldTooltip'), removals: Reflect.get(window, 'heldTooltipRemovals') };
    })).toEqual({ same: true, removals: 0 });
  }
});

test('fully paints the highlight when pressing during hover entry', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop hover behavior');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const theme = page.getByRole('button', { name: /^(Dark|Light) mode$/ });
  for (const dark of [true, false]) {
    await page.mouse.move(0, 0);
    await page.waitForTimeout(180);
    const box = (await theme.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    expect(await theme.evaluate(element => getComputedStyle(element, '::before').opacity)).toBe('1');
    await page.mouse.up();
    expect(await page.locator('.playground').getAttribute('data-dark')).toBe(String(dark));
    expect(await theme.evaluate(element => ({ opacity: getComputedStyle(element, '::before').opacity, color: getComputedStyle(element, '::before').backgroundColor }))).toEqual({ opacity: '1', color: dark ? 'rgb(53, 65, 57)' : 'rgb(237, 240, 235)' });
  }
});

test('updates hovered theme colors immediately while preserving hover motion', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop hover behavior');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const theme = page.getByRole('button', { name: /^(Dark|Light) mode$/ });
  await theme.hover();
  await page.waitForTimeout(180);
  for (const dark of [true, false, true, false]) {
    await theme.evaluate(element => (element as HTMLElement).click());
    await expect(page.locator('.playground')).toHaveAttribute('data-dark', String(dark));
    const result = await theme.evaluate(element => {
      const style = getComputedStyle(element);
      const hover = getComputedStyle(element, '::before');
      return {
        color: hover.backgroundColor,
        opacity: hover.opacity,
        motion: hover.transitionProperty,
        duration: hover.transitionDuration,
        colorAnimations: element.getAnimations().filter(animation => animation instanceof CSSTransition && animation.transitionProperty === 'background-color').length,
        buttonMotion: style.transitionProperty,
      };
    });
    expect(result.color).toBe(dark ? 'rgb(53, 65, 57)' : 'rgb(237, 240, 235)');
    expect(result.opacity).toBe('1');
    expect(result.motion).toBe('opacity');
    expect(result.duration).toBe('0.16s');
    expect(result.colorAnimations).toBe(0);
  }
});

test('bounds long tooltip labels at both viewport edges', async ({ page }) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 640 });
    for (const text of ['Configure integration settings for your application '.repeat(10), 'x'.repeat(600)]) {
      for (const edge of ['left', 'right']) {
        await page.evaluate(({ text, edge }) => {
          const tooltip = document.createElement('span');
          tooltip.dataset.slot = 'tooltip';
          tooltip.textContent = text;
          tooltip.style.left = edge === 'left' ? '8px' : `${innerWidth - 8}px`;
          tooltip.style.transform = edge === 'left' ? 'none' : 'translateX(-100%)';
          document.querySelector('[data-react-dock]')!.append(tooltip);
        }, { text, edge });
        const tooltip = page.locator('[data-slot="tooltip"]').last();
        const metrics = await tooltip.evaluate(element => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, height: rect.height, lineHeight: parseFloat(getComputedStyle(element).lineHeight) };
        });
        expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight * 2 + 14.1);
        expect(metrics.left).toBeGreaterThanOrEqual(7);
        expect(metrics.right).toBeLessThanOrEqual(width - 7);
        await tooltip.evaluate(element => element.remove());
      }
    }
  }
});

test('does not leave a hover background after touch navigation changes the active section', async ({ browser, browserName, page }) => {
  test.skip(browserName !== 'chromium', 'Touch hover reproduction uses Chromium mobile emulation');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const touch = await context.newPage();
    await touch.goto(page.url());
    const home = touch.locator('nav a[href="#home"]');
    await home.tap();
    await expect(touch.getByRole('tooltip')).toHaveCount(0);
    await touch.evaluate(() => document.querySelector('#integration')!.scrollIntoView({ behavior: 'instant' }));
    await expect(touch.locator('nav a[href="#integration"]')).toHaveAttribute('aria-current', 'page');
    await expect.poll(() => home.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  } finally {
    await context.close();
  }
});

test('keeps the same tooltip through repeated clicks and completed navigation, then dismisses on exit', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Requires a real hover pointer');
  const link = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Usage', exact: true });
  await link.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Usage');
  await page.evaluate(() => {
    const node = document.querySelector('[role="tooltip"]')!;
    Object.assign(window, { originalTooltip: node, tooltipRemovals: 0 });
    new MutationObserver(records => {
      for (const record of records) for (const removed of record.removedNodes) {
        if (removed === node) Object.assign(window, { tooltipRemovals: Reflect.get(window, 'tooltipRemovals') + 1 });
      }
    }).observe(document.querySelector('[data-react-dock]')!, { childList: true, subtree: true });
  });
  for (let i = 0; i < 3; i++) await link.click();
  await expect.poll(() => page.evaluate(() => document.querySelector('#usage')!.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().bottom)).toBeLessThanOrEqual(-1);
  // wait past scroll protection
  await page.waitForTimeout(1400);
  expect(await page.evaluate(() => ({ same: document.querySelector('[role="tooltip"]') === Reflect.get(window, 'originalTooltip'), removed: Reflect.get(window, 'tooltipRemovals') }))).toEqual({ same: true, removed: 0 });
  const box = await link.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y - 5);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('react-dock-language')) localStorage.setItem('react-dock-language', 'en'); });
  await page.goto('./');
});

test('switches whole groups without sliding or following page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  const rows = () => nav.locator('[data-slot="item"]').evaluateAll(items => {
    const tops = items.map(item => item.getBoundingClientRect().top);
    return Math.max(...tops) - Math.min(...tops) < 1 ? 1 : 2;
  });
  await expect.poll(rows).toBe(1);
  await expect.poll(() => page.locator('[data-dock-frame]').evaluate(frame => frame.getAnimations().length)).toBe(0);
  const width = (await nav.boundingBox())!.width;
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  expect(await rows()).toBe(1);
  expect((await nav.boundingBox())!.width).toBeCloseTo(width, 0);
  await expect(page.getByRole('button', { name: 'Next items' })).toBeVisible();
  const first = await nav.getByRole('link').first().getAttribute('aria-label');
  await page.getByRole('button', { name: 'Next items' }).click();
  await expect(page.getByRole('button', { name: 'Next items' })).toBeDisabled();
  expect(await nav.getByRole('link').first().getAttribute('aria-label')).not.toBe(first);
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await expect(page.getByRole('button', { name: 'Next items' })).toBeDisabled();
  expect(await nav.evaluate(element => element.scrollLeft)).toBe(0);
  await nav.getByRole('link').last().focus();
  await expect.poll(() => nav.getByRole('link').last().evaluate(element => {
    const rect = element.getBoundingClientRect();
    const viewport = element.closest('nav')!.getBoundingClientRect();
    return rect.left >= viewport.left && rect.right <= viewport.right;
  })).toBe(true);
});

test('does not show overflow arrows when every item fits', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('button', { name: 'Next items' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Previous items' })).toHaveCount(0);
});

test('uses equal edge and item spacing without fractional corrections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const gap of [4, 4.5, 5.5]) {
    await page.locator('[data-react-dock]').evaluate((root: HTMLElement, gap) => {
      root.style.setProperty('--rd-gap', `${gap}px`);
      root.style.removeProperty('--rd-padding');
    }, gap);
    await page.getByRole('checkbox', { name: 'Many buttons demo' }).check();
    await expect.poll(() => page.locator('[data-dock-frame]').evaluate(frame => frame.getAnimations().length)).toBe(0);
    const spacing = await page.locator('[data-dock-frame]').evaluate(frame => {
      const rect = frame.getBoundingClientRect();
      const controls = [...frame.querySelectorAll<HTMLElement>('[data-dock-arrow], [data-slot="item"]')].map(item => item.getBoundingClientRect());
      return [controls[0].left - rect.left, ...controls.slice(1).map((item, i) => item.left - controls[i].right), rect.right - controls.at(-1)!.right];
    });
    for (const value of spacing) expect(Math.abs(value - gap)).toBeLessThan(.05);
  }
});

test('eases dock width between unequal groups and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('checkbox', { name: 'Many buttons demo' }).check();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Next items' }).click();
  const frame = page.locator('[data-dock-frame]');
  const initial = (await frame.boundingBox())!.width;
  await page.getByRole('button', { name: 'Next items' }).evaluate((button: HTMLButtonElement) => button.click());
  const animation = await frame.evaluate(element => {
    const animation = element.getAnimations().find(entry => entry.effect instanceof KeyframeEffect && entry.effect.getKeyframes().some(frame => frame.width));
    if (!animation || !(animation.effect instanceof KeyframeEffect)) return null;
    animation.pause();
    animation.currentTime = 80;
    return { width: element.getBoundingClientRect().width, frames: animation.effect.getKeyframes().map(frame => Number.parseFloat(String(frame.width))) };
  });
  expect(animation).not.toBeNull();
  expect(animation!.frames[0]).toBeCloseTo(initial, 0);
  expect(animation!.width).toBeLessThan(initial);
  expect(animation!.width).toBeGreaterThan(animation!.frames[1]);
  await frame.evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
  await page.getByRole('button', { name: 'Previous items' }).evaluate((button: HTMLButtonElement) => button.click());
  expect(await frame.evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
  await frame.evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Next items' }).evaluate((button: HTMLButtonElement) => button.click());
  expect(await frame.evaluate(element => element.getAnimations().length)).toBe(0);
});

test('keeps paginated tooltips above their buttons and centers svg arrows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('checkbox', { name: 'Custom styling' }).check();
  await page.getByRole('checkbox', { name: 'Many buttons demo' }).check();
  const next = page.getByRole('button', { name: 'Next items' });
  const svg = next.locator('svg');
  await expect(svg).toHaveCount(1);
  await expect.poll(() => next.evaluate(element => {
    const a = element.getBoundingClientRect();
    const b = element.querySelector('svg')!.getBoundingClientRect();
    return Math.max(Math.abs(a.x + a.width / 2 - b.x - b.width / 2), Math.abs(a.y + a.height / 2 - b.y - b.height / 2));
  })).toBeLessThan(1);
  expect((await svg.boundingBox())!.width).toBe(22);
  await expect(svg).toHaveAttribute('stroke-width', '1.7');
  await expect(page.getByRole('button', { name: 'Previous items' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous items' })).toBeDisabled();
  const home = page.getByRole('navigation').getByRole('link', { name: 'Home', exact: true });
  await page.keyboard.press('Tab');
  await home.focus();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  const box = (await tooltip.boundingBox())!;
  expect(box.y).toBeGreaterThan(0);
  expect(box.y + box.height).toBeLessThan((await home.boundingBox())!.y);
  expect(Math.abs(box.x + box.width / 2 - (await home.boundingBox())!.x - 22)).toBeLessThan(2);
});

test('duplicate demo items retain section navigation and theme actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('checkbox', { name: 'Many buttons demo' }).check();
  await page.getByRole('button', { name: 'Next items' }).click();
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  const home = nav.getByRole('link', { name: 'Home', exact: true });
  await home.click();
  await expect(home).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
  await page.getByRole('button', { name: 'Next items' }).click();
  await nav.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await expect(page.locator('.playground')).toHaveAttribute('data-dark', 'true');
});

test('demo groups separate duplicate home and switch the second theme icon', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('checkbox', { name: 'Many buttons demo' }).check();
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.locator('[data-slot="item"]')).toHaveCount(6);
  await expect(nav.getByRole('link', { name: 'Home', exact: true })).toHaveCount(1);
  await expect(nav.locator('[data-slot="item"]').first()).not.toHaveAttribute('data-pinned', 'true');
  await page.getByRole('button', { name: 'Next items' }).click();
  await expect(nav.getByRole('link', { name: 'Home', exact: true })).toHaveCount(1);
  const theme = nav.getByRole('button', { name: 'Dark mode', exact: true });
  const before = await theme.locator('path').getAttribute('d');
  await theme.click();
  expect(await nav.getByRole('button', { name: 'Light mode', exact: true }).locator('path').getAttribute('d')).not.toBe(before);
  await expect(page.locator('[data-dock-pages]')).toHaveCount(0);
});

test('resolves CSS spacing and keeps the surface consistent across groups', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = page.locator('[data-slot="surface"]');
  await frame.evaluate(element => { (element as HTMLElement).style.backgroundColor = 'rgb(12, 34, 56)'; });
  for (const gap of ['0px', '1rem']) {
    await page.locator('[data-react-dock]').evaluate((element, gap) => {
      (element as HTMLElement).style.setProperty('--rd-gap', gap);
      (element as HTMLElement).style.setProperty('--rd-padding', gap);
      (element as HTMLElement).style.setProperty('--rd-item-size', '20px');
    }, gap);
    await page.getByRole('checkbox', { name: 'Many buttons demo' }).check();
    await expect.poll(() => frame.evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(358);
    await expect(frame).toHaveCSS('background-color', 'rgb(12, 34, 56)');
    const controls = page.locator('[data-slot="item"] > :is(a,button)');
    for (const control of await controls.all()) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(43.99);
      expect(box.height).toBeGreaterThanOrEqual(43.99);
    }
    await page.getByRole('checkbox', { name: 'Many buttons demo' }).uncheck();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole('button', { name: 'Next items' })).toHaveCount(0);
    await expect(frame).toHaveCSS('background-color', 'rgb(12, 34, 56)');
    await page.setViewportSize({ width: 390, height: 844 });
  }
});

test('groups many demo buttons responsively', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await page.getByRole('checkbox', { name: 'Many buttons demo' }).check();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(nav.locator('[data-slot="item"]')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Next items' })).toBeVisible();
});

test('repeated touch activation retains the tooltip and extends its duration', async ({ browser, browserName, baseURL }) => {
  test.skip(browserName === 'firefox', 'Touch emulation requires Chromium or WebKit');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(baseURL!);
  try {
  const home = page.getByRole('navigation').getByRole('link', { name: 'Home', exact: true });
  const box = (await home.boundingBox())!;
  const tap = () => page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await tap();
  await expect(page.getByRole('tooltip')).toHaveText('Home');
  await page.evaluate(() => {
    const tooltip = document.querySelector('[role="tooltip"]')!;
    Object.assign(window, { touchTooltip: tooltip, touchRemovals: 0 });
    new MutationObserver(records => {
      for (const record of records) for (const node of record.removedNodes) {
        if (node === tooltip) Reflect.set(window, 'touchRemovals', Reflect.get(window, 'touchRemovals') + 1);
      }
    }).observe(document.querySelector('[data-react-dock]')!, { childList: true, subtree: true });
  });
  for (let index = 0; index < 12; index += 1) {
    await tap();
    await page.waitForTimeout(index % 2 ? 120 : 60);
  }
  await page.waitForTimeout(1100);
  expect(await page.evaluate(() => ({ same: document.querySelector('[role="tooltip"]') === Reflect.get(window, 'touchTooltip'), removals: Reflect.get(window, 'touchRemovals') }))).toEqual({ same: true, removals: 0 });
  await expect(page.getByRole('tooltip')).toHaveCount(0, { timeout: 2200 });
  } finally { await context.close(); }
});

test('touch shows a temporary tooltip without click effects', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Requires a touch device');
  const home = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Home', exact: true });
  const rect = (await home.boundingBox())!;
  await page.dispatchEvent('a[aria-label="Home"]', 'pointerdown', { pointerType: 'touch' });
  expect(await home.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, shadow: getComputedStyle(element).boxShadow, transition: getComputedStyle(element).transitionDuration }))).toEqual({ background: 'rgba(0, 0, 0, 0)', shadow: 'none', transition: '0s' });
  await page.dispatchEvent('a[aria-label="Home"]', 'pointercancel', { pointerType: 'touch' });
  expect(rect.width).toBeGreaterThanOrEqual(44);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Home', exact: true }).tap();
  await expect(page.getByRole('tooltip')).toHaveText('Home');
  await expect(page.locator('[data-touch-pressed]')).toHaveCount(0);
  await expect(page.getByRole('tooltip')).toHaveCount(0, { timeout: 2500 });
  if (!await page.getByRole('button', { name: 'Dark mode', exact: true }).isVisible()) await page.getByRole('button', { name: 'Next items' }).click();
  await page.getByRole('button', { name: 'Dark mode', exact: true }).tap();
  await expect(page.getByRole('tooltip')).toHaveText('Light mode');
  await expect(page.locator('[data-touch-pressed]')).toHaveCount(0);
  await expect(page.getByRole('tooltip')).toHaveCount(0, { timeout: 2500 });
});

test('loads production assets and keeps controls inside the viewport', async ({ page }) => {
  const logo = page.getByRole('link', { name: 'React Dock', exact: true });
  await expect(logo).toBeVisible();
  await expect(logo).toHaveText('React Dock');
  await expect(page.locator('header img')).toHaveCount(0);
  for (const icon of await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href))) {
    expect(new URL(icon).pathname).not.toContain('/react-dock/react-dock/');
    const response = await page.request.get(icon);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toMatch(/image\//);
  }
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const link of await nav.getByRole('link').all()) {
    const box = await link.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test('retargets section navigation, respects the sticky header and returns to top', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('link', { name: 'Usage', exact: true }).click();
  if (!await nav.getByRole('link', { name: 'Integration', exact: true }).isVisible()) await page.getByRole('button', { name: 'Next items' }).click();
  await nav.getByRole('link', { name: 'Integration', exact: true }).click();
  await expect(nav.getByRole('link', { name: 'Integration', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => page.evaluate(() => document.querySelector('#integration')!.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().bottom)).toBeLessThanOrEqual(-1);
  const previous = page.getByRole('button', { name: 'Previous items' });
  if (await previous.isVisible() && await previous.isEnabled()) await previous.click();
  await nav.getByRole('link', { name: 'Home', exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
});

test('switches theme and dismisses a focused tooltip with Escape', async ({ page }) => {
  if (!await page.getByRole('button', { name: 'Dark mode', exact: true }).isVisible()) await page.getByRole('button', { name: 'Next items' }).click();
  const theme = page.getByRole('button', { name: 'Dark mode', exact: true });
  await theme.focus(); await expect(page.getByRole('tooltip')).toHaveText('Dark mode');
  await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(theme).toBeFocused();
  await theme.click(); await expect(page.locator('.playground')).toHaveAttribute('data-dark', 'true');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('uses custom select and preserves article actions with tooltips disabled', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Indicator animation' }).click();
  await page.getByRole('option', { name: 'No animation' }).click();
  await expect(page.getByRole('slider')).toBeDisabled();
  await page.getByLabel('Article controls', { exact: true }).check();
  await page.getByLabel('Show tooltips', { exact: true }).uncheck();
  const nav = page.getByRole('navigation', { name: 'Article controls' });
  await expect(nav.getByRole('button')).toHaveCount(3);
  await nav.getByRole('button', { name: 'Dark mode' }).click();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await nav.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
});

test('supports reduced motion navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('link', { name: 'Styling', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.querySelector('#styling')!.getBoundingClientRect().top - document.querySelector('header')!.getBoundingClientRect().bottom)).toBeLessThanOrEqual(-1);
});
test('saves a draft once and manages dialog tooltip focus', async ({ page, isMobile }) => {
  await page.getByRole('checkbox', { name: 'Draft actions', exact: true }).check();
  const save = page.getByRole('button', { name: 'Save draft', exact: true });
  if (!isMobile) await save.hover();
  await save.click();
  const busy = page.getByRole('button', { name: 'Saving draft', exact: true });
  await expect(busy).toHaveAttribute('aria-busy', 'true');
  await expect(busy).toHaveAttribute('aria-disabled', 'true');
  await busy.click();
  await expect(page.getByRole('button', { name: /Draft saved|Save draft/ })).toBeVisible({ timeout: 2500 });
  const settings = page.getByRole('button', { name: 'Draft settings', exact: true });
  await settings.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(settings).toBeFocused();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await settings.click();
  await page.getByRole('dialog').getByRole('heading').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.click(8, 8);
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('demonstrates success on page one and failure with retry on page two for actions and article controls', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Draft actions', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Many buttons demo', exact: true }).check();

  const save = page.getByRole('button', { name: 'Save draft', exact: true });
  await save.click();
  await expect(page.getByRole('button', { name: 'Saving draft', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Draft saved', exact: true })).toBeVisible({ timeout: 2500 });

  const nextBtn = page.getByRole('button', { name: 'Next items', exact: true });
  await nextBtn.click();
  const copySave = page.getByRole('button', { name: 'Save draft', exact: true });
  await copySave.click();
  await expect(page.getByRole('button', { name: 'Saving draft', exact: true })).toBeVisible();
  const failedSave = page.getByRole('button', { name: 'Save failed', exact: true });
  await expect(failedSave).toBeVisible({ timeout: 2500 });
  await failedSave.click();
  await expect(page.getByRole('button', { name: 'Saving draft', exact: true })).toBeVisible();

  await page.getByRole('checkbox', { name: 'Article controls', exact: true }).check();
  if (await nextBtn.isEnabled()) await nextBtn.click();
  const copyShare = page.getByRole('button', { name: 'Copy link', exact: true });
  await copyShare.click();
  await expect(page.getByRole('button', { name: 'Copying link', exact: true })).toBeVisible();
  const failedShare = page.getByRole('button', { name: 'Copy failed', exact: true });
  await expect(failedShare).toBeVisible({ timeout: 2500 });
  await failedShare.click();
  await expect(page.getByRole('button', { name: 'Copying link', exact: true })).toBeVisible();
});
