import type { SurveySection } from '@/data/mock-survey-detail';
import {
  DEFAULT_CONTACT_INFORMATION_FIELD_LABELS,
  DEFAULT_CONTACT_INFORMATION_QUESTION_TEXT,
} from '@/data/mock-survey-detail';

export const AUDIO_INPUT_SURVEY_ID = 18;

export function createAudioInputSections(): SurveySection[] {
  return [
    {
      id: 'section-audio-1',
      title: 'Block 1',
      questions: [
        {
          id: 'q-audio-singlerow',
          code: 'Q1',
          number: 1,
          text: 'What is one word that best describes your experience with our product?',
          required: true,
          addQuestionTypeId: 'single-row',
          options: [],
        },
        {
          id: 'q-audio-commentbox',
          code: 'Q2',
          number: 2,
          text: 'Please share your overall experience in detail. What stood out to you the most?',
          required: true,
          addQuestionTypeId: 'comment-box',
          options: [],
        },
        {
          id: 'q-audio-email',
          code: 'Q3',
          number: 3,
          text: 'Please enter your email address so we can follow up with you.',
          required: false,
          addQuestionTypeId: 'email',
          options: [],
        },
        {
          id: 'q-audio-contact',
          code: 'Q4',
          number: 4,
          text: DEFAULT_CONTACT_INFORMATION_QUESTION_TEXT,
          required: false,
          addQuestionTypeId: 'contact',
          options: DEFAULT_CONTACT_INFORMATION_FIELD_LABELS.map((label, index) => ({
            id: `q-audio-contact-field-${index + 1}`,
            label,
          })),
        },
      ],
    },
  ];
}
