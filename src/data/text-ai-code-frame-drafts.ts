import type { TextAiSentimentSubtheme } from '../components/text-ai/TextAiUpdateSentimentModal';

export type ThemeTone = 'blue' | 'green' | 'red';
export interface SubTheme {
  description?: string;
  id: string;
  emerging?: boolean;
  pendingApproval?: boolean;
  name: string;
  percentage: string;
  mergedFrom?: string[];
}
export interface ThemeGroup {
  emerging?: boolean;
  id: string;
  name: string;
  pendingApproval?: boolean;
  percentage: string;
  tone: ThemeTone;
  subThemes: SubTheme[];
}
export type CodeFrames = Record<string, ThemeGroup[]>;
export type CodeFrameDrafts = Record<string, { before: ThemeGroup[]; after: ThemeGroup[] }>;
export interface CodeFrameSummary {
  themesAdded: number;
  themesDeleted: number;
  themesUpdated: number;
  subThemesAdded: number;
  subThemesDeleted: number;
  subThemesUpdated: number;
  merges: number;
  changes: number;
}

const normalizedName = (name: string) => name.trim().toLocaleLowerCase();
export function validateCodeFrameName(name: string, existingNames: string[]): string | null {
  if (!name.trim()) return 'Enter a name.';
  if (name.trim().length > 100) return 'Use 100 characters or fewer.';
  if (existingNames.some((existing) => normalizedName(existing) === normalizedName(name))) {
    return 'This name is already in use. Choose a different name.';
  }
  return null;
}

function structure(groups: ThemeGroup[]) {
  return groups.map((group) => ({ id: group.id, name: group.name,
    subThemes: group.subThemes.map(({ id, name, description }) => ({ id, name, description: description ?? '' })) }));
}

export function stageCodeFrame(drafts: CodeFrameDrafts, scope: string, baseline: ThemeGroup[], after: ThemeGroup[]): CodeFrameDrafts {
  const before = drafts[scope]?.before ?? baseline;
  const next = { ...drafts };
  if (JSON.stringify(structure(before)) === JSON.stringify(structure(after))) delete next[scope];
  else next[scope] = { before, after };
  return next;
}

export function summarizeCodeFrameDrafts(drafts: CodeFrameDrafts): CodeFrameSummary {
  const summary = { themesAdded: 0, themesDeleted: 0, themesUpdated: 0, subThemesAdded: 0, subThemesDeleted: 0, subThemesUpdated: 0, merges: 0, changes: 0 };
  for (const { before, after } of Object.values(drafts)) {
    const original = new Map<string, SubTheme>(before.flatMap((group) => group.subThemes.map((sub) => [`${group.id}:${sub.id}`, sub] as const)));
    const current = new Map<string, SubTheme>(after.flatMap((group) => group.subThemes.map((sub) => [`${group.id}:${sub.id}`, sub] as const)));
    const mergedSources = new Set<string>();
    for (const [id, sub] of current) {
      if (!original.has(id) && sub.mergedFrom?.some((source) => original.has(source))) {
        summary.merges++;
        sub.mergedFrom.forEach((source) => mergedSources.add(source));
      } else if (!original.has(id)) summary.subThemesAdded++;
      else if (sub.name !== original.get(id)?.name || (sub.description ?? '') !== (original.get(id)?.description ?? '')) summary.subThemesUpdated++;
    }
    summary.themesAdded += after.filter((group) => !before.some((item) => item.id === group.id)).length;
    summary.themesDeleted += before.filter((group) => !after.some((item) => item.id === group.id)).length;
    summary.themesUpdated += after.filter(group => before.some(item => item.id === group.id && item.name !== group.name)).length;
    // Child removals are covered by a parent deletion or merge, not counted twice.
    summary.subThemesDeleted += before.filter((group) => after.some((item) => item.id === group.id))
      .flatMap((group) => group.subThemes.map((sub) => `${group.id}:${sub.id}`))
      .filter((id) => !current.has(id) && !mergedSources.has(id)).length;
  }
  summary.changes = summary.themesAdded + summary.themesDeleted + summary.themesUpdated + summary.subThemesAdded + summary.subThemesDeleted + summary.subThemesUpdated + summary.merges;
  return summary;
}

export function removeCodeFrameItems(groups: ThemeGroup[], themeIds: string[], subThemeIds: string[]): ThemeGroup[] {
  return groups.filter((group) => !themeIds.includes(group.id)).map((group) => ({ ...group,
    subThemes: group.subThemes.filter((sub) => !subThemeIds.includes(`${group.id}:${sub.id}`)) }));
}

export function moveCodeFrameItems(groups: ThemeGroup[], sourceIds: string[], parentId: string): { groups: ThemeGroup[]; tagIds: Record<string, string> } {
  const parent = groups.find(group => group.id === parentId);
  if (!parent) throw new Error('Select a destination theme.');
  const sources = groups.flatMap(group => group.subThemes
    .filter(sub => sourceIds.includes(`${group.id}:${sub.id}`) && group.id !== parentId)
    .map(sub => ({ groupId: group.id, sub })));
  if (!sources.length) throw new Error('Select a different destination theme.');
  if (sources.some(({ groupId, sub }) => `${groupId}:${sub.id}` === 'outlier:censored')) throw new Error('Censored must remain under Outlier.');
  const names = parent.subThemes.map(sub => sub.name);
  const usedIds = new Set(parent.subThemes.map(sub => sub.id));
  const tagIds: Record<string, string> = {};
  const moved = sources.map(({ groupId, sub }) => {
    const error = validateCodeFrameName(sub.name, names);
    if (error) throw new Error(`${sub.name}: ${error}`);
    names.push(sub.name);
    let id = sub.id;
    let suffix = 0;
    while (usedIds.has(id)) id = `${groupId}-${sub.id}-${++suffix}`;
    usedIds.add(id);
    tagIds[`${groupId}:${sub.id}`] = `${parentId}:${id}`;
    return { ...sub, id };
  });
  return { groups: groups.map(group => ({ ...group,
    subThemes: [...group.subThemes.filter(sub => !tagIds[`${group.id}:${sub.id}`]), ...(group.id === parentId ? moved : [])],
  })), tagIds };
}

export function mergeCodeFrameItems(groups: ThemeGroup[], sourceIds: string[], parentId: string, destination: SubTheme): ThemeGroup[] {
  const sources = groups.flatMap((group) => group.subThemes.filter((sub) => sourceIds.includes(`${group.id}:${sub.id}`)));
  if (sourceIds.length < 2 || sources.length !== sourceIds.length || !groups.some((group) => group.id === parentId)) {
    throw new Error('Select at least two existing sub-themes and a destination theme.');
  }
  const mergedFrom = [...new Set([...sourceIds, ...sources.flatMap((sub) => sub.mergedFrom ?? [])])];
  return removeCodeFrameItems(groups, [], sourceIds).map((group) => group.id === parentId
    ? { ...group, subThemes: [...group.subThemes, { ...destination, mergedFrom }] } : group);
}

export function remapResponseTags(tags: TextAiSentimentSubtheme[], removedIds: ReadonlySet<string>, destination?: TextAiSentimentSubtheme): TextAiSentimentSubtheme[] {
  const affected = tags.filter((tag) => removedIds.has(tag.id));
  if (!affected.length) return tags;
  const remaining = tags.filter((tag) => !removedIds.has(tag.id));
  if (!destination || remaining.some((tag) => tag.id === destination.id)) return remaining;
  const sentiment = affected.every((tag) => tag.sentiment === affected[0].sentiment) ? affected[0].sentiment : 'neutral';
  return [...remaining, { ...destination, sentiment }];
}

export function parseCodeFrames(value: unknown): CodeFrames {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid saved code frame');
  for (const groups of Object.values(value)) {
    if (!Array.isArray(groups) || !groups.every((group: unknown) => {
      if (!group || typeof group !== 'object' || !('id' in group) || typeof group.id !== 'string' ||
          !('name' in group) || typeof group.name !== 'string' || !('tone' in group) || !['blue', 'green', 'red'].includes(String(group.tone)) ||
          !('percentage' in group) || typeof group.percentage !== 'string' || !('subThemes' in group) || !Array.isArray(group.subThemes)) return false;
      return group.subThemes.every((sub: unknown) => sub && typeof sub === 'object' && 'id' in sub && typeof sub.id === 'string' &&
        'name' in sub && typeof sub.name === 'string' && 'percentage' in sub && typeof sub.percentage === 'string' &&
        (!('description' in sub) || typeof sub.description === 'string') &&
        (!('mergedFrom' in sub) || (Array.isArray(sub.mergedFrom) && sub.mergedFrom.every((id: unknown) => typeof id === 'string'))));
    })) throw new Error('Invalid saved code frame');
  }
  return value as CodeFrames;
}
