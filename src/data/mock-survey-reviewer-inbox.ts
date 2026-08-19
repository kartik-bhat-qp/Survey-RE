import { SURVEY_APPROVAL_OWNER_NAME } from '@/data/mock-survey-approval';

export interface ReviewerInboxEmail {
  id: string;
  surveyId: number;
  surveyName: string;
  requestId: string;
  recipientEmail: string;
  requesterName: string;
  ownerNotes: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  createdAt: string;
  read: boolean;
}

const INBOX_UPDATED_EVENT = 'reviewer-inbox-updated';

function inboxStorageKey(recipientEmail: string): string {
  return `reviewer-inbox-${recipientEmail.trim().toLowerCase()}`;
}

function readInboxEmails(recipientEmail: string): ReviewerInboxEmail[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(
      `survey-re:${inboxStorageKey(recipientEmail)}`
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReviewerInboxEmail[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeInboxEmails(recipientEmail: string, emails: ReviewerInboxEmail[]): void {
  if (typeof window === 'undefined') return;
  const normalized = recipientEmail.trim().toLowerCase();
  try {
    window.localStorage.setItem(
      `survey-re:${inboxStorageKey(normalized)}`,
      JSON.stringify(emails)
    );
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(INBOX_UPDATED_EVENT, {
      detail: { recipientEmail: normalized },
    })
  );
}

export function getReviewerInboxPagePath(recipientEmail: string): string {
  return `/reviewer-inbox?email=${encodeURIComponent(recipientEmail.trim().toLowerCase())}`;
}

export function openReviewerInbox(recipientEmail: string): Window | null {
  if (typeof window === 'undefined') return null;
  const normalized = recipientEmail.trim().toLowerCase();
  return window.open(getReviewerInboxPagePath(normalized), `reviewer-inbox-${normalized}`);
}

export function getReviewSurveyStartPath(surveyId: number, recipientEmail: string): string {
  return `/review/${surveyId}/start?email=${encodeURIComponent(recipientEmail.trim().toLowerCase())}`;
}

export function buildReviewRequestEmailBody(input: {
  surveyName: string;
  requesterName: string;
  ownerNotes: string;
}): string {
  const intro = `${input.requesterName} sent you a survey to review before it can be published.`;
  const notes = input.ownerNotes.trim()
    ? `\n\nNotes from the survey owner:\n${input.ownerNotes.trim()}`
    : '';
  return `${intro}\n\nSurvey: ${input.surveyName}${notes}\n\nPlease review the full survey and approve or reject it with your comments.`;
}

export function deliverReviewRequestEmail(input: {
  surveyId: number;
  surveyName: string;
  requestId: string;
  recipientEmail: string;
  requesterName?: string;
  ownerNotes?: string;
}): ReviewerInboxEmail {
  const recipient = input.recipientEmail.trim().toLowerCase();
  const requesterName = input.requesterName ?? SURVEY_APPROVAL_OWNER_NAME;
  const ownerNotes = input.ownerNotes ?? '';
  const body = buildReviewRequestEmailBody({
    surveyName: input.surveyName,
    requesterName,
    ownerNotes,
  });
  const preview = `${requesterName} asked you to review "${input.surveyName}" before it can be published.`;

  const email: ReviewerInboxEmail = {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    surveyId: input.surveyId,
    surveyName: input.surveyName,
    requestId: input.requestId,
    recipientEmail: recipient,
    requesterName,
    ownerNotes,
    senderName: 'QuestionPro',
    senderEmail: 'notifications@questionpro.com',
    subject: `Review requested: ${input.surveyName}`,
    preview,
    body,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const existing = readInboxEmails(recipient);
  writeInboxEmails(recipient, [email, ...existing]);
  return email;
}

export function listReviewerInboxEmails(recipientEmail: string): ReviewerInboxEmail[] {
  return readInboxEmails(recipientEmail).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function markReviewerEmailRead(
  recipientEmail: string,
  emailId: string
): ReviewerInboxEmail | undefined {
  const emails = readInboxEmails(recipientEmail);
  let updated: ReviewerInboxEmail | undefined;
  const next = emails.map((item) => {
    if (item.id !== emailId) return item;
    updated = { ...item, read: true };
    return updated;
  });
  if (updated) writeInboxEmails(recipientEmail, next);
  return updated;
}

export function subscribeReviewerInbox(
  recipientEmail: string,
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const normalized = recipientEmail.trim().toLowerCase();
  const handler = (event: Event): void => {
    const custom = event as CustomEvent<{ recipientEmail: string }>;
    if (custom.detail?.recipientEmail !== normalized) return;
    listener();
  };

  const storageHandler = (event: StorageEvent): void => {
    if (event.key !== `survey-re:${inboxStorageKey(normalized)}`) return;
    listener();
  };

  window.addEventListener(INBOX_UPDATED_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(INBOX_UPDATED_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}
