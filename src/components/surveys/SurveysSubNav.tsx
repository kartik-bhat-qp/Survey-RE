'use client';

import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import styles from './SurveysSubNav.module.css';

type SubNavTab = 'surveys' | 'organization' | 'usage' | 'mobile';

interface SurveysSubNavProps {
  activeTab?: SubNavTab;
}

const TABS: { id: SubNavTab; label: string; icon: string }[] = [
  { id: 'surveys', label: 'Surveys', icon: 'wm-folder' },
  { id: 'organization', label: 'Organization', icon: 'wm-group-add' },
  { id: 'usage', label: 'Usage Dashboard', icon: 'wm-bar-chart' },
  { id: 'mobile', label: 'Mobile', icon: 'wm-smartphone' },
];

export function SurveysSubNav({ activeTab = 'surveys' }: SurveysSubNavProps) {
  const { showToast } = useWuShowToast();

  function handleTabClick(tab: SubNavTab) {
    if (tab === activeTab) return;
    showToast({
      message: `${TABS.find((t) => t.id === tab)?.label} is not available in this prototype`,
      variant: 'info',
    });
  }

  return (
    <nav className={styles.nav} aria-label="Research Suite navigation">
      <ul className={styles.tabs}>
        {TABS.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              className={styles.tab}
              data-active={tab.id === activeTab ? 'true' : undefined}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className={tab.icon} aria-hidden />
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
