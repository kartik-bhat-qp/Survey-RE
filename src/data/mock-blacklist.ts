export const BLACKLIST_KINDS = [
  { id: 'fingerprint', label: 'Device fingerprint' },
  { id: 'ip-range', label: 'IP range' },
  { id: 'email', label: 'Email' },
] as const;

export type BlacklistKind = (typeof BLACKLIST_KINDS)[number]['id'];

export type BlacklistEntry = {
  id: string;
  kind: BlacklistKind;
  value: string;
  note?: string;
  addedAt: string;
};

export const BLACKLIST_KEY = 'integrity-blacklist';

export const MOCK_BLACKLIST: BlacklistEntry[] = [
  {
    id: 'bl-1',
    kind: 'fingerprint',
    value: '9f3c1a7e-b204-4d18-9c6a-11e8d0a4c772',
    note: 'Repeated automated survey starts from one browser profile.',
    addedAt: '2026-09-12T14:20:00.000Z',
  },
  {
    id: 'bl-2',
    kind: 'fingerprint',
    value:
      'qp-fp-7c91e2aa4b0d8f3361c0e9d54a17b8c2f6e0d3a9b1c4e7f2085d6a3b9c0e1f47d2a8b5c6e9f0a1b2c3d4e5f6',
    note: 'Shared across a scripted panel that rotated IP addresses.',
    addedAt: '2026-08-03T09:05:00.000Z',
  },
  {
    id: 'bl-3',
    kind: 'ip-range',
    value: '203.0.113.0/24',
    note: 'Documentation range used by a load-testing vendor.',
    addedAt: '2026-07-18T16:40:00.000Z',
  },
  {
    id: 'bl-4',
    kind: 'ip-range',
    value: '198.51.100.10-198.51.100.40',
    addedAt: '2026-06-02T11:15:00.000Z',
  },
  {
    id: 'bl-5',
    kind: 'ip-range',
    value: '2001:db8:10::/48',
    note: 'IPv6 block tied to a known proxy farm.',
    addedAt: '2026-10-01T08:30:00.000Z',
  },
  {
    id: 'bl-6',
    kind: 'email',
    value: 'survey.bot@mailinator.com',
    note: 'Opened the same collector link from many devices.',
    addedAt: '2026-09-28T19:12:00.000Z',
  },
  {
    id: 'bl-7',
    kind: 'email',
    value: 'priya.shah@northwind-research.example',
    addedAt: '2026-05-21T13:00:00.000Z',
  },
  {
    id: 'bl-8',
    kind: 'email',
    value: 'panel-ops+emea-wave-14@fieldwork-partners.example',
    note: 'Requested removal after a misrouted incentive batch.',
    addedAt: '2026-04-09T10:45:00.000Z',
  },
  {
    id: 'bl-9',
    kind: 'fingerprint',
    value: 'c0ffee-device-4419',
    note: 'Headless browser seen on Employee Engagement and Flex logic.',
    addedAt: '2026-10-22T07:55:00.000Z',
  },
  {
    id: 'bl-10',
    kind: 'ip-range',
    value: '192.0.2.0/24',
    note: 'TEST-NET range. Not used by real respondents.',
    addedAt: '2026-03-14T15:10:00.000Z',
  },
  {
    id: 'bl-11',
    kind: 'email',
    value: 'a.very.long.respondent.name.used.for.edge.layout@community-members.example',
    addedAt: '2026-02-11T12:00:00.000Z',
  },
  {
    id: 'bl-12',
    kind: 'fingerprint',
    value: 'aa91-bb02-cc73-dd44',
    addedAt: '2026-01-30T18:25:00.000Z',
  },
];

export function blacklistKindLabel(kind: BlacklistKind): string {
  return BLACKLIST_KINDS.find((item) => item.id === kind)?.label ?? kind;
}
