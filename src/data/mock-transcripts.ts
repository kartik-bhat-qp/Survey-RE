export type TranscriptStatus = 'ready' | 'processing' | 'failed';
export type TranscriptSource = 'Interview' | 'Focus group' | 'Call recording' | 'Survey video';

export interface Transcript {
  id: string;
  name: string;
  source: TranscriptSource;
  status: TranscriptStatus;
  language: string;
  duration?: string;
  speakers: number;
  owner: string;
  createdAt: string;
  excerpt: string;
  body?: string;
}

export const MOCK_TRANSCRIPTS: Transcript[] = [
  {
    id: 'tr-1001',
    name: 'NPS follow-up interviews — Week 12',
    source: 'Interview',
    status: 'ready',
    language: 'English',
    duration: '42:18',
    speakers: 2,
    owner: 'Priya Raman',
    createdAt: '2026-08-12',
    excerpt: 'Promoters mentioned faster onboarding, but still want clearer reporting exports.',
    body: 'Interviewer: Thanks for joining. How has the last quarter felt compared with last year?\n\nRespondent: Much smoother. The onboarding flow used to take a full week. Now most teams are productive by day two.\n\nInterviewer: And reporting?\n\nRespondent: Still the pain point. Exports land in three different formats and none match finance.',
  },
  {
    id: 'tr-1002',
    name: 'Brand tracker focus group — Mumbai',
    source: 'Focus group',
    status: 'ready',
    language: 'English',
    duration: '1:08:04',
    speakers: 8,
    owner: 'Marcus Williams',
    createdAt: '2026-08-09',
    excerpt: 'Unaided recall clustered around reliability and “too many dashboards.”',
    body: 'Moderator: When you hear the brand name, what comes to mind first?\n\nP3: Reliability. We have not had a major outage in two years.\n\nP6: Also too many dashboards. I never know which one is the source of truth.',
  },
  {
    id: 'tr-1003',
    name: 'Support call — Acme Logistics billing dispute',
    source: 'Call recording',
    status: 'ready',
    language: 'English',
    duration: '18:41',
    speakers: 2,
    owner: 'Sofia Alvarez',
    createdAt: '2026-08-07',
    excerpt: 'Customer asked to reverse July overage charges tied to a duplicate workspace.',
  },
  {
    id: 'tr-1004',
    name: 'VideoAI open-ends — Combat sports attitudes',
    source: 'Survey video',
    status: 'processing',
    language: 'English',
    duration: '0:21',
    speakers: 1,
    owner: 'Kartik Bhat',
    createdAt: '2026-08-14',
    excerpt: 'Transcription is still running for 24 remaining clips.',
  },
  {
    id: 'tr-1005',
    name: 'CX advisory board — Q3 roadmap review with the North America enterprise customer panel discussing dashboard latency, quota alerts, and the proposed Analytics 2.0 navigation',
    source: 'Interview',
    status: 'ready',
    language: 'English',
    duration: '56:12',
    speakers: 6,
    owner: 'Sarah Chen',
    createdAt: '2026-07-28',
    excerpt: 'Advisors asked to keep the classic Analytics tab while rolling out Analytics 2.0.',
  },
  {
    id: 'tr-1006',
    name: 'Employee pulse interviews — APAC',
    source: 'Interview',
    status: 'ready',
    language: 'English',
    duration: '33:09',
    speakers: 3,
    owner: 'Lina Park',
    createdAt: '2026-07-22',
    excerpt: 'Managers want weekly pulse summaries instead of a quarterly dump.',
  },
  {
    id: 'tr-1007',
    name: 'Usability session — Media library upload',
    source: 'Interview',
    status: 'failed',
    language: 'English',
    speakers: 2,
    owner: 'Devon Clarke',
    createdAt: '2026-07-18',
    excerpt: 'Audio capture failed after the 12-minute mark. Re-record requested.',
  },
  {
    id: 'tr-1008',
    name: 'Win/loss call — Contoso vs. competitor RFP',
    source: 'Call recording',
    status: 'ready',
    language: 'English',
    duration: '27:55',
    speakers: 4,
    owner: 'Priya Raman',
    createdAt: '2026-07-11',
    excerpt: 'Lost on implementation timeline, not price. Security review was cited twice.',
  },
  {
    id: 'tr-1009',
    name: 'Community AMA — Communities product',
    source: 'Focus group',
    status: 'ready',
    language: 'English',
    duration: '49:30',
    speakers: 12,
    owner: 'Amelia Grant',
    createdAt: '2026-06-30',
    excerpt: 'Members asked for transcript search across past events.',
  },
  {
    id: 'tr-1010',
    name: 'Spanish-language customer interviews — LATAM',
    source: 'Interview',
    status: 'ready',
    language: 'Spanish',
    duration: '39:02',
    speakers: 2,
    owner: 'Sofia Alvarez',
    createdAt: '2026-06-21',
    excerpt: 'Respondents preferred local-language summaries over machine-translated English.',
  },
  {
    id: 'tr-1011',
    name: 'Shopper intercepts — weekend panel',
    source: 'Focus group',
    status: 'processing',
    language: 'English',
    duration: '12:04',
    speakers: 5,
    owner: 'Marcus Williams',
    createdAt: '2026-08-16',
    excerpt: 'Waiting on speaker diarization before the transcript is published.',
  },
];

export function getTranscriptById(id: string): Transcript | undefined {
  return MOCK_TRANSCRIPTS.find((item) => item.id === id);
}
