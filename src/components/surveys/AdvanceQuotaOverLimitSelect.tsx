'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  buildAdvanceQuotaOverLimitBranchingOptions,
  buildAdvanceQuotaOverLimitPrimaryOptions,
  findAdvanceQuotaOverLimitOption,
} from '@/data/mock-advance-quotas';
import type { BranchTargetOption } from '@/data/mock-question-logic';
import styles from './AdvanceQuotaOverLimitSelect.module.css';

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

interface AdvanceQuotaOverLimitSelectProps {
  surveyId: number;
  currentQuestionId: number;
  value: string;
  onChange: (next: string) => void;
}

function MenuOption({
  option,
  selected,
  onSelect,
}: {
  option: BranchTargetOption;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <WuMenuItem onSelect={() => onSelect(option.value)}>
      <span className={selected ? styles.menuItemSelected : styles.menuItemLabel}>
        {option.label}
      </span>
    </WuMenuItem>
  );
}

export function AdvanceQuotaOverLimitSelect({
  surveyId,
  currentQuestionId,
  value,
  onChange,
}: AdvanceQuotaOverLimitSelectProps) {
  const primaryOptions = useMemo(() => buildAdvanceQuotaOverLimitPrimaryOptions(), []);
  const branchingOptions = useMemo(
    () => buildAdvanceQuotaOverLimitBranchingOptions(surveyId, currentQuestionId),
    [surveyId, currentQuestionId]
  );
  const selected =
    findAdvanceQuotaOverLimitOption(surveyId, currentQuestionId, value) ??
    primaryOptions.find((option) => option.value === 'quota-overlimit') ??
    primaryOptions[0];

  return (
    <WuMenu
      Trigger={
        <button type="button" className={styles.menuTrigger}>
          <span className={styles.menuTriggerLabel}>{selected.label}</span>
          <span className={`wm-keyboard-arrow-down ${styles.menuCaret}`} aria-hidden />
        </button>
      }
      align="start"
    >
      <div className={styles.menuScroll}>
        {primaryOptions.map((option) => (
          <MenuOption
            key={option.value}
            option={option}
            selected={option.value === value}
            onSelect={onChange}
          />
        ))}
        <div className={styles.menuDivider} aria-hidden />
        {branchingOptions.map((option) => (
          <MenuOption
            key={option.value}
            option={option}
            selected={option.value === value}
            onSelect={onChange}
          />
        ))}
      </div>
    </WuMenu>
  );
}
