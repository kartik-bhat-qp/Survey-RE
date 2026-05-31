/** Matches `/surveys/[id]` including draft ids `-1` (AI) and `0` (blank). */
const SURVEY_EDITOR_PATH = /^\/surveys\/(-?\d+)$/;

export function parseSurveyEditorIdFromPathname(pathname: string): number | null {
  const match = pathname.match(SURVEY_EDITOR_PATH);
  if (!match) return null;
  return Number(match[1]);
}

export function isSurveyEditorPathname(pathname: string): boolean {
  return SURVEY_EDITOR_PATH.test(pathname);
}
