'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { DashboardDataSlicersTab } from '@/components/dashboards/DashboardDataSlicersTab';
import { DashboardSharedUrlTab } from '@/components/dashboards/DashboardSharedUrlTab';
import { DashboardGlobalSettingsTab } from '@/components/dashboards/DashboardGlobalSettingsTab';
import { DashboardFiltersSettingsTab } from '@/components/dashboards/DashboardFiltersSettingsTab';
import {
  INITIAL_DASHBOARD_SAVED_FILTERS,
  type DashboardSavedFilter,
} from '@/data/mock-dashboard-filters';
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
import type { SharedUrlLink } from '@/data/mock-shared-urls';
import {
  AI_INSIGHT_REFRESH_OPTIONS,
  formatAiInsightDateTime,
  getAiInsightRefreshOption,
  getNextAiInsightRefreshAt,
  type AiInsightRefreshFrequency,
  type AiInsightRefreshOption,
  type DashboardInsightRegenerationResult,
} from '@/data/mock-dashboard-ai-insights';
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
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
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
  activeTab: string;
  onTabChange: (tab: string) => void;
  dashboardId: number;
  sharedLinks: SharedUrlLink[];
  onSharedLinksChange: (links: SharedUrlLink[]) => void;
  insightRefreshFrequency: AiInsightRefreshFrequency;
  onInsightRefreshFrequencyChange: (frequency: AiInsightRefreshFrequency) => void;
  lastAiInsightsRefreshAt: string;
  failedInsightWidgetIds?: string[];
  onRegenerateInsights: () => DashboardInsightRegenerationResult;
  onRetryFailedInsights?: (widgetIds: string[]) => DashboardInsightRegenerationResult;
  savedFilters?: DashboardSavedFilter[];
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
  insightRefreshFrequency,
  onInsightRefreshFrequencyChange,
  lastAiInsightsRefreshAt,
}: {
  dashboardName: string;
  onNameChange: (name: string) => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  accessibilityShortcutsEnabled: boolean;
  onAccessibilityShortcutsChange: (enabled: boolean) => void;
  insightRefreshFrequency: AiInsightRefreshFrequency;
  onInsightRefreshFrequencyChange: (frequency: AiInsightRefreshFrequency) => void;
  lastAiInsightsRefreshAt: string;
}) {
  const { showToast } = useWuShowToast();
  const [name, setName] = useState(dashboardName);
  const [showAccessibilityShortcuts, setShowAccessibilityShortcuts] = useState(false);
  const selectedRefreshOption = getAiInsightRefreshOption(insightRefreshFrequency);
  const nextRefreshAt = getNextAiInsightRefreshAt(
    lastAiInsightsRefreshAt,
    insightRefreshFrequency
  );

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
      <section className={styles.refreshFrequencySection} aria-labelledby="ai-insight-refresh-title">
        <div className={styles.refreshFrequencyCopy}>
          <h3 id="ai-insight-refresh-title">AI insight refresh frequency</h3>
          <p>
            Automatically refresh AI-generated widget insights using the latest dashboard data.
            Previous AI runs and user-submitted insights remain available.
          </p>
          <span>
            Last dashboard run {formatAiInsightDateTime(lastAiInsightsRefreshAt)} · Next scheduled{' '}
            {formatAiInsightDateTime(nextRefreshAt)}
          </span>
        </div>
        <div className={styles.refreshFrequencySelect}>
          <WuSelect
            aria-label="AI insight refresh frequency"
            data={AI_INSIGHT_REFRESH_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedRefreshOption}
            onSelect={(option) => {
              const nextOption = option as AiInsightRefreshOption;
              onInsightRefreshFrequencyChange(nextOption.value);
              showToast({
                message: `AI insights will refresh ${nextOption.label.toLowerCase()}`,
                variant: 'success',
              });
            }}
            variant="outlined"
          />
        </div>
      </section>
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

function AiSettingsTab({
  insightRefreshFrequency,
  lastAiInsightsRefreshAt,
  regenerating,
  regenerationResult,
  onRetryFailedInsights,
}: {
  insightRefreshFrequency: AiInsightRefreshFrequency;
  lastAiInsightsRefreshAt: string;
  regenerating: boolean;
  regenerationResult: DashboardInsightRegenerationResult | null;
  onRetryFailedInsights: () => void;
}) {
  const refreshOption = getAiInsightRefreshOption(insightRefreshFrequency);
  const nextRefreshAt = getNextAiInsightRefreshAt(
    lastAiInsightsRefreshAt,
    insightRefreshFrequency
  );

  return (
    <div className={styles.aiSettingsPanel}>
      <section className={styles.aiRegenerateCard}>
        <div className={styles.aiRegenerateHeader}>
          <div>
            <h3>Regenerate insights</h3>
            <p>
              Refresh every AI-generated insight in this dashboard using the latest widget data.
              Each current AI insight and its engagement will move to Past runs. User-submitted
              insights remain unchanged.
            </p>
          </div>
          <span className={styles.preservationBadge}>Keeps past runs</span>
        </div>
        <dl className={styles.refreshMetadata}>
          <div>
            <dt>Automatic schedule</dt>
            <dd>{refreshOption.label}</dd>
          </div>
          <div>
            <dt>Last dashboard run</dt>
            <dd>{formatAiInsightDateTime(lastAiInsightsRefreshAt)}</dd>
          </div>
          <div>
            <dt>Next scheduled</dt>
            <dd>{formatAiInsightDateTime(nextRefreshAt)}</dd>
          </div>
        </dl>
      </section>
      {regenerating ? (
        <div className={styles.regeneratingNotice} role="status">
          <span className="wm-autorenew" aria-hidden="true" />
          Generating fresh insights. Existing insights remain visible until the refresh succeeds.
        </div>
      ) : null}
      {!regenerating && regenerationResult ? (
        <div
          className={
            regenerationResult.failedWidgetIds.length > 0
              ? styles.regenerationResultWarning
              : styles.regenerationResultSuccess
          }
          role="status"
        >
          <span
            className={
              regenerationResult.failedWidgetIds.length > 0
                ? 'wm-warning'
                : 'wm-check-circle'
            }
            aria-hidden="true"
          />
          <div>
            <strong>
              {regenerationResult.refreshedCount} of {regenerationResult.attemptedCount}{' '}
              {regenerationResult.attemptedCount === 1 ? 'insight' : 'insights'} refreshed
            </strong>
            <span>
              {regenerationResult.failedWidgetIds.length > 0
                ? `${regenerationResult.failedWidgetTitles.join(', ')} kept its previous AI insight and can be retried.`
                : 'The latest AI content is available. Previous AI runs and user insights remain available.'}
            </span>
          </div>
          {regenerationResult.failedWidgetIds.length > 0 ? (
            <button type="button" onClick={onRetryFailedInsights}>
              Retry failed
            </button>
          ) : null}
        </div>
      ) : null}
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
  activeTab,
  onTabChange,
  dashboardId,
  sharedLinks,
  onSharedLinksChange,
  insightRefreshFrequency,
  onInsightRefreshFrequencyChange,
  lastAiInsightsRefreshAt,
  failedInsightWidgetIds = [],
  onRegenerateInsights,
  onRetryFailedInsights,
  savedFilters = INITIAL_DASHBOARD_SAVED_FILTERS,
}: DashboardSettingsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
  const [regeneratingInsights, setRegeneratingInsights] = useState(false);
  const [regenerationResult, setRegenerationResult] =
    useState<DashboardInsightRegenerationResult | null>(null);
  const displayedRegenerationResult = useMemo(() => {
    if (!regenerationResult) return null;
    const unresolvedWidgetIds = new Set(failedInsightWidgetIds);
    const remainingFailedWidgetIds = regenerationResult.failedWidgetIds.filter((widgetId) =>
      unresolvedWidgetIds.has(widgetId)
    );
    if (remainingFailedWidgetIds.length === regenerationResult.failedWidgetIds.length) {
      return regenerationResult;
    }
    return {
      ...regenerationResult,
      refreshedCount:
        regenerationResult.attemptedCount - remainingFailedWidgetIds.length,
      failedWidgetIds: remainingFailedWidgetIds,
      failedWidgetTitles: regenerationResult.failedWidgetTitles.filter((_, index) =>
        remainingFailedWidgetIds.includes(regenerationResult.failedWidgetIds[index])
      ),
    };
  }, [failedInsightWidgetIds, regenerationResult]);
  const [accessibilityShortcutsEnabled, setAccessibilityShortcutsEnabled] = useState(true);
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
        onTabChange('general');
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, onTabChange]
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

  const handleRegenerateInsights = useCallback(() => {
    setRegeneratingInsights(true);
    window.setTimeout(() => {
      const result = onRegenerateInsights();
      setRegenerationResult(result);
      setRegeneratingInsights(false);
      showToast({
        message:
          result.failedWidgetIds.length > 0
            ? `${result.refreshedCount} insights refreshed. ${result.failedWidgetIds.length} ${result.failedWidgetIds.length === 1 ? 'insight kept its' : 'insights kept their'} previous content.`
            : 'AI insights regenerated. Previous AI insights moved to Past runs.',
        variant: result.failedWidgetIds.length > 0 ? 'error' : 'success',
      });
    }, 900);
  }, [onRegenerateInsights, showToast]);

  const handleRetryFailedInsights = useCallback(() => {
    if (!displayedRegenerationResult?.failedWidgetIds.length || !onRetryFailedInsights) return;
    setRegeneratingInsights(true);
    window.setTimeout(() => {
      const result = onRetryFailedInsights(displayedRegenerationResult.failedWidgetIds);
      setRegenerationResult(result);
      setRegeneratingInsights(false);
      showToast({
        message: 'The failed insight refreshed. Its previous AI insight moved to Past runs.',
        variant: 'success',
      });
    }, 700);
  }, [displayedRegenerationResult, onRetryFailedInsights, showToast]);

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
            insightRefreshFrequency={insightRefreshFrequency}
            onInsightRefreshFrequencyChange={onInsightRefreshFrequencyChange}
            lastAiInsightsRefreshAt={lastAiInsightsRefreshAt}
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
        Content: (
          <AiSettingsTab
            insightRefreshFrequency={insightRefreshFrequency}
            lastAiInsightsRefreshAt={lastAiInsightsRefreshAt}
            regenerating={regeneratingInsights}
            regenerationResult={displayedRegenerationResult}
            onRetryFailedInsights={handleRetryFailedInsights}
          />
        ),
      },
      {
        value: 'filters',
        Trigger: 'Filters',
        Content: <DashboardFiltersSettingsTab filters={savedFilters} />,
      },
      {
        value: 'shared-url',
        Trigger: 'Shared Links',
        Content: <DashboardSharedUrlTab dashboardId={dashboardId} dashboardName={dashboardName} links={sharedLinks} onLinksChange={onSharedLinksChange} />,
      },
    ],
    [
      accessibilityShortcutsEnabled,
      dashboardName,
      dashboardId,
      sharedLinks,
      onSharedLinksChange,
      designFontFamily,
      designFontSize,
      designFontStyle,
      designPalette,
      designSentiment,
      designTheme,
      handleDuplicate,
      insightRefreshFrequency,
      lastAiInsightsRefreshAt,
      displayedRegenerationResult,
      handleRetryFailedInsights,
      onNameChange,
      onInsightRefreshFrequencyChange,
      regeneratingInsights,
      updateDesignSelect,
      savedFilters,
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
          className={`${styles.modal} ${activeTab === 'shared-url' ? styles.sharedLinksModal : ''}`}
          variant="action"
          maxWidth={activeTab === 'shared-url' ? '1250px' : undefined}
          maxHeight={activeTab === 'shared-url' ? 'min(685px, calc(100dvh - 64px))' : 'min(90dvh, calc(100dvh - 2rem))'}
        >
          <WuModalHeader className={`${styles.header} ${styles.modalTitle}`}>
            Dashboard settings
          </WuModalHeader>

          <WuModalContent className={styles.content}>
            <div className={styles.tabRoot}>
              <WuTab
                items={tabs}
                value={activeTab}
                onValueChange={onTabChange}
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
          ) : activeTab === 'ai-settings' ? (
            <WuModalFooter className={styles.globalFooter}>
              <WuButton
                onClick={() => setRegenerateConfirmOpen(true)}
                disabled={regeneratingInsights}
              >
                {regeneratingInsights ? 'Regenerating…' : 'Regenerate insights'}
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
      <ConfirmModal
        open={regenerateConfirmOpen}
        onOpenChange={setRegenerateConfirmOpen}
        title="Regenerate dashboard insights"
        description="All AI-generated insights will be refreshed using the latest dashboard data. Each current AI insight, its comments, and its likes will move to Past runs. User-submitted insights remain unchanged, and failed widgets keep their current AI insight."
        confirmLabel="Regenerate insights"
        onConfirm={handleRegenerateInsights}
      />
    </>
  );
}
