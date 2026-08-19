'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { plainTextFromRichValue } from '@/components/surveys/rich-text-utils';
import type { SurveySection } from '@/data/mock-survey-detail';
import {
  applyReorderQuestionRows,
  buildReorderQuestionRows,
  enforceDeepDiveOrderAfterReorder,
  moveReorderRow,
  type ReorderQuestionRow,
} from '@/data/mock-survey-reorder';
import styles from './ReorderQuestionsModal.module.css';

interface ReorderQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SurveySection[];
  onApply: (sections: SurveySection[]) => void;
  /** Question that opened the modal — highlighted in the list. */
  focusSectionId?: string;
  focusQuestionId?: string;
}

function groupRowsBySection(
  rows: ReorderQuestionRow[],
  sections: SurveySection[]
): { sectionId: string; title: string; rows: { row: ReorderQuestionRow; index: number }[] }[] {
  const titleById = new Map(sections.map((section) => [section.id, section.title]));
  const groups: {
    sectionId: string;
    title: string;
    rows: { row: ReorderQuestionRow; index: number }[];
  }[] = [];

  const groupIndexBySection = new Map<string, number>();

  rows.forEach((row, index) => {
    let groupIdx = groupIndexBySection.get(row.sectionId);
    if (groupIdx === undefined) {
      groupIdx = groups.length;
      groupIndexBySection.set(row.sectionId, groupIdx);
      groups.push({
        sectionId: row.sectionId,
        title: titleById.get(row.sectionId) ?? 'Block',
        rows: [],
      });
    }
    groups[groupIdx].rows.push({ row, index });
  });

  return groups;
}

export function ReorderQuestionsModal({
  open,
  onOpenChange,
  sections,
  onApply,
  focusSectionId,
  focusQuestionId,
}: ReorderQuestionsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [rows, setRows] = useState<ReorderQuestionRow[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows(buildReorderQuestionRows(sections, plainTextFromRichValue));
    setDragIndex(null);
    setDropIndex(null);
  }, [open, sections]);

  const groups = useMemo(() => groupRowsBySection(rows, sections), [rows, sections]);
  const focusId =
    focusSectionId && focusQuestionId ? `${focusSectionId}:${focusQuestionId}` : null;

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  function handleMove(fromIndex: number, toIndex: number): void {
    setRows((prev) => moveReorderRow(prev, fromIndex, toIndex));
  }

  function handleSave(): void {
    let nextSections = applyReorderQuestionRows(sections, rows);
    const enforced = enforceDeepDiveOrderAfterReorder(nextSections);
    nextSections = enforced.sections;
    onApply(nextSections);
    handleModalOpenChange(false);

    if (enforced.corrected) {
      showToast({
        message: 'Questions reordered. DeepDive was kept below its target question.',
        variant: 'info',
      });
      return;
    }

    showToast({ message: 'Questions reordered', variant: 'success' });
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton, WuTooltip } =
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
        <span className={styles.headerTitle}>Reorder Questions</span>
        <WuTooltip
          content="Drag questions to change their order. DeepDive must stay below its target question."
          position="bottom"
        >
          <button type="button" className={styles.helpBtn} aria-label="Help">
            <span className="wm-help-outline" aria-hidden />
          </button>
        </WuTooltip>
      </WuModalHeader>

      <WuModalContent className={styles.content}>
        <p className={styles.hint}>
          Drag and drop questions to reorder them, or use the arrows. Click Save to apply.
        </p>

        {rows.length === 0 ? (
          <p className={styles.emptyState}>No questions available to reorder.</p>
        ) : (
          <div className={styles.list} role="list" aria-label="Questions">
            {groups.map((group) => (
              <div key={group.sectionId}>
                <div className={styles.sectionHeader}>{group.title}</div>
                {group.rows.map(({ row, index }) => {
                  const isFocus = focusId === row.id;
                  const isDragging = dragIndex === index;
                  const isDropTarget =
                    dropIndex === index && dragIndex !== null && dragIndex !== index;

                  return (
                    <div
                      key={row.id}
                      role="listitem"
                      draggable
                      className={
                        isDragging
                          ? styles.rowDragging
                          : isDropTarget
                            ? styles.rowDropTarget
                            : isFocus
                              ? styles.rowActive
                              : styles.row
                      }
                      onDragStart={(event) => {
                        setDragIndex(index);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', String(index));
                      }}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setDropIndex(null);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        if (dropIndex !== index) setDropIndex(index);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const from =
                          dragIndex ?? Number(event.dataTransfer.getData('text/plain'));
                        if (Number.isFinite(from)) {
                          handleMove(from, index);
                        }
                        setDragIndex(null);
                        setDropIndex(null);
                      }}
                    >
                      <span className={`wm-drag-indicator ${styles.dragHandle}`} aria-hidden />
                      <div className={styles.rowMain}>
                        <span className={styles.rowCode}>{row.code}</span>
                        <span className={styles.rowText}>{row.text}</span>
                      </div>
                      <div className={styles.moveButtons}>
                        {row.isDeepDive ? (
                          <span className={styles.rowBadge}>DeepDive</span>
                        ) : null}
                        <button
                          type="button"
                          className={styles.moveBtn}
                          aria-label={`Move ${row.code} up`}
                          disabled={index === 0}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMove(index, index - 1);
                          }}
                        >
                          <span className="wm-keyboard-arrow-up" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className={styles.moveBtn}
                          aria-label={`Move ${row.code} down`}
                          disabled={index === rows.length - 1}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMove(index, index + 1);
                          }}
                        >
                          <span className="wm-keyboard-arrow-down" aria-hidden />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </WuModalContent>

      <WuModalFooter className={styles.footer}>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleSave} disabled={rows.length === 0}>
          Save
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
