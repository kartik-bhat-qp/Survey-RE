export type CaptchaRecaptchaType = 'v2' | 'invisible';

/** How invisible reCAPTCHA shows progress on the respondent page. */
export type CaptchaFeedbackStyle = 'button' | 'banner';

export interface CaptchaSettings {
  recaptchaType: CaptchaRecaptchaType;
  /** When using Invisible reCAPTCHA (v3), show V2 checkbox if verification fails. */
  showV2OnV3VerificationFailed: boolean;
  /** Respondent UX when invisible verification runs on Next/Done. */
  captchaFeedbackStyle: CaptchaFeedbackStyle;
}

export const DEFAULT_CAPTCHA_SETTINGS: CaptchaSettings = {
  recaptchaType: 'v2',
  showV2OnV3VerificationFailed: false,
  captchaFeedbackStyle: 'button',
};

export const CAPTCHA_RECAPTCHA_TYPE_OPTIONS: {
  value: CaptchaRecaptchaType;
  label: string;
  description: string;
  isNew?: boolean;
}[] = [
  {
    value: 'v2',
    label: 'reCAPTCHA V2',
    description: 'Users confirm with an "I\'m not a robot" checkbox.',
  },
  {
    value: 'invisible',
    label: 'Invisible reCAPTCHA',
    description: 'Users are verified automatically in the background.',
    isNew: true,
  },
];

export const CAPTCHA_FEEDBACK_STYLE_OPTIONS: {
  value: CaptchaFeedbackStyle;
  label: string;
  description: string;
}[] = [
  {
    value: 'button',
    label: 'Show status on the Next button',
    description:
      'Display "Verifying…" with a spinner on the Next button while verification is in progress.',
  },
  {
    value: 'banner',
    label: 'Show an inline status banner',
    description: 'Display a banner above the button while verification is in progress.',
  },
];

export const CAPTCHA_FAILURE_HANDLING_COPY = {
  sectionLabel: 'Verification Failure Handling',
  toggleLabel: 'Fall back to the checkbox',
  toggleDescription:
    'If invisible verification fails, show the "I\'m not a robot" checkbox automatically.',
} as const;
