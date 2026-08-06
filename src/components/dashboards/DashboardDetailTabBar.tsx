'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AiDashboardCanvas } from '@/components/dashboards/AiDashboardCanvas';
import { DashboardExternalReportPanel } from '@/components/dashboards/DashboardExternalReportPanel';
import { NewReportTabModal } from '@/components/dashboards/NewReportTabModal';
import type { DesignTypographyOptions } from '@/components/dashboards/DashboardDesignSettingsTab';
import type { DashboardReportPickItem } from '@/data/mock-dashboard-report-tabs';
import styles from './DashboardDetailTabBar.module.css';

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
const WuMenuSeparatorItem = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuSeparatorItem })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

type DashboardTabKind = 'canvas' | 'report';

interface DashboardTab {
  id: string;
  label: string;
  kind: DashboardTabKind;
  reportCategory?: 'crosstab' | 'text-ai';
  reportName?: string;
}

const INITIAL_TABS: DashboardTab[] = [
  { id: 'tab-1', label: 'Tab 1', kind: 'canvas' },
  { id: 'tab-2', label: 'Tab 2', kind: 'canvas' },
];

const MENU_ITEM_CLASS =
  'flex w-full justify-start rounded-[4px] px-3 py-2 text-[13px] font-normal text-[#1f2a44] hover:bg-[#eef3f8]';

interface DashboardDetailTabBarProps {
  designTypography: DesignTypographyOptions;
}

export function DashboardDetailTabBar({ designTypography }: DashboardDetailTabBarProps) {
  const { showToast } = useWuShowToast();
  const [tabs, setTabs] = useState<DashboardTab[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState(INITIAL_TABS[0].id);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [tabMenuOpenId, setTabMenuOpenId] = useState<string | null>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  function handleAddReport(): void {
    setAddMenuOpen(false);
    setReportModalOpen(true);
  }

  function handleSaveReportTab(report: DashboardReportPickItem): void {
    const nextIndex = tabs.length + 1;
    const nextTab: DashboardTab = {
      id: `report-${report.id}-${Date.now()}`,
      label: `Tab ${nextIndex}`,
      kind: 'report',
      reportCategory: report.category,
      reportName: report.name,
    };
    setTabs((prev) => [...prev, nextTab]);
    setActiveTabId(nextTab.id);
  }

  function handleAddTab(): void {
    setAddMenuOpen(false);
    const nextIndex = tabs.length + 1;
    const nextTab: DashboardTab = {
      id: `tab-${Date.now()}`,
      label: `Tab ${nextIndex}`,
      kind: 'canvas',
    };
    setTabs((prev) => [...prev, nextTab]);
    setActiveTabId(nextTab.id);
    showToast({ message: `${nextTab.label} added`, variant: 'success' });
  }

  function handleRenameTab(tab: DashboardTab): void {
    setTabMenuOpenId(null);
    showToast({ message: `Rename ${tab.label}`, variant: 'info' });
  }

  function handleDeleteTab(tab: DashboardTab): void {
    setTabMenuOpenId(null);
    if (tabs.length <= 1) {
      showToast({ message: 'At least one tab is required', variant: 'error' });
      return;
    }
    setTabs((prev) => {
      const next = prev.filter((item) => item.id !== tab.id);
      if (activeTabId === tab.id) {
        setActiveTabId(next[0]?.id ?? '');
      }
      return next;
    });
    showToast({ message: `${tab.label} deleted`, variant: 'success' });
  }

  return (
    <>
      <div className={styles.contentArea}>
        {activeTab?.kind === 'report' && activeTab.reportCategory && activeTab.reportName ? (
          <DashboardExternalReportPanel
            key={activeTab.id}
            reportName={activeTab.reportName}
            category={activeTab.reportCategory}
          />
        ) : (
          <AiDashboardCanvas designTypography={designTypography} />
        )}
      </div>

      <div className={styles.tabBar}>
        <WuMenu
          open={addMenuOpen}
          onOpenChange={setAddMenuOpen}
          align="start"
          side="top"
          sideOffset={6}
          className={styles.addMenu}
          Trigger={
            <WuButton
              size="sm"
              variant="secondary"
              className={styles.addBtn}
              Icon={<span className="wm-add" />}
              aria-label="Add"
            />
          }
        >
          <WuMenuItem
            Icon={<span className={`wm-insert-chart ${styles.menuIcon}`} aria-hidden />}
            onSelect={handleAddReport}
            className={MENU_ITEM_CLASS}
          >
            Report
          </WuMenuItem>
          <WuMenuSeparatorItem />
          <WuMenuItem
            Icon={<span className={`wm-add ${styles.menuIcon}`} aria-hidden />}
            onSelect={handleAddTab}
            className={MENU_ITEM_CLASS}
          >
            Tab
          </WuMenuItem>
        </WuMenu>

        <div className={styles.tabs} role="tablist" aria-label="Dashboard tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isExternalReport = tab.kind === 'report';
            return (
              <div
                key={tab.id}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={styles.tabLabel}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {isExternalReport ? (
                    <WuTooltip content="External report" position="top">
                      <span
                        className={`wm-description ${styles.externalReportIcon}`}
                        aria-label="External report"
                      />
                    </WuTooltip>
                  ) : null}
                  <span className={styles.tabLabelText}>{tab.label}</span>
                </button>
                <WuMenu
                  open={tabMenuOpenId === tab.id}
                  onOpenChange={(open) => setTabMenuOpenId(open ? tab.id : null)}
                  align="end"
                  side="top"
                  sideOffset={6}
                  className={styles.tabMenu}
                  Trigger={
                    <button
                      type="button"
                      className={styles.tabMoreBtn}
                      aria-label={`${tab.label} options`}
                    >
                      <span className="wm-more-vert" aria-hidden />
                    </button>
                  }
                >
                  <WuMenuItem
                    onSelect={() => handleRenameTab(tab)}
                    className={MENU_ITEM_CLASS}
                  >
                    Rename
                  </WuMenuItem>
                  <WuMenuItem
                    onSelect={() => handleDeleteTab(tab)}
                    className={MENU_ITEM_CLASS}
                  >
                    Delete
                  </WuMenuItem>
                </WuMenu>
              </div>
            );
          })}
        </div>
      </div>

      <NewReportTabModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        onSave={handleSaveReportTab}
      />
    </>
  );
}
