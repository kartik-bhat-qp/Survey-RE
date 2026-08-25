import { LISTENAI_CREDITS_REMAINING } from '@/data/mock-listenai-question';

export const CREDITS_WALLET_PATH = '/credits';

export type CreditTypeId = 'sms' | 'audience' | 'ai' | 'textai' | 'ux';

export type CreditsWalletNavId = 'overall' | 'credits' | 'statistics' | 'email-statistics';

export interface CreditBalanceItem {
  id: CreditTypeId;
  label: string;
  value: number;
  fractionDigits: number;
  icon: string;
}

export interface CreditTransaction {
  id: string;
  occurredAt: string;
  timestampLabel: string;
  creditType: CreditTypeId;
  creditTypeLabel: string;
  details: string;
  userEmail: string;
  userRole: string;
  usage: number;
  balance: number;
}

export interface CreditsWalletNavItem {
  id: CreditsWalletNavId;
  label: string;
}

export interface CreditsFilterOption {
  value: string;
  label: string;
}

export const CREDITS_WALLET_NAV: CreditsWalletNavItem[] = [
  { id: 'overall', label: 'Overall' },
  { id: 'credits', label: 'Credits' },
  { id: 'statistics', label: 'Statistics' },
  { id: 'email-statistics', label: 'Email Statistics' },
];

export const MOCK_CREDIT_BALANCES: CreditBalanceItem[] = [
  { id: 'sms', label: 'SMS', value: 50.38, fractionDigits: 2, icon: 'wm-chat' },
  { id: 'audience', label: 'Audience', value: 0, fractionDigits: 2, icon: 'wm-group' },
  { id: 'ai', label: 'AI', value: LISTENAI_CREDITS_REMAINING, fractionDigits: 0, icon: 'wc-ai' },
  { id: 'textai', label: 'TextAI', value: 8911, fractionDigits: 0, icon: 'wm-description' },
  { id: 'ux', label: 'UX', value: 0, fractionDigits: 0, icon: 'wm-desktop-windows' },
];

export const CREDITS_DEFAULT_DATE_START = '2023-01-10';
export const CREDITS_DEFAULT_DATE_END = '2026-08-25';

export const CREDIT_TYPE_FILTER_OPTIONS: CreditsFilterOption[] = [
  { value: 'all', label: 'All Credits' },
  { value: 'sms', label: 'SMS' },
  { value: 'audience', label: 'Audience' },
  { value: 'ai', label: 'AI' },
  { value: 'textai', label: 'TextAI' },
  { value: 'ux', label: 'UX' },
];

export const CREDIT_USER_FILTER_OPTIONS: CreditsFilterOption[] = [
  { value: 'all', label: 'All users' },
  { value: 'pratik.dhulubulu+kartik@questionpro.com', label: 'pratik.dhulubulu+kartik@questionpro.com' },
  { value: 'kartik.bhat@questionpro.com', label: 'kartik.bhat@questionpro.com' },
  { value: 'maya.ellison@questionpro.com', label: 'maya.ellison@questionpro.com' },
];

export const MOCK_CREDIT_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'txn-01',
    occurredAt: '2026-08-20T16:42:11+05:30',
    timestampLabel: '2026-08-20 16:42:11 GMT+05:30',
    creditType: 'ai',
    creditTypeLabel: 'AI',
    details: 'Conversation study usage, amount: 180 - org: 10938',
    userEmail: 'pratik.dhulubulu+kartik@questionpro.com',
    userRole: 'User',
    usage: -180,
    balance: LISTENAI_CREDITS_REMAINING,
  },
  {
    id: 'txn-02',
    occurredAt: '2026-08-10T11:15:08+05:30',
    timestampLabel: '2026-08-10 11:15:08 GMT+05:30',
    creditType: 'textai',
    creditTypeLabel: 'TextAI',
    details: 'Text AI CREATION, amount: 308 - org: 10938',
    userEmail: 'pratik.dhulubulu+kartik@questionpro.com',
    userRole: 'User',
    usage: -308,
    balance: 8911,
  },
  {
    id: 'txn-03',
    occurredAt: '2026-07-27T09:04:51+05:30',
    timestampLabel: '2026-07-27 09:04:51 GMT+05:30',
    creditType: 'textai',
    creditTypeLabel: 'TextAI',
    details: 'Text AI CREATION, amount: 781 - org: 10938',
    userEmail: 'pratik.dhulubulu+kartik@questionpro.com',
    userRole: 'User',
    usage: -781,
    balance: 9219,
  },
  {
    id: 'txn-04',
    occurredAt: '2026-07-15T14:22:03+05:30',
    timestampLabel: '2026-07-15 14:22:03 GMT+05:30',
    creditType: 'ai',
    creditTypeLabel: 'AI',
    details: 'Credit purchased via payment',
    userEmail: 'kartik.bhat@questionpro.com',
    userRole: 'Super Admin',
    usage: 5000,
    balance: 5000,
  },
  {
    id: 'txn-05',
    occurredAt: '2026-07-02T18:41:20+05:30',
    timestampLabel: '2026-07-02 18:41:20 GMT+05:30',
    creditType: 'textai',
    creditTypeLabel: 'TextAI',
    details: 'Credit purchased via payment',
    userEmail: 'kartik.bhat@questionpro.com',
    userRole: 'Super Admin',
    usage: 10000,
    balance: 10000,
  },
  {
    id: 'txn-06',
    occurredAt: '2026-06-18T10:11:44+05:30',
    timestampLabel: '2026-06-18 10:11:44 GMT+05:30',
    creditType: 'ux',
    creditTypeLabel: 'UX',
    details: 'UX research session credits expired - org: 10938',
    userEmail: 'maya.ellison@questionpro.com',
    userRole: 'User',
    usage: -120,
    balance: 0,
  },
  {
    id: 'txn-07',
    occurredAt: '2026-06-05T12:08:33+05:30',
    timestampLabel: '2026-06-05 12:08:33 GMT+05:30',
    creditType: 'sms',
    creditTypeLabel: 'SMS',
    details: 'Amount transferred to wallet',
    userEmail: 'kartik.bhat@questionpro.com',
    userRole: 'Super Admin',
    usage: 50.38,
    balance: 50.38,
  },
  {
    id: 'txn-08',
    occurredAt: '2026-05-22T08:55:17+05:30',
    timestampLabel: '2026-05-22 08:55:17 GMT+05:30',
    creditType: 'audience',
    creditTypeLabel: 'Audience',
    details: 'Audience panel sample deployed for Customer Loyalty Tracker - org: 10938',
    userEmail: 'maya.ellison@questionpro.com',
    userRole: 'User',
    usage: -250,
    balance: 0,
  },
  {
    id: 'txn-09',
    occurredAt: '2026-05-21T19:02:09+05:30',
    timestampLabel: '2026-05-21 19:02:09 GMT+05:30',
    creditType: 'audience',
    creditTypeLabel: 'Audience',
    details: 'Credit purchased via payment',
    userEmail: 'kartik.bhat@questionpro.com',
    userRole: 'Super Admin',
    usage: 250,
    balance: 250,
  },
  {
    id: 'txn-10',
    occurredAt: '2026-04-14T11:36:28+05:30',
    timestampLabel: '2026-04-14 11:36:28 GMT+05:30',
    creditType: 'ux',
    creditTypeLabel: 'UX',
    details: 'Credit purchased via payment',
    userEmail: 'kartik.bhat@questionpro.com',
    userRole: 'Super Admin',
    usage: 120,
    balance: 120,
  },
  {
    id: 'txn-11',
    occurredAt: '2026-03-09T15:19:52+05:30',
    timestampLabel: '2026-03-09 15:19:52 GMT+05:30',
    creditType: 'textai',
    creditTypeLabel: 'TextAI',
    details:
      'Text AI CREATION for Enterprise customer feedback templates — EMEA region quarterly analysis dashboard, amount: 1640 - org: 10938',
    userEmail: 'pratik.dhulubulu+kartik@questionpro.com',
    userRole: 'User',
    usage: -1640,
    balance: 0,
  },
  {
    id: 'txn-12',
    occurredAt: '2026-02-11T09:47:05+05:30',
    timestampLabel: '2026-02-11 09:47:05 GMT+05:30',
    creditType: 'sms',
    creditTypeLabel: 'SMS',
    details: 'SMS campaign send for Employee Engagement Survey reminder',
    userEmail: 'maya.ellison@questionpro.com',
    userRole: 'User',
    usage: -24.62,
    balance: 0,
  },
];
