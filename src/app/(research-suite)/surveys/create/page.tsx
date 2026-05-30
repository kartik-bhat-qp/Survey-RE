'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveyCreationAiThinkingOverlay } from '@/components/surveys/SurveyCreationAiThinkingOverlay';
import { SurveyCreationTracerTitle } from '@/components/surveys/SurveyCreationTracerTitle';
import {
  createSurveyBriefFile,
  DEFAULT_SURVEY_CREATION_LANGUAGE,
  getSurveyCreationLanguageShortLabel,
  NEW_BLANK_SURVEY_ID,
  saveBlankSurveyDraft,
  SURVEY_AI_DRAFT_DELAY_MS,
  SURVEY_BRIEF_ACCEPT,
  SURVEY_CREATION_LANGUAGES,
  SURVEY_CREATION_PROMPT_PLACEHOLDER,
  SURVEY_CREATION_TEMPLATES,
  SURVEY_CREATION_TEMPLATES_PER_PAGE,
  formatSurveyBriefFileSize,
  validateSurveyBriefFile,
  type SurveyCreationBriefFile,
} from '@/data/mock-survey-creation-flow';
import styles from './NewSurveyCreationFlowPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
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
export default function NewSurveyCreationFlowPage() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState('');
  const [attachedBriefs, setAttachedBriefs] = useState<SurveyCreationBriefFile[]>([]);
  const [language, setLanguage] = useState(DEFAULT_SURVEY_CREATION_LANGUAGE);
  const [showBlankNameForm, setShowBlankNameForm] = useState(false);
  const [blankSurveyName, setBlankSurveyName] = useState('');
  const [blankNameError, setBlankNameError] = useState(false);
  const [heroRevealed, setHeroRevealed] = useState(false);
  const blankNameInputRef = useRef<HTMLInputElement>(null);
  const aiDraftTimeoutRef = useRef<number | null>(null);
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [templatePage, setTemplatePage] = useState(0);

  const templatePageCount = Math.ceil(
    SURVEY_CREATION_TEMPLATES.length / SURVEY_CREATION_TEMPLATES_PER_PAGE
  );
  const visibleTemplates = SURVEY_CREATION_TEMPLATES.slice(
    templatePage * SURVEY_CREATION_TEMPLATES_PER_PAGE,
    templatePage * SURVEY_CREATION_TEMPLATES_PER_PAGE + SURVEY_CREATION_TEMPLATES_PER_PAGE
  );
  const canGoToPrevTemplates = templatePage > 0;
  const canGoToNextTemplates = templatePage < templatePageCount - 1;

  const handleTracerComplete = useCallback(() => {
    setHeroRevealed(true);
  }, []);

  const trimmedPrompt = prompt.trim();
  const canCreate = trimmedPrompt.length > 0;
  const selectedLanguageLabel = getSurveyCreationLanguageShortLabel(language);

  function handleCreateSurvey() {
    if (!canCreate) {
      showToast({ message: 'Describe what you want to learn to continue', variant: 'error' });
      return;
    }
    if (isAiDrafting) return;

    setIsAiDrafting(true);
    aiDraftTimeoutRef.current = window.setTimeout(() => {
      setIsAiDrafting(false);
      aiDraftTimeoutRef.current = null;
      showToast({ message: 'Your survey is ready to edit', variant: 'success' });
      router.push('/surveys/1');
    }, SURVEY_AI_DRAFT_DELAY_MS);
  }

  function handleTemplateSelect(templateLabel: string, templatePrompt: string) {
    setPrompt(templatePrompt);
    showToast({ message: `${templateLabel} template applied`, variant: 'success' });
  }

  function handleAttachBriefClick() {
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

  function handleStartFromBlank() {
    setShowBlankNameForm(true);
  }

  function handleBlankFormCancel() {
    setShowBlankNameForm(false);
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
    if (!showBlankNameForm) return;
    blankNameInputRef.current?.focus();
  }, [showBlankNameForm]);

  useEffect(() => {
    return () => {
      if (aiDraftTimeoutRef.current !== null) {
        window.clearTimeout(aiDraftTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.page}>
      <SurveyCreationAiThinkingOverlay open={isAiDrafting} />
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            <span className={`wc-ai ${styles.titleAiIcon}`} aria-hidden />
            <SurveyCreationTracerTitle
              text="Let's create your first survey"
              onComplete={handleTracerComplete}
            />
          </h1>
          <p
            className={`${styles.subtitle} ${
              heroRevealed ? styles.subtitleReveal : styles.subtitleHidden
            }`}
          >
            Describe it in your own words. QuestionPro AI will draft the questions, pick the right scales,
            and hand you a survey you can edit, tweak, or send.
          </p>
        </div>

        <section className={styles.promptCard} aria-label="Survey creation prompt">
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
          <textarea
            className={styles.promptInput}
            placeholder={SURVEY_CREATION_PROMPT_PLACEHOLDER}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={5}
            aria-label="Describe your survey goals"
            disabled={isAiDrafting}
          />
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
          <div className={styles.promptFooter}>
            <div className={styles.promptMeta}>
              <button
                type="button"
                className={styles.metaBtn}
                onClick={handleAttachBriefClick}
              >
                <span className="wm-attach-file" aria-hidden />
                Attach a brief
              </button>
              <WuMenu
                Trigger={
                  <button type="button" className={styles.metaBtn}>
                    <span className="wm-language" aria-hidden />
                    {selectedLanguageLabel}
                    <span className={`wm-keyboard-arrow-down ${styles.metaCaret}`} aria-hidden />
                  </button>
                }
                align="start"
              >
                {SURVEY_CREATION_LANGUAGES.map((item) => (
                  <WuMenuItem key={item.value} onSelect={() => setLanguage(item.value)}>
                    {item.label}
                  </WuMenuItem>
                ))}
              </WuMenu>
            </div>
            <WuButton
              className={styles.createBtn}
              disabled={!canCreate || isAiDrafting}
              onClick={handleCreateSurvey}
            >
              {isAiDrafting ? 'Drafting survey…' : 'create survey'}
              {!isAiDrafting ? <span className="wm-arrow-forward" aria-hidden /> : null}
            </WuButton>
          </div>
        </section>

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
                  className={styles.templatePill}
                  disabled={isAiDrafting}
                  onClick={() => handleTemplateSelect(template.label, template.prompt)}
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

        <div className={styles.bottomSection}>
          {showBlankNameForm ? (
            <form
              className={styles.blankNameForm}
              onSubmit={handleBlankFormSubmit}
              aria-label="Name your blank survey"
            >
              <div className={styles.blankNameRow}>
                <input
                  ref={blankNameInputRef}
                  id="blank-survey-name"
                  type="text"
                  className={`${styles.blankNameInput} ${
                    blankNameError ? styles.blankNameInputError : ''
                  }`}
                  placeholder="Enter Survey Name"
                  value={blankSurveyName}
                  maxLength={200}
                  aria-invalid={blankNameError}
                  aria-describedby={blankNameError ? 'blank-survey-name-error' : undefined}
                  onChange={(event) => {
                    if (blankNameError && event.target.value.trim()) {
                      setBlankNameError(false);
                    }
                    setBlankSurveyName(event.target.value);
                  }}
                />
                <div className={styles.blankNameActions}>
                  <WuButton type="submit" className={styles.blankNameSubmit}>
                    Create Survey
                  </WuButton>
                  <button
                    type="button"
                    className={styles.blankNameCancel}
                    onClick={handleBlankFormCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {blankNameError ? (
                <p id="blank-survey-name-error" className={styles.blankNameError} role="alert">
                  Survey name is required
                </p>
              ) : null}
            </form>
          ) : (
            <div className={styles.bottomLinks}>
              <button type="button" className={styles.bottomLink} onClick={handleStartFromBlank}>
                Start from blank
              </button>
              <Link href="/surveys" className={styles.bottomLink}>
                Skip for now
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
