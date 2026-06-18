export const SURVEY_AI_EXAMPLE_PROMPTS = [
  {
    id: 'add-nps',
    text: 'Add an NPS question at the end of the survey',
  },
  {
    id: 'improve-wording',
    text: 'Improve the wording of the demographic questions',
  },
  {
    id: 'add-logic',
    text: 'Add skip logic to hide the cola brand question for non-drinkers',
  },
] as const;

export interface SurveyAiCapabilityPill {
  id: string;
  label: string;
  icon?: string;
}

export const SURVEY_AI_CAPABILITY_PILLS: SurveyAiCapabilityPill[] = [
  { id: 'import-word', label: 'Import from Word', icon: 'wm-description' },
  { id: 'import-pdf', label: 'Import from PDF', icon: 'wm-picture-as-pdf' },
  { id: 'add-question-types', label: 'Add different types of questions' },
  { id: 'compound-logic', label: 'Set up advanced (compound) survey logic' },
  { id: 'translate', label: 'Translate survey languages' },
  { id: 'generate-brief', label: 'Generate questions from a brief' },
  { id: 'add-edit-questions', label: 'Add or edit questions' },
  { id: 'survey-logic', label: 'Set up survey logic' },
  { id: 'validation', label: 'Add validation rules' },
  { id: 'reorganize', label: 'Reorganize blocks' },
];

export const SURVEY_AI_GREETING =
  "Hi! I'm your research agent. I can help you build, edit, and improve this survey. Try asking me to:";

export const SURVEY_AI_THINKING_STEPS = [
  'Reviewing your survey…',
  'Understanding your request…',
  'Drafting changes…',
  'Applying updates…',
] as const;

const SURVEY_AI_GENERATION_DELAY_MS = 2200;

/** Prototype context window for the research agent sidebar. */
export const RESEARCH_AGENT_CONTEXT_MAX_TOKENS = 200_000;

/** Baseline survey workspace context loaded into the agent. */
export const RESEARCH_AGENT_BASE_CONTEXT_TOKENS = 18_400;

export function estimateResearchAgentContextUsage(prompt: string): number {
  const promptTokens = Math.ceil(prompt.trim().length / 4);
  return RESEARCH_AGENT_BASE_CONTEXT_TOKENS + promptTokens;
}

export interface SurveyAiGenerationResult {
  summary: string;
}

export async function generateSurveyChangesFromAiPrompt(
  prompt: string,
  _surveyId: number
): Promise<SurveyAiGenerationResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Enter a prompt to continue');
  }

  await new Promise((resolve) => {
    window.setTimeout(resolve, SURVEY_AI_GENERATION_DELAY_MS);
  });

  const lower = trimmed.toLowerCase();
  if (lower.includes('word') || lower.includes('import from word')) {
    return { summary: 'Imported survey questions from your Word document into Block 1.' };
  }
  if (lower.includes('pdf')) {
    return { summary: 'Imported survey questions from your PDF into Block 1.' };
  }
  if (lower.includes('nps')) {
    return { summary: 'Added an NPS question at the end of Block 1.' };
  }
  if (lower.includes('logic') || lower.includes('skip')) {
    return { summary: 'Drafted skip logic for your survey — review it in the Logic panel.' };
  }
  if (lower.includes('wording') || lower.includes('improve')) {
    return { summary: 'Suggested clearer wording for your demographic questions.' };
  }

  return {
    summary: 'Your research agent request has been applied to this prototype workspace.',
  };
}
