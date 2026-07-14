'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSurveyAnalyticsView } from '@/components/surveys/SurveyAnalyticsViewContext';
import {
  ANALYTICS_TAB_CONFIG,
  ANALYTICS_TAB_IDS,
  type AnalyticsNavItem,
  type AnalyticsTabId,
} from '@/data/mock-survey-analytics';
import styles from './SurveyAnalyticsSubNav.module.css';

const WuSecondaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSecondaryNavbar })),
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

function AnalyticsTabNavIcon({
  tabId,
  defaultIcon,
  items,
}: {
  tabId: AnalyticsTabId;
  defaultIcon: string;
  items: AnalyticsNavItem[];
}) {
  const { activeTab, activeSubView } = useSurveyAnalyticsView();
  const isActiveTab = activeTab === tabId;
  const icon =
    isActiveTab
      ? (items.find((item) => item.id === activeSubView)?.icon ?? defaultIcon)
      : defaultIcon;

  return (
    <div className={styles.tabIconWrap}>
      <div className={styles.tabNavGrid}>
        <span className={styles.tabGridSpacer} aria-hidden />
        <span className={`${icon} ${styles.tabIcon}`} aria-hidden />
        <span className={styles.tabGridSpacer} aria-hidden />
      </div>
    </div>
  );
}

function AnalyticsTabNavMenu({
  tabId,
  label,
  items,
}: {
  tabId: AnalyticsTabId;
  label: string;
  items: AnalyticsNavItem[];
}) {
  const { activeTab, activeSubView, setAnalyticsSelection } = useSurveyAnalyticsView();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActiveTab = activeTab === tabId;

  const displayLabel = isActiveTab
    ? (items.find((item) => item.id === activeSubView)?.label ?? label)
    : label;

  function handleSelectView(item: AnalyticsNavItem) {
    if (item.openInNewTab) {
      window.open(item.openInNewTab, '_blank', 'noopener,noreferrer');
      setMenuOpen(false);
      return;
    }
    setAnalyticsSelection(tabId, item.id);
    setMenuOpen(false);
  }

  return (
    <WuMenu
      open={menuOpen}
      onOpenChange={setMenuOpen}
      Trigger={
        <button
          type="button"
          className={`${styles.tabTrigger} ${styles.tabNavGrid} ${
            isActiveTab ? 'wu-secondary-nav-active-link' : ''
          }`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className={styles.tabGridSpacer} aria-hidden />
          <span className={styles.tabLabel}>{displayLabel}</span>
          <span className={`wm-arrow-drop-down ${styles.tabChevron}`} aria-hidden />
        </button>
      }
      align="start"
      className={styles.tabMenu}
    >
      {items.map((item) => (
        <WuMenuItem
          key={item.id}
          className={
            isActiveTab && activeSubView === item.id && !item.openInNewTab
              ? styles.tabMenuItemActive
              : styles.tabMenuItem
          }
          onSelect={() => handleSelectView(item)}
        >
          <span className={styles.tabMenuItemContent}>
            <span className={styles.tabMenuItemLabel}>
              {item.label}
              {item.openInNewTab ? (
                <span className={`wm-open-in-new ${styles.redirectIcon}`} aria-label="Opens in new tab" />
              ) : null}
            </span>
            <span className={styles.tabMenuItemBadges}>
              {item.isNew ? (
                <span className={styles.newBadge} aria-label="New feature">
                  New
                </span>
              ) : null}
              {item.requiresAdvancedLicense ? (
                <span className={styles.advancedBadge} aria-label="Advanced license required">
                  <span className="wm-science" aria-hidden />
                </span>
              ) : null}
            </span>
          </span>
        </WuMenuItem>
      ))}
    </WuMenu>
  );
}

export function SurveyAnalyticsSubNav() {
  const links = useMemo(
    () =>
      ANALYTICS_TAB_IDS.map((tabId) => {
        const tab = ANALYTICS_TAB_CONFIG[tabId];
        return {
          link: (
            <div className={styles.tabLinkWrap}>
              <AnalyticsTabNavMenu tabId={tabId} label={tab.label} items={tab.items} />
            </div>
          ),
          imgOrIcon: (
            <div className={styles.tabIconWrap}>
              <AnalyticsTabNavIcon
                tabId={tabId}
                defaultIcon={tab.icon}
                items={tab.items}
              />
            </div>
          ),
        };
      }),
    []
  );

  return <WuSecondaryNavbar Links={links} className={styles.navbar} />;
}
