export type SignupSocialProvider = {
  id: 'google' | 'microsoft';
  label: string;
};

export type SignupFeatureSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};

export const SIGNUP_SOCIAL_PROVIDERS: SignupSocialProvider[] = [
  { id: 'google', label: 'Sign up with Google' },
  { id: 'microsoft', label: 'Sign up with Microsoft' },
];

export const SIGNUP_TAGLINE =
  'Get better data with surveys, quizzes, panels, and research tools built for teams.';

export const SIGNUP_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export type SignupLanguage = (typeof SIGNUP_LANGUAGES)[number];

export const SIGNUP_COOKIE_CONSENT = {
  title: 'Cookie consent',
  description:
    'We use cookies to improve your experience, analyze site traffic, and personalize content. You can manage your preferences at any time.',
  acceptLabel: 'Accept all cookies',
  settingsLabel: 'Cookie settings',
};

export const SIGNUP_FEATURE_SLIDES: SignupFeatureSlide[] = [
  {
    id: 'surveys',
    eyebrow: 'Survey builder',
    title: 'Build surveys that get better responses',
    description: 'Design, distribute, and analyze research with an intuitive drag-and-drop editor.',
  },
  {
    id: 'insights',
    eyebrow: 'Analytics',
    title: 'Turn responses into actionable insights',
    description: 'Real-time dashboards and reports help you understand your audience faster.',
  },
  {
    id: 'distribution',
    eyebrow: 'Distribution',
    title: 'Reach respondents anywhere',
    description: 'Share via email, link, embed, or panel — all from one platform.',
  },
];

export const SIGNUP_COUNTRY_CODES = [
  { value: '+1', label: 'US +1' },
  { value: '+44', label: 'UK +44' },
  { value: '+91', label: 'IN +91' },
  { value: '+61', label: 'AU +61' },
  { value: '+49', label: 'DE +49' },
];

export type SignupCountryCode = (typeof SIGNUP_COUNTRY_CODES)[number];
