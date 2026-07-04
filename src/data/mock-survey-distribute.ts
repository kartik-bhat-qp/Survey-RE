export type DistributeChannelId = 'email' | 'community' | 'mobile-app' | 'audience';

export type EmailSidebarId = 'compose' | 'sent' | 'scheduled' | 'lists' | 'templates';

export interface DistributeChannel {
  id: DistributeChannelId;
  label: string;
  icon: string;
}

export interface EmailSidebarItem {
  id: EmailSidebarId;
  label: string;
}

export interface EmailListOption {
  value: string;
  label: string;
}

export interface EmailSenderOption {
  value: string;
  label: string;
}

export interface EmailTemplateOption {
  value: string;
  label: string;
}

export interface EmailComposeDefaults {
  subject: string;
  body: string;
  smsBody: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export const DISTRIBUTE_CHANNELS: DistributeChannel[] = [
  { id: 'email', label: 'Email', icon: 'wm-mail' },
  { id: 'community', label: 'Community', icon: 'wm-groups' },
  { id: 'mobile-app', label: 'Mobile App', icon: 'wm-smartphone' },
  { id: 'audience', label: 'Audience', icon: 'wm-group' },
];

export const EMAIL_SIDEBAR_ITEMS: EmailSidebarItem[] = [
  { id: 'compose', label: 'Compose' },
  { id: 'sent', label: 'Sent' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'lists', label: 'Lists' },
  { id: 'templates', label: 'Templates' },
];

export const MOCK_EMAIL_LISTS: EmailListOption[] = [
  { value: 'list-panel', label: 'Customer Experience Panel' },
  { value: 'list-newsletter', label: 'Monthly Newsletter Subscribers' },
  { value: 'list-beta', label: 'Product Beta Testers — West Region' },
];

export function isValidEmailAddress(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}

export type EmailToolbarAction =
  | { id: string; label: string; type: 'icon'; icon: string }
  | { id: string; label: string; type: 'text'; text: string }
  | { id: string; label: string; type: 'menu'; menuLabel: string };

export const EMAIL_COMPOSE_SURVEY_TOOLBAR_ACTIONS: EmailToolbarAction[] = [
  { id: 'survey-link', label: 'Insert Survey link', type: 'icon', icon: 'wm-link' },
  { id: 'variables', label: 'Insert variables', type: 'icon', icon: 'wm-label' },
  { id: 'languages', label: 'Languages', type: 'icon', icon: 'wm-language' },
  { id: 'email-embed', label: 'Email embed', type: 'icon', icon: 'wm-mail' },
];

export const EMAIL_COMPOSE_FORMAT_TOOLBAR_ACTIONS: EmailToolbarAction[] = [
  {
    id: 'content-padding',
    label: 'Content padding',
    type: 'icon',
    icon: 'wm-format-line-spacing',
  },
  { id: 'content-width', label: 'Content width', type: 'icon', icon: 'wm-width' },
  {
    id: 'background-colour',
    label: 'Background colour',
    type: 'icon',
    icon: 'wm-format-color-fill',
  },
  {
    id: 'content-area-color',
    label: 'Content area color',
    type: 'icon',
    icon: 'wm-format-color-text',
  },
  { id: 'bold', label: 'Bold', type: 'text', text: 'B' },
  { id: 'italic', label: 'Italic', type: 'text', text: 'I' },
  { id: 'underline', label: 'Underline', type: 'text', text: 'U' },
  { id: 'font', label: 'Font', type: 'menu', menuLabel: 'Font' },
  { id: 'size', label: 'Size', type: 'menu', menuLabel: 'Size' },
  {
    id: 'font-color',
    label: 'Font color',
    type: 'icon',
    icon: 'wm-format-color-text',
  },
  {
    id: 'font-background',
    label: 'Font background',
    type: 'icon',
    icon: 'wm-format-color-fill',
  },
  { id: 'align-left', label: 'Left align', type: 'icon', icon: 'wm-format-align-left' },
  {
    id: 'align-center',
    label: 'Centre align',
    type: 'icon',
    icon: 'wm-format-align-center',
  },
  { id: 'align-right', label: 'Right align', type: 'icon', icon: 'wm-format-align-right' },
  { id: 'justify', label: 'Justify', type: 'icon', icon: 'wm-format-align-justify' },
  {
    id: 'indent-decrease',
    label: 'Decrease indent',
    type: 'icon',
    icon: 'wm-format-indent-decrease',
  },
  {
    id: 'indent-increase',
    label: 'Increase indent',
    type: 'icon',
    icon: 'wm-format-indent-increase',
  },
  {
    id: 'bullet-list',
    label: 'Bullet list',
    type: 'icon',
    icon: 'wm-format-list-bulleted',
  },
  {
    id: 'number-list',
    label: 'Number list',
    type: 'icon',
    icon: 'wm-format-list-numbered',
  },
  { id: 'link', label: 'Link', type: 'icon', icon: 'wm-link' },
  { id: 'image', label: 'Image', type: 'icon', icon: 'wm-image' },
  { id: 'source', label: 'Source', type: 'text', text: 'Source' },
  {
    id: 'remove-formatting',
    label: 'Remove formatting',
    type: 'icon',
    icon: 'wm-format-clear',
  },
];

export const MOCK_EMAIL_SENDERS: EmailSenderOption[] = [
  {
    value: 'kartik-bhat',
    label: 'Kartik Bhat (kartik.bhat@questionpro.com)',
  },
  {
    value: 'research-team',
    label: 'Research Team (research@questionpro.com)',
  },
];

export const MOCK_REPLY_TO_OPTIONS: EmailSenderOption[] = [
  { value: 'kartik-bhat', label: 'kartik.bhat@questionpro.com' },
  { value: 'noreply', label: 'noreply@questionpro.com' },
];

export const MOCK_EMAIL_TEMPLATES: EmailTemplateOption[] = [
  { value: 'default', label: 'Default Template' },
  { value: 'formal', label: 'Formal Invitation' },
  { value: 'reminder', label: 'Friendly Reminder' },
];

export const DEFAULT_EMAIL_COMPOSE: EmailComposeDefaults = {
  subject: 'Survey Invitation',
  body:
    'Hello,\n\nWe would appreciate your feedback...\n\n<SURVEY_LINK>\n\nThank You',
  smsBody:
    'Hi, you have been invited to take part in our online survey. Please click <SURVEY_LINK> to give us your feedback. Look forward to hearing from you!',
  emailEnabled: true,
  smsEnabled: false,
};

export const MOCK_DISTRIBUTE_CREDITS = {
  available: 50.38,
};

export const SMS_SEGMENT_CHAR_LIMIT = 150;

export interface SmsSegmentUsage {
  charsInCurrentSegment: number;
  segmentCount: number;
  totalChars: number;
  segmentFillPercent: number;
}

export function getSmsSegmentUsage(text: string): SmsSegmentUsage {
  const totalChars = text.length;

  if (totalChars === 0) {
    return {
      charsInCurrentSegment: 0,
      segmentCount: 1,
      totalChars: 0,
      segmentFillPercent: 0,
    };
  }

  const segmentCount = Math.ceil(totalChars / SMS_SEGMENT_CHAR_LIMIT);
  const remainder = totalChars % SMS_SEGMENT_CHAR_LIMIT;
  const charsInCurrentSegment =
    remainder === 0 ? SMS_SEGMENT_CHAR_LIMIT : remainder;

  return {
    charsInCurrentSegment,
    segmentCount,
    totalChars,
    segmentFillPercent: (charsInCurrentSegment / SMS_SEGMENT_CHAR_LIMIT) * 100,
  };
}

export type ComposeWritingActionId =
  | 'proofread'
  | 'professional'
  | 'formal'
  | 'friendly'
  | 'shorten'
  | 'expand';

export interface ComposeWritingAction {
  id: ComposeWritingActionId;
  label: string;
  description: string;
  icon: string;
}

export const COMPOSE_WRITING_ACTIONS: ComposeWritingAction[] = [
  {
    id: 'proofread',
    label: 'Proofread',
    description: 'Fix spelling, grammar, and punctuation',
    icon: 'wm-auto-awesome',
  },
  {
    id: 'professional',
    label: 'Write professionally',
    description: 'Polish tone for a business audience',
    icon: 'wm-work',
  },
  {
    id: 'formal',
    label: 'Make formal',
    description: 'Use formal, courteous language',
    icon: 'wm-gavel',
  },
  {
    id: 'friendly',
    label: 'Make friendly',
    description: 'Warm and approachable tone',
    icon: 'wm-mood',
  },
  {
    id: 'shorten',
    label: 'Shorten',
    description: 'Keep the message concise',
    icon: 'wm-compress',
  },
  {
    id: 'expand',
    label: 'Expand',
    description: 'Add helpful detail and context',
    icon: 'wm-unfold-more',
  },
];

export const COMPOSE_WRITING_PROMPT_PLACEHOLDER = 'Describe how to change this message…';

export type ComposeWritingRequest =
  | { type: 'action'; actionId: ComposeWritingActionId }
  | { type: 'prompt'; prompt: string };

export interface ComposeWritingResult {
  body: string;
  subject?: string;
  summary: string;
}

const COMPOSE_WRITING_DELAY_MS = 1400;

function buildProofreadBody(body: string): string {
  return body
    .replace(/\.\.\./g, '.')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/Thank You$/i, 'Thank you for your time.')
    .replace(
      /We would appreciate your feedback\.\.\./i,
      'We would appreciate your feedback on your recent experience. Your input helps us improve our products and services.'
    );
}

function buildProfessionalBody(body: string): string {
  const link = body.match(/<SURVEY_LINK>/) ? '<SURVEY_LINK>' : 'the survey link below';
  return `Hello,

We are reaching out to request your feedback on a recent experience with our team. Your insights are valuable and will help us continue improving our products and services.

Please share your thoughts using ${link}.

Thank you for your participation.`;
}

function buildFormalBody(_body: string): string {
  return `Dear Participant,

We kindly invite you to complete a brief survey regarding your recent experience. Your thoughtful feedback is essential to our continuous improvement efforts.

Please access the survey using the link below:
<SURVEY_LINK>

We sincerely appreciate your time and consideration.

Kind regards,
The Research Team`;
}

function buildFriendlyBody(_body: string): string {
  return `Hi there!

We hope you are doing well. We would love to hear about your recent experience — it only takes a few minutes and really helps our team improve.

Tap here to get started:
<SURVEY_LINK>

Thanks so much for sharing your thoughts!`;
}

function buildShortenBody(_body: string): string {
  return `Hello,

Please take a moment to share your feedback:
<SURVEY_LINK>

Thank you.`;
}

function buildExpandBody(_body: string): string {
  return `Hello,

We are conducting a short survey to better understand your recent experience with our products and services. Your honest feedback helps us identify what is working well and where we can improve.

The survey should take about 5 minutes to complete. All responses are confidential and will be reviewed in aggregate.

Please click the link below to begin:
<SURVEY_LINK>

Thank you for taking the time to share your perspective.`;
}

function buildCustomPromptBody(prompt: string, currentBody: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('deadline') || lower.includes('friday') || lower.includes('by ')) {
    return `${currentBody.trim()}\n\nPlease complete the survey by Friday so we can review responses before next week's planning session.`;
  }

  if (lower.includes('confidential') || lower.includes('anonymous')) {
    return `Hello,\n\nYour responses are completely confidential and will only be reviewed in aggregate.\n\n${currentBody.trim()}`;
  }

  if (lower.includes('reminder') || lower.includes('follow up')) {
    return `Hello,\n\nThis is a friendly reminder to share your feedback when you have a moment.\n\n<SURVEY_LINK>\n\nThank you for your time.`;
  }

  if (lower.includes('subject') || lower.includes('title')) {
    return currentBody;
  }

  return `${currentBody.trim()}\n\n${prompt.trim()}`;
}

function buildCustomPromptSubject(prompt: string, currentSubject: string): string | undefined {
  const lower = prompt.toLowerCase();

  if (lower.includes('urgent')) {
    return 'Action requested: Share your feedback';
  }

  if (lower.includes('reminder')) {
    return 'Reminder: Survey invitation';
  }

  if (lower.includes('subject') && lower.includes('formal')) {
    return 'Invitation to Participate in Our Research Survey';
  }

  if (lower.includes('subject') || lower.includes('title')) {
    const match = prompt.match(/(?:subject|title)\s*(?:to|as|:)?\s*["']?([^"'\n]+)["']?/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return currentSubject;
}

export async function generateComposeWriting(
  request: ComposeWritingRequest,
  current: { body: string; subject: string }
): Promise<ComposeWritingResult> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, COMPOSE_WRITING_DELAY_MS);
  });

  if (request.type === 'action') {
    switch (request.actionId) {
      case 'proofread':
        return {
          body: buildProofreadBody(current.body),
          summary: 'Proofread complete — grammar and punctuation updated.',
        };
      case 'professional':
        return {
          body: buildProfessionalBody(current.body),
          subject: 'We value your feedback',
          summary: 'Message rewritten in a professional tone.',
        };
      case 'formal':
        return {
          body: buildFormalBody(current.body),
          subject: 'Invitation to Participate in Our Research Survey',
          summary: 'Message updated with formal language.',
        };
      case 'friendly':
        return {
          body: buildFriendlyBody(current.body),
          subject: 'We would love your feedback!',
          summary: 'Message updated with a friendly tone.',
        };
      case 'shorten':
        return {
          body: buildShortenBody(current.body),
          summary: 'Message shortened while keeping the survey link.',
        };
      case 'expand':
        return {
          body: buildExpandBody(current.body),
          summary: 'Message expanded with more context.',
        };
      default:
        return { body: current.body, summary: 'No changes applied.' };
    }
  }

  const trimmedPrompt = request.prompt.trim();
  if (!trimmedPrompt) {
    throw new Error('Enter a prompt to continue');
  }

  const subject = buildCustomPromptSubject(trimmedPrompt, current.subject);
  const body = buildCustomPromptBody(trimmedPrompt, current.body);

  return {
    body,
    subject: subject !== current.subject ? subject : undefined,
    summary: 'Message updated based on your prompt.',
  };
}

export function getSurveyDistributionUrl(surveyId: number): string {
  return `https://productteam26.questionpro.com/a/TakeSurvey?id=${surveyId}`;
}

export function getDefaultEmailSidebarItem(): EmailSidebarId {
  return 'compose';
}

export function getDefaultDistributeChannel(): DistributeChannelId {
  return 'email';
}
