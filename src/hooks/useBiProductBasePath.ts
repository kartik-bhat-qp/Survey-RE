'use client';

import { usePathname } from 'next/navigation';

export const BI_PRODUCT_PREFIXES = ['/bi-package'] as const;

export type BiProductPrefix = (typeof BI_PRODUCT_PREFIXES)[number];

export function getBiProductBasePath(pathname: string): string {
  const match = BI_PRODUCT_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return match ?? '';
}

export function useBiProductBasePath(): string {
  const pathname = usePathname();
  return getBiProductBasePath(pathname);
}

export function withBiProductBasePath(basePath: string, href: string): string {
  if (!basePath) return href;
  return `${basePath}${href}`;
}
