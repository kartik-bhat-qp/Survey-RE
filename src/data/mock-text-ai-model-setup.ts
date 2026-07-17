export interface TextAiLanguageOption {
  value: string;
  label: string;
}

export interface TextAiReportCodebookOption {
  value: string;
  name: string;
  relativeDate: string;
  label: string;
}

export type TextAiCodebookSource = 'none' | 'template' | 'report';

export const TEXT_AI_OUTPUT_LANGUAGES: TextAiLanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
];

export const DEFAULT_TEXT_AI_OUTPUT_LANGUAGE = TEXT_AI_OUTPUT_LANGUAGES[0];

export const TEXT_AI_MODELING_GOAL_PLACEHOLDER =
  'Ex. I want to track my restaurant customers\u2019 emotions to identify where I can improve my service.';

export const TEXT_AI_CODEBOOK_OPTIONS: { value: TextAiCodebookSource; label: string }[] = [
  { value: 'none', label: 'Generate with QuestionPro AI' },
  { value: 'template', label: 'Upload from template file' },
  { value: 'report', label: 'Upload from report codebook' },
];

export const TEXT_AI_REPORT_CODEBOOKS: TextAiReportCodebookOption[] = [
  {
    value: 'restaurant-feedback',
    name: 'Restaurant feedback',
    relativeDate: '5 mins ago',
    label: 'Restaurant feedback · 5 mins ago',
  },
  {
    value: 'customer-experience-study',
    name: 'Customer experience study',
    relativeDate: '1 day ago',
    label: 'Customer experience study · 1 day ago',
  },
  {
    value: 'employee-pulse-feedback',
    name: 'Employee pulse feedback',
    relativeDate: '3 days ago',
    label: 'Employee pulse feedback · 3 days ago',
  },
  {
    value: 'product-concept-testing',
    name: 'Product concept testing',
    relativeDate: '1 week ago',
    label: 'Product concept testing · 1 week ago',
  },
];

export const TEXT_AI_EXPERT_REVIEW_TITLE = 'QuestionPro Expert Review';

export const TEXT_AI_EXPERT_REVIEW_DESCRIPTION =
  'Have a QuestionPro research expert review your codeframe';

export const TEXT_AI_CODEBOOK_TEMPLATE_DOWNLOAD_LABEL = 'Download template file';

export const TEXT_AI_CODEBOOK_TEMPLATE_UPLOAD_LABEL = 'Choose File to Upload';

export const TEXT_AI_CODEBOOK_TEMPLATE_SUPPORTED_FILES = 'Files supported: .xls, .xlsx';
