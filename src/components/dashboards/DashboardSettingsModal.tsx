'use client';

import type { DataSlicer } from '@/data/mock-data-slicers';

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { DashboardDataSlicersTab } from '@/components/dashboards/DashboardDataSlicersTab';
import { DashboardSharedUrlTab } from '@/components/dashboards/DashboardSharedUrlTab';
import type { ReportingYearSettingsProps } from './ReportingYearSettings';
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
import { DEFAULT_DASHBOARD_DESIGN, normalizeDashboardDesign, type DashboardDesign, type DesignColorSettings } from '@/data/dashboard-design';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { SharedUrlLink } from '@/data/mock-shared-urls';
import {
  AI_INSIGHT_REFRESH_OPTIONS,
  getAiInsightRefreshOption,
  type AiInsightRefreshFrequency,
  type AiInsightRefreshOption,
  type DashboardInsightRegenerationResult,
} from '@/data/mock-dashboard-ai-insights';
import styles from './DashboardSettingsModal.module.css';

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
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
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

// Compact forms use less space; tables and design previews keep room to expand.
const SETTINGS_TAB_WIDTHS: Record<string, string> = {
  general: '680px',
  'global-settings': '680px',
  'data-slicers': '1000px',
  design: '1100px',
  weightings: '680px',
  'ai-settings': '900px',
  filters: '800px',
  'shared-url': '1250px',
};

interface DashboardSettingsModalProps extends ReportingYearSettingsProps {
  dataSlicers?:DataSlicer[];
  onDataSlicersChange?:(slices:DataSlicer[])=>void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardName: string;
  onNameChange: (name: string) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  appliedDesign?: DashboardDesign;
  onDesignChange?: (design: DashboardDesign) => void;
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
  children,
  accessibilityShortcutsEnabled,
  onAccessibilityShortcutsChange,
}: {
  children: ReactNode;
  accessibilityShortcutsEnabled: boolean;
  onAccessibilityShortcutsChange: (enabled: boolean) => void;
}) {
  const shortcutsHelpId = useId();

  return (
    <div className={styles.generalPanel}>
      <div className={styles.generalGrid}>
        <div className={styles.generalPrimary}>{children}</div>
        <div className={styles.generalSecondary}>
      <div className={styles.accessibilityRow}>
        <div className={styles.settingLabelRow}><span className={styles.accessibilityLabel}>Accessibility shortcuts</span>
          <span className={styles.generalHelp} tabIndex={0} aria-label="About accessibility shortcuts" aria-describedby={shortcutsHelpId}>
            <span className="wm-info" aria-hidden />
            <span id={shortcutsHelpId} role="tooltip" className={styles.generalHelpTooltip}>Increase dashboard font size: Alt + Shift + Up. Decrease: Alt + Shift + Down.</span>
          </span>
        </div>
        <div className={styles.accessibilityControls}>
          <WuToggle
            checked={accessibilityShortcutsEnabled}
            onChange={onAccessibilityShortcutsChange}
            aria-label="Enable accessibility shortcuts"
          />

        </div>
      </div>

        </div>
      </div>
    </div>
  );
}

function AiSettingsTab({
  insightRefreshFrequency,
  onInsightRefreshFrequencyChange,
  regenerating,
  regenerationResult,
  onRetryFailedInsights,
}: {
  insightRefreshFrequency: AiInsightRefreshFrequency;
  onInsightRefreshFrequencyChange: (frequency: AiInsightRefreshFrequency) => void;
  regenerating: boolean;
  regenerationResult: DashboardInsightRegenerationResult | null;
  onRetryFailedInsights: () => void;
}) {
  const { showToast } = useWuShowToast();
  const refreshOption = getAiInsightRefreshOption(insightRefreshFrequency);

  return (
    <div className={styles.aiSettingsPanel}>
      <div className={styles.generalPanel}><div className={styles.generalSecondary}>
      <section className={styles.refreshFrequencySection} aria-labelledby="ai-insight-refresh-title">
        <div className={styles.refreshFrequencyCopy}>
          <h3 id="ai-insight-refresh-title">AI insight frequency</h3>
          <p className={styles.settingDescription}>Choose how often insights refresh; previous runs stay available.</p>
        </div>
        <div className={styles.refreshFrequencyControls}>
        <div className={styles.refreshFrequencySelect}>
          <WuSelect
            aria-label="AI insight refresh frequency"
            data={AI_INSIGHT_REFRESH_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={refreshOption}
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

        </div>
      </section>
      </div></div>

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
  reportingYearSetting, onReportingYearChange,
  dataSlicers, onDataSlicersChange,
  open,
  onOpenChange,
  dashboardName,
  appliedDesign,
  onDesignChange,
  appliedDesignTypography = DEFAULT_DESIGN_TYPOGRAPHY,
  onDesignTypographyChange,
  activeTab,
  onTabChange,
  dashboardId,
  sharedLinks,
  onSharedLinksChange,
  insightRefreshFrequency,
  onInsightRefreshFrequencyChange,
  failedInsightWidgetIds = [],
  onRegenerateInsights,
  onRetryFailedInsights,
  savedFilters = INITIAL_DASHBOARD_SAVED_FILTERS,
}: DashboardSettingsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
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
  const [designColors, setDesignColors] = useState<DesignColorSettings>(appliedDesign ?? DEFAULT_DASHBOARD_DESIGN);
  useEffect(() => {
    if (!open || !appliedDesign) return;
    queueMicrotask(() => {
      setDesignTheme(DESIGN_THEME_OPTIONS.find(option => option.value === appliedDesign.theme) ?? DESIGN_THEME_OPTIONS[0]);
      setDesignPalette(DESIGN_PALETTE_OPTIONS.find(option => option.value === appliedDesign.palette) ?? DESIGN_PALETTE_OPTIONS[0]);
      setDesignSentiment(DESIGN_SENTIMENT_OPTIONS.find(option => option.value === appliedDesign.sentiment) ?? DESIGN_SENTIMENT_OPTIONS[0]);
      setDesignColors(appliedDesign);
      setDesignFontSize(appliedDesign.typography.fontSize);
      setDesignFontStyle(appliedDesign.typography.fontStyle);
      setDesignFontFamily(appliedDesign.typography.fontFamily);
      setHasUnsavedDesignChanges(false);
    });
  }, [open, appliedDesign]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onTabChange('general');
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, onTabChange]
  );

  const handleApplyGlobalSettings = useCallback(() => {
    showToast({
      message: 'Settings applied to existing widgets',
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
    onDesignChange?.(normalizeDashboardDesign({ ...designColors, theme: designTheme.value, palette: designPalette.value, sentiment: designSentiment.value, typography: { fontSize: designFontSize, fontStyle: designFontStyle, fontFamily: designFontFamily } }));
    if (!onDesignChange) onDesignTypographyChange?.({
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
    designColors, designTheme, designPalette, designSentiment, onDesignChange,
    designFontFamily,
    designFontSize,
    designFontStyle,
    handleOpenChange,
    onDesignTypographyChange,
    showToast,
  ]);

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
          <div className={styles.mergedGeneral}>
          <GeneralTab
            accessibilityShortcutsEnabled={accessibilityShortcutsEnabled}
            onAccessibilityShortcutsChange={setAccessibilityShortcutsEnabled}
          >
            <DashboardGlobalSettingsTab reportingYearSetting={reportingYearSetting} onReportingYearChange={onReportingYearChange} />
          </GeneralTab>
          </div>
        ),
      },
      {
        value: 'data-slicers',
        Trigger: 'Data slicers',
        Content: <DashboardDataSlicersTab dataSlicers={dataSlicers} onDataSlicersChange={onDataSlicersChange} />,
      },
      {
        value: 'design',
        Trigger: 'Design',
        Content: (
          <DashboardDesignSettingsTab
            colorSettings={designColors}
            onColorSettingsChange={colors => { setDesignColors(colors); setHasUnsavedDesignChanges(true); }}
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
            onInsightRefreshFrequencyChange={onInsightRefreshFrequencyChange}
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
      designColors,
      designFontFamily,
      designFontSize,
      designFontStyle,
      designPalette,
      designSentiment,
      designTheme,
      insightRefreshFrequency,
          displayedRegenerationResult,
      handleRetryFailedInsights,
          onInsightRefreshFrequencyChange,
      regeneratingInsights,
      updateDesignSelect,
      savedFilters, dataSlicers, onDataSlicersChange, reportingYearSetting, onReportingYearChange,
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
          maxWidth={SETTINGS_TAB_WIDTHS[activeTab] ?? '1000px'}
          maxHeight={activeTab === 'shared-url' ? 'min(685px, calc(100dvh - 64px))' : 'min(90dvh, calc(100dvh - 2rem))'}
        >
          <WuModalHeader className={`${styles.header} ${styles.modalTitle}`}>
            Dashboard settings
          </WuModalHeader>

          <WuModalContent className={styles.content}>
            <div className={styles.tabRoot}>
              <WuTab
                items={tabs}
                value={activeTab === 'global-settings' ? 'general' : activeTab}
                onValueChange={onTabChange}
              />
            </div>
          </WuModalContent>

          {(activeTab === 'general' || activeTab === 'global-settings') ? (
            <WuModalFooter className={styles.globalFooter}>
              <WuButton onClick={handleApplyGlobalSettings}>
                Save
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
                {regeneratingInsights ? 'Regenerating…' : 'Regenerate'}
              </WuButton>
            </WuModalFooter>
          ) : null}
        </WuModal>
      ) : null}

      {regenerateConfirmOpen ? <WuModal
        open
        onOpenChange={setRegenerateConfirmOpen}
        variant="action"
        maxWidth="600px"
        aria-label="Regenerate insights"
        className={styles.regenerateConfirm}
      >
        <WuModalHeader>Regenerate insights</WuModalHeader>
        <WuModalContent className={styles.regenerateConfirmContent}>
          <p>Are you sure you want to regenerate insights?</p>
          <p>Existing AI insights, comments, and likes will remain available under Past runs in each widget.</p>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setRegenerateConfirmOpen(false)}>Cancel</WuButton>
          <WuButton onClick={() => { setRegenerateConfirmOpen(false); handleRegenerateInsights(); }}>Regenerate</WuButton>
        </WuModalFooter>
      </WuModal> : null}

    </>
  );
}
