'use client';

import { usePathname } from 'next/navigation';
import { isBiLicenseRestrictedProduct } from '@/lib/bi-header-product';

/** True when diamond/lock license UI should show (BI package & BI lite only). */
export function useBiLicenseRestrictions(): boolean {
  const pathname = usePathname() ?? '';
  return isBiLicenseRestrictedProduct(pathname);
}
