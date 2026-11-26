'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAccountSuspended } from '@/hooks/usePhishingPublishHold';

/** Redirects suspended authors away from the suite into the suspended wall. */
export function SuspendedAccountGate({ children }: { children: React.ReactNode }) {
  const suspended = useAccountSuspended();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (!suspended) return;
    if (pathname.startsWith('/account-suspended')) return;
    router.replace('/account-suspended');
  }, [pathname, router, suspended]);

  if (suspended && !pathname.startsWith('/account-suspended')) {
    return null;
  }

  return <>{children}</>;
}
