'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion, SurveyQuestionOption } from '@/data/mock-survey-detail';
import {
  CONSTANT_SUM_PREFIX_PLACEHOLDER,
  CONSTANT_SUM_SUFFIX_PLACEHOLDER,
  CONSTANT_SUM_VALUE_PLACEHOLDER,
} from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './ConstantSumQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface ConstantSumQuestionRowProps {
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
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onOptionLabelChange: (
    sectionId: string,
    questionId: string,
    optionId: string,
    label: string
  ) => void;
  onAddOption: (sectionId: string, questionId: string) => void;
  onBulkEdit: (sectionId: string, questionId: string) => void;
}

function ConstantSumItemRow({
  option,
  onOptionLabelChange,
}: {
  option: SurveyQuestionOption;
  onOptionLabelChange: (label: string) => void;
}) {
  return (
    <li className={styles.row}>
      <div className={styles.rowLabel} onPointerDown={stopQuestionEvent}>
        <QuestionRichTextField
          variant="option"
          value={option.label}
          onChange={onOptionLabelChange}
          ariaLabel="Constant sum item label"
          placeholder="Item"
        />
      </div>
      <span className={styles.affixBox}>{CONSTANT_SUM_PREFIX_PLACEHOLDER}</span>
      <span className={styles.valueBox}>{CONSTANT_SUM_VALUE_PLACEHOLDER}</span>
      <span className={styles.affixBox}>{CONSTANT_SUM_SUFFIX_PLACEHOLDER}</span>
    </li>
  );
}

export function ConstantSumQuestionRow({
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
  onQuestionTextChange,
  onOptionLabelChange,
  onAddOption,
  onBulkEdit,
}: ConstantSumQuestionRowProps) {
  return (
    <article className={styles.root}>
      <div className="constantSumCard">
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
          <div className={styles.itemsWrap}>
            <ul className={styles.rows}>
              {question.options.map((option) => (
                <ConstantSumItemRow
                  key={option.id}
                  option={option}
                  onOptionLabelChange={(label) =>
                    onOptionLabelChange(sectionId, question.id, option.id, label)
                  }
                />
              ))}
            </ul>
            <div
              className={styles.optionTools}
              onClick={stopQuestionEvent}
              onKeyDown={stopQuestionEvent}
            >
              <button
                type="button"
                className={styles.addOptionBtn}
                aria-label="Add item"
                onClick={() => onAddOption(sectionId, question.id)}
              >
                <span className="wm-add" aria-hidden />
              </button>
              <span className={styles.optionToolsSpacer} aria-hidden />
              <button
                type="button"
                className={styles.bulkEditLink}
                onClick={() => onBulkEdit(sectionId, question.id)}
              >
                Bulk Edit Options
              </button>
            </div>
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
