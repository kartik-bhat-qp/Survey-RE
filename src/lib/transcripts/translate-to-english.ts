import OpenAI from 'openai';

const DEFAULT_MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 256;
const BATCH_MAX_ITEMS = 40;
const BATCH_MAX_CHARS = 8000;
const CONCURRENCY = 8;
const MAX_RETRIES = 4;

const EN_WORDS = new Set(
  'the and you your to of is it that this for with my we are what would have be in was they not but i me our do'.split(' ')
);
const DE_WORDS = new Set(
  'und der die das ist nicht ich sie es mit ein eine zu auf für wir sehr auch dass wenn oder aber man wäre würde haben sind mir'.split(' ')
);
const DA_WORDS = new Set(
  'og det er ikke jeg at en til på med som de vi har meget så hvad hvis kan være var mig der du'.split(' ')
);
const NON_ENGLISH_LETTERS = /[æøåäöüß]/i;

export type TranslationProgress = (done: number, total: number) => void;

export class TranslationUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslationUnavailableError';
  }
}

const translationCache = new Map<string, string>();

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new TranslationUnavailableError(
      'Translating to English needs an OpenAI API key. Add OPENAI_API_KEY to .env.local and restart the dev server.'
    );
  }
  return new OpenAI({ apiKey });
}

/** Cheap stop-word check so clearly English text skips the API. */
export function looksEnglish(text: string): boolean {
  if (!/\p{L}/u.test(text)) return true;
  if (NON_ENGLISH_LETTERS.test(text)) return false;
  let en = 0;
  let foreign = 0;
  for (const word of text.toLowerCase().split(/[^\p{L}]+/u)) {
    if (EN_WORDS.has(word)) en += 1;
    if (DE_WORDS.has(word) || DA_WORDS.has(word)) foreign += 1;
  }
  return en > 0 && en >= foreign * 2;
}

async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      const status = error instanceof OpenAI.APIError ? error.status : undefined;
      if (status === 401) {
        throw new TranslationUnavailableError(
          'The OpenAI API key was rejected. Check OPENAI_API_KEY in .env.local.'
        );
      }
      const retryable = status === undefined || status === 429 || status >= 500;
      if (!retryable || attempt >= MAX_RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
}

async function translateBatch(client: OpenAI, model: string, items: string[]): Promise<string[]> {
  const completion = await withRetry(() =>
    client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You translate interview transcript snippets into natural English. Translate every item faithfully; do not summarise, answer, or add commentary. Keep names, numbers and formatting. If an item is already English, return it unchanged. Reply with JSON {"t": [...]} containing exactly one string per input item, in the same order.',
        },
        { role: 'user', content: JSON.stringify({ items }) },
      ],
    })
  );
  const content = completion.choices[0]?.message?.content ?? '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = null;
  }
  const translations = (parsed as { t?: unknown } | null)?.t;
  if (Array.isArray(translations) && translations.length === items.length) {
    return translations.map((value, index) => (typeof value === 'string' ? value : items[index]));
  }
  if (items.length === 1) return items;
  const middle = Math.ceil(items.length / 2);
  return [
    ...(await translateBatch(client, model, items.slice(0, middle))),
    ...(await translateBatch(client, model, items.slice(middle))),
  ];
}

async function runPool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<void> {
  let next = 0;
  async function worker(): Promise<void> {
    while (next < tasks.length) {
      const index = next;
      next += 1;
      await tasks[index]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
}

/** Returns a map from each input text to its English translation. */
export async function translateTextsToEnglish(
  texts: string[],
  onProgress?: TranslationProgress
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const pending: string[] = [];
  for (const text of new Set(texts)) {
    const cached = translationCache.get(text);
    if (cached != null) result.set(text, cached);
    else if (looksEnglish(text)) result.set(text, text);
    else pending.push(text);
  }
  if (pending.length === 0) return result;

  const client = getClient();
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  const batches: string[][] = [];
  let batch: string[] = [];
  let chars = 0;
  for (const text of pending) {
    if (batch.length > 0 && (batch.length >= BATCH_MAX_ITEMS || chars + text.length > BATCH_MAX_CHARS)) {
      batches.push(batch);
      batch = [];
      chars = 0;
    }
    batch.push(text);
    chars += text.length;
  }
  if (batch.length > 0) batches.push(batch);

  let done = 0;
  onProgress?.(0, pending.length);
  await runPool(
    batches.map((items) => async () => {
      const translated = await translateBatch(client, model, items);
      items.forEach((text, index) => {
        translationCache.set(text, translated[index]);
        result.set(text, translated[index]);
      });
      done += items.length;
      onProgress?.(done, pending.length);
    }),
    CONCURRENCY
  );
  return result;
}

/** Unit-length embeddings, so a dot product is the cosine similarity. */
export async function embedTexts(texts: string[]): Promise<Map<string, number[]>> {
  const client = getClient();
  const unique = [...new Set(texts)];
  const result = new Map<string, number[]>();
  const chunks: string[][] = [];
  for (let index = 0; index < unique.length; index += 500) {
    chunks.push(unique.slice(index, index + 500));
  }
  await runPool(
    chunks.map((chunk) => async () => {
      const response = await withRetry(() =>
        client.embeddings.create({
          model: EMBEDDING_MODEL,
          input: chunk,
          dimensions: EMBEDDING_DIMENSIONS,
        })
      );
      response.data.forEach((item) => {
        const vector = item.embedding;
        const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
        result.set(chunk[item.index], vector.map((value) => value / norm));
      });
    }),
    4
  );
  return result;
}
