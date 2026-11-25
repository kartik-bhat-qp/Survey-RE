export type CommunityInvitationStatus =
  | 'Delivery successful'
  | 'Scheduled'
  | 'Failed'
  | 'Closed';

export interface CommunityInvitation {
  id: string;
  surveyName: string;
  sentAt: string;
  status: CommunityInvitationStatus;
  invitedEmail?: string;
  initialSent: number;
  successCount: number;
  completed: number;
}

export const COMMUNITY_INVITATION_STATUSES: CommunityInvitationStatus[] = [
  'Delivery successful',
  'Scheduled',
  'Failed',
  'Closed',
];

const INVITED = 'earth.bhat@questionpro.com';

export const COMMUNITY_INVITATIONS: CommunityInvitation[] = [
  {
    id: 'inv-res-test',
    surveyName: 'res test',
    sentAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 1,
    successCount: 1,
    completed: 0,
  },
  {
    id: 'inv-consumer',
    surveyName: 'New consumer research',
    sentAt: '2026-11-24T18:10:00',
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 1,
    successCount: 1,
    completed: 0,
  },
  {
    id: 'inv-services-a',
    surveyName: 'QuestionPro : Services Provided to Consumers',
    sentAt: '2026-11-24T16:40:00',
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 1,
    successCount: 1,
    completed: 0,
  },
  {
    id: 'inv-services-b',
    surveyName: 'QuestionPro : Services Provided to Consumers',
    sentAt: '2026-11-24T11:05:00',
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 1,
    successCount: 0,
    completed: 0,
  },
  {
    id: 'inv-matrix',
    surveyName: 'Matrix bi',
    sentAt: '2026-11-23T17:20:00',
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 1,
    successCount: 0,
    completed: 0,
  },
  {
    id: 'inv-address',
    surveyName: 'Address',
    sentAt: '2026-11-23T15:45:00',
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 1,
    successCount: 1,
    completed: 0,
  },
  {
    id: 'inv-captcha',
    surveyName: 'New survey for testing captcha',
    sentAt: '2026-11-23T13:10:00',
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 1,
    successCount: 1,
    completed: 0,
  },
  {
    id: 'inv-open-matrix',
    surveyName: 'Open Matrix',
    sentAt: '2026-11-23T11:30:00',
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 1,
    successCount: 1,
    completed: 0,
  },
  {
    id: 'inv-kartik',
    surveyName: 'kartik test',
    sentAt: '2026-11-23T09:05:00',
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 1,
    successCount: 1,
    completed: 0,
  },
  {
    id: 'inv-scheduled',
    surveyName: 'Holiday gifting study',
    sentAt: '2026-11-22T10:00:00',
    status: 'Scheduled',
    invitedEmail: 'priya.nair@questionpro.com',
    initialSent: 0,
    successCount: 0,
    completed: 0,
  },
  {
    id: 'inv-long',
    surveyName:
      'QuestionPro : Services Provided to Consumers — quarterly brand, product, and support experience tracking across North America and EMEA',
    sentAt: '2026-10-02T11:30:00',
    status: 'Delivery successful',
    invitedEmail: 'james.okonkwo@questionpro.com',
    initialSent: 240,
    successCount: 228,
    completed: 96,
  },
  {
    id: 'inv-failed',
    surveyName: 'Win-back offer for lapsed members',
    sentAt: '2026-09-18T14:20:00',
    status: 'Failed',
    invitedEmail: 'sofia.alvarez@questionpro.com',
    initialSent: 80,
    successCount: 0,
    completed: 0,
  },
  {
    id: 'inv-profile',
    surveyName: 'Profile completeness check',
    sentAt: '2026-08-14T09:15:00',
    status: 'Delivery successful',
    initialSent: 12,
    successCount: 12,
    completed: 4,
  },
  {
    id: 'inv-closed',
    surveyName: 'Campus ambassador pulse',
    sentAt: '2026-07-03T16:00:00',
    status: 'Closed',
    invitedEmail: 'amelia.brooks@questionpro.com',
    initialSent: 45,
    successCount: 44,
    completed: 21,
  },
  {
    id: 'inv-research',
    surveyName: 'research',
    sentAt: '2026-01-26T08:40:00',
    status: 'Delivery successful',
    invitedEmail: INVITED,
    initialSent: 30,
    successCount: 30,
    completed: 0,
  },
];
