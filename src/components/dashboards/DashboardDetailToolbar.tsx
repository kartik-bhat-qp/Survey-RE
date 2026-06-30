'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import styles from './DashboardDetailToolbar.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
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

const DASHBOARD_SETTINGS_TOOLTIP = 'Dashboard settings';

interface DashboardDetailToolbarProps {
  name: string;
  onNameChange: (name: string) => void;
  showPresentation?: boolean;
  onAddWidget?: () => void;
  onOpenSettings?: () => void;
  onExportPowerPoint?: () => void;
  onOpenPresentation?: () => void;
}

export function DashboardDetailToolbar({
  name,
  onNameChange,
  showPresentation = true,
  onAddWidget,
  onOpenSettings,
  onExportPowerPoint,
  onOpenPresentation,
}: DashboardDetailToolbarProps) {
  const { showToast } = useWuShowToast();
  const [nameState, setNameState] = useState(name);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleNameBlur = (): void => {
    const trimmed = nameState.trim();
    if (!trimmed) {
      setNameState(name);
      return;
    }
    if (trimmed !== name) {
      onNameChange(trimmed);
      showToast({
        message: `Dashboard renamed to '${trimmed}'`,
        variant: 'success',
      });
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.titleSection}>
        <input
          type="text"
          value={nameState}
          onChange={(e) => setNameState(e.target.value)}
          onBlur={handleNameBlur}
          className={styles.nameInput}
          maxLength={100}
          aria-label="Dashboard name"
        />
      </div>

      <div className={styles.actions}>
        {showPresentation && (
          <WuButton
            variant="iconOnly"
            size="sm"
            aria-label="Presentation mode"
            onClick={() => {
              if (onOpenPresentation) {
                onOpenPresentation();
                return;
              }
              showToast({ message: 'Preview mode', variant: 'success' });
            }}
            Icon={<span className="wm-visibility" />}
          />
        )}
        <WuButton
          variant="secondary"
          className={styles.filterButton}
          onClick={() => showToast({ message: 'Filter', variant: 'success' })}
          Icon={<span className="wm-filter-alt" />}
        >
          Filter
        </WuButton>
        <WuMenu
          open={isExportMenuOpen}
          onOpenChange={setIsExportMenuOpen}
          align="end"
          side="bottom"
          sideOffset={6}
          className="w-[224px] rounded-md border border-[#dbe3f0] bg-white p-1.5 shadow-lg"
          Trigger={(
            <WuButton
              variant="iconOnly"
              size="sm"
              aria-label="Export dashboard"
              Icon={<span className="wm-download" />}
            />
          )}
        >
          <WuMenuItem
            Icon={<span className="wm-picture-as-pdf text-[17px] text-[#536277]" aria-hidden="true" />}
            onSelect={() => {
              showToast({ message: 'PDF download started', variant: 'success' });
              setIsExportMenuOpen(false);
            }}
            className="flex w-full justify-start rounded-[4px] px-3 py-2 text-[13px] font-normal text-[#1f2a44] hover:bg-[#eef3f8]"
          >
            PDF Export
          </WuMenuItem>
          <WuMenuItem
            Icon={<span className="wm-slideshow text-[17px] text-[#536277]" aria-hidden="true" />}
            onSelect={() => {
              setIsExportMenuOpen(false);
              onExportPowerPoint?.();
            }}
            className="flex w-full justify-start rounded-[4px] px-3 py-2 text-[13px] font-normal text-[#1f2a44] hover:bg-[#eef3f8]"
          >
            PowerPoint Export
          </WuMenuItem>
        </WuMenu>
        <WuButton
          variant="iconOnly"
          size="sm"
          aria-label="Share dashboard"
          onClick={() => showToast({ message: 'Share dashboard', variant: 'success' })}
          Icon={<span className="wm-share" />}
        />
        <WuTooltip content={DASHBOARD_SETTINGS_TOOLTIP} position="bottom">
          <WuButton
            variant="iconOnly"
            size="sm"
            aria-label={DASHBOARD_SETTINGS_TOOLTIP}
            onClick={() => onOpenSettings?.()}
            Icon={<span className="wm-settings" />}
          />
        </WuTooltip>
        <WuButton onClick={onAddWidget} Icon={<span className="wm-add-2" />}>
          Add widget
        </WuButton>
      </div>
    </header>
  );
}
