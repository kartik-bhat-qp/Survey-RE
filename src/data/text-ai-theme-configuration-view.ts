import type { TextAiSentimentEditableResponse } from '../components/text-ai/TextAiUpdateSentimentModal';

export interface ThemeResponseFilters {
  showCensored: boolean;
  subthemeIds: ReadonlySet<string>;
  search: string;
  minimumTags: number | 'all' | 'untagged';
  newestFirst: boolean;
  sentiment: string;
  startDate: string;
  endDate: string;
}

// Synthetic collection dates belong to the prototype's response corpus.
export function themeResponseDate(responseId: number): string {
  return responseId >= 100001 ? '2026-10-05' : `2026-09-${String((responseId - 1) % 28 + 1).padStart(2, '0')}`;
}

export function filterThemeResponses<T extends TextAiSentimentEditableResponse>(responses: T[], filters: ThemeResponseFilters): T[] {
  const query = filters.search.trim().toLocaleLowerCase();
  return responses.filter(response => {
    if (!filters.showCensored && response.subthemes.some(tag => tag.id === 'outlier:censored')) return false;
    if (filters.subthemeIds.size && !response.subthemes.some(tag => filters.subthemeIds.has(tag.id))) return false;
    if (filters.minimumTags === 'untagged' && response.subthemes.length) return false;
    if (typeof filters.minimumTags === 'number' && response.subthemes.length < filters.minimumTags) return false;
    if (query && !response.text.toLocaleLowerCase().includes(query)) return false;
    if (filters.sentiment && !response.subthemes.some(tag => tag.sentiment === filters.sentiment)) return false;
    const date = themeResponseDate(response.id);
    return (!filters.startDate || date >= filters.startDate) && (!filters.endDate || date <= filters.endDate);
  }).sort((a, b) => {
    const byDate = themeResponseDate(a.id).localeCompare(themeResponseDate(b.id)) || a.id - b.id;
    return filters.newestFirst ? -byDate : byDate;
  });
}
