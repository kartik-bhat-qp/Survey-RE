'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  SURVEY_ANALYTICS_NAV_TABS,
  type SurveyAnalyticsNavTabId,
} from '@/data/mock-survey-analytics';
import styles from './SurveyAnalyticsSubNav.module.css';

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

export function SurveyAnalyticsSubNav() {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<SurveyAnalyticsNavTabId>('dashboard');

  function handleMenuSelect(
    tabId: SurveyAnalyticsNavTabId,
    tabLabel: string,
    itemLabel: string,
    itemId: string
  ) {
    setActiveTab(tabId);
    if (tabId === 'dashboard' && itemId === 'default') {
      return;
    }
    showToast({ message: `${tabLabel}: ${itemLabel}`, variant: 'success' });
  }

  return (
    <div className={styles.navWrap}>
      <nav className={styles.nav} aria-label="Analytics views">
        {SURVEY_ANALYTICS_NAV_TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <div key={tab.id} className={styles.tabCell}>
            <WuMenu
              Trigger={
                <button
                  type="button"
                  className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                  aria-haspopup="menu"
                  aria-label={`${tab.label} menu`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={`${tab.icon} ${styles.tabIcon}`} aria-hidden />
                  <span className={styles.tabLabelRow}>
                    <span className={styles.tabLabel}>{tab.label}</span>
                    <span className={`wm-arrow-drop-down ${styles.tabCaret}`} aria-hidden />
                  </span>
                </button>
              }
              align="start"
            >
              {tab.menuItems.map((item) => (
                <WuMenuItem
                  key={item.id}
                  onSelect={() => handleMenuSelect(tab.id, tab.label, item.label, item.id)}
                >
                  {item.label}
                </WuMenuItem>
              ))}
            </WuMenu>
          </div>
        );
        })}
      </nav>
    </div>
  );
}
