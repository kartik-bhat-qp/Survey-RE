'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  createSurveyBriefFile,
  DEFAULT_SURVEY_CREATION_LANGUAGE,
  getSurveyCreationLanguageShortLabel,
  SURVEY_BRIEF_ACCEPT,
  SURVEY_CREATION_LANGUAGES,
  SURVEY_CREATION_PROMPT_PLACEHOLDER,
  SURVEY_CREATION_TEMPLATES,
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

  const trimmedPrompt = prompt.trim();
  const canCreate = trimmedPrompt.length > 0;
  const selectedLanguageLabel = getSurveyCreationLanguageShortLabel(language);

  function handleCreateSurvey() {
    if (!canCreate) {
      showToast({ message: 'Describe what you want to learn to continue', variant: 'error' });
      return;
    }
    showToast({ message: 'Prism is drafting your survey…', variant: 'success' });
    router.push('/surveys/1');
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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            <span className={`wc-ai ${styles.titleAiIcon}`} aria-hidden />
            Let&apos;s create your first survey
          </h1>
          <p className={styles.subtitle}>
            Describe it in your own words. Prism will draft the questions, pick the right scales,
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
              disabled={!canCreate}
              onClick={handleCreateSurvey}
            >
              Create my first survey
              <span className="wm-arrow-forward" aria-hidden />
            </WuButton>
          </div>
        </section>

        <div className={styles.templatesBlock}>
          <p className={styles.templatesLabel}>Or start from</p>
          <div className={styles.templateList}>
            {SURVEY_CREATION_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                className={styles.templatePill}
                onClick={() => handleTemplateSelect(template.label, template.prompt)}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.bottomLinks}>
          <button
            type="button"
            className={styles.bottomLink}
            onClick={() => {
              showToast({ message: 'Starting from a blank survey', variant: 'success' });
              router.push('/surveys/1');
            }}
          >
            Start from blank
          </button>
          <Link href="/surveys" className={styles.bottomLink}>
            Skip for now
          </Link>
        </div>
      </main>
    </div>
  );
}
