import { saveAiSurveyDraft } from '@/data/ai-survey-draft';
import { SURVEY_AI_DRAFT_DELAY_MS } from '@/data/mock-survey-creation-flow';
import type { GeneratedSurveyPayload } from '@/lib/ai-survey-generation';

export type RequestAiSurveyGenerationResult =
  | { ok: true; survey: GeneratedSurveyPayload }
  | { ok: false; error: string };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function requestAiSurveyGeneration(
  prompt: string,
  languageLabel: string
): Promise<RequestAiSurveyGenerationResult> {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return { ok: false, error: 'Describe what you want to learn to continue' };
  }

  try {
    const response = await fetch('/api/generate-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: trimmedPrompt, languageLabel }),
    });

    const data = (await response.json()) as {
      success?: boolean;
      error?: string;
      survey?: GeneratedSurveyPayload;
    };

    if (!response.ok || !data.success || !data.survey) {
      return { ok: false, error: data.error ?? 'Failed to generate survey.' };
    }

    return { ok: true, survey: data.survey };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate survey.';
    return { ok: false, error: message };
  }
}

export type RunAiSurveyCreationFlowOptions = {
  /** Minimum time to show the overlay before navigating (defaults to idea flow). */
  minDelayMs?: number;
};

/** Generates a survey, saves the draft, and keeps the overlay visible for at least minDelayMs. */
export async function runAiSurveyCreationFlow(
  prompt: string,
  languageLabel: string,
  options?: RunAiSurveyCreationFlowOptions
): Promise<{ ok: true } | { ok: false; error: string }> {
  const minDelayMs = options?.minDelayMs ?? SURVEY_AI_DRAFT_DELAY_MS;
  const startedAt = Date.now();
  const result = await requestAiSurveyGeneration(prompt, languageLabel);

  if (!result.ok) {
    return result;
  }

  saveAiSurveyDraft(result.survey, prompt.trim());

  const remainingMs = minDelayMs - (Date.now() - startedAt);
  if (remainingMs > 0) {
    await delay(remainingMs);
  }

  return { ok: true };
}
