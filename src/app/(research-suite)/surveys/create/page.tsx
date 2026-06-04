'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveyCreationAiThinkingOverlay } from '@/components/surveys/SurveyCreationAiThinkingOverlay';
import { SurveyCreationTemplatePicker } from '@/components/surveys/SurveyCreationTemplatePicker';
import { SurveyCreationTracerTitle } from '@/components/surveys/SurveyCreationTracerTitle';
import { NEW_AI_SURVEY_ID } from '@/data/ai-survey-draft';
import { runAiSurveyCreationFlow } from '@/lib/request-ai-survey-generation';
import {
  createSurveyBriefFile,
  DEFAULT_SURVEY_CREATION_LANGUAGE,
  formatSurveyBriefFileSize,
  getSurveyCreationLanguageLabel,
  getSurveyCreationLanguageShortLabel,
  NEW_BLANK_SURVEY_ID,
  saveBlankSurveyDraft,
  SURVEY_BRIEF_ACCEPT,
  SURVEY_CREATION_HERO_SUBTITLES,
  SURVEY_CREATION_LANGUAGES,
  SURVEY_TEMPLATE_BUILD_DELAY_MS,
  SURVEYS_LIST_AI_PROMPT_PLACEHOLDER,
  type SurveyCreationAiOverlayVariant,
  type SurveyCreationMode,
  validateSurveyBriefFile,
  type SurveyCreationBriefFile,
  type SurveyCreationTemplate,
} from '@/data/mock-survey-creation-flow';
import modeStyles from '@/components/surveys/SurveysAiFirstHero.module.css';
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
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const blankNameInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<SurveyCreationMode>('idea');
  const [prompt, setPrompt] = useState('');
  const [attachedBriefs, setAttachedBriefs] = useState<SurveyCreationBriefFile[]>([]);
  const [language, setLanguage] = useState(DEFAULT_SURVEY_CREATION_LANGUAGE);
  const [blankSurveyName, setBlankSurveyName] = useState('');
  const [blankNameError, setBlankNameError] = useState(false);
  const [heroRevealed, setHeroRevealed] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiOverlayVariant, setAiOverlayVariant] =
    useState<SurveyCreationAiOverlayVariant>('working');

  const handleTracerComplete = useCallback(() => {
    setHeroRevealed(true);
  }, []);

  const trimmedPrompt = prompt.trim();
  const canCreate = trimmedPrompt.length > 0;
  const selectedLanguageLabel = getSurveyCreationLanguageShortLabel(language);
  const surveyLanguageLabel = getSurveyCreationLanguageLabel(language);

  async function handleCreateSurvey() {
    if (!canCreate) {
      showToast({ message: 'Describe what you want to learn to continue', variant: 'error' });
      promptRef.current?.focus();
      return;
    }
    if (isAiDrafting) return;

    setAiOverlayVariant('working');
    setIsAiDrafting(true);
    let succeeded = false;

    try {
      const result = await runAiSurveyCreationFlow(trimmedPrompt, surveyLanguageLabel);

      if (!result.ok) {
        showToast({ message: result.error, variant: 'error' });
        return;
      }

      succeeded = true;
      showToast({ message: 'Your survey is ready to edit', variant: 'success' });
      router.push(`/surveys/${NEW_AI_SURVEY_ID}`);
    } finally {
      if (!succeeded) {
        setIsAiDrafting(false);
      }
    }
  }

  function handlePromptKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleCreateSurvey();
    }
  }

  async function handleTemplateSelect(template: SurveyCreationTemplate) {
    if (isAiDrafting) return;

    setSelectedTemplateId(template.id);
    setAiOverlayVariant('building');
    setIsAiDrafting(true);
    let succeeded = false;

    try {
      const result = await runAiSurveyCreationFlow(template.prompt, surveyLanguageLabel, {
        minDelayMs: SURVEY_TEMPLATE_BUILD_DELAY_MS,
      });

      if (!result.ok) {
        showToast({ message: result.error, variant: 'error' });
        return;
      }

      succeeded = true;
      showToast({ message: 'Your survey is ready to edit', variant: 'success' });
      router.push(`/surveys/${NEW_AI_SURVEY_ID}`);
    } finally {
      if (!succeeded) {
        setIsAiDrafting(false);
      }
    }
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

  function handleScratchModeSelect() {
    setMode('scratch');
    setBlankNameError(false);
  }

  useEffect(() => {
    if (mode !== 'scratch') return;
    blankNameInputRef.current?.focus();
  }, [mode]);

  return (
    <div className={styles.page}>
      <SurveyCreationAiThinkingOverlay open={isAiDrafting} variant={aiOverlayVariant} />
      <main className={styles.main}>
        <header className={styles.hero}>
          <span className={`wc-ai ${styles.heroStar}`} aria-hidden />
          <h1 className={styles.title}>
            <SurveyCreationTracerTitle
              text="Let's create your first survey"
              onComplete={handleTracerComplete}
            />
          </h1>
          <p
            key={mode}
            className={`${styles.subtitle} ${
              heroRevealed ? styles.subtitleReveal : styles.subtitleHidden
            }`}
          >
            {SURVEY_CREATION_HERO_SUBTITLES[mode]}
          </p>
        </header>

        <div
          className={modeStyles.modeRow}
          role="tablist"
          aria-label="How to start your survey"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'idea'}
            className={`${modeStyles.modeBtn} ${mode === 'idea' ? modeStyles.modeBtnActive : ''}`}
            onClick={() => setMode('idea')}
            disabled={isAiDrafting}
          >
            <span className={`wm-edit ${modeStyles.modeIcon}`} aria-hidden />
            Start from an idea
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'template'}
            className={`${modeStyles.modeBtn} ${mode === 'template' ? modeStyles.modeBtnActive : ''}`}
            onClick={() => setMode('template')}
            disabled={isAiDrafting}
          >
            <span className={`wm-grid-view ${modeStyles.modeIcon}`} aria-hidden />
            Start with a template
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'scratch'}
            className={`${modeStyles.modeBtn} ${mode === 'scratch' ? modeStyles.modeBtnActive : ''}`}
            onClick={handleScratchModeSelect}
            disabled={isAiDrafting}
          >
            <span className={`wm-description ${modeStyles.modeIcon}`} aria-hidden />
            Build my own
          </button>
        </div>

        <div className={styles.panel} role="tabpanel">
          {mode === 'idea' ? (
            <div className={styles.promptCardWrap}>
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
                  ref={promptRef}
                  className={styles.promptInput}
                  placeholder={SURVEYS_LIST_AI_PROMPT_PLACEHOLDER}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={handlePromptKeyDown}
                  rows={6}
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
                      disabled={isAiDrafting}
                    >
                      <span className="wm-attach-file" aria-hidden />
                      Attach a brief
                    </button>
                    <WuMenu
                      Trigger={
                        <button type="button" className={styles.metaBtn} disabled={isAiDrafting}>
                          <span className="wm-language" aria-hidden />
                          {selectedLanguageLabel}
                          <span
                            className={`wm-keyboard-arrow-down ${styles.metaCaret}`}
                            aria-hidden
                          />
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
                  <button
                    type="button"
                    className={styles.submitBtn}
                    aria-label="Create survey with AI"
                    disabled={!canCreate || isAiDrafting}
                    onClick={() => void handleCreateSurvey()}
                  >
                    <span className="wm-arrow-forward" aria-hidden />
                  </button>
                </div>
              </section>
              <p className={styles.shortcutHint} aria-hidden>
                <kbd className={styles.kbd}>⌘</kbd>
                <span className={styles.shortcutPlus}>+</span>
                <kbd className={styles.kbd}>↵</kbd>
                <span className={styles.shortcutLabel}>to create survey</span>
              </p>
            </div>
          ) : null}

          {mode === 'template' ? (
            <SurveyCreationTemplatePicker
              disabled={isAiDrafting}
              selectedTemplateId={selectedTemplateId}
              onSelect={handleTemplateSelect}
            />
          ) : null}

          {mode === 'scratch' ? (
            <form
              className={styles.scratchCard}
              onSubmit={handleBlankFormSubmit}
              aria-label="Name your blank survey"
            >
              <label htmlFor="create-blank-survey-name" className={styles.scratchLabel}>
                Survey name
              </label>
              <div className={styles.scratchRow}>
                <input
                  ref={blankNameInputRef}
                  id="create-blank-survey-name"
                  type="text"
                  className={`${styles.scratchInput} ${
                    blankNameError ? styles.scratchInputError : ''
                  }`}
                  placeholder="Enter Survey Name"
                  value={blankSurveyName}
                  maxLength={200}
                  aria-invalid={blankNameError}
                  aria-describedby={
                    blankNameError ? 'create-blank-survey-name-error' : undefined
                  }
                  disabled={isAiDrafting}
                  onChange={(event) => {
                    if (blankNameError && event.target.value.trim()) {
                      setBlankNameError(false);
                    }
                    setBlankSurveyName(event.target.value);
                  }}
                />
                <WuButton type="submit" disabled={isAiDrafting}>
                  Create Survey
                </WuButton>
              </div>
              {blankNameError ? (
                <p
                  id="create-blank-survey-name-error"
                  className={styles.scratchError}
                  role="alert"
                >
                  Survey name is required
                </p>
              ) : null}
            </form>
          ) : null}
        </div>

        <div className={styles.bottomLinks}>
          <Link href="/surveys" className={styles.bottomLink}>
            Skip for now
          </Link>
        </div>
      </main>
    </div>
  );
}
