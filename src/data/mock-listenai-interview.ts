import { cloneListenAiStudy, type ListenAiStudy } from '@/data/mock-listenai-studies';
import { LISTENAI_RESPONSE_FIELD_TOKEN } from '@/data/mock-listenai-question';

export interface ListenAiCreateExampleBrief {
  title: string;
  prompt: string;
}

export interface ListenAiCreateExampleCategory {
  id: string;
  label: string;
  briefs: ListenAiCreateExampleBrief[];
}

export const LISTENAI_CREATE_EXAMPLE_CATEGORIES: ListenAiCreateExampleCategory[] = [
  {
    id: 'ux',
    label: 'UX Research',
    briefs: [
      {
        title: 'Where do people get stuck in onboarding?',
        prompt:
          'We recently launched a new onboarding experience and want to understand why activation rates have not improved. Learn where people hesitate, skip, or drop off, and what would make the first session feel clearer.',
      },
      {
        title: 'How do people recover when something goes wrong?',
        prompt:
          'We want to understand how people recover when a product flow fails or feels confusing. Learn what they try first, when they give up, and what support or messaging would have helped.',
      },
    ],
  },
  {
    id: 'product',
    label: 'Product Discovery',
    briefs: [
      {
        title: 'How are teams currently solving this problem?',
        prompt:
          'We want to understand how teams currently solve this problem today. Learn what tools, workarounds, and people they rely on, what is painful about that process, and what a better solution would need to do.',
      },
      {
        title: 'What unmet needs exist in our target users daily workflow?',
        prompt:
          'We want to uncover unmet needs in our target users’ daily workflow. Learn what they are trying to accomplish, where current tools fall short, and what would make the next product worth switching to.',
      },
    ],
  },
  {
    id: 'cx',
    label: 'Customer Experience',
    briefs: [
      {
        title: 'Why do customers stay with a brand — or leave?',
        prompt:
          'We want to understand why customers stay with a brand or decide to leave. Learn which moments feel valuable, which feel frustrating, and what would change their next purchase or visit.',
      },
      {
        title: 'What makes a service interaction feel easy?',
        prompt:
          'We want to understand what makes a service interaction feel easy or difficult. Learn how people decide where to go, what they expect, and what would make them come back.',
      },
    ],
  },
  {
    id: 'ex',
    label: 'Employee Experience',
    briefs: [
      {
        title: 'How do employees get work done across tools?',
        prompt:
          'We want to understand how employees get work done across tools and teams. Learn where handoffs break down, what they wish was simpler, and what would save them time each week.',
      },
    ],
  },
  {
    id: 'concept',
    label: 'Concept Testing',
    briefs: [
      {
        title: 'Does this concept solve a real problem?',
        prompt:
          'We want to test whether this concept solves a real problem for the people we designed it for. Learn what they understand, what feels useful, and what would stop them from using it.',
      },
    ],
  },
  {
    id: 'market',
    label: 'Market Research',
    briefs: [
      {
        title: 'How do people choose among competing options?',
        prompt:
          'We want to understand how people choose among competing options in this category. Learn what they compare, what they ignore, and what would make them try something new next time.',
      },
    ],
  },
];

export const LISTENAI_CONVERSATION_GREETING =
  "Hi, I'm the AI interviewer for this study. I'll ask you a few questions about your experience.";

export function defaultListenAiIntroduction(goal: string, sourceQuestionText?: string): string {
  const focus = goal.trim()
    ? goal.trim().replace(/\.$/, '')
    : sourceQuestionText?.trim()
      ? `why people answered “${sourceQuestionText.trim()}” the way they did`
      : 'your experience';
  return `Thanks for taking part today. We'd like to understand ${focus}. There are no right or wrong answers here — we're interested in your honest experience and what matters to you. Please answer as openly as you can, and feel free to use recent examples from your own visits.`;
}

export function defaultListenAiThankYouNote(): string {
  return 'Thank you for sharing your experience. You will now return to the survey to continue with the remaining questions.';
}

export function generateListenAiFirstQuestionFromSource(sourceQuestionText: string): string {
  const source = sourceQuestionText.trim().replace(/\?+$/, '');
  const lower = source.toLowerCase();

  if (lower.startsWith('which ') || lower.startsWith('what ') || lower.startsWith('who ')) {
    return `You selected ${LISTENAI_RESPONSE_FIELD_TOKEN}. What made you choose that answer for “${source}”?`;
  }

  if (lower.startsWith('how many ') || lower.startsWith('how much ')) {
    return `You answered ${LISTENAI_RESPONSE_FIELD_TOKEN}. Can you tell me more about what led to that response for “${source}”?`;
  }

  if (lower.startsWith('do you ') || lower.startsWith('have you ') || lower.startsWith('are you ')) {
    return `You answered ${LISTENAI_RESPONSE_FIELD_TOKEN}. What was behind that answer for “${source}”?`;
  }

  return `You answered ${LISTENAI_RESPONSE_FIELD_TOKEN}. Tell me more about why that was your response to “${source}”.`;
}

function resolveListenAiTemplate(
  text: string,
  selectedAnswerLabel: string,
  sourceQuestionCode?: string
): string {
  const selected = selectedAnswerLabel.trim();
  if (!selected) return text;

  let resolved = text.replaceAll(LISTENAI_RESPONSE_FIELD_TOKEN, selected);
  if (sourceQuestionCode?.trim()) {
    resolved = resolved.replaceAll(`{${sourceQuestionCode.trim()}}`, selected);
  }
  return resolved;
}

export function generateListenAiStudyFromPrompt(
  study: ListenAiStudy,
  prompt: string
): ListenAiStudy {
  const next = cloneListenAiStudy(study);
  const description = prompt.trim() || next.description.trim();
  const sourceText = next.sourceQuestionText?.trim() || '';
  const firstQuestion =
    sourceText
      ? `When you think about your answer to “${sourceText}”, what usually drives that choice?`
      : 'What matters most to you when you make this kind of decision?';

  const existingGuide = next.discussionGuide.filter((question) => question.text.trim());
  const discussionGuide =
    existingGuide.length > 0
      ? existingGuide.map((question, index) =>
          index === 0
            ? {
                ...question,
                text: question.text.trim() === sourceText ? firstQuestion : question.text,
                followUpInstructions:
                  question.followUpInstructions.trim() ||
                  'Ask what specifically they choose, then probe on a recent example (taste, price, convenience, quality, or speed).',
                aiFollowUps: true,
              }
            : question
        )
      : [
          {
            id: `${next.id}-q-1`,
            text: firstQuestion,
            followUpInstructions:
              'Ask what specifically they choose, then probe on a recent example (taste, price, convenience, quality, or speed).',
            required: true,
            aiFollowUps: true,
            maxFollowUps: 3,
          },
        ];

  return {
    ...next,
    description,
    interviewType: 'conversation',
    objectives: next.objectives.some((item) => item.trim()) ? next.objectives : description ? [description] : [],
    introduction: defaultListenAiIntroduction(description, sourceText),
    discussionGuide,
    thankYouNote: next.thankYouNote.trim() || defaultListenAiThankYouNote(),
  };
}

export function getListenAiMaxFollowUps(study: ListenAiStudy): number {
  return Math.min(5, Math.max(1, study.maxFollowUps || study.discussionGuide[0]?.maxFollowUps || 3));
}

function getListenAiOpeningQuestion(study: ListenAiStudy): string {
  const configured = study.discussionGuide.find((question) => question.text.trim())?.text.trim();
  if (configured) return configured;

  const sourceText = study.sourceQuestionText?.trim();
  if (sourceText) {
    return generateListenAiFirstQuestionFromSource(sourceText);
  }

  return 'Tell me more about what led you to that answer.';
}

export function getListenAiOpeningMessages(study: ListenAiStudy): string[] {
  const intro = study.introduction.trim() || LISTENAI_CONVERSATION_GREETING;
  const firstQuestion = getListenAiOpeningQuestion(study);
  if (intro === firstQuestion) return [intro];
  return [intro, firstQuestion];
}

export function getResolvedListenAiOpeningMessages(
  study: ListenAiStudy,
  selectedAnswerLabel: string
): string[] {
  return getListenAiOpeningMessages(study).map((message) =>
    resolveListenAiTemplate(message, selectedAnswerLabel, study.sourceQuestionCode)
  );
}

export function buildListenAiFollowUp(
  study: ListenAiStudy,
  userReply: string,
  followUpIndex: number,
  selectedAnswerLabel: string
): string {
  const reply = userReply.trim() || selectedAnswerLabel.trim() || 'that';
  const instructions = study.discussionGuide[0]?.followUpInstructions.trim() ?? '';
  const templates = [
    `You said ${reply} — can you tell me more about what specifically makes you choose ${reply} (e.g., taste, price, convenience, menu variety, location, speed)?`,
    `Can you share a recent time when that mattered? What happened, and what did you do?`,
    `If ${reply} were not an option next time, what would you do instead — and why?`,
    `What would make you change your mind on a future visit?`,
    `Is there anything else about this that you wish researchers understood?`,
  ];

  if (followUpIndex === 0 && instructions) {
    return resolveListenAiTemplate(
      `You said ${reply} — ${instructions.replace(/^Ask /i, '').replace(/\.$/, '')}.`,
      selectedAnswerLabel,
      study.sourceQuestionCode
    );
  }

  return resolveListenAiTemplate(
    templates[Math.min(followUpIndex, templates.length - 1)] ?? templates[0],
    selectedAnswerLabel,
    study.sourceQuestionCode
  );
}
