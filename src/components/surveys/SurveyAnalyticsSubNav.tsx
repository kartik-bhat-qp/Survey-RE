'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { NavLink } from '@/components/surveys/NavLink';
import styles from './SurveyAnalyticsSubNav.module.css';

const WuSecondaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSecondaryNavbar })),
  { ssr: false }
);

type AnalyticsTab = 'dashboard' | 'analysis' | 'net-insights' | 'manage-data';

const ANALYTICS_TABS: { id: AnalyticsTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'wm-dashboard' },
  { id: 'analysis', label: 'Analysis', icon: 'wm-bar-chart' },
  { id: 'net-insights', label: 'Net Insights', icon: 'wm-insights' },
  { id: 'manage-data', label: 'Manage Data', icon: 'wm-storage' },
];

export function SurveyAnalyticsSubNav() {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('dashboard');

  const links = useMemo(
    () =>
      ANALYTICS_TABS.map((tab) => ({
        link: (
          <NavLink
            href="#"
            variant="secondary"
            active={activeTab === tab.id}
            onClick={(event) => {
              event.preventDefault();
              if (tab.id === 'dashboard') {
                setActiveTab(tab.id);
                return;
              }
              showToast({
                message: `${tab.label} is not available in this prototype`,
                variant: 'info',
              });
            }}
          >
            {tab.label}
          </NavLink>
        ),
        imgOrIcon: <span className={tab.icon} aria-hidden />,
      })),
    [activeTab, showToast]
  );

  return <WuSecondaryNavbar Links={links} className={styles.navbar} />;
}
