export interface SurveyCreationTemplate {
  id: string;
  label: string;
  prompt: string;
}

/** Templates shown per page in the create-survey “Or start from” carousel. */
export const SURVEY_CREATION_TEMPLATES_PER_PAGE = 6;

export const SURVEY_CREATION_TEMPLATES: SurveyCreationTemplate[] = [
  {
    id: 'csat',
    label: 'CSAT Survey',
    prompt:
      'A Customer Satisfaction (CSAT) survey with overall satisfaction rating, key touchpoint ratings, and open feedback on what to improve.',
  },
  {
    id: 'nps',
    label: 'NPS Survey',
    prompt:
      'A Net Promoter Score survey asking likelihood to recommend, follow-up on the score, and optional comments on drivers of loyalty.',
  },
  {
    id: 'customer-effort',
    label: 'Customer Effort Survey',
    prompt:
      'A Customer Effort Score survey measuring how easy it was to get help, resolve an issue, or complete a task, with improvement suggestions.',
  },
  {
    id: 'product-feedback',
    label: 'Product Feedback Survey',
    prompt:
      'A product feedback survey on feature usefulness, ease of use, bugs or gaps, and priorities for the next release.',
  },
  {
    id: 'support-satisfaction',
    label: 'Support Satisfaction Survey',
    prompt:
      'A support satisfaction survey on agent helpfulness, resolution time, communication clarity, and overall support experience.',
  },
  {
    id: 'employee-engagement',
    label: 'Employee Engagement Survey',
    prompt:
      'An employee engagement survey covering motivation, alignment with company goals, growth opportunities, and culture.',
  },
  {
    id: 'employee-pulse',
    label: 'Employee Pulse Survey',
    prompt:
      'A short employee pulse survey on weekly morale, workload, manager support, and one open comment for leadership.',
  },
  {
    id: 'onboarding-feedback',
    label: 'Onboarding Feedback Survey',
    prompt:
      'An onboarding feedback survey for new hires on orientation clarity, tools and training, manager support, and readiness for the role.',
  },
  {
    id: 'exit-interview',
    label: 'Exit Interview Survey',
    prompt:
      'An exit interview survey on reasons for leaving, manager and team experience, compensation fairness, and suggestions to improve retention.',
  },
  {
    id: 'training-feedback',
    label: 'Training Feedback Survey',
    prompt:
      'A training feedback survey on content relevance, instructor quality, pace, materials, and confidence applying what was learned.',
  },
  {
    id: 'market-research',
    label: 'Market Research Survey',
    prompt:
      'A market research survey on category needs, buying behavior, brand consideration, and unmet problems in our target segment.',
  },
  {
    id: 'brand-awareness',
    label: 'Brand Awareness Survey',
    prompt:
      'A brand awareness survey measuring aided and unaided recall, associations, preference versus competitors, and message resonance.',
  },
  {
    id: 'website-feedback',
    label: 'Website Feedback Survey',
    prompt:
      'A website feedback survey on navigation, content clarity, design, performance, mobile experience, and suggested improvements.',
  },
  {
    id: 'event-feedback',
    label: 'Event Feedback Survey',
    prompt:
      'An event feedback survey on overall satisfaction, sessions, speakers, logistics, networking value, and ideas for future events.',
  },
  {
    id: 'course-evaluation',
    label: 'Course Evaluation Survey',
    prompt:
      'A course evaluation survey for students on learning outcomes, instructor effectiveness, materials, workload, and course improvements.',
  },
  {
    id: 'patient-satisfaction',
    label: 'Patient Satisfaction Survey',
    prompt:
      'A patient satisfaction survey on wait times, staff communication, care quality, facility cleanliness, and likelihood to recommend.',
  },
  {
    id: 'restaurant-feedback',
    label: 'Restaurant Feedback Survey',
    prompt:
      'A restaurant feedback survey on food quality, service, ambiance, value, wait time, and likelihood to return or recommend.',
  },
  {
    id: 'hotel-guest',
    label: 'Hotel Guest Survey',
    prompt:
      'A hotel guest survey on check-in, room comfort, amenities, staff service, cleanliness, and overall stay satisfaction.',
  },
  {
    id: 'community-feedback',
    label: 'Community Feedback Survey',
    prompt:
      'A community feedback survey on member needs, program value, communication, inclusivity, and priorities for the community.',
  },
  {
    id: 'concept-testing',
    label: 'Concept Testing Survey',
    prompt:
      'A concept testing survey presenting a new idea with appeal, purchase intent, pricing sensitivity, strengths, and concerns versus alternatives.',
  },
];

export {
  SURVEY_CREATION_LANGUAGES,
  DEFAULT_SURVEY_CREATION_LANGUAGE,
  getSurveyCreationLanguageLabel,
  getSurveyCreationLanguageShortLabel,
} from '@/data/mock-survey-creation-languages';

export const SURVEY_CREATION_PROMPT_PLACEHOLDER =
  'e.g. A short feedback survey for customers who just finished onboarding…';

/** Simulated AI drafting delay before opening the survey workspace. */
export const SURVEY_AI_DRAFT_DELAY_MS = 5000;

export const SURVEY_AI_THINKING_STEPS = [
  'Understanding your research goals…',
  'Drafting questions…',
  'Selecting scales and layout…',
  'Finalizing your survey…',
] as const;

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
}

export function saveBlankSurveyDraft(name: string): void {
  if (typeof window === 'undefined') return;
  const draft: BlankSurveyDraft = {
    name: name.trim(),
    createdAt: new Date().toISOString(),
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
    return { ...parsed, name: parsed.name.trim() };
  } catch {
    return null;
  }
}

export function clearBlankSurveyDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(BLANK_SURVEY_DRAFT_STORAGE_KEY);
}
