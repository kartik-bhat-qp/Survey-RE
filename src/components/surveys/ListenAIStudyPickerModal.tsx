'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  createListenAiStudyDraft,
  upsertListenAiStudyInCatalog,
} from '@/data/listenai-study-catalog';
import { openListenAiCreateStudyWindow } from '@/data/listenai-create-study-session';
import {
  LISTENAI_SOURCE_QUESTION_PLACEHOLDER,
  LISTENAI_SOURCE_QUESTION_UNSET_VALUE,
  listListenAiSourceQuestions,
} from '@/data/mock-listenai-question';
import {
  LISTENAI_INTERVIEW_TYPE_OPTIONS,
  LISTENAI_LANGUAGE_OPTIONS,
  type ListenAiStudy,
} from '@/data/mock-listenai-studies';
import type { SurveySection } from '@/data/mock-survey-detail';
import { useListenAiStudiesCatalog } from '@/hooks/useListenAiStudiesCatalog';
import styles from './ListenAIStudyPickerModal.module.css';

type RightPaneMode = 'preview' | 'create';

export interface ListenAIStudyPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudyId?: string;
  onSelectStudy: (study: ListenAiStudy) => void;
  /** When true, open directly on the New study form. */
  initialCreateMode?: boolean;
  sections?: SurveySection[];
  currentQuestionId?: string;
}

function languageLabel(code: string): string {
  return LISTENAI_LANGUAGE_OPTIONS.find((option) => option.value === code)?.label ?? code;
}

function interviewTypeLabel(type: ListenAiStudy['interviewType']): string {
  return (
    LISTENAI_INTERVIEW_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
  );
}

function studyGoal(study: ListenAiStudy): string {
  return study.objectives[0]?.trim() || study.description.trim() || 'No goal provided yet.';
}

function studySummary(study: ListenAiStudy): string {
  if (study.sourceQuestionText?.trim()) {
    const code = study.sourceQuestionCode ? `${study.sourceQuestionCode} — ` : '';
    return `DeepDive source: ${code}${study.sourceQuestionText.trim()}`;
  }
  if (study.description.trim()) return study.description.trim();
  if (study.introduction.trim()) return study.introduction.trim();
  const guideCount = study.discussionGuide.length;
  if (guideCount === 0) return 'No discussion guide questions yet.';
  return `${guideCount} guide question${guideCount === 1 ? '' : 's'} configured.`;
}

export function ListenAIStudyPickerModal({
  open,
  onOpenChange,
  selectedStudyId,
  onSelectStudy,
  initialCreateMode = false,
  sections = [],
  currentQuestionId,
}: ListenAIStudyPickerModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const { studies, isRefreshing, refresh } = useListenAiStudiesCatalog();
  const [search, setSearch] = useState('');
  const [rightMode, setRightMode] = useState<RightPaneMode>('preview');
  const [previewStudyId, setPreviewStudyId] = useState<string | null>(null);
  const [draftSourceValue, setDraftSourceValue] = useState(LISTENAI_SOURCE_QUESTION_UNSET_VALUE);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftGoal, setDraftGoal] = useState('');
  const [initializedOpen, setInitializedOpen] = useState(false);

  const sourceQuestions = useMemo(
    () => listListenAiSourceQuestions(sections, currentQuestionId),
    [currentQuestionId, sections]
  );

  const selectedSource = sourceQuestions.find((option) => option.value === draftSourceValue);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) {
      setInitializedOpen(false);
      return;
    }
    if (initializedOpen) return;

    setSearch('');
    setDraftSourceValue(LISTENAI_SOURCE_QUESTION_UNSET_VALUE);
    setDraftTitle('');
    setDraftGoal('');
    void refresh();

    const catalog = studies;
    const shouldCreate = initialCreateMode || catalog.length === 0;
    setRightMode(shouldCreate ? 'create' : 'preview');
    setPreviewStudyId(shouldCreate ? null : selectedStudyId || catalog[0]?.id || null);
    setInitializedOpen(true);
  }, [open, initializedOpen, initialCreateMode, refresh, selectedStudyId, studies]);

  const filteredStudies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return studies;
    return studies.filter((study) => {
      const haystack = [
        study.title,
        study.description,
        study.objectives.join(' '),
        study.sourceQuestionText ?? '',
        interviewTypeLabel(study.interviewType),
        languageLabel(study.primaryLanguage),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [search, studies]);

  const previewStudy =
    previewStudyId != null
      ? studies.find((study) => study.id === previewStudyId) ?? null
      : null;

  const canSubmitCreate = Boolean(selectedSource && draftTitle.trim());

  function selectStudy(study: ListenAiStudy): void {
    onSelectStudy(study);
    handleModalOpenChange(false);
    showToast({ message: `Connected “${study.title}”`, variant: 'success' });
  }

  function handleNewStudyClick(): void {
    setRightMode('create');
    setPreviewStudyId(null);
  }

  function handleStudyListClick(study: ListenAiStudy): void {
    setRightMode('preview');
    setPreviewStudyId(study.id);
  }

  function handleSourceQuestionChange(value: string): void {
    setDraftSourceValue(value);
    const next = sourceQuestions.find((option) => option.value === value);
    if (!next) return;
    setDraftTitle((prev) => (prev.trim() ? prev : next.text));
    setDraftGoal((prev) =>
      prev.trim() ? prev : `Understand why respondents answered “${next.text}”.`
    );
  }

  function handleCreateSubmit(): void {
    if (!canSubmitCreate || !selectedSource) return;
    const study = createListenAiStudyDraft({
      title: draftTitle,
      goal: draftGoal,
      guideQuestions: [selectedSource.text],
      sourceQuestionId: selectedSource.questionId,
      sourceQuestionCode: selectedSource.code,
      sourceQuestionText: selectedSource.text,
    });
    upsertListenAiStudyInCatalog(study);
    showToast({
      message: `Logged “${study.title}” as a ListenAI study`,
      variant: 'success',
    });
    onSelectStudy(study);
    handleModalOpenChange(false);
    openListenAiCreateStudyWindow(study.id);
  }

  function handlePrimaryAction(): void {
    if (rightMode === 'create') {
      handleCreateSubmit();
      return;
    }
    if (previewStudy) selectStudy(previewStudy);
  }

  if (!open || !wick) {
    return null;
  }

  const {
    WuModal,
    WuModalHeader,
    WuModalContent,
    WuModalFooter,
    WuModalClose,
    WuButton,
    WuInput,
  } = wick;
  const noSearchResults = search.trim().length > 0 && filteredStudies.length === 0;
  const primaryDisabled = rightMode === 'create' ? !canSubmitCreate : previewStudy == null;

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      className={styles.modal}
      variant="action"
      size="lg"
    >
      <WuModalHeader>
        {rightMode === 'create'
          ? 'Select a question you want to dive deeper'
          : 'Select a ListenAI study'}
      </WuModalHeader>

      <WuModalContent className={styles.content}>
        <div className={styles.split}>
          <aside className={styles.listPane} aria-label="ListenAI studies">
            <div className={styles.searchWrap}>
              <WuInput
                variant="outlined"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search studies"
                aria-label="Search studies"
                Icon={<span className="wm-search" />}
              />
            </div>

            <button
              type="button"
              className={`${styles.newStudyItem} ${
                rightMode === 'create' ? styles.newStudyItemActive : ''
              }`}
              onClick={handleNewStudyClick}
            >
              <span className={`wm-add ${styles.newStudyIcon}`} aria-hidden />
              <span className={styles.newStudyCopy}>
                <span className={styles.newStudyTitle}>New study</span>
                <span className={styles.newStudyHint}>
                  Pick a survey question to DeepDive
                </span>
              </span>
            </button>

            <div className={styles.studyList} role="listbox" aria-label="Existing studies">
              {isRefreshing && studies.length === 0 ? (
                <p className={styles.emptyCopy}>Loading studies…</p>
              ) : null}

              {noSearchResults ? (
                <div className={styles.noResults}>
                  <p className={styles.emptyCopy}>No studies match “{search.trim()}”.</p>
                  <WuButton variant="primary" onClick={handleNewStudyClick}>
                    New study
                  </WuButton>
                </div>
              ) : (
                filteredStudies.map((study) => {
                  const active = rightMode === 'preview' && previewStudyId === study.id;
                  return (
                    <button
                      key={study.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`${styles.studyItem} ${active ? styles.studyItemActive : ''}`}
                      onClick={() => handleStudyListClick(study)}
                      onDoubleClick={() => selectStudy(study)}
                    >
                      <span className={styles.studyItemTitle}>{study.title}</span>
                      <span className={styles.studyItemMeta}>
                        {study.sourceQuestionCode
                          ? `${study.sourceQuestionCode} · `
                          : ''}
                        {interviewTypeLabel(study.interviewType)} ·{' '}
                        {languageLabel(study.primaryLanguage)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className={styles.detailPane} aria-live="polite">
            {rightMode === 'create' ? (
              <div className={styles.createForm}>
                <h3 className={styles.detailTitle}>Select a question you want to dive deeper</h3>
                <p className={styles.detailCopy}>
                  Choose the survey question to DeepDive, then add a study title and goal. Saving
                  logs this as a ListenAI study.
                </p>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Survey question</span>
                  <select
                    className={styles.nativeSelect}
                    value={draftSourceValue}
                    onChange={(event) => handleSourceQuestionChange(event.target.value)}
                    aria-label="Select a question you want to dive deeper"
                  >
                    <option value={LISTENAI_SOURCE_QUESTION_UNSET_VALUE}>
                      {LISTENAI_SOURCE_QUESTION_PLACEHOLDER}
                    </option>
                    {sourceQuestions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Study title</span>
                  <WuInput
                    variant="outlined"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="Study title"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Goal</span>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={draftGoal}
                    onChange={(event) => setDraftGoal(event.target.value)}
                    placeholder="What should this DeepDive learn?"
                  />
                </label>
              </div>
            ) : previewStudy ? (
              <div className={styles.preview}>
                <h3 className={styles.detailTitle}>{previewStudy.title}</h3>
                {previewStudy.sourceQuestionText ? (
                  <div className={styles.previewSection}>
                    <p className={styles.goalLabel}>Source question</p>
                    <p className={styles.detailCopy}>
                      {previewStudy.sourceQuestionCode
                        ? `${previewStudy.sourceQuestionCode} — `
                        : ''}
                      {previewStudy.sourceQuestionText}
                    </p>
                  </div>
                ) : null}
                <div className={styles.previewSection}>
                  <p className={styles.goalLabel}>Goal</p>
                  <p className={styles.detailCopy}>{studyGoal(previewStudy)}</p>
                </div>
                <div className={styles.previewSection}>
                  <p className={styles.goalLabel}>Summary</p>
                  <p className={styles.detailCopy}>{studySummary(previewStudy)}</p>
                </div>
                <dl className={styles.metaGrid}>
                  <div>
                    <dt>Guide questions</dt>
                    <dd>{previewStudy.discussionGuide.length}</dd>
                  </div>
                  <div>
                    <dt>Language</dt>
                    <dd>{languageLabel(previewStudy.primaryLanguage)}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>{interviewTypeLabel(previewStudy.interviewType)}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className={styles.previewEmpty}>
                <h3 className={styles.detailTitle}>Pick a study</h3>
                <p className={styles.detailCopy}>
                  Choose an existing ListenAI study from the list, or create a new one from a
                  survey question.
                </p>
                <WuButton variant="primary" onClick={handleNewStudyClick}>
                  New study
                </WuButton>
              </div>
            )}
          </section>
        </div>
      </WuModalContent>

      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton variant="primary" onClick={handlePrimaryAction} disabled={primaryDisabled}>
          {rightMode === 'create' ? 'Save as ListenAI study' : 'Select study'}
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
