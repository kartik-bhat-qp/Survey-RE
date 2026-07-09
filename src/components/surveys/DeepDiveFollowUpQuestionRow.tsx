'use client';

import dynamic from 'next/dynamic';
import { useMemo, type SyntheticEvent } from 'react';
import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import type { DeepDiveFollowUpQuestionConfig } from '@/data/mock-deepdive-question-settings';
import {
  DEEPDIVE_TARGET_QUESTION_DEFAULT_OPTION,
  DEEPDIVE_TARGET_QUESTION_PLACEHOLDER,
  DEEPDIVE_TARGET_QUESTION_UNSET_VALUE,
  isDeepDiveTargetSelected,
  listDeepDiveTargetQuestionOptions,
} from '@/data/mock-deepdive-follow-up-question';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './DeepDiveFollowUpQuestionRow.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface DeepDiveFollowUpQuestionRowProps {
  question: SurveyQuestion;
  sectionId: string;
  sections: SurveySection[];
  config: DeepDiveFollowUpQuestionConfig;
  showHideOptionsApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onConfigChange: (config: DeepDiveFollowUpQuestionConfig) => void;
}

export function DeepDiveFollowUpQuestionRow({
  question,
  sectionId,
  sections,
  config,
  showHideOptionsApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onQuestionTextChange,
  onConfigChange,
}: DeepDiveFollowUpQuestionRowProps) {
  const targetOptions = useMemo(
    () => [
      DEEPDIVE_TARGET_QUESTION_DEFAULT_OPTION,
      ...listDeepDiveTargetQuestionOptions(sections),
    ],
    [sections]
  );
  const targetValue = isDeepDiveTargetSelected(config)
    ? targetOptions.find(
        (option) =>
          option.sectionId === config.targetSectionId &&
          option.questionId === config.targetQuestionId
      ) ?? DEEPDIVE_TARGET_QUESTION_DEFAULT_OPTION
    : DEEPDIVE_TARGET_QUESTION_DEFAULT_OPTION;

  function patchTarget(sectionIdValue: string, questionIdValue: string): void {
    onConfigChange({
      ...config,
      targetSectionId: sectionIdValue,
      targetQuestionId: questionIdValue,
      probeWhen: 'any-answer',
      probeWhenOptionId: undefined,
    });
  }

  return (
    <article className={styles.root}>
      <div className="deepDiveCard">
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

          <div className={styles.questionTextWrap}>
            <QuestionRichTextField
              value={question.text}
              onChange={(text) => onQuestionTextChange(sectionId, question.id, text)}
              ariaLabel="Question text"
              placeholder="Enter question text"
              onPointerDown={stopQuestionEvent}
            />
          </div>

          <div
            className={styles.targetField}
            onPointerDown={stopQuestionEvent}
            onClick={(event) => event.stopPropagation()}
          >
            <span className={styles.fieldLabel}>Target Question</span>
            <div className={styles.selectWrap}>
              <WuSelect
                data={targetOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={targetValue}
                onSelect={(item) => {
                  const selected = item as { sectionId: string; questionId: string; value: string };
                  if (selected.value === DEEPDIVE_TARGET_QUESTION_UNSET_VALUE) {
                    patchTarget('', '');
                    return;
                  }
                  patchTarget(selected.sectionId, selected.questionId);
                }}
                variant="outlined"
                placeholder={DEEPDIVE_TARGET_QUESTION_PLACEHOLDER}
              />
            </div>
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
