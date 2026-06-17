'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion, SurveyQuestionKind } from '@/data/mock-survey-detail';
import { STATIC_CONTENT_TEXT_PLACEHOLDER } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './StaticContentQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export type StaticContentVariant = 'presentation' | 'section-heading' | 'section-subheading';

const CONTENT_WRAP_CLASS: Record<StaticContentVariant, string> = {
  presentation: styles.contentWrapPresentation,
  'section-heading': styles.contentWrapSectionHeading,
  'section-subheading': styles.contentWrapSectionSubheading,
};

export function resolveStaticContentVariant(question: SurveyQuestion): StaticContentVariant {
  if (question.kind === 'section-heading' || question.addQuestionTypeId === 'section-heading') {
    return 'section-heading';
  }
  if (question.kind === 'section-subheading' || question.addQuestionTypeId === 'section-subheading') {
    return 'section-subheading';
  }
  return 'presentation';
}

export function isStaticContentQuestionKind(
  kind?: SurveyQuestionKind,
  addQuestionTypeId?: string
): boolean {
  return (
    kind === 'presentation' ||
    kind === 'section-heading' ||
    kind === 'section-subheading' ||
    addQuestionTypeId === 'presentation' ||
    addQuestionTypeId === 'section-heading' ||
    addQuestionTypeId === 'section-subheading'
  );
}

export interface StaticContentQuestionRowProps {
  question: SurveyQuestion;
  sectionId: string;
  variant: StaticContentVariant;
  showHideOptionsApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
}

export function StaticContentQuestionRow({
  question,
  sectionId,
  variant,
  showHideOptionsApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onQuestionTextChange,
}: StaticContentQuestionRowProps) {
  return (
    <article className={styles.root}>
      <div className="staticContentCard">
        <div className={styles.cardInner}>
          <div className={styles.topBar}>
            <span className={styles.topSpacer} aria-hidden />
            <QuestionWorkspaceActions
              question={question}
              onAction={onAction}
              onOpenLogic={onOpenLogic}
              onOpenSettings={onOpenSettings}
              onMenuAction={onMenuAction}
              showValidation={false}
              menuBtnClassName={styles.menuBtn}
            />
          </div>
          <div
            className={`${styles.contentWrap} ${CONTENT_WRAP_CLASS[variant]}`}
            onPointerDown={stopQuestionEvent}
          >
            <QuestionRichTextField
              value={question.text}
              onChange={(text) => onQuestionTextChange(sectionId, question.id, text)}
              ariaLabel="Content text"
              placeholder={STATIC_CONTENT_TEXT_PLACEHOLDER}
            />
          </div>
        </div>
        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          className={styles.footer}
        />
      </div>
    </article>
  );
}
