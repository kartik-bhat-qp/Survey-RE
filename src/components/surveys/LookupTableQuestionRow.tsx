'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import { createDefaultLookupTableData } from '@/data/mock-survey-detail';
import { LookupTableQuestionPreview } from '@/components/surveys/LookupTableQuestionPreview';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './LookupTableQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface LookupTableQuestionRowProps {
  question: SurveyQuestion;
  sectionId: string;
  showHideOptionsApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation: () => void;
  onEditLookupTable: () => void;
  onBulkEdit: (sectionId: string, questionId: string) => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
}

export function LookupTableQuestionRow({
  question,
  sectionId,
  showHideOptionsApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onEditLookupTable,
  onBulkEdit,
  onQuestionTextChange,
}: LookupTableQuestionRowProps) {
  const lookupTable = question.lookupTable ?? createDefaultLookupTableData();

  return (
    <article className={styles.root}>
      <div className="lookupTableCard">
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
          <div className={styles.lookupWrap}>
            <LookupTableQuestionPreview
              data={{
                question: question.text,
                selectedValue: lookupTable.selectedValue,
              }}
              showQuestion={false}
            />
          </div>
          <div
            className={styles.toolsRow}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.editLookupBtn}
              aria-label="Edit lookup table"
              onClick={(event) => {
                event.stopPropagation();
                onEditLookupTable();
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
          className={styles.footer}
        />
      </div>
    </article>
  );
}
