import {
  generatedSurveyToSections,
  type GeneratedSurveyPayload,
} from '@/lib/ai-survey-generation';
import type { SurveySection } from '@/data/mock-survey-detail';

/** Route id for AI-generated surveys from the creation flow (not in MOCK_SURVEYS). */
export const NEW_AI_SURVEY_ID = -1;

const AI_SURVEY_DRAFT_STORAGE_KEY = 'qp-ai-survey-draft';

export interface AiSurveyDraft {
  name: string;
  prompt: string;
  createdAt: string;
  sections: SurveySection[];
}

export function saveAiSurveyDraft(
  payload: GeneratedSurveyPayload,
  prompt: string
): AiSurveyDraft {
  const draft: AiSurveyDraft = {
    name: payload.title.trim() || 'AI Draft Survey',
    prompt: prompt.trim(),
    createdAt: new Date().toISOString(),
    sections: generatedSurveyToSections(payload),
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(AI_SURVEY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }

  return draft;
}

export function readAiSurveyDraft(): AiSurveyDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(AI_SURVEY_DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AiSurveyDraft;
    if (!parsed.name?.trim() || !Array.isArray(parsed.sections)) return null;
    return {
      ...parsed,
      name: parsed.name.trim(),
      prompt: parsed.prompt?.trim() ?? '',
      sections: parsed.sections,
    };
  } catch {
    return null;
  }
}

export function clearAiSurveyDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AI_SURVEY_DRAFT_STORAGE_KEY);
}
