'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { CommunityIncentivesStep } from '@/components/communities/CommunityIncentivesStep';
import { CommunityInvitationHistory } from '@/components/communities/CommunityInvitationHistory';
import type { CommunityListItem } from '@/data/mock-communities';
import {
  COMMUNITY_DEFAULT_VERIFIED_RECIPIENTS,
  COMMUNITY_EMAIL_FILTERS,
  COMMUNITY_EMAIL_TEMPLATES,
  COMMUNITY_EXISTING_FILTERS,
  COMMUNITY_FILTER_FIELDS,
  COMMUNITY_POINTS_TAGS,
  COMMUNITY_RECIPIENT_FILTER_TABS,
  COMMUNITY_REPLACEMENT_VARIABLES,
  COMMUNITY_SAMPLE_RECIPIENTS,
  COMMUNITY_SEND_STEPS,
  COMMUNITY_SEND_TOOLS,
  COMMUNITY_TEMPLATE_LANGUAGES,
  DEFAULT_COMMUNITY_EMAIL_BODY,
  DEFAULT_COMMUNITY_SMS_BODY,
  REMINDER_DEFAULT_POINTS,
  REMINDER_DEFAULT_RULES,
  REMINDER_EMAIL_BODY,
  REMINDER_SMS_BODY,
  type CommunityIncentivePoints,
  type CommunityIncentiveRule,
  type CommunityRecipientFilterTab,
  type CommunitySendOption,
  type CommunitySendStepId,
  type CommunitySendToolId,
} from '@/data/mock-community-send';
import { MOCK_SURVEYS, type Survey } from '@/data/mock-surveys';
import styles from './CommunitySend.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

type MessageTab = 'email' | 'sms';

export interface ReminderTarget {
  id: string;
  surveyName: string;
  initialSent: number;
  successCount: number;
  completed: number;
}

interface SavedReminderIncentives {
  points: CommunityIncentivePoints;
  rules: CommunityIncentiveRule[];
}

function cloneRules(rules: CommunityIncentiveRule[]): CommunityIncentiveRule[] {
  return rules.map((rule) => ({
    ...rule,
    points: { ...rule.points },
    conditions: rule.conditions.map((condition) => ({ ...condition })),
  }));
}

function surveyForReminder(name: string, completed: number): Survey {
  const match = MOCK_SURVEYS.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (match) return match;
  return {
    id: 0,
    name,
    folderId: 'all',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    status: 'Active - Published',
    responses: completed,
  };
}

interface CommunitySendProps {
  community: CommunityListItem;
  portal: ReactNode;
}

export function CommunitySend({ community, portal }: CommunitySendProps) {
  const { showToast } = useWuShowToast();
  const [tool, setTool] = useState<CommunitySendToolId>('send');
  const [step, setStep] = useState<CommunitySendStepId>('compose');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [step, tool]);

  const [surveyQuery, setSurveyQuery] = useState('');
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [surveyMenuOpen, setSurveyMenuOpen] = useState(false);
  const [alias, setAlias] = useState('');
  const [surveyLength, setSurveyLength] = useState('8');
  const [template, setTemplate] = useState(COMMUNITY_EMAIL_TEMPLATES[0]);
  const [language, setLanguage] = useState(COMMUNITY_TEMPLATE_LANGUAGES[0]);
  const [subject, setSubject] = useState('Survey invitation');
  const [messageTab, setMessageTab] = useState<MessageTab>('email');
  const [emailBody, setEmailBody] = useState(DEFAULT_COMMUNITY_EMAIL_BODY);
  const [smsBody, setSmsBody] = useState(DEFAULT_COMMUNITY_SMS_BODY);
  const [incentives, setIncentives] = useState<CommunityIncentivePoints>({
    complete: '0',
    quota: '0',
    terminate: '0',
  });
  const [incentiveRules, setIncentiveRules] = useState<CommunityIncentiveRule[]>([]);
  const [reminder, setReminder] = useState<ReminderTarget | null>(null);
  const [savedIncentives, setSavedIncentives] = useState<
    Record<string, SavedReminderIncentives>
  >({});
  const [multipleResponses, setMultipleResponses] = useState(false);
  const [recipientTab, setRecipientTab] = useState<CommunityRecipientFilterTab>('custom');
  const [filterField, setFilterField] = useState<CommunitySendOption>(COMMUNITY_FILTER_FIELDS[0]);
  const [existingFilterId, setExistingFilterId] = useState(COMMUNITY_EXISTING_FILTERS[0].id);
  const [emailFilter, setEmailFilter] = useState(COMMUNITY_EMAIL_FILTERS[0]);
  const [viewRecipientsOpen, setViewRecipientsOpen] = useState(false);
  const [tagsMenuOpen, setTagsMenuOpen] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const tagsMenuRef = useRef<HTMLDivElement>(null);
  const usedPointsTags = COMMUNITY_POINTS_TAGS.filter(
    ({ tag }) => emailBody.includes(tag) || smsBody.includes(tag)
  );

  useEffect(() => {
    if (!tagsMenuOpen) return;
    function handlePointerDown(event: MouseEvent): void {
      if (!tagsMenuRef.current?.contains(event.target as Node)) {
        setTagsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [tagsMenuOpen]);

  const surveyMatches = useMemo(() => {
    const query = surveyQuery.trim().toLowerCase();
    if (!query) return MOCK_SURVEYS.slice(0, 8);
    return MOCK_SURVEYS.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 8);
  }, [surveyQuery]);

  const existingFilter =
    COMMUNITY_EXISTING_FILTERS.find((item) => item.id === existingFilterId) ??
    COMMUNITY_EXISTING_FILTERS[0];
  const reminderNotCompleted = reminder
    ? Math.max(reminder.successCount - reminder.completed, 0) ||
      Math.max(reminder.initialSent, 1)
    : null;
  const verifiedRecipients =
    reminderNotCompleted != null
      ? filterField.value
        ? Math.max(1, Math.round(reminderNotCompleted * 0.65))
        : reminderNotCompleted
      : recipientTab === 'existing'
        ? existingFilter.recipients
        : recipientTab === 'email'
          ? emailFilter.value === 'all-valid'
            ? 1284
            : emailFilter.value === 'opened-last'
              ? 412
              : emailFilter.value === 'clicked-last'
                ? 186
                : emailFilter.value === 'never-opened'
                  ? 640
                  : 1198
          : filterField.value
            ? Math.max(12, COMMUNITY_DEFAULT_VERIFIED_RECIPIENTS + filterField.value.length * 7)
            : COMMUNITY_DEFAULT_VERIFIED_RECIPIENTS;
  const recipientSummaryLabel = reminder
    ? filterField.value
      ? `Original deployment · Not completed · ${filterField.label}`
      : 'Original deployment · Not completed'
    : recipientTab === 'existing'
      ? existingFilter.label
      : recipientTab === 'email'
        ? emailFilter.label
        : filterField.value
          ? `Custom · ${filterField.label}`
          : 'Custom filter';
  const stepIndex = COMMUNITY_SEND_STEPS.findIndex((item) => item.id === step);
  const canContinue = survey !== null && subject.trim().length > 0;

  function selectSurvey(item: Survey): void {
    setSurvey(item);
    setSurveyQuery(item.name);
    setAlias((current) => current || item.name);
    setSurveyMenuOpen(false);
  }

  function handleNext(): void {
    if (step === 'compose' && !survey) {
      showToast({ message: 'Select a survey to continue', variant: 'error' });
      return;
    }
    const next = COMMUNITY_SEND_STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  }

  function handleBack(): void {
    const previous = COMMUNITY_SEND_STEPS[stepIndex - 1];
    if (previous) setStep(previous.id);
  }

  function resetSendDraft(): void {
    setStep('compose');
    setSurvey(null);
    setSurveyQuery('');
    setAlias('');
    setSubject('Survey invitation');
    setTemplate(COMMUNITY_EMAIL_TEMPLATES[0]);
    setEmailBody(DEFAULT_COMMUNITY_EMAIL_BODY);
    setSmsBody(DEFAULT_COMMUNITY_SMS_BODY);
    setIncentives({ complete: '0', quota: '0', terminate: '0' });
    setIncentiveRules([]);
    setRecipientTab('custom');
    setFilterField(COMMUNITY_FILTER_FIELDS[0]);
    setEditorVersion((version) => version + 1);
  }

  function beginReminder(target: ReminderTarget): void {
    const saved = savedIncentives[target.id];
    const item = surveyForReminder(target.surveyName, target.completed);
    setReminder(target);
    setSurvey(item);
    setSurveyQuery(item.name);
    setAlias(item.name);
    setSubject(`Reminder: ${item.name}`);
    setTemplate(
      COMMUNITY_EMAIL_TEMPLATES.find((option) => option.value === 'reminder') ??
        COMMUNITY_EMAIL_TEMPLATES[0]
    );
    setEmailBody(REMINDER_EMAIL_BODY);
    setSmsBody(REMINDER_SMS_BODY);
    setIncentives(saved ? { ...saved.points } : { ...REMINDER_DEFAULT_POINTS });
    setIncentiveRules(cloneRules(saved?.rules ?? REMINDER_DEFAULT_RULES));
    setRecipientTab('custom');
    setFilterField(COMMUNITY_FILTER_FIELDS[0]);
    setMultipleResponses(false);
    setEditorVersion((version) => version + 1);
    setStep('compose');
    setTool('send');
  }

  function exitReminder(): void {
    setReminder(null);
    resetSendDraft();
    setTool('history');
  }

  function handleSend(): void {
    if (reminder && survey) {
      setSavedIncentives((current) => ({
        ...current,
        [reminder.id]: {
          points: { ...incentives },
          rules: cloneRules(incentiveRules),
        },
      }));
      const recipientLabel = verifiedRecipients === 1 ? 'recipient' : 'recipients';
      showToast({
        message: `Reminder sent for “${survey.name}” to ${verifiedRecipients.toLocaleString()} ${recipientLabel}`,
        variant: 'success',
      });
      exitReminder();
      return;
    }
    showToast({
      message: `Sent “${survey?.name}” to ${verifiedRecipients.toLocaleString()} verified recipients`,
      variant: 'success',
    });
    setStep('compose');
    setSurvey(null);
    setSurveyQuery('');
    setAlias('');
  }

  function insertReplacementVariable(tag: string): void {
    if (messageTab === 'email') {
      setEmailBody((current) => `${current}<p>${tag}</p>`);
      setEditorVersion((version) => version + 1);
    } else {
      setSmsBody((current) => `${current}${current ? ' ' : ''}${tag}`);
    }
    setTagsMenuOpen(false);
    showToast({ message: `${tag} inserted`, variant: 'success' });
  }

  return (
    <>
      <div className={styles.toolbar}>
        <nav className={styles.tools} aria-label="Send tools">
          {COMMUNITY_SEND_TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tool === item.id ? styles.toolOn : styles.tool}
              aria-current={tool === item.id ? 'page' : undefined}
              onClick={() => setTool(item.id)}
            >
              <span className={item.icon} aria-hidden />
              {item.label}
            </button>
          ))}
        </nav>
        {portal}
      </div>

      <div ref={contentRef} className={styles.content}>
        {tool === 'history' ? (
          <CommunityInvitationHistory
            onNewProject={() => {
              setReminder(null);
              resetSendDraft();
              setTool('send');
            }}
            onSendReminder={beginReminder}
          />
        ) : tool !== 'send' ? (
          <div className={styles.placeholder}>
            <h2>{COMMUNITY_SEND_TOOLS.find((item) => item.id === tool)?.label}</h2>
            <p>Nothing here yet for {community.name}.</p>
            <button type="button" className={styles.linkBtn} onClick={() => setTool('send')}>
              Back to Send
            </button>
          </div>
        ) : (
          <div className={styles.wizard}>
            <ol className={styles.stepper} aria-label={reminder ? 'Reminder steps' : 'Send steps'}>
              {COMMUNITY_SEND_STEPS.map((item, index) => {
                const state =
                  index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'upcoming';
                const label =
                  reminder && item.id === 'send' ? 'Send reminder' : item.label;
                return (
                  <li key={item.id} className={styles.step} data-state={state}>
                    <span className={styles.stepIcon}>
                      <span className={item.icon} aria-hidden />
                    </span>
                    <span className={styles.stepLabel}>{label}</span>
                  </li>
                );
              })}
            </ol>

            {reminder ? (
              <div className={styles.reminderBanner}>
                <span className="wm-history" aria-hidden />
                <p>
                  Reminder for <strong>{reminder.surveyName}</strong>. The survey is fixed from the
                  original invitation. Recipients later are limited to members who have not
                  completed it.
                </p>
              </div>
            ) : null}

            <div className={styles.helpRow}>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => showToast({ message: 'Help center opened', variant: 'info' })}
              >
                Help
              </button>
            </div>

            {step === 'compose' ? (
              <>
                <div className={styles.card}>
                  <div className={styles.row}>
                    {reminder ? (
                      <div className={styles.surveyLocked}>
                        <span className={styles.label}>Survey:</span>
                        <span className={styles.surveyLockedName} title={reminder.surveyName}>
                          {reminder.surveyName}
                        </span>
                      </div>
                    ) : (
                      <div className={styles.surveySearch}>
                        <span className={styles.label}>Search survey:</span>
                        <WuTooltip
                          content="Search surveys by name to send to this community"
                          position="top"
                        >
                          <span className={`wm-info ${styles.infoIcon}`} aria-hidden />
                        </WuTooltip>
                        <div className={styles.comboWrap}>
                          <input
                            className={styles.inlineInput}
                            placeholder="Start typing survey name to search"
                            aria-label="Search survey"
                            value={surveyQuery}
                            onFocus={() => setSurveyMenuOpen(true)}
                            onBlur={() => window.setTimeout(() => setSurveyMenuOpen(false), 120)}
                            onChange={(event) => {
                              setSurveyQuery(event.target.value);
                              setSurvey(null);
                              setSurveyMenuOpen(true);
                            }}
                          />
                          <span className={`wm-search ${styles.inputIcon}`} aria-hidden />
                          {surveyMenuOpen ? (
                            <ul className={styles.comboMenu} role="listbox" aria-label="Surveys">
                              {surveyMatches.length === 0 ? (
                                <li className={styles.comboEmpty}>No surveys found</li>
                              ) : (
                                surveyMatches.map((item) => (
                                  <li key={item.id}>
                                    <button
                                      type="button"
                                      role="option"
                                      aria-selected={survey?.id === item.id}
                                      className={styles.comboOption}
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => selectSurvey(item)}
                                    >
                                      {item.name}
                                    </button>
                                  </li>
                                ))
                              )}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    )}
                    <label className={styles.inlineField}>
                      <span className={styles.label}>Survey alias:</span>
                      <input
                        className={styles.underlineInput}
                        value={alias}
                        onChange={(event) => setAlias(event.target.value)}
                      />
                    </label>
                    <label className={styles.inlineField}>
                      <span className={styles.label}>Survey length:</span>
                      <input
                        className={`${styles.underlineInput} ${styles.shortInput}`}
                        inputMode="numeric"
                        value={surveyLength}
                        onChange={(event) =>
                          setSurveyLength(event.target.value.replace(/[^0-9]/g, ''))
                        }
                      />
                      <span className={styles.suffix}>Mins.</span>
                    </label>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.inlineField}>
                      <span className={styles.label}>Select template:</span>
                      <div className={styles.selectWrap}>
                        <WuSelect
                          data={COMMUNITY_EMAIL_TEMPLATES}
                          accessorKey={{ value: 'value', label: 'label' }}
                          value={template}
                          onSelect={(item) => {
                            const selected = item as typeof template | null;
                            if (selected) setTemplate(selected);
                          }}
                          aria-label="Select template"
                        />
                      </div>
                    </div>
                    <div className={styles.inlineField}>
                      <span className={styles.label}>Template language:</span>
                      <div className={styles.selectWrapSmall}>
                        <WuSelect
                          data={COMMUNITY_TEMPLATE_LANGUAGES}
                          accessorKey={{ value: 'value', label: 'label' }}
                          value={language}
                          onSelect={(item) => {
                            const selected = item as typeof language | null;
                            if (selected) setLanguage(selected);
                          }}
                          aria-label="Template language"
                        />
                      </div>
                    </div>
                  </div>

                  <label className={`${styles.row} ${styles.subjectRow}`}>
                    <span className={styles.mutedLabel}>Subject:</span>
                    <input
                      className={styles.inlineInput}
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                    />
                  </label>

                  <div className={styles.messageTabs}>
                    <div role="tablist" aria-label="Message type" className={styles.tabList}>
                      {(['email', 'sms'] as const).map((id) => (
                        <button
                          key={id}
                          type="button"
                          role="tab"
                          aria-selected={messageTab === id}
                          className={messageTab === id ? styles.tabOn : styles.tab}
                          onClick={() => setMessageTab(id)}
                        >
                          {id === 'email' ? 'Email' : 'SMS'}
                        </button>
                      ))}
                    </div>
                    <div className={styles.tabActions}>
                      <WuTooltip content="Insert points tag" position="top">
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Insert points tag"
                          onClick={() => insertReplacementVariable(COMMUNITY_POINTS_TAGS[0].tag)}
                        >
                          <span className="wm-redeem" aria-hidden />
                        </button>
                      </WuTooltip>
                      <WuTooltip content="Email settings" position="top">
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Email settings"
                          onClick={() =>
                            showToast({ message: 'Email settings opened', variant: 'info' })
                          }
                        >
                          <span className="wm-settings" aria-hidden />
                        </button>
                      </WuTooltip>
                      <WuTooltip content="Insert survey link" position="top">
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Insert survey link"
                          onClick={() =>
                            showToast({ message: 'Insert survey link opened', variant: 'info' })
                          }
                        >
                          <span className="wm-link" aria-hidden />
                        </button>
                      </WuTooltip>
                      <div className={styles.tagsMenuWrap} ref={tagsMenuRef}>
                        <WuTooltip content="Insert tag" position="top">
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="Insert tag"
                            aria-expanded={tagsMenuOpen}
                            aria-haspopup="listbox"
                            onClick={() => setTagsMenuOpen((open) => !open)}
                          >
                            <span className="wm-label" aria-hidden />
                          </button>
                        </WuTooltip>
                        {tagsMenuOpen ? (
                          <div className={styles.tagsMenu} role="listbox" aria-label="Select replacement variables">
                            <div className={styles.tagsMenuHeader}>Select replacement variables</div>
                            <div className={styles.tagsMenuGroup}>Survey points</div>
                            {COMMUNITY_POINTS_TAGS.map(({ tag, incentive, label }) => (
                              <button
                                key={tag}
                                type="button"
                                role="option"
                                aria-selected={false}
                                className={styles.tagsMenuItem}
                                onClick={() => insertReplacementVariable(tag)}
                              >
                                <span>{tag}</span>
                                <span className={styles.tagsMenuHint}>
                                  {Number(incentives[incentive])
                                    ? `${incentives[incentive]} pts`
                                    : `${label} · set in Incentives`}
                                </span>
                              </button>
                            ))}
                            <div className={styles.tagsMenuGroup}>Member fields</div>
                            {COMMUNITY_REPLACEMENT_VARIABLES.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                role="option"
                                aria-selected={false}
                                className={styles.tagsMenuItem}
                                onClick={() => insertReplacementVariable(tag)}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <WuTooltip content="Preview" position="top">
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Preview"
                          onClick={() => showToast({ message: 'Preview opened', variant: 'info' })}
                        >
                          <span className="wm-visibility" aria-hidden />
                        </button>
                      </WuTooltip>
                    </div>
                  </div>
                  <div className={styles.messageBody}>
                    {messageTab === 'email' ? (
                      <SurveySettingsRichText
                        key={editorVersion}
                        value={emailBody}
                        onChange={setEmailBody}
                        ariaLabel="Email body"
                        className={styles.emailEditor}
                      />
                    ) : (
                      <textarea
                        className={styles.smsBody}
                        rows={5}
                        aria-label="SMS body"
                        value={smsBody}
                        onChange={(event) => setSmsBody(event.target.value)}
                      />
                    )}
                  </div>
                </div>

                <h3 className={styles.sectionTitle}>Multiple response options</h3>
                <div className={`${styles.card} ${styles.toggleRow}`}>
                  <span className={styles.label}>Multiple responses:</span>
                  <WuToggle
                    checked={multipleResponses}
                    onChange={setMultipleResponses}
                    aria-label="Multiple responses"
                  />
                  <WuTooltip
                    content="Allow members to take this survey more than once"
                    position="top"
                  >
                    <span className={`wm-help ${styles.infoIcon}`} aria-hidden />
                  </WuTooltip>
                </div>
              </>
            ) : null}

            {step === 'incentives' ? (
              <CommunityIncentivesStep
                surveyName={survey?.name ?? 'this survey'}
                defaults={incentives}
                onDefaultsChange={setIncentives}
                rules={incentiveRules}
                onRulesChange={setIncentiveRules}
                verifiedRecipients={verifiedRecipients}
                usedPointsTags={usedPointsTags}
              />
            ) : null}

            {step === 'recipients' ? (
              <div className={styles.recipientsStep}>
                {reminder ? null : (
                  <div
                    role="tablist"
                    aria-label="Recipient filters"
                    className={styles.recipientTabs}
                  >
                    {COMMUNITY_RECIPIENT_FILTER_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={recipientTab === tab.id}
                        className={
                          recipientTab === tab.id ? styles.recipientTabOn : styles.recipientTab
                        }
                        onClick={() => setRecipientTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className={styles.recipientsLayout}>
                  <div className={`${styles.card} ${styles.criteriaCard}`}>
                    {reminder ? (
                      <>
                        <h3 className={styles.criteriaTitle}>
                          Original deployment · Not completed
                        </h3>
                        <p className={styles.reminderAudienceHint}>
                          Reminder recipients always come from the original invitation who have
                          not completed the survey
                          {reminderNotCompleted != null
                            ? ` (${reminderNotCompleted.toLocaleString()} ${
                                reminderNotCompleted === 1 ? 'member' : 'members'
                              }).`
                            : '.'}{' '}
                          Optionally narrow that list with an additional field.
                        </p>
                        <div className={styles.criteriaField}>
                          <WuSelect
                            data={COMMUNITY_FILTER_FIELDS}
                            accessorKey={{ value: 'value', label: 'label' }}
                            value={filterField}
                            onSelect={(item) => {
                              const selected = item as CommunitySendOption | null;
                              if (selected) setFilterField(selected);
                            }}
                            aria-label="Narrow not completed recipients"
                          />
                        </div>
                      </>
                    ) : null}

                    {!reminder && recipientTab === 'custom' ? (
                      <>
                        <h3 className={styles.criteriaTitle}>Apply criteria to filter recipients</h3>
                        <div className={styles.criteriaField}>
                          <WuSelect
                            data={COMMUNITY_FILTER_FIELDS}
                            accessorKey={{ value: 'value', label: 'label' }}
                            value={filterField}
                            onSelect={(item) => {
                              const selected = item as CommunitySendOption | null;
                              if (selected) setFilterField(selected);
                            }}
                            aria-label="Select field"
                          />
                        </div>
                      </>
                    ) : null}

                    {!reminder && recipientTab === 'existing' ? (
                      <>
                        <h3 className={styles.criteriaTitle}>Choose an existing filter</h3>
                        <div className={styles.existingFilters} role="radiogroup" aria-label="Existing filters">
                          {COMMUNITY_EXISTING_FILTERS.map((item) => (
                            <label key={item.id} className={styles.existingFilter}>
                              <input
                                type="radio"
                                name="community-existing-filter"
                                checked={existingFilterId === item.id}
                                onChange={() => setExistingFilterId(item.id)}
                              />
                              <span className={styles.recipientCopy}>
                                <span className={styles.recipientLabel}>{item.label}</span>
                                <span className={styles.recipientHint}>{item.description}</span>
                              </span>
                              <span className={styles.recipientCount}>
                                {item.recipients.toLocaleString()}
                              </span>
                            </label>
                          ))}
                        </div>
                      </>
                    ) : null}

                    {!reminder && recipientTab === 'email' ? (
                      <>
                        <h3 className={styles.criteriaTitle}>Filter by email engagement</h3>
                        <div className={styles.criteriaField}>
                          <WuSelect
                            data={COMMUNITY_EMAIL_FILTERS}
                            accessorKey={{ value: 'value', label: 'label' }}
                            value={emailFilter}
                            onSelect={(item) => {
                              const selected = item as typeof emailFilter | null;
                              if (selected) setEmailFilter(selected);
                            }}
                            aria-label="Email filter"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>

                  <aside className={`${styles.card} ${styles.filterSummary}`}>
                    <h3 className={styles.filterSummaryTitle}>Filter summary</h3>
                    {reminder ? (
                      <p className={styles.filterSummarySource}>
                        Source: original deployment · not completed
                      </p>
                    ) : null}
                    <p className={styles.filterSummaryCount}>
                      <strong>{verifiedRecipients.toLocaleString()}</strong> verified recipients.
                    </p>
                    <button
                      type="button"
                      className={styles.viewRecipientsLink}
                      onClick={() => setViewRecipientsOpen(true)}
                    >
                      View recipients
                    </button>
                  </aside>
                </div>

                {viewRecipientsOpen ? (
                  <div
                    className={styles.recipientsModalBackdrop}
                    role="presentation"
                    onClick={() => setViewRecipientsOpen(false)}
                  >
                    <div
                      className={styles.recipientsModal}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="view-recipients-title"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className={styles.recipientsModalHeader}>
                        <h3 id="view-recipients-title">
                          {reminder ? 'Not completed recipients' : 'Verified recipients'}
                        </h3>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Close"
                          onClick={() => setViewRecipientsOpen(false)}
                        >
                          <span className="wm-close" aria-hidden />
                        </button>
                      </div>
                      <p className={styles.recipientsModalHint}>
                        Showing {COMMUNITY_SAMPLE_RECIPIENTS.length} of{' '}
                        {verifiedRecipients.toLocaleString()} for “{recipientSummaryLabel}”.
                      </p>
                      <ul className={styles.recipientsList}>
                        {COMMUNITY_SAMPLE_RECIPIENTS.map((person) => (
                          <li key={person.id}>
                            <span className={styles.recipientLabel}>{person.name}</span>
                            <span className={styles.recipientHint}>{person.email}</span>
                          </li>
                        ))}
                      </ul>
                      <div className={styles.recipientsModalFooter}>
                        <WuButton variant="secondary" onClick={() => setViewRecipientsOpen(false)}>
                          Close
                        </WuButton>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 'send' ? (
              <div className={`${styles.card} ${styles.summary}`}>
                <dl>
                  <dt>Survey</dt>
                  <dd>{survey?.name}</dd>
                  <dt>Subject</dt>
                  <dd>{subject}</dd>
                  <dt>Template</dt>
                  <dd>
                    {template.label} · {language.label}
                  </dd>
                  <dt>Recipients</dt>
                  <dd>
                    {recipientSummaryLabel} ({verifiedRecipients.toLocaleString()} verified)
                  </dd>
                  <dt>Incentives</dt>
                  <dd>
                    Default: Complete {incentives.complete || 0} · Quota {incentives.quota || 0} ·
                    Terminate {incentives.terminate || 0} points
                    {incentiveRules.length > 0
                      ? ` · ${incentiveRules.length} criteria ${incentiveRules.length === 1 ? 'rule' : 'rules'}`
                      : ''}
                  </dd>
                  {reminder ? (
                    <>
                      <dt>Send type</dt>
                      <dd>Reminder</dd>
                    </>
                  ) : null}
                  <dt>Multiple responses</dt>
                  <dd>{multipleResponses ? 'Allowed' : 'Not allowed'}</dd>
                </dl>
              </div>
            ) : null}

            <div className={styles.footer}>
              {step !== 'compose' ? (
                <WuButton variant="secondary" onClick={handleBack}>
                  Back
                </WuButton>
              ) : reminder ? (
                <WuButton variant="secondary" onClick={exitReminder}>
                  Back to history
                </WuButton>
              ) : (
                <span />
              )}
              {step === 'send' ? (
                <WuButton onClick={handleSend}>{reminder ? 'Send reminder' : 'Send'}</WuButton>
              ) : (
                <WuButton
                  onClick={handleNext}
                  disabled={step === 'compose' && !canContinue}
                  Icon={<span className="wm-chevron-right" aria-hidden />}
                  iconPosition="right"
                >
                  Next
                </WuButton>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
