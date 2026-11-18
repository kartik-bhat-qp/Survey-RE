export const AIRLINE_DRIVER_NAMES = [
  'On-time performance',
  'Cabin crew service',
  'Check-in & boarding',
  'Seat comfort',
  'Baggage handling',
  'Fare fairness',
  'Booking & app experience',
  'In-flight entertainment',
  'Food & beverage',
  'Loyalty program value',
];

export type DriverAnalysisMode = 'diagnose' | 'predict';

export const DRIVER_ANALYSIS_WIDGET_TITLE = 'NPS driver analysis';

/** Compact subject used in the widget title, derived from the primary question. */
export function primaryQuestionSubject(text: string): string {
  const raw = text.replace(/\?+$/, '').trim();
  if (/\brecommend\b/i.test(raw)) return 'NPS';
  if (/overall satisfaction/i.test(raw)) return 'Overall satisfaction';
  if (/\bsatisfaction\b/i.test(raw)) return 'Satisfaction';

  let subject = raw
    .replace(/^(please |kindly )/i, '')
    .replace(
      /^(what is your |what's your |what is the |what is |how would you rate |how do you rate |how satisfied are you with |how often do you |how likely are you to |rate |please rate )/i,
      ''
    )
    .replace(/^(use |the |this |your )/i, '')
    .trim();
  if (!subject) subject = raw;
  subject = subject.charAt(0).toUpperCase() + subject.slice(1);
  if (subject.length > 42) return `${subject.slice(0, 40).trimEnd()}…`;
  return subject;
}

export function driverAnalysisWidgetTitle(primary: {
  text: string;
  type?: string;
}): string {
  if (primary.type === 'NPS' || /\brecommend\b/i.test(primary.text)) {
    return DRIVER_ANALYSIS_WIDGET_TITLE;
  }
  return `${primaryQuestionSubject(primary.text)} driver analysis`;
}
