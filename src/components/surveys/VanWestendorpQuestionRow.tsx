'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import { createDefaultVanWestendorpData } from '@/data/mock-survey-detail';
import { VanWestendorpQuestionPreview } from '@/components/surveys/VanWestendorpQuestionPreview';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './VanWestendorpQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface VanWestendorpQuestionRowProps {
  question: SurveyQuestion;
  sectionId: string;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
}

export function VanWestendorpQuestionRow({
  question,
  sectionId,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onQuestionTextChange,
}: VanWestendorpQuestionRowProps) {
  const vanWestendorp = question.vanWestendorp ?? createDefaultVanWestendorpData();

  return (
    <article className={styles.root}>
      <div className="vanWestendorpCard">
        <div className={styles.cardInner}>
          <div className={styles.topBar}>
            <span className={styles.topSpacer} aria-hidden />
            <QuestionWorkspaceActions
              question={question}
              onAction={onAction}
              onOpenLogic={onOpenLogic}
              onOpenSettings={onOpenSettings}
              onMenuAction={onMenuAction}
              menuBtnClassName={styles.menuBtn}
            />
          </div>
          <div className={styles.questionTextWrap}>
            {question.required ? <span className={styles.required}>*</span> : null}
            <QuestionRichTextField
              value={question.text}
              onChange={(text) => onQuestionTextChange(sectionId, question.id, text)}
              ariaLabel="Question text"
              placeholder="Enter question text"
              onPointerDown={stopQuestionEvent}
            />
          </div>
          <div className={styles.meterWrap}>
            <VanWestendorpQuestionPreview
              data={{
                title: '',
                priceLabel: vanWestendorp.priceLabel,
                rows: vanWestendorp.rows,
              }}
              showTitle={false}
              variant="workspace"
            />
          </div>
        </div>
        <div
          className={styles.footer}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <span className={`wm-check-circle ${styles.footerIcon}`} aria-hidden />
        </div>
      </div>
    </article>
  );
}
