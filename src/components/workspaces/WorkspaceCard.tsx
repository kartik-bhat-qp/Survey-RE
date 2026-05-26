'use client';

import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { Workspace } from '@/data/mock-workspaces';
import { formatLongDate } from '@/data/mock-utils';
import styles from './WorkspaceCard.module.css';

const STAT_ITEMS = [
  { key: 'dashboards' as const, label: 'Dashboards', icon: 'wm-dashboard' },
  { key: 'surveyStacks' as const, label: 'Survey Stacks', icon: 'wm-layers' },
  { key: 'biVariables' as const, label: 'BI Variables', icon: 'wm-list' },
  { key: 'reports' as const, label: 'Reports', icon: 'wc-report' },
];

interface WorkspaceCardProps {
  workspace: Workspace;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const router = useRouter();
  const { showToast } = useWuShowToast();

  function handleSelect(): void {
    showToast({
      message: `Switched to workspace '${workspace.name}'`,
      variant: 'success',
    });
    router.push('/dashboards');
  }

  return (
    <button type="button" className={styles.card} onClick={handleSelect}>
      <div className={styles.info}>
        <p className={styles.name}>{workspace.name}</p>
        <p className={styles.date}>
          {formatLongDate(workspace.updatedAt)}
        </p>
      </div>
      <div className={styles.stats}>
        {STAT_ITEMS.map((item) => (
          <div key={item.key} className={styles.stat}>
            <span className={styles.statValue}>{workspace.stats[item.key]}</span>
            <span className={styles.statLabel}>
              <span className={`${item.icon} ${styles.statIcon}`} aria-hidden />
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}
