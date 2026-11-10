# React Dock

<p align="center">
  <img src="https://github.com/user-attachments/assets/78062b96-30ff-40f6-a575-09ec23583b4f" alt="React dock dashboard preview" width="100%" />
</p>

A React and TypeScript navigation dock with active-section tracking, tooltips, responsive item groups, and custom styling.

[Documentation and playground](https://hilmi-raif.github.io/react-dock/)

## Installation

Run this command in a project configured for the shadcn CLI:

```sh
npx shadcn@latest add Hilmi-Raif/react-dock/react-dock
```

The CLI adds editable source files to the UI directory configured by `aliases.ui` in `components.json`. Requires React and React DOM 18 or newer, with no other runtime dependencies.

For manual installation, copy `registry/react-dock` into the components directory and import `styles.css` once.

## Usage

```tsx
'use client';

import { Dock, useActiveSection } from '@/components/ui/react-dock';
import '@/components/ui/react-dock/styles.css';

export function Navigation() {
  const activeId = useActiveSection(['home', 'articles']);

  return <Dock
    ariaLabel="Main navigation"
    activeId={activeId}
    items={[
      { id: 'home', label: 'Home', href: '#home', icon: <HomeIcon /> },
      { id: 'articles', label: 'Articles', href: '#articles', icon: <ArticleIcon /> },
    ]}
  />;
}
```

`HomeIcon` and `ArticleIcon` are placeholders. Import paths follow the project's aliases; hash links refer to sections with matching IDs. Each item has a unique ID and a nonempty label.

In Next.js, the stylesheet belongs in the root layout. The dock is fixed to the viewport and does not reserve space in the page layout.

## Styling

Use CSS variables for the theme and `classNames` or `styles` for individual slots:

```tsx
<Dock
  ariaLabel="Page navigation"
  items={items}
  style={{
    '--rd-surface': '#203e35',
    '--rd-foreground': '#fff9e9',
    '--rd-border': '#526c61',
    '--rd-hover': '#36554a',
    '--rd-active': '#466c59',
    '--rd-radius': '12px',
    '--rd-bottom': '24px',
  }}
  styles={{
    tooltip: { borderRadius: '8px', fontSize: '13px' },
    surface: { boxShadow: '0 0 0 1px var(--rd-border), 0 4px 18px rgb(0 0 0 / 12%)' },
  }}
/>
```

Available slots: `root`, `surface`, `dock`, `item`, `icon`, `indicator`, and `tooltip`. `className` and `style` apply to the root. The `surface` slot owns the background, outline, and padding in both pagination states; `dock` styles the inner navigation. Each slot exposes a `data-slot` attribute; item wrappers also expose `data-active`, `data-open`, `data-pinned`, and `data-disabled`.

The outline uses an outer shadow. With a zero-width border and `--rd-padding` defaulting to `--rd-gap`, edge spacing matches the gaps between buttons.

| CSS variable | Default |
| --- | --- |
| `--rd-surface` | `rgb(255 255 255 / 94%)` |
| `--rd-foreground` | `#202520` |
| `--rd-border` | `#d5dad4` |
| `--rd-hover` | `#edf0eb` |
| `--rd-active` | `#dfe8dc` |
| `--rd-radius` | `16px` |
| `--rd-item-size` | `44px` |
| `--rd-gap` | `4px` |
| `--rd-padding` | `var(--rd-gap)` |
| `--rd-tooltip-gap` | `10px` |
| `--rd-bottom` | `24px` |
| `--rd-z-index` | `100` |

Item controls have a minimum width and height of 44px. Zero spacing and CSS length units are supported; capacity uses resolved layout measurements.

Map these variables to your application's theme tokens for light and dark modes. The stylesheet uses low-specificity selectors, so ordinary classes can override them. You can omit it and supply your own positioning, visibility, and interaction styles.

## Props

| Prop | Description |
| --- | --- |
| `items` | Required readonly array of `DockItem` |
| `ariaLabel` | Required accessible label for the navigation |
| `activeId` | ID of the active item |
| `sectionNavigation` | Animate same-page hash navigation; default true; set false for native or application-controlled navigation |
| `maxVisibleItems` | Optional upper limit per group; narrower viewports may show fewer items |
| `visibility` | `all` (default), `mobile`, or `desktop`; breakpoint: 768 px |
| `scrollTarget` | Function returning an HTMLElement, Window, or null; defaults to window |
| `autoScrollDuration` | Tooltip protection after the last automatic scroll event, in milliseconds; default: 1200 |
| `className`, `style` | Root styling |
| `classNames`, `styles` | Per-slot styling |
| `renderLink` | Custom link renderer receiving link props and the item |

### DockItem

Required: `id`, `label`, and `icon`. Optional: `href`, `onClick`, `disabled`, `loading`, `loadingLabel`, `tooltip`, `pinOnActivate`, `tooltipDismissOnActivate`, and `tooltipSuppressed`.

`loading` replaces the icon with a spinner and sets `aria-busy` and `aria-disabled`. The control remains focusable, but activation does not call `onClick` or navigate. `loadingLabel` supplies its accessible name and tooltip while loading; otherwise it uses `label`. Keep the same item ID to preserve an open tooltip. Touch activation refreshes the tooltip duration without repeating the action. Reduced motion displays a stationary spinner.

For a dialog action, set `tooltipDismissOnActivate: true` and bind `tooltipSuppressed` to the dialog's open state. Activation dismisses its tooltip immediately. Suppression prevents it from opening while the dialog is visible; restoring focus after closing does not reopen it. A fresh hover or keyboard navigation can show it again. `tooltip: false` always hides the tooltip. Your application owns dialog state and focus management.

Items with an `href` render as links; other items render as buttons. Disabled items render as disabled buttons. `tooltip` defaults to `true`; `pinOnActivate` defaults to `false`. Set `pinOnActivate: true` explicitly to retain a tooltip after activation. Modified clicks retain normal browser behavior.

Touch activation shows the label for 2 seconds while immediately performing the action, without hover transitions or click highlights. Tapping the same item restarts the timer without remounting the tooltip. The active-section indicator remains visible. Manual scrolling, outside interaction, and changing groups dismiss the tooltip. Mouse hover and keyboard focus retain their usual behavior.

Tooltip text wraps to at most two lines and truncates longer labels. Buttons and links keep their full accessible label.

## Section navigation

`sectionNavigation` handles unmodified same-page hash clicks when the target exists and no custom scrollTarget is supplied. It preserves velocity when retargeting, holds the destination indicator until settling, respects scroll-margin-top and reduced motion, and adds a hash entry with history.pushState. Modified clicks and events prevented by your application retain their normal behavior. Set sectionNavigation to false to opt out.

`useSectionNavigation()` returns `{ destination, navigate, cancel }`. Call `navigate(sectionId)` for a window-scrolling section, read destination while movement is pending, or call cancel to stop. Wheel, touch movement, supported scroll keys, and history navigation cancel pending movement. It does not implement custom-container scrolling.

## Section tracking

`useActiveSection(ids, scrollTarget?)` tracks sections at a reading line 25% down the viewport and selects the last section at the bottom. Pass IDs in document order. The hook responds to scrolling, resizing, and section changes.

The active indicator follows `activeId`, independently of tooltip state. Reduced-motion preferences disable its transition.

### Narrow screens

Items stay in one row of complete buttons rather than wrapping or shrinking. When they do not fit, integrated previous and next buttons switch between groups without sliding. Both arrows remain visible while paginated, with unavailable directions disabled. Page navigation and active-section updates do not change the selected group. All controls are native keyboard-accessible buttons.

Dock width eases between groups without sliding or fading the buttons. Reduced-motion preferences disable this size animation. Enable **Many buttons demo** in the playground to try twelve navigation and action buttons.

## Next.js links

```tsx
import Link from 'next/link';

<Dock
  ariaLabel="Main navigation"
  items={items}
  renderLink={(props) => <Link {...props} />}
/>
```

Forward all supplied props to the link, including event handlers and accessibility attributes.

## Scroll containers

```tsx
const areaRef = useRef<HTMLDivElement>(null);
const resolveArea = useCallback(() => areaRef.current, []);
const activeId = useActiveSection(['home', 'articles'], resolveArea);

<Dock
  ariaLabel="Section navigation"
  items={items}
  activeId={activeId}
  scrollTarget={resolveArea}
/>
```

Use a stable resolver for a scrollable element in the same document. A null target does not fall back to the window. Targets are refreshed after renders and DOM insertions or removals. Handle section scrolling in your application when using a custom container.

## Actions

```tsx
<Dock
  ariaLabel="Article actions"
  items={[
    { id: 'theme', label: 'Change theme', icon: <ThemeIcon />, onClick: toggleTheme },
    { id: 'share', label: 'Share', icon: <ShareIcon />, onClick: shareArticle },
    { id: 'back', label: 'Back', icon: <BackIcon />, tooltip: false, onClick: goBack },
  ]}
/>
```

Action callbacks control routing, theme storage, sharing, and clipboard feedback.

## Interaction and accessibility

Mouse hover or keyboard focus opens a tooltip. Only explicit `pinOnActivate: true` pins a tooltip after activation. Manual scrolling, outside presses, Escape, and window blur dismiss tooltips. Escape preserves keyboard focus. Buttons, links, and inputs keep their native keyboard behavior.

The fixed-position dock belongs outside transformed or paint-contained ancestors, or inside the same dialog when used in a modal. Multiple docks maintain independent tooltip state.

For custom markup, `useDockInteraction({ rootRef, scrollTarget?, autoScrollDuration? })` exposes `openId`, `pinnedId`, `open`, `close`, `activate`, `dismiss`, `startAutoScroll`, and `stopAutoScroll`. Call `startAutoScroll()` before application-controlled smooth scrolling and connect focus, pointer, and tooltip attributes to your markup.

## Run the playground

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

## Tests

```sh
npm run check
npx playwright install chromium firefox webkit
npm run test:e2e
npm run test:registry
```

The test suite covers component interactions, section tracking, SSR, and production browser behavior. Registry tests build Vite consumers with React 18 and React 19, plus a Next.js consumer with React 19. Run `npm run build && npm run check:size` for component bundle measurements excluding React.
