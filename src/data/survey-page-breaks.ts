import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import type { CriterionCondition } from '@/data/mock-criteria-engine';
import type { ShowHideOptionsPreviewConfig } from '@/data/show-hide-options-preview';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import { toQuestionPreviewFollowUp } from '@/data/survey-question-preview-utils';

export function showHideReferencesEarlierQuestions(
  config: ShowHideOptionsPreviewConfig | null | undefined,
  surveyId: number,
  sections: SurveySection[],
  anchorQuestionId: string
): boolean {
  if (!config) return false;

  const catalog = getQuestionsBySurvey(surveyId);
  const ordered = getOrderedSurveyQuestionsWithSections(sections);
  const anchorIndex = ordered.findIndex((item) => item.question.id === anchorQuestionId);
  if (anchorIndex <= 0) return false;

  const referencedCodes = new Set<string>();
  for (const criterion of config.criteria) {
    for (const cond of criterion.conditions) {
      if (!isQuestionCondition(cond)) continue;
      const catalogQuestion = catalog.find((question) => question.id === cond.questionId);
      if (catalogQuestion) referencedCodes.add(catalogQuestion.code);
    }
  }

  for (let index = 0; index < anchorIndex; index += 1) {
    if (referencedCodes.has(ordered[index].question.code)) {
      return true;
    }
  }

  return false;
}

function isQuestionCondition(
  cond: CriterionCondition
): cond is CriterionCondition & { questionId: number } {
  return cond.source === 'Question' && cond.questionId !== null;
}

export interface PreviewFollowUpBuilder {
  (sectionId: string, question: SurveyQuestion): SurveyQuestionPreviewFollowUp;
}

export function getPageBreakSlotKey(
  sectionId: string,
  insertIndex: number,
  questions: SurveyQuestion[]
): string {
  if (insertIndex === 0) return `${sectionId}:start`;
  const anchorQuestion = questions[insertIndex - 1];
  return anchorQuestion
    ? `${sectionId}:after:${anchorQuestion.id}`
    : `${sectionId}:slot:${insertIndex}`;
}

export function hasPageBreakAtSlot(
  pageBreakBySlotKey: Record<string, boolean>,
  slotKey: string
): boolean {
  return pageBreakBySlotKey[slotKey] ?? true;
}

export function hasPageBreakBeforeQuestion(
  sections: SurveySection[],
  sectionId: string,
  questionId: string,
  pageBreakBySlotKey: Record<string, boolean>
): boolean {
  const section = sections.find((item) => item.id === sectionId);
  if (!section) return true;

  const questionIndex = section.questions.findIndex((question) => question.id === questionId);
  if (questionIndex < 0) return true;

  if (questionIndex === 0) {
    return hasPageBreakAtSlot(
      pageBreakBySlotKey,
      getPageBreakSlotKey(sectionId, 0, section.questions)
    );
  }

  return hasPageBreakAtSlot(
    pageBreakBySlotKey,
    getPageBreakSlotKey(sectionId, questionIndex, section.questions)
  );
}

export interface OrderedSurveyQuestion {
  sectionId: string;
  question: SurveyQuestion;
}

export function getOrderedSurveyQuestionsWithSections(
  sections: SurveySection[]
): OrderedSurveyQuestion[] {
  const ordered: OrderedSurveyQuestion[] = [];
  for (const section of sections) {
    for (const question of section.questions) {
      ordered.push({ sectionId: section.id, question });
    }
  }
  return ordered;
}

export function collectPreviewPagesBeforeQuestion(
  sections: SurveySection[],
  sectionId: string,
  questionId: string,
  pageBreakBySlotKey: Record<string, boolean>,
  buildFollowUp: PreviewFollowUpBuilder = (itemSectionId, question) =>
    toQuestionPreviewFollowUp(question)
): SurveyQuestionPreviewFollowUp[][] {
  const ordered = getOrderedSurveyQuestionsWithSections(sections);
  const startIndex = ordered.findIndex(
    (item) => item.sectionId === sectionId && item.question.id === questionId
  );
  if (startIndex <= 0) return [];

  const pages: SurveyQuestionPreviewFollowUp[][] = [];
  let currentPage: SurveyQuestionPreviewFollowUp[] = [];

  for (let index = 0; index < startIndex; index += 1) {
    const { sectionId: itemSectionId, question } = ordered[index];
    const breakBeforeQuestion = hasPageBreakBeforeQuestion(
      sections,
      itemSectionId,
      question.id,
      pageBreakBySlotKey
    );

    if (breakBeforeQuestion && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
    }

    currentPage.push(buildFollowUp(itemSectionId, question));
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

export function collectPreviewPagesAfterQuestion(
  sections: SurveySection[],
  sectionId: string,
  questionId: string,
  pageBreakBySlotKey: Record<string, boolean>,
  buildFollowUp: PreviewFollowUpBuilder = (itemSectionId, question) =>
    toQuestionPreviewFollowUp(question)
): {
  samePageFollowUps: SurveyQuestionPreviewFollowUp[];
  nextPages: SurveyQuestionPreviewFollowUp[][];
} {
  const ordered = getOrderedSurveyQuestionsWithSections(sections);
  const startIndex = ordered.findIndex(
    (item) => item.sectionId === sectionId && item.question.id === questionId
  );
  if (startIndex < 0) {
    return { samePageFollowUps: [], nextPages: [] };
  }

  const samePageFollowUps: SurveyQuestionPreviewFollowUp[] = [];
  const nextPages: SurveyQuestionPreviewFollowUp[][] = [];
  let currentPage: SurveyQuestionPreviewFollowUp[] = [];
  let reachedPageBreak = false;

  for (let index = startIndex + 1; index < ordered.length; index += 1) {
    const { sectionId: itemSectionId, question } = ordered[index];
    const breakBeforeQuestion = hasPageBreakBeforeQuestion(
      sections,
      itemSectionId,
      question.id,
      pageBreakBySlotKey
    );
    const followUp = buildFollowUp(itemSectionId, question);

    if (!reachedPageBreak) {
      if (breakBeforeQuestion) {
        reachedPageBreak = true;
        currentPage = [followUp];
      } else {
        samePageFollowUps.push(followUp);
      }
      continue;
    }

    if (breakBeforeQuestion && currentPage.length > 0) {
      nextPages.push(currentPage);
      currentPage = [];
    }
    currentPage.push(followUp);
  }

  if (reachedPageBreak && currentPage.length > 0) {
    nextPages.push(currentPage);
  }

  return {
    samePageFollowUps,
    nextPages,
  };
}
