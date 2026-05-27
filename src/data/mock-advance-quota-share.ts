import type { AdvanceQuota } from '@/data/mock-advance-quotas';

/** Path segment for the client-facing advance quotas dashboard (no editor chrome). */
export function buildAdvanceQuotaClientSharePath(surveyId: number): string {
  return `/share/surveys/${surveyId}/advance-quotas`;
}

/** Full URL for copying to clients (pass `origin` on the server). */
export function buildAdvanceQuotaClientShareUrl(
  surveyId: number,
  origin = typeof window !== 'undefined' ? window.location.origin : ''
): string {
  return `${origin}${buildAdvanceQuotaClientSharePath(surveyId)}`;
}

export function advanceQuotaClientShareVisibleIdsKey(surveyId: number): string {
  return `advance-quotas:${surveyId}:client-share-visible`;
}

/**
 * `null` means all current quotas are visible on the client dashboard.
 * Otherwise only the listed quota ids are shown.
 */
export type ClientShareVisibleQuotaIds = string[] | null;

export function filterQuotasForClientShare(
  quotas: ReadonlyArray<AdvanceQuota>,
  visibleIds: ClientShareVisibleQuotaIds
): AdvanceQuota[] {
  if (visibleIds === null) return [...quotas];
  const allowed = new Set(visibleIds);
  return quotas.filter((quota) => allowed.has(quota.id));
}

/** Merges stored ids with the current quota list (drops removed, keeps order from quotas). */
export function resolveClientShareVisibleIds(
  quotas: ReadonlyArray<AdvanceQuota>,
  stored: ClientShareVisibleQuotaIds
): string[] {
  if (stored === null) return quotas.map((quota) => quota.id);
  const validIds = new Set(quotas.map((quota) => quota.id));
  return stored.filter((id) => validIds.has(id));
}

export function toClientShareVisibleStorage(
  quotas: ReadonlyArray<AdvanceQuota>,
  selectedIds: ReadonlyArray<string>
): ClientShareVisibleQuotaIds {
  if (selectedIds.length === 0) return [];
  if (selectedIds.length >= quotas.length) return null;
  return [...selectedIds];
}

export function getClientShareSelectionLabel(
  quotas: ReadonlyArray<AdvanceQuota>,
  visibleIds: ClientShareVisibleQuotaIds
): string {
  const count = filterQuotasForClientShare(quotas, visibleIds).length;
  return `${count} of ${quotas.length} quotas on client link`;
}
