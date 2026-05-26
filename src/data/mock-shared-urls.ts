export interface SharedUrlLink {
  id: number;
  name: string;
  url: string;
  createdAt: string;
  status: boolean;
}

export const MOCK_SHARED_URLS: SharedUrlLink[] = [
  {
    id: 1,
    name: 'India data',
    url: 'https://bi.questionpro.com/sd/2a36f8c1-9e4b-4d2a-b7c1-8f3e2a1d9c0e',
    createdAt: '2026-05-21',
    status: true,
  },
  {
    id: 2,
    name: 'Q1 executive summary',
    url: 'https://bi.questionpro.com/sd/7b12e4a0-1f3c-4a8d-9e2b-5c4d6f8a0b1c',
    createdAt: '2026-05-18',
    status: true,
  },
  {
    id: 3,
    name: 'Retail panel — West region weekly pulse dashboard external share for franchise partners',
    url: 'https://bi.questionpro.com/sd/c9d8e7f6-a5b4-4c3d-9e2f-1a0b9c8d7e6f',
    createdAt: '2026-05-10',
    status: false,
  },
  {
    id: 4,
    name: 'NPS tracker',
    url: 'https://bi.questionpro.com/sd/3f4e5d6c-7b8a-9c0d-8e1f-2a3b4c5d6e7f',
    createdAt: '2026-04-28',
    status: true,
  },
  {
    id: 5,
    name: 'Brand health 2026',
    url: 'https://bi.questionpro.com/sd/1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    createdAt: '2026-04-15',
    status: false,
  },
  {
    id: 6,
    name: 'CX post-purchase',
    url: 'https://bi.questionpro.com/sd/8e7d6c5b-4a3f-2e1d-9c0b-8a7f6e5d4c3b',
    createdAt: '2026-03-22',
    status: true,
  },
  {
    id: 7,
    name: 'Employee engagement',
    url: 'https://bi.questionpro.com/sd/5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f',
    createdAt: '2026-02-14',
    status: true,
  },
  {
    id: 8,
    name: 'Ad hoc — board meeting',
    url: 'https://bi.questionpro.com/sd/2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a',
    createdAt: '2026-01-30',
    status: false,
  },
  {
    id: 9,
    name: 'APAC stakeholder review',
    url: 'https://bi.questionpro.com/sd/9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c',
    createdAt: '2026-01-12',
    status: true,
  },
  {
    id: 10,
    name: 'Product launch — read-only',
    url: 'https://bi.questionpro.com/sd/0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
    createdAt: '2025-12-08',
    status: false,
  },
];

export const SHARED_URLS_PER_PAGE = 10;
