import type { IWuAppHeaderMenuItem } from '@npm-questionpro/wick-ui-lib';

const APP_NAV = 'https://qa-priority.questionpro.com/images/appnavigation';

export const MOCK_HEADER_CATEGORIES: IWuAppHeaderMenuItem[] = [
  {
    name: 'Research Suite',
    active: true,
    logo: `${APP_NAV}/research-suite.svg`,
    order: 1,
    products: [
      {
        name: 'Surveys',
        icon: 'e308',
        link: '/surveys?from=product-switcher',
        active: true,
        logo: `${APP_NAV}/survey-product.png`,
        order: 1,
      },
      {
        name: 'Communities',
        icon: 'e314',
        link: 'https://www.questionpro.com/a/showPanelManagement.do',
        active: true,
        logo: `${APP_NAV}/communities-product.png`,
        order: 2,
      },
      {
        name: 'Audience',
        icon: 'e309',
        link: 'https://www.questionpro.com/a/showAudience.do',
        active: true,
        logo: `${APP_NAV}/audience-product.png`,
        order: 3,
      },
    ],
  },
  {
    name: 'Customer Experience',
    active: true,
    logo: `${APP_NAV}/customer-experience.svg`,
    order: 2,
    products: [
      {
        name: 'Customer Experience',
        icon: 'e313',
        link: 'https://www.questionpro.com/a/showCXFeedback.do',
        active: true,
        logo: `${APP_NAV}/cx-product.png`,
        order: 1,
      },
      {
        name: 'Surveys',
        icon: 'e308',
        link: 'https://www.questionpro.com/a/listSurveys.do',
        active: true,
        logo: `${APP_NAV}/survey-product.png`,
        order: 2,
      },
      {
        name: 'Reputation',
        icon: 'e316',
        link: 'https://www.questionpro.com/a/showReputation.do?appOrigin=https://www.questionpro.com',
        active: true,
        logo: `${APP_NAV}/reputation-product.png`,
        order: 3,
      },
    ],
  },
  {
    name: 'Employee Experience',
    active: true,
    logo: `${APP_NAV}/employee-experience.svg`,
    order: 3,
    products: [
      {
        name: 'Employee Experience',
        icon: 'e315',
        link: 'https://www.questionpro.com/a/listMyFlashletSurveys.do',
        active: true,
        logo: `${APP_NAV}/workforce-product.png`,
        order: 1,
      },
      {
        name: 'Empower',
        icon: 'e324',
        link: 'https://empower.questionpro.com?appOrigin=https://www.questionpro.com',
        active: true,
        logo: `${APP_NAV}/empower-product.svg`,
        order: 2,
      },
    ],
  },
  {
    name: 'Business Intelligence',
    active: true,
    logo: `${APP_NAV}/bi-product.svg`,
    order: 4,
    products: [
      {
        name: 'BI',
        icon: 'e381',
        link: '/dashboards',
        active: true,
        logo: `${APP_NAV}/bi-product-icon.png`,
        order: 1,
      },
    ],
  },
  {
    name: 'Engagement',
    active: true,
    logo: `${APP_NAV}/engagement.svg`,
    order: 5,
    products: [
      {
        name: 'LivePolls',
        icon: 'e311',
        link: 'https://livepolls.questionpro.com?appOrigin=https://www.questionpro.com',
        active: true,
        logo: `${APP_NAV}/live-polls-product.png`,
        order: 1,
      },
    ],
  },
];

export const HEADER_PRODUCT_NAME = 'Business Intelligence';

export const HEADER_BRAND_COLOR = {
  base: '#1b87e6',
  hover: '#54A5EC',
};
