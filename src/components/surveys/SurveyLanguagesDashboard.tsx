'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AddLanguageVersionDropdown } from '@/components/surveys/AddLanguageVersionDropdown';
import {
  createSurveyLanguageFromOption,
  getDefaultSurveyLanguages,
  getSurveyLanguageDisplayName,
  getSurveyLanguageStatusLabel,
  LANGUAGE_VERSIONS_HELP,
  SCREENER_QUESTION_LABEL,
  SURVEY_LANGUAGES_SIDEBAR_ITEMS,
  type AddableSurveyLanguage,
  type SurveyLanguageVersion,
  type SurveyLanguagesSidebarTab,
} from '@/data/mock-survey-languages';
import styles from './SurveyLanguagesDashboard.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface SurveyLanguagesDashboardProps {
  surveyId: number;
}

const SCREENER_OPTIONS = [{ value: 'preferred-language', label: SCREENER_QUESTION_LABEL }];

export function SurveyLanguagesDashboard({ surveyId: _surveyId }: SurveyLanguagesDashboardProps) {
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<SurveyLanguagesSidebarTab>('languages');
  const [languages, setLanguages] = useState<SurveyLanguageVersion[]>(() =>
    getDefaultSurveyLanguages()
  );
  const [changeLanguageWithinSurvey, setChangeLanguageWithinSurvey] = useState(false);
  const [screenerQuestion, setScreenerQuestion] = useState(SCREENER_OPTIONS[0]);
  const [deleteTarget, setDeleteTarget] = useState<SurveyLanguageVersion | null>(null);

  const hasAdditionalLanguages = languages.some((language) => !language.isDefault);

  const sidebarItems = useMemo(
    () =>
      SURVEY_LANGUAGES_SIDEBAR_ITEMS.filter(
        (item) => item.id === 'languages' || hasAdditionalLanguages
      ),
    [hasAdditionalLanguages]
  );

  const selectedLanguageIds = useMemo(
    () => languages.map((language) => language.id),
    [languages]
  );

  function handleAddLanguages(options: AddableSurveyLanguage[]): void {
    if (options.length === 0) return;

    const existingIds = new Set(languages.map((language) => language.id));
    const toAdd = options
      .filter((option) => option.id !== 'en' && !existingIds.has(option.id))
      .map(createSurveyLanguageFromOption);

    if (toAdd.length === 0) return;

    setLanguages((prev) => [...prev, ...toAdd]);
    showToast({
      message: `${toAdd.length} language${toAdd.length === 1 ? '' : 's'} added`,
      variant: 'success',
    });
  }

  function handleToggleEnabled(languageId: string, enabled: boolean): void {
    setLanguages((prev) =>
      prev.map((language) =>
        language.id === languageId ? { ...language, enabled } : language
      )
    );
  }

  function handleAction(action: string, language: SurveyLanguageVersion): void {
    showToast({
      message: `${action} — ${getSurveyLanguageDisplayName(language)}`,
      variant: 'success',
    });
  }

  function handleConfirmDelete(): void {
    if (!deleteTarget) return;
    const removed = deleteTarget;
    const nextLanguages = languages.filter((language) => language.id !== removed.id);
    setLanguages(nextLanguages);
    if (!nextLanguages.some((language) => !language.isDefault) && activeTab !== 'languages') {
      setActiveTab('languages');
    }
    setDeleteTarget(null);
    showToast({
      message: `${getSurveyLanguageDisplayName(removed)} removed`,
      variant: 'success',
    });
  }

  function renderPlaceholder(title: string): React.ReactNode {
    return (
      <div className={styles.placeholder}>
        <p className={styles.placeholderTitle}>{title}</p>
        <p className={styles.placeholderCopy}>
          This area is not configured in this prototype yet.
        </p>
        <WuButton
          variant="secondary"
          onClick={() => setActiveTab('languages')}
        >
          Back to Languages
        </WuButton>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="Languages navigation">
        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                activeTab === item.id ? styles.sidebarItemActive : styles.sidebarItem
              }
              onClick={() => {
                if (item.id === 'languages') {
                  setActiveTab(item.id);
                  return;
                }
                showToast({
                  message: `${item.label} is not available in this prototype`,
                  variant: 'info',
                });
                setActiveTab(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className={styles.content}>
        {activeTab !== 'languages' ? (
          <div className={styles.panel}>
            {renderPlaceholder(
              sidebarItems.find((item) => item.id === activeTab)?.label ?? 'Languages'
            )}
          </div>
        ) : (
          <div className={styles.panel}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <AddLanguageVersionDropdown
                  addedIds={selectedLanguageIds}
                  onSave={handleAddLanguages}
                />
              </div>

              {hasAdditionalLanguages ? (
                <div className={styles.toolbarRight}>
                  <label className={styles.screenerField}>
                    <span className={styles.screenerLabel}>Screener Question :</span>
                    <div className={styles.screenerSelect}>
                      <WuSelect
                        data={SCREENER_OPTIONS}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={screenerQuestion}
                        onSelect={(item) =>
                          setScreenerQuestion(
                            item as { value: string; label: string }
                          )
                        }
                        variant="outlined"
                      />
                    </div>
                  </label>
                  <div className={styles.changeLanguageToggle}>
                    <WuToggle
                      Label="Change language within survey"
                      labelPosition="right"
                      checked={changeLanguageWithinSurvey}
                      onChange={setChangeLanguageWithinSurvey}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col" className={styles.colLanguage}>
                      <span className={styles.headerWithHelp}>
                        Language Versions
                        <WuTooltip content={LANGUAGE_VERSIONS_HELP} position="top">
                          <button
                            type="button"
                            className={styles.helpBtn}
                            aria-label={LANGUAGE_VERSIONS_HELP}
                          >
                            <span className="wm-help-outline" aria-hidden />
                          </button>
                        </WuTooltip>
                      </span>
                    </th>
                    <th scope="col" className={styles.colStatus}>
                      Translation Status
                    </th>
                    <th scope="col" className={styles.colActions}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {languages.map((language) => (
                    <tr key={language.id}>
                      <td className={styles.colLanguage}>
                        {language.isDefault ? (
                          <button
                            type="button"
                            className={styles.languageTrigger}
                            onClick={() =>
                              showToast({
                                message: `${language.name} language options`,
                                variant: 'info',
                              })
                            }
                          >
                            <span>{getSurveyLanguageDisplayName(language)}</span>
                            <span
                              className={`wm-arrow-drop-down ${styles.languageCaret}`}
                              aria-hidden
                            />
                          </button>
                        ) : (
                          <div className={styles.addedLanguageCell}>
                            <span className={styles.addedLanguageName}>
                              {getSurveyLanguageDisplayName(language)}
                            </span>
                            <div className={styles.inlineToggle}>
                              <WuToggle
                                Label={`Enable ${getSurveyLanguageDisplayName(language)}`}
                                labelPosition="right"
                                checked={language.enabled}
                                onChange={(enabled) =>
                                  handleToggleEnabled(language.id, enabled)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className={styles.colStatus}>
                        {language.isDefault ? (
                          getSurveyLanguageStatusLabel(language.status)
                        ) : (
                          <div className={styles.statusRow}>
                            <div className={styles.progressBlock}>
                              <div
                                className={styles.progressTrack}
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={language.progressPercent}
                                aria-label={`${language.progressPercent}% translated`}
                              >
                                <div
                                  className={styles.progressFill}
                                  style={{ width: `${language.progressPercent}%` }}
                                />
                              </div>
                              <span className={styles.progressLabel}>
                                {language.progressPercent}%
                              </span>
                            </div>
                            <button
                              type="button"
                              className={styles.textAction}
                              onClick={() => handleAction('Get Quote', language)}
                            >
                              $ Get Quote
                            </button>
                            <button
                              type="button"
                              className={styles.autoTranslateBtn}
                              onClick={() => handleAction('Auto Translate', language)}
                            >
                              <span className="wm-translate" aria-hidden />
                              Auto Translate
                            </button>
                          </div>
                        )}
                      </td>
                      <td className={styles.colActions}>
                        {language.isDefault ? (
                          <div className={styles.actions}>
                            <WuTooltip content="Preview" position="top">
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={`Preview ${language.name}`}
                                onClick={() => handleAction('Preview', language)}
                              >
                                <span className="wm-visibility" aria-hidden />
                              </button>
                            </WuTooltip>
                            <WuTooltip content="Copy URL" position="top">
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={`Copy URL for ${language.name}`}
                                onClick={() => handleAction('Copy URL', language)}
                              >
                                <span className="wm-link" aria-hidden />
                              </button>
                            </WuTooltip>
                            <WuTooltip content="Print" position="top">
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={`Print ${language.name}`}
                                onClick={() => handleAction('Print', language)}
                              >
                                <span className="wm-print" aria-hidden />
                              </button>
                            </WuTooltip>
                            <WuTooltip content="Download DOC" position="top">
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={`Download DOC for ${language.name}`}
                                onClick={() => handleAction('Download DOC', language)}
                              >
                                <span className={styles.docLabel}>DOC</span>
                              </button>
                            </WuTooltip>
                            <WuTooltip content="Download PDF" position="top">
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={`Download PDF for ${language.name}`}
                                onClick={() => handleAction('Download PDF', language)}
                              >
                                <span className={styles.pdfLabel}>PDF</span>
                              </button>
                            </WuTooltip>
                          </div>
                        ) : (
                          <div className={styles.actions}>
                            <WuTooltip content="Delete language" position="top">
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={`Delete ${getSurveyLanguageDisplayName(language)}`}
                                onClick={() => setDeleteTarget(language)}
                              >
                                <span className="wm-delete" aria-hidden />
                              </button>
                            </WuTooltip>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Remove language"
        description={
          deleteTarget
            ? `Remove ${getSurveyLanguageDisplayName(deleteTarget)} from this survey?`
            : 'Remove this language from the survey?'
        }
        confirmLabel="Remove"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
