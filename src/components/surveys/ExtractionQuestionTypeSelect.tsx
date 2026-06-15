'use client';

import dynamic from 'next/dynamic';
import {
  EXTRACTION_QUESTION_TYPE_GROUPS,
  findExtractionQuestionTypeOption,
  type ExtractionQuestionType,
} from '@/data/mock-question-logic';
import styles from './ExtractionQuestionTypeSelect.module.css';

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

interface ExtractionQuestionTypeSelectProps {
  value: ExtractionQuestionType;
  onChange: (next: ExtractionQuestionType) => void;
}

export function ExtractionQuestionTypeSelect({
  value,
  onChange,
}: ExtractionQuestionTypeSelectProps) {
  const selected =
    findExtractionQuestionTypeOption(value) ?? EXTRACTION_QUESTION_TYPE_GROUPS[0].options[0];

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
        {EXTRACTION_QUESTION_TYPE_GROUPS.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 ? <div className={styles.groupDivider} aria-hidden /> : null}
            <div className={styles.groupHeader} role="presentation">
              {group.label}
            </div>
            {group.options.map((option) => (
              <WuMenuItem
                key={option.value}
                onSelect={() => onChange(option.value as ExtractionQuestionType)}
              >
                <span
                  className={
                    option.value === value ? styles.menuItemSelected : styles.menuItemLabel
                  }
                >
                  {option.label}
                </span>
              </WuMenuItem>
            ))}
          </div>
        ))}
      </div>
    </WuMenu>
  );
}
