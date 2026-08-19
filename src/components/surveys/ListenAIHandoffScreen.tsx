'use client';

import dynamic from 'next/dynamic';
import styles from './ListenAIHandoffScreen.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface ListenAIHandoffScreenProps {
  studyTitle: string;
  interviewTypeLabel?: string;
  connected?: boolean;
  onContinue: () => void;
}

export function ListenAIHandoffScreen({
  studyTitle,
  interviewTypeLabel = 'Conversation',
  connected = true,
  onContinue,
}: ListenAIHandoffScreenProps) {
  return (
    <div className={styles.root}>
      <p className={styles.kicker}>Platform Connect</p>
      <h1 className={styles.title}>
        {connected ? 'Continue in ListenAI' : 'ListenAI is not connected'}
      </h1>
      <p className={styles.copy}>
        {connected
          ? 'You will leave this survey to complete an AI interview. When you finish, you will return to the next question.'
          : 'This question is not connected to a ListenAI study yet. Continue to skip the interview and stay in the survey.'}
      </p>

      {connected ? (
        <div className={styles.studyCard}>
          <p className={styles.studyLabel}>ListenAI study</p>
          <p className={styles.studyTitle}>{studyTitle}</p>
          <p className={styles.studyMeta}>Interview type: {interviewTypeLabel}</p>
        </div>
      ) : null}

      <div className={styles.actions}>
        <WuButton variant="primary" onClick={onContinue}>
          {connected ? 'Continue to ListenAI' : 'Continue'}
        </WuButton>
        <p className={styles.note}>
          {connected
            ? 'After the interview and follow-ups, you will come back to this survey automatically.'
            : null}
        </p>
      </div>
    </div>
  );
}
