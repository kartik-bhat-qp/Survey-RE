/** Templates shown per page in the create-survey template picker. */
export const SURVEY_CREATION_TEMPLATES_PER_PAGE = 6;

export type { SurveyCreationTemplate } from '@/data/mock-survey-creation-templates';
export {
  SURVEY_CREATION_TEMPLATE_COUNT,
  SURVEY_CREATION_TEMPLATES,
  filterSurveyCreationTemplates,
} from '@/data/mock-survey-creation-templates';

export {
  SURVEY_CREATION_LANGUAGES,
  DEFAULT_SURVEY_CREATION_LANGUAGE,
  getSurveyCreationLanguageLabel,
  getSurveyCreationLanguageShortLabel,
} from '@/data/mock-survey-creation-languages';

export const SURVEY_CREATION_PROMPT_PLACEHOLDER =
  'e.g. A short feedback survey for customers who just finished onboarding…';

/** Placeholder for the AI-first prompt on the surveys list. */
export const SURVEYS_LIST_AI_PROMPT_PLACEHOLDER =
  "Describe what you're trying to learn, or paste your survey questions to get started";

export type SurveyCreationMode = 'idea' | 'template' | 'scratch';

/** Hero subtitle copy on /surveys/create, keyed by the selected start mode. */
export const SURVEY_CREATION_HERO_SUBTITLES: Record<SurveyCreationMode, string> = {
  idea:
    'Describe it in your own words. QuestionPro AI will draft the questions, pick the right scales, and hand you a survey you can edit, tweak, or send.',
  template:
    'Browse proven templates for CSAT, NPS, employee feedback, and more. Pick one and we’ll build your survey and open the workspace.',
  scratch:
    'Take things in your own hands and start from scratch. No AI required!',
};

/** Simulated AI drafting delay before opening the survey workspace (idea / prompt flow). */
export const SURVEY_AI_DRAFT_DELAY_MS = 5000;

/** Minimum overlay time when building from a template selection. */
export const SURVEY_TEMPLATE_BUILD_DELAY_MS = 4000;

export const SURVEY_AI_THINKING_STEPS = [
  'Understanding your research goals…',
  'Drafting questions…',
  'Selecting scales and layout…',
  'Finalizing your survey…',
] as const;

export const SURVEY_TEMPLATE_BUILD_STEPS = [
  'Applying your template…',
  'Drafting questions…',
  'Setting up scales and layout…',
  'Opening your workspace…',
] as const;

export type SurveyCreationAiOverlayVariant = 'working' | 'building';

export interface SurveyCreationBriefFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export const SURVEY_BRIEF_ACCEPT =
  '.pdf,.doc,.docx,.ppt,.pptx,.pps,.ppsx,.xls,.xlsx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/rtf';

const SURVEY_BRIEF_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'pps',
  'ppsx',
  'xls',
  'xlsx',
  'txt',
  'rtf',
]);

const MAX_BRIEF_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export function isSurveyBriefFileAllowed(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return SURVEY_BRIEF_EXTENSIONS.has(extension);
}

export function formatSurveyBriefFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createSurveyBriefFile(file: File): SurveyCreationBriefFile {
  return {
    id: `brief-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
  };
}

export function validateSurveyBriefFile(file: File): string | null {
  if (!isSurveyBriefFileAllowed(file)) {
    return 'Upload a PDF, Word, PowerPoint, Excel, or text brief.';
  }
  if (file.size > MAX_BRIEF_FILE_SIZE_BYTES) {
    return 'Each file must be 25 MB or smaller.';
  }
  return null;
}

/** Route id for a one-off blank survey created from the creation flow (not in MOCK_SURVEYS). */
export const NEW_BLANK_SURVEY_ID = 0;

const BLANK_SURVEY_DRAFT_STORAGE_KEY = 'qp-blank-survey-draft';

export interface BlankSurveyDraft {
  name: string;
  createdAt: string;
  /** Show the create/import modal once when the blank workspace first opens. */
  showCreateModal?: boolean;
}

export interface BlankSurveyCreateOption {
  id: string;
  label: string;
  icon: string;
  iconClassName?: string;
  prompt: string;
}

export const BLANK_SURVEY_CREATE_IMPORT_OPTIONS: BlankSurveyCreateOption[] = [
  {
    id: 'import-word',
    label: 'Import from Word',
    icon: 'wm-description',
    iconClassName: 'word',
    prompt: 'Create survey questions from an uploaded Word document',
  },
  {
    id: 'import-pdf',
    label: 'Import from PDF',
    icon: 'wm-picture-as-pdf',
    iconClassName: 'pdf',
    prompt: 'Create survey questions from an uploaded PDF',
  },
  {
    id: 'import-ppt',
    label: 'Import from PowerPoint',
    icon: 'wm-slideshow',
    prompt: 'Create survey questions from an uploaded PowerPoint file',
  },
  {
    id: 'import-excel',
    label: 'Import from Excel',
    icon: 'wm-table-chart',
    prompt: 'Create survey questions from an uploaded Excel file',
  },
];

export function saveBlankSurveyDraft(
  name: string,
  options?: { showCreateModal?: boolean }
): void {
  if (typeof window === 'undefined') return;
  const draft: BlankSurveyDraft = {
    name: name.trim(),
    createdAt: new Date().toISOString(),
    showCreateModal: options?.showCreateModal ?? true,
  };
  sessionStorage.setItem(BLANK_SURVEY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function readBlankSurveyDraft(): BlankSurveyDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(BLANK_SURVEY_DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BlankSurveyDraft;
    if (!parsed.name?.trim()) return null;
    return {
      ...parsed,
      name: parsed.name.trim(),
      showCreateModal: parsed.showCreateModal === true,
    };
  } catch {
    return null;
  }
}

/** Returns whether the create modal should open, and clears the one-time flag. */
export function consumeBlankSurveyCreateModalFlag(): boolean {
  const draft = readBlankSurveyDraft();
  if (!draft?.showCreateModal) return false;
  if (typeof window === 'undefined') return false;
  const next: BlankSurveyDraft = { ...draft, showCreateModal: false };
  sessionStorage.setItem(BLANK_SURVEY_DRAFT_STORAGE_KEY, JSON.stringify(next));
  return true;
}

export function clearBlankSurveyDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(BLANK_SURVEY_DRAFT_STORAGE_KEY);
}
