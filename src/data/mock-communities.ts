import type { CommunityId } from '@/data/mock-question-communities';

export type CommunityStatus = 'Active' | 'Draft' | 'Closed';

export interface CommunityListItem {
  id: CommunityId;
  name: string;
  members: number;
  status: CommunityStatus;
  createdAt: string;
  modifiedAt?: string;
}

export const MOCK_COMMUNITIES: CommunityListItem[] = [
  {
    id: 'my-community',
    name: 'My community',
    members: 1284,
    status: 'Active',
    createdAt: '2024-03-12T09:00:00Z',
    modifiedAt: '2026-10-18T14:20:00Z',
  },
  {
    id: 'customer-advisory-panel',
    name: 'Customer Advisory Panel',
    members: 86,
    status: 'Active',
    createdAt: '2025-01-08T11:30:00Z',
    modifiedAt: '2026-10-02T16:05:00Z',
  },
  {
    id: 'beta-testers',
    name: 'Beta Testers',
    members: 214,
    status: 'Active',
    createdAt: '2025-06-19T08:15:00Z',
    modifiedAt: '2026-09-28T10:40:00Z',
  },
  {
    id: 'product-research-panel',
    name: 'Product Research Panel',
    members: 640,
    status: 'Active',
    createdAt: '2024-11-04T13:00:00Z',
    modifiedAt: '2026-08-14T09:12:00Z',
  },
  {
    id: 'employee-voice',
    name: 'Employee Voice',
    members: 3102,
    status: 'Active',
    createdAt: '2023-09-01T07:45:00Z',
    modifiedAt: '2026-10-21T18:30:00Z',
  },
  {
    id: 'healthcare-professionals-emea',
    name: 'North America and EMEA healthcare professionals and patient advocates — longitudinal panel',
    members: 472,
    status: 'Active',
    createdAt: '2025-02-17T15:10:00Z',
    modifiedAt: '2026-07-09T12:00:00Z',
  },
  {
    id: 'nps-advocates',
    name: 'NPS Advocates',
    members: 0,
    status: 'Draft',
    createdAt: '2026-10-11T09:20:00Z',
  },
  {
    id: 'retail-shopper-community',
    name: 'Retail Shopper Community',
    members: 958,
    status: 'Active',
    createdAt: '2024-07-22T10:00:00Z',
    modifiedAt: '2026-06-30T11:18:00Z',
  },
  {
    id: 'campus-ambassadors',
    name: 'Campus Ambassadors',
    members: 143,
    status: 'Active',
    createdAt: '2025-08-03T16:40:00Z',
    modifiedAt: '2026-09-01T08:55:00Z',
  },
  {
    id: 'legacy-member-panel',
    name: 'Legacy Member Panel',
    members: 57,
    status: 'Closed',
    createdAt: '2022-04-14T12:00:00Z',
    modifiedAt: '2025-12-19T17:25:00Z',
  },
];

export function getCommunityById(id: string): CommunityListItem | undefined {
  return MOCK_COMMUNITIES.find((community) => community.id === id);
}

export interface CommunityHome {
  verifiedMembers: number;
  newSignups: number;
  newTopics: number;
  topicCategories: number;
  topicComments: number;
  newIdeas: number;
  ideaCampaigns: number;
  ideaComments: number;
  signupNote: string;
  portalUrl: string;
}

const SCREENSHOT_HOME: CommunityHome = {
  verifiedMembers: 30,
  newSignups: 22,
  newTopics: 0,
  topicCategories: 1,
  topicComments: 0,
  newIdeas: 0,
  ideaCampaigns: 2,
  ideaComments: 0,
  signupNote: 'No new signups in the last 15 weeks',
  portalUrl: 'https://customercom.questionpro.com',
};

export function getCommunityHome(community: CommunityListItem): CommunityHome {
  if (community.id === 'my-community') return SCREENSHOT_HOME;
  const verifiedMembers = community.members;
  return {
    verifiedMembers,
    newSignups: Math.min(22, Math.round(verifiedMembers * 0.04)),
    newTopics: verifiedMembers > 200 ? 3 : 0,
    topicCategories: 1,
    topicComments: verifiedMembers > 500 ? 6 : 0,
    newIdeas: verifiedMembers > 100 ? 2 : 0,
    ideaCampaigns: 2,
    ideaComments: 0,
    signupNote: 'No new signups in the last 15 weeks',
    portalUrl: 'https://customercom.questionpro.com',
  };
}
