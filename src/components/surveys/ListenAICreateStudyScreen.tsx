'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  LISTENAI_CREATE_EXAMPLE_CATEGORIES,
  generateListenAiStudyFromPrompt,
  getResolvedListenAiOpeningMessages,
} from '@/data/mock-listenai-interview';
import { upsertListenAiStudyInCatalog } from '@/data/listenai-study-catalog';
import type { ListenAiStudy } from '@/data/mock-listenai-studies';
import { ListenAIConversationScreen } from '@/components/surveys/ListenAIConversationScreen';
import styles from './ListenAICreateStudyScreen.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface ListenAICreateStudyScreenProps {
  study: ListenAiStudy;
}

type CreateStep = 'prompt' | 'generated';

export function ListenAICreateStudyScreen({ study }: ListenAICreateStudyScreenProps) {
  const { showToast } = useWuShowToast();
  const [prompt, setPrompt] = useState(study.description);
  const [activeCategoryId, setActiveCategoryId] = useState('product');
  const [step, setStep] = useState<CreateStep>('prompt');
  const [generated, setGenerated] = useState<ListenAiStudy>(study);
  const [previewingConversation, setPreviewingConversation] = useState(false);

  const category =
    LISTENAI_CREATE_EXAMPLE_CATEGORIES.find((item) => item.id === activeCategoryId) ??
    LISTENAI_CREATE_EXAMPLE_CATEGORIES[1];
  const canGenerate = prompt.trim().length > 0;
  const openingMessages = useMemo(
    () => getResolvedListenAiOpeningMessages(generated, 'Taco Bell'),
    [generated]
  );

  function handleGenerate(): void {
    if (!canGenerate) return;
    const next = generateListenAiStudyFromPrompt(study, prompt);
    upsertListenAiStudyInCatalog(next);
    setGenerated(next);
    setStep('generated');
    showToast({ message: 'Study generated as a Conversation interview', variant: 'success' });
  }

  function handleUseBrief(nextPrompt: string): void {
    setPrompt(nextPrompt);
  }

  if (previewingConversation) {
    return (
      <ListenAIConversationScreen
        study={generated}
        selectedAnswerLabel="Taco Bell"
        completeLabel="Back to study"
        onComplete={() => setPreviewingConversation(false)}
      />
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <div className={styles.brand}>ListenAI</div>
        <div className={styles.breadcrumbs}>Studies &gt; {generated.title || 'Untitled Study'} &gt; Create</div>
        <div className={styles.topActions}>
          <span className={styles.avatar}>JP</span>
        </div>
      </header>

      <main className={styles.body}>
        <button type="button" className={styles.backLink} onClick={() => window.close()}>
          ← Back to Studies
        </button>

        {step === 'prompt' ? (
          <>
            <div className={styles.hero}>
              <span className={styles.badge}>AI-moderated study</span>
              <h1 className={styles.heroTitle}>Create AI Study</h1>
              <p className={styles.heroCopy}>
                Describe what you want to learn. AI will design the study, create the discussion
                guide, define participant criteria, and prepare interviews.
              </p>
            </div>

            <div className={styles.promptCard}>
              <textarea
                className={styles.promptInput}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="We recently launched a new onboarding experience and want to understand why activation rates have not improved..."
                aria-label="Study prompt"
              />
              <div className={styles.promptFooter}>
                <button
                  type="button"
                  className={styles.attachBtn}
                  onClick={() =>
                    showToast({
                      message: 'File attachments are not available in this prototype',
                      variant: 'info',
                    })
                  }
                >
                  Attach files
                </button>
                <WuButton variant="primary" disabled={!canGenerate} onClick={handleGenerate}>
                  Generate Study
                </WuButton>
              </div>
            </div>

            <div className={styles.divider}>Or start from an example</div>

            <div className={styles.tabs} role="tablist" aria-label="Example categories">
              {LISTENAI_CREATE_EXAMPLE_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={item.id === activeCategoryId}
                  className={`${styles.tab} ${item.id === activeCategoryId ? styles.tabActive : ''}`}
                  onClick={() => setActiveCategoryId(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={styles.briefs}>
              {(category?.briefs ?? []).map((brief) => (
                <article key={brief.title} className={styles.briefCard}>
                  <p className={styles.briefTitle}>{brief.title}</p>
                  <button
                    type="button"
                    className={styles.briefLink}
                    onClick={() => handleUseBrief(brief.prompt)}
                  >
                    Use this brief →
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={styles.secondaryBar}>
              <div className={styles.studyName}>{generated.title}</div>
              <WuButton
                variant="primary"
                onClick={() => {
                  showToast({
                    message:
                      'Study is ready. Respondents will return to the next survey question after the interview.',
                    variant: 'success',
                  });
                  window.close();
                }}
              >
                Continue to review
              </WuButton>
            </div>

            <div className={styles.split}>
              <section className={styles.configCard}>
                <h2 className={styles.configTitle}>{generated.title}</h2>
                <p className={styles.configCopy}>{generated.description}</p>

                <p className={styles.sectionLabel}>Interview type</p>
                <p className={styles.typeValue}>Conversation</p>
                <p className={styles.configCopy}>
                  Participants chat with an AI interviewer. No camera or microphone required.
                </p>
                <div className={styles.recommend}>
                  Recommended: Video. Seeing participant reactions can help identify moments of
                  hesitation or confusion.
                </div>

                <p className={styles.sectionLabel}>Languages</p>
                <p className={styles.typeValue}>US English</p>
                <p className={styles.configCopy}>The questions are originally written in English.</p>
              </section>

              <aside className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <div>
                    <h2 className={styles.previewTitle}>Interview Preview</h2>
                    <p className={styles.previewHint}>Exactly what participants see during the interview.</p>
                  </div>
                </div>
                <div className={styles.previewChat}>
                  {openingMessages.map((text) => (
                    <p key={text} className={styles.previewBubble}>
                      {text}
                    </p>
                  ))}
                </div>
                <div className={styles.startPreview}>
                  <WuButton variant="primary" onClick={() => setPreviewingConversation(true)}>
                    Start conversation preview
                  </WuButton>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
