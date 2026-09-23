/**
 * QuestionPro Pro Insights — pre-publish survey quality review (prototype).
 * Scoped to QUESTIONPRO_AI_LENS_SURVEY_ID only.
 * @see https://www.questionpro.com/help/2057.html
 */

import { QUESTIONPRO_AI_LENS_SURVEY_ID } from '@/data/mock-surveys';
import type { SurveySection } from '@/data/mock-survey-detail';

export { QUESTIONPRO_AI_LENS_SURVEY_ID };

export type AiLensSeverity = 'blocker' | 'warning' | 'advisory';
export type AiLensFindingStatus = 'open' | 'resolved' | 'dismissed' | 'passed';
export type AiLensCategory =
  | 'Logic and flow'
  | 'Methodology'
  | 'Accessibility'
  | 'Respondent experience'
  | 'Compliance';

export type AiLensPrimaryAction = 'delete' | 'fix-this' | 'suggest-fix' | 'ai-proposed';

export type AiLensSidebarFilter =
  | 'all'
  | 'blockers'
  | 'warnings'
  | 'advisories'
  | 'history'
  | 'resolved'
  | 'dismissed'
  | 'passed';

export type AiLensReadinessBand = 'Not ready' | 'Needs work' | 'Good' | 'Ready';

export interface AiLensFixPreview {
  rationale: string;
  before: string;
  after: string;
}

export interface AiLensFinding {
  id: string;
  severity: AiLensSeverity;
  status: AiLensFindingStatus;
  category: AiLensCategory;
  title: string;
  description: string;
  suggestedFix?: string;
  fixPreview?: AiLensFixPreview;
  affectedQuestion?: { code: string; text: string; questionId: string; sectionId: string };
  aiJudged?: boolean;
  confidence?: 'High confidence' | 'Medium confidence';
  /** When false, finding never affects readiness score (AI wording/coherence). */
  affectsScore: boolean;
  scorePenalty: number;
  primaryAction: AiLensPrimaryAction;
  primaryActionLabel: string;
}

export interface AiLensSummary {
  score: number;
  band: AiLensReadinessBand;
  estimatedMinutes: number;
  blockers: number;
  warnings: number;
  advisories: number;
  allOpen: number;
  resolved: number;
  dismissed: number;
  passed: number;
}

const SCORE_PENALTY: Record<AiLensSeverity, number> = {
  blocker: 25,
  warning: 8,
  advisory: 3,
};

const BLOCKER_SCORE_CAP = 49;

export function isAiLensSurvey(surveyId: number): boolean {
  return surveyId === QUESTIONPRO_AI_LENS_SURVEY_ID;
}

export function createAiLensSurveySections(): SurveySection[] {
  return [
    {
      id: 'section-ai-lens-1',
      title: 'Block 1',
      questions: [
        {
          id: 'q-ailens-1',
          code: 'Q1',
          number: 1,
          text: 'How satisfied are you with our product overall?',
          required: true,
          addQuestionTypeId: 'select-one',
          options: [
            { id: 'q-ailens-1-o1', label: 'Very satisfied' },
            { id: 'q-ailens-1-o2', label: 'Satisfied' },
            { id: 'q-ailens-1-o3', label: 'Dissatisfied' },
            { id: 'q-ailens-1-o4', label: 'Very dissatisfied' },
          ],
        },
        {
          id: 'q-ailens-2',
          code: 'Q2',
          number: 2,
          text: 'How do you describe your gender?',
          required: false,
          addQuestionTypeId: 'select-one',
          options: [
            { id: 'q-ailens-2-o1', label: 'Woman' },
            { id: 'q-ailens-2-o2', label: 'Man' },
            { id: 'q-ailens-2-o3', label: 'Non-binary' },
            { id: 'q-ailens-2-o4', label: 'Prefer not to say' },
          ],
        },
        {
          id: 'q-ailens-3',
          code: 'Q3',
          number: 3,
          text: 'Please share any additional feedback.',
          required: false,
          addQuestionTypeId: 'comment-box',
          options: [],
        },
        {
          id: 'q-ailens-10',
          code: 'Q10',
          number: 10,
          text: 'Which interior finishes did you select?',
          required: false,
          addQuestionTypeId: 'select-many',
          options: [
            { id: 'q-ailens-10-o1', label: 'Matte' },
            { id: 'q-ailens-10-o2', label: 'Gloss' },
            { id: 'q-ailens-10-o3', label: 'None of these' },
          ],
        },
      ],
    },
  ];
}

/** Baseline findings matching the Pro Insights screenshot / help-file categories. */
export const MOCK_AI_LENS_FINDINGS: AiLensFinding[] = [
  {
    id: 'f-logic-a1',
    severity: 'warning',
    status: 'open',
    category: 'Logic and flow',
    title: "Invalid criteria: 'A1_display_if_S6_any_and_S7_Me'",
    description:
      'Cannot be evaluated: it has no conditions defined. Nothing in this survey currently uses it, so no respondent is affected — this is cleanup, not a launch blocker.',
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.warning,
    primaryAction: 'delete',
    primaryActionLabel: 'Delete',
  },
  {
    id: 'f-logic-q10',
    severity: 'warning',
    status: 'open',
    category: 'Logic and flow',
    title: "Invalid criteria: 'Q10_interior_not_selected'",
    description:
      'Cannot be evaluated: it has no conditions defined. Nothing in this survey currently uses it, so no respondent is affected — this is cleanup, not a launch blocker.',
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.warning,
    primaryAction: 'delete',
    primaryActionLabel: 'Delete',
  },
  {
    id: 'f-method-gender',
    severity: 'warning',
    status: 'open',
    category: 'Methodology',
    title: 'Methodology wording',
    description:
      "The word 'gender' can be read as (a) gender identity (how someone describes themselves) or (b) sex assigned at birth, so different respondents may answer different questions.",
    suggestedFix: 'Replace the imprecise term with a specific one, or define it in the question.',
    fixPreview: {
      rationale:
        "Q2 ('How do you describe your gender?') uses an imprecise term that can be read as gender identity or sex assigned at birth, so respondents may answer different questions.",
      before:
        "Q2 — How do you describe your gender?\nOptions: Woman, Man, Non-binary, Prefer not to say",
      after:
        "Q2 — Which of the following best describes your gender identity?\nOptions: Woman, Man, Non-binary, Prefer to self-describe, Prefer not to say",
    },
    affectedQuestion: {
      code: 'Q2',
      text: 'How do you describe your gender?',
      questionId: 'q-ailens-2',
      sectionId: 'section-ai-lens-1',
    },
    aiJudged: true,
    confidence: 'High confidence',
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.warning,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-method-scale',
    severity: 'warning',
    status: 'open',
    category: 'Methodology',
    title: 'Unbalanced scale',
    description:
      'Q1 uses a 4-point satisfaction scale with no neutral midpoint, which can force respondents toward a polarity they do not hold.',
    suggestedFix: 'Add a neutral option (e.g. “Neither satisfied nor dissatisfied”).',
    fixPreview: {
      rationale:
        "Q1 ('How satisfied are you with our product overall?') is a 4-point satisfaction scale with no neutral midpoint, which can force respondents toward a polarity they do not hold.",
      before:
        'Q1 options: Very satisfied, Satisfied, Dissatisfied, Very dissatisfied',
      after:
        'Q1 options: Very satisfied, Satisfied, Neither satisfied nor dissatisfied, Dissatisfied, Very dissatisfied',
    },
    affectedQuestion: {
      code: 'Q1',
      text: 'How satisfied are you with our product overall?',
      questionId: 'q-ailens-1',
      sectionId: 'section-ai-lens-1',
    },
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.warning,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-a11y-matrix',
    severity: 'warning',
    status: 'open',
    category: 'Accessibility',
    title: 'Missing question label association',
    description:
      'One or more answer options are missing accessible name associations for screen readers (WCAG 1.3.1 / 4.1.2).',
    suggestedFix: 'Ensure each option has a visible label tied to its input control.',
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.warning,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-exp-opentext',
    severity: 'advisory',
    status: 'open',
    category: 'Respondent experience',
    title: 'Open-text burden',
    description:
      'Multiple open-ended questions increase completion time and drop-off risk for mobile respondents.',
    suggestedFix: 'Limit open text to essential probes, or make optional where possible.',
    affectedQuestion: {
      code: 'Q3',
      text: 'Please share any additional feedback.',
      questionId: 'q-ailens-3',
      sectionId: 'section-ai-lens-1',
    },
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.advisory,
    primaryAction: 'suggest-fix',
    primaryActionLabel: 'Suggest a fix',
  },
  {
    id: 'f-exp-length',
    severity: 'advisory',
    status: 'open',
    category: 'Respondent experience',
    title: 'Survey length estimate',
    description:
      'Estimated completion time exceeds 12 minutes for a feedback survey of this type, which can reduce completion rates.',
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.advisory,
    primaryAction: 'ai-proposed',
    primaryActionLabel: 'AI-proposed fix',
  },
  {
    id: 'f-comp-consent',
    severity: 'advisory',
    status: 'open',
    category: 'Compliance',
    title: 'Missing privacy disclosure',
    description:
      'Personal information may be collected, but no privacy or consent disclosure was detected near the start of the survey.',
    suggestedFix: 'Add a consent / privacy statement before collecting personal data.',
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.advisory,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-ai-wording-double',
    severity: 'advisory',
    status: 'open',
    category: 'Methodology',
    title: 'Possibly double-barrelled question',
    description:
      'AI wording check: Q1 may combine overall satisfaction with an implied product judgment in a single item.',
    suggestedFix: 'Split into separate questions if you need both constructs.',
    affectedQuestion: {
      code: 'Q1',
      text: 'How satisfied are you with our product overall?',
      questionId: 'q-ailens-1',
      sectionId: 'section-ai-lens-1',
    },
    aiJudged: true,
    confidence: 'Medium confidence',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'suggest-fix',
    primaryActionLabel: 'Suggest a fix',
  },
  {
    id: 'f-ai-coherence',
    severity: 'advisory',
    status: 'open',
    category: 'Methodology',
    title: 'Survey name vs. content coherence',
    description:
      'AI coherence check: the survey name “QuestionPro Pro Insights” does not clearly match the product-satisfaction theme of the questions.',
    aiJudged: true,
    confidence: 'Medium confidence',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'suggest-fix',
    primaryActionLabel: 'Suggest a fix',
  },
  // Additional warnings to approach screenshot density
  {
    id: 'f-logic-orphan-branch',
    severity: 'warning',
    status: 'open',
    category: 'Logic and flow',
    title: 'Unreachable question path',
    description:
      'A branch condition references an answer option that no longer exists on Q10, so respondents can never reach the intended follow-up.',
    affectedQuestion: {
      code: 'Q10',
      text: 'Which interior finishes did you select?',
      questionId: 'q-ailens-10',
      sectionId: 'section-ai-lens-1',
    },
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.warning,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-method-validation',
    severity: 'warning',
    status: 'open',
    category: 'Methodology',
    title: 'Missing validation on required question',
    description:
      'Q1 is marked required but has no validation message configured for empty submissions.',
    affectedQuestion: {
      code: 'Q1',
      text: 'How satisfied are you with our product overall?',
      questionId: 'q-ailens-1',
      sectionId: 'section-ai-lens-1',
    },
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.warning,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-a11y-contrast',
    severity: 'advisory',
    status: 'open',
    category: 'Accessibility',
    title: 'Low-contrast helper text',
    description:
      'Helper text under Q3 may fall below WCAG AA contrast against the default theme background.',
    affectsScore: true,
    scorePenalty: SCORE_PENALTY.advisory,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-passed-required',
    severity: 'advisory',
    status: 'passed',
    category: 'Methodology',
    title: 'Required questions marked clearly',
    description: 'Required questions include a visible required indicator.',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-passed-pagebreak',
    severity: 'advisory',
    status: 'passed',
    category: 'Respondent experience',
    title: 'Reasonable paging',
    description: 'Questions are grouped into blocks without excessive page breaks.',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-passed-codes',
    severity: 'advisory',
    status: 'passed',
    category: 'Logic and flow',
    title: 'Question codes unique',
    description: 'All question codes in this survey are unique.',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-passed-lang',
    severity: 'advisory',
    status: 'passed',
    category: 'Compliance',
    title: 'Default language set',
    description: 'A default survey language is configured.',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-passed-options',
    severity: 'advisory',
    status: 'passed',
    category: 'Methodology',
    title: 'Choice questions have options',
    description: 'All multiple-choice questions include at least two answer options.',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-passed-empty',
    severity: 'advisory',
    status: 'passed',
    category: 'Accessibility',
    title: 'No empty question text',
    description: 'Every question has non-empty question text.',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-passed-finish',
    severity: 'advisory',
    status: 'passed',
    category: 'Logic and flow',
    title: 'Finish path reachable',
    description: 'At least one path reaches the survey finish page.',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-passed-dup-options',
    severity: 'advisory',
    status: 'passed',
    category: 'Methodology',
    title: 'No duplicate answer labels',
    description: 'Answer options within each question use unique labels.',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
  {
    id: 'f-passed-mobile',
    severity: 'advisory',
    status: 'passed',
    category: 'Respondent experience',
    title: 'Mobile-friendly question types',
    description: 'No oversized matrix layouts detected for mobile viewports.',
    affectsScore: false,
    scorePenalty: 0,
    primaryAction: 'fix-this',
    primaryActionLabel: 'Fix this',
  },
];

export function getAiLensReadinessBand(score: number): AiLensReadinessBand {
  if (score <= 49) return 'Not ready';
  if (score <= 74) return 'Needs work';
  if (score <= 89) return 'Good';
  return 'Ready';
}

export function computeAiLensScore(findings: AiLensFinding[]): number {
  const openScoring = findings.filter(
    (f) => f.status === 'open' && f.affectsScore
  );
  if (findings.every((f) => f.status === 'passed') && openScoring.length === 0) {
    // empty survey edge case handled elsewhere; here assume questions exist
  }

  let score = 100;
  for (const finding of openScoring) {
    score -= finding.scorePenalty;
  }
  score = Math.max(0, Math.min(100, score));

  const hasBlocker = openScoring.some((f) => f.severity === 'blocker');
  if (hasBlocker) {
    score = Math.min(score, BLOCKER_SCORE_CAP);
  }
  return score;
}

export function summarizeAiLensFindings(findings: AiLensFinding[]): AiLensSummary {
  const open = findings.filter((f) => f.status === 'open');
  const blockers = open.filter((f) => f.severity === 'blocker').length;
  const warnings = open.filter((f) => f.severity === 'warning').length;
  const advisories = open.filter((f) => f.severity === 'advisory').length;
  const score = computeAiLensScore(findings);
  const estimatedMinutes = Math.max(3, Math.round(open.length * 1.1 + warnings * 0.4));

  return {
    score,
    band: getAiLensReadinessBand(score),
    estimatedMinutes,
    blockers,
    warnings,
    advisories,
    allOpen: open.length,
    resolved: findings.filter((f) => f.status === 'resolved').length,
    dismissed: findings.filter((f) => f.status === 'dismissed').length,
    passed: findings.filter((f) => f.status === 'passed').length,
  };
}

export function filterAiLensFindings(
  findings: AiLensFinding[],
  filter: AiLensSidebarFilter
): AiLensFinding[] {
  switch (filter) {
    case 'blockers':
      return findings.filter((f) => f.status === 'open' && f.severity === 'blocker');
    case 'warnings':
      return findings.filter((f) => f.status === 'open' && f.severity === 'warning');
    case 'advisories':
      return findings.filter((f) => f.status === 'open' && f.severity === 'advisory');
    case 'history':
      return findings.filter(
        (f) =>
          f.status === 'resolved' || f.status === 'dismissed' || f.status === 'passed'
      );
    case 'resolved':
      return findings.filter((f) => f.status === 'resolved');
    case 'dismissed':
      return findings.filter((f) => f.status === 'dismissed');
    case 'passed':
      return findings.filter((f) => f.status === 'passed');
    case 'all':
    default:
      return findings.filter((f) => f.status === 'open');
  }
}

export function groupAiLensFindingsByCategory(
  findings: AiLensFinding[]
): { category: AiLensCategory; findings: AiLensFinding[] }[] {
  const order: AiLensCategory[] = [
    'Logic and flow',
    'Methodology',
    'Accessibility',
    'Respondent experience',
    'Compliance',
  ];
  return order
    .map((category) => ({
      category,
      findings: findings.filter((f) => f.category === category),
    }))
    .filter((group) => group.findings.length > 0);
}

export function getAiLensCategoryIcon(category: AiLensCategory): string {
  switch (category) {
    case 'Logic and flow':
      return 'wm-account-tree';
    case 'Methodology':
      return 'wm-format-size';
    case 'Accessibility':
      return 'wm-accessibility';
    case 'Respondent experience':
      return 'wm-schedule';
    case 'Compliance':
      return 'wm-policy';
    default:
      return 'wm-info';
  }
}

export function cloneAiLensFindings(): AiLensFinding[] {
  return MOCK_AI_LENS_FINDINGS.map((finding) => ({
    ...finding,
    fixPreview: finding.fixPreview ? { ...finding.fixPreview } : undefined,
    affectedQuestion: finding.affectedQuestion
      ? { ...finding.affectedQuestion }
      : undefined,
  }));
}

export function getAiLensFixPreview(finding: AiLensFinding): AiLensFixPreview {
  if (finding.fixPreview) return finding.fixPreview;

  const questionLabel = finding.affectedQuestion
    ? `${finding.affectedQuestion.code} — ${finding.affectedQuestion.text}`
    : finding.title;

  return {
    rationale: finding.description,
    before: finding.affectedQuestion
      ? `${questionLabel}\nCurrent wording and settings as authored.`
      : finding.description,
    after: finding.suggestedFix
      ? `${questionLabel}\n${finding.suggestedFix}`
      : `${questionLabel}\nApply the recommended correction from Pro Insights.`,
  };
}

export function usesAiLensFixPreview(action: AiLensPrimaryAction): boolean {
  return action === 'fix-this' || action === 'suggest-fix' || action === 'ai-proposed';
}

export const AI_LENS_FOCUS_QUESTION_EVENT = 'questionpro-ai-lens-focus-question';

export interface AiLensFocusQuestionDetail {
  sectionId: string;
  questionId: string;
  code: string;
}

export function focusAiLensQuestion(detail: AiLensFocusQuestionDetail): void {
  window.dispatchEvent(new CustomEvent(AI_LENS_FOCUS_QUESTION_EVENT, { detail }));
}
