'use client';

import type { SurveyQuestion } from '@/data/mock-survey-detail';
import { resolveAddQuestionTypeId } from '@/data/mock-survey-detail';
import {
  getAddQuestionAdvancedLicenseTooltip,
  shouldShowWorkspaceLicenseDiamond,
} from '@/data/mock-add-question-types';
import { useSurveyFooterBrand } from '@/components/surveys/useSurveyFooterBrand';
import { BiDiamondIcon } from '@/components/ui/BiDiamondIcon';
import {
  QuestionOptionsMenu,
  type QuestionMenuAction,
} from '@/components/surveys/QuestionOptionsMenu';
import styles from './QuestionWorkspaceActions.module.css';

export interface QuestionWorkspaceActionsProps {
  question: SurveyQuestion;
  onAction: (label: string) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation?: () => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  showValidation?: boolean;
  className?: string;
  menuBtnClassName?: string;
}

export function QuestionWorkspaceActions({
  question,
  onAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onMenuAction,
  showValidation = true,
  className,
  menuBtnClassName,
}: QuestionWorkspaceActionsProps) {
  const footerBrand = useSurveyFooterBrand();
  const typeId = resolveAddQuestionTypeId(question);
  const showDiamond = shouldShowWorkspaceLicenseDiamond(typeId, footerBrand);
  const licenseTooltip = typeId ? getAddQuestionAdvancedLicenseTooltip(typeId) : undefined;

  const actionsClassName = [styles.actions, className].filter(Boolean).join(' ');

  return (
    <div
      className={actionsClassName}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className={styles.validationGroup}>
        {showDiamond ? (
          <span className={styles.licenseDiamondWrap}>
            <BiDiamondIcon
              tooltip={licenseTooltip}
              position="top"
              className={styles.licenseDiamond}
            />
          </span>
        ) : null}
        {showValidation ? (
          <button
            type="button"
            className={styles.actionLink}
            onClick={() => (onOpenValidation ? onOpenValidation() : onAction('Validation'))}
          >
            Validation
          </button>
        ) : null}
      </div>
      <button type="button" className={styles.actionLink} onClick={() => onOpenLogic()}>
        Logic
      </button>
      <button
        type="button"
        className={styles.actionLink}
        onClick={(event) => {
          event.stopPropagation();
          onOpenSettings();
        }}
      >
        Settings
      </button>
      <QuestionOptionsMenu
        onAction={onMenuAction}
        triggerClassName={menuBtnClassName ?? styles.menuBtn}
      />
    </div>
  );
}
