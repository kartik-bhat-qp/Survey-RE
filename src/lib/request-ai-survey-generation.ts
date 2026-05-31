import type { GeneratedSurveyPayload } from '@/lib/ai-survey-generation';

export type RequestAiSurveyGenerationResult =
  | { ok: true; survey: GeneratedSurveyPayload }
  | { ok: false; error: string };

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
