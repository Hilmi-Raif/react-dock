import type { CSSProperties, FocusEvent, MouseEvent, PointerEvent, ReactNode, RefObject } from 'react';

export type ScrollTarget = () => HTMLElement | Window | null;
export type DockSlot = 'root' | 'surface' | 'dock' | 'item' | 'icon' | 'tooltip' | 'indicator';
export type DockStyle = CSSProperties & { [key: `--rd-${string}`]: string | number | undefined };
export interface DockItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  tooltipDismissOnActivate?: boolean;
  tooltipSuppressed?: boolean;
  tooltip?: boolean;
  pinOnActivate?: boolean;
}
export interface DockLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  'aria-label': string;
  'aria-busy'?: boolean;
  'aria-disabled'?: boolean;
  'aria-describedby'?: string;
  'aria-current'?: 'page';
}
export interface DockProps {
  items: readonly DockItem[];
  ariaLabel: string;
  activeId?: string;
  maxVisibleItems?: number;
  visibility?: 'all' | 'mobile' | 'desktop';
  scrollTarget?: ScrollTarget;
  sectionNavigation?: boolean;
  autoScrollDuration?: number;
  className?: string;
  style?: DockStyle;
  classNames?: Partial<Record<DockSlot, string>>;
  styles?: Partial<Record<DockSlot, DockStyle>>;
  renderLink?: (props: DockLinkProps, item: DockItem) => ReactNode;
}
export interface DockInteractionOptions {
  rootRef: RefObject<HTMLElement | null>;
  scrollTarget?: ScrollTarget;
  autoScrollDuration?: number;
}
