import {
  convertChatLogToTranscript,
  type ChatTranscriptLayout,
} from '@/lib/transcripts/chat-to-transcript';
import { TranscriptConvertError } from '@/lib/transcripts/to-excel';
import { TranslationUnavailableError } from '@/lib/transcripts/translate-to-english';

export const runtime = 'nodejs';
// Hobby plans reject anything above 60s while the deployment is uploading.
export const maxDuration = 60;

const MAX_FILE_BYTES = 20 * 1024 * 1024;

function formText(form: FormData, key: string, fallback: string): string {
  const value = form.get(key);
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 60) : fallback;
}

function errorMessage(error: unknown): string {
  if (error instanceof TranscriptConvertError || error instanceof TranslationUnavailableError) {
    return error.message;
  }
  return error instanceof Error ? error.message : 'Failed to convert chat log.';
}

/**
 * Responds with newline-delimited JSON: `progress` events while converting, then one
 * `result` or `error` event.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ type: 'error', error: 'Invalid upload.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return Response.json(
      { type: 'error', error: 'Choose an Excel file with chat logs.' },
      { status: 400 }
    );
  }
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return Response.json(
      { type: 'error', error: `"${file.name}" is not an .xlsx file.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json(
      { type: 'error', error: `"${file.name}" is larger than 20 MB.` },
      { status: 400 }
    );
  }

  const requestedLayout = form.get('layout');
  const layout: ChatTranscriptLayout =
    requestedLayout === 'text' || requestedLayout === 'turns' ? requestedLayout : 'questions';
  const translateToEnglish = form.get('translateToEnglish') === 'true';
  const buffer = await file.arrayBuffer();
  const base = file.name.replace(/\.xlsx$/i, '').replace(/[^\w.-]+/g, '-') || 'chat-log';

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>): void => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        const { excel, summary } = await convertChatLogToTranscript(
          buffer,
          {
            layout,
            interviewerLabel: formText(form, 'interviewerLabel', 'Interviewer'),
            respondentLabel: formText(form, 'respondentLabel', 'Respondent'),
            includeSystem: form.get('includeSystem') === 'true',
            followUpColumns: form.get('followUpColumns') === 'true',
            translateToEnglish,
          },
          (stage, done, total) => send({ type: 'progress', stage, done, total })
        );
        send({
          type: 'result',
          fileName: `${base}-transcript${translateToEnglish ? '-english' : ''}.xlsx`,
          excelBase64: excel.toString('base64'),
          summary,
        });
      } catch (error) {
        send({ type: 'error', error: errorMessage(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
