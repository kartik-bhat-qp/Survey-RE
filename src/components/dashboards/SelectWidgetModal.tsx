'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { LICENSE_DIAMOND_TOOLTIP } from '@/data/mock-advanced-widget-types';
import { PUBLIC_IMAGES } from '@/lib/public-images';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './SelectWidgetModal.module.css';

const WuHelpButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHelpButton })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

export type WidgetPickerType = 'question-based' | 'advanced';

interface SelectWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyName?: string;
  /** When true, question-based path is disabled (e.g. dashboard already has widgets). */
  questionBasedDisabled?: boolean;
  onSelectType?: (type: WidgetPickerType) => void;
  onSelectQuestionBased?: () => void;
  /** Skips survey picker and opens the question list for the dashboard survey. */
  onContinueWithSurvey?: () => void;
  onSelectAdvanced?: () => void;
}

const QUESTION_BASED_DISABLED_MESSAGE =
  'Question based widgets can only be added when the dashboard has no widgets yet.';

type HoverCard = 'question-based' | 'advanced' | undefined;

export function SelectWidgetModal({
  open,
  onOpenChange,
  surveyName = 'QuestionPro - RE',
  questionBasedDisabled = false,
  onSelectType,
  onSelectQuestionBased,
  onContinueWithSurvey,
  onSelectAdvanced,
}: SelectWidgetModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [hovered, setHovered] = useState<HoverCard>(undefined);
  const [surveyFooterHover, setSurveyFooterHover] = useState(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setHovered(undefined);
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  const handleSelect = (type: WidgetPickerType): void => {
    if (type === 'question-based' && questionBasedDisabled) {
      showToast({ message: QUESTION_BASED_DISABLED_MESSAGE, variant: 'error' });
      return;
    }
    onSelectType?.(type);
    if (type === 'question-based') {
      handleOpenChange(false);
      onSelectQuestionBased?.();
      return;
    }
    handleOpenChange(false);
    onSelectAdvanced?.();
  };

  const handleSurveyFooterClick = (): void => {
    onSelectType?.('question-based');
    handleOpenChange(false);
    onContinueWithSurvey?.();
  };

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={styles.modal}
      variant="action"
    >
      <WuModalHeader className={`${styles.header} ${styles.modalTitle}`}>
        Select your widget
      </WuModalHeader>

      <WuModalContent className={styles.content}>
        <div className={styles.cardGrid}>
          <div
            role={questionBasedDisabled ? undefined : 'button'}
            tabIndex={questionBasedDisabled ? -1 : 0}
            aria-disabled={questionBasedDisabled}
            className={`${styles.card} ${questionBasedDisabled ? styles.cardDisabled : ''}`}
            onClick={
              questionBasedDisabled ? undefined : () => handleSelect('question-based')
            }
            onKeyDown={
              questionBasedDisabled
                ? undefined
                : (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect('question-based');
                    }
                  }
            }
            onMouseEnter={
              questionBasedDisabled ? undefined : () => setHovered('question-based')
            }
            onMouseLeave={questionBasedDisabled ? undefined : () => setHovered(undefined)}
          >
            <Image
              src={
                hovered === 'question-based'
                  ? PUBLIC_IMAGES.addWidget.questionBasedActive
                  : PUBLIC_IMAGES.addWidget.questionBasedDefault
              }
              alt="Question based"
              width={64}
              height={64}
              className={styles.cardIcon}
            />
            <div className={styles.cardText}>
              <div className={styles.cardTitle}>
                <span className={styles.cardTitleText}>Question based</span>
                <span
                  className={styles.diamondWrap}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <WuTooltip content={LICENSE_DIAMOND_TOOLTIP} position="bottom">
                    <span className={styles.diamondIcon} aria-label={LICENSE_DIAMOND_TOOLTIP}>
                      <span className="wm-diamond" />
                    </span>
                  </WuTooltip>
                </span>
              </div>
              <p className={styles.cardDescription}>Widgets based on survey question</p>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            className={styles.card}
            onClick={() => handleSelect('advanced')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect('advanced');
              }
            }}
            onMouseEnter={() => setHovered('advanced')}
            onMouseLeave={() => setHovered(undefined)}
          >
            <Image
              src={
                hovered === 'advanced'
                  ? PUBLIC_IMAGES.addWidget.advancedWidgetsActive
                  : PUBLIC_IMAGES.addWidget.advancedWidgetsDefault
              }
              alt="Advanced widgets"
              width={64}
              height={64}
              className={styles.cardIcon}
            />
            <div className={styles.cardText}>
              <div className={styles.cardTitle}>
                Advanced widgets
                <span
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <WuHelpButton
                    idOrSlugOrUrl="advanced-widgets"
                    variant="primary"
                    onClick={() =>
                      showToast({
                        message:
                          'Widgets based on multiple questions, surveys, or survey stacks',
                        variant: 'success',
                      })
                    }
                  />
                </span>
              </div>
              <p className={styles.cardDescription}>
                Widgets based on multiple questions, surveys, or survey stacks
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.surveyFooter}
          onClick={handleSurveyFooterClick}
          onMouseEnter={() => setSurveyFooterHover(true)}
          onMouseLeave={() => setSurveyFooterHover(false)}
        >
          <span className={styles.surveyFooterLabel}>
            {surveyFooterHover ? 'Reopen' : 'Continue using this survey'}
          </span>
          <span className={styles.surveyFooterName}>{surveyName}</span>
        </button>
      </WuModalContent>
    </WuModal>
  );
}
