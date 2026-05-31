'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveyCreationAiThinkingOverlay } from '@/components/surveys/SurveyCreationAiThinkingOverlay';
import { NEW_AI_SURVEY_ID, saveAiSurveyDraft } from '@/data/ai-survey-draft';
import {
  createSurveyBriefFile,
  DEFAULT_SURVEY_CREATION_LANGUAGE,
  formatSurveyBriefFileSize,
  getSurveyCreationLanguageLabel,
  SURVEY_BRIEF_ACCEPT,
  NEW_BLANK_SURVEY_ID,
  saveBlankSurveyDraft,
  SURVEY_CREATION_TEMPLATES,
  SURVEY_CREATION_TEMPLATES_PER_PAGE,
  SURVEYS_LIST_AI_PROMPT_PLACEHOLDER,
  validateSurveyBriefFile,
  type SurveyCreationBriefFile,
  type SurveyCreationTemplate,
} from '@/data/mock-survey-creation-flow';
import { requestAiSurveyGeneration } from '@/lib/request-ai-survey-generation';
import styles from './SurveysAiFirstHero.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

type CreationMode = 'idea' | 'template' | 'scratch';

export function SurveysAiFirstHero() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const promptFormRef = useRef<HTMLFormElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blankNameInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<CreationMode>('idea');
  const [blankSurveyName, setBlankSurveyName] = useState('');
  const [blankNameError, setBlankNameError] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [attachedBriefs, setAttachedBriefs] = useState<SurveyCreationBriefFile[]>([]);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [templatePage, setTemplatePage] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  const templatePageCount = Math.ceil(
    SURVEY_CREATION_TEMPLATES.length / SURVEY_CREATION_TEMPLATES_PER_PAGE
  );
  const visibleTemplates = SURVEY_CREATION_TEMPLATES.slice(
    templatePage * SURVEY_CREATION_TEMPLATES_PER_PAGE,
    templatePage * SURVEY_CREATION_TEMPLATES_PER_PAGE + SURVEY_CREATION_TEMPLATES_PER_PAGE
  );
  const canGoToPrevTemplates = templatePage > 0;
  const canGoToNextTemplates = templatePage < templatePageCount - 1;

  const trimmedPrompt = prompt.trim();
  const surveyLanguageLabel = getSurveyCreationLanguageLabel(DEFAULT_SURVEY_CREATION_LANGUAGE);

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (mode !== 'idea' || isAiDrafting) return;

    if (!trimmedPrompt) {
      showToast({ message: 'Describe what you want to learn to continue', variant: 'error' });
      promptRef.current?.focus();
      return;
    }

    setIsAiDrafting(true);
    try {
      const result = await requestAiSurveyGeneration(trimmedPrompt, surveyLanguageLabel);
      if (!result.ok) {
        showToast({ message: result.error, variant: 'error' });
        return;
      }
      saveAiSurveyDraft(result.survey, trimmedPrompt);
      showToast({ message: 'Your survey is ready to edit', variant: 'success' });
      router.push(`/surveys/${NEW_AI_SURVEY_ID}`);
    } finally {
      setIsAiDrafting(false);
    }
  }

  function handlePromptKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function handlePromptFocus() {
    setPromptExpanded(true);
  }

  function handlePromptBlur(event: React.FocusEvent<HTMLTextAreaElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && promptFormRef.current?.contains(next)) {
      return;
    }
    if (attachedBriefs.length > 0) {
      return;
    }
    setPromptExpanded(false);
  }

  function handleAttachBriefClick() {
    setPromptExpanded(true);
    fileInputRef.current?.click();
  }

  function handleBriefFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (selectedFiles.length === 0) return;

    const nextBriefs: SurveyCreationBriefFile[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      const validationError = validateSurveyBriefFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }
      if (attachedBriefs.some((brief) => brief.name === file.name && brief.size === file.size)) {
        errors.push(`${file.name} is already attached.`);
        continue;
      }
      nextBriefs.push(createSurveyBriefFile(file));
    }

    if (nextBriefs.length > 0) {
      setAttachedBriefs((prev) => [...prev, ...nextBriefs]);
      setPromptExpanded(true);
      showToast({
        message:
          nextBriefs.length === 1
            ? `"${nextBriefs[0].name}" attached`
            : `${nextBriefs.length} files attached`,
        variant: 'success',
      });
    }

    if (errors.length > 0) {
      showToast({ message: errors[0], variant: 'error' });
    }
  }

  function handleRemoveBrief(briefId: string) {
    setAttachedBriefs((prev) => prev.filter((brief) => brief.id !== briefId));
  }

  function handleBlankSurveyCreate(name: string) {
    saveBlankSurveyDraft(name);
    showToast({ message: 'Blank survey created', variant: 'success' });
    router.push(`/surveys/${NEW_BLANK_SURVEY_ID}`);
  }

  function handleBlankFormCancel() {
    setMode('idea');
    setBlankSurveyName('');
    setBlankNameError(false);
  }

  function handleBlankFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = blankSurveyName.trim();
    if (!trimmed) {
      setBlankNameError(true);
      showToast({ message: 'Survey name is required', variant: 'error' });
      return;
    }
    handleBlankSurveyCreate(trimmed);
  }

  useEffect(() => {
    if (mode !== 'scratch') return;
    blankNameInputRef.current?.focus();
  }, [mode]);

  function handleTemplateSelect(template: SurveyCreationTemplate) {
    setSelectedTemplateId(template.id);
    setPrompt(template.prompt);
    setMode('idea');
    setPromptExpanded(true);
    showToast({ message: `${template.label} template applied`, variant: 'success' });
    requestAnimationFrame(() => promptRef.current?.focus());
  }

  return (
    <section className={styles.hero} aria-label="Create a new survey">
      <SurveyCreationAiThinkingOverlay open={isAiDrafting} />
      <div className={styles.inner}>
        <h2 className={styles.headline}>Turn your thoughts into a survey</h2>
        <div className={styles.modeRow} role="tablist" aria-label="How to start your survey">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'idea'}
            className={`${styles.modeBtn} ${mode === 'idea' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('idea')}
            disabled={isAiDrafting}
          >
            <span className={`wm-edit ${styles.modeIcon}`} aria-hidden />
            Start from an idea
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'template'}
            className={`${styles.modeBtn} ${mode === 'template' ? styles.modeBtnActive : ''}`}
            onClick={() => {
              setMode('template');
              setPromptExpanded(false);
              setTemplatePage(0);
            }}
            disabled={isAiDrafting}
          >
            <span className={`wm-grid-view ${styles.modeIcon}`} aria-hidden />
            Start with a template
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'scratch'}
            className={`${styles.modeBtn} ${mode === 'scratch' ? styles.modeBtnActive : ''}`}
            onClick={() => {
              setMode('scratch');
              setPromptExpanded(false);
              setBlankNameError(false);
            }}
            disabled={isAiDrafting}
          >
            <span className={`wm-description ${styles.modeIcon}`} aria-hidden />
            Start from scratch
          </button>
        </div>

        <div className={styles.panel} role="tabpanel">
          {mode === 'idea' ? (
            <form
              ref={promptFormRef}
              className={`${styles.promptForm} ${promptExpanded ? styles.promptFormExpanded : ''}`}
              onSubmit={handleSubmit}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={SURVEY_BRIEF_ACCEPT}
                multiple
                className={styles.hiddenFileInput}
                aria-hidden
                tabIndex={-1}
                onChange={handleBriefFilesSelected}
              />
              <div className={styles.promptShell}>
                <textarea
                  ref={promptRef}
                  className={styles.promptInput}
                  placeholder={SURVEYS_LIST_AI_PROMPT_PLACEHOLDER}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onFocus={handlePromptFocus}
                  onBlur={handlePromptBlur}
                  onKeyDown={handlePromptKeyDown}
                  rows={promptExpanded ? 5 : 1}
                  aria-label="Describe your survey goals"
                  disabled={isAiDrafting}
                />
                <div className={styles.actionWrap}>
                  <button
                    type="button"
                    className={styles.attachBtn}
                    aria-label="Attach a brief"
                    onClick={handleAttachBriefClick}
                    disabled={isAiDrafting}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <span className="wm-attach-file" aria-hidden />
                  </button>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    aria-label="Create survey with AI"
                    disabled={!trimmedPrompt || isAiDrafting}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <span className="wm-arrow-forward" aria-hidden />
                  </button>
                </div>
              </div>
              {attachedBriefs.length > 0 ? (
                <ul className={styles.attachedBriefList} aria-label="Attached briefs">
                  {attachedBriefs.map((brief) => (
                    <li key={brief.id} className={styles.attachedBriefItem}>
                      <span className="wm-insert-drive-file" aria-hidden />
                      <span className={styles.attachedBriefName} title={brief.name}>
                        {brief.name}
                      </span>
                      <span className={styles.attachedBriefSize}>
                        {formatSurveyBriefFileSize(brief.size)}
                      </span>
                      <button
                        type="button"
                        className={styles.removeBriefBtn}
                        aria-label={`Remove ${brief.name}`}
                        onClick={() => handleRemoveBrief(brief.id)}
                      >
                        <span className="wm-close" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </form>
          ) : null}

          {mode === 'template' ? (
            <div className={styles.templatesBlock}>
              <p className={styles.templatesLabel}>Or start from</p>
              <div
                className={styles.templateCarousel}
                role="group"
                aria-label="Survey template categories"
              >
                <button
                  type="button"
                  className={styles.templateNavBtn}
                  aria-label="Previous templates"
                  disabled={!canGoToPrevTemplates || isAiDrafting}
                  onClick={() => setTemplatePage((page) => Math.max(0, page - 1))}
                >
                  <span className="wm-chevron-left" aria-hidden />
                </button>
                <div className={styles.templateList}>
                  {visibleTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`${styles.templatePill} ${
                        selectedTemplateId === template.id ? styles.templatePillSelected : ''
                      }`}
                      disabled={isAiDrafting}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.templateNavBtn}
                  aria-label="Next templates"
                  disabled={!canGoToNextTemplates || isAiDrafting}
                  onClick={() =>
                    setTemplatePage((page) => Math.min(templatePageCount - 1, page + 1))
                  }
                >
                  <span className="wm-chevron-right" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}

          {mode === 'scratch' ? (
            <form
              className={styles.blankNameForm}
              onSubmit={handleBlankFormSubmit}
              aria-label="Name your blank survey"
            >
              <div className={styles.blankNameRow}>
                <input
                  ref={blankNameInputRef}
                  id="surveys-list-blank-name"
                  type="text"
                  className={`${styles.blankNameInput} ${
                    blankNameError ? styles.blankNameInputError : ''
                  }`}
                  placeholder="Enter Survey Name"
                  value={blankSurveyName}
                  maxLength={200}
                  aria-invalid={blankNameError}
                  aria-describedby={
                    blankNameError ? 'surveys-list-blank-name-error' : undefined
                  }
                  disabled={isAiDrafting}
                  onChange={(event) => {
                    if (blankNameError && event.target.value.trim()) {
                      setBlankNameError(false);
                    }
                    setBlankSurveyName(event.target.value);
                  }}
                />
                <div className={styles.blankNameActions}>
                  <WuButton
                    type="submit"
                    className={styles.blankNameSubmit}
                    disabled={isAiDrafting}
                  >
                    Create Survey
                  </WuButton>
                  <button
                    type="button"
                    className={styles.blankNameCancel}
                    onClick={handleBlankFormCancel}
                    disabled={isAiDrafting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {blankNameError ? (
                <p id="surveys-list-blank-name-error" className={styles.blankNameError} role="alert">
                  Survey name is required
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
