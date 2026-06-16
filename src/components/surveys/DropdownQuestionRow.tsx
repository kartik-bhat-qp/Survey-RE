'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import { DropdownQuestionPreview } from '@/components/surveys/DropdownQuestionPreview';
import { QuestionRichTextField, plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './DropdownQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface DropdownQuestionRowProps {
  question: SurveyQuestion;
  sectionId: string;
  showHideOptionsApplied?: boolean;
  dynamicTextCommentsApplied?: boolean;
  extractionApplied?: boolean;
  quotaControlApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation: () => void;
  onBulkEdit: (sectionId: string, questionId: string) => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
}

export function DropdownQuestionRow({
  question,
  sectionId,
  showHideOptionsApplied = false,
  dynamicTextCommentsApplied = false,
  extractionApplied = false,
  quotaControlApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onBulkEdit,
  onQuestionTextChange,
}: DropdownQuestionRowProps) {
  const firstOptionLabel = question.options[0]?.label ?? 'Coke';
  const selectedValue = plainTextFromRichValue(firstOptionLabel) || 'Coke';

  return (
    <article className={styles.root}>
      <div className="dropdownCard">
        <div className={styles.cardInner}>
          <div className={styles.topBar}>
            <span className={styles.topSpacer} aria-hidden />
            <QuestionWorkspaceActions
              question={question}
              onAction={onAction}
              onOpenLogic={onOpenLogic}
              onOpenSettings={onOpenSettings}
              onOpenValidation={onOpenValidation}
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
          <div className={styles.dropdownWrap}>
            <DropdownQuestionPreview selectedValue={selectedValue} />
          </div>
          <div
            className={styles.toolsRow}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.editOptionsBtn}
              aria-label="Edit dropdown options"
              onClick={(event) => {
                event.stopPropagation();
                onBulkEdit(sectionId, question.id);
              }}
            >
              <span className="wm-edit" aria-hidden />
            </button>
            <span className={styles.toolsSpacer} aria-hidden />
            <button
              type="button"
              className={styles.bulkEditLink}
              onClick={(event) => {
                event.stopPropagation();
                onBulkEdit(sectionId, question.id);
              }}
            >
              Bulk Edit
            </button>
          </div>
        </div>
        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          dynamicTextCommentsApplied={dynamicTextCommentsApplied}
          extractionApplied={extractionApplied}
          quotaControlApplied={quotaControlApplied}
          className={styles.footer}
        />
      </div>
    </article>
  );
}
