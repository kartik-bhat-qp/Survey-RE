export const BI_STATS_PRODUCT_NAME = 'BI Stats';
export const BI_PACKAGE_PRODUCT_NAME = 'BI package';
export const BI_LITE_PRODUCT_NAME = 'BI lite';

/** Product name shown in WuAppHeader when inside a BI product route. */
export function getBiHeaderProductName(pathname: string): string {
  if (pathname === '/bi-lite' || pathname.startsWith('/bi-lite/')) {
    return BI_LITE_PRODUCT_NAME;
  }
  if (pathname === '/bi-package' || pathname.startsWith('/bi-package/')) {
    return BI_PACKAGE_PRODUCT_NAME;
  }
  return BI_STATS_PRODUCT_NAME;
}

/**
 * License diamonds / locks apply only on BI package and BI lite —
 * not on BI Stats.
 */
export function isBiLicenseRestrictedProduct(pathname: string): boolean {
  return (
    pathname === '/bi-lite' ||
    pathname.startsWith('/bi-lite/') ||
    pathname === '/bi-package' ||
    pathname.startsWith('/bi-package/')
  );
}
