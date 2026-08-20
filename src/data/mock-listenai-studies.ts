export const LISTENAI_ADD_QUESTION_TYPE_ID = 'listenai';
export const LISTENAI_MAX_FOLLOW_UP_LIMIT = 5;

export type ListenAiInterviewType = 'conversation' | 'video';

export type ListenAiTone =
  | 'neutral'
  | 'friendly'
  | 'professional'
  | 'empathetic'
  | 'curious';

export interface ListenAiGuideQuestion {
  id: string;
  text: string;
  followUpInstructions: string;
  required: boolean;
  aiFollowUps: boolean;
  maxFollowUps: number;
}

export interface ListenAiStudy {
  id: string;
  title: string;
  description: string;
  interviewType: ListenAiInterviewType;
  maxFollowUps: number;
  tone: ListenAiTone;
  primaryLanguage: string;
  additionalLanguages: string[];
  objectives: string[];
  audienceNotes: string;
  introduction: string;
  discussionGuide: ListenAiGuideQuestion[];
  thankYouNote: string;
  moderatorInstructions: string[];
  sourceQuestionId?: string;
  sourceQuestionCode?: string;
  sourceQuestionText?: string;
}

export const LISTENAI_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
];

export const LISTENAI_TONE_OPTIONS: { value: ListenAiTone; label: string }[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'curious', label: 'Curious' },
];

export function normalizeListenAiTone(value: unknown): ListenAiTone {
  if (
    value === 'neutral' ||
    value === 'friendly' ||
    value === 'professional' ||
    value === 'empathetic' ||
    value === 'curious'
  ) {
    return value;
  }
  return 'curious';
}

export const LISTENAI_INTERVIEW_TYPE_OPTIONS: {
  value: ListenAiInterviewType;
  label: string;
  description: string;
}[] = [
  {
    value: 'conversation',
    label: 'Conversation',
    description: 'Participants chat with an AI interviewer. No camera or microphone required.',
  },
];

function guideQuestion(
  studyId: string,
  index: number,
  text: string,
  followUpInstructions: string,
  maxFollowUps = 3
): ListenAiGuideQuestion {
  return {
    id: `${studyId}-q-${index}`,
    text,
    followUpInstructions,
    required: true,
    aiFollowUps: true,
    maxFollowUps,
  };
}

export const MOCK_LISTENAI_STUDIES: ListenAiStudy[] = [
  {
    id: 'study-12',
    title: 'Fast-Food Chain Preference and Return-Visit Drivers Interview Guide',
    description:
      'This interview explores why people prefer a particular fast food chain and what factors could influence their next visit. The focus is on understanding the reasons behind current preference, the role of convenience, value, food, service, and experience, and what might encourage or discourage a return visit.',
    interviewType: 'conversation',
    maxFollowUps: 3,
    tone: 'curious',
    primaryLanguage: 'en',
    additionalLanguages: ['es'],
    objectives: ['Understand why respondents prefer a brand and what would change a return visit'],
    audienceNotes: '',
    introduction:
      "Thanks for taking part today. We'd like to understand why people choose a fast-food chain and what might make them come back, try a different place, or change their mind next time. There are no right or wrong answers here — we're interested in your honest experience and what matters to you. Please answer as openly as you can, and feel free to use recent examples from your own visits.",
    discussionGuide: [
      guideQuestion(
        'study-12',
        1,
        '',
        'Ask what specifically makes them choose that chain (taste, price, convenience, menu variety, location, speed).',
        3
      ),
    ],
    thankYouNote:
      'Thank you for sharing your experience. You will now return to the survey to continue with the remaining questions.',
    moderatorInstructions: ['Stay curious', 'Probe on a recent visit before moving on'],
  },
];

export function getListenAiStudyById(studyId: string): ListenAiStudy | undefined {
  return MOCK_LISTENAI_STUDIES.find((study) => study.id === studyId);
}

export function cloneListenAiStudy(study: ListenAiStudy): ListenAiStudy {
  return {
    ...study,
    additionalLanguages: [...study.additionalLanguages],
    objectives: [...study.objectives],
    moderatorInstructions: [...study.moderatorInstructions],
    discussionGuide: study.discussionGuide.map((question) => ({ ...question })),
  };
}

export function getDefaultListenAiStudy(): ListenAiStudy {
  return cloneListenAiStudy(MOCK_LISTENAI_STUDIES[0] as ListenAiStudy);
}
