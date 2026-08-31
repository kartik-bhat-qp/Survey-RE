'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  DashboardWidgetSettingsModal,
  type DashboardWidgetFilterType,
} from '@/components/dashboards/DashboardWidgetSettingsModal';
import styles from './DashboardWidgetCard.module.css';

const DIAMOND_TOOLTIP =
  'Not available with your current license. Will only show a maximum of 100 responses.';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
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

interface DashboardWidgetCardProps {
  title: string;
  children: React.ReactNode;
  dragHandleClassName?: string;
  showDiamond?: boolean;
  insightCount?: number;
  onOpenInsights?: () => void;
  actions?: React.ReactNode;
  shared?: boolean;
}

export function DashboardWidgetCard({
  title,
  children,
  dragHandleClassName,
  showDiamond = false,
  insightCount = 0,
  onOpenInsights,
  actions,
  shared = false,
}: DashboardWidgetCardProps) {
  const { showToast } = useWuShowToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filterType, setFilterType] = useState<DashboardWidgetFilterType>('Dashboard');

  return (
    <article className={`${styles.card} ${shared ? styles.shared : ''}`}>
      <header className={`${styles.header} ${dragHandleClassName ?? ''}`.trim()}>
        <h3 className={styles.title}>{title}</h3>
        <div
          className={`${styles.actions} dashboard-widget-actions`}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >{actions !== undefined ? actions : <>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.insightButton}`}
            aria-label={`Insights${insightCount > 0 ? `, ${insightCount} available` : ''}`}
            onClick={onOpenInsights}
          >
            <span className="wm-lightbulb" aria-hidden="true" />
            {insightCount > 0 ? <span className={styles.insightBadge}>{insightCount}</span> : null}
          </button>
          {showDiamond && (
            <WuTooltip content={DIAMOND_TOOLTIP} position="bottom">
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.diamondBtn}`}
                aria-label={DIAMOND_TOOLTIP}
              >
                <span className="wm-diamond" />
              </button>
            </WuTooltip>
          )}
          <WuMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            align="end"
            side="bottom"
            sideOffset={4}
            className={styles.widgetMenu}
            Trigger={(
              <button type="button" className={styles.actionBtn} aria-label="Widget menu">
                <span className="wm-more-vert" />
              </button>
            )}
          >
            <WuMenuItem Icon={<span className="wm-edit" aria-hidden />} onSelect={() => showToast({ message: `Edit ${title}`, variant: 'info' })}>Edit</WuMenuItem>
            <WuMenuItem Icon={<span className="wm-settings" aria-hidden />} onSelect={() => { setMenuOpen(false); setSettingsOpen(true); }}>Settings</WuMenuItem>
            <WuMenuItem Icon={<span className="wm-open-in-full" aria-hidden />} onSelect={() => showToast({ message: `${title} opened in full screen`, variant: 'success' })}>Full screen</WuMenuItem>
            <WuMenuItem Icon={<span className="wm-content-copy" aria-hidden />} onSelect={() => showToast({ message: `${title} duplicated`, variant: 'success' })}>Duplicate</WuMenuItem>
            <WuMenuItem Icon={<span className="wm-info" aria-hidden />} onSelect={() => showToast({ message: `${title} widget information`, variant: 'info' })}>Info</WuMenuItem>
          </WuMenu>
        </>}</div>
      </header>
      <div className={styles.body}>{children}</div>
      <DashboardWidgetSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title={title}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />
    </article>
  );
}
