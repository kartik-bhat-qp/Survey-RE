'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { plainTextFromRichValue } from '@/components/surveys/rich-text-utils';
import {
  useSurveyWorkspaceSections,
  type QuestionCodeUpdate,
} from '@/components/surveys/SurveyWorkspaceSectionsContext';
import type { SurveySection } from '@/data/mock-survey-detail';
import styles from './UpdateQuestionCodesModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface QuestionRowState {
  sectionId: string;
  questionId: string;
  code: string;
  text: string;
  selected: boolean;
}

interface UpdateQuestionCodesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildQuestionRows(sections: SurveySection[]): QuestionRowState[] {
  return sections.flatMap((section) =>
    section.questions.map((question) => ({
      sectionId: section.id,
      questionId: question.id,
      code: question.code,
      text: plainTextFromRichValue(question.text),
      selected: true,
    }))
  );
}

function getDuplicateCodes(rows: QuestionRowState[]): Set<string> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const normalized = row.code.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return new Set(
    [...counts.entries()].filter(([, count]) => count > 1).map(([code]) => code)
  );
}

function rowKey(sectionId: string, questionId: string): string {
  return `${sectionId}:${questionId}`;
}

export function UpdateQuestionCodesModal({
  open,
  onOpenChange,
}: UpdateQuestionCodesModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const { sections, updateQuestionCodes } = useSurveyWorkspaceSections();
  const [rows, setRows] = useState<QuestionRowState[]>([]);

  useEffect(() => {
    if (!open) return;
    setRows(buildQuestionRows(sections));
  }, [open, sections]);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  const duplicateCodes = useMemo(() => getDuplicateCodes(rows), [rows]);
  const selectedQuestionIds = useMemo(
    () =>
      new Set(
        rows
          .filter((row) => row.selected)
          .map((row) => rowKey(row.sectionId, row.questionId))
      ),
    [rows]
  );
  const allSelected =
    rows.length > 0 && rows.every((row) => row.selected);
  const hasEmptySelectedCode = rows.some(
    (row) => row.selected && !row.code.trim()
  );
  const hasDuplicateCodes = duplicateCodes.size > 0;
  const canSave =
    rows.some((row) => row.selected) &&
    !hasEmptySelectedCode &&
    !hasDuplicateCodes;

  const toggleSelectAll = useCallback((checked: boolean) => {
    setRows((prev) => prev.map((row) => ({ ...row, selected: checked })));
  }, []);

  const toggleSectionSelected = useCallback(
    (sectionId: string, checked: boolean) => {
      setRows((prev) =>
        prev.map((row) =>
          row.sectionId === sectionId ? { ...row, selected: checked } : row
        )
      );
    },
    []
  );

  const toggleQuestionSelected = useCallback(
    (sectionId: string, questionId: string, checked: boolean) => {
      setRows((prev) =>
        prev.map((row) =>
          row.sectionId === sectionId && row.questionId === questionId
            ? { ...row, selected: checked }
            : row
        )
      );
    },
    []
  );

  const updateQuestionCode = useCallback(
    (sectionId: string, questionId: string, code: string) => {
      setRows((prev) =>
        prev.map((row) =>
          row.sectionId === sectionId && row.questionId === questionId
            ? { ...row, code }
            : row
        )
      );
    },
    []
  );

  function handleSave(): void {
    if (!canSave) return;

    const updates: QuestionCodeUpdate[] = rows
      .filter((row) => row.selected)
      .map((row) => ({
        sectionId: row.sectionId,
        questionId: row.questionId,
        code: row.code.trim(),
      }));

    updateQuestionCodes(updates);
    showToast({ message: 'Question codes updated', variant: 'success' });
    handleModalOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      className={styles.modal}
      variant="action"
      size="md"
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>Update Question Codes</span>
        <WuTooltip
          content="Edit the short codes used for each question. Each code must be unique."
          position="bottom"
        >
          <button type="button" className={styles.helpBtn} aria-label="Help">
            <span className="wm-help-outline" aria-hidden />
          </button>
        </WuTooltip>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        {sections.length === 0 ? (
          <p className={styles.emptyState}>No questions available to update.</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.checkCol}>
                <WuCheckbox
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all questions"
                />
              </div>
              <div className={styles.codeCol}>Question Code</div>
              <div className={styles.textCol}>Question Text</div>
            </div>

            {sections.map((section) => {
              const sectionRows = rows.filter((row) => row.sectionId === section.id);
              const sectionAllSelected =
                sectionRows.length > 0 &&
                sectionRows.every((row) => row.selected);

              return (
                <div key={section.id}>
                  <div className={styles.blockRow}>
                    <div className={styles.checkCol}>
                      <WuCheckbox
                        checked={sectionAllSelected}
                        onChange={(checked) =>
                          toggleSectionSelected(section.id, checked)
                        }
                        aria-label={`Select ${section.title}`}
                      />
                    </div>
                    <div className={styles.codeCol}>{section.title}</div>
                    <div className={styles.textCol} aria-hidden />
                  </div>

                  {sectionRows.map((row, rowIndex) => {
                    const trimmedCode = row.code.trim();
                    const hasDuplicate =
                      trimmedCode.length > 0 && duplicateCodes.has(trimmedCode);

                    return (
                      <div
                        key={rowKey(row.sectionId, row.questionId)}
                        className={`${styles.questionRow} ${
                          rowIndex % 2 === 1 ? styles.questionRowAlt : ''
                        }`}
                      >
                        <div className={styles.checkCol}>
                          <WuCheckbox
                            checked={selectedQuestionIds.has(
                              rowKey(row.sectionId, row.questionId)
                            )}
                            onChange={(checked) =>
                              toggleQuestionSelected(
                                row.sectionId,
                                row.questionId,
                                checked
                              )
                            }
                            aria-label={`Select question ${row.code || row.text}`}
                          />
                        </div>
                        <div className={styles.codeCol}>
                          <WuInput
                            variant="outlined"
                            value={row.code}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                              updateQuestionCode(
                                row.sectionId,
                                row.questionId,
                                event.target.value
                              )
                            }
                            aria-label={`Question code for ${row.text || row.code}`}
                            aria-invalid={hasDuplicate}
                            className={`${styles.codeInput} ${
                              hasDuplicate ? styles.codeInputError : ''
                            }`}
                          />
                        </div>
                        <div className={styles.textCol}>{row.text}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {hasDuplicateCodes ? (
          <p className={styles.validationBanner} role="alert">
            Each question code must be unique. Resolve duplicate codes before saving.
          </p>
        ) : null}
        {hasEmptySelectedCode ? (
          <p className={styles.validationBanner} role="alert">
            Selected questions must have a question code.
          </p>
        ) : null}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleSave} disabled={!canSave}>
          Save
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
