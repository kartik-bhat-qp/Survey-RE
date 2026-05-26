'use client';

import { useEffect, useState } from 'react';
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

const DASHBOARD_SETTINGS_TOOLTIP = 'Dashboard settings';

interface DashboardDetailToolbarProps {
  name: string;
  onNameChange: (name: string) => void;
  showPresentation?: boolean;
  onAddWidget?: () => void;
  onOpenSettings?: () => void;
}

export function DashboardDetailToolbar({
  name,
  onNameChange,
  showPresentation = true,
  onAddWidget,
  onOpenSettings,
}: DashboardDetailToolbarProps) {
  const { showToast } = useWuShowToast();
  const [nameState, setNameState] = useState(name);

  useEffect(() => {
    setNameState(name);
  }, [name]);

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
            onClick={() => showToast({ message: 'Preview mode', variant: 'success' })}
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
        <WuButton
          variant="iconOnly"
          size="sm"
          aria-label="Download PDF"
          onClick={() => showToast({ message: 'PDF download started', variant: 'success' })}
          Icon={<span className="wm-download" />}
        />
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
