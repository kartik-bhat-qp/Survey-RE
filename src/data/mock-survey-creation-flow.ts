export interface SurveyCreationTemplate {
  id: string;
  label: string;
  prompt: string;
}

export const SURVEY_CREATION_TEMPLATES: SurveyCreationTemplate[] = [
  {
    id: 'customer-nps',
    label: 'Customer NPS',
    prompt:
      'A Net Promoter Score survey for recent customers asking likelihood to recommend, follow-up on score, and optional comments.',
  },
  {
    id: 'post-event-feedback',
    label: 'Post-event feedback',
    prompt:
      'A short post-event feedback survey covering overall satisfaction, session quality, logistics, and suggestions for next time.',
  },
  {
    id: 'product-market-fit',
    label: 'Product/market fit',
    prompt:
      'A product-market fit survey asking how disappointed users would be without the product, who it is best for, and what would improve it.',
  },
  {
    id: 'employee-pulse',
    label: 'Employee pulse',
    prompt:
      'A quick employee pulse check on engagement, manager support, workload, and open feedback for leadership.',
  },
];

export { SURVEY_CREATION_LANGUAGES, DEFAULT_SURVEY_CREATION_LANGUAGE, getSurveyCreationLanguageShortLabel } from '@/data/mock-survey-creation-languages';

export const SURVEY_CREATION_PROMPT_PLACEHOLDER =
  'e.g. A short feedback survey for customers who just finished onboarding…';

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
