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
  /** Always true — falling back to the V2 checkbox on invisible failure is mandatory. */
  showV2OnV3VerificationFailed: true,
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
