import type { IWuAppHeaderAccount } from '@npm-questionpro/wick-ui-lib';

export const MOCK_HEADER_USER: IWuAppHeaderAccount = {
  profile: {
    title: 'Kartik Bhat',
    subtitle: 'kartik.bhat@questionpro.com',
    companyName: 'kartik.bhat',
    initials: 'KB',
  },
  license: {
    title: 'UPGRADE ACCOUNT',
    subtitle: 'QuestionPro Admin',
    expiryDatePostFixString: 'Expires',
    expiryDate: 'May 09, 2031',
    showExpiryDate: true,
    url: '#',
    upgradeLink: true,
  },
  settings: [
    { title: 'My Account', url: '/my-account', canDisplay: true, displayIcon: true },
    { title: 'Organization', url: '#', canDisplay: true },
    { title: 'Compliance', url: '/compliance', canDisplay: true },
    { title: 'Issue Tracker', url: '/issue-tracker', canDisplay: true },
    { title: 'Migration Center', url: '/migration-center', canDisplay: true },
  ],
  usage: {
    title: 'Usage',
    collectedResponseCount: '101K',
    url: '#',
  },
  invoice: {
    title: 'Billing & Invoices',
    size: 32,
    url: '/billing',
  },
  issueTrackerCount: 30,
};

export const MOCK_HEADER_DATA_CENTER = {
  locationLabel: 'SEATTLE, UNITED STATES',
};
