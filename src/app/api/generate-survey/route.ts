import OpenAI from 'openai';
import {
  AI_SURVEY_GENERATION_SYSTEM_PROMPT,
  buildSurveyGenerationUserMessage,
  parseGeneratedSurveyPayload,
} from '@/lib/ai-survey-generation';
import {
  generateLocalSurveyFallback,
  LOCAL_SURVEY_FALLBACK_NOTICE,
} from '@/lib/local-survey-generation';

const DEFAULT_MODEL = 'gpt-4o-mini';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function shouldUseLocalFallback(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === 429 || error.status === 503 || error.status >= 500;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('quota') ||
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('insufficient_quota') ||
      message.includes('billing')
    );
  }
  return false;
}

function friendlyOpenAIError(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      return 'Invalid OpenAI API key. Check OPENAI_API_KEY in your .env file.';
    }
    if (error.status === 429) {
      return LOCAL_SURVEY_FALLBACK_NOTICE;
    }
    if (error.status === 503) {
      return 'OpenAI is temporarily unavailable. Please try again in a moment.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Failed to generate survey.';
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const prompt =
    isRecord(body) && typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const languageLabel =
    isRecord(body) && typeof body.languageLabel === 'string'
      ? body.languageLabel.trim()
      : 'English (United States)';

  if (!prompt) {
    return Response.json(
      { success: false, error: 'Describe your survey goals to continue.' },
      { status: 400 }
    );
  }

  const client = getOpenAIClient();
  if (!client) {
    const survey = generateLocalSurveyFallback(prompt);
    return Response.json({
      success: true,
      survey,
      usedFallback: true,
      notice:
        'OpenAI API key is not configured. We created a starter survey you can edit.',
    });
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: AI_SURVEY_GENERATION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildSurveyGenerationUserMessage(prompt, languageLabel),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      const survey = generateLocalSurveyFallback(prompt);
      return Response.json({
        success: true,
        survey,
        usedFallback: true,
        notice: 'AI returned an empty response. We created a starter survey instead.',
      });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      const survey = generateLocalSurveyFallback(prompt);
      return Response.json({
        success: true,
        survey,
        usedFallback: true,
        notice: 'Could not parse the AI response. We created a starter survey instead.',
      });
    }

    const survey = parseGeneratedSurveyPayload(parsedJson);
    if (!survey) {
      const fallback = generateLocalSurveyFallback(prompt);
      return Response.json({
        success: true,
        survey: fallback,
        usedFallback: true,
        notice: 'AI returned an invalid structure. We created a starter survey instead.',
      });
    }

    return Response.json({ success: true, survey, usedFallback: false });
  } catch (error: unknown) {
    console.error('OPENAI ERROR:', error);

    if (shouldUseLocalFallback(error)) {
      const survey = generateLocalSurveyFallback(prompt);
      return Response.json({
        success: true,
        survey,
        usedFallback: true,
        notice: LOCAL_SURVEY_FALLBACK_NOTICE,
      });
    }

    return Response.json(
      { success: false, error: friendlyOpenAIError(error) },
      { status: 500 }
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
