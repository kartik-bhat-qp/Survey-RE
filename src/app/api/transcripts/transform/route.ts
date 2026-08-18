import {
  convertTranscriptsToExcel,
  TranscriptConvertError,
} from '@/lib/transcripts/to-excel';

export const runtime = 'nodejs';

const MAX_FILES = 20;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
}

function safeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() || 'transcript.csv';
  return base.toLowerCase().endsWith('.csv') ? base : `${base}.csv`;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ success: false, error: 'Invalid upload.' }, { status: 400 });
  }

  const uploaded = form
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (uploaded.length === 0) {
    return Response.json(
      { success: false, error: 'Choose at least one CSV transcript file.' },
      { status: 400 }
    );
  }
  if (uploaded.length > MAX_FILES) {
    return Response.json(
      { success: false, error: `Upload up to ${MAX_FILES} CSV files at a time.` },
      { status: 400 }
    );
  }

  for (const file of uploaded) {
    if (!isCsvFile(file)) {
      return Response.json(
        { success: false, error: `"${file.name}" is not a CSV file.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return Response.json(
        { success: false, error: `"${file.name}" is larger than 10 MB.` },
        { status: 400 }
      );
    }
  }

  try {
    const files = await Promise.all(
      uploaded.map(async (file) => ({
        name: safeFileName(file.name),
        text: new TextDecoder('utf-8').decode(await file.arrayBuffer()),
      }))
    );
    const { excel, summary } = await convertTranscriptsToExcel(files);
    const stamp = new Date().toISOString().slice(0, 10);
    return Response.json({
      success: true,
      fileName: `transcript-responses-${stamp}.xlsx`,
      excelBase64: excel.toString('base64'),
      summary,
    });
  } catch (error) {
    if (error instanceof TranscriptConvertError) {
      return Response.json({ success: false, error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to convert transcripts.';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
