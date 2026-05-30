export type SurveyFooterBrand = 'essentials' | 'research';

const STORAGE_KEY = 'survey-suite-footer-brand';
export const SURVEY_FOOTER_BRAND_CHANGED = 'survey-footer-brand-changed';

/** Query param on Research Suite → Surveys product switcher links */
export const PRODUCT_SWITCHER_SURVEYS_QUERY = 'from=product-switcher';

export function getSurveyFooterBrand(): SurveyFooterBrand {
  if (typeof window === 'undefined') return 'research';
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored === 'essentials' ? 'essentials' : 'research';
}

export function setSurveyFooterBrand(brand: SurveyFooterBrand): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, brand);
  window.dispatchEvent(new Event(SURVEY_FOOTER_BRAND_CHANGED));
}

export function surveyFooterBrandLabel(brand: SurveyFooterBrand): string {
  return brand === 'essentials' ? 'Essentials' : 'Research';
}

export function formatSurveySuiteFooterCopy(brand: SurveyFooterBrand): string {
  return `${surveyFooterBrandLabel(brand)} ©2026 QuestionPro`;
}
