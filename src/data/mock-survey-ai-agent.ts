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

export const SURVEY_AI_CAPABILITY_PILLS = [
  'Add or edit questions',
  'Set up survey logic',
  'Improve question wording',
  'Add validation rules',
  'Reorganize blocks',
] as const;

export const SURVEY_AI_GREETING =
  "Hi! I'm your survey agent. I can help you build, edit, and improve this survey. Try asking me to:";

export const SURVEY_AI_THINKING_STEPS = [
  'Reviewing your survey…',
  'Understanding your request…',
  'Drafting changes…',
  'Applying updates…',
] as const;

const SURVEY_AI_GENERATION_DELAY_MS = 2200;

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
    summary: 'Your survey agent request has been applied to this prototype workspace.',
  };
}
