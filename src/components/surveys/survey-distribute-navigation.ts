import {
  DISTRIBUTE_CHANNELS,
  EMAIL_SIDEBAR_ITEMS,
  getDefaultDistributeChannel,
  getDefaultEmailSidebarItem,
  type DistributeChannelId,
  type EmailSidebarId,
} from '@/data/mock-survey-distribute';

const DISTRIBUTE_CHANNEL_IDS = new Set<DistributeChannelId>(
  DISTRIBUTE_CHANNELS.map((channel) => channel.id)
);

const EMAIL_SIDEBAR_IDS = new Set<EmailSidebarId>(
  EMAIL_SIDEBAR_ITEMS.map((item) => item.id)
);

export interface DistributeRouteState {
  channel: DistributeChannelId;
  emailSidebar: EmailSidebarId;
}

export function isDistributeChannelId(value: string): value is DistributeChannelId {
  return DISTRIBUTE_CHANNEL_IDS.has(value as DistributeChannelId);
}

export function isEmailSidebarId(value: string): value is EmailSidebarId {
  return EMAIL_SIDEBAR_IDS.has(value as EmailSidebarId);
}

function parseEmailSidebarSegment(segment: string | undefined): EmailSidebarId {
  if (segment && isEmailSidebarId(segment)) {
    return segment;
  }
  return getDefaultEmailSidebarItem();
}

export function getDefaultDistributeRouteState(): DistributeRouteState {
  return {
    channel: getDefaultDistributeChannel(),
    emailSidebar: getDefaultEmailSidebarItem(),
  };
}

export function getDistributeBasePath(surveyId: number): string {
  return `/surveys/${surveyId}/distribute`;
}

export function getDistributeChannelPath(
  surveyId: number,
  channel: DistributeChannelId,
  emailSidebar: EmailSidebarId = getDefaultEmailSidebarItem()
): string {
  const base = getDistributeBasePath(surveyId);

  if (channel === 'email') {
    return `${base}/email/${emailSidebar}`;
  }

  return `${base}/${channel}`;
}

export function parseDistributeRouteFromPathname(
  pathname: string,
  surveyId: number
): DistributeRouteState | null {
  const base = getDistributeBasePath(surveyId);
  if (pathname !== base && !pathname.startsWith(`${base}/`)) {
    return null;
  }

  const remainder = pathname.slice(base.length).replace(/^\//, '');
  if (!remainder) {
    return getDefaultDistributeRouteState();
  }

  const [channelSegment, emailSidebarSegment] = remainder.split('/');
  if (!isDistributeChannelId(channelSegment)) {
    return null;
  }

  if (channelSegment === 'email') {
    if (emailSidebarSegment && !isEmailSidebarId(emailSidebarSegment)) {
      return null;
    }

    const emailSidebar = parseEmailSidebarSegment(emailSidebarSegment);

    return {
      channel: 'email',
      emailSidebar,
    };
  }

  if (emailSidebarSegment) {
    return null;
  }

  return {
    channel: channelSegment,
    emailSidebar: getDefaultEmailSidebarItem(),
  };
}

export function getCanonicalDistributePath(
  surveyId: number,
  state: DistributeRouteState
): string {
  return getDistributeChannelPath(surveyId, state.channel, state.emailSidebar);
}
