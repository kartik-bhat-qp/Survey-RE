export const SURVEY_AI_EXAMPLE_PROMPTS = [
  {
    id: 'add-nps',
    text: 'Add questions based on your goal',
  },
  {
    id: 'improve-wording',
    text: 'Improve the wording of the demographic questions',
  },
  {
    id: 'add-logic',
    text: 'Add skip logic to hide the cola brand question for non-drinkers',
  },
] as const;

export interface SurveyAiCapabilityPill {
  id: string;
  label: string;
  icon?: string;
  prompt?: string;
}

export const SURVEY_AI_CAPABILITY_PILLS: SurveyAiCapabilityPill[] = [
  { id: 'import-word', label: 'Create from doc', icon: 'wm-description' },
  { id: 'import-pdf', label: 'Create from pdf', icon: 'wm-picture-as-pdf' },
  { id: 'add-question-types', label: 'Add different types of questions' },
  { id: 'compound-logic', label: 'Set up advanced logic' },
];

export const SURVEY_AI_GREETING =
  "Hi! I'm your research agent. I can help you build, edit, and improve this survey. Try asking me to:";

export const DISTRIBUTE_EMAIL_AI_GREETING =
  "Hi! I'm your research agent. I can help you craft and improve your survey invitations. Try asking me to:";

export const DISTRIBUTE_EMAIL_AI_EXAMPLE_PROMPTS = [
  {
    id: 'warmer-tone',
    text: 'Make the invitation tone warmer and more personal',
  },
  {
    id: 'shorter-body',
    text: 'Shorten the email body while keeping the key ask',
  },
  {
    id: 'subject-line',
    text: 'Suggest a stronger subject line for better open rates',
  },
] as const;

export const DISTRIBUTE_EMAIL_AI_CAPABILITY_PILLS: SurveyAiCapabilityPill[] = [
  {
    id: 'survey_send_recipients',
    label: 'Recipients',
    icon: 'wm-person-add',
    prompt:
      'Add email addresses, create an email list, or list email lists available for this survey',
  },
  {
    id: 'survey_send_compose_email',
    label: 'Compose email',
    icon: 'wm-edit',
    prompt: 'Compose or preview the current survey invitation email',
  },
  {
    id: 'survey_send_select_from_replyto',
    label: 'From and reply-to',
    icon: 'wm-reply',
    prompt: 'Help me choose the from and reply-to addresses',
  },
  {
    id: 'survey_send_send_email',
    label: 'Send email',
    icon: 'wm-send',
    prompt: 'Send this survey invitation email now',
  },
  {
    id: 'survey_send_scheduled_emails',
    label: 'Scheduled emails',
    icon: 'wm-schedule',
    prompt:
      'Show scheduled emails, schedule this invitation, preview the scheduled send, or send it now',
  },
  {
    id: 'survey_send_reminders',
    label: 'Reminders',
    icon: 'wm-notifications',
    prompt: 'Schedule or send a reminder email for non-responders',
  },
  {
    id: 'survey_send_list_distribution_history',
    label: 'Distribution history',
    icon: 'wm-history',
    prompt: 'Show distribution history for this survey',
  },
];

export const SURVEY_AI_THINKING_STEPS = [
  'Reviewing your survey…',
  'Understanding your request…',
  'Drafting changes…',
  'Applying updates…',
] as const;

export type ResearchAgentContext = 'workspace' | 'distribute-email';

export interface ResearchAgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ResearchAgentChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: ResearchAgentChatMessage[];
}

const MOCK_WORKSPACE_RESEARCH_AGENT_HISTORY: ResearchAgentChatSession[] = [
  {
    id: 'workspace-session-1',
    title: 'Add an NPS question about customer satisfaction',
    preview: 'Add an NPS question about customer satisfaction to the first block',
    updatedAt: '2026-07-04T10:15:00.000Z',
    messages: [
      {
        id: 'workspace-session-1-user-1',
        role: 'user',
        content: 'Add an NPS question about customer satisfaction to the first block',
        createdAt: '2026-07-04T10:14:30.000Z',
      },
      {
        id: 'workspace-session-1-assistant-1',
        role: 'assistant',
        content: 'Added an NPS question at the end of Block 1.',
        createdAt: '2026-07-04T10:15:00.000Z',
      },
    ],
  },
  {
    id: 'workspace-session-2',
    title: 'Improve demographic question wording',
    preview: 'Improve the wording of the demographic questions',
    updatedAt: '2026-06-28T16:40:00.000Z',
    messages: [
      {
        id: 'workspace-session-2-user-1',
        role: 'user',
        content: 'Improve the wording of the demographic questions',
        createdAt: '2026-06-28T16:39:20.000Z',
      },
      {
        id: 'workspace-session-2-assistant-1',
        role: 'assistant',
        content: 'Suggested clearer wording for your demographic questions.',
        createdAt: '2026-06-28T16:40:00.000Z',
      },
    ],
  },
];

const MOCK_DISTRIBUTE_RESEARCH_AGENT_HISTORY: ResearchAgentChatSession[] = [
  {
    id: 'distribute-session-1',
    title: 'Compose survey invitation email',
    preview: 'Compose a survey invitation email',
    updatedAt: '2026-07-05T09:20:00.000Z',
    messages: [
      {
        id: 'distribute-session-1-user-1',
        role: 'user',
        content: 'Compose a survey invitation email',
        createdAt: '2026-07-05T09:19:30.000Z',
      },
      {
        id: 'distribute-session-1-assistant-1',
        role: 'assistant',
        content: 'Composed a survey invitation email.',
        createdAt: '2026-07-05T09:20:00.000Z',
      },
    ],
  },
  {
    id: 'distribute-session-2',
    title: 'Schedule reminder for non-responders',
    preview: 'Schedule a reminder email for non-responders',
    updatedAt: '2026-07-02T14:05:00.000Z',
    messages: [
      {
        id: 'distribute-session-2-user-1',
        role: 'user',
        content: 'Schedule a reminder email for non-responders',
        createdAt: '2026-07-02T14:04:20.000Z',
      },
      {
        id: 'distribute-session-2-assistant-1',
        role: 'assistant',
        content: 'Scheduled a reminder for non-responders 3 days after the initial send.',
        createdAt: '2026-07-02T14:05:00.000Z',
      },
    ],
  },
];

export function getResearchAgentHistorySeed(
  context: ResearchAgentContext
): ResearchAgentChatSession[] {
  return context === 'workspace'
    ? MOCK_WORKSPACE_RESEARCH_AGENT_HISTORY.map((session) => ({
        ...session,
        messages: session.messages.map((message) => ({ ...message })),
      }))
    : MOCK_DISTRIBUTE_RESEARCH_AGENT_HISTORY.map((session) => ({
        ...session,
        messages: session.messages.map((message) => ({ ...message })),
      }));
}

export function createResearchAgentSessionId(): string {
  return `agent-session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createResearchAgentMessageId(): string {
  return `agent-message-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type ResearchAgentAttachmentKind = 'file' | 'image';

export interface ResearchAgentAttachment {
  id: string;
  kind: ResearchAgentAttachmentKind;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

export const RESEARCH_AGENT_FILE_ACCEPT =
  '.pdf,.doc,.docx,.ppt,.pptx,.pps,.ppsx,.xls,.xlsx,.txt,.rtf,.png,.jpg,.jpeg,.gif,.webp,.bmp,image/*';

const RESEARCH_AGENT_ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'pps',
  'ppsx',
  'xls',
  'xlsx',
  'txt',
  'rtf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
]);

const MAX_RESEARCH_AGENT_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export function formatResearchAgentAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isResearchAgentImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function validateResearchAgentAttachment(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!isResearchAgentImageFile(file) && !RESEARCH_AGENT_ALLOWED_EXTENSIONS.has(extension)) {
    return 'Upload a document or image file.';
  }
  if (file.size > MAX_RESEARCH_AGENT_ATTACHMENT_BYTES) {
    return 'Each file must be 25 MB or smaller.';
  }
  return null;
}

export function createResearchAgentAttachmentId(): string {
  return `agent-attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createResearchAgentFileAttachment(file: File): ResearchAgentAttachment {
  const isImage = isResearchAgentImageFile(file);
  return {
    id: createResearchAgentAttachmentId(),
    kind: isImage ? 'image' : 'file',
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
  };
}

export function createResearchAgentPastedImageAttachment(
  file: File,
  existingImageCount: number
): ResearchAgentAttachment {
  const extension = file.type.split('/')[1] || 'png';
  return {
    id: createResearchAgentAttachmentId(),
    kind: 'image',
    name: `pasted-image-${existingImageCount + 1}.${extension}`,
    size: file.size,
    type: file.type || 'image/png',
    previewUrl: URL.createObjectURL(file),
  };
}

export function revokeResearchAgentAttachmentPreview(
  attachment: ResearchAgentAttachment
): void {
  if (attachment.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

export function buildResearchAgentUserContent(
  prompt: string,
  attachments: ResearchAgentAttachment[]
): string {
  const trimmedPrompt = prompt.trim();
  if (attachments.length === 0) {
    return trimmedPrompt;
  }

  const attachmentLabel = attachments.map((attachment) => attachment.name).join(', ');
  const attachmentLine = `[Attached: ${attachmentLabel}]`;

  if (!trimmedPrompt) {
    return attachmentLine;
  }

  return `${trimmedPrompt}\n\n${attachmentLine}`;
}

const SURVEY_AI_GENERATION_DELAY_MS = 2200;

/** Prototype context window for the research agent sidebar. */
export const RESEARCH_AGENT_CONTEXT_MAX_TOKENS = 200_000;

/** Baseline survey workspace context loaded into the agent. */
export const RESEARCH_AGENT_BASE_CONTEXT_TOKENS = 18_400;

/** Baseline email compose context loaded into the agent. */
export const RESEARCH_AGENT_DISTRIBUTE_BASE_CONTEXT_TOKENS = 6_200;

export function estimateResearchAgentContextUsage(
  prompt: string,
  baseTokens = RESEARCH_AGENT_BASE_CONTEXT_TOKENS,
  attachmentCount = 0
): number {
  const promptTokens = Math.ceil(prompt.trim().length / 4);
  const attachmentTokens = attachmentCount * 500;
  return baseTokens + promptTokens + attachmentTokens;
}

export interface SurveyAiGenerationResult {
  summary: string;
  subject?: string;
  body?: string;
  smsBody?: string;
}

export async function generateSurveyChangesFromAiPrompt(
  prompt: string,
  _surveyId: number
): Promise<SurveyAiGenerationResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Enter a prompt to continue');
  }

  await new Promise((resolve) => {
    window.setTimeout(resolve, SURVEY_AI_GENERATION_DELAY_MS);
  });

  const lower = trimmed.toLowerCase();
  if (lower.includes('[attached:')) {
    return {
      summary: 'Reviewed your attached file and applied updates to this survey.',
    };
  }
  if (lower.includes('word') || lower.includes('import from word')) {
    return { summary: 'Imported survey questions from your Word document into Block 1.' };
  }
  if (lower.includes('pdf')) {
    return { summary: 'Imported survey questions from your PDF into Block 1.' };
  }
  if (lower.includes('nps')) {
    return { summary: 'Added an NPS question at the end of Block 1.' };
  }
  if (lower.includes('logic') || lower.includes('skip')) {
    return { summary: 'Drafted skip logic for your survey — review it in the Logic panel.' };
  }
  if (lower.includes('wording') || lower.includes('improve')) {
    return { summary: 'Suggested clearer wording for your demographic questions.' };
  }

  return {
    summary: 'Your research agent request has been applied to this prototype workspace.',
  };
}

export async function generateDistributeEmailFromAiPrompt(
  prompt: string,
  currentSubject: string,
  currentBody: string
): Promise<SurveyAiGenerationResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Enter a prompt to continue');
  }

  await new Promise((resolve) => {
    window.setTimeout(resolve, SURVEY_AI_GENERATION_DELAY_MS);
  });

  const lower = trimmed.toLowerCase();

  if (lower.includes('[attached:')) {
    return {
      summary: 'Reviewed your attached file and updated the invitation in this prototype.',
    };
  }

  if (lower.includes('add email') || lower.includes('email address')) {
    return {
      summary: 'Added sample email addresses to the To field — review before sending.',
    };
  }

  if (
    lower.includes('recipients') ||
    (lower.includes('create') && lower.includes('list') && lower.includes('email lists'))
  ) {
    return {
      summary:
        'Recipients updated — added sample addresses and listed available lists: All customers (2,410), Beta testers (186).',
    };
  }

  if (lower.includes('compose')) {
    return {
      summary: 'Composed a survey invitation email.',
      subject: currentSubject || 'We would love your feedback',
      body: 'Hello,\n\nWe are collecting feedback and would appreciate a few minutes of your time.\n\n<SURVEY_LINK>\n\nThank you for helping us improve.',
    };
  }

  if (lower.includes('create') && lower.includes('list')) {
    return {
      summary: 'Created a new email list — select it from the To field when ready.',
    };
  }

  if (lower.includes('distribution history') || lower.includes('sent invitation')) {
    return {
      summary:
        'Found 3 recent distributions: Product feedback (Jan 12), Beta testers (Jan 8), Customer pulse (Dec 28).',
    };
  }

  if (lower.includes('list email lists') || lower.includes('email lists available')) {
    return {
      summary: 'Available lists: All customers (2,410), Beta testers (186), Recent purchasers (94).',
    };
  }

  if (lower.includes('scheduled emails') || lower.includes('show scheduled')) {
    return {
      summary:
        'Scheduled emails: 1 invitation on Jan 15 at 9:00 AM. You can schedule, preview, or send it now.',
    };
  }

  if (
    lower.includes('preview the current') ||
    (lower.includes('preview') && lower.includes('invitation'))
  ) {
    return {
      summary: 'Opened a preview of your current invitation email.',
    };
  }

  if (lower.includes('schedule') && lower.includes('reminder')) {
    return {
      summary: 'Reminder scheduled for non-responders 3 days after the initial send.',
      subject: 'Reminder: share your feedback when you have a moment',
      body: `Hello,\n\nWe noticed you have not had a chance to complete our survey yet. Your input helps us improve.\n\n<SURVEY_LINK>\n\nThank you for your time.`,
    };
  }

  if (lower.includes('send reminder') || (lower.includes('reminder') && lower.includes('non-respond'))) {
    return {
      summary: 'Sent a reminder to 142 non-responders.',
      subject: 'Reminder: share your feedback when you have a moment',
      body: `Hello,\n\nWe noticed you have not had a chance to complete our survey yet. Your input helps us improve.\n\n<SURVEY_LINK>\n\nThank you for your time.`,
    };
  }

  if (lower.includes('schedule') && lower.includes('email')) {
    return {
      summary: 'Scheduled this invitation for tomorrow at 9:00 AM.',
    };
  }

  if (lower.includes('preview') && lower.includes('scheduled')) {
    return {
      summary: 'Preview ready for your scheduled send — review subject and body before confirming.',
    };
  }

  if (lower.includes('send the scheduled') || lower.includes('scheduled email immediately')) {
    return {
      summary: 'Sent the scheduled invitation immediately.',
    };
  }

  if (lower.includes('from') && lower.includes('reply')) {
    return {
      summary: 'Updated sender to Kartik Bhat and reply-to to kartik.bhat@questionpro.com.',
    };
  }

  if (lower.includes('send') && lower.includes('invitation')) {
    return {
      summary: 'Sent the survey invitation to your selected recipients.',
    };
  }

  if (lower.includes('subject') || lower.includes('open rate')) {
    return {
      summary: 'Updated the invitation subject line.',
      subject: 'Your feedback matters — quick survey inside',
    };
  }

  if (lower.includes('sms')) {
    return {
      summary: 'Drafted an SMS version of your invitation.',
      smsBody:
        'Hi! We would love your feedback. Please take our short survey: <SURVEY_LINK> Thank you!',
    };
  }

  if (lower.includes('follow-up') || lower.includes('reminder')) {
    return {
      summary: 'Drafted a follow-up reminder email.',
      subject: 'Reminder: share your feedback when you have a moment',
      body: `Hello,\n\nWe noticed you have not had a chance to complete our survey yet. Your input helps us improve.\n\n<SURVEY_LINK>\n\nThank you for your time.`,
    };
  }

  if (lower.includes('deadline')) {
    return {
      summary: 'Added a response deadline to your invitation.',
      body: `${currentBody.trim()}\n\nPlease respond by Friday so we can include your feedback in this week's review.`,
    };
  }

  if (lower.includes('shorten') || lower.includes('shorter')) {
    return {
      summary: 'Shortened your invitation while keeping the key ask.',
      body: 'Hello,\n\nWe would appreciate your feedback on our survey.\n\n<SURVEY_LINK>\n\nThank you!',
    };
  }

  if (lower.includes('formal')) {
    return {
      summary: 'Adjusted the invitation to a more formal tone.',
      subject: currentSubject || 'Invitation to participate in our research survey',
      body: 'Dear participant,\n\nWe respectfully invite you to share your perspectives by completing the survey linked below.\n\n<SURVEY_LINK>\n\nThank you for your consideration.',
    };
  }

  if (lower.includes('casual') || lower.includes('warmer') || lower.includes('personal')) {
    return {
      summary: 'Made the invitation warmer and more personal.',
      subject: currentSubject || 'Got a minute? We would love your take',
      body: 'Hi there,\n\nWe are gathering feedback and would really value your perspective. It only takes a few minutes.\n\n<SURVEY_LINK>\n\nThanks so much!',
    };
  }

  if (lower.includes('translate')) {
    return {
      summary: 'Translated your invitation — review the updated copy before sending.',
      body: `${currentBody.trim()}\n\n[Prototype: translated copy would appear here.]`,
    };
  }

  return {
    summary: 'Updated your survey invitation based on your request.',
    body: currentBody.trim()
      ? `${currentBody.trim()}\n\n[Updated per your request in this prototype.]`
      : 'Hello,\n\nWe would appreciate your feedback.\n\n<SURVEY_LINK>\n\nThank you!',
  };
}
