export type AccountNavId =
  | 'my-account'
  | 'billing'
  | 'compliance'
  | 'issue-tracker'
  | 'migration-center';

export type ComplianceTabId =
  | 'can-spam'
  | 'privacy'
  | 'accessibility'
  | 'respondent-anonymity';

export interface AccountNavItem {
  id: AccountNavId;
  label: string;
  href: string;
}

export interface ComplianceTabItem {
  id: ComplianceTabId;
  label: string;
  icon: string;
}

export interface CanSpamComplianceDetails {
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  zipcode: string;
  country: string;
}

export interface RaaComplianceField {
  id: string;
  label: string;
  category: 'Standard Fields' | 'Custom Variables';
  alwaysEnabled?: boolean;
}

export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  { id: 'my-account', label: 'My Account', href: '/my-account' },
  { id: 'billing', label: 'Billing & Invoices', href: '/billing' },
  { id: 'compliance', label: 'Compliance', href: '/compliance' },
  { id: 'issue-tracker', label: 'Issue Tracker', href: '/issue-tracker' },
  { id: 'migration-center', label: 'Migration Center', href: '/migration-center' },
];

export const COMPLIANCE_TABS: ComplianceTabItem[] = [
  { id: 'can-spam', label: 'CAN-SPAM', icon: 'wm-description' },
  { id: 'privacy', label: 'Privacy', icon: 'wm-lock' },
  { id: 'accessibility', label: 'Accessibility', icon: 'wm-accessible' },
  {
    id: 'respondent-anonymity',
    label: 'RAA',
    icon: 'wm-visibility',
  },
];

export const DEFAULT_CAN_SPAM_DETAILS: CanSpamComplianceDetails = {
  company: 'kartik.bhat',
  addressLine1: 'haha',
  addressLine2: '',
  city: 'na',
  stateProvince: 'ma',
  zipcode: '410543',
  country: 'india',
};

export const CAN_SPAM_INFO_TOOLTIP =
  'CAN-SPAM requires a valid physical mailing address in commercial email messages.';

export const RAA_COMPLIANCE_INFO_TOOLTIP =
  'Preview the respondent popup and add your own additional content shown with Respondent Anonymity Assurance.';

export interface RaaPopupCopy {
  /** Heading shown inside the popup body above the intro. */
  bodyTitle: string;
  intro: string;
  /** Fixed assurance copy shown after enabled fields — not editable. */
  outro: string;
  /** Optional client additional content shown below the fixed outro. */
  additionalContent: string;
}

export const DEFAULT_RAA_POPUP_COPY: RaaPopupCopy = {
  bodyTitle: 'Your Privacy is Protected',
  intro:
    "This survey is protected by QuestionPro's Respondent Anonymity Assurance. The following information is encrypted before it is stored:",
  outro:
    'Once encrypted, this information cannot be accessed or decrypted by the survey owner, QuestionPro, or any third party. Your identity remains permanently protected.',
  additionalContent: '',
};

/** Older fixed outro strings that must not be treated as client additional content. */
const LEGACY_FIXED_OUTROS = [
  'There is no way for the sender or even QuestionPro to access this data. This data can never be decrypted.',
  DEFAULT_RAA_POPUP_COPY.outro,
] as const;

export const RAA_POPUP_COPY_STORAGE_KEY = 'raa-popup-copy';

const PERSIST_PREFIX = 'survey-re:';

export function readRaaPopupCopy(): RaaPopupCopy {
  if (typeof window === 'undefined') return { ...DEFAULT_RAA_POPUP_COPY };
  try {
    const raw = window.localStorage.getItem(PERSIST_PREFIX + RAA_POPUP_COPY_STORAGE_KEY);
    if (raw === null || raw.trim() === '') return { ...DEFAULT_RAA_POPUP_COPY };
    return normalizeRaaPopupCopy(JSON.parse(raw) as Partial<RaaPopupCopy>);
  } catch {
    return { ...DEFAULT_RAA_POPUP_COPY };
  }
}

export function normalizeRaaPopupCopy(parsed: Partial<RaaPopupCopy>): RaaPopupCopy {
  const legacyOutro = typeof parsed.outro === 'string' ? parsed.outro.trim() : '';
  const migratedAdditional =
    typeof parsed.additionalContent === 'string'
      ? parsed.additionalContent.trim()
      : legacyOutro &&
          !(LEGACY_FIXED_OUTROS as readonly string[]).includes(legacyOutro)
        ? legacyOutro
        : '';
  return {
    bodyTitle: DEFAULT_RAA_POPUP_COPY.bodyTitle,
    intro: DEFAULT_RAA_POPUP_COPY.intro,
    outro: DEFAULT_RAA_POPUP_COPY.outro,
    additionalContent: migratedAdditional,
  };
}

export const RAA_COMPLIANCE_FIELDS: RaaComplianceField[] = [
  {
    id: 'respondent-email',
    label: 'Respondent Email',
    category: 'Standard Fields',
    alwaysEnabled: true,
  },
  { id: 'ip-address', label: 'IP Address', category: 'Standard Fields' },
  { id: 'country-code', label: 'Country Code', category: 'Standard Fields' },
  { id: 'region', label: 'Region', category: 'Standard Fields' },
  { id: 'cv-1', label: 'Custom Variable 1', category: 'Custom Variables' },
  { id: 'cv-2', label: 'Custom Variable 2', category: 'Custom Variables' },
  { id: 'cv-3', label: 'Custom Variable 3', category: 'Custom Variables' },
  { id: 'cv-4', label: 'Custom Variable 4', category: 'Custom Variables' },
  { id: 'cv-5', label: 'Custom Variable 5', category: 'Custom Variables' },
];

export const CAN_SPAM_FIELD_LABELS: {
  key: keyof CanSpamComplianceDetails;
  label: string;
}[] = [
  { key: 'company', label: 'Company' },
  { key: 'addressLine1', label: 'Address (Line 1)' },
  { key: 'addressLine2', label: 'Address (Line 2)' },
  { key: 'city', label: 'City' },
  { key: 'stateProvince', label: 'State / Province' },
  { key: 'zipcode', label: 'Zipcode / Post Code' },
  { key: 'country', label: 'Country' },
];
