'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import styles from './SurveysHeaderBar.module.css';

const WuAppHeaderSearch = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeaderSearch })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

export function SurveysHeaderActions({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const { showToast } = useWuShowToast();

  return (
    <div className={compact ? `${styles.bar} ${styles.barCompact}` : styles.bar}>
      <WuAppHeaderSearch
        placeholder="Global search for users, surveys, tickets"
        defaultCollapsed={false}
        onSearch={() =>
          showToast({ message: 'Global search is not available in this prototype', variant: 'info' })
        }
        className={styles.search}
      />
      <div className={styles.actions}>
        <WuMenu
          Trigger={
            <button type="button" className={styles.adminTrigger}>
              Admin
              <span className="wm-arrow-drop-down" />
            </button>
          }
          align="end"
        >
          <WuMenuItem
            onSelect={() => showToast({ message: 'User management', variant: 'success' })}
          >
            User management
          </WuMenuItem>
          <WuMenuItem
            onSelect={() => showToast({ message: 'Account settings', variant: 'success' })}
          >
            Account settings
          </WuMenuItem>
          <WuMenuItem onSelect={() => router.push('/surveys/create')}>
            New survey creation flow
          </WuMenuItem>
        </WuMenu>
        <WuButton
          variant="rounded"
          color="upgrade"
          onClick={() => showToast({ message: 'Upgrade options opened', variant: 'success' })}
        >
          Upgrade Now
        </WuButton>
      </div>
    </div>
  );
}
