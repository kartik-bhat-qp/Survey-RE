export function getSectionBasePath(pathname: string): string {
  if (pathname === '/bi-lite' || pathname.startsWith('/bi-lite/')) return '/bi-lite';
  if (pathname === '/bi-package' || pathname.startsWith('/bi-package/')) return '/bi-package';
  return '';
}

export function withSectionBasePath(basePath: string, href: string): string {
  if (!basePath) return href;
  return `${basePath}${href}`;
}
