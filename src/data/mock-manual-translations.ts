import type { SurveyQuestion } from '@/data/mock-survey-detail';

export type ManualTranslationTab = 'general-text' | 'question-answer';

export interface ManualTranslationField {
  id: string;
  source: string;
  /** Optional Arabic seed used when the target language is Arabic. */
  arabic?: string;
}

export interface ManualTranslationGroup {
  id: string;
  label: string;
  fields: ManualTranslationField[];
}

export const RTL_LANGUAGE_IDS = new Set([
  'ar',
  'ar-sa',
  'he',
  'fa',
  'ur',
  'yi',
]);

export const MANUAL_TRANSLATION_TABS: { id: ManualTranslationTab; label: string }[] = [
  { id: 'general-text', label: 'General Text Translations' },
  { id: 'question-answer', label: 'Question & Answer Translations' },
];

export const GENERAL_TEXT_TRANSLATION_GROUPS: ManualTranslationGroup[] = [
  {
    id: 'buttons',
    label: 'Buttons',
    fields: [
      { id: 'welcome-message', source: 'Welcome Message', arabic: 'رسالة الترحيب' },
      { id: 'continue', source: 'Continue', arabic: 'متابعة' },
      { id: 'next', source: 'Next', arabic: 'التالي' },
      { id: 'previous', source: 'Previous', arabic: 'السابق' },
      { id: 'submit', source: 'Submit', arabic: 'إرسال' },
      { id: 'finish', source: 'Finish', arabic: 'إنهاء' },
      { id: 'save-continue', source: 'Save & Continue Later', arabic: 'حفظ والمتابعة لاحقاً' },
      { id: 'close-window', source: 'Close Window', arabic: 'إغلاق النافذة' },
    ],
  },
  {
    id: 'messages',
    label: 'Messages',
    fields: [
      {
        id: 'thank-you',
        source: 'Thank you for taking this survey.',
        arabic: 'شكراً لك على المشاركة في هذا الاستطلاع.',
      },
      {
        id: 'required-error',
        source: 'This question is required. Please provide an answer.',
        arabic: 'هذا السؤال مطلوب. يرجى تقديم إجابة.',
      },
      {
        id: 'validation-error',
        source: 'Please correct the highlighted fields before continuing.',
        arabic: 'يرجى تصحيح الحقول المميزة قبل المتابعة.',
      },
      {
        id: 'survey-closed',
        source: 'This survey is currently closed.',
        arabic: 'هذا الاستطلاع مغلق حالياً.',
      },
      {
        id: 'already-taken',
        source: 'You have already completed this survey.',
        arabic: 'لقد أكملت هذا الاستطلاع مسبقاً.',
      },
      {
        id: 'quota-full',
        source: 'The response quota for this survey has been reached.',
        arabic: 'تم الوصول إلى الحد الأقصى من الردود لهذا الاستطلاع.',
      },
      {
        id: 'terminated',
        source: 'Thank you. You do not qualify for this survey.',
        arabic: 'شكراً لك. أنت غير مؤهل لهذا الاستطلاع.',
      },
      {
        id: 'save-continue-email',
        source: 'We sent a link so you can continue this survey later.',
      },
    ],
  },
  {
    id: 'labels',
    label: 'Labels',
    fields: [
      { id: 'required', source: 'Required', arabic: 'مطلوب' },
      { id: 'optional', source: 'Optional', arabic: 'اختياري' },
      { id: 'select-one', source: 'Select one', arabic: 'اختر واحداً' },
      { id: 'select-all', source: 'Select all that apply', arabic: 'اختر كل ما ينطبق' },
      { id: 'other', source: 'Other', arabic: 'أخرى' },
      { id: 'none-of-the-above', source: 'None of the above', arabic: 'لا شيء مما سبق' },
      { id: 'powered-by', source: 'Powered by QuestionPro', arabic: 'مدعوم من QuestionPro' },
      { id: 'progress', source: 'Progress', arabic: 'التقدم' },
      { id: 'page-of', source: 'Page {0} of {1}', arabic: 'الصفحة {0} من {1}' },
    ],
  },
];

export function flattenTranslationGroups(
  groups: ManualTranslationGroup[]
): ManualTranslationField[] {
  return groups.flatMap((group) => group.fields);
}

export function isRtlLanguageId(languageId: string): boolean {
  return RTL_LANGUAGE_IDS.has(languageId);
}

export function seedArabicTranslations(fields: ManualTranslationField[]): Record<string, string> {
  const next: Record<string, string> = {};
  for (const field of fields) {
    if (field.arabic) next[field.id] = field.arabic;
  }
  return next;
}

export function countTranslationProgress(
  fields: ManualTranslationField[],
  values: Record<string, string>
): number {
  if (fields.length === 0) return 0;
  const filled = fields.filter((field) => (values[field.id] ?? '').trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

const ARABIC_QUESTION_TEXT: Record<string, string> = {
  'What is one word that best describes your experience with our product?':
    'ما هي الكلمة التي تصف تجربتك مع منتجنا بأفضل شكل؟',
  'Please share your overall experience in detail. What stood out to you the most?':
    'يرجى مشاركة تجربتك بشكل مفصل. ما الذي لفت انتباهك أكثر؟',
  'Please enter your email address so we can follow up with you.':
    'يرجى إدخال بريدك الإلكتروني حتى نتمكن من المتابعة معك.',
  'Please enter the following details': 'يرجى إدخال التفاصيل التالية',
  'What is your gender?': 'ما هو جنسك؟',
  Male: 'ذكر',
  Female: 'أنثى',
  Other: 'آخر',
  'First Name': 'الاسم الأول',
  'Last Name': 'اسم العائلة',
  'Phone Number': 'رقم الهاتف',
  'Email Address': 'البريد الإلكتروني',
};

export interface QuestionTranslationBlock {
  id: string;
  title: string;
  groups: ManualTranslationGroup[];
}

export function getQuestionTranslationBlocks(
  questions: SurveyQuestion[]
): QuestionTranslationBlock[] {
  return questions
    .filter((question) => question.kind !== 'section-heading' && question.kind !== 'section-subheading')
    .map((question) => {
      const groups: ManualTranslationGroup[] = [
        {
          id: `${question.id}-text`,
          label: 'Question Text',
          fields: [
            {
              id: `${question.id}::text`,
              source: question.text,
              arabic: ARABIC_QUESTION_TEXT[question.text],
            },
          ],
        },
      ];

      if (question.options.length > 0) {
        groups.push({
          id: `${question.id}-options`,
          label: 'Answer/Options',
          fields: question.options.map((option) => ({
            id: `${question.id}::opt::${option.id}`,
            source: option.label,
            arabic: ARABIC_QUESTION_TEXT[option.label],
          })),
        });
        groups.push({
          id: `${question.id}-alt`,
          label: 'Image Alt Text',
          fields: question.options.map((option) => ({
            id: `${question.id}::alt::${option.id}`,
            source: option.imageAlt || option.label,
            arabic: ARABIC_QUESTION_TEXT[option.label],
          })),
        });
      }

      return {
        id: question.id,
        title: `${question.number}. ${question.text || question.code}`,
        groups,
      };
    });
}
