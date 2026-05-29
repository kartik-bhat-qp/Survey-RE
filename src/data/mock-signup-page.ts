export type SignupSocialProvider = {
  id: 'google' | 'microsoft';
  label: string;
};

export type SignupFeatureSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Shows QuestionPro AI styling in the feature carousel eyebrow. */
  aiFeatured?: boolean;
};

export type SignupAiCapability = {
  id: string;
  label: string;
  icon: string;
};

export const SIGNUP_SOCIAL_PROVIDERS: SignupSocialProvider[] = [
  { id: 'google', label: 'Sign up with Google' },
  { id: 'microsoft', label: 'Sign up with Microsoft' },
];

export const SIGNUP_TAGLINE =
  'Research-grade surveys with QuestionPro AI, simply describe what you need and let us do the rest.';

export const SIGNUP_AI_CAPABILITIES: SignupAiCapability[] = [
  { id: 'draft', label: 'Draft surveys from a prompt', icon: 'wm-auto-awesome' },
  { id: 'scales', label: 'Smart scales & question types', icon: 'wm-tune' },
  { id: 'insights', label: 'AI-powered insights', icon: 'wm-insights' },
];

export const SIGNUP_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export type SignupLanguage = (typeof SIGNUP_LANGUAGES)[number];

export const SIGNUP_FEATURE_SLIDES: SignupFeatureSlide[] = [
  {
    id: 'prism-ai',
    eyebrow: 'QuestionPro AI',
    title: 'Go from idea to survey in minutes',
    description:
      'Tell QuestionPro AI your research goals — it drafts questions, picks scales, and hands you an editable survey.',
    aiFeatured: true,
  },
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

