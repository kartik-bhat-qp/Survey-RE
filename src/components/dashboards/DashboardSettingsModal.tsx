'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { DashboardDataSlicersTab } from '@/components/dashboards/DashboardDataSlicersTab';
import { DashboardSharedUrlTab } from '@/components/dashboards/DashboardSharedUrlTab';
import { DashboardGlobalSettingsTab } from '@/components/dashboards/DashboardGlobalSettingsTab';
import {
  DashboardDesignSettingsTab,
  DEFAULT_DESIGN_TYPOGRAPHY,
  DESIGN_PALETTE_OPTIONS,
  DESIGN_SENTIMENT_OPTIONS,
  DESIGN_THEME_OPTIONS,
  getNextDesignFontSizeOption,
  type DesignTypographyOptions,
  type DesignSelectOption,
} from '@/components/dashboards/DashboardDesignSettingsTab';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './DashboardSettingsModal.module.css';

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuPopover = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPopover })),
  { ssr: false }
);

interface DashboardSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardName: string;
  onNameChange: (name: string) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  appliedDesignTypography?: DesignTypographyOptions;
  onDesignTypographyChange?: (typography: DesignTypographyOptions) => void;
}

function SettingsPlaceholder({ label }: { label: string }) {
  return (
    <p className={styles.placeholder}>
      Configure {label.toLowerCase()} for this dashboard. Settings are saved automatically in
      this prototype.
    </p>
  );
}

function GeneralTab({
  dashboardName,
  onNameChange,
  onDuplicate,
  onDeleteRequest,
  accessibilityShortcutsEnabled,
  onAccessibilityShortcutsChange,
}: {
  dashboardName: string;
  onNameChange: (name: string) => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  accessibilityShortcutsEnabled: boolean;
  onAccessibilityShortcutsChange: (enabled: boolean) => void;
}) {
  const { showToast } = useWuShowToast();
  const [name, setName] = useState(dashboardName);
  const [showAccessibilityShortcuts, setShowAccessibilityShortcuts] = useState(false);

  const handleNameBlur = (): void => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(dashboardName);
      return;
    }
    if (trimmed !== dashboardName) {
      onNameChange(trimmed);
      showToast({
        message: `Dashboard renamed to '${trimmed}'`,
        variant: 'success',
      });
    }
  };

  return (
    <div className={styles.generalPanel}>
      <WuInput
        Label="Dashboard name"
        variant="outlined"
        value={name}
        maxLength={100}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleNameBlur}
      />
      <div className={styles.actions}>
        <WuButton
          variant="secondary"
          className={styles.duplicateBtn}
          Icon={<span className="wm-content-copy" />}
          onClick={onDuplicate}
        >
          Duplicate dashboard
        </WuButton>
        <WuButton
          variant="secondary"
          className={styles.deleteBtn}
          Icon={<span className="wm-delete" />}
          onClick={onDeleteRequest}
        >
          Delete dashboard
        </WuButton>
      </div>
      <div className={styles.accessibilityRow}>
        <span className={styles.accessibilityLabel}>Accessibility shortcuts</span>
        <div className={styles.accessibilityControls}>
          <WuToggle
            checked={accessibilityShortcutsEnabled}
            onChange={onAccessibilityShortcutsChange}
            aria-label="Enable accessibility shortcuts"
          />
          <WuPopover
            open={showAccessibilityShortcuts}
            onOpenChange={setShowAccessibilityShortcuts}
            side="right"
            align="start"
            className={styles.shortcutPopover}
            Trigger={
              <WuButton
                type="button"
                variant="iconOnly"
                aria-label="Show accessibility shortcuts"
                aria-expanded={showAccessibilityShortcuts}
                className={styles.shortcutHelpButton}
              >
                <span className="wm-help" aria-hidden="true" />
              </WuButton>
            }
          >
            <div className={styles.shortcutContent}>
              <p className={styles.shortcutTitle}>Available shortcuts</p>
              <div className={styles.shortcutList}>
                <div className={styles.shortcutItem}>
                  <span>Increase dashboard font size</span>
                  <kbd>Alt + Shift + Up</kbd>
                </div>
                <div className={styles.shortcutItem}>
                  <span>Decrease dashboard font size</span>
                  <kbd>Alt + Shift + Down</kbd>
                </div>
              </div>
            </div>
          </WuPopover>
        </div>
      </div>
    </div>
  );
}

export function DashboardSettingsModal({
  open,
  onOpenChange,
  dashboardName,
  onNameChange,
  onDuplicate,
  onDelete,
  appliedDesignTypography = DEFAULT_DESIGN_TYPOGRAPHY,
  onDesignTypographyChange,
}: DashboardSettingsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [accessibilityShortcutsEnabled, setAccessibilityShortcutsEnabled] = useState(false);
  const [designTheme, setDesignTheme] = useState(DESIGN_THEME_OPTIONS[0]);
  const [designPalette, setDesignPalette] = useState(DESIGN_PALETTE_OPTIONS[0]);
  const [designSentiment, setDesignSentiment] = useState(DESIGN_SENTIMENT_OPTIONS[0]);
  const [designFontSize, setDesignFontSize] = useState(appliedDesignTypography.fontSize);
  const [designFontStyle, setDesignFontStyle] = useState(appliedDesignTypography.fontStyle);
  const [designFontFamily, setDesignFontFamily] = useState(appliedDesignTypography.fontFamily);
  const [hasUnsavedDesignChanges, setHasUnsavedDesignChanges] = useState(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setDeleteConfirmOpen(false);
        setActiveTab('general');
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  const handleApplyGlobalSettings = useCallback(() => {
    showToast({
      message: 'Global settings applied to existing widgets',
      variant: 'success',
    });
  }, [showToast]);

  const updateDesignSelect = useCallback(
    (option: DesignSelectOption, onChange: (nextOption: DesignSelectOption) => void) => {
      onChange(option);
      setHasUnsavedDesignChanges(true);
    },
    []
  );

  const changeDashboardFontSizeByShortcut = useCallback(
    (direction: -1 | 1) => {
      const nextFontSize = getNextDesignFontSizeOption(designFontSize, direction);
      setDesignFontSize(nextFontSize);
      setHasUnsavedDesignChanges(true);
      onDesignTypographyChange?.({
        fontSize: nextFontSize,
        fontStyle: designFontStyle,
        fontFamily: designFontFamily,
      });
      showToast({
        message: `Dashboard font size set to ${nextFontSize.label}`,
        variant: 'success',
      });
    },
    [designFontFamily, designFontSize, designFontStyle, onDesignTypographyChange, showToast]
  );

  useEffect(() => {
    if (!accessibilityShortcutsEnabled) return;

    function handleAccessibilityShortcut(event: KeyboardEvent) {
      if (!event.altKey || !event.shiftKey) return;

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        changeDashboardFontSizeByShortcut(1);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        changeDashboardFontSizeByShortcut(-1);
      }
    }

    document.addEventListener('keydown', handleAccessibilityShortcut);
    return () => document.removeEventListener('keydown', handleAccessibilityShortcut);
  }, [accessibilityShortcutsEnabled, changeDashboardFontSizeByShortcut]);

  const handleSaveDesignSettings = useCallback(() => {
    onDesignTypographyChange?.({
      fontSize: designFontSize,
      fontStyle: designFontStyle,
      fontFamily: designFontFamily,
    });
    setHasUnsavedDesignChanges(false);
    showToast({
      message: 'Dashboard design settings saved successfully',
      variant: 'success',
      duration: 3000,
      position: 'top',
    });
    handleOpenChange(false);
  }, [
    designFontFamily,
    designFontSize,
    designFontStyle,
    handleOpenChange,
    onDesignTypographyChange,
    showToast,
  ]);

  const handleDuplicate = useCallback(() => {
    const copyName = `${dashboardName.trim() || 'Untitled'} (Copy)`;
    onDuplicate?.();
    showToast({
      message: `'${dashboardName}' copied successfully to '${copyName}'`,
      variant: 'success',
    });
    handleOpenChange(false);
  }, [dashboardName, handleOpenChange, onDuplicate, showToast]);

  const handleDeleteConfirm = useCallback(() => {
    onDelete?.();
    handleOpenChange(false);
  }, [handleOpenChange, onDelete]);

  const tabs: IWuTabItem[] = useMemo(
    () => [
      {
        value: 'general',
        Trigger: 'General',
        Content: (
          <GeneralTab
            key={dashboardName}
            dashboardName={dashboardName}
            onNameChange={onNameChange}
            onDuplicate={handleDuplicate}
            onDeleteRequest={() => setDeleteConfirmOpen(true)}
            accessibilityShortcutsEnabled={accessibilityShortcutsEnabled}
            onAccessibilityShortcutsChange={setAccessibilityShortcutsEnabled}
          />
        ),
      },
      {
        value: 'global-settings',
        Trigger: 'Global settings',
        Content: <DashboardGlobalSettingsTab />,
      },
      {
        value: 'data-slicers',
        Trigger: 'Data slicers',
        Content: <DashboardDataSlicersTab />,
      },
      {
        value: 'design',
        Trigger: 'Design',
        Content: (
          <DashboardDesignSettingsTab
            designTheme={designTheme}
            designPalette={designPalette}
            designSentiment={designSentiment}
            designFontSize={designFontSize}
            designFontStyle={designFontStyle}
            designFontFamily={designFontFamily}
            onDesignThemeChange={(option) => updateDesignSelect(option, setDesignTheme)}
            onDesignPaletteChange={(option) => updateDesignSelect(option, setDesignPalette)}
            onDesignSentimentChange={(option) => updateDesignSelect(option, setDesignSentiment)}
            onDesignFontSizeChange={(option) => updateDesignSelect(option, setDesignFontSize)}
            onDesignFontStyleChange={(option) => updateDesignSelect(option, setDesignFontStyle)}
            onDesignFontFamilyChange={(option) => updateDesignSelect(option, setDesignFontFamily)}
          />
        ),
      },
      {
        value: 'weightings',
        Trigger: 'Weightings',
        Content: <SettingsPlaceholder label="Weightings" />,
      },
      {
        value: 'ai-settings',
        Trigger: 'AI settings',
        Content: <SettingsPlaceholder label="AI settings" />,
      },
      {
        value: 'filters',
        Trigger: 'Filters',
        Content: <SettingsPlaceholder label="Filters" />,
      },
      {
        value: 'shared-url',
        Trigger: 'Shared URL',
        Content: <DashboardSharedUrlTab />,
      },
    ],
    [
      accessibilityShortcutsEnabled,
      dashboardName,
      designFontFamily,
      designFontSize,
      designFontStyle,
      designPalette,
      designSentiment,
      designTheme,
      handleDuplicate,
      onNameChange,
      updateDesignSelect,
    ]
  );

  if (!wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;

  return (
    <>
      {open ? (
        <WuModal
          open
          onOpenChange={handleOpenChange}
          className={styles.modal}
          variant="action"
        >
          <WuModalHeader className={`${styles.header} ${styles.modalTitle}`}>
            Dashboard settings
          </WuModalHeader>

          <WuModalContent className={styles.content}>
            <div className={styles.tabRoot}>
              <WuTab
                items={tabs}
                value={activeTab}
                onValueChange={setActiveTab}
              />
            </div>
          </WuModalContent>

          {activeTab === 'global-settings' ? (
            <WuModalFooter className={styles.globalFooter}>
              <WuButton onClick={handleApplyGlobalSettings}>
                Apply to existing widgets
              </WuButton>
            </WuModalFooter>
          ) : activeTab === 'design' ? (
            <WuModalFooter className={styles.globalFooter}>
              <WuButton
                onClick={handleSaveDesignSettings}
                disabled={!hasUnsavedDesignChanges}
              >
                Save
              </WuButton>
            </WuModalFooter>
          ) : null}
        </WuModal>
      ) : null}

      <ConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete dashboard"
        description={`Are you sure you want to delete this dashboard '${dashboardName}'?`}
        confirmLabel="Delete"
        variant="critical"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
