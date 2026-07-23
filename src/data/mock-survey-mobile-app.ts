import { formatRelativeDate } from '@/data/mock-utils';

export type MobileAppSidebarId = 'my-devices' | 'manual-sync' | 'ftp-sync';

export type MobileDeviceStatus = 'Active' | 'Inactive';

export interface MobileAppSidebarItem {
  id: MobileAppSidebarId;
  label: string;
}

export type MobileDeviceTabId =
  | 'settings'
  | 'kiosk-mode'
  | 'design'
  | 'audit'
  | 'variables'
  | 'hardware'
  | 'push-notifications';

export interface MobileDeviceTab {
  id: MobileDeviceTabId;
  label: string;
}

export interface MobileDeviceSettings {
  systemLanguage: string;
  appSettings: boolean;
  loopSurvey: boolean;
  backButton: boolean;
  onlineConnect: boolean;
  locationData: boolean;
  textToSpeech: boolean;
  npsSlider: boolean;
  auditMode: boolean;
  auditSurveyIds: string[];
  recordAudio: boolean;
  recordAudioCapturePoints: string;
  capturePicture: boolean;
  capturePictureCapturePoints: string;
  captureLocation: boolean;
  captureLocationCapturePoints: string;
}

export type MobileDeviceAuditOption = {
  value: string;
  label: string;
  disabled?: boolean;
  isQuestion?: boolean;
  title?: string;
};

export interface MobileDevice {
  id: string;
  deviceName: string;
  username: string;
  email: string;
  status: MobileDeviceStatus;
  deviceKey: string;
  password: string;
  folder: string;
  uuid: string | null;
  lastAccessAt: string | null;
  lastAccessIp: string | null;
  settings: MobileDeviceSettings;
}

export const MOBILE_APP_SIDEBAR_ITEMS: MobileAppSidebarItem[] = [
  { id: 'my-devices', label: 'My Devices' },
  { id: 'manual-sync', label: 'Manual Sync' },
  { id: 'ftp-sync', label: 'FTP Sync' },
];

export const MOBILE_DEVICE_TABS: MobileDeviceTab[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'kiosk-mode', label: 'Kiosk Mode' },
  { id: 'design', label: 'Design' },
  { id: 'audit', label: 'Audit' },
  { id: 'variables', label: 'Variables' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'push-notifications', label: 'Push Notifications' },
];

export const MOBILE_DEVICE_LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Portuguese', label: 'Portuguese' },
];

export const MOBILE_DEVICE_FOLDER_OPTIONS = [
  { value: 'Main Folder', label: 'Main Folder' },
  { value: 'Participant ID', label: 'Participant ID' },
  { value: 'new offline', label: 'new offline' },
];

export const MOBILE_DEVICE_AUDIT_SURVEY_OPTIONS: MobileDeviceAuditOption[] = [
  { value: 'testing-approval', label: 'Testing approval' },
  { value: 'nps-follow-up', label: 'NPS Follow-up' },
  { value: 'store-exit', label: 'Store Exit Interview' },
  { value: 'campus-pulse', label: 'Campus Pulse Check' },
  { value: 'clinic-intake', label: 'Clinic Intake Feedback' },
];

export const MOBILE_DEVICE_CAPTURE_POINTS_OPTIONS: MobileDeviceAuditOption[] = [
  { value: 'start-and-end', label: 'Start and End of the survey' },
  { value: 'start-only', label: 'Start of the survey' },
  { value: 'end-only', label: 'End of the survey' },
];

export const MOBILE_DEVICE_AUDIT_QUESTIONS_BY_SURVEY: Record<
  string,
  MobileDeviceAuditOption[]
> = {
  'testing-approval': [
    { value: 'q1-overall', label: 'Q1. Overall satisfaction' },
    { value: 'q2-recommend', label: 'Q2. Likelihood to recommend' },
    { value: 'q3-feedback', label: 'Q3. Open feedback' },
    { value: 'q4-follow-up', label: 'Q4. Follow-up consent' },
  ],
  'nps-follow-up': [
    { value: 'q1-nps', label: 'Q1. NPS score' },
    { value: 'q2-reason', label: 'Q2. Reason for score' },
    { value: 'q3-improve', label: 'Q3. What can we improve?' },
  ],
  'store-exit': [
    { value: 'q1-visit', label: 'Q1. Purpose of visit' },
    { value: 'q2-staff', label: 'Q2. Staff helpfulness' },
    { value: 'q3-purchase', label: 'Q3. Did you make a purchase?' },
  ],
  'campus-pulse': [
    { value: 'q1-campus', label: 'Q1. Campus experience' },
    { value: 'q2-safety', label: 'Q2. Feeling of safety' },
    { value: 'q3-resources', label: 'Q3. Resource awareness' },
  ],
  'clinic-intake': [
    { value: 'q1-wait', label: 'Q1. Wait time rating' },
    { value: 'q2-care', label: 'Q2. Quality of care' },
    { value: 'q3-clarity', label: 'Q3. Instructions clarity' },
  ],
};

export const MOBILE_DEVICE_MULTI_SURVEY_QUESTION_TOOLTIP =
  'Question selection is not supported when multiple surveys are selected for audit.';

export function getMobileDeviceAuditQuestionsForSurveys(
  surveyIds: string[]
): MobileDeviceAuditOption[] {
  if (surveyIds.length === 0) {
    return [];
  }

  if (surveyIds.length === 1) {
    const surveyId = surveyIds[0];
    return surveyId ? (MOBILE_DEVICE_AUDIT_QUESTIONS_BY_SURVEY[surveyId] ?? []) : [];
  }

  return surveyIds.flatMap((surveyId) => MOBILE_DEVICE_AUDIT_QUESTIONS_BY_SURVEY[surveyId] ?? []);
}

export type RecordAudioCapturePointOption = MobileDeviceAuditOption;

export function getRecordAudioCapturePointOptions(
  surveyIds: string[]
): RecordAudioCapturePointOption[] {
  const questionsDisabled = surveyIds.length !== 1;
  const questions = getMobileDeviceAuditQuestionsForSurveys(surveyIds).map((question) => ({
    ...question,
    isQuestion: true,
    disabled: questionsDisabled,
    title: questionsDisabled ? MOBILE_DEVICE_MULTI_SURVEY_QUESTION_TOOLTIP : undefined,
  }));

  return [...MOBILE_DEVICE_CAPTURE_POINTS_OPTIONS, ...questions];
}

const DEFAULT_DEVICE_SETTINGS: MobileDeviceSettings = {
  systemLanguage: 'English',
  appSettings: true,
  loopSurvey: false,
  backButton: true,
  onlineConnect: false,
  locationData: false,
  textToSpeech: false,
  npsSlider: false,
  auditMode: false,
  auditSurveyIds: ['testing-approval'],
  recordAudio: false,
  recordAudioCapturePoints: 'start-and-end',
  capturePicture: false,
  capturePictureCapturePoints: 'start-and-end',
  captureLocation: true,
  captureLocationCapturePoints: 'start-and-end',
};

function createDeviceSettings(
  overrides: Partial<MobileDeviceSettings> = {}
): MobileDeviceSettings {
  return { ...DEFAULT_DEVICE_SETTINGS, ...overrides };
}

export const MOCK_MOBILE_DEVICES: MobileDevice[] = [
  {
    id: 'dev-25',
    deviceName: 'Device 25',
    username: 'field.ops.west',
    email: 'kartik.r.bhat@gmail.com',
    status: 'Active',
    deviceKey: 'kuyur',
    password: 'd78aa',
    folder: 'Participant ID',
    uuid: 'AC06B05B-AE15-4F9C-B500-325B836DD5D6',
    lastAccessAt: '2025-04-01T14:22:00.000Z',
    lastAccessIp: '123.201.33.202',
    settings: createDeviceSettings(),
  },
  {
    id: 'dev-kartik-25',
    deviceName: 'Kartik test 25',
    username: 'kartik.offline',
    email: 'kartik.offline@questionpro.com',
    status: 'Active',
    deviceKey: 'nflih',
    password: '3463b',
    folder: 'new offline',
    uuid: null,
    lastAccessAt: null,
    lastAccessIp: null,
    settings: createDeviceSettings({ appSettings: false, backButton: false }),
  },
  {
    id: 'dev-23',
    deviceName: 'Device 23',
    username: 'campus.ambassadors',
    email: 'campus.ambassadors@university.edu',
    status: 'Active',
    deviceKey: 'pxm2q',
    password: 'a91cf',
    folder: 'Main Folder',
    uuid: 'B17C2E4A-9D21-4A8F-9C11-88F0A2C1D903',
    lastAccessAt: '2025-11-18T09:05:00.000Z',
    lastAccessIp: '49.36.112.88',
    settings: createDeviceSettings({ locationData: true, onlineConnect: true }),
  },
  {
    id: 'dev-18',
    deviceName: 'Device 18 — Retail Floor Tablet Fleet North Region Expansion Pilot Unit',
    username: 'retail.floor.n1',
    email: 'retail.floor.n1@shopperpanel.com',
    status: 'Active',
    deviceKey: 'hwk9t',
    password: 'e2b47',
    folder: 'Main Folder',
    uuid: 'C40E91F2-6B55-4D0E-A772-1F3D9E8C4A20',
    lastAccessAt: '2026-06-02T16:40:00.000Z',
    lastAccessIp: '2600:1700:4d80:1a90::4a',
    settings: createDeviceSettings({ loopSurvey: true, npsSlider: true }),
  },
  {
    id: 'dev-clinic-a',
    deviceName: 'Clinic Kiosk A',
    username: 'clinic.kiosk.a',
    email: 'clinic.kiosk.a@healthresearch.org',
    status: 'Active',
    deviceKey: 'r4nvs',
    password: '7c1de',
    folder: 'Participant ID',
    uuid: 'D9A11B30-0E47-4F6C-B218-55AE0D9F7C12',
    lastAccessAt: '2026-07-20T11:12:00.000Z',
    lastAccessIp: '103.78.45.19',
    settings: createDeviceSettings({ textToSpeech: true, systemLanguage: 'Spanish' }),
  },
  {
    id: 'dev-field-07',
    deviceName: 'Field Tablet 07',
    username: 'field.tablet.07',
    email: 'field.tablet.07@fieldops.com',
    status: 'Inactive',
    deviceKey: 'm0zpl',
    password: '9fa2c',
    folder: 'new offline',
    uuid: null,
    lastAccessAt: null,
    lastAccessIp: null,
    settings: createDeviceSettings({ appSettings: false }),
  },
  {
    id: 'dev-lobby-3',
    deviceName: 'Lobby iPad 3',
    username: 'lobby.ipad.3',
    email: 'lobby.ipad.3@venueinsights.com',
    status: 'Active',
    deviceKey: 'tq8ej',
    password: 'b55e1',
    folder: 'Main Folder',
    uuid: 'E2F88341-AA19-4C2B-8D60-90B1C3E5F704',
    lastAccessAt: '2026-03-14T08:30:00.000Z',
    lastAccessIp: '72.14.201.104',
    settings: createDeviceSettings({ backButton: false, onlineConnect: true }),
  },
  {
    id: 'dev-event-booth',
    deviceName: 'Event Booth Scanner',
    username: 'events.booth',
    email: 'events.booth@conferencehq.com',
    status: 'Active',
    deviceKey: 'u1cwa',
    password: '3d80f',
    folder: 'Participant ID',
    uuid: 'F61A2045-BB2C-4E91-9A14-12C4D6E8F905',
    lastAccessAt: '2024-09-22T19:45:00.000Z',
    lastAccessIp: '185.199.108.153',
    settings: createDeviceSettings({ locationData: true, loopSurvey: true }),
  },
  {
    id: 'dev-qa-spare',
    deviceName: 'QA Spare Phone',
    username: 'qa.spare',
    email: 'qa.spare@questionpro.com',
    status: 'Inactive',
    deviceKey: 'v9dks',
    password: 'c04ab',
    folder: 'Main Folder',
    uuid: null,
    lastAccessAt: null,
    lastAccessIp: null,
    settings: createDeviceSettings({ appSettings: false, backButton: false }),
  },
  {
    id: 'dev-mall-kiosk',
    deviceName: 'Mall Entrance Kiosk',
    username: 'mall.entrance',
    email: 'mall.entrance@retailinsights.com',
    status: 'Active',
    deviceKey: 'w3fem',
    password: '6e19d',
    folder: 'new offline',
    uuid: '07B93556-CC3D-4FA2-AB25-23D5E7F9A016',
    lastAccessAt: '2026-05-08T13:18:00.000Z',
    lastAccessIp: '203.0.113.44',
    settings: createDeviceSettings({ npsSlider: true, textToSpeech: true }),
  },
  {
    id: 'dev-transit-12',
    deviceName: 'Transit Survey Unit 12',
    username: 'transit.unit.12',
    email: 'transit.unit.12@citymobility.gov',
    status: 'Active',
    deviceKey: 'x5ghn',
    password: '8a2bf',
    folder: 'Participant ID',
    uuid: '18CA4667-DD4E-40B3-BC36-34E6F8A0B127',
    lastAccessAt: '2025-12-01T07:55:00.000Z',
    lastAccessIp: '198.51.100.77',
    settings: createDeviceSettings({ locationData: true, systemLanguage: 'French' }),
  },
  {
    id: 'dev-campus-lab',
    deviceName: 'Campus Lab Chromebook',
    username: 'campus.lab',
    email: 'campus.lab@researchlab.edu',
    status: 'Active',
    deviceKey: 'y7ijp',
    password: '1c5ea',
    folder: 'Main Folder',
    uuid: '29DB5778-EE5F-41C4-CD47-45F709B1C238',
    lastAccessAt: '2026-07-15T21:02:00.000Z',
    lastAccessIp: '2001:db8:85a3::8a2e:370:7334',
    settings: createDeviceSettings({ onlineConnect: true }),
  },
  {
    id: 'dev-warehouse',
    deviceName: 'Warehouse Handheld',
    username: 'warehouse.hh',
    email: 'warehouse.hh@logisticsops.com',
    status: 'Inactive',
    deviceKey: 'z2klq',
    password: '4d7fc',
    folder: 'new offline',
    uuid: null,
    lastAccessAt: null,
    lastAccessIp: null,
    settings: createDeviceSettings({ appSettings: false }),
  },
  {
    id: 'dev-pop-up',
    deviceName: 'Pop-up Store Tablet',
    username: 'popup.store',
    email: 'popup.store@brandexperience.com',
    status: 'Active',
    deviceKey: 'a8mrs',
    password: '0e3ad',
    folder: 'Participant ID',
    uuid: '3AEC6889-FF60-42D5-DE58-56081AC2D349',
    lastAccessAt: '2026-01-29T10:27:00.000Z',
    lastAccessIp: '151.101.1.69',
    settings: createDeviceSettings({ loopSurvey: true, backButton: true }),
  },
];

export function getDefaultMobileAppSidebarItem(): MobileAppSidebarId {
  return 'my-devices';
}

export function getDefaultMobileDeviceTab(): MobileDeviceTabId {
  return 'settings';
}

/** e.g. "Apr 01 2025 (123.201.33.202) 1 year ago" or "N/A N/A" */
export function formatMobileDeviceLastAccess(device: MobileDevice): string {
  if (!device.lastAccessAt) {
    return 'N/A N/A';
  }

  const dateLabel = formatMobileAccessDate(device.lastAccessAt);
  const ipLabel = device.lastAccessIp ?? 'N/A';
  const relative = formatLongRelativeAccess(device.lastAccessAt);

  return `${dateLabel} (${ipLabel}) ${relative}`;
}

/** e.g. "Apr 01 2025" */
function formatMobileAccessDate(date: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(date));
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  return `${month} ${day} ${year}`;
}

function formatLongRelativeAccess(date: string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffDay = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDay < 7) {
    return formatRelativeDate(date);
  }

  const diffWeek = Math.round(diffDay / 7);
  if (diffWeek < 5) {
    return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`;
  }

  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) {
    return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
  }

  const diffYear = Math.round(diffDay / 365);
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}

export function createMobileDevice(input: {
  deviceName: string;
  username: string;
  folder: string;
}): MobileDevice {
  const suffix = Math.random().toString(36).slice(2, 7);

  return {
    id: `dev-${Date.now()}`,
    deviceName: input.deviceName.trim(),
    username: input.username.trim(),
    email: `${input.username.trim()}@questionpro.com`,
    status: 'Active',
    deviceKey: suffix,
    password: Math.random().toString(36).slice(2, 7),
    folder: input.folder.trim() || 'Main Folder',
    uuid: null,
    lastAccessAt: null,
    lastAccessIp: null,
    settings: createDeviceSettings(),
  };
}
