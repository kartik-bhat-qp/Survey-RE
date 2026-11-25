'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import type { CommunityListItem } from '@/data/mock-communities';
import {
  COMMUNITY_EMAIL_TEMPLATES,
  COMMUNITY_RECIPIENT_SEGMENTS,
  COMMUNITY_SEND_STEPS,
  COMMUNITY_SEND_TOOLS,
  COMMUNITY_TEMPLATE_LANGUAGES,
  DEFAULT_COMMUNITY_EMAIL_BODY,
  DEFAULT_COMMUNITY_SMS_BODY,
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
  const [incentives, setIncentives] = useState({ complete: '0', quota: '0', terminate: '0' });
  const [multipleResponses, setMultipleResponses] = useState(false);
  const [segmentId, setSegmentId] = useState(COMMUNITY_RECIPIENT_SEGMENTS[0].id);

  const surveyMatches = useMemo(() => {
    const query = surveyQuery.trim().toLowerCase();
    if (!query) return MOCK_SURVEYS.slice(0, 8);
    return MOCK_SURVEYS.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 8);
  }, [surveyQuery]);

  const segment =
    COMMUNITY_RECIPIENT_SEGMENTS.find((item) => item.id === segmentId) ??
    COMMUNITY_RECIPIENT_SEGMENTS[0];
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

  function handleSend(): void {
    showToast({
      message: `Sent “${survey?.name}” to ${segment.members.toLocaleString()} members`,
      variant: 'success',
    });
    setStep('compose');
    setSurvey(null);
    setSurveyQuery('');
    setAlias('');
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
        {tool !== 'send' ? (
          <div className={styles.placeholder}>
            <h2>{COMMUNITY_SEND_TOOLS.find((item) => item.id === tool)?.label}</h2>
            <p>Nothing here yet for {community.name}.</p>
            <button type="button" className={styles.linkBtn} onClick={() => setTool('send')}>
              Back to Send
            </button>
          </div>
        ) : (
          <div className={styles.wizard}>
            <ol className={styles.stepper} aria-label="Send steps">
              {COMMUNITY_SEND_STEPS.map((item, index) => {
                const state =
                  index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'upcoming';
                return (
                  <li key={item.id} className={styles.step} data-state={state}>
                    <span className={styles.stepIcon}>
                      <span className={item.icon} aria-hidden />
                    </span>
                    <span className={styles.stepLabel}>{item.label}</span>
                  </li>
                );
              })}
            </ol>

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
                    <div className={styles.surveySearch}>
                      <span className={styles.label}>Search survey:</span>
                      <WuTooltip content="Search surveys by name to send to this community" position="top">
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
                      {[
                        { icon: 'wm-settings', label: 'Email settings' },
                        { icon: 'wm-link', label: 'Insert survey link' },
                        { icon: 'wm-label', label: 'Insert tag' },
                        { icon: 'wm-visibility', label: 'Preview' },
                      ].map((action) => (
                        <button
                          key={action.icon}
                          type="button"
                          className={styles.iconBtn}
                          aria-label={action.label}
                          title={action.label}
                          onClick={() =>
                            showToast({ message: `${action.label} opened`, variant: 'info' })
                          }
                        >
                          <span className={action.icon} aria-hidden />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.messageBody}>
                    {messageTab === 'email' ? (
                      <SurveySettingsRichText
                        value={emailBody}
                        onChange={setEmailBody}
                        ariaLabel="Email body"
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
              <>
                <h3 className={styles.sectionTitle}>Incentives</h3>
                <p className={styles.stepHint}>
                  Points members earn for each outcome of “{survey?.name}”.
                </p>
                <div className={`${styles.card} ${styles.incentiveRow}`}>
                  {(
                    [
                      ['complete', 'Complete'],
                      ['quota', 'Quota'],
                      ['terminate', 'Terminate'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className={styles.inlineField}>
                      <span className={styles.label}>{label}:</span>
                      <input
                        className={`${styles.underlineInput} ${styles.pointsInput}`}
                        inputMode="numeric"
                        value={incentives[key]}
                        onChange={(event) =>
                          setIncentives((current) => ({
                            ...current,
                            [key]: event.target.value.replace(/[^0-9]/g, ''),
                          }))
                        }
                      />
                      <span className={styles.suffix}>points</span>
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            {step === 'recipients' ? (
              <div className={styles.card}>
                <div className={styles.recipients} role="radiogroup" aria-label="Recipients">
                  {COMMUNITY_RECIPIENT_SEGMENTS.map((item) => (
                    <label key={item.id} className={styles.recipient}>
                      <input
                        type="radio"
                        name="community-recipients"
                        checked={segmentId === item.id}
                        onChange={() => setSegmentId(item.id)}
                      />
                      <span className={styles.recipientCopy}>
                        <span className={styles.recipientLabel}>{item.label}</span>
                        <span className={styles.recipientHint}>{item.description}</span>
                      </span>
                      <span className={styles.recipientCount}>
                        {item.members.toLocaleString()} members
                      </span>
                    </label>
                  ))}
                </div>
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
                    {segment.label} ({segment.members.toLocaleString()} members)
                  </dd>
                  <dt>Incentives</dt>
                  <dd>
                    Complete {incentives.complete || 0} · Quota {incentives.quota || 0} ·
                    Terminate {incentives.terminate || 0} points
                  </dd>
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
              ) : (
                <span />
              )}
              {step === 'send' ? (
                <WuButton onClick={handleSend}>Send</WuButton>
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
