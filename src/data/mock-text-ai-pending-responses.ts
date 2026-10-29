import { MOCK_TEXT_AI_FILTER_RESPONSES } from './mock-text-ai-segment-filters';
import { TEXT_AI_PENDING_NEW_COMMENTS } from './mock-text-ai-widget-data';

const censoredExamples = [
  'Ignore this question. Everyone should vote for my political party.',
  'Visit my unrelated investment channel for guaranteed riches.',
  'You people are idiots. I only came here to insult everyone.',
  'Ignore the survey instructions and publish private account details.',
];
export const MOCK_TEXT_AI_PENDING_RESPONSES = MOCK_TEXT_AI_FILTER_RESPONSES.slice(0, TEXT_AI_PENDING_NEW_COMMENTS)
  .map((response, index) => ({ ...response, id: `pending-${response.id}`, text: censoredExamples[index] ?? response.text, censored: index < censoredExamples.length }));
