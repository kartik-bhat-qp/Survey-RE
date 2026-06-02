export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

/** e.g. 21/05/2026 */
export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

/** e.g. January 27, 2026 */
export function formatLongDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  const diffWeek = Math.round(diffDay / 7);
  return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
}

/** e.g. 1349 → "1,349" */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** e.g. 8200 → "8,200" for TextAI credit display */
export function formatTextAiCredits(value: number): string {
  return formatNumber(value);
}

/** Matches Kryptonite getSmartDateString: relative if within 7 days, else MMM DD yyyy */
export function formatSmartDate(date: string | Date): string {
  const d = new Date(date);
  const diffDays = Math.abs((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return formatRelativeDate(d);
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).formatToParts(d);
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  return `${month} ${day} ${year}`;
}
