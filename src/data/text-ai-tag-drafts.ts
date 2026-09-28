import type { TextAiSentimentSubtheme } from '../components/text-ai/TextAiUpdateSentimentModal';

export type TagAssignments = Record<string, TextAiSentimentSubtheme[]>;
export type TagDrafts = Record<string, {
  before: TextAiSentimentSubtheme[];
  after: TextAiSentimentSubtheme[];
}>;

// IDs, rather than display labels or order, identify an assignment.
export function stageTagAssignment(
  drafts: TagDrafts,
  key: string,
  saved: TextAiSentimentSubtheme[],
  next: TextAiSentimentSubtheme[],
): TagDrafts {
  const before = drafts[key]?.before ?? saved;
  const after = Array.from(new Map(next.map((tag) => [tag.id, tag])).values());
  const result = { ...drafts };
  if (before.length === after.length && before.every((tag) => after.some((item) => item.id === tag.id))) {
    delete result[key];
  } else {
    result[key] = { before, after };
  }
  return result;
}

export function summarizeTagDrafts(drafts: TagDrafts) {
  let added = 0;
  let removed = 0;
  for (const { before, after } of Object.values(drafts)) {
    added += after.filter((tag) => !before.some((item) => item.id === tag.id)).length;
    removed += before.filter((tag) => !after.some((item) => item.id === tag.id)).length;
  }
  return { added, removed, changes: added + removed, responses: Object.keys(drafts).length };
}

export function commitTagDrafts(saved: TagAssignments, drafts: TagDrafts): TagAssignments {
  return { ...saved, ...Object.fromEntries(Object.entries(drafts).map(([key, draft]) => [key, draft.after])) };
}

export function parseTagAssignments(raw: string | null): TagAssignments {
  if (!raw) return {};
  const value: unknown = JSON.parse(raw);
  const sentiments = ['very-negative', 'negative', 'neutral', 'positive', 'very-positive'];
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved tags');
  for (const tags of Object.values(value)) {
    if (!Array.isArray(tags) || !tags.every((tag: unknown) =>
      tag !== null && typeof tag === 'object' &&
      'id' in tag && typeof tag.id === 'string' &&
      'label' in tag && typeof tag.label === 'string' &&
      'sentiment' in tag && typeof tag.sentiment === 'string' && sentiments.includes(tag.sentiment)
    )) throw new Error('Invalid saved tags');
  }
  return value as TagAssignments;
}
