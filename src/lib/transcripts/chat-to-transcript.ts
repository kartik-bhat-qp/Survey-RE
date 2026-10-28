import ExcelJS from 'exceljs';
import {
  extractQuestion,
  questionKey,
  TranscriptConvertError,
} from '@/lib/transcripts/to-excel';
import {
  embedTexts,
  looksEnglish,
  translateTextsToEnglish,
} from '@/lib/transcripts/translate-to-english';

// Excel stores at most 32,767 characters per cell.
const MAX_CELL_CHARS = 32_000;
const PREVIEW_ROWS = 8;

const ROLE_GROUPS: Record<string, 'interviewer' | 'respondent' | 'system'> = {
  assistant: 'interviewer',
  ai: 'interviewer',
  bot: 'interviewer',
  model: 'interviewer',
  interviewer: 'interviewer',
  user: 'respondent',
  human: 'respondent',
  respondent: 'respondent',
  system: 'system',
  tool: 'system',
  function: 'system',
};

const ID_HEADERS = [
  'transcript id',
  'response id',
  'respondent id',
  'conversation id',
  'session id',
  'participant id',
  'sys respnum',
  'respnum',
  'response number',
  'respondent number',
  'id',
];

// Used when a cell was cut off at the Excel limit and is no longer valid JSON.
const SALVAGE_RE =
  /"role"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"/g;

// Reworded questions whose word stems overlap this much share one column.
const SIMILAR_QUESTION_THRESHOLD = 0.6;
// Overlap (shared / shorter question) only counts when the shorter question is this long,
// so "What happened?" doesn't absorb every question containing those words.
const MIN_TOKENS_FOR_CONTAINMENT = 5;
const STEM_LENGTH = 6;
// Cosine similarity at which two translated questions count as the same question.
// Compared against the most common wording, so close rewordings share its column.
const SAME_MEANING_THRESHOLD = 0.75;
// A question needs its own column when asked in at least this share of conversations.
const COMMON_QUESTION_SHARE = 0.01;
// Wider sheets are unreadable and exceed what the Excel writer can hold in memory.
export const MAX_QUESTION_COLUMNS = 150;

export const OTHER_FOLLOW_UPS_HEADER = 'Other follow-ups';

export type ChatTranscriptLayout = 'questions' | 'turns' | 'text';

export type ChatTranscriptOptions = {
  layout: ChatTranscriptLayout;
  interviewerLabel: string;
  respondentLabel: string;
  includeSystem: boolean;
  /** questions layout: give questions asked in only one conversation their own column. */
  followUpColumns: boolean;
  /** Translate every message to English and group questions by meaning. */
  translateToEnglish: boolean;
};

export type ChatTranscriptStage = 'reading' | 'translating' | 'grouping' | 'writing';

export type ChatTranscriptProgress = (stage: ChatTranscriptStage, done: number, total: number) => void;

export type ChatTranscriptQuestionColumn = {
  question: string;
  conversationCount: number;
  answeredCount: number;
};

export type ChatTranscriptSummary = {
  sheet: string;
  chatColumn: string;
  idColumn: string | null;
  extraColumns: string[];
  conversationCount: number;
  turnCount: number;
  salvagedRows: number[];
  skippedRows: number[];
  layout: ChatTranscriptLayout;
  questionColumns: ChatTranscriptQuestionColumn[];
  followUpCount: number;
  minConversationsPerColumn: number;
  columnLimitReached: boolean;
  translated: boolean;
  translatedTextCount: number;
  previewHeaders: string[];
  previewRows: string[][];
};

type Message = { role: string; text: string };

type Conversation = {
  transcriptId: string;
  extras: string[];
  messages: Message[];
};

type QuestionGroup = {
  tokens: Set<string>;
  embedding: number[] | null;
  variants: Map<string, number>;
  conversations: Set<number>;
  answered: Set<number>;
  positionTotal: number;
  positionCount: number;
};

type AskedQuestion = { group: number; label: string; answers: string[] };

function cellText(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function looksLikeChat(value: string): boolean {
  return value.startsWith('[') && value.slice(0, 200).replace(/'/g, '"').includes('"role"');
}

function contentToText(content: unknown): string {
  if (content == null) return '';
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content.map(contentToText).filter(Boolean).join('\n');
  }
  if (typeof content === 'object') {
    const record = content as Record<string, unknown>;
    for (const key of ['text', 'content', 'value', 'transcript']) {
      if (key in record) return contentToText(record[key]);
    }
    return '';
  }
  return String(content).trim();
}

function parseMessages(raw: string): { messages: Message[]; salvaged: boolean } {
  let data: unknown = null;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }

  if (data && !Array.isArray(data) && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    data = record.messages ?? record.conversation ?? record.transcript ?? null;
  }

  if (Array.isArray(data)) {
    const messages: Message[] = [];
    for (const item of data) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const role = cellText(record.role ?? record.speaker ?? record.author);
      const text = contentToText(record.content ?? record.text);
      if (text) messages.push({ role, text });
    }
    return { messages, salvaged: false };
  }

  const messages: Message[] = [];
  for (const match of raw.matchAll(SALVAGE_RE)) {
    let text = match[2];
    try {
      text = JSON.parse(`"${match[2]}"`) as string;
    } catch {
      /* keep the raw escaped text */
    }
    if (text.trim()) messages.push({ role: match[1], text: text.trim() });
  }
  return { messages, salvaged: true };
}

function truncate(value: string): string {
  return value.length <= MAX_CELL_CHARS ? value : `${value.slice(0, MAX_CELL_CHARS - 1)}…`;
}

function speakerFor(role: string, options: ChatTranscriptOptions): string {
  const group = ROLE_GROUPS[role.toLowerCase()];
  if (group === 'interviewer') return options.interviewerLabel || 'Interviewer';
  if (group === 'respondent') return options.respondentLabel || 'Respondent';
  if (role.toLowerCase() === 'system') return 'System';
  return role || 'Unknown';
}

function isInterviewer(role: string): boolean {
  return ROLE_GROUPS[role.toLowerCase()] === 'interviewer';
}

/** Unicode-aware so German/Danish questions keep their letters (ä, ø, ß…). */
function questionTokens(label: string): Set<string> {
  const words = label
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter((word) => word.length > 1);
  return new Set(words.map((word) => word.slice(0, STEM_LENGTH)));
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  const jaccard = shared / (a.size + b.size - shared);
  const shorter = Math.min(a.size, b.size);
  const containment = shorter >= MIN_TOKENS_FOR_CONTAINMENT ? (shared / shorter) * 0.85 : 0;
  return Math.max(jaccard, containment);
}

const COMPARISON_STOP = new Set(
  'a an the of to for you your that this what how when where who why would do does did if or and in on at with rather than just most be is are was were it they them their me my we our about from by as not only also very really truly more bit could can please tell say have has had'.split(
    ' '
  )
);

function comparisonText(label: string): string {
  const colon = label.lastIndexOf(':');
  const source = colon >= 0 && colon < 80 ? label.slice(colon + 1) : label;
  let text = '';
  let pendingSpace = false;
  for (const char of source.toLowerCase()) {
    const code = char.charCodeAt(0);
    const keep = (code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code > 127;
    if (keep) {
      if (pendingSpace && text) text += ' ';
      text += char;
      pendingSpace = false;
    } else {
      pendingSpace = true;
    }
  }
  return text.trim();
}

function comparisonTokens(text: string): Set<string> {
  return new Set(text.split(' ').filter((word) => word.length > 3 && !COMPARISON_STOP.has(word)));
}

type PreparedQuestion = {
  index: number;
  text: string;
  tokens: Set<string>;
  vector: number[] | null;
  size: number;
};

/** True when two already-normalized wordings ask the same thing. */
function preparedQuestionsMatch(a: PreparedQuestion, b: PreparedQuestion): boolean {
  const [shorter, longer] = a.text.length <= b.text.length ? [a.text, b.text] : [b.text, a.text];
  if (shorter.length >= 20 && longer.includes(shorter)) return true;
  const small = a.tokens.size <= b.tokens.size ? a.tokens : b.tokens;
  const big = small === a.tokens ? b.tokens : a.tokens;
  if (small.size >= 2 && [...small].every((token) => big.has(token))) {
    if (small.size >= 3 || small.size / big.size >= 0.66) return true;
  }
  return (
    a.vector != null && b.vector != null && cosine(a.vector, b.vector) >= SAME_MEANING_THRESHOLD
  );
}

function cosine(a: number[], b: number[]): number {
  let score = 0;
  for (let index = 0; index < a.length; index += 1) score += a[index] * b[index];
  return score;
}

/**
 * Folds reworded questions into one group. Each question is compared only with the more common
 * ones, and each conversation is rewritten once, so this stays off the page-render path.
 */
function mergeSimilarGroups(
  groups: QuestionGroup[],
  asked: AskedQuestion[][],
  embeddings: Map<string, number[]> | null
): void {
  const prepared: PreparedQuestion[] = [];
  groups.forEach((group, index) => {
    if (group.conversations.size === 0) return;
    const label = mostCommon(group.variants);
    const text = comparisonText(label);
    prepared.push({
      index,
      text,
      tokens: comparisonTokens(text),
      vector: embeddings?.get(label) ?? null,
      size: group.conversations.size,
    });
  });
  prepared.sort((a, b) => b.size - a.size || a.index - b.index);

  const redirect = new Map<number, number>();
  const rootOf = (index: number): number => {
    let current = index;
    while (redirect.has(current)) current = redirect.get(current) ?? current;
    return current;
  };

  prepared.forEach((item, itemIndex) => {
    for (let seedIndex = 0; seedIndex < itemIndex; seedIndex += 1) {
      const seed = prepared[seedIndex];
      if (rootOf(seed.index) !== seed.index) continue;
      if (!preparedQuestionsMatch(item, seed)) continue;
      redirect.set(item.index, seed.index);
      break;
    }
  });

  if (redirect.size === 0) return;

  for (const [from, into] of redirect) {
    const source = groups[from];
    const dest = groups[rootOf(into)];
    if (source === dest) continue;
    for (const [label, count] of source.variants) {
      dest.variants.set(label, (dest.variants.get(label) ?? 0) + count);
    }
    for (const conversation of source.conversations) dest.conversations.add(conversation);
    for (const conversation of source.answered) dest.answered.add(conversation);
    dest.positionTotal += source.positionTotal;
    dest.positionCount += source.positionCount;
    source.variants.clear();
    source.conversations.clear();
    source.answered.clear();
  }

  for (const questions of asked) {
    for (const question of questions) question.group = rootOf(question.group);
  }
}

function mostCommon(variants: Map<string, number>): string {
  let best = '';
  let bestCount = 0;
  for (const [label, count] of variants) {
    if (count > bestCount) {
      best = label;
      bestCount = count;
    }
  }
  return best;
}

function questionLabelOf(message: Message): string | null {
  if (!isInterviewer(message.role) || !message.text.includes('?')) return null;
  const label = extractQuestion(message.text);
  return questionKey(label) || questionTokens(label).size > 0 ? label : null;
}

function replaceQuestionLabel(text: string, label: string, english: string): string {
  const exact = text.indexOf(label);
  if (exact >= 0) return `${text.slice(0, exact)}${english}${text.slice(exact + label.length)}`;
  const at = text.toLowerCase().indexOf(label.toLowerCase());
  if (at < 0) return text;
  return `${text.slice(0, at)}${english}${text.slice(at + label.length)}`;
}

/** Question titles are translated on their own when the message translation left them as-is. */
async function translateRemainingQuestionLabels(
  conversations: Conversation[],
  onProgress?: ChatTranscriptProgress
): Promise<void> {
  const labels = [...new Set(questionLabels(conversations))].filter(
    (label) => !looksEnglish(label)
  );
  if (labels.length === 0) return;
  const translations = await translateTextsToEnglish(labels, (done, total) =>
    onProgress?.('translating', done, total)
  );
  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      const label = questionLabelOf(message);
      if (!label) continue;
      const english = translations.get(label);
      if (!english || english === label || /】|【|assistant to=/.test(english)) continue;
      message.text = replaceQuestionLabel(message.text, label, english);
    }
  }
}

function questionLabels(conversations: Conversation[]): string[] {
  const labels: string[] = [];
  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      const label = questionLabelOf(message);
      if (label != null) labels.push(label);
    }
  }
  return labels;
}

/**
 * Splits each conversation into interviewer questions and the respondent replies that follow,
 * matching reworded questions across conversations into one group. With embeddings, questions
 * are matched by meaning; otherwise by overlapping words.
 */
function groupQuestions(
  conversations: Conversation[],
  embeddings: Map<string, number[]> | null
): {
  groups: QuestionGroup[];
  asked: AskedQuestion[][];
} {
  const groups: QuestionGroup[] = [];
  const keyToGroup = new Map<string, number>();
  const groupsByToken = new Map<string, number[]>();
  const labelToGroup = new Map<string, number>();

  function addGroup(tokens: Set<string>, embedding: number[] | null): number {
    const index = groups.length;
    groups.push({
      tokens,
      embedding,
      variants: new Map(),
      conversations: new Set(),
      answered: new Set(),
      positionTotal: 0,
      positionCount: 0,
    });
    for (const token of tokens) {
      const list = groupsByToken.get(token) ?? [];
      list.push(index);
      groupsByToken.set(token, list);
    }
    return index;
  }

  if (embeddings) {
    // Most-asked phrasing first, so it seeds the group the rarer rewordings join.
    const labelCounts = new Map<string, number>();
    for (const label of questionLabels(conversations)) {
      labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    }
    const byFrequency = [...labelCounts.keys()].sort(
      (a, b) => (labelCounts.get(b) ?? 0) - (labelCounts.get(a) ?? 0)
    );
    for (const label of byFrequency) {
      const vector = embeddings.get(label);
      if (!vector) continue;
      let best: number | null = null;
      let bestScore = SAME_MEANING_THRESHOLD;
      groups.forEach((group, candidate) => {
        if (!group.embedding) return;
        let score = 0;
        for (let index = 0; index < vector.length; index += 1) {
          score += vector[index] * group.embedding[index];
        }
        if (score >= bestScore) {
          bestScore = score;
          best = candidate;
        }
      });
      labelToGroup.set(label, best ?? addGroup(questionTokens(label), vector));
    }
  }

  function closestGroup(tokens: Set<string>): number | null {
    const candidates = new Set<number>();
    for (const token of tokens) {
      for (const candidate of groupsByToken.get(token) ?? []) candidates.add(candidate);
    }
    let best: number | null = null;
    let bestScore = 0;
    for (const candidate of candidates) {
      const score = similarity(tokens, groups[candidate].tokens);
      if (score >= SIMILAR_QUESTION_THRESHOLD && score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return best;
  }

  function groupFor(label: string, conversation: number, position: number): number {
    const tokens = questionTokens(label);
    const key = [...tokens].sort().join(' ');
    let index = labelToGroup.get(label) ?? keyToGroup.get(key) ?? closestGroup(tokens);
    if (index == null) index = addGroup(tokens, null);
    keyToGroup.set(key, index);
    const group = groups[index];
    group.variants.set(label, (group.variants.get(label) ?? 0) + 1);
    group.conversations.add(conversation);
    group.positionTotal += position;
    group.positionCount += 1;
    return index;
  }

  const asked = conversations.map((conversation, conversationIndex) => {
    const questions: AskedQuestion[] = [];
    const questionMessages = conversation.messages.filter(
      (message) => isInterviewer(message.role) && message.text.includes('?')
    ).length;
    let current: AskedQuestion | null = null;
    for (const message of conversation.messages) {
      if (isInterviewer(message.role)) {
        const label = questionLabelOf(message);
        if (label == null) continue;
        const position = questionMessages > 1 ? questions.length / (questionMessages - 1) : 0;
        current = {
          group: groupFor(label, conversationIndex, position),
          label,
          answers: [],
        };
        questions.push(current);
        continue;
      }
      if (current && ROLE_GROUPS[message.role.toLowerCase()] !== 'system') {
        current.answers.push(message.text);
        groups[current.group].answered.add(conversationIndex);
      }
    }
    return questions;
  });

  return { groups, asked };
}

function buildQuestionRows(
  conversations: Conversation[],
  options: ChatTranscriptOptions,
  embeddings: Map<string, number[]> | null
): {
  questionHeaders: string[];
  rows: string[][];
  questionColumns: ChatTranscriptQuestionColumn[];
  followUpCount: number;
  minConversations: number;
  columnLimitReached: boolean;
} {
  const { groups, asked } = groupQuestions(conversations, embeddings);
  if (embeddings) mergeSimilarGroups(groups, asked, embeddings);
  const minConversations =
    options.followUpColumns || conversations.length < 2
      ? 1
      : Math.max(2, Math.ceil(conversations.length * COMMON_QUESTION_SHARE));
  const eligible = groups
    .map((_, index) => index)
    .filter((index) => groups[index].conversations.size >= minConversations);
  const columnLimitReached = eligible.length > MAX_QUESTION_COLUMNS;
  const kept = new Set(
    [...eligible]
      .sort((a, b) => groups[b].conversations.size - groups[a].conversations.size)
      .slice(0, MAX_QUESTION_COLUMNS)
  );
  const meanPosition = (index: number): number =>
    groups[index].positionTotal / Math.max(1, groups[index].positionCount);
  const columnGroups = eligible
    .filter((index) => kept.has(index))
    .sort((a, b) => meanPosition(a) - meanPosition(b) || a - b);
  const columnOf = new Map(columnGroups.map((group, column) => [group, column]));
  const hasFollowUps = columnGroups.length < groups.length;

  const rows = conversations.map((conversation, conversationIndex) => {
    const cells: string[] = columnGroups.map(() => '');
    const followUps: string[] = [];
    for (const question of asked[conversationIndex]) {
      const answer = question.answers.join('\n');
      const column = columnOf.get(question.group);
      if (column == null) {
        followUps.push(`Q: ${question.label}\nA: ${answer || '—'}`);
      } else {
        cells[column] = cells[column] ? `${cells[column]}\n${answer}` : answer;
      }
    }
    const row = [conversation.transcriptId, ...conversation.extras, ...cells.map(truncate)];
    if (hasFollowUps) row.push(truncate(followUps.join('\n\n')));
    return row;
  });

  const questionHeaders = columnGroups.map((group) => mostCommon(groups[group].variants));
  if (hasFollowUps) questionHeaders.push(OTHER_FOLLOW_UPS_HEADER);

  return {
    questionHeaders,
    rows,
    questionColumns: columnGroups.map((group) => ({
      question: mostCommon(groups[group].variants),
      conversationCount: groups[group].conversations.size,
      answeredCount: groups[group].answered.size,
    })),
    followUpCount: groups.length - columnGroups.length,
    minConversations,
    columnLimitReached,
  };
}

async function readFirstSheet(
  buffer: ArrayBuffer
): Promise<{ sheet: string; headers: string[]; rows: string[][] }> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    throw new TranscriptConvertError('Could not read the file. Save it as .xlsx and try again.');
  }
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new TranscriptConvertError('The workbook has no sheets.');

  const raw: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = [];
    for (let column = 1; column <= worksheet.columnCount; column += 1) {
      values.push(cellText(row.getCell(column).text));
    }
    if (values.some(Boolean)) raw.push(values);
  });

  if (raw.length < 2) {
    throw new TranscriptConvertError('The first sheet has no data rows under the header row.');
  }
  const headers = raw[0].map((header, index) => header || `Column ${index + 1}`);
  return { sheet: worksheet.name, headers, rows: raw.slice(1) };
}

function detectChatColumn(headers: string[], rows: string[][]): number {
  let bestIndex = -1;
  let bestHits = 0;
  headers.forEach((_, index) => {
    const hits = rows.slice(0, 200).filter((row) => looksLikeChat(row[index] ?? '')).length;
    if (hits > bestHits) {
      bestIndex = index;
      bestHits = hits;
    }
  });
  if (bestIndex < 0) {
    throw new TranscriptConvertError(
      'No column with chat logs found. Expected cells like [{"role": "assistant", "content": "…"}].'
    );
  }
  return bestIndex;
}

function detectIdColumn(headers: string[], chatColumn: number): number | null {
  const lowered = headers.map((header) => header.toLowerCase().replace(/[_-]+/g, ' ').trim());
  for (const candidate of ID_HEADERS) {
    const index = lowered.indexOf(candidate);
    if (index >= 0 && index !== chatColumn) return index;
  }
  return null;
}

/** Columns from `textFrom` onward hold long text: wider and wrapped. */
async function writeWorkbook(
  headers: string[],
  rows: (string | number)[][],
  textFrom: number,
  textWidth: number
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transcript');
  sheet.addRow(headers);
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF374151' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.alignment = { vertical: 'top', wrapText: true };
  });
  for (const row of rows) sheet.addRow(row);

  headers.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    if (index >= textFrom) {
      column.width = textWidth;
      column.alignment = { vertical: 'top', wrapText: true };
    } else {
      column.width = Math.min(Math.max(header.length + 4, 12), 30);
      column.alignment = { vertical: 'top' };
    }
  });
  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 1 }];

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function convertChatLogToTranscript(
  buffer: ArrayBuffer,
  options: ChatTranscriptOptions,
  onProgress?: ChatTranscriptProgress
): Promise<{ excel: Buffer; summary: ChatTranscriptSummary }> {
  onProgress?.('reading', 0, 1);
  const { sheet, headers, rows } = await readFirstSheet(buffer);
  const chatColumn = detectChatColumn(headers, rows);
  const idColumn = detectIdColumn(headers, chatColumn);
  const extraColumns = headers
    .map((_, index) => index)
    .filter((index) => index !== chatColumn && index !== idColumn);
  const hiddenRoles = options.includeSystem ? new Set<string>() : new Set(['system', 'tool', 'function']);

  const conversations: Conversation[] = [];
  const salvagedRows: number[] = [];
  const skippedRows: number[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const raw = row[chatColumn] ?? '';
    if (!raw) return;

    const parsed = parseMessages(raw);
    const messages = parsed.messages.filter((message) => !hiddenRoles.has(message.role.toLowerCase()));
    if (messages.length === 0) {
      skippedRows.push(rowNumber);
      return;
    }
    if (parsed.salvaged) salvagedRows.push(rowNumber);

    const transcriptId =
      (idColumn != null ? row[idColumn] : '') ||
      `T${String(conversations.length + 1).padStart(4, '0')}`;
    conversations.push({
      transcriptId,
      extras: extraColumns.map((column) => row[column] ?? ''),
      messages,
    });
  });

  if (conversations.length === 0) {
    throw new TranscriptConvertError(
      `No conversations could be read from the "${headers[chatColumn]}" column.`
    );
  }

  let translatedTextCount = 0;
  let embeddings: Map<string, number[]> | null = null;
  if (options.translateToEnglish) {
    const texts = conversations.flatMap((conversation) =>
      conversation.messages.map((message) => message.text)
    );
    const translations = await translateTextsToEnglish(texts, (done, total) =>
      onProgress?.('translating', done, total)
    );
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        const english = translations.get(message.text) ?? message.text;
        if (english !== message.text) translatedTextCount += 1;
        message.text = english;
      }
    }
    await translateRemainingQuestionLabels(conversations, onProgress);
    if (options.layout === 'questions') {
      onProgress?.('grouping', 0, 1);
      embeddings = await embedTexts(questionLabels(conversations));
    }
  }
  onProgress?.('writing', 0, 1);

  const extraHeaders = extraColumns.map((column) => headers[column]);
  const textFrom = 1 + extraHeaders.length;
  const turnCount = conversations.reduce((sum, item) => sum + item.messages.length, 0);
  let outHeaders: string[];
  let outRows: (string | number)[][];
  let questionColumns: ChatTranscriptQuestionColumn[] = [];
  let followUpCount = 0;
  let minConversationsPerColumn = 1;
  let columnLimitReached = false;
  let excel: Buffer;

  if (options.layout === 'questions') {
    const table = buildQuestionRows(conversations, options, embeddings);
    if (table.questionHeaders.length === 0) {
      throw new TranscriptConvertError(
        'No interviewer questions found. Questions are assistant messages that contain "?".'
      );
    }
    outHeaders = ['Transcript ID', ...extraHeaders, ...table.questionHeaders];
    outRows = table.rows;
    questionColumns = table.questionColumns;
    followUpCount = table.followUpCount;
    minConversationsPerColumn = table.minConversations;
    columnLimitReached = table.columnLimitReached;
    excel = await writeWorkbook(outHeaders, outRows, textFrom, 40);
  } else if (options.layout === 'turns') {
    outHeaders = ['Transcript ID', ...extraHeaders, 'Turn', 'Speaker', 'Text'];
    outRows = conversations.flatMap((conversation) =>
      conversation.messages.map((message, turn) => [
        conversation.transcriptId,
        ...conversation.extras,
        turn + 1,
        speakerFor(message.role, options),
        truncate(message.text),
      ])
    );
    excel = await writeWorkbook(outHeaders, outRows, outHeaders.length - 1, 90);
  } else {
    outHeaders = ['Transcript ID', ...extraHeaders, 'Turns', 'Transcript'];
    outRows = conversations.map((conversation) => [
      conversation.transcriptId,
      ...conversation.extras,
      conversation.messages.length,
      truncate(
        conversation.messages
          .map((message) => `${speakerFor(message.role, options)}: ${message.text}`)
          .join('\n\n')
      ),
    ]);
    excel = await writeWorkbook(outHeaders, outRows, outHeaders.length - 1, 90);
  }

  return {
    excel,
    summary: {
      sheet,
      chatColumn: headers[chatColumn],
      idColumn: idColumn != null ? headers[idColumn] : null,
      extraColumns: extraHeaders,
      conversationCount: conversations.length,
      turnCount,
      salvagedRows,
      skippedRows,
      layout: options.layout,
      questionColumns,
      followUpCount,
      minConversationsPerColumn,
      columnLimitReached,
      translated: options.translateToEnglish,
      translatedTextCount,
      previewHeaders: outHeaders,
      previewRows: outRows
        .slice(0, PREVIEW_ROWS)
        .map((row) => row.map((value) => String(value).slice(0, 400))),
    },
  };
}
