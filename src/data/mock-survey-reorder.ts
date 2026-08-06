import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import {
  isDeepDiveFollowUpConfigQuestion,
  isDeepDiveTargetSelected,
  placeDeepDiveImmediatelyAfterTarget,
  readDeepDiveFollowUpQuestionConfig,
} from '@/data/mock-deepdive-follow-up-question';

export interface ReorderQuestionRow {
  /** Stable id for drag identity: originalSectionId:questionId */
  id: string;
  sectionId: string;
  questionId: string;
  code: string;
  text: string;
  isDeepDive: boolean;
}

export function encodeReorderRowId(sectionId: string, questionId: string): string {
  return `${sectionId}:${questionId}`;
}

export function buildReorderQuestionRows(
  sections: SurveySection[],
  plainText: (value: string) => string
): ReorderQuestionRow[] {
  const rows: ReorderQuestionRow[] = [];
  for (const section of sections) {
    for (const question of section.questions) {
      rows.push({
        id: encodeReorderRowId(section.id, question.id),
        sectionId: section.id,
        questionId: question.id,
        code: question.code,
        text: plainText(question.text) || question.code,
        isDeepDive: isDeepDiveFollowUpConfigQuestion(question),
      });
    }
  }
  return rows;
}

export function moveReorderRow(
  rows: ReorderQuestionRow[],
  fromIndex: number,
  toIndex: number
): ReorderQuestionRow[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= rows.length ||
    toIndex >= rows.length ||
    fromIndex === toIndex
  ) {
    return rows;
  }

  const next = [...rows];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);

  // Keep sectionId aligned with neighboring questions after a move within a block list.
  // When dropping next to a question from another section, adopt that section.
  const neighbor = next[toIndex - 1] ?? next[toIndex + 1];
  if (neighbor) {
    next[toIndex] = { ...next[toIndex], sectionId: neighbor.sectionId };
  }

  return next;
}

/**
 * Rebuilds survey sections from a reordered flat row list.
 * Preserves original question objects; only order / section membership changes.
 */
export function applyReorderQuestionRows(
  sections: SurveySection[],
  rows: ReorderQuestionRow[]
): SurveySection[] {
  const questionById = new Map<string, SurveyQuestion>();
  for (const section of sections) {
    for (const question of section.questions) {
      questionById.set(encodeReorderRowId(section.id, question.id), question);
      // Also index by questionId alone as fallback if section changed.
      questionById.set(question.id, question);
    }
  }

  const questionsBySection = new Map<string, SurveyQuestion[]>();
  for (const section of sections) {
    questionsBySection.set(section.id, []);
  }

  for (const row of rows) {
    const question =
      questionById.get(row.id) ?? questionById.get(row.questionId) ?? null;
    if (!question) continue;
    const bucket = questionsBySection.get(row.sectionId);
    if (!bucket) continue;
    bucket.push(question);
  }

  return sections.map((section) => ({
    ...section,
    questions: questionsBySection.get(section.id) ?? [],
  }));
}

/**
 * Ensures DeepDive stays below its selected target after a reorder.
 * Returns whether an auto-correction was applied.
 */
export function enforceDeepDiveOrderAfterReorder(sections: SurveySection[]): {
  sections: SurveySection[];
  corrected: boolean;
} {
  let deepDiveSectionId = '';
  let deepDiveQuestionId = '';
  let targetSectionId = '';
  let targetQuestionId = '';

  for (const section of sections) {
    for (const question of section.questions) {
      if (!isDeepDiveFollowUpConfigQuestion(question)) continue;
      const config = readDeepDiveFollowUpQuestionConfig(question);
      if (!config || !isDeepDiveTargetSelected(config)) {
        return { sections, corrected: false };
      }
      deepDiveSectionId = section.id;
      deepDiveQuestionId = question.id;
      targetSectionId = config.targetSectionId;
      targetQuestionId = config.targetQuestionId;
      break;
    }
  }

  if (!deepDiveQuestionId || !targetQuestionId) {
    return { sections, corrected: false };
  }

  const flat: { sectionId: string; questionId: string }[] = [];
  for (const section of sections) {
    for (const question of section.questions) {
      flat.push({ sectionId: section.id, questionId: question.id });
    }
  }

  const deepDiveIndex = flat.findIndex(
    (item) =>
      item.sectionId === deepDiveSectionId && item.questionId === deepDiveQuestionId
  );
  const targetIndex = flat.findIndex(
    (item) => item.sectionId === targetSectionId && item.questionId === targetQuestionId
  );

  if (deepDiveIndex < 0 || targetIndex < 0 || targetIndex < deepDiveIndex) {
    return { sections, corrected: false };
  }

  return {
    sections: placeDeepDiveImmediatelyAfterTarget(
      sections,
      targetSectionId,
      targetQuestionId
    ),
    corrected: true,
  };
}
