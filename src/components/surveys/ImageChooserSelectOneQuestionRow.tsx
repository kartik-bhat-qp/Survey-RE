'use client';

import Image from 'next/image';
import type { SyntheticEvent } from 'react';
import type { SurveyQuestion, SurveyQuestionOption } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './ImageChooserSelectOneQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface ImageChooserSelectOneQuestionRowProps {
  question: SurveyQuestion;
  sectionId: string;
  cardClassName?: string;
  compactOptions?: boolean;
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
  onEditImage: (sectionId: string, questionId: string, optionId: string) => void;
  onAddOption: (sectionId: string, questionId: string) => void;
  onBulkEdit: (sectionId: string, questionId: string) => void;
}

function ImageChooserOptionCard({
  option,
  compact = false,
  onEditImage,
  onOptionLabelChange,
}: {
  option: SurveyQuestionOption;
  compact?: boolean;
  onEditImage: () => void;
  onOptionLabelChange: (label: string) => void;
}) {
  return (
    <li className={`${styles.option} ${compact ? styles.optionCompact : ''}`}>
      <button
        type="button"
        className={styles.imageButton}
        aria-label={`Edit image for ${option.label}`}
        onClick={(event) => {
          event.stopPropagation();
          onEditImage();
        }}
      >
        {option.imageSrc ? (
          <Image
            src={option.imageSrc}
            alt={option.imageAlt ?? option.label}
            width={160}
            height={120}
            className={styles.image}
          />
        ) : (
          <span className={styles.placeholder}>
            <span className={`wm-image ${styles.placeholderIcon}`} aria-hidden />
          </span>
        )}
        <span className={styles.editOverlay}>
          <span className={styles.editLabel}>Click to Edit Image</span>
        </span>
      </button>
      <div className={styles.optionLabel} onPointerDown={stopQuestionEvent}>
        <QuestionRichTextField
          variant="option"
          value={option.label}
          onChange={onOptionLabelChange}
          ariaLabel="Option label"
          placeholder="Option"
        />
      </div>
    </li>
  );
}

export function ImageChooserSelectOneQuestionRow({
  question,
  sectionId,
  cardClassName = 'imageChooserSelectOneCard',
  compactOptions = false,
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
  onEditImage,
  onAddOption,
  onBulkEdit,
}: ImageChooserSelectOneQuestionRowProps) {
  return (
    <article className={styles.root}>
      <div className={cardClassName}>
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
          <ul
            className={`${styles.options} ${compactOptions ? styles.optionsCompact : ''}`}
          >
            {question.options.map((option) => (
              <ImageChooserOptionCard
                key={option.id}
                option={option}
                compact={compactOptions}
                onEditImage={() => onEditImage(sectionId, question.id, option.id)}
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
              aria-label="Add option"
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
