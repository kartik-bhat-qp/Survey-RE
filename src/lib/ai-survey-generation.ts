import type { SurveyQuestionInputKind, SurveySection } from '@/data/mock-survey-detail';

export interface GeneratedSurveyQuestion {
  text: string;
  required?: boolean;
  inputKind?: SurveyQuestionInputKind;
  options: string[];
}

export interface GeneratedSurveySection {
  title: string;
  questions: GeneratedSurveyQuestion[];
}

export interface GeneratedSurveyPayload {
  title: string;
  sections: GeneratedSurveySection[];
}

export const AI_SURVEY_GENERATION_SYSTEM_PROMPT = `You are a survey design assistant for QuestionPro.
Given a user's research goal, produce a concise, professional survey draft as JSON only.

Rules:
- Return valid JSON matching the schema exactly. No markdown or commentary.
- Use 1 section titled "Block 1" unless the prompt clearly needs multiple blocks (max 2).
- Include 4 to 8 questions total.
- Each question must have 2 to 6 answer options (strings only).
- Use inputKind "radio" for single-select and "checkbox" only for "select all that apply" style questions.
- Mark demographic or screener questions as required when appropriate.
- Write clear, neutral question wording.
- Match the requested language/locale for all user-facing text.

JSON schema:
{
  "title": "string — short survey name",
  "sections": [
    {
      "title": "string — block name, usually Block 1",
      "questions": [
        {
          "text": "string — question text",
          "required": boolean,
          "inputKind": "radio" | "checkbox",
          "options": ["string", "..."]
        }
      ]
    }
  ]
}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseQuestion(value: unknown): GeneratedSurveyQuestion | null {
  if (!isRecord(value)) return null;
  if (typeof value.text !== 'string' || !value.text.trim()) return null;
  if (!Array.isArray(value.options)) return null;

  const options = value.options
    .filter((option): option is string => typeof option === 'string')
    .map((option) => option.trim())
    .filter(Boolean);

  if (options.length < 2) return null;

  const inputKind =
    value.inputKind === 'checkbox' || value.inputKind === 'radio'
      ? value.inputKind
      : 'radio';

  return {
    text: value.text.trim(),
    required: typeof value.required === 'boolean' ? value.required : true,
    inputKind,
    options: options.slice(0, 8),
  };
}

function parseSection(value: unknown): GeneratedSurveySection | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.questions)) return null;

  const questions = value.questions
    .map(parseQuestion)
    .filter((question): question is GeneratedSurveyQuestion => question !== null);

  if (questions.length === 0) return null;

  const title =
    typeof value.title === 'string' && value.title.trim()
      ? value.title.trim()
      : 'Block 1';

  return { title, questions };
}

export function parseGeneratedSurveyPayload(raw: unknown): GeneratedSurveyPayload | null {
  if (!isRecord(raw)) return null;

  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .map(parseSection)
    .filter((section): section is GeneratedSurveySection => section !== null);

  if (sections.length === 0) return null;

  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? raw.title.trim()
      : 'AI Draft Survey';

  const totalQuestions = sections.reduce(
    (count, section) => count + section.questions.length,
    0
  );
  if (totalQuestions < 1) return null;

  return { title, sections };
}

export function generatedSurveyToSections(payload: GeneratedSurveyPayload): SurveySection[] {
  let questionNumber = 0;
  const stamp = Date.now();

  return payload.sections.map((section, sectionIndex) => ({
    id: `section-ai-${stamp}-${sectionIndex}`,
    title: section.title,
    questions: section.questions.map((question, questionIndex) => {
      questionNumber += 1;
      return {
        id: `q-ai-${stamp}-${sectionIndex}-${questionIndex}`,
        code: `Q${questionNumber}`,
        number: questionNumber,
        text: question.text,
        required: question.required ?? true,
        inputKind: question.inputKind ?? 'radio',
        options: question.options.map((label, optionIndex) => ({
          id: `opt-ai-${stamp}-${sectionIndex}-${questionIndex}-${optionIndex}`,
          label,
        })),
      };
    }),
  }));
}

export function buildSurveyGenerationUserMessage(
  prompt: string,
  languageLabel: string
): string {
  return `Survey language/locale: ${languageLabel}

User goal:
${prompt.trim()}`;
}
