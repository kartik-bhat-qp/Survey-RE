import {
  EMPTY_INTEGRITY_COVERAGE,
  INTEGRITY_COVERAGE_KEY,
  coverageWithNewSurvey,
  type IntegrityCoverage,
} from '@/lib/integrity/coverage';

const STORAGE_KEY = `survey-re:${INTEGRITY_COVERAGE_KEY}`;

function readCoverage(): IntegrityCoverage {
  if (typeof window === 'undefined') return EMPTY_INTEGRITY_COVERAGE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_INTEGRITY_COVERAGE;
    const parsed = JSON.parse(raw) as Partial<IntegrityCoverage>;
    return {
      surveys: Array.isArray(parsed.surveys) ? parsed.surveys : [],
      communities: Array.isArray(parsed.communities) ? parsed.communities : [],
      newSurveys: parsed.newSurveys,
    };
  } catch {
    return EMPTY_INTEGRITY_COVERAGE;
  }
}

/** If the organization default is on, protect this newly created survey. Existing surveys are left alone. */
export function applyOrganizationIntegrityToNewSurvey(surveyId: number): void {
  if (typeof window === 'undefined' || !Number.isFinite(surveyId)) return;
  const current = readCoverage();
  const next = coverageWithNewSurvey(current, surveyId);
  if (next === current) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* localStorage may be unavailable. */
  }
}
