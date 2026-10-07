export type OrganizationNavId =
  | 'users'
  | 'roles'
  | 'teams'
  | 'libraries'
  | 'settings'
  | 'wiki';

export interface OrganizationNavItem {
  id: OrganizationNavId;
  label: string;
  href: string;
}

export const ORGANIZATION_NAV_ITEMS: OrganizationNavItem[] = [
  { id: 'users', label: 'Users', href: '/organization' },
  { id: 'roles', label: 'Roles', href: '/organization/roles' },
  { id: 'teams', label: 'Teams', href: '/organization/teams' },
  { id: 'libraries', label: 'Libraries', href: '/organization/libraries' },
  { id: 'settings', label: 'Settings', href: '/organization/settings' },
  { id: 'wiki', label: 'Wiki', href: '/organization/wiki' },
];

export function organizationNavIdFromPath(pathname: string): OrganizationNavId {
  const match = [...ORGANIZATION_NAV_ITEMS]
    .reverse()
    .find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
  return match?.id ?? 'users';
}

export type AccountAreaTabId =
  | 'surveys'
  | 'organization'
  | 'usage-dashboard'
  | 'mobile';

export interface AccountAreaTab {
  id: AccountAreaTabId;
  label: string;
  href: string;
  icon: string;
}

export const ACCOUNT_AREA_TABS: AccountAreaTab[] = [
  { id: 'surveys', label: 'Surveys', href: '/surveys', icon: 'wm-folder' },
  {
    id: 'organization',
    label: 'Organization',
    href: '/organization/settings',
    icon: 'wm-group',
  },
  {
    id: 'usage-dashboard',
    label: 'Usage Dashboard',
    href: '/usage-dashboard',
    icon: 'wm-desktop-windows',
  },
  { id: 'mobile', label: 'Mobile', href: '/mobile', icon: 'wm-smartphone' },
];

export function accountAreaBreadcrumbLabel(pathname: string): string | null {
  if (pathname === '/organization' || pathname.startsWith('/organization/')) {
    return 'Organization';
  }
  if (
    pathname === '/usage-dashboard' ||
    pathname.startsWith('/usage-dashboard/')
  ) {
    return 'Usage Dashboard';
  }
  if (pathname === '/mobile' || pathname.startsWith('/mobile/')) {
    return 'Mobile';
  }
  return null;
}

export const ORGANIZATION_ID = '5954906';

export const ORGANIZATION_ID_TOOLTIP =
  'Unique identifier for this organization.';

export interface OrganizationSettingField {
  id: string;
  label: string;
  value: string;
}

export const ORGANIZATION_SETTING_FIELDS: OrganizationSettingField[] = [
  {
    id: 'administrator',
    label: 'Administrator',
    value: 'jayaprakash.pattanaik@questionpro.com',
  },
  { id: 'company-name', label: 'Company Name', value: 'lantified' },
  { id: 'accounts-payable-email', label: 'Accounts Payable Email', value: '' },
  { id: 'global-header', label: 'Global Header', value: '' },
  { id: 'global-footer', label: 'Global Footer', value: '' },
  { id: 'global-theme', label: 'Global Theme', value: '' },
];

export const WELCOME_EMAIL_TOOLTIP =
  'Email sent when a new user is added to the organization.';

export type OrganizationSettingsSection =
  | 'folder-permissions'
  | 'admin-settings'
  | 'settings';

export const ORGANIZATION_SETTINGS_ACTIONS: {
  id: OrganizationSettingsSection;
  label: string;
}[] = [
  { id: 'folder-permissions', label: 'Folder Permissions' },
  { id: 'admin-settings', label: 'Admin Settings' },
  { id: 'settings', label: 'Settings' },
];

export const ORGANIZATION_BLOG_LINKS = [
  { id: 'blog', label: 'Read our blog' },
  { id: 'research-method', label: 'Explore research method' },
  { id: 'new-features', label: 'Learn about new features' },
] as const;

export const COMPANY_SETTINGS_ADMINISTRATOR =
  'jayaprakash.pattanaik@questionpro.com';

export const WORKSPACE_URL_SUFFIX = '.questionpro.com';

export const COBRANDED_LOGO_NOTE =
  'Note: The size of the Co-branded Logo should be 320x72';

export const UPDATE_COMPANY_SETTINGS_TOOLTIP =
  'Organization defaults used for branding, new surveys, and reports.';

export const SURVEY_LAYOUT_TOOLTIP =
  'Layout applied when a new survey is created.';

export const REPORT_SORT_TOOLTIP =
  'Default order of answer choices in reports.';

export interface CompanySettingsOption {
  value: string;
  label: string;
}

export const SIGNUP_ROLE_OPTIONS: CompanySettingsOption[] = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'employee-admin', label: 'Employee Admin' },
];

export const GLOBAL_THEME_OPTIONS: CompanySettingsOption[] = [
  { value: '', label: '-- Select --' },
  { value: 'default', label: 'Default' },
  { value: 'classic', label: 'Classic' },
  { value: 'focus', label: 'Focus' },
];

export const ORGANIZATION_LOGO_OPTIONS: CompanySettingsOption[] = [
  { value: '', label: '-- Select --' },
  { value: 'primary', label: 'Primary logo' },
  { value: 'cobrand', label: 'Co-branded logo' },
];

export const SURVEY_LAYOUT_OPTIONS: CompanySettingsOption[] = [
  { value: 'focus', label: 'Focus' },
  { value: 'classic', label: 'Classic' },
  { value: 'visual', label: 'Visual' },
];

export const REPORT_SORT_OPTIONS: CompanySettingsOption[] = [
  { value: '', label: '-- Select --' },
  { value: 'default', label: 'Default' },
  { value: 'ascending', label: 'Ascending' },
  { value: 'descending', label: 'Descending' },
];

export const PERCENTAGE_MODE_OPTIONS: CompanySettingsOption[] = [
  { value: 'answered', label: 'Respondent - Answered the question' },
  { value: 'completed', label: 'Respondent - Completed the survey' },
  { value: 'total', label: 'Total responses' },
];

export interface CompanySettingsDraft {
  workspaceSlug: string;
  organizationName: string;
  accountsPayableEmail: string;
  signupRole: string;
  globalHeader: string;
  globalFooter: string;
  globalTheme: string;
  organizationLogo: string;
  validation: boolean;
  useSeparator: boolean;
  usePageBreak: boolean;
  captureLocationData: boolean;
  ipLocationTracking: boolean;
  unselectedAsZero: boolean;
  displayImages: boolean;
  dataQuality: boolean;
  encryptMediaUrls: boolean;
  strongPassword: boolean;
  respondentAnonymity: boolean;
  disableAudioInput: boolean;
  ageVerification: boolean;
  surveyLayout: string;
  reportSortOrder: string;
  startButton: string;
  nextButton: string;
  doneButton: string;
  percentageMode: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettingsDraft = {
  workspaceSlug: 'jayaprakashpattanaik',
  organizationName: 'Untitled',
  accountsPayableEmail: '',
  signupRole: 'user',
  globalHeader: '',
  globalFooter: '',
  globalTheme: '',
  organizationLogo: '',
  validation: false,
  useSeparator: false,
  usePageBreak: false,
  captureLocationData: true,
  ipLocationTracking: true,
  unselectedAsZero: false,
  displayImages: true,
  dataQuality: false,
  encryptMediaUrls: false,
  strongPassword: false,
  respondentAnonymity: false,
  disableAudioInput: false,
  ageVerification: false,
  surveyLayout: 'focus',
  reportSortOrder: '',
  startButton: 'Start',
  nextButton: 'Next',
  doneButton: 'Done',
  percentageMode: 'answered',
};

type CompanySettingsFlag = {
  [K in keyof CompanySettingsDraft]: CompanySettingsDraft[K] extends boolean ? K : never;
}[keyof CompanySettingsDraft];

export const COMPANY_SETTINGS_CHECKBOXES: {
  key: CompanySettingsFlag;
  label: string;
}[] = [
  { key: 'validation', label: 'Validation' },
  { key: 'useSeparator', label: 'Use Separator' },
  { key: 'usePageBreak', label: 'Use Page Break' },
  { key: 'captureLocationData', label: 'Capture Location Data' },
  { key: 'ipLocationTracking', label: 'IP based location tracking' },
  {
    key: 'unselectedAsZero',
    label: "Represent unselected check boxes with '0' in exports",
  },
  { key: 'displayImages', label: 'Display images' },
  { key: 'dataQuality', label: 'Data quality' },
];

export const COMPANY_SETTINGS_TOGGLES: {
  key: CompanySettingsFlag;
  label: string;
}[] = [
  { key: 'encryptMediaUrls', label: 'Encrypt Media URLs' },
  { key: 'strongPassword', label: 'Strong Password' },
  { key: 'respondentAnonymity', label: 'Respondent anonymity assurance' },
  { key: 'disableAudioInput', label: 'Disable Audio Input' },
  { key: 'ageVerification', label: 'Age Verification' },
];

export function companySettingsOption(
  options: CompanySettingsOption[],
  value: string
): CompanySettingsOption {
  return options.find((option) => option.value === value) ?? options[0];
}
