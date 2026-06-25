export interface TextAiLanguageOption {
  value: string;
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

export const TEXT_AI_EXPERT_REVIEW_TITLE = 'QuestionPro Expert Review';

export const TEXT_AI_EXPERT_REVIEW_DESCRIPTION =
  'Have a QuestionPro research expert review your codeframe';
