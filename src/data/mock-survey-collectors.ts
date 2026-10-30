export type CollectorType =
  | 'link'
  | 'email'
  | 'sms'
  | 'qr'
  | 'embed'
  | 'offline'
  | 'community'
  | 'audience';

export type CollectorStatus = 'open' | 'scheduled' | 'closed';

export type CollectorFilter = 'all' | CollectorStatus;

export type CollectorTab = 'overview' | 'messages' | 'options';

export interface Collector {
  id: string;
  name: string;
  type: CollectorType;
  status: CollectorStatus;
  responses: number;
  created: string;
  closes: string;
  sub: string;
  slug: string;
}

export interface CollectorMessage {
  kind: string;
  subject: string;
  to: string;
  when: string;
  sent: string;
  completed: string;
}

export interface CollectorOptions {
  multiple: boolean;
  editing: boolean;
  anonymous: boolean;
  cutoff: boolean;
  cutoffVal: string;
  limit: boolean;
  limitVal: string;
  password: boolean;
  passwordVal: string;
  thanks: boolean;
  thanksVal: string;
  ip: boolean;
}

export interface CollectorTypeInfo {
  label: string;
  icon: string;
  desc: string;
  note: string;
}

export const COLLECTOR_TYPE_ORDER: CollectorType[] = [
  'link',
  'email',
  'sms',
  'qr',
  'embed',
  'offline',
  'community',
  'audience',
];

export const COLLECTOR_TYPES: Record<CollectorType, CollectorTypeInfo> = {
  link: {
    label: 'Web link',
    icon: 'wm-link',
    desc: 'A shareable URL for websites, chat or social posts.',
    note: 'Cutoff, response limit, password, custom URL',
  },
  email: {
    label: 'Email invitation',
    icon: 'wm-mail',
    desc: 'Send to an email list and track opens, starts and completes.',
    note: 'Reminders, scheduling, per-recipient tracking',
  },
  sms: {
    label: 'SMS',
    icon: 'wm-sms',
    desc: 'Text the survey link to a contact list. Uses SMS credits.',
    note: 'Available credits: $50.38',
  },
  qr: {
    label: 'QR code',
    icon: 'wm-qr-code-2',
    desc: 'Print on posters, receipts or flyers for in-person feedback.',
    note: 'Download as PNG or SVG',
  },
  embed: {
    label: 'Website embed',
    icon: 'wm-code',
    desc: 'Show the survey inline, as a popup or as a feedback tab.',
    note: 'Trigger by page, time on page or exit intent',
  },
  offline: {
    label: 'Offline app',
    icon: 'wm-tablet-mac',
    desc: 'Collect on tablets without a connection, then sync.',
    note: 'Assign devices, manual or FTP sync',
  },
  community: {
    label: 'Community',
    icon: 'wm-groups',
    desc: 'Invite members of your QuestionPro Community.',
    note: 'Target by member profile fields',
  },
  audience: {
    label: 'Audience panel',
    icon: 'wm-person-search',
    desc: 'Buy responses from a targeted QuestionPro Audience sample.',
    note: 'Set up with the Audience team',
  },
};

export const COLLECTOR_STATUS_LABEL: Record<CollectorStatus, string> = {
  open: 'Open',
  scheduled: 'Scheduled',
  closed: 'Closed',
};

export const INITIAL_COLLECTORS: Collector[] = [
  {
    id: 'c1',
    name: 'Public web link — HHSC site',
    type: 'link',
    status: 'open',
    responses: 1248,
    created: 'Oct 2, 2026',
    closes: 'No cutoff',
    sub: 'productteam26.questionpro.com/t/AB3xKZq',
    slug: 'AB3xKZq',
  },
  {
    id: 'c2',
    name: 'Recipient email — wave 1',
    type: 'email',
    status: 'open',
    responses: 3412,
    created: 'Oct 6, 2026',
    closes: 'Nov 30, 2026',
    sub: '18,500 recipients',
    slug: 'EM1wv',
  },
  {
    id: 'c3',
    name: 'Recipient email — wave 2',
    type: 'email',
    status: 'scheduled',
    responses: 0,
    created: 'Oct 20, 2026',
    closes: 'Nov 30, 2026',
    sub: 'sends Nov 4, 9:00 AM CT',
    slug: 'EM2wv',
  },
  {
    id: 'c4',
    name: 'SMS — Lone Star Card holders',
    type: 'sms',
    status: 'open',
    responses: 862,
    created: 'Oct 9, 2026',
    closes: 'Nov 30, 2026',
    sub: '4,200 recipients',
    slug: 'SMSlsc',
  },
  {
    id: 'c5',
    name: 'Benefit office QR posters',
    type: 'qr',
    status: 'open',
    responses: 391,
    created: 'Oct 12, 2026',
    closes: 'Dec 15, 2026',
    sub: '46 offices',
    slug: 'QRbo46',
  },
  {
    id: 'c6',
    name: 'Field office tablets',
    type: 'offline',
    status: 'closed',
    responses: 214,
    created: 'Sep 28, 2026',
    closes: 'Closed Oct 25',
    sub: '12 devices',
    slug: 'OFFtab',
  },
  {
    id: 'c7',
    name: 'Pilot test link (internal)',
    type: 'link',
    status: 'closed',
    responses: 24,
    created: 'Sep 20, 2026',
    closes: 'Closed Sep 27',
    sub: 'excluded from reports',
    slug: 'PILOT1',
  },
];

export const INITIAL_COLLECTOR_MESSAGES: Record<string, CollectorMessage[]> = {
  c2: [
    {
      kind: 'Invitation',
      subject: 'Your feedback on SNAP food restrictions',
      to: 'Everyone on the list',
      when: 'Oct 6, 2026 · 9:00 AM',
      sent: '18,500',
      completed: '2,640',
    },
    {
      kind: 'Reminder',
      subject: 'Reminder: 5 minutes to share your experience',
      to: 'Not responded',
      when: 'Oct 13, 2026 · 9:00 AM',
      sent: '15,860',
      completed: '772',
    },
  ],
  c3: [
    {
      kind: 'Invitation',
      subject: 'Your feedback on SNAP food restrictions',
      to: 'Everyone on the list',
      when: 'Scheduled · Nov 4, 9:00 AM CT',
      sent: '9,000',
      completed: '—',
    },
  ],
  c4: [
    {
      kind: 'Invitation',
      subject: 'TX HHSC: 5-min survey on SNAP changes',
      to: 'Everyone on the list',
      when: 'Oct 9, 2026 · 11:00 AM',
      sent: '4,200',
      completed: '862',
    },
  ],
};

export const DEFAULT_COLLECTOR_OPTIONS: CollectorOptions = {
  multiple: false,
  editing: true,
  anonymous: false,
  cutoff: true,
  cutoffVal: '2026-11-30T23:59',
  limit: false,
  limitVal: '5000',
  password: false,
  passwordVal: '',
  thanks: false,
  thanksVal: 'Thank you for helping improve SNAP in Texas.',
  ip: false,
};

export const MESSAGE_AUDIENCES = [
  {
    value: 'all',
    label: 'Everyone on the list (18,500)',
    to: 'Everyone on the list',
    sent: '18,500',
  },
  {
    value: 'notresp',
    label: 'Not responded (14,398)',
    to: 'Not responded',
    sent: '14,398',
  },
  {
    value: 'partial',
    label: 'Started but not finished (690)',
    to: 'Started but not finished',
    sent: '690',
  },
] as const;

export const DEFAULT_MESSAGE_BODY =
  'Hello,\n\nWe would appreciate your feedback in our online survey. ' +
  'All responses will remain confidential and secure.\n\n' +
  'Please click this link to complete the survey:\n<SURVEY_LINK>\n\n' +
  'Please contact kartik.bhat@questionpro.com with any questions.\n\nThank you';

export function collectorUrl(slug: string): string {
  return `https://productteam26.questionpro.com/t/${slug}`;
}

export function collectorEmbedCode(slug: string): string {
  return (
    '<script src="https://productteam26.questionpro.com/embed.js" ' +
    `data-survey="13854836" data-collector="${slug}" data-mode="popup"></script>`
  );
}
