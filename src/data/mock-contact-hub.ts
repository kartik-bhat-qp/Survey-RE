import { formatDate, formatRelativeDate } from '@/data/mock-utils';
import {
  DEFAULT_CONTACT_HUB_POLICY,
  type ContactAccessScope,
  type ContactHubAccessPolicy,
  type ContactOwnership,
  type GroupShareSettings,
} from '@/data/mock-contact-hub-access';

export const CONTACT_HUB_STORAGE_KEY = 'contact-hub:state';

export type {
  ContactAccessScope,
  ContactHubAccessPolicy,
  ContactOwnership,
  GroupShareSettings,
} from '@/data/mock-contact-hub-access';

export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'suppressed' | 'invalid';

export type ContactAttributeType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'multi-select'
  | 'boolean';

export type ContactGroupType = 'static' | 'dynamic';

export type ContactMembershipSource = 'manual' | 'dynamic' | 'import';

export type SuppressionReason =
  | 'unsubscribed'
  | 'hard-bounce'
  | 'manual'
  | 'invalid-email'
  | 'organization-block';

export type ContactActivityType =
  | 'invitation'
  | 'reminder'
  | 'open'
  | 'click'
  | 'response'
  | 'import'
  | 'updated'
  | 'suppressed';

export type GroupRuleOperator = 'and' | 'or';

export type GroupRuleField =
  | 'country'
  | 'organization'
  | 'status'
  | 'dateAdded'
  | 'attribute';

export type GroupRuleComparator =
  | 'is'
  | 'is_not'
  | 'contains'
  | 'after'
  | 'before'
  | 'equals';

export interface ContactAttributeDefinition {
  id: string;
  name: string;
  type: ContactAttributeType;
  options?: string[];
  required?: boolean;
}

export interface ContactGroupRule {
  id: string;
  field: GroupRuleField;
  attributeId?: string;
  comparator: GroupRuleComparator;
  value: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  type: ContactGroupType;
  contactCount: number;
  updatedAt: string;
  createdAt: string;
  ruleOperator?: GroupRuleOperator;
  rules?: ContactGroupRule[];
  ownership?: ContactOwnership;
  sharing?: GroupShareSettings;
}

export interface ContactGroupMembership {
  groupId: string;
  source: ContactMembershipSource;
  addedAt: string;
}

export interface ContactSuppression {
  reason: SuppressionReason;
  at: string;
  note?: string;
}

export interface ContactConsent {
  emailSubscribed: boolean;
  smsOptIn: boolean;
  unsubscribedAt?: string;
}

export interface ContactActivity {
  id: string;
  type: ContactActivityType;
  label: string;
  detail?: string;
  at: string;
}

export interface ContactAuditEntry {
  id: string;
  label: string;
  at: string;
  actor: string;
}

export interface ContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  organization?: string;
  country: string;
  status: ContactStatus;
  dateAdded: string;
  lastActivity: string;
  lastUpdated: string;
  attributes: Record<string, string | number | boolean | string[]>;
  groupIds: string[];
  memberships: ContactGroupMembership[];
  consent: ContactConsent;
  suppression?: ContactSuppression;
  activity: ContactActivity[];
  audit: ContactAuditEntry[];
  /** Organization-level identity; email when present, else stable contact id. */
  organizationIdentity?: string;
  ownership?: ContactOwnership;
}

export interface ContactImportJob {
  id: string;
  fileName: string;
  status: 'completed' | 'failed' | 'processing';
  importedAt: string;
  added: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface ContactGrowthPoint {
  month: string;
  total: number;
}

export interface ContactHubState {
  contacts: ContactRecord[];
  groups: ContactGroup[];
  attributes: ContactAttributeDefinition[];
  imports: ContactImportJob[];
  growth: ContactGrowthPoint[];
  accessPolicy: ContactHubAccessPolicy;
}

function ownership(
  createdBy: string,
  createdAt: string,
  accessScope: ContactAccessScope,
  owningTeamId?: string,
  lastModifiedBy = createdBy,
  lastModifiedAt = createdAt,
): ContactOwnership {
  return {
    createdBy,
    createdAt,
    lastModifiedBy,
    lastModifiedAt,
    owningTeamId,
    accessScope,
  };
}

function sharing(
  mode: GroupShareSettings['mode'],
  teamIds: string[] = [],
  userIds: string[] = [],
  permissions: GroupShareSettings['permissions'] = [
    'view',
    'use-distribute',
    'edit-membership',
  ],
): GroupShareSettings {
  return { mode, teamIds, userIds, permissions };
}

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  active: 'Active',
  unsubscribed: 'Unsubscribed',
  bounced: 'Bounced',
  suppressed: 'Suppressed',
  invalid: 'Invalid',
};

export const SUPPRESSION_REASON_LABEL: Record<SuppressionReason, string> = {
  unsubscribed: 'Unsubscribed',
  'hard-bounce': 'Hard bounce',
  manual: 'Manually suppressed',
  'invalid-email': 'Invalid email',
  'organization-block': 'Organization block',
};

export const ATTRIBUTE_TYPE_LABEL: Record<ContactAttributeType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  dropdown: 'Dropdown',
  'multi-select': 'Multiple selection',
  boolean: 'Boolean',
};

export const INITIAL_CONTACT_ATTRIBUTES: ContactAttributeDefinition[] = [
  {
    id: 'attr-customer-type',
    name: 'Customer Type',
    type: 'dropdown',
    options: ['Enterprise', 'Mid-market', 'SMB', 'Education'],
  },
  {
    id: 'attr-industry',
    name: 'Industry',
    type: 'dropdown',
    options: ['Healthcare', 'Technology', 'Retail', 'Financial services', 'Education'],
  },
  {
    id: 'attr-account-manager',
    name: 'Account Manager',
    type: 'text',
  },
  {
    id: 'attr-region',
    name: 'Region',
    type: 'dropdown',
    options: ['North America', 'EMEA', 'APAC', 'LATAM'],
  },
  {
    id: 'attr-customer-since',
    name: 'Customer Since',
    type: 'date',
  },
  {
    id: 'attr-annual-revenue',
    name: 'Annual Revenue',
    type: 'number',
  },
  {
    id: 'attr-newsletter',
    name: 'Newsletter opt-in',
    type: 'boolean',
  },
  {
    id: 'attr-products',
    name: 'Products used',
    type: 'multi-select',
    options: ['Surveys', 'Communities', 'CX', 'Employee Experience'],
  },
];

export const INITIAL_CONTACT_GROUPS: ContactGroup[] = [
  {
    id: 'group-cx-panel',
    name: 'Customer Experience Panel',
    description: 'Shared panel used across CX programs.',
    type: 'static',
    contactCount: 8,
    createdAt: '2026-07-12T10:00:00.000Z',
    updatedAt: '2026-10-28T14:20:00.000Z',
  },
  {
    id: 'group-newsletter',
    name: 'Monthly Newsletter Subscribers',
    description: 'Contacts who opted into research newsletters.',
    type: 'static',
    contactCount: 6,
    createdAt: '2026-06-02T09:00:00.000Z',
    updatedAt: '2026-10-21T11:10:00.000Z',
  },
  {
    id: 'group-enterprise',
    name: 'Enterprise Account Contacts',
    description: 'Decision makers at enterprise accounts.',
    type: 'static',
    contactCount: 5,
    createdAt: '2026-05-18T16:00:00.000Z',
    updatedAt: '2026-09-04T08:40:00.000Z',
  },
  {
    id: 'group-india-customers',
    name: 'Customers in India',
    description: 'Dynamic segment for India-based contacts.',
    type: 'dynamic',
    contactCount: 4,
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-11-02T09:15:00.000Z',
    ruleOperator: 'and',
    rules: [
      { id: 'rule-1', field: 'country', comparator: 'is', value: 'India' },
      {
        id: 'rule-2',
        field: 'attribute',
        attributeId: 'attr-customer-type',
        comparator: 'is',
        value: 'Enterprise',
      },
    ],
  },
  {
    id: 'group-joined-2026',
    name: 'Joined after January 2026',
    description: 'New contacts added this year.',
    type: 'dynamic',
    contactCount: 7,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-11-01T18:00:00.000Z',
    ruleOperator: 'and',
    rules: [
      { id: 'rule-3', field: 'dateAdded', comparator: 'after', value: '2026-01-01' },
      { id: 'rule-4', field: 'status', comparator: 'is', value: 'active' },
    ],
  },
  {
    id: 'group-healthcare',
    name: 'Healthcare Decision Makers',
    type: 'static',
    contactCount: 3,
    createdAt: '2026-04-22T10:00:00.000Z',
    updatedAt: '2026-08-22T13:00:00.000Z',
  },
  {
    id: 'group-vip',
    name: 'VIP Loyalty Members',
    type: 'static',
    contactCount: 2,
    createdAt: '2026-03-11T10:00:00.000Z',
    updatedAt: '2026-07-30T10:00:00.000Z',
  },
  {
    id: 'group-churn',
    name: 'Churn Risk Outreach',
    description: 'Contacts flagged for retention outreach.',
    type: 'dynamic',
    contactCount: 3,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-14T10:00:00.000Z',
    ruleOperator: 'or',
    rules: [
      {
        id: 'rule-5',
        field: 'attribute',
        attributeId: 'attr-customer-type',
        comparator: 'is',
        value: 'SMB',
      },
      { id: 'rule-6', field: 'status', comparator: 'is', value: 'active' },
    ],
  },
];

function membership(
  groupId: string,
  source: ContactMembershipSource,
  addedAt: string,
): ContactGroupMembership {
  return { groupId, source, addedAt };
}

function activity(
  id: string,
  type: ContactActivityType,
  label: string,
  at: string,
  detail?: string,
): ContactActivity {
  return { id, type, label, at, detail };
}

export const INITIAL_CONTACTS: ContactRecord[] = [
  {
    id: 'ct-1001',
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@northstarhealth.com',
    phone: '+91 98765 43021',
    organization: 'Northstar Health',
    country: 'India',
    status: 'active',
    dateAdded: '2026-02-14T10:00:00.000Z',
    lastActivity: '2026-11-01T15:20:00.000Z',
    lastUpdated: '2026-10-18T09:00:00.000Z',
    attributes: {
      'attr-customer-type': 'Enterprise',
      'attr-industry': 'Healthcare',
      'attr-account-manager': 'Anika Shah',
      'attr-region': 'APAC',
      'attr-customer-since': '2024-03-12',
      'attr-annual-revenue': 42000000,
      'attr-newsletter': true,
      'attr-products': ['Surveys', 'CX'],
    },
    groupIds: ['group-cx-panel', 'group-india-customers', 'group-joined-2026'],
    memberships: [
      membership('group-cx-panel', 'manual', '2026-02-14T10:00:00.000Z'),
      membership('group-india-customers', 'dynamic', '2026-08-01T12:00:00.000Z'),
      membership('group-joined-2026', 'dynamic', '2026-09-10T10:00:00.000Z'),
    ],
    consent: { emailSubscribed: true, smsOptIn: true },
    activity: [
      activity('a1', 'invitation', 'CX Pulse invitation sent', '2026-11-01T15:20:00.000Z', 'Flex logic'),
      activity('a2', 'open', 'Opened invitation email', '2026-11-01T16:02:00.000Z'),
      activity('a3', 'response', 'Completed survey response', '2026-10-12T11:40:00.000Z', 'NPS Follow-up'),
    ],
    audit: [
      {
        id: 'au1',
        label: 'Added to Customer Experience Panel',
        at: '2026-02-14T10:05:00.000Z',
        actor: 'Admin',
      },
      {
        id: 'au2',
        label: 'Customer Type set to Enterprise',
        at: '2026-02-14T10:08:00.000Z',
        actor: 'Admin',
      },
    ],
  },
  {
    id: 'ct-1002',
    firstName: 'Marcus',
    lastName: 'Ellison',
    email: 'marcus.ellison@brightline.io',
    phone: '+1 415 555 0188',
    organization: 'Brightline',
    country: 'United States',
    status: 'active',
    dateAdded: '2026-01-20T10:00:00.000Z',
    lastActivity: '2026-10-28T12:00:00.000Z',
    lastUpdated: '2026-09-22T08:00:00.000Z',
    attributes: {
      'attr-customer-type': 'Mid-market',
      'attr-industry': 'Technology',
      'attr-account-manager': 'Chris Dalton',
      'attr-region': 'North America',
      'attr-customer-since': '2023-11-02',
      'attr-annual-revenue': 18500000,
      'attr-newsletter': true,
      'attr-products': ['Surveys', 'Communities'],
    },
    groupIds: ['group-cx-panel', 'group-newsletter', 'group-joined-2026'],
    memberships: [
      membership('group-cx-panel', 'import', '2026-01-20T10:00:00.000Z'),
      membership('group-newsletter', 'manual', '2026-03-01T10:00:00.000Z'),
      membership('group-joined-2026', 'dynamic', '2026-09-10T10:00:00.000Z'),
    ],
    consent: { emailSubscribed: true, smsOptIn: false },
    activity: [
      activity('a4', 'reminder', 'Reminder sent', '2026-10-28T12:00:00.000Z', 'Flex logic'),
      activity('a5', 'click', 'Clicked survey link', '2026-10-28T12:18:00.000Z'),
    ],
    audit: [
      {
        id: 'au3',
        label: 'Imported from Q3 panel upload',
        at: '2026-01-20T10:00:00.000Z',
        actor: 'System',
      },
    ],
  },
  {
    id: 'ct-1003',
    firstName: 'Sofia',
    lastName: 'Almeida',
    email: 'sofia.almeida@retailnorth.com',
    phone: '+55 11 95555 2201',
    organization: 'Retail North',
    country: 'Brazil',
    status: 'unsubscribed',
    dateAdded: '2025-11-08T10:00:00.000Z',
    lastActivity: '2026-09-14T09:30:00.000Z',
    lastUpdated: '2026-09-14T09:30:00.000Z',
    attributes: {
      'attr-customer-type': 'SMB',
      'attr-industry': 'Retail',
      'attr-account-manager': 'Elena Vargas',
      'attr-region': 'LATAM',
      'attr-customer-since': '2022-06-18',
      'attr-annual-revenue': 4200000,
      'attr-newsletter': false,
      'attr-products': ['Surveys'],
    },
    groupIds: ['group-newsletter', 'group-churn'],
    memberships: [
      membership('group-newsletter', 'manual', '2025-11-08T10:00:00.000Z'),
      membership('group-churn', 'dynamic', '2026-07-01T10:00:00.000Z'),
    ],
    consent: {
      emailSubscribed: false,
      smsOptIn: false,
      unsubscribedAt: '2026-09-14T09:30:00.000Z',
    },
    suppression: {
      reason: 'unsubscribed',
      at: '2026-09-14T09:30:00.000Z',
      note: 'Unsubscribed from invitation footer',
    },
    activity: [
      activity('a6', 'suppressed', 'Unsubscribed from email', '2026-09-14T09:30:00.000Z'),
      activity('a7', 'invitation', 'Invitation delivered', '2026-09-10T08:00:00.000Z'),
    ],
    audit: [
      {
        id: 'au4',
        label: 'Email subscription turned off',
        at: '2026-09-14T09:30:00.000Z',
        actor: 'Contact',
      },
    ],
  },
  {
    id: 'ct-1004',
    firstName: 'James',
    lastName: 'Okoro',
    email: 'james.okoro@fincrest.co.uk',
    phone: '+44 20 7946 0991',
    organization: 'FinCrest',
    country: 'United Kingdom',
    status: 'bounced',
    dateAdded: '2026-03-03T10:00:00.000Z',
    lastActivity: '2026-10-02T07:45:00.000Z',
    lastUpdated: '2026-10-02T07:45:00.000Z',
    attributes: {
      'attr-customer-type': 'Enterprise',
      'attr-industry': 'Financial services',
      'attr-account-manager': 'Nora Blake',
      'attr-region': 'EMEA',
      'attr-customer-since': '2021-09-30',
      'attr-annual-revenue': 91000000,
      'attr-newsletter': true,
      'attr-products': ['Surveys', 'Communities', 'CX'],
    },
    groupIds: ['group-enterprise', 'group-joined-2026'],
    memberships: [
      membership('group-enterprise', 'manual', '2026-03-03T10:00:00.000Z'),
      membership('group-joined-2026', 'dynamic', '2026-09-10T10:00:00.000Z'),
    ],
    consent: { emailSubscribed: true, smsOptIn: true },
    suppression: {
      reason: 'hard-bounce',
      at: '2026-10-02T07:45:00.000Z',
      note: 'Mailbox does not exist',
    },
    activity: [
      activity('a8', 'suppressed', 'Hard bounce recorded', '2026-10-02T07:45:00.000Z'),
      activity('a9', 'invitation', 'Invitation attempted', '2026-10-02T07:40:00.000Z'),
    ],
    audit: [
      {
        id: 'au5',
        label: 'Marked as bounced after hard bounce',
        at: '2026-10-02T07:45:00.000Z',
        actor: 'System',
      },
    ],
  },
  {
    id: 'ct-1005',
    firstName: 'Aisha',
    lastName: 'Rahman',
    email: 'aisha.rahman@campus.edu',
    phone: '+91 98200 11220',
    organization: 'Campus Research Lab',
    country: 'India',
    status: 'active',
    dateAdded: '2026-05-19T10:00:00.000Z',
    lastActivity: '2026-10-30T19:10:00.000Z',
    lastUpdated: '2026-08-09T10:00:00.000Z',
    attributes: {
      'attr-customer-type': 'Education',
      'attr-industry': 'Education',
      'attr-account-manager': 'Anika Shah',
      'attr-region': 'APAC',
      'attr-customer-since': '2025-01-08',
      'attr-annual-revenue': 1200000,
      'attr-newsletter': true,
      'attr-products': ['Surveys'],
    },
    groupIds: ['group-india-customers', 'group-joined-2026', 'group-cx-panel'],
    memberships: [
      membership('group-india-customers', 'dynamic', '2026-08-01T12:00:00.000Z'),
      membership('group-joined-2026', 'dynamic', '2026-09-10T10:00:00.000Z'),
      membership('group-cx-panel', 'manual', '2026-05-19T10:00:00.000Z'),
    ],
    consent: { emailSubscribed: true, smsOptIn: true },
    activity: [
      activity('a10', 'response', 'Completed survey response', '2026-10-30T19:10:00.000Z'),
      activity('a11', 'invitation', 'Invitation delivered', '2026-10-29T09:00:00.000Z'),
    ],
    audit: [
      {
        id: 'au6',
        label: 'Phone number updated',
        at: '2026-08-09T10:00:00.000Z',
        actor: 'Admin',
      },
    ],
  },
  {
    id: 'ct-1006',
    firstName: 'Helena',
    lastName: 'Berg',
    email: 'helena.berg@medora.se',
    organization: 'Medora Clinics',
    country: 'Sweden',
    status: 'active',
    dateAdded: '2026-04-02T10:00:00.000Z',
    lastActivity: '2026-09-18T14:00:00.000Z',
    lastUpdated: '2026-06-11T10:00:00.000Z',
    attributes: {
      'attr-customer-type': 'Enterprise',
      'attr-industry': 'Healthcare',
      'attr-account-manager': 'Nora Blake',
      'attr-region': 'EMEA',
      'attr-customer-since': '2020-04-15',
      'attr-annual-revenue': 67000000,
      'attr-newsletter': false,
      'attr-products': ['Surveys', 'CX', 'Employee Experience'],
    },
    groupIds: ['group-healthcare', 'group-enterprise', 'group-joined-2026'],
    memberships: [
      membership('group-healthcare', 'manual', '2026-04-02T10:00:00.000Z'),
      membership('group-enterprise', 'manual', '2026-04-02T10:05:00.000Z'),
      membership('group-joined-2026', 'dynamic', '2026-09-10T10:00:00.000Z'),
    ],
    consent: { emailSubscribed: true, smsOptIn: false },
    activity: [
      activity('a12', 'open', 'Opened invitation email', '2026-09-18T14:00:00.000Z'),
    ],
    audit: [],
  },
  {
    id: 'ct-1007',
    firstName: 'Diego',
    lastName: 'Castillo',
    email: 'diego.castillo@orbitretail.mx',
    phone: '+52 55 5123 7788',
    organization: 'Orbit Retail',
    country: 'Mexico',
    status: 'suppressed',
    dateAdded: '2025-09-22T10:00:00.000Z',
    lastActivity: '2026-08-03T11:00:00.000Z',
    lastUpdated: '2026-08-03T11:00:00.000Z',
    attributes: {
      'attr-customer-type': 'Mid-market',
      'attr-industry': 'Retail',
      'attr-account-manager': 'Elena Vargas',
      'attr-region': 'LATAM',
      'attr-customer-since': '2019-12-01',
      'attr-annual-revenue': 9800000,
      'attr-newsletter': false,
      'attr-products': ['Surveys'],
    },
    groupIds: ['group-churn'],
    memberships: [membership('group-churn', 'dynamic', '2026-07-01T10:00:00.000Z')],
    consent: { emailSubscribed: false, smsOptIn: false },
    suppression: {
      reason: 'manual',
      at: '2026-08-03T11:00:00.000Z',
      note: 'Requested removal after account closure',
    },
    activity: [
      activity('a13', 'suppressed', 'Manually suppressed', '2026-08-03T11:00:00.000Z'),
    ],
    audit: [
      {
        id: 'au7',
        label: 'Added to organization suppression',
        at: '2026-08-03T11:00:00.000Z',
        actor: 'Admin',
      },
    ],
  },
  {
    id: 'ct-1008',
    firstName: 'Yuki',
    lastName: 'Tanaka',
    email: 'yuki.tanaka@sakura-labs.jp',
    phone: '+81 3 5555 0199',
    organization: 'Sakura Labs',
    country: 'Japan',
    status: 'active',
    dateAdded: '2026-06-27T10:00:00.000Z',
    lastActivity: '2026-10-22T08:20:00.000Z',
    lastUpdated: '2026-07-30T10:00:00.000Z',
    attributes: {
      'attr-customer-type': 'Enterprise',
      'attr-industry': 'Technology',
      'attr-account-manager': 'Anika Shah',
      'attr-region': 'APAC',
      'attr-customer-since': '2024-08-21',
      'attr-annual-revenue': 54000000,
      'attr-newsletter': true,
      'attr-products': ['Surveys', 'Communities'],
    },
    groupIds: ['group-vip', 'group-enterprise', 'group-joined-2026'],
    memberships: [
      membership('group-vip', 'manual', '2026-07-30T10:00:00.000Z'),
      membership('group-enterprise', 'manual', '2026-06-27T10:00:00.000Z'),
      membership('group-joined-2026', 'dynamic', '2026-09-10T10:00:00.000Z'),
    ],
    consent: { emailSubscribed: true, smsOptIn: true },
    activity: [
      activity('a14', 'invitation', 'Invitation delivered', '2026-10-22T08:20:00.000Z'),
    ],
    audit: [],
  },
  {
    id: 'ct-1009',
    firstName: 'Noah',
    lastName: 'Patterson',
    email: 'noah.patterson@invalid-mail',
    organization: 'Patterson Consulting',
    country: 'Canada',
    status: 'invalid',
    dateAdded: '2026-08-16T10:00:00.000Z',
    lastActivity: '2026-08-16T10:05:00.000Z',
    lastUpdated: '2026-08-16T10:05:00.000Z',
    attributes: {
      'attr-customer-type': 'SMB',
      'attr-industry': 'Technology',
      'attr-region': 'North America',
      'attr-newsletter': false,
      'attr-products': ['Surveys'],
    },
    groupIds: ['group-newsletter'],
    memberships: [membership('group-newsletter', 'import', '2026-08-16T10:00:00.000Z')],
    consent: { emailSubscribed: true, smsOptIn: false },
    suppression: {
      reason: 'invalid-email',
      at: '2026-08-16T10:05:00.000Z',
      note: 'Failed address validation on import',
    },
    activity: [
      activity('a15', 'import', 'Imported with invalid email', '2026-08-16T10:00:00.000Z'),
    ],
    audit: [
      {
        id: 'au8',
        label: 'Email marked invalid',
        at: '2026-08-16T10:05:00.000Z',
        actor: 'System',
      },
    ],
  },
  {
    id: 'ct-1010',
    firstName: 'Lena',
    lastName: 'Hoffman',
    email: 'lena.hoffman@eduwave.de',
    phone: '+49 30 1234 5678',
    organization: 'EduWave',
    country: 'Germany',
    status: 'active',
    dateAdded: '2026-02-28T10:00:00.000Z',
    lastActivity: '2026-10-11T17:00:00.000Z',
    lastUpdated: '2026-05-02T10:00:00.000Z',
    attributes: {
      'attr-customer-type': 'Education',
      'attr-industry': 'Education',
      'attr-account-manager': 'Nora Blake',
      'attr-region': 'EMEA',
      'attr-customer-since': '2023-02-10',
      'attr-annual-revenue': 7600000,
      'attr-newsletter': true,
      'attr-products': ['Surveys', 'Employee Experience'],
    },
    groupIds: ['group-newsletter', 'group-joined-2026'],
    memberships: [
      membership('group-newsletter', 'manual', '2026-02-28T10:00:00.000Z'),
      membership('group-joined-2026', 'dynamic', '2026-09-10T10:00:00.000Z'),
    ],
    consent: { emailSubscribed: true, smsOptIn: true },
    activity: [
      activity('a16', 'click', 'Clicked survey link', '2026-10-11T17:00:00.000Z'),
    ],
    audit: [],
  },
  {
    id: 'ct-1011',
    firstName: 'Rohan',
    lastName: 'Mehta',
    email: 'rohan.mehta@zenithbank.in',
    phone: '+91 98111 44556',
    organization: 'Zenith Bank',
    country: 'India',
    status: 'active',
    dateAdded: '2026-09-05T10:00:00.000Z',
    lastActivity: '2026-11-03T10:00:00.000Z',
    lastUpdated: '2026-09-05T10:00:00.000Z',
    attributes: {
      'attr-customer-type': 'Enterprise',
      'attr-industry': 'Financial services',
      'attr-account-manager': 'Anika Shah',
      'attr-region': 'APAC',
      'attr-customer-since': '2026-01-15',
      'attr-annual-revenue': 120000000,
      'attr-newsletter': true,
      'attr-products': ['Surveys', 'CX', 'Communities'],
    },
    groupIds: ['group-india-customers', 'group-enterprise', 'group-joined-2026', 'group-cx-panel'],
    memberships: [
      membership('group-india-customers', 'dynamic', '2026-09-05T10:05:00.000Z'),
      membership('group-enterprise', 'manual', '2026-09-05T10:00:00.000Z'),
      membership('group-joined-2026', 'dynamic', '2026-09-10T10:00:00.000Z'),
      membership('group-cx-panel', 'manual', '2026-09-05T10:00:00.000Z'),
    ],
    consent: { emailSubscribed: true, smsOptIn: true },
    activity: [
      activity('a17', 'invitation', 'Invitation delivered', '2026-11-03T10:00:00.000Z'),
      activity('a18', 'open', 'Opened invitation email', '2026-11-03T10:22:00.000Z'),
    ],
    audit: [],
  },
  {
    id: 'ct-1012',
    firstName: 'Claire',
    lastName: 'Nguyen',
    phone: '+1 646 555 0144',
    organization: 'Harbor Wellness',
    country: 'United States',
    status: 'active',
    dateAdded: '2026-07-21T10:00:00.000Z',
    lastActivity: '2026-09-01T12:00:00.000Z',
    lastUpdated: '2026-07-21T10:00:00.000Z',
    attributes: {
      'attr-customer-type': 'SMB',
      'attr-industry': 'Healthcare',
      'attr-region': 'North America',
      'attr-newsletter': true,
      'attr-products': ['Surveys'],
    },
    groupIds: ['group-healthcare', 'group-joined-2026'],
    memberships: [
      membership('group-healthcare', 'manual', '2026-07-21T10:00:00.000Z'),
      membership('group-joined-2026', 'dynamic', '2026-09-10T10:00:00.000Z'),
    ],
    consent: { emailSubscribed: true, smsOptIn: true },
    activity: [
      activity('a19', 'updated', 'Contact created without email', '2026-07-21T10:00:00.000Z'),
    ],
    audit: [
      {
        id: 'au9',
        label: 'Created without email address',
        at: '2026-07-21T10:00:00.000Z',
        actor: 'Admin',
      },
    ],
  },
];

export const INITIAL_CONTACT_IMPORTS: ContactImportJob[] = [
  {
    id: 'imp-1',
    fileName: 'cx-panel-october.csv',
    status: 'completed',
    importedAt: '2026-10-28T14:20:00.000Z',
    added: 42,
    updated: 18,
    skipped: 3,
    errors: 1,
  },
  {
    id: 'imp-2',
    fileName: 'newsletter-refresh.xlsx',
    status: 'completed',
    importedAt: '2026-10-21T11:10:00.000Z',
    added: 120,
    updated: 64,
    skipped: 9,
    errors: 0,
  },
  {
    id: 'imp-3',
    fileName: 'enterprise-decision-makers.csv',
    status: 'failed',
    importedAt: '2026-09-04T08:40:00.000Z',
    added: 0,
    updated: 0,
    skipped: 0,
    errors: 27,
  },
];

export const INITIAL_CONTACT_GROWTH: ContactGrowthPoint[] = [
  { month: 'May', total: 820 },
  { month: 'Jun', total: 910 },
  { month: 'Jul', total: 1040 },
  { month: 'Aug', total: 1185 },
  { month: 'Sep', total: 1290 },
  { month: 'Oct', total: 1410 },
  { month: 'Nov', total: 1488 },
];

const GROUP_ACCESS_SEED: Record<
  string,
  { owner: string; team?: string; scope: ContactAccessScope; share: GroupShareSettings }
> = {
  'group-cx-panel': {
    owner: 'user-anika',
    team: 'team-cx',
    scope: 'organization',
    share: sharing('organization', [], [], [
      'view',
      'use-distribute',
      'edit-membership',
      'edit-rules',
    ]),
  },
  'group-newsletter': {
    owner: 'user-chris',
    team: 'team-marketing',
    scope: 'team',
    share: sharing('teams', ['team-marketing', 'team-research'], [], [
      'view',
      'use-distribute',
      'edit-membership',
    ]),
  },
  'group-enterprise': {
    owner: 'user-anika',
    team: 'team-research',
    scope: 'organization',
    share: sharing('organization'),
  },
  'group-india-customers': {
    owner: 'user-priya-admin',
    team: 'team-regional',
    scope: 'team',
    share: sharing('teams', ['team-regional', 'team-research'], [], [
      'view',
      'use-distribute',
      'edit-rules',
    ]),
  },
  'group-joined-2026': {
    owner: 'user-anika',
    team: 'team-research',
    scope: 'organization',
    share: sharing('organization'),
  },
  'group-healthcare': {
    owner: 'user-chris',
    team: 'team-research',
    scope: 'team',
    share: sharing('teams', ['team-research', 'team-cx']),
  },
  'group-vip': {
    owner: 'user-chris',
    scope: 'private',
    share: sharing('private', [], [], ['view', 'use-distribute', 'edit-membership', 'delete']),
  },
  'group-churn': {
    owner: 'user-elena',
    team: 'team-cx',
    scope: 'team',
    share: sharing('teams', ['team-cx'], [], ['view', 'use-distribute']),
  },
};

const CONTACT_OWNER_ROTATION = [
  { owner: 'user-anika', team: 'team-cx', scope: 'organization' as const },
  { owner: 'user-chris', team: 'team-research', scope: 'organization' as const },
  { owner: 'user-anika', team: 'team-marketing', scope: 'team' as const },
  { owner: 'user-priya-admin', team: 'team-regional', scope: 'organization' as const },
  { owner: 'user-chris', team: 'team-research', scope: 'private' as const },
];

export function normalizeContact(contact: ContactRecord, index = 0): ContactRecord {
  const seed = CONTACT_OWNER_ROTATION[index % CONTACT_OWNER_ROTATION.length];
  return {
    ...contact,
    organizationIdentity:
      contact.organizationIdentity ??
      contact.email?.trim().toLowerCase() ??
      `id:${contact.id}`,
    ownership:
      contact.ownership ??
      ownership(
        seed.owner,
        contact.dateAdded,
        seed.scope,
        seed.team,
        contact.audit[0]?.actor === 'Admin' ? seed.owner : seed.owner,
        contact.lastUpdated,
      ),
  };
}

export function normalizeGroup(group: ContactGroup): ContactGroup {
  const seed = GROUP_ACCESS_SEED[group.id] ?? {
    owner: 'user-anika',
    team: 'team-research',
    scope: 'organization' as const,
    share: sharing('organization'),
  };
  return {
    ...group,
    ownership:
      group.ownership ??
      ownership(seed.owner, group.createdAt, seed.scope, seed.team, seed.owner, group.updatedAt),
    sharing: group.sharing ?? seed.share,
  };
}

export function normalizeContactHubState(
  state: Partial<ContactHubState> | ContactHubState,
): ContactHubState {
  const contacts = (state.contacts ?? INITIAL_CONTACTS).map((contact, index) =>
    normalizeContact(contact, index),
  );
  return {
    contacts,
    groups: (state.groups ?? INITIAL_CONTACT_GROUPS).map(normalizeGroup),
    attributes: state.attributes ?? INITIAL_CONTACT_ATTRIBUTES,
    imports: state.imports ?? INITIAL_CONTACT_IMPORTS,
    growth: state.growth ?? INITIAL_CONTACT_GROWTH,
    accessPolicy: state.accessPolicy ?? DEFAULT_CONTACT_HUB_POLICY,
  };
}

export const EMPTY_CONTACT_HUB: ContactHubState = normalizeContactHubState({});

export function contactDisplayName(contact: ContactRecord): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

export function contactOwnership(contact: ContactRecord): ContactOwnership {
  return normalizeContact(contact).ownership!;
}

export function groupOwnership(group: ContactGroup): ContactOwnership {
  return normalizeGroup(group).ownership!;
}

export function groupSharing(group: ContactGroup): GroupShareSettings {
  return normalizeGroup(group).sharing!;
}

export function contactIsSendable(contact: ContactRecord): boolean {
  return (
    contact.status === 'active' &&
    Boolean(contact.email) &&
    !contact.suppression &&
    contact.consent.emailSubscribed
  );
}

export function countByStatus(contacts: ContactRecord[], status: ContactStatus): number {
  return contacts.filter((contact) => contact.status === status).length;
}

export function contactsInMultipleGroups(contacts: ContactRecord[]): number {
  return contacts.filter((contact) => contact.groupIds.length > 1).length;
}

export function newContactsThisMonth(contacts: ContactRecord[], now = new Date()): number {
  const month = now.getMonth();
  const year = now.getFullYear();
  return contacts.filter((contact) => {
    const added = new Date(contact.dateAdded);
    return added.getMonth() === month && added.getFullYear() === year;
  }).length;
}

export function groupNameMap(groups: ContactGroup[]): Record<string, string> {
  return Object.fromEntries(groups.map((group) => [group.id, group.name]));
}

export function formatContactDate(value: string): string {
  return formatDate(value);
}

export function formatContactRelative(value: string): string {
  return formatRelativeDate(value);
}

export function estimateRecipients(
  contacts: ContactRecord[],
  source: { type: 'all' } | { type: 'group'; groupId: string },
): { total: number; sendable: number; suppressed: number } {
  const pool =
    source.type === 'all'
      ? contacts
      : contacts.filter((contact) => contact.groupIds.includes(source.groupId));
  const sendable = pool.filter(contactIsSendable).length;
  return {
    total: pool.length,
    sendable,
    suppressed: pool.length - sendable,
  };
}

/** Options for compose / collector recipient pickers. */
export function contactHubRecipientOptions(groups: ContactGroup[]) {
  return [
    { value: 'all-contacts', label: 'All Contacts', contacts: 0, kind: 'all' as const },
    ...groups.map((group) => ({
      value: group.id,
      label: `${group.name} (${group.type === 'dynamic' ? 'Dynamic' : 'Static'})`,
      contacts: group.contactCount,
      kind: group.type,
    })),
  ];
}
