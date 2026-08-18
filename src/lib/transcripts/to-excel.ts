import ExcelJS from 'exceljs';
import { format } from 'date-fns';

const MAX_CELL_CHARS = 32_000;
const MAX_SHEET_NAME = 31;

const QUESTION_HEADERS = [
  'question',
  'questions',
  'question_text',
  'question_asked',
  'question_label',
  'prompt',
  'q',
  'ques',
  'item',
  'topic',
];
const ANSWER_HEADERS = [
  'answer',
  'answers',
  'answer_text',
  'response',
  'responses',
  'response_text',
  'reply',
  'verbatim',
  'value',
];
const SPEAKER_HEADERS = [
  'speaker',
  'speaker_name',
  'speaker_label',
  'speaker_id',
  'role',
  'who',
  'name',
];
const TEXT_HEADERS = [
  'text',
  'utterance',
  'dialogue',
  'sentence',
  'content',
  'caption',
  'line',
  'message',
  'transcript_text',
];
const TRANSCRIPT_HEADERS = [
  'transcript',
  'transcript_id',
  'transcript_name',
  'interview',
  'interview_id',
  'respondent',
  'respondent_id',
  'respondent_name',
  'participant',
  'participant_id',
  'conversation_id',
  'session',
  'session_id',
  'meeting',
  'file',
  'filename',
  'source',
];
const METADATA_HEADERS = new Set([
  'date',
  'time',
  'timestamp',
  'start',
  'start_time',
  'end',
  'end_time',
  'duration',
  'language',
  'email',
  'ip_address',
  'ip',
  'status',
  'progress',
  'finished',
  'created_at',
  'updated_at',
  'owner',
]);

const QUESTION_PREFIX_RE =
  /^\s*[\[(]?\s*(?:q(?:uestion)?\s*)?\d*\s*[\])\.:\-–]*\s*/i;
const LEAD_IN_RE =
  /^(?:(?:ok(?:ay)?|alright|all right|right|so|and|but|now|next|then|great|perfect|cool|got it|makes sense|understood|thanks|thank you|awesome|interesting|sure|yeah|yes|well|um|uh|to start|to begin|first|firstly|second|secondly|last|lastly|finally|moving on|one more thing|one last thing|just curious|out of curiosity|let me ask|i wanted to ask|can i ask)\b[\s,.:;–—-]+)+/i;
const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+/;
const NON_WORD_RE = /[^a-z0-9 ]+/g;
const WHITESPACE_RE = /\s+/g;
const INVALID_SHEET_CHARS_RE = /[[\]:*?/\\]/g;

export type TranscriptInputFile = {
  name: string;
  text: string;
};

type CsvRow = Record<string, string>;

type TranscriptResponse = {
  transcript: string;
  speaker: string;
  answer: string;
  sourceFile: string;
};

type QuestionGroup = {
  key: string;
  label: string;
  responses: TranscriptResponse[];
  labelVariants: Map<string, number>;
  unanswered: number;
};

type ColumnMap = {
  question: string | null;
  answer: string | null;
  transcript: string | null;
  speaker: string | null;
  text: string | null;
};

type FileReport = {
  file: string;
  layout: string;
  rows: number;
  responses: number;
};

export type TranscriptConvertSummary = {
  files: FileReport[];
  questionCount: number;
  responseCount: number;
  transcriptCount: number;
  questions: Array<{
    index: number;
    question: string;
    sheet: string;
    responseCount: number;
    transcriptCount: number;
    blankCount: number;
    sampleResponses: Array<{
      transcript: string;
      speaker: string;
      answer: string;
    }>;
  }>;
};

export class TranscriptConvertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptConvertError';
  }
}

function cleanText(value: string | undefined | null): string {
  if (value == null) return '';
  return String(value).replace(/\u00a0/g, ' ').replace(WHITESPACE_RE, ' ').trim();
}

function normalizeHeader(value: string | undefined | null): string {
  const slug = cleanText(value).toLowerCase().replace(NON_WORD_RE, ' ');
  return slug.replace(WHITESPACE_RE, '_').replace(/^_+|_+$/g, '');
}

function extractQuestion(text: string): string {
  let cleaned = cleanText(text);
  const sentences = cleaned.split(SENTENCE_SPLIT_RE).filter((part) => part.trim());
  const asking = sentences.filter((part) => part.includes('?'));
  if (asking.length > 0) {
    cleaned = asking[asking.length - 1].trim();
  }
  cleaned = cleaned.replace(LEAD_IN_RE, '').trim();
  if (!cleaned) return cleanText(text);
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function questionKey(label: string): string {
  let text = cleanText(label).toLowerCase().replace(QUESTION_PREFIX_RE, '');
  text = text.replace(LEAD_IN_RE, '');
  text = text.replace(NON_WORD_RE, ' ');
  return text.replace(WHITESPACE_RE, ' ').trim();
}

function truncate(value: string, limit = MAX_CELL_CHARS): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}…`;
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const candidateSet = new Set(candidates);
  for (const header of headers) {
    if (candidateSet.has(normalizeHeader(header))) return header;
  }
  for (const header of headers) {
    const tokens = normalizeHeader(header).split('_');
    for (const candidate of candidates) {
      if (tokens.includes(candidate)) return header;
    }
  }
  return null;
}

function sniffDelimiter(sample: string): string {
  const delimiters = [',', ';', '\t', '|'];
  let best = ',';
  let bestScore = -1;
  for (const delimiter of delimiters) {
    const lines = sample.split(/\r?\n/).filter((line) => line.trim()).slice(0, 8);
    if (lines.length === 0) continue;
    const counts = lines.map((line) => parseCsv(line, delimiter)[0]?.length ?? 0);
    const first = counts[0] ?? 0;
    if (first < 2) continue;
    const consistent = counts.filter((count) => count === first).length;
    const score = first * consistent;
    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }
  return best;
}

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    if (char === '\r') {
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readRows(text: string): { headers: string[]; rows: CsvRow[] } {
  const source = text.replace(/^\uFEFF/, '');
  const table = parseCsv(source, sniffDelimiter(source.slice(0, 8192)));
  const headers = (table[0] ?? []).map((header) => header.trim()).filter((header) => header.length > 0);
  const rows: CsvRow[] = [];
  for (const cells of table.slice(1)) {
    if (!cells.some((cell) => cleanText(cell))) continue;
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

function detectLayout(headers: string[]): { layout: string; columns: ColumnMap } {
  const columns: ColumnMap = {
    question: findColumn(headers, QUESTION_HEADERS),
    answer: findColumn(headers, ANSWER_HEADERS),
    transcript: findColumn(headers, TRANSCRIPT_HEADERS),
    speaker: findColumn(headers, SPEAKER_HEADERS),
    text: findColumn(headers, TEXT_HEADERS),
  };
  if (columns.question && columns.answer) return { layout: 'long', columns };
  if (columns.speaker && columns.text) return { layout: 'dialogue', columns };
  return { layout: 'wide', columns };
}

function guessInterviewer(rows: CsvRow[], speakerCol: string, textCol: string): string | null {
  const asked = new Map<string, number>();
  for (const row of rows) {
    const text = cleanText(row[textCol]);
    if (!text.includes('?')) continue;
    const speaker = cleanText(row[speakerCol]) || 'Unknown';
    asked.set(speaker, (asked.get(speaker) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [speaker, count] of asked) {
    if (count > bestCount) {
      best = speaker;
      bestCount = count;
    }
  }
  return best;
}

type Collected = [string, TranscriptResponse, boolean];

function collectLong(
  rows: CsvRow[],
  columns: ColumnMap,
  defaultTranscript: string,
  sourceFile: string
): Collected[] {
  const collected: Collected[] = [];
  for (const row of rows) {
    const label = columns.question ? cleanText(row[columns.question]) : '';
    if (!label) continue;
    const answer = columns.answer ? cleanText(row[columns.answer]) : '';
    const transcript =
      (columns.transcript ? cleanText(row[columns.transcript]) : '') || defaultTranscript;
    const speaker = columns.speaker ? cleanText(row[columns.speaker]) : '';
    collected.push([
      label,
      { transcript, speaker, answer, sourceFile },
      Boolean(answer),
    ]);
  }
  return collected;
}

function collectWide(
  headers: string[],
  rows: CsvRow[],
  columns: ColumnMap,
  defaultTranscript: string,
  sourceFile: string
): Collected[] {
  const skip = new Set([columns.transcript, columns.speaker]);
  const questionCols = headers.filter(
    (header) => !skip.has(header) && !METADATA_HEADERS.has(normalizeHeader(header))
  );
  const collected: Collected[] = [];
  rows.forEach((row, index) => {
    const transcript =
      (columns.transcript ? cleanText(row[columns.transcript]) : '') ||
      `${defaultTranscript} — row ${index + 1}`;
    const speaker = columns.speaker ? cleanText(row[columns.speaker]) : '';
    for (const header of questionCols) {
      const label = cleanText(header);
      if (!label) continue;
      const answer = cleanText(row[header]);
      collected.push([
        label,
        { transcript, speaker, answer, sourceFile },
        Boolean(answer),
      ]);
    }
  });
  return collected;
}

function collectDialogue(
  rows: CsvRow[],
  columns: ColumnMap,
  defaultTranscript: string,
  sourceFile: string
): Collected[] {
  const speakerCol = columns.speaker;
  const textCol = columns.text;
  if (!speakerCol || !textCol) return [];
  const interviewer = guessInterviewer(rows, speakerCol, textCol);
  const collected: Collected[] = [];
  let currentLabel: string | null = null;
  let pending = new Map<string, string[]>();
  let currentTranscript = defaultTranscript;

  function flush(): void {
    if (currentLabel == null) return;
    if (pending.size === 0) {
      collected.push([
        currentLabel,
        { transcript: currentTranscript, speaker: '', answer: '', sourceFile },
        false,
      ]);
      return;
    }
    for (const [speaker, parts] of pending) {
      const answer = cleanText(parts.join(' '));
      collected.push([
        currentLabel,
        { transcript: currentTranscript, speaker, answer, sourceFile },
        Boolean(answer),
      ]);
    }
  }

  for (const row of rows) {
    const text = cleanText(row[textCol]);
    if (!text) continue;
    const speaker = cleanText(row[speakerCol]) || 'Unknown';
    const transcript =
      (columns.transcript ? cleanText(row[columns.transcript]) : '') || defaultTranscript;
    const isQuestion = text.includes('?') && (interviewer == null || speaker === interviewer);
    if (isQuestion) {
      flush();
      currentLabel = extractQuestion(text);
      currentTranscript = transcript;
      pending = new Map();
      continue;
    }
    if (currentLabel == null) continue;
    if (interviewer != null && speaker === interviewer) continue;
    const parts = pending.get(speaker) ?? [];
    parts.push(text);
    pending.set(speaker, parts);
  }
  flush();
  return collected;
}

function uniqueTranscripts(responses: TranscriptResponse[]): string[] {
  const seen: string[] = [];
  for (const response of responses) {
    if (!seen.includes(response.transcript)) seen.push(response.transcript);
  }
  return seen;
}

function mostCommonLabel(counts: Map<string, number>, fallback: string): string {
  let best = fallback;
  let bestCount = -1;
  for (const [label, count] of counts) {
    if (count > bestCount) {
      best = label;
      bestCount = count;
    }
  }
  return best;
}

function buildGroups(files: TranscriptInputFile[]): {
  groups: QuestionGroup[];
  fileReports: FileReport[];
} {
  const groups = new Map<string, QuestionGroup>();
  const fileReports: FileReport[] = [];

  for (const file of files) {
    const sourceFile = file.name.split(/[/\\]/).pop() || file.name;
    const defaultTranscript = sourceFile.replace(/\.csv$/i, '');
    const { headers, rows } = readRows(file.text);
    if (headers.length === 0) {
      fileReports.push({ file: sourceFile, layout: 'empty', rows: 0, responses: 0 });
      continue;
    }

    const { layout, columns } = detectLayout(headers);
    const collected =
      layout === 'long'
        ? collectLong(rows, columns, defaultTranscript, sourceFile)
        : layout === 'dialogue'
          ? collectDialogue(rows, columns, defaultTranscript, sourceFile)
          : collectWide(headers, rows, columns, defaultTranscript, sourceFile);

    let answered = 0;
    for (const [label, response, hasAnswer] of collected) {
      const key = questionKey(label);
      if (!key) continue;
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          label: cleanText(label),
          responses: [],
          labelVariants: new Map(),
          unanswered: 0,
        };
        groups.set(key, group);
      }
      const cleanedLabel = cleanText(label);
      group.labelVariants.set(cleanedLabel, (group.labelVariants.get(cleanedLabel) ?? 0) + 1);
      if (hasAnswer) {
        group.responses.push(response);
        answered += 1;
      } else {
        group.unanswered += 1;
      }
    }

    fileReports.push({
      file: sourceFile,
      layout,
      rows: rows.length,
      responses: answered,
    });
  }

  const ordered = [...groups.values()];
  for (const group of ordered) {
    group.label = mostCommonLabel(group.labelVariants, group.label);
  }
  return { groups: ordered, fileReports };
}

function sheetNameFor(index: number, label: string, used: Set<string>): string {
  const slug = cleanText(label.replace(INVALID_SHEET_CHARS_RE, ' '));
  let base = `Q${index} ${slug}`.trim().slice(0, MAX_SHEET_NAME).trim();
  if (!base) base = `Q${index}`;
  let name = base;
  let suffix = 2;
  while (used.has(name.toLowerCase())) {
    const trimmed = base.slice(0, MAX_SHEET_NAME - String(suffix).length - 1).trim();
    name = `${trimmed} ${suffix}`;
    suffix += 1;
  }
  used.add(name.toLowerCase());
  return name;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' },
};
const QUESTION_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE8F0FE' },
};
const TITLE_FONT: Partial<ExcelJS.Font> = { bold: true, size: 14, color: { argb: 'FF1F2937' } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FF374151' } };
const QUESTION_FONT: Partial<ExcelJS.Font> = { bold: true, size: 11, color: { argb: 'FF1D4ED8' } };
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
};
const TOP_WRAP: Partial<ExcelJS.Alignment> = { vertical: 'top', wrapText: true };

function applyHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, labels: string[]): void {
  labels.forEach((label, index) => {
    const cell = sheet.getCell(rowNumber, index + 1);
    cell.value = label;
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle' };
  });
}

function setWidths(sheet: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

function writeSummarySheet(
  sheet: ExcelJS.Worksheet,
  groups: QuestionGroup[],
  fileReports: FileReport[],
  sheetNames: string[]
): void {
  sheet.name = 'Summary';
  sheet.getCell('A1').value = 'Transcript responses by question';
  sheet.getCell('A1').font = TITLE_FONT;
  sheet.getCell('A2').value = `Generated ${format(new Date(), 'd MMM yyyy, h:mm a')}`;
  sheet.getCell('A3').value = `${fileReports.length} source file(s) · ${groups.length} question(s) · ${groups.reduce((sum, group) => sum + group.responses.length, 0)} response(s)`;

  let row = 5;
  applyHeaderRow(sheet, row, ['Source file', 'Detected layout', 'Rows read', 'Responses']);
  for (const report of fileReports) {
    row += 1;
    sheet.getCell(row, 1).value = report.file;
    sheet.getCell(row, 1).alignment = TOP_WRAP;
    sheet.getCell(row, 2).value = report.layout;
    sheet.getCell(row, 3).value = report.rows;
    sheet.getCell(row, 4).value = report.responses;
  }

  row += 2;
  applyHeaderRow(sheet, row, ['#', 'Question', 'Responses', 'Transcripts', 'Blank', 'Sheet']);
  groups.forEach((group, index) => {
    row += 1;
    sheet.getCell(row, 1).value = index + 1;
    sheet.getCell(row, 2).value = truncate(group.label);
    sheet.getCell(row, 2).alignment = TOP_WRAP;
    sheet.getCell(row, 3).value = group.responses.length;
    sheet.getCell(row, 4).value = uniqueTranscripts(group.responses).length;
    sheet.getCell(row, 5).value = group.unanswered;
    sheet.getCell(row, 6).value = sheetNames[index];
  });

  setWidths(sheet, [28, 70, 12, 12, 10, 24]);
}

function writeCombinedSheet(sheet: ExcelJS.Worksheet, groups: QuestionGroup[]): void {
  sheet.name = 'All responses';
  let row = 1;
  groups.forEach((group, index) => {
    const questionCell = sheet.getCell(row, 1);
    questionCell.value = `Q${index + 1}. ${truncate(group.label)}`;
    questionCell.font = QUESTION_FONT;
    questionCell.alignment = TOP_WRAP;
    for (let column = 1; column <= 3; column += 1) {
      sheet.getCell(row, column).fill = QUESTION_FILL;
    }
    sheet.getRow(row).height = 28;
    row += 1;

    applyHeaderRow(sheet, row, ['Transcript', 'Speaker', 'Response']);
    row += 1;

    if (group.responses.length === 0) {
      const cell = sheet.getCell(row, 1);
      cell.value = 'No responses captured';
      cell.font = { italic: true, color: { argb: 'FF6B7280' } };
      row += 2;
      return;
    }

    for (const response of group.responses) {
      sheet.getCell(row, 1).value = response.transcript;
      sheet.getCell(row, 1).alignment = TOP_WRAP;
      sheet.getCell(row, 2).value = response.speaker || '—';
      sheet.getCell(row, 2).alignment = TOP_WRAP;
      sheet.getCell(row, 3).value = truncate(response.answer);
      sheet.getCell(row, 3).alignment = TOP_WRAP;
      row += 1;
    }
    row += 1;
  });

  setWidths(sheet, [34, 22, 110]);
}

function writeQuestionSheet(
  sheet: ExcelJS.Worksheet,
  index: number,
  group: QuestionGroup
): void {
  sheet.getCell('A1').value = `Q${index}`;
  sheet.getCell('A1').font = HEADER_FONT;
  sheet.getCell('B1').value = truncate(group.label);
  sheet.getCell('B1').font = QUESTION_FONT;
  sheet.getCell('B1').alignment = TOP_WRAP;
  sheet.getCell('A2').value = 'Responses';
  sheet.getCell('A2').font = HEADER_FONT;
  sheet.getCell('B2').value = `${group.responses.length} across ${uniqueTranscripts(group.responses).length} transcript(s)`;

  applyHeaderRow(sheet, 4, ['Transcript', 'Speaker', 'Response', 'Source file']);
  let row = 5;
  for (const response of group.responses) {
    sheet.getCell(row, 1).value = response.transcript;
    sheet.getCell(row, 1).alignment = TOP_WRAP;
    sheet.getCell(row, 2).value = response.speaker || '—';
    sheet.getCell(row, 2).alignment = TOP_WRAP;
    sheet.getCell(row, 3).value = truncate(response.answer);
    sheet.getCell(row, 3).alignment = TOP_WRAP;
    sheet.getCell(row, 4).value = response.sourceFile;
    sheet.getCell(row, 4).alignment = TOP_WRAP;
    row += 1;
  }

  if (group.responses.length === 0) {
    const cell = sheet.getCell(row, 1);
    cell.value = 'No responses captured';
    cell.font = { italic: true, color: { argb: 'FF6B7280' } };
  }

  setWidths(sheet, [34, 22, 110, 30]);
  sheet.views = [{ state: 'frozen', ySplit: 4 }];
}

async function writeWorkbook(
  groups: QuestionGroup[],
  fileReports: FileReport[]
): Promise<{ buffer: Buffer; sheetNames: string[] }> {
  const workbook = new ExcelJS.Workbook();
  const usedNames = new Set(['summary', 'all responses']);
  const sheetNames = groups.map((group, index) =>
    sheetNameFor(index + 1, group.label, usedNames)
  );

  writeSummarySheet(workbook.addWorksheet('Summary'), groups, fileReports, sheetNames);
  writeCombinedSheet(workbook.addWorksheet('All responses'), groups);
  groups.forEach((group, index) => {
    writeQuestionSheet(workbook.addWorksheet(sheetNames[index]), index + 1, group);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buffer), sheetNames };
}

export async function convertTranscriptsToExcel(
  files: TranscriptInputFile[]
): Promise<{ excel: Buffer; summary: TranscriptConvertSummary }> {
  const { groups, fileReports } = buildGroups(files);
  if (groups.length === 0) {
    throw new TranscriptConvertError(
      'No questions found. Expected a question/answer, speaker/text, or one-column-per-question CSV.'
    );
  }

  const { buffer, sheetNames } = await writeWorkbook(groups, fileReports);
  const transcriptIds = new Set(
    groups.flatMap((group) => group.responses.map((response) => response.transcript))
  );

  return {
    excel: buffer,
    summary: {
      files: fileReports,
      questionCount: groups.length,
      responseCount: groups.reduce((sum, group) => sum + group.responses.length, 0),
      transcriptCount: transcriptIds.size,
      questions: groups.map((group, index) => ({
        index: index + 1,
        question: group.label,
        sheet: sheetNames[index],
        responseCount: group.responses.length,
        transcriptCount: uniqueTranscripts(group.responses).length,
        blankCount: group.unanswered,
        sampleResponses: group.responses.slice(0, 3).map((response) => ({
          transcript: response.transcript,
          speaker: response.speaker,
          answer: truncate(response.answer, 400),
        })),
      })),
    },
  };
}
