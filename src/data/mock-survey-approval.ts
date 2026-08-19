import { SURVEY_REVIEW_MODE_SURVEY_ID } from '@/data/mock-survey-review-mode';

export type SurveyApprovalStatus =
  | 'not-submitted'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes-requested';

export type SurveyApprovalActivityType =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'changes-requested'
  | 'cancelled';

export interface SurveyReviewer {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SurveyApprovalRequest {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  notes: string;
  submittedAt: string;
  submittedBy: string;
}

export interface SurveyApprovalActivity {
  id: string;
  type: SurveyApprovalActivityType;
  actorName: string;
  message: string;
  createdAt: string;
}

export interface SurveyApprovalState {
  status: SurveyApprovalStatus;
  published: boolean;
  currentRequest: SurveyApprovalRequest | null;
  reviewerFeedback: string;
  activity: SurveyApprovalActivity[];
}

export const SURVEY_APPROVAL_OWNER_NAME = 'Jordan Patel';

export const CURRENT_SURVEY_REVIEWER_ID = 'rev-kartik';

export const SURVEY_REVIEWERS: SurveyReviewer[] = [
  {
    id: 'rev-kartik',
    name: 'Kartik Bhat',
    email: 'kartik.bhat@questionpro.com',
    role: 'Research',
  },
  {
    id: 'rev-maya',
    name: 'Maya Chen',
    email: 'maya.chen@questionpro.com',
    role: 'Research operations',
  },
  {
    id: 'rev-lucas',
    name: 'Lucas Moretti',
    email: 'lucas.moretti@questionpro.com',
    role: 'Brand insights',
  },
  {
    id: 'rev-priya',
    name: 'Priya Ramanathan',
    email: 'priya.ramanathan@questionpro.com',
    role: 'Compliance',
  },
  {
    id: 'rev-elena',
    name: 'Elena Vasquez',
    email: 'elena.vasquez@questionpro.com',
    role: 'Survey quality',
  },
  {
    id: 'rev-owen',
    name: 'Owen Blake',
    email: 'owen.blake@questionpro.com',
    role: 'Legal review',
  },
  {
    id: 'rev-hana',
    name: 'Hana Takahashi',
    email: 'hana.takahashi@questionpro.com',
    role: 'CX research',
  },
  {
    id: 'rev-samuel',
    name: 'Samuel Okonkwo',
    email: 'samuel.okonkwo@questionpro.com',
    role: 'Data governance',
  },
  {
    id: 'rev-long',
    name: 'Alexandria Montgomery-Whitfield',
    email: 'alexandria.montgomery-whitfield@questionpro.com',
    role: 'Enterprise review board',
  },
];

export function getCurrentSurveyReviewer(): SurveyReviewer {
  return (
    SURVEY_REVIEWERS.find((reviewer) => reviewer.id === CURRENT_SURVEY_REVIEWER_ID) ??
    SURVEY_REVIEWERS[0]
  );
}

export const DEFAULT_SURVEY_APPROVAL_STATE: SurveyApprovalState = {
  status: 'not-submitted',
  published: false,
  currentRequest: null,
  reviewerFeedback: '',
  activity: [],
};

const SURVEY_APPROVAL_UPDATED_EVENT = 'survey-approval-state-updated';

export function surveyHasApprovalTab(surveyId: number): boolean {
  return surveyId === SURVEY_REVIEW_MODE_SURVEY_ID;
}

export function surveyApprovalStorageKey(surveyId: number): string {
  return `survey-approval-${surveyId}`;
}

export function getSurveyApprovalStatusLabel(status: SurveyApprovalStatus): string {
  switch (status) {
    case 'pending':
      return 'In review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'changes-requested':
      return 'Changes requested';
    default:
      return 'Not submitted';
  }
}

export function getSurveyApprovalStatusCopy(
  status: SurveyApprovalStatus,
  published = false
): string {
  switch (status) {
    case 'pending':
      return 'A reviewer is looking at this survey. It will publish automatically if they approve it.';
    case 'approved':
      return published
        ? 'This survey was approved and published.'
        : 'This survey was approved. Send it for review again to publish.';
    case 'rejected':
      return 'The reviewer rejected this survey. Review their comments, then send it for review again.';
    case 'changes-requested':
      return 'The reviewer asked for updates. Make the changes, then send it for review again.';
    default:
      return 'Send this survey for review. Publish stays off until a reviewer approves it.';
  }
}

export function normalizeSurveyApprovalState(
  stored?: Partial<SurveyApprovalState> | null
): SurveyApprovalState {
  const currentRequest = stored?.currentRequest
    ? {
        ...stored.currentRequest,
        reviewerEmail:
          stored.currentRequest.reviewerEmail ||
          findSurveyReviewerByEmail(stored.currentRequest.reviewerName)?.email ||
          stored.currentRequest.reviewerName,
      }
    : null;

  const status = stored?.status ?? DEFAULT_SURVEY_APPROVAL_STATE.status;

  return {
    status,
    published: stored?.published ?? status === 'approved',
    currentRequest,
    reviewerFeedback: stored?.reviewerFeedback ?? '',
    activity: Array.isArray(stored?.activity) ? stored.activity : [],
  };
}

export function readSurveyApprovalState(surveyId: number): SurveyApprovalState {
  if (typeof window === 'undefined') return DEFAULT_SURVEY_APPROVAL_STATE;
  try {
    const raw = window.localStorage.getItem(`survey-re:${surveyApprovalStorageKey(surveyId)}`);
    if (!raw) return DEFAULT_SURVEY_APPROVAL_STATE;
    return normalizeSurveyApprovalState(JSON.parse(raw) as Partial<SurveyApprovalState>);
  } catch {
    return DEFAULT_SURVEY_APPROVAL_STATE;
  }
}

export function writeSurveyApprovalState(
  surveyId: number,
  next: SurveyApprovalState
): SurveyApprovalState {
  const normalized = normalizeSurveyApprovalState(next);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        `survey-re:${surveyApprovalStorageKey(surveyId)}`,
        JSON.stringify(normalized)
      );
    } catch {
      /* ignore quota / private mode */
    }
    window.dispatchEvent(
      new CustomEvent(SURVEY_APPROVAL_UPDATED_EVENT, {
        detail: { surveyId, state: normalized },
      })
    );
  }
  return normalized;
}

export function subscribeSurveyApprovalState(
  surveyId: number,
  listener: (state: SurveyApprovalState) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handler = (event: Event): void => {
    const custom = event as CustomEvent<{ surveyId: number; state: SurveyApprovalState }>;
    if (custom.detail?.surveyId !== surveyId) return;
    listener(custom.detail.state);
  };

  const storageHandler = (event: StorageEvent): void => {
    if (event.key !== `survey-re:${surveyApprovalStorageKey(surveyId)}`) return;
    listener(readSurveyApprovalState(surveyId));
  };

  window.addEventListener(SURVEY_APPROVAL_UPDATED_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(SURVEY_APPROVAL_UPDATED_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

export function getSurveyReviewerPagePath(surveyId: number): string {
  return `/review/${surveyId}`;
}

export function openSurveyReviewerPage(surveyId: number): Window | null {
  if (typeof window === 'undefined') return null;
  return window.open(getSurveyReviewerPagePath(surveyId), `survey-review-${surveyId}`);
}

export function applySurveyReviewDecision(
  surveyId: number,
  decision: 'approved' | 'rejected',
  comments: string
): SurveyApprovalState {
  const current = readSurveyApprovalState(surveyId);
  const reviewerName = current.currentRequest?.reviewerName ?? 'Reviewer';
  const trimmed = comments.trim();
  const approved = decision === 'approved';

  return writeSurveyApprovalState(surveyId, {
    ...current,
    status: approved ? 'approved' : 'rejected',
    published: approved,
    reviewerFeedback: trimmed,
    activity: [
      createApprovalActivity(
        approved ? 'approved' : 'rejected',
        reviewerName,
        approved
          ? trimmed
            ? `${reviewerName} approved this survey. ${trimmed}`
            : `${reviewerName} approved this survey. It is now published.`
          : trimmed
            ? `${reviewerName} rejected this survey. ${trimmed}`
            : `${reviewerName} rejected this survey.`
      ),
      ...current.activity,
    ],
  });
}

export function findSurveyReviewerByEmail(email: string): SurveyReviewer | undefined {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return undefined;
  return SURVEY_REVIEWERS.find((reviewer) => reviewer.email.toLowerCase() === normalized);
}

export function resolveSurveyReviewer(email: string): SurveyReviewer {
  const normalized = email.trim().toLowerCase();
  const existing = findSurveyReviewerByEmail(normalized);
  if (existing) return existing;
  return {
    id: `rev-email-${normalized}`,
    name: normalized,
    email: normalized,
    role: 'External reviewer',
  };
}

export function getSurveyReviewerSelectOptions(): {
  id: string;
  label: string;
}[] {
  return SURVEY_REVIEWERS.map((reviewer) => ({
    id: reviewer.id,
    label: `${reviewer.name} (${reviewer.email})`,
  }));
}

export function createApprovalActivity(
  type: SurveyApprovalActivityType,
  actorName: string,
  message: string
): SurveyApprovalActivity {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    actorName,
    message,
    createdAt: new Date().toISOString(),
  };
}
