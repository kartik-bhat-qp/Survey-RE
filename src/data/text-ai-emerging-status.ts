import type { TextAiEmergingValidityDays } from '@/data/text-ai-theme-preferences';

/**
 * Mock ages keep each validity preset demonstrable without relying on a fixed
 * calendar date. Production data would supply the theme's detected-at date.
 */
const EMERGING_AGE_DAYS_BY_NAME: Record<string, number> = {
  'Customer App Engagement and Feedback': 4,
  'Customer Experience Differentiation': 10,
  'Customer Experience Feedback Gaps': 4,
  'Customer Loyalty and Advocacy Signals': 21,
  'Early Bird Ticket Interest': 10,
  'Fight Night Audience Segmentation': 21,
  'Service Flow Consistency': 10,
  'Service Flow Consistency Issues': 10,
  'Staff Attentiveness to Customer Needs': 21,
  'Staff Friendliness and Professionalism': 4,
  'Staff Interaction and Courtesy': 10,
  'Staff Service Attitude Analysis': 21,
  'Staff Service Interaction Analysis': 10,
  'Visit Convenience and Accessibility': 4,
};

function getFallbackAgeDays(name: string): number {
  const hash = [...name].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  return [4, 10, 21][hash % 3];
}

export function isTextAiItemEmerging(
  name: string,
  emergingCandidate: boolean | undefined,
  validityDays: TextAiEmergingValidityDays
): boolean {
  if (!emergingCandidate) return false;

  const ageDays =
    EMERGING_AGE_DAYS_BY_NAME[name] ?? getFallbackAgeDays(name);
  return ageDays <= validityDays;
}
