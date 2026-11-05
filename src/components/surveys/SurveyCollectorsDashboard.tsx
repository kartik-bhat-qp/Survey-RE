'use client';

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CollectorOptionsPanel } from '@/components/surveys/CollectorOptionsPanel';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  COLLECTOR_CREATE_OPTIONS,
  COLLECTOR_STATUS_LABEL,
  COLLECTOR_TYPES,
  DEFAULT_MESSAGE_BODY,
  INITIAL_COLLECTOR_MESSAGES,
  INITIAL_COLLECTORS,
  MESSAGE_AUDIENCES,
  collectorEmbedCode,
  collectorOptionsStorageKey,
  collectorUrl,
  mergeCollectorOptions,
  type Collector,
  type CollectorCreateOptionId,
  type CollectorFilter,
  type CollectorMessage,
  type CollectorOptions,
  type CollectorStatus,
  type CollectorTab,
} from '@/data/mock-survey-collectors';
import {
  DEFAULT_EMAIL_COMPOSE,
  MOCK_DISTRIBUTE_CREDITS,
  MOCK_EMAIL_SENDERS,
  SMS_SEGMENT_CHAR_LIMIT,
  getSmsSegmentUsage,
} from '@/data/mock-survey-distribute';
import styles from './SurveyCollectorsDashboard.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const DEFAULT_WHATSAPP_BODY =
  'Hi! You are invited to share feedback in our survey. Tap <SURVEY_LINK> to start.';

type Screen = 'list' | 'add' | 'detail';
type MessageAudience = (typeof MESSAGE_AUDIENCES)[number]['value'];

const FILTERS: CollectorFilter[] = ['all', 'open', 'scheduled', 'closed'];

const STATUS_CLASS: Record<CollectorStatus, string> = {
  open: styles.pillOpen,
  scheduled: styles.pillScheduled,
  closed: styles.pillClosed,
};

const STATUS_ICON: Record<CollectorStatus, string> = {
  open: 'wm-play-circle',
  scheduled: 'wm-schedule',
  closed: 'wm-stop-circle',
};

type StatusMenuOption = {
  value: CollectorStatus;
  label: string;
  description: string;
};

function statusMenuOptions(current: CollectorStatus): StatusMenuOption[] {
  if (current === 'open') {
    return [
      {
        value: 'scheduled',
        label: 'Scheduled close',
        description: 'Close later on a date and time you choose.',
      },
      {
        value: 'closed',
        label: 'Closed',
        description: 'Stop accepting new responses now.',
      },
    ];
  }
  if (current === 'scheduled') {
    return [
      {
        value: 'open',
        label: 'Open now',
        description: 'Keep accepting responses and clear the schedule.',
      },
      {
        value: 'closed',
        label: 'Closed',
        description: 'Stop accepting new responses now.',
      },
    ];
  }
  return [
    {
      value: 'scheduled',
      label: 'Scheduled open',
      description: 'Open later on a date and time you choose.',
    },
    {
      value: 'open',
      label: 'Open now',
      description: 'Start accepting new responses again.',
    },
  ];
}

function defaultScheduleParts(): { date: string; time: string } {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  const date = next.toISOString().slice(0, 10);
  return { date, time: '09:00' };
}

function formatScheduleLabel(date: string, time: string): string {
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) return `${date} ${time}`;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function getScheduleTimezoneLabel(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset =
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  const city = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone;
  return `${offset} · ${city}`;
}

function countLabel(value: number): string {
  return value.toLocaleString('en-US');
}

function statusConfirmCopy(
  current: CollectorStatus,
  next: CollectorStatus
): {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'action' | 'critical';
} {
  if (next === 'closed') {
    return {
      title: 'Close collector?',
      description:
        'This collector will stop accepting new responses. Existing responses stay in Analytics.',
      confirmLabel: 'Close collector',
      variant: 'critical',
    };
  }
  if (next === 'open') {
    return {
      title: 'Open collector?',
      description: 'This collector will start accepting new responses again.',
      confirmLabel: 'Open now',
      variant: 'action',
    };
  }
  if (current === 'open') {
    return {
      title: 'Schedule close?',
      description: 'This collector will stay open, then close on the date and time you set.',
      confirmLabel: 'Schedule close',
      variant: 'action',
    };
  }
  return {
    title: 'Schedule open?',
    description: 'This collector will open on the date and time you set.',
    confirmLabel: 'Schedule open',
    variant: 'action',
  };
}

function messagingFunnel(collector: Collector): { label: string; value: string }[] {
  const bases: Record<string, number[]> = {
    c2: [18500, 18214, 9840, 4102],
    c4: [4200, 4161, 0, 1190],
    c3: [0, 0, 0, 0],
  };
  const base = bases[collector.id] ?? [0, 0, 0, 0];
  const rows = [
    { label: 'Sent', value: countLabel(base[0]) },
    { label: 'Delivered', value: countLabel(base[1]) },
  ];
  if (collector.type === 'email') {
    rows.push({ label: 'Opened', value: countLabel(base[2]) });
  }
  rows.push({ label: 'Started', value: countLabel(base[3]) });
  rows.push({ label: 'Completed', value: countLabel(collector.responses) });
  return rows;
}

function responseFunnel(collector: Collector): { label: string; value: string }[] {
  const hasResponses = collector.responses > 0;
  return [
    { label: 'Responses', value: countLabel(collector.responses) },
    { label: 'Completion rate', value: hasResponses ? '74%' : '—' },
    { label: 'Average time', value: hasResponses ? '6m 12s' : '—' },
    {
      label: 'Last response',
      value: collector.status === 'open' && hasResponses ? '12 min ago' : '—',
    },
  ];
}

export function SurveyCollectorsDashboard() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { showToast } = useWuShowToast();
  const wick = useWickUILib();
  const [collectors, setCollectors] = useState<Collector[]>(INITIAL_COLLECTORS);
  const [messages, setMessages] = useState(INITIAL_COLLECTOR_MESSAGES);
  const [options, setOptions] = usePersistedState<Record<string, CollectorOptions>>(
    collectorOptionsStorageKey(surveyId),
    {}
  );
  const [screen, setScreen] = useState<Screen>('list');
  const [filter, setFilter] = useState<CollectorFilter>('all');
  const [query, setQuery] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [tab, setTab] = useState<CollectorTab>('overview');
  const [composing, setComposing] = useState(false);
  const [composeMode, setComposeMode] = useState<'invitation' | 'reminder'>('invitation');
  const [reminderParentId, setReminderParentId] = useState<string | null>(null);
  const [composeTo, setComposeTo] = useState<MessageAudience>('all');
  const [composeSubject, setComposeSubject] = useState('Your feedback on SNAP food restrictions');
  const [composeBody, setComposeBody] = useState(DEFAULT_MESSAGE_BODY);
  const [composeSmsBody, setComposeSmsBody] = useState(DEFAULT_EMAIL_COMPOSE.smsBody);
  const [composeWhatsappBody, setComposeWhatsappBody] = useState(DEFAULT_WHATSAPP_BODY);
  const [selectedSender, setSelectedSender] = useState(
    MOCK_EMAIL_SENDERS.find((sender) => sender.value === 'kartik-bhat') ?? MOCK_EMAIL_SENDERS[0]
  );
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [nextId, setNextId] = useState(8);
  const [pendingStatus, setPendingStatus] = useState<{
    id: string;
    next: CollectorStatus;
  } | null>(null);
  const [scheduleDate, setScheduleDate] = useState(() => defaultScheduleParts().date);
  const [scheduleTime, setScheduleTime] = useState(() => defaultScheduleParts().time);

  const current = collectors.find((collector) => collector.id === currentId) ?? null;
  const currentOptions = current
    ? mergeCollectorOptions(options[current.id])
    : mergeCollectorOptions();
  const currentMessages = current ? messages[current.id] ?? [] : [];
  const hasPrimaryDeployment = currentMessages.some((item) => item.kind === 'Invitation');
  const smsSegmentUsage = useMemo(
    () => getSmsSegmentUsage(composeSmsBody),
    [composeSmsBody]
  );
  const enabledChannels = useMemo(() => {
    const channels: string[] = [];
    if (emailEnabled) channels.push('Email');
    if (smsEnabled) channels.push('SMS');
    if (whatsappEnabled) channels.push('WhatsApp');
    return channels;
  }, [emailEnabled, smsEnabled, whatsappEnabled]);

  const counts = useMemo(() => {
    const next = { all: collectors.length, open: 0, scheduled: 0, closed: 0, responses: 0 };
    for (const collector of collectors) {
      next[collector.status] += 1;
      next.responses += collector.responses;
    }
    return next;
  }, [collectors]);

  const rows = collectors.filter((collector) => {
    const matchesFilter = filter === 'all' || collector.status === filter;
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || collector.name.toLowerCase().includes(needle));
  });

  function flash(message: string): void {
    showToast({ message, variant: 'success' });
  }

  function openCollector(id: string): void {
    setCurrentId(id);
    setTab('overview');
    setComposing(false);
    setScreen('detail');
  }

  function patchCollector(id: string, patch: Partial<Collector>): void {
    setCollectors((list) =>
      list.map((collector) => (collector.id === id ? { ...collector, ...patch } : collector))
    );
  }

  function requestStatusChange(id: string, next: CollectorStatus): void {
    const collector = collectors.find((item) => item.id === id);
    if (!collector || collector.status === next) return;
    if (next === 'scheduled') {
      const defaults = defaultScheduleParts();
      setScheduleDate(defaults.date);
      setScheduleTime(defaults.time);
    }
    setPendingStatus({ id, next });
  }

  function clearPendingStatus(): void {
    setPendingStatus(null);
  }

  function applyPendingStatus(): void {
    if (!pendingStatus) return;
    const { id, next } = pendingStatus;
    const collector = collectors.find((item) => item.id === id);
    const fromOpen = collector?.status === 'open';
    if (next === 'scheduled' && (!scheduleDate.trim() || !scheduleTime.trim())) {
      showToast({ message: 'Choose a date and time.', variant: 'error' });
      return;
    }
    const when =
      next === 'scheduled' ? formatScheduleLabel(scheduleDate, scheduleTime) : '';
    const zone = next === 'scheduled' ? getScheduleTimezoneLabel() : '';
    const scheduleSummary = when ? `${when} (${zone})` : '';
    patchCollector(id, {
      status: next,
      closes:
        next === 'closed'
          ? 'Closed Oct 28'
          : next === 'scheduled'
            ? fromOpen
              ? `Closes ${scheduleSummary}`
              : `Opens ${scheduleSummary}`
            : 'No cutoff',
    });
    flash(
      next === 'closed'
        ? 'Collector closed'
        : next === 'scheduled'
          ? fromOpen
            ? `Scheduled to close ${scheduleSummary}`
            : `Scheduled to open ${scheduleSummary}`
          : 'Collector opened'
    );
    setPendingStatus(null);
  }

  function setOption(id: string, patch: Partial<CollectorOptions>): void {
    setOptions((currentOptionsMap) => ({
      ...currentOptionsMap,
      [id]: mergeCollectorOptions({ ...currentOptionsMap[id], ...patch }),
    }));
  }

  function createCollector(optionId: CollectorCreateOptionId): void {
    const option =
      COLLECTOR_CREATE_OPTIONS.find((item) => item.id === optionId) ??
      COLLECTOR_CREATE_OPTIONS[0];
    if (option.comingSoon) {
      flash(`${option.label} is coming soon`);
      return;
    }
    const id = `c${nextId}`;
    const name = `${option.label} ${nextId}`;
    const slug = Math.random().toString(36).slice(2, 9);
    const created: Collector = {
      id,
      name,
      type: option.createAs,
      status: 'open',
      responses: 0,
      created: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      closes: 'No cutoff',
      sub: 'just created',
      slug,
    };
    setCollectors((list) => [created, ...list]);
    setNextId((value) => value + 1);
    setCurrentId(id);
    setTab('overview');
    setFilter('all');
    setScreen('detail');
    flash('Collector created');
  }

  function startInvitation(): void {
    if (hasPrimaryDeployment) {
      flash('This collector already has a primary deployment. Send a reminder from it.');
      return;
    }
    setComposeMode('invitation');
    setReminderParentId(null);
    setComposeTo('all');
    setComposeSubject('Your feedback on SNAP food restrictions');
    setComposing(true);
  }

  function startReminder(parent: CollectorMessage): void {
    setComposeMode('reminder');
    setReminderParentId(parent.id);
    setComposeTo('notresp');
    setComposeSubject('Reminder: share your SNAP experience');
    setTab('messages');
    setComposing(true);
  }

  function addMessage(when: string, completed: string, channels: string[]): void {
    if (!current) return;
    const audience =
      MESSAGE_AUDIENCES.find((item) => item.value === composeTo) ?? MESSAGE_AUDIENCES[0];
    const list = messages[current.id] ?? [];
    const channelLabel = channels.join(', ');
    const isReminder = composeMode === 'reminder' && reminderParentId;
    if (!isReminder && list.some((item) => item.kind === 'Invitation')) {
      flash('This collector already has a primary deployment. Send a reminder from it.');
      setComposing(false);
      return;
    }
    const message: CollectorMessage = {
      id: `${current.id}-msg-${list.length + 1}`,
      kind: isReminder ? 'Reminder' : 'Invitation',
      parentId: isReminder ? reminderParentId : undefined,
      subject: emailEnabled ? composeSubject : `${channelLabel} message`,
      to: audience.to,
      when,
      sent: audience.sent,
      completed,
      channels: channelLabel,
    };
    setMessages((currentMessagesMap) => ({
      ...currentMessagesMap,
      [current.id]: [...list, message],
    }));
    setComposing(false);
    setComposeMode('invitation');
    setReminderParentId(null);
  }

  function requireChannels(): string[] | null {
    if (enabledChannels.length === 0) {
      flash('Turn on Email, SMS, or WhatsApp to continue');
      return null;
    }
    return enabledChannels;
  }

  async function copyText(value: string, message: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* Clipboard can be blocked; the toast still confirms the prototype action. */
    }
    flash(message);
  }

  function renderStatusMenu(collector: Collector): ReactNode {
    const menuOptions = statusMenuOptions(collector.status);
    return (
      <WuMenu
        align="start"
        side="bottom"
        sideOffset={6}
        className={styles.statusMenu}
        Trigger={
          <button
            type="button"
            className={`${styles.statusTrigger} ${STATUS_CLASS[collector.status]}`}
            aria-label={`Change status for ${collector.name}`}
          >
            <span className={STATUS_ICON[collector.status]} aria-hidden />
            {COLLECTOR_STATUS_LABEL[collector.status]}
            <span className={`wm-arrow-drop-down ${styles.statusChevron}`} aria-hidden />
          </button>
        }
      >
        {menuOptions.map((option) => (
          <WuMenuItem
            key={option.value}
            className={styles.statusMenuItem}
            onSelect={() => requestStatusChange(collector.id, option.value)}
          >
            <span className={STATUS_ICON[option.value]} aria-hidden />
            <span className={styles.statusMenuCopy}>
              <span className={styles.statusMenuTitle}>{option.label}</span>
              <span className={styles.statusMenuHint}>{option.description}</span>
            </span>
          </WuMenuItem>
        ))}
      </WuMenu>
    );
  }

  const pendingCollector = pendingStatus
    ? collectors.find((item) => item.id === pendingStatus.id) ?? null
    : null;
  const pendingConfirm =
    pendingStatus && pendingCollector
      ? statusConfirmCopy(pendingCollector.status, pendingStatus.next)
      : null;
  const statusModals = (
    <>
      {pendingConfirm && pendingStatus?.next === 'scheduled' && wick ? (
        <wick.WuModal
          open
          onOpenChange={(open) => {
            if (!open) clearPendingStatus();
          }}
          variant="action"
          size="sm"
        >
          <wick.WuModalHeader>{pendingConfirm.title}</wick.WuModalHeader>
          <wick.WuModalContent>
            <p className={styles.scheduleHint}>{pendingConfirm.description}</p>
            <div className={styles.scheduleFields}>
              <label className={styles.scheduleField}>
                <span>{pendingCollector?.status === 'open' ? 'Close on' : 'Open on'}</span>
                <input
                  className={styles.scheduleControl}
                  type="date"
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                />
              </label>
              <label className={styles.scheduleField}>
                <span>Time</span>
                <input
                  className={styles.scheduleControl}
                  type="time"
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                />
                <span className={styles.scheduleTimezone}>{getScheduleTimezoneLabel()}</span>
              </label>
            </div>
          </wick.WuModalContent>
          <wick.WuModalFooter>
            <wick.WuModalClose variant="secondary">Cancel</wick.WuModalClose>
            <wick.WuButton type="button" onClick={applyPendingStatus}>
              {pendingConfirm.confirmLabel}
            </wick.WuButton>
          </wick.WuModalFooter>
        </wick.WuModal>
      ) : null}
      {pendingConfirm && pendingStatus?.next !== 'scheduled' ? (
        <ConfirmModal
          open
          onOpenChange={(open) => {
            if (!open) clearPendingStatus();
          }}
          title={pendingConfirm.title}
          description={pendingConfirm.description}
          confirmLabel={pendingConfirm.confirmLabel}
          variant={pendingConfirm.variant}
          onConfirm={applyPendingStatus}
        />
      ) : null}
    </>
  );

  if (screen === 'add') {
    return (
      <div className={styles.root}>
        <div className={`${styles.narrow} ${styles.stack}`}>
          <button type="button" className={styles.back} onClick={() => setScreen('list')}>
            <span className="wm-arrow-back" aria-hidden />
            Back to collectors
          </button>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>How do you want to collect responses?</h1>
            <p className={styles.lede}>
              Pick a collector type. Add as many as you need; each one is tracked separately.
            </p>
          </div>
          <div className={styles.typeGrid} role="list" aria-label="Collector type">
            {COLLECTOR_CREATE_OPTIONS.map((option) => {
              const comingSoon = Boolean(option.comingSoon);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-disabled={comingSoon || undefined}
                  className={`${styles.typeCard}${
                    comingSoon ? ` ${styles.typeCardSoon}` : ''
                  }`}
                  onClick={() => createCollector(option.id)}
                >
                  <span className={styles.typeGlyph}>
                    <span className={option.icon} aria-hidden />
                  </span>
                  <span className={styles.typeLabelRow}>
                    <span className={styles.typeLabel}>{option.label}</span>
                    {comingSoon ? (
                      <span className={styles.comingSoonBadge}>Coming soon</span>
                    ) : null}
                  </span>
                  <span>{option.desc}</span>
                  <span className={styles.hint}>{option.note}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'detail' && current) {
    const type = COLLECTOR_TYPES[current.type];
    const messaging = current.type === 'email' || current.type === 'sms';
    const tabs: CollectorTab[] = messaging
      ? ['overview', 'messages', 'options']
      : current.type === 'audience'
        ? ['overview']
        : ['overview', 'options'];
    const tabLabel: Record<CollectorTab, string> = {
      overview: 'Overview',
      messages: 'Messages',
      options: 'Options',
    };
    const funnel = messaging ? messagingFunnel(current) : responseFunnel(current);
    const closed = current.status === 'closed';

    return (
      <div className={styles.root}>
        <div className={`${styles.detail} ${styles.stack}`}>
          <button
            type="button"
            className={styles.back}
            onClick={() => {
              setComposing(false);
              setScreen('list');
            }}
          >
            <span className="wm-arrow-back" aria-hidden />
            All collectors
          </button>
          <div className={styles.detailHead}>
            <div className={styles.identity}>
              <span className={closed ? styles.typeIconOff : styles.typeIcon}>
                <span className={type.icon} aria-hidden />
              </span>
              <div className={styles.stack}>
                <input
                  className={styles.nameInput}
                  aria-label="Collector name"
                  value={current.name}
                  onChange={(event) => patchCollector(current.id, { name: event.target.value })}
                />
                <div className={styles.meta}>
                  <span>{type.label}</span>
                  <span>Created {current.created}</span>
                  {renderStatusMenu(current)}
                  {current.status === 'scheduled' ? (
                    <span className={styles.scheduleMeta}>{current.closes}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.analyzeLink}
                onClick={() => flash(`Opening Analytics filtered to "${current.name}"`)}
              >
                <span className="wm-bar-chart" aria-hidden />
                <span className={styles.analyzeLinkLabel}>Analyze responses</span>
              </button>
            </div>
          </div>
          <div className={styles.tabs} role="tablist" aria-label="Collector sections">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                className={tab === item ? styles.tabSelected : styles.tab}
                onClick={() => {
                  setTab(item);
                  setComposing(false);
                }}
              >
                {tabLabel[item]}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <>
              <div className={styles.funnel}>
                {funnel.map((item) => (
                  <div key={item.label} className={styles.stat}>
                    <span className={styles.statLabel}>{item.label}</span>
                    <span className={styles.funnelValue}>{item.value}</span>
                  </div>
                ))}
              </div>
              {current.type === 'link' || current.type === 'community' ? (
                <section className={styles.section}>
                  <h2>Survey link for this collector</h2>
                  <div className={styles.actions}>
                    <input
                      className={styles.readonly}
                      readOnly
                      aria-label="Collector link"
                      value={collectorUrl(current.slug)}
                    />
                    <WuButton
                      type="button"
                      onClick={() =>
                        void copyText(collectorUrl(current.slug), 'Copied to clipboard')
                      }
                    >
                      Copy link
                    </WuButton>
                    <WuButton
                      variant="secondary"
                      type="button"
                      onClick={() =>
                        flash('Custom URLs: productteam26.questionpro.com/t/your-name')
                      }
                    >
                      Customize URL
                    </WuButton>
                  </div>
                  <span className={styles.hint}>
                    Responses through this link are tagged with this collector, so you can filter
                    them in Analytics.
                  </span>
                </section>
              ) : null}
              {current.type === 'qr' ? (
                <section className={styles.section}>
                  <div className={styles.qrRow}>
                    <div className={styles.qr} role="img" aria-label="QR code preview">
                      <span className="wm-qr-code-2" aria-hidden />
                    </div>
                    <div className={styles.stack}>
                      <h2>QR code</h2>
                      <span>
                        Print it on posters and flyers. Scans count toward this collector.
                      </span>
                      <div className={styles.actions}>
                        <WuButton
                          variant="secondary"
                          type="button"
                          onClick={() => flash('Download started')}
                        >
                          Download PNG
                        </WuButton>
                        <WuButton
                          variant="secondary"
                          type="button"
                          onClick={() => flash('Download started')}
                        >
                          Download SVG
                        </WuButton>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}
              {current.type === 'embed' ? (
                <section className={styles.section}>
                  <h2>Embed code</h2>
                  <pre className={styles.code}>{collectorEmbedCode(current.slug)}</pre>
                  <div>
                    <WuButton
                      type="button"
                      onClick={() =>
                        void copyText(collectorEmbedCode(current.slug), 'Copied to clipboard')
                      }
                    >
                      Copy code
                    </WuButton>
                  </div>
                </section>
              ) : null}
              {messaging ? (
                <section className={styles.section}>
                  <div className={styles.split}>
                    <div className={styles.stack}>
                      <h2>Invitations and reminders</h2>
                      <span>
                        {hasPrimaryDeployment
                          ? 'One primary deployment. Reminders are sent from it to people who have not finished.'
                          : 'Send one invitation, then remind people who have not finished.'}
                      </span>
                    </div>
                    {hasPrimaryDeployment ? null : (
                      <WuButton
                        type="button"
                        onClick={() => {
                          setTab('messages');
                          startInvitation();
                        }}
                      >
                        New invitation
                      </WuButton>
                    )}
                  </div>
                </section>
              ) : null}
              {current.type === 'offline' ? (
                <section className={styles.section}>
                  <div className={styles.split}>
                    <div className={styles.stack}>
                      <h2>Devices</h2>
                      <span>
                        12 devices assigned · responses sync when a device is back online.
                      </span>
                    </div>
                    <div className={styles.actions}>
                      <WuButton
                        variant="secondary"
                        type="button"
                        onClick={() => flash('Download started')}
                      >
                        Manual sync
                      </WuButton>
                      <WuButton type="button" onClick={() => flash('Download started')}>
                        Add device
                      </WuButton>
                    </div>
                  </div>
                </section>
              ) : null}
              {current.type === 'audience' ? (
                <p className={styles.info}>
                  Audience panel collectors are set up with the QuestionPro Audience team, so
                  collector options aren&apos;t available here.
                </p>
              ) : null}
            </>
          ) : null}

          {tab === 'messages' ? (
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <h2>Messages</h2>
                {composing || hasPrimaryDeployment ? null : (
                  <WuButton type="button" onClick={startInvitation}>
                    New invitation
                  </WuButton>
                )}
              </div>
              {composing ? (
                <div className={styles.compose}>
                  {composeMode === 'reminder' ? (
                    <p className={styles.reminderBanner}>
                      Reminder for{' '}
                      <strong>
                        {currentMessages.find((item) => item.id === reminderParentId)?.subject ??
                          'this invitation'}
                      </strong>
                      . It only goes to people who have not finished this invitation.
                    </p>
                  ) : (
                    <p className={styles.reminderBanner}>
                      This invitation is a primary deployment. Reminders are sent from it later.
                    </p>
                  )}
                  <div className={styles.composeGrid}>
                    <div className={styles.field}>
                      <label htmlFor="msg-to">Send to</label>
                      <select
                        id="msg-to"
                        className={styles.select}
                        value={composeTo}
                        onChange={(event) =>
                          setComposeTo(event.target.value as MessageAudience)
                        }
                      >
                        {(composeMode === 'reminder'
                          ? MESSAGE_AUDIENCES.filter((audience) => audience.value !== 'all')
                          : MESSAGE_AUDIENCES
                        ).map((audience) => (
                          <option key={audience.value} value={audience.value}>
                            {audience.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.channelSection}>
                    <div className={styles.channelHeader}>
                      <WuToggle
                        Label="Email"
                        labelPosition="left"
                        checked={emailEnabled}
                        onChange={setEmailEnabled}
                      />
                    </div>
                    {emailEnabled ? (
                      <div className={styles.channelBody}>
                        <div className={styles.fromRow}>
                          <span className={styles.fromLabel}>From:</span>
                          <WuSelect
                            data={MOCK_EMAIL_SENDERS}
                            accessorKey={{ value: 'value', label: 'label' }}
                            value={selectedSender}
                            onSelect={(item) =>
                              setSelectedSender(item as (typeof MOCK_EMAIL_SENDERS)[number])
                            }
                            variant="outlined"
                            aria-label="From"
                          />
                        </div>
                        <div className={styles.field}>
                          <label htmlFor="msg-subject">Subject</label>
                          <input
                            id="msg-subject"
                            value={composeSubject}
                            onChange={(event) => setComposeSubject(event.target.value)}
                          />
                        </div>
                        <div className={styles.field}>
                          <label htmlFor="msg-body">Message</label>
                          <textarea
                            id="msg-body"
                            className={styles.textarea}
                            rows={6}
                            value={composeBody}
                            onChange={(event) => setComposeBody(event.target.value)}
                          />
                          <span className={styles.hint}>
                            &lt;SURVEY_LINK&gt; is replaced with each recipient&apos;s personal
                            link for this collector.
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.channelSection}>
                    <div className={styles.channelHeader}>
                      <div className={styles.channelHeaderLeft}>
                        <WuToggle
                          Label="SMS"
                          labelPosition="left"
                          checked={smsEnabled}
                          onChange={setSmsEnabled}
                        />
                        <p className={styles.creditLine}>
                          Available credit: ${MOCK_DISTRIBUTE_CREDITS.available.toFixed(2)}{' '}
                          <button
                            type="button"
                            className={styles.creditLink}
                            onClick={() => flash('Opening Buy more credits')}
                          >
                            Buy more
                          </button>
                        </p>
                      </div>
                    </div>
                    {smsEnabled ? (
                      <div className={styles.channelBody}>
                        <div className={styles.field}>
                          <label htmlFor="msg-sms">SMS message</label>
                          <textarea
                            id="msg-sms"
                            className={styles.textarea}
                            rows={4}
                            value={composeSmsBody}
                            onChange={(event) => setComposeSmsBody(event.target.value)}
                          />
                          <div className={styles.smsMeta}>
                            <span className={styles.hint}>
                              &lt;SURVEY_LINK&gt; is replaced with each recipient&apos;s personal
                              link.
                            </span>
                            <span
                              className={
                                smsSegmentUsage.segmentCount > 1 ||
                                smsSegmentUsage.charsInCurrentSegment >= 140
                                  ? styles.smsCounterAlert
                                  : styles.smsCounter
                              }
                            >
                              {smsSegmentUsage.charsInCurrentSegment} / {SMS_SEGMENT_CHAR_LIMIT}
                              {smsSegmentUsage.segmentCount > 1
                                ? ` · ${smsSegmentUsage.segmentCount} SMS`
                                : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.channelSection}>
                    <div className={styles.channelHeader}>
                      <WuToggle
                        Label="WhatsApp"
                        labelPosition="left"
                        checked={whatsappEnabled}
                        onChange={setWhatsappEnabled}
                      />
                    </div>
                    {whatsappEnabled ? (
                      <div className={styles.channelBody}>
                        <div className={styles.field}>
                          <label htmlFor="msg-whatsapp">WhatsApp message</label>
                          <textarea
                            id="msg-whatsapp"
                            className={styles.textarea}
                            rows={4}
                            value={composeWhatsappBody}
                            onChange={(event) => setComposeWhatsappBody(event.target.value)}
                          />
                          <span className={styles.hint}>
                            &lt;SURVEY_LINK&gt; is replaced with each recipient&apos;s personal
                            link.
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.messageActions}>
                    <WuButton variant="secondary" type="button" onClick={() => setComposing(false)}>
                      Cancel
                    </WuButton>
                    <WuButton
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        const channels = requireChannels();
                        if (!channels) return;
                        addMessage('Scheduled · Nov 4, 9:00 AM CT', '—', channels);
                        flash(
                          `${channels.join(' + ')} scheduled for Nov 4, 9:00 AM CT`
                        );
                      }}
                    >
                      Schedule for Nov 4
                    </WuButton>
                    <WuButton
                      type="button"
                      onClick={() => {
                        const channels = requireChannels();
                        if (!channels) return;
                        const audience =
                          MESSAGE_AUDIENCES.find((item) => item.value === composeTo) ??
                          MESSAGE_AUDIENCES[0];
                        addMessage('Oct 28, 2026 · just now', '0', channels);
                        flash(
                          `${channels.join(' + ')} sent to ${audience.sent} recipients`
                        );
                      }}
                    >
                      Send now
                    </WuButton>
                  </div>
                </div>
              ) : null}
              {currentMessages.length === 0 ? (
                <div className={styles.empty}>
                  <strong>No messages yet</strong>
                  <span>Compose an invitation to start collecting responses.</span>
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Message</th>
                        <th scope="col">Channels</th>
                        <th scope="col">Sent to</th>
                        <th scope="col">When</th>
                        <th scope="col" className={styles.num}>Recipients</th>
                        <th scope="col" className={styles.num}>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMessages
                        .filter((message) => message.kind === 'Invitation')
                        .map((message) => {
                          const reminders = currentMessages.filter(
                            (item) => item.parentId === message.id
                          );
                          return (
                            <Fragment key={message.id}>
                              <tr>
                                <td>
                                  <div className={styles.stack}>
                                    <strong>{message.kind}</strong>
                                    <span className={styles.hint}>{message.subject}</span>
                                    <button
                                      type="button"
                                      className={styles.linkBtn}
                                      onClick={() => startReminder(message)}
                                    >
                                      Send reminder
                                    </button>
                                  </div>
                                </td>
                                <td>{message.channels ?? 'Email'}</td>
                                <td>{message.to}</td>
                                <td>{message.when}</td>
                                <td className={styles.num}>{message.sent}</td>
                                <td className={styles.num}>{message.completed}</td>
                              </tr>
                              {reminders.map((reminder) => (
                                <tr key={reminder.id} className={styles.reminderRow}>
                                  <td>
                                    <div className={`${styles.stack} ${styles.reminderMessage}`}>
                                      <strong>{reminder.kind}</strong>
                                      <span className={styles.hint}>{reminder.subject}</span>
                                    </div>
                                  </td>
                                  <td>{reminder.channels ?? 'Email'}</td>
                                  <td>{reminder.to}</td>
                                  <td>{reminder.when}</td>
                                  <td className={styles.num}>{reminder.sent}</td>
                                  <td className={styles.num}>{reminder.completed}</td>
                                </tr>
                              ))}
                            </Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {tab === 'options' ? (
            <CollectorOptionsPanel
              options={currentOptions}
              onChange={(patch) => setOption(current.id, patch)}
              surveyId={surveyId}
            />
          ) : null}
        </div>
        {statusModals}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={`${styles.wide} ${styles.stack}`}>
        <div className={styles.headerRow}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>Collectors</h1>
            <p className={styles.lede}>
              Each collector is one way of sending this survey, with its own link, settings and
              response tracking.
            </p>
          </div>
          <div className={styles.actions}>
            <WuButton
              variant="secondary"
              type="button"
              onClick={() => flash('Opening Analytics with a collector comparison')}
            >
              Compare in Analytics
            </WuButton>
            <WuButton type="button" onClick={() => setScreen('add')}>
              Add collector
            </WuButton>
          </div>
        </div>
        <section className={styles.stats} aria-label="Response summary">
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total responses</span>
            <span className={styles.statValue}>{countLabel(counts.responses)}</span>
            <span className={styles.hint}>Across {counts.all} collectors</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Open collectors</span>
            <span className={styles.statValue}>{counts.open}</span>
            <span className={styles.hint}>
              {counts.scheduled} scheduled · {counts.closed} closed
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Completion rate</span>
            <span className={styles.statValue}>71%</span>
            <span className={styles.hint}>Started vs. completed</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Next scheduled send</span>
            <span className={styles.statValue}>Nov 4</span>
            <span className={styles.hint}>Email · 9:00 AM CT</span>
          </div>
        </section>
        <section className={styles.panel} aria-label="Collectors">
          <div className={styles.toolbar}>
            <div className={styles.chips}>
              {FILTERS.map((item) => {
                const label = item === 'all' ? 'All' : COLLECTOR_STATUS_LABEL[item];
                const count = item === 'all' ? counts.all : counts[item];
                return (
                  <button
                    key={item}
                    type="button"
                    className={filter === item ? styles.chipSelected : styles.chip}
                    onClick={() => setFilter(item)}
                  >
                    {label} {count}
                  </button>
                );
              })}
            </div>
            <label className={styles.search}>
              <span className="wm-search" aria-hidden />
              <input
                type="search"
                placeholder="Search collectors"
                aria-label="Search collectors"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          {rows.length === 0 ? (
            <div className={styles.empty}>
              <strong>No collectors found</strong>
              <span>Try another filter or search term.</span>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Collector</th>
                    <th scope="col">Status</th>
                    <th scope="col" className={styles.num}>Responses</th>
                    <th scope="col">Created</th>
                    <th scope="col">Closes</th>
                    <th scope="col" className={styles.num}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((collector) => {
                    const type = COLLECTOR_TYPES[collector.type];
                    const closed = collector.status === 'closed';
                    return (
                      <tr key={collector.id}>
                        <td>
                          <div className={styles.identity}>
                            <span className={closed ? styles.typeIconOff : styles.typeIcon}>
                              <span className={type.icon} aria-hidden />
                            </span>
                            <div className={styles.stack}>
                              <button
                                type="button"
                                className={styles.nameBtn}
                                onClick={() => openCollector(collector.id)}
                              >
                                {collector.name}
                              </button>
                              <span className={styles.sub}>
                                {type.label} · {collector.sub}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{renderStatusMenu(collector)}</td>
                        <td className={styles.num}>{countLabel(collector.responses)}</td>
                        <td>{collector.created}</td>
                        <td>{collector.closes}</td>
                        <td className={styles.num}>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => openCollector(collector.id)}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className={styles.info}>
          All collectors feed one dataset. Filter Analytics by collector to compare channels.
        </p>
      </div>
      {statusModals}
    </div>
  );
}

