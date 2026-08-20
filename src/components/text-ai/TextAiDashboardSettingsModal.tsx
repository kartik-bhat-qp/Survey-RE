'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { TextAiDashboard } from '@/data/mock-text-ai-dashboards';
import {
  getTextAiDashboardCreationPreferences,
} from '@/data/text-ai-activity-logs';
import {
  getTextAiThemePreferences,
  saveTextAiThemePreferences,
  TEXT_AI_EMERGING_VALIDITY_OPTIONS,
  TEXT_AI_THEME_PREFERENCES_EVENT,
  type TextAiEmergingValidityOption,
  type TextAiThemePreferences,
} from '@/data/text-ai-theme-preferences';
import styles from './TextAiDashboardSettingsModal.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuToggle })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuSelect })),
  { ssr: false }
);

type SettingsTab = 'preferences' | 'data-slicers' | 'filters' | 'logs';

interface TextAiDataSlicer {
  id: number;
  name: string;
  description: string;
  applyToDashboard: boolean;
}

interface TextAiDashboardSettingsModalProps {
  dashboard: TextAiDashboard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INITIAL_DATA_SLICERS: TextAiDataSlicer[] = [
  {
    id: 1,
    name: 'Test slicer 1',
    description: 'Includes responses matching the first test audience segment.',
    applyToDashboard: true,
  },
  {
    id: 2,
    name: 'Test slicer 2',
    description: 'Includes responses matching the second test audience segment.',
    applyToDashboard: true,
  },
];

export function TextAiDashboardSettingsModal({
  dashboard,
  open,
  onOpenChange,
}: TextAiDashboardSettingsModalProps) {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('preferences');
  const [search, setSearch] = useState('');
  const [expandedSlicerId, setExpandedSlicerId] = useState<number | null>(null);
  const [slicers, setSlicers] = useState<TextAiDataSlicer[]>(INITIAL_DATA_SLICERS);
  const [themePreferences, setThemePreferences] = useState<TextAiThemePreferences>(() =>
    getTextAiThemePreferences(dashboard.id)
  );
  const creationPreferences = useMemo(
    () => getTextAiDashboardCreationPreferences(dashboard),
    [dashboard]
  );

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onOpenChange(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dashboard.id, onOpenChange, open]);

  useEffect(() => {
    if (!open) return;

    const refreshPreferences = () =>
      setThemePreferences(getTextAiThemePreferences(dashboard.id));

    refreshPreferences();
    window.addEventListener(TEXT_AI_THEME_PREFERENCES_EVENT, refreshPreferences);
    window.addEventListener('storage', refreshPreferences);

    return () => {
      window.removeEventListener(TEXT_AI_THEME_PREFERENCES_EVENT, refreshPreferences);
      window.removeEventListener('storage', refreshPreferences);
    };
  }, [dashboard.id, open]);

  const filteredSlicers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return slicers;
    return slicers.filter((slicer) => slicer.name.toLowerCase().includes(term));
  }, [search, slicers]);

  if (!open) return null;

  const visibleCount = filteredSlicers.length;

  function setShowThemesWithNoResponses(checked: boolean): void {
    const nextPreferences = {
      ...themePreferences,
      showThemesWithNoResponses: checked,
    };
    setThemePreferences(nextPreferences);
    saveTextAiThemePreferences(dashboard.id, nextPreferences);
  }

  function setAutoApproveEmergingThemes(checked: boolean): void {
    const nextPreferences = {
      ...themePreferences,
      approvedEmergingNames: checked
        ? themePreferences.approvedEmergingNames
        : [],
      autoApproveEmergingThemes: checked,
    };
    setThemePreferences(nextPreferences);
    saveTextAiThemePreferences(dashboard.id, nextPreferences);
  }

  function setEmergingThemeValidity(
    option: TextAiEmergingValidityOption
  ): void {
    const nextPreferences = {
      ...themePreferences,
      emergingThemeValidityDays: option.value,
    };
    setThemePreferences(nextPreferences);
    saveTextAiThemePreferences(dashboard.id, nextPreferences);
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false);
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-ai-settings-title"
      >
        <header className={styles.header}>
          <h2 id="text-ai-settings-title">Settings</h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close settings"
            onClick={() => onOpenChange(false)}
          >
            <span className="wm-close" aria-hidden />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.tabs} role="tablist" aria-label="TextAI settings">
            <button
              type="button"
              id="preferences-tab"
              role="tab"
              aria-selected={activeTab === 'preferences'}
              aria-controls="preferences-panel"
              className={activeTab === 'preferences' ? styles.activeTab : undefined}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
            <button
              type="button"
              id="data-slicers-tab"
              role="tab"
              aria-selected={activeTab === 'data-slicers'}
              aria-controls="data-slicers-panel"
              className={activeTab === 'data-slicers' ? styles.activeTab : undefined}
              onClick={() => setActiveTab('data-slicers')}
            >
              Data slicers
            </button>
            <button
              type="button"
              id="filters-tab"
              role="tab"
              aria-selected={activeTab === 'filters'}
              aria-controls="filters-panel"
              className={activeTab === 'filters' ? styles.activeTab : undefined}
              onClick={() => setActiveTab('filters')}
            >
              Filters
            </button>
            <button
              type="button"
              id="logs-tab"
              role="tab"
              aria-selected={activeTab === 'logs'}
              aria-controls="logs-panel"
              className={activeTab === 'logs' ? styles.activeTab : undefined}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
          </div>

          {activeTab === 'preferences' ? (
            <div
              id="preferences-panel"
              role="tabpanel"
              aria-labelledby="preferences-tab"
              className={`${styles.tabPanel} ${styles.preferencesPanel}`}
            >
              <label className={styles.preferenceRow}>
                <span>
                  <strong>Show themes with no responses</strong>
                  <small>
                    Include themes and sub-themes that do not have tagged responses.
                  </small>
                </span>
                <WuToggle
                  checked={themePreferences.showThemesWithNoResponses}
                  onChange={setShowThemesWithNoResponses}
                  aria-label="Show themes with no responses"
                />
              </label>
              <label className={styles.preferenceRow}>
                <span>
                  <strong>Auto approve emerging themes</strong>
                  <small>
                    Show new emerging themes and sub-themes on the dashboard
                    without manual approval.
                  </small>
                </span>
                <WuToggle
                  checked={themePreferences.autoApproveEmergingThemes}
                  onChange={setAutoApproveEmergingThemes}
                  aria-label="Auto approve emerging themes"
                />
              </label>
              <div className={styles.preferenceRow}>
                <span>
                  <strong>Emerging theme validity</strong>
                  <small>
                    Choose how long a new theme or sub-theme remains Emerging
                    before it becomes Established.
                  </small>
                </span>
                <WuSelect
                  data={TEXT_AI_EMERGING_VALIDITY_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={
                    TEXT_AI_EMERGING_VALIDITY_OPTIONS.find(
                      (option) =>
                        option.value ===
                        themePreferences.emergingThemeValidityDays
                    ) ?? TEXT_AI_EMERGING_VALIDITY_OPTIONS[2]
                  }
                  onSelect={(option) => {
                    if (!option || Array.isArray(option)) return;
                    setEmergingThemeValidity(
                      option as TextAiEmergingValidityOption
                    );
                  }}
                  variant="outlined"
                  className={styles.validitySelect}
                  aria-label="Emerging theme validity"
                />
              </div>
            </div>
          ) : activeTab === 'data-slicers' ? (
            <div
              id="data-slicers-panel"
              role="tabpanel"
              aria-labelledby="data-slicers-tab"
              className={styles.tabPanel}
            >
              <div className={styles.searchRow}>
                <label className={styles.searchField}>
                  <span className="wm-search" aria-hidden />
                  <span className={styles.srOnly}>Search by data slicer name</span>
                  <input
                    type="search"
                    value={search}
                    placeholder="Search by data slicer name"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <span className={styles.resultCount}>
                  {visibleCount > 0 ? `1 - ${visibleCount}` : '0'} of {visibleCount}
                  <span className="wm-arrow-drop-down" aria-hidden />
                </span>
              </div>

              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    const nextNumber = slicers.length + 1;
                    setSlicers((current) => [
                      ...current,
                      {
                        id: Date.now(),
                        name: `Test slicer ${nextNumber}`,
                        description: `Includes responses matching test audience segment ${nextNumber}.`,
                        applyToDashboard: false,
                      },
                    ]);
                    showToast({
                      message: `Test slicer ${nextNumber} created`,
                      variant: 'success',
                    });
                  }}
                >
                  Create data slicer
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() =>
                    showToast({ message: 'Manage data slicer', variant: 'success' })
                  }
                >
                  Manage data slicer
                </button>
              </div>

              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Slicer name</th>
                      <th>Details</th>
                      <th>Apply to dashboard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSlicers.map((slicer) => {
                      const isExpanded = expandedSlicerId === slicer.id;
                      return (
                        <tr key={slicer.id}>
                          <td>{slicer.name}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.detailsButton}
                              aria-expanded={isExpanded}
                              onClick={() =>
                                setExpandedSlicerId((current) =>
                                  current === slicer.id ? null : slicer.id
                                )
                              }
                            >
                              Show details
                              <span
                                className={
                                  isExpanded ? 'wm-arrow-drop-up' : 'wm-arrow-drop-down'
                                }
                                aria-hidden
                              />
                            </button>
                            {isExpanded ? (
                              <p className={styles.detailsText}>{slicer.description}</p>
                            ) : null}
                          </td>
                          <td>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={slicer.applyToDashboard}
                                aria-label={`Apply ${slicer.name} to dashboard`}
                                onChange={(event) => {
                                  const checked = event.target.checked;
                                  setSlicers((current) =>
                                    current.map((item) =>
                                      item.id === slicer.id
                                        ? { ...item, applyToDashboard: checked }
                                        : item
                                    )
                                  );
                                }}
                              />
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSlicers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className={styles.noResults}>
                          No data slicers match your search.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'filters' ? (
            <div
              id="filters-panel"
              role="tabpanel"
              aria-labelledby="filters-tab"
              className={`${styles.tabPanel} ${styles.filtersPanel}`}
            >
              <span className={`wm-filter-list ${styles.emptyIcon}`} aria-hidden />
              <h3>No dashboard filters configured</h3>
              <p>Filters applied to this TextAI dashboard will appear here.</p>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() =>
                  showToast({ message: 'Create dashboard filter', variant: 'success' })
                }
              >
                Create filter
              </button>
            </div>
          ) : (
            <div
              id="logs-panel"
              role="tabpanel"
              aria-labelledby="logs-tab"
              className={`${styles.tabPanel} ${styles.logsPanel}`}
            >
              <div className={styles.logContent}>
                <article className={styles.creationLog}>
                    <header className={styles.logHeader}>
                      <span className={`wm-dashboard ${styles.logHeaderIcon}`} aria-hidden />
                      <span>
                        <strong>Dashboard created</strong>
                        <small>
                          {new Intl.DateTimeFormat('en', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(dashboard.creationDate))}
                          {' · '}Kartik Bhat
                        </small>
                      </span>
                    </header>

                    <dl className={styles.preferenceGrid}>
                      <div>
                        <dt>Data source</dt>
                        <dd>
                          <strong>{creationPreferences.dataSourceType}</strong>
                          <span>{creationPreferences.dataSourceName}</span>
                        </dd>
                      </div>
                      <div>
                        <dt>Output language</dt>
                        <dd>
                          <strong>{creationPreferences.outputLanguage}</strong>
                        </dd>
                      </div>
                      <div>
                        <dt>Codebook preference</dt>
                        <dd>
                          <strong>{creationPreferences.codebookPreference}</strong>
                          {creationPreferences.codebookFileDataUrl &&
                          creationPreferences.codebookFileName ? (
                            <a
                              className={styles.codebookDownload}
                              href={creationPreferences.codebookFileDataUrl}
                              download={creationPreferences.codebookFileName}
                            >
                              <span className="wm-download" aria-hidden />
                              Download {creationPreferences.codebookFileName}
                            </a>
                          ) : null}
                        </dd>
                      </div>
                      <div>
                        <dt>Coding preference</dt>
                        <dd>
                          <strong>Coded separately</strong>
                        </dd>
                      </div>
                      <div className={styles.promptPreference}>
                        <dt>Theme modeling prompt</dt>
                        <dd>{creationPreferences.themeModelingPrompt}</dd>
                      </div>
                    </dl>

                    <section className={styles.questionLogSection}>
                      <header>
                        <h3>Questions selected</h3>
                        <span>{creationPreferences.questions.length}</span>
                      </header>
                      <div className={styles.questionLogList}>
                        {creationPreferences.questions.map((question) => (
                          <article
                            className={styles.questionLogItem}
                            key={`${question.code}-${question.text}`}
                          >
                            <span className={styles.questionCode}>{question.code}</span>
                            <span className={styles.questionDetails}>
                              <strong>{question.text}</strong>
                              <span>
                                <b>Context:</b>{' '}
                                {question.context || 'Not provided'}
                              </span>
                            </span>
                          </article>
                        ))}
                      </div>
                    </section>
                </article>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
