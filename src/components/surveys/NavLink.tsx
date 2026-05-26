import type { AnchorHTMLAttributes, ReactElement } from 'react';

export type NavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'active'> & {
  active?: boolean;
  variant?: 'primary' | 'secondary';
};

const ACTIVE_CLASS = {
  primary: 'wu-primary-nav-active-link',
  secondary: 'wu-secondary-nav-active-link',
} as const;

export function NavLink({
  active = false,
  variant = 'primary',
  className,
  ...props
}: NavLinkProps): ReactElement {
  const mergedClassName = [className, active ? ACTIVE_CLASS[variant] : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <a
      {...props}
      className={mergedClassName || undefined}
      aria-current={active ? 'page' : undefined}
    />
  );
}
