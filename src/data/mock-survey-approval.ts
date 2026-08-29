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
  | 'cancelled'
  | 'reminder';

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
  /** Optional review deadline. Overdue UX only applies when set. */
  dueDate?: string | null;
  /** Last manual reminder; null until the owner sends one. */
  lastReminderSentAt?: string | null;
}

export interface SurveyApprovalActivity {
  id: string;
  type: SurveyApprovalActivityType;
  actorName: string;
  message: string;
  createdAt: string;
  targetLabel?: string;
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
      return 'Pending';
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
        dueDate: stored.currentRequest.dueDate ?? null,
        lastReminderSentAt: stored.currentRequest.lastReminderSentAt ?? null,
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
  return `/surveys/${surveyId}?mode=review`;
}

export function openSurveyReviewerPage(surveyId: number): Window | null {
  if (typeof window === 'undefined') return null;
  return window.open(getSurveyReviewerPagePath(surveyId), `survey-review-${surveyId}`);
}

export const SURVEY_REVIEW_MODE_QUERY = 'mode';
export const SURVEY_REVIEW_MODE_VALUE = 'review';

export function isSurveyReviewModeQuery(value: string | null | undefined): boolean {
  return value === SURVEY_REVIEW_MODE_VALUE;
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
  message: string,
  targetLabel?: string
): SurveyApprovalActivity {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    actorName,
    message,
    createdAt: new Date().toISOString(),
    targetLabel,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_COOLDOWN_MS = DAY_MS;

/** Prototype default: new requests are already 2 days past due so overdue UX is visible. */
export function getPrototypeSurveyApprovalDueDate(from = new Date()): string {
  return new Date(from.getTime() - 2 * DAY_MS).toISOString();
}

export function isSurveyApprovalRequestOverdue(
  request: SurveyApprovalRequest | null | undefined,
  now = Date.now()
): boolean {
  if (!request?.dueDate) return false;
  return new Date(request.dueDate).getTime() < now;
}

export function getSurveyApprovalOverdueDayCount(
  dueDate: string,
  now = Date.now()
): number {
  const elapsed = now - new Date(dueDate).getTime();
  return Math.max(1, Math.round(elapsed / DAY_MS));
}

export function getSurveyApprovalPendingStatusLabel(
  status: SurveyApprovalStatus,
  request: SurveyApprovalRequest | null | undefined
): string {
  if (status === 'pending') return 'Pending';
  return getSurveyApprovalStatusLabel(status);
}

export function getSurveyApprovalPendingStatusCopy(
  status: SurveyApprovalStatus,
  published: boolean,
  request: SurveyApprovalRequest | null | undefined
): string {
  if (status === 'pending' && request?.dueDate) {
    if (isSurveyApprovalRequestOverdue(request)) {
      const days = getSurveyApprovalOverdueDayCount(request.dueDate);
      return `Due ${days} day${days === 1 ? '' : 's'} ago. ${request.reviewerName} hasn't responded yet.`;
    }
    return `Due ${formatApprovalDueDate(request.dueDate)}.`;
  }
  return getSurveyApprovalStatusCopy(status, published);
}

function formatApprovalDueDate(dueDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dueDate));
}

export function getSurveyApprovalReminderCooldown(
  request: SurveyApprovalRequest | null | undefined,
  now = Date.now()
): { blocked: boolean; hoursAgo: number; message: string | null } {
  const last = request?.lastReminderSentAt;
  if (!last) {
    return { blocked: false, hoursAgo: 0, message: null };
  }
  const elapsed = now - new Date(last).getTime();
  if (elapsed >= REMINDER_COOLDOWN_MS) {
    return { blocked: false, hoursAgo: 0, message: null };
  }
  const hoursAgo = Math.max(1, Math.round(elapsed / (60 * 60 * 1000)));
  return {
    blocked: true,
    hoursAgo,
    message: `Reminded ${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago — try again later`,
  };
}
