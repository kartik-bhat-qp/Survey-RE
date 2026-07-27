'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { TextAiSegmentFilterForm } from '@/components/text-ai/TextAiSegmentFilterForm';
import {
  createDefaultSegmentFilterState,
  type TextAiSegmentFilterState,
} from '@/data/mock-text-ai-segment-filters';
import {
  TEXT_AI_PENDING_NEW_COMMENTS,
  TEXT_AI_SUBTHEME_FILTER_OPTIONS,
  TEXT_AI_THEME_STATUS_FILTER_OPTIONS,
  TEXT_AI_THEME_FILTER_OPTIONS,
  type TextAiFilterOption,
  type TextAiFilterSelectOption,
  type TextAiThemeStatusFilter,
} from '@/data/mock-text-ai-widget-data';
import type { TextAiDashboardQuestion } from '@/data/mock-text-ai-dashboards';
import modalStyles from '@/components/dashboards/CreateDashboardModal.module.css';
import createModalStyles from './CreateTextAiDashboardModal.module.css';
import styles from './TextAiDashboardToolbar.module.css';

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

interface TextAiDashboardToolbarProps {
  name: string;
  onNameChange: (name: string) => void;
  onAddWidget?: () => void;
  onOpenSettings?: () => void;
  onOpenThemeConfiguration?: () => void;
  questions: TextAiDashboardQuestion[];
  selectedQuestion: TextAiDashboardQuestion;
  onQuestionChange: (question: TextAiDashboardQuestion) => void;
  themeStatus: TextAiThemeStatusFilter;
  onThemeStatusChange: (status: TextAiThemeStatusFilter) => void;
  segmentFilters?: TextAiSegmentFilterState;
  onSegmentFiltersChange?: (filters: TextAiSegmentFilterState) => void;
}

export function TextAiDashboardToolbar({
  name,
  onNameChange,
  onAddWidget,
  onOpenSettings,
  onOpenThemeConfiguration,
  questions,
  selectedQuestion,
  onQuestionChange,
  themeStatus,
  onThemeStatusChange,
  segmentFilters,
  onSegmentFiltersChange,
}: TextAiDashboardToolbarProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [nameState, setNameState] = useState(name);
  const [theme, setTheme] = useState<TextAiFilterOption | null>(null);
  const [subtheme, setSubtheme] = useState<TextAiFilterOption | null>(null);
  const [newCommentsCount, setNewCommentsCount] = useState(TEXT_AI_PENDING_NEW_COMMENTS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [draftSegmentFilters, setDraftSegmentFilters] = useState<TextAiSegmentFilterState>(
    () => segmentFilters ?? createDefaultSegmentFilterState()
  );
  const selectedThemeStatus =
    TEXT_AI_THEME_STATUS_FILTER_OPTIONS.find(
      (option) => option.value === themeStatus
    ) ?? TEXT_AI_THEME_STATUS_FILTER_OPTIONS[0];

  function handleNameBlur(): void {
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
  }

  function handleSync(): void {
    if (isSyncing) return;
    setDraftSegmentFilters(segmentFilters ?? createDefaultSegmentFilterState());
    setProcessModalOpen(true);
  }

  function handleProcessConfirm(): void {
    if (isSyncing) return;
    onSegmentFiltersChange?.(draftSegmentFilters);
    setProcessModalOpen(false);
    setNewCommentsCount(0);
    setIsSyncing(true);
  }

  function isFilterOption(
    option: TextAiFilterSelectOption | TextAiFilterSelectOption[]
  ): option is TextAiFilterOption {
    return !Array.isArray(option) && 'value' in option;
  }

  if (!wick) {
    return (
      <header className={styles.header}>
        <StandardLoader className={styles.loader} message="Loading dashboard…" />
      </header>
    );
  }

  const {
    WuButton,
    WuCombobox,
    WuModal,
    WuModalHeader,
    WuModalContent,
    WuModalFooter,
    WuSelect,
    WuTooltip,
  } = wick;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.topRow}>
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
            <WuButton
              variant="iconOnly"
              size="sm"
              aria-label="Filter dashboard"
              onClick={() => showToast({ message: 'Filter', variant: 'success' })}
              Icon={<span className="wm-filter-alt" />}
            />
            <WuButton
              variant="iconOnly"
              size="sm"
              aria-label="Export CSV"
              onClick={() => showToast({ message: 'CSV export started', variant: 'success' })}
              Icon={<span className="wm-csv" />}
            />
            <WuButton
              variant="iconOnly"
              size="sm"
              aria-label="AI insights"
              onClick={() => showToast({ message: 'AI insights', variant: 'success' })}
              Icon={<span className="wc-ai" />}
            />
            <WuButton
              variant="iconOnly"
              size="sm"
              aria-label="Share dashboard"
              onClick={() => showToast({ message: 'Share dashboard', variant: 'success' })}
              Icon={<span className="wm-share" />}
            />
            <WuMenu
              open={settingsMenuOpen}
              onOpenChange={setSettingsMenuOpen}
              align="end"
              side="bottom"
              sideOffset={6}
              className={styles.settingsMenu}
              Trigger={
                <WuTooltip content="Dashboard settings" position="bottom">
                  <WuButton
                    variant="iconOnly"
                    size="sm"
                    aria-label="Dashboard settings menu"
                    aria-expanded={settingsMenuOpen}
                    Icon={<span className="wm-settings" />}
                  />
                </WuTooltip>
              }
            >
              <WuMenuItem
                className={styles.settingsMenuItem}
                Icon={<span className="wm-settings" aria-hidden />}
                onSelect={() => {
                  setSettingsMenuOpen(false);
                  onOpenSettings?.();
                }}
              >
                Settings
              </WuMenuItem>
              <WuMenuItem
                className={styles.settingsMenuItem}
                Icon={<span className="wm-table-edit" aria-hidden />}
                onSelect={() => {
                  setSettingsMenuOpen(false);
                  onOpenThemeConfiguration?.();
                }}
              >
                Theme configuration
              </WuMenuItem>
            </WuMenu>
            <WuButton
              className={styles.addWidgetBtn}
              onClick={onAddWidget}
              Icon={<span className="wm-add-2" />}
            >
              Add widget
            </WuButton>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filters}>
            <div className={styles.inlineFilter}>
              <span className={styles.filterLabel}>Question</span>
              <WuCombobox
                data={questions}
                accessorKey={{ value: 'id', label: 'text' }}
                value={selectedQuestion}
                onSelect={(option) => {
                  if (!option || Array.isArray(option)) return;
                  onQuestionChange(option as TextAiDashboardQuestion);
                  setTheme(null);
                  setSubtheme(null);
                }}
                variant="outlined"
                enableSearch
                isEllipse
                maxHeight={320}
                noDataContent="No questions found"
                className={`${styles.filterSelect} ${styles.questionSelect}`}
                aria-label="Question"
              />
            </div>
            <div className={styles.inlineFilter}>
              <span className={styles.filterLabel}>Themes</span>
              <WuSelect<TextAiFilterSelectOption>
                data={TEXT_AI_THEME_FILTER_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={theme}
                placeholder="Select themes"
                onSelect={(option) => {
                  if (!isFilterOption(option)) return;
                  setTheme(option);
                }}
                variant="outlined"
                className={styles.filterSelect}
                aria-label="Themes"
              />
            </div>
            <div className={styles.inlineFilter}>
              <span className={styles.filterLabel}>Sub-themes</span>
              <WuSelect<TextAiFilterSelectOption>
                data={TEXT_AI_SUBTHEME_FILTER_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={subtheme}
                placeholder="Select sub-themes"
                onSelect={(option) => {
                  if (!isFilterOption(option)) return;
                  setSubtheme(option);
                }}
                variant="outlined"
                className={styles.filterSelect}
                aria-label="Sub-themes"
              />
            </div>
            <div className={styles.inlineFilter}>
              <span className={styles.filterLabel}>Theme status</span>
              <WuSelect<TextAiFilterOption>
                data={TEXT_AI_THEME_STATUS_FILTER_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedThemeStatus}
                onSelect={(option) => {
                  if (!option || Array.isArray(option)) return;
                  onThemeStatusChange(option.value as TextAiThemeStatusFilter);
                }}
                variant="outlined"
                className={`${styles.filterSelect} ${styles.statusSelect}`}
                aria-label="Theme status"
              />
            </div>
          </div>

          {newCommentsCount > 0 || isSyncing ? (
            <div
              className={styles.newCommentsBanner}
              role="status"
              aria-busy={isSyncing}
              aria-live="polite"
            >
              {!isSyncing ? (
                <>
                  <span className={`wm-error-outline ${styles.newCommentsIcon}`} aria-hidden />
                  <span className={styles.newCommentsText}>{newCommentsCount} new comments</span>
                </>
              ) : (
                <span className={styles.newCommentsText}>Process in progress</span>
              )}
              <WuButton
                variant="secondary"
                size="sm"
                className={styles.syncBtn}
                disabled={isSyncing}
                onClick={handleSync}
                Icon={
                  <span
                    className={`wm-sync ${isSyncing ? styles.syncIconSpinning : ''}`}
                    aria-hidden
                  />
                }
              >
                Process now
              </WuButton>
            </div>
          ) : null}
        </div>
      </header>

      <WuModal
        open={processModalOpen}
        onOpenChange={setProcessModalOpen}
        className={modalStyles.modalWide}
        variant="action"
      >
        <WuModalHeader className={modalStyles.modalTitle}>
          Filter responses to process
        </WuModalHeader>
        <WuModalContent className={createModalStyles.segmentFilterContent}>
          <TextAiSegmentFilterForm
            values={draftSegmentFilters}
            onChange={setDraftSegmentFilters}
          />
        </WuModalContent>
        <WuModalFooter>
          <div className={styles.processModalFooter}>
            <WuButton
              variant="secondary"
              onClick={() => setProcessModalOpen(false)}
              className={styles.processCancelBtn}
            >
              Cancel
            </WuButton>
            <WuButton
              onClick={handleProcessConfirm}
              Icon={<span className="wm-sync" aria-hidden />}
            >
              Process responses
            </WuButton>
          </div>
        </WuModalFooter>
      </WuModal>
    </>
  );
}
