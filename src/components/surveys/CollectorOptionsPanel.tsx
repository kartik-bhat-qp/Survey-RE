'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  DEFAULT_COLLECTOR_LANDING,
  type CollectorLandingPage,
  type CollectorOptions,
} from '@/data/mock-survey-collectors';
import styles from './CollectorOptionsPanel.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const BASIC_SECTIONS = [
  'landing',
  'recurrence',
  'thank-you',
  'endpages',
  'copy',
  'multiple',
  'editing',
  'anonymous',
] as const;

const ADVANCED_SECTIONS = [
  'instant',
  'cutoff',
  'limits',
  'ip',
  'password',
  'disqualify',
] as const;

type OptionSection =
  | (typeof BASIC_SECTIONS)[number]
  | (typeof ADVANCED_SECTIONS)[number];

const INITIAL_OPEN: OptionSection[] = [...BASIC_SECTIONS, ...ADVANCED_SECTIONS];

interface CollectorOptionsPanelProps {
  options: CollectorOptions;
  onChange: (patch: Partial<CollectorOptions>) => void;
  surveyId: number;
  onGetResponses: () => void;
}

export function CollectorOptionsPanel({
  options,
  onChange,
  surveyId,
  onGetResponses,
}: CollectorOptionsPanelProps) {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const [open, setOpen] = useState<Set<OptionSection>>(() => new Set(INITIAL_OPEN));
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [closedEditor, setClosedEditor] = useState<
    'cutoff' | 'limits' | 'ip' | null
  >(null);

  function toggle(section: OptionSection): void {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function flash(message: string): void {
    showToast({ message, variant: 'success' });
  }

  function openClosedEditor(section: 'cutoff' | 'limits' | 'ip'): void {
    setClosedEditor((current) => (current === section ? null : section));
    setOpen((current) => new Set(current).add(section));
  }

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <AccordionCard
          title="Traditional image & text"
          open={open.has('landing')}
          onToggle={() => toggle('landing')}
        >
          <LandingEditor
            landing={options.landing}
            onChange={(landing) => onChange({ landing })}
            onSaved={() => flash('Landing page saved')}
          />
        </AccordionCard>

        <AccordionCard
          title="Recurrence"
          open={open.has('recurrence')}
          onToggle={() => toggle('recurrence')}
        >
          <p className={styles.lede}>
            Email a repeating task list so this collector goes out on a schedule.
          </p>
          <RadioGroup
            name="recurrence"
            value={options.recurrence}
            onChange={(recurrence) => onChange({ recurrence })}
            options={[
              { value: 'off', label: 'Do not send this collector on a repeating schedule' },
              { value: 'schedule', label: 'Repeat this collector on a schedule' },
            ]}
          />
          {options.recurrence === 'schedule' ? (
            <div className={styles.fields}>
              <label className={styles.field}>
                <span>Frequency</span>
                <select
                  className={styles.control}
                  value={options.recurrenceFrequency}
                  onChange={(event) => {
                    const value = event.target.value;
                    onChange({
                      recurrenceFrequency: value as CollectorOptions['recurrenceFrequency'],
                    });
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Next send</span>
                <input
                  className={styles.control}
                  type="datetime-local"
                  value={options.recurrenceNextAt}
                  onChange={(event) => onChange({ recurrenceNextAt: event.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span>End on</span>
                <input
                  className={styles.control}
                  type="date"
                  value={options.recurrenceEndAt}
                  onChange={(event) => onChange({ recurrenceEndAt: event.target.value })}
                />
              </label>
            </div>
          ) : null}
        </AccordionCard>

        <AccordionCard
          title="Custom thank you"
          open={open.has('thank-you')}
          onToggle={() => toggle('thank-you')}
        >
          <p className={styles.lede}>
            Show a custom thank-you message to people who complete your survey.
          </p>
          <RadioGroup
            name="thank-you"
            value={options.thankYou}
            onChange={(thankYou) => onChange({ thankYou })}
            options={[
              { value: 'default', label: 'Use the default thank-you message' },
              { value: 'custom', label: 'Show a custom thank-you message' },
            ]}
          />
          {options.thankYou === 'custom' ? (
            <label className={styles.field}>
              <span>Thank-you message</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={options.thankYouMessage}
                onChange={(event) => onChange({ thankYouMessage: event.target.value })}
              />
            </label>
          ) : null}
        </AccordionCard>

        <AccordionCard
          title="Survey endpages"
          open={open.has('endpages')}
          onToggle={() => toggle('endpages')}
        >
          <p className={styles.lede}>
            Choose the page people see when they complete your survey.
          </p>
          <RadioGroup
            name="endpage"
            value={options.endpage}
            onChange={(endpage) => onChange({ endpage })}
            options={[
              { value: 'thank-you', label: 'Thank-you page' },
              { value: 'redirect', label: 'Redirect to a website' },
              { value: 'custom', label: 'Custom end page' },
            ]}
          />
          {options.endpage === 'redirect' ? (
            <label className={styles.field}>
              <span>Website address</span>
              <input
                className={styles.control}
                type="url"
                value={options.endpageRedirect}
                onChange={(event) => onChange({ endpageRedirect: event.target.value })}
              />
            </label>
          ) : null}
          {options.endpage === 'custom' ? (
            <label className={styles.field}>
              <span>End page message</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={options.endpageCustom}
                onChange={(event) => onChange({ endpageCustom: event.target.value })}
              />
            </label>
          ) : null}
          <button
            type="button"
            className={styles.textLink}
            onClick={() =>
              router.push(`/surveys/${surveyId}/settings?tab=finish-options`)
            }
          >
            Open Finish Options
          </button>
        </AccordionCard>

        <AccordionCard
          title="Send copy of responses"
          open={open.has('copy')}
          onToggle={() => toggle('copy')}
        >
          <RadioGroup
            name="response-copy"
            value={options.responseCopy}
            onChange={(responseCopy) => onChange({ responseCopy })}
            options={[
              { value: 'none', label: 'Do not send respondents a copy of their responses' },
              {
                value: 'email-request',
                label: 'Let respondents request a copy of their answers via email',
              },
            ]}
          />
        </AccordionCard>

        <AccordionCard
          title="Multiple responses"
          open={open.has('multiple')}
          onToggle={() => toggle('multiple')}
        >
          <RadioGroup
            name="multiple"
            value={options.multiple}
            onChange={(multiple) => onChange({ multiple })}
            options={[
              {
                value: 'allow',
                label: 'Allow this survey to be taken more than once from the same device',
              },
              {
                value: 'once',
                label: 'Only allow this survey to be taken once from the same device',
              },
              {
                value: 'custom-variable',
                label: 'Prevent multiple responses using custom variables',
              },
            ]}
          />
          {options.multiple === 'custom-variable' ? (
            <label className={styles.field}>
              <span>Custom variable</span>
              <input
                className={styles.control}
                value={options.customVariable}
                onChange={(event) => onChange({ customVariable: event.target.value })}
              />
            </label>
          ) : null}
        </AccordionCard>

        <AccordionCard
          title="Response editing"
          open={open.has('editing')}
          onToggle={() => toggle('editing')}
        >
          <RadioGroup
            name="editing"
            value={options.editing}
            onChange={(editing) => onChange({ editing })}
            options={[
              {
                value: 'until-complete',
                label:
                  'Respondents can change their answers on any survey page until they complete or exit the survey',
              },
              {
                value: 'after-complete',
                label:
                  'Respondents can change their answers even after they complete the survey',
              },
              {
                value: 'no-page-back',
                label:
                  "Respondents can't change their answers once they leave a survey page",
              },
            ]}
          />
        </AccordionCard>

        <AccordionCard
          title="Anonymous responses"
          open={open.has('anonymous')}
          onToggle={() => toggle('anonymous')}
        >
          <RadioGroup
            name="anonymous"
            value={options.anonymous}
            onChange={(anonymous) => onChange({ anonymous })}
            options={[
              { value: 'anonymous', label: 'Your respondents will be anonymous' },
              {
                value: 'include-ip',
                label: "Include respondents' IP addresses in your survey results",
              },
            ]}
          />
        </AccordionCard>

        {showAdvanced ? (
          <>
            <AccordionCard
              title="Instant results"
              open={open.has('instant')}
              onToggle={() => toggle('instant')}
            >
              <RadioGroup
                name="instant"
                value={options.instantResults}
                onChange={(instantResults) => onChange({ instantResults })}
                options={[
                  {
                    value: 'show',
                    label:
                      'Show results to respondents. Table questions so that anon respondents will not be displayed.',
                  },
                  { value: 'hide', label: 'Do not show results to respondents' },
                ]}
              />
            </AccordionCard>

            <AccordionCard
              title="Cutoff date and time"
              open={open.has('cutoff')}
              onToggle={() => toggle('cutoff')}
            >
              <p className={styles.lede}>
                Set a cutoff date and time this collector will close and stop accepting
                responses.{' '}
                <button
                  type="button"
                  className={styles.inlineLink}
                  onClick={() => openClosedEditor('cutoff')}
                >
                  Edit Survey closed message
                </button>
              </p>
              <RadioGroup
                name="cutoff"
                value={options.cutoff}
                onChange={(cutoff) => onChange({ cutoff })}
                options={[
                  {
                    value: 'manual',
                    label: 'Accept responses until you manually close this collector',
                  },
                  {
                    value: 'datetime',
                    label: 'Close this collector on a specified date and time',
                  },
                  {
                    value: 'per-response',
                    label: 'Assign expiration dates for each response',
                  },
                ]}
              />
              {options.cutoff === 'datetime' ? (
                <label className={styles.field}>
                  <span>Close on</span>
                  <input
                    className={styles.control}
                    type="datetime-local"
                    value={options.cutoffVal}
                    onChange={(event) => onChange({ cutoffVal: event.target.value })}
                  />
                </label>
              ) : null}
              {closedEditor === 'cutoff' ? (
                <ClosedMessageField
                  value={options.closedMessage}
                  onChange={(closedMessage) => onChange({ closedMessage })}
                />
              ) : null}
            </AccordionCard>

            <AccordionCard
              title="Response limits"
              open={open.has('limits')}
              onToggle={() => toggle('limits')}
            >
              <p className={styles.lede}>
                Set the maximum number of responses that this collector will accept.{' '}
                <button
                  type="button"
                  className={styles.inlineLink}
                  onClick={() => openClosedEditor('limits')}
                >
                  Edit Survey closed message
                </button>
              </p>
              <RadioGroup
                name="limits"
                value={options.limit}
                onChange={(limit) => onChange({ limit })}
                options={[
                  {
                    value: 'max',
                    label: 'Close this collector after a specified number of responses',
                  },
                  {
                    value: 'manual',
                    label: 'Accept responses until you manually close this collector',
                  },
                ]}
              />
              {options.limit === 'max' ? (
                <label className={styles.field}>
                  <span>Maximum responses</span>
                  <input
                    className={styles.control}
                    type="number"
                    min={1}
                    value={options.limitVal}
                    onChange={(event) => onChange({ limitVal: event.target.value })}
                  />
                </label>
              ) : null}
              {closedEditor === 'limits' ? (
                <ClosedMessageField
                  value={options.closedMessage}
                  onChange={(closedMessage) => onChange({ closedMessage })}
                />
              ) : null}
            </AccordionCard>

            <AccordionCard
              title="IP restrictions"
              open={open.has('ip')}
              onToggle={() => toggle('ip')}
            >
              <p className={styles.lede}>
                Control who can take your survey by either allowing or blocking specific
                IP addresses.{' '}
                <button
                  type="button"
                  className={styles.inlineLink}
                  onClick={() => openClosedEditor('ip')}
                >
                  Edit Survey closed message
                </button>
              </p>
              <RadioGroup
                name="ip"
                value={options.ip}
                onChange={(ip) => onChange({ ip })}
                options={[
                  {
                    value: 'block',
                    label: 'Block computers at specified IP addresses from taking your survey',
                  },
                  {
                    value: 'allow',
                    label: 'Allow computers at specified IP addresses to take your survey',
                  },
                  {
                    value: 'none',
                    label: 'Do not restrict IP addresses from taking your survey',
                  },
                ]}
              />
              {options.ip === 'block' || options.ip === 'allow' ? (
                <label className={styles.field}>
                  <span>IP addresses (one per line)</span>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    placeholder="192.168.1.1"
                    value={options.ipList}
                    onChange={(event) => onChange({ ipList: event.target.value })}
                  />
                </label>
              ) : null}
              {closedEditor === 'ip' ? (
                <ClosedMessageField
                  value={options.closedMessage}
                  onChange={(closedMessage) => onChange({ closedMessage })}
                />
              ) : null}
            </AccordionCard>

            <AccordionCard
              title="Password protection"
              open={open.has('password')}
              onToggle={() => toggle('password')}
            >
              <p className={styles.lede}>Set a password to restrict access to your survey.</p>
              <RadioGroup
                name="password"
                value={options.password}
                onChange={(password) => onChange({ password })}
                options={[
                  {
                    value: 'required',
                    label: 'Only respondents with the password may take your survey',
                  },
                  {
                    value: 'none',
                    label: 'No password is required to take your survey',
                  },
                ]}
              />
              {options.password === 'required' ? (
                <label className={styles.field}>
                  <span>Password</span>
                  <input
                    className={styles.control}
                    type="text"
                    value={options.passwordVal}
                    onChange={(event) => onChange({ passwordVal: event.target.value })}
                  />
                </label>
              ) : null}
            </AccordionCard>

            <AccordionCard
              title="Custom disqualification"
              open={open.has('disqualify')}
              onToggle={() => toggle('disqualify')}
            >
              <p className={styles.lede}>
                Show a custom message if respondents don&apos;t qualify for your survey.
              </p>
              <RadioGroup
                name="disqualify"
                value={options.disqualify}
                onChange={(disqualify) => onChange({ disqualify })}
                options={[
                  { value: 'default', label: 'Use the default disqualification message' },
                  { value: 'custom', label: 'Show a custom disqualification message' },
                ]}
              />
              {options.disqualify === 'custom' ? (
                <label className={styles.field}>
                  <span>Disqualification message</span>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={options.disqualifyMessage}
                    onChange={(event) =>
                      onChange({ disqualifyMessage: event.target.value })
                    }
                  />
                </label>
              ) : null}
            </AccordionCard>
          </>
        ) : null}

        <button
          type="button"
          className={styles.advancedToggle}
          onClick={() => {
            setShowAdvanced((current) => !current);
            if (!showAdvanced) {
              setOpen((current) => {
                const next = new Set(current);
                for (const section of ADVANCED_SECTIONS) next.add(section);
                return next;
              });
            }
          }}
        >
          {showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
        </button>
      </div>

      <aside className={styles.aside}>
        <div className={styles.audienceCard}>
          <p className={styles.audienceKicker}>QuestionPro Audience</p>
          <h3>Need more responses?</h3>
          <p>
            Get fast, high-quality feedback from our panel of global respondents. You
            reach an estimate.
          </p>
          <WuButton type="button" onClick={onGetResponses}>
            Get started
          </WuButton>
        </div>
      </aside>
    </div>
  );
}

function AccordionCard({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={styles.card}>
      <button
        type="button"
        className={styles.cardHeader}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>{title}</span>
        <span
          className={`${open ? 'wm-keyboard-arrow-down' : 'wm-keyboard-arrow-right'} ${styles.chevron}`}
          aria-hidden
        />
      </button>
      {open ? <div className={styles.cardBody}>{children}</div> : null}
    </section>
  );
}

function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.radios} role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <label key={option.value} className={styles.radio}>
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function ClosedMessageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span>Survey closed message</span>
      <textarea
        className={styles.textarea}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function LandingEditor({
  landing,
  onChange,
  onSaved,
}: {
  landing: CollectorLandingPage;
  onChange: (landing: CollectorLandingPage) => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<CollectorLandingPage>(landing);

  useEffect(() => {
    setDraft(landing);
  }, [landing]);

  function patch(next: Partial<CollectorLandingPage>): void {
    setDraft((current) => ({ ...current, ...next }));
  }

  function handleImage(file: File | undefined): void {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        patch({ imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={styles.landing}>
      <div className={styles.imageBlock}>
        <span className={styles.imageLabel}>Image</span>
        <span className={styles.imageHint}>
          5 MB max. We recommend using an image that&apos;s at least 500 × 614 pixels.
        </span>
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draft.imageUrl} alt="" />
          <WuButton
            type="button"
            variant="secondary"
            onClick={() => fileRef.current?.click()}
          >
            Add Image
          </WuButton>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={(event) => {
              handleImage(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </div>
      </div>
      <label className={styles.field}>
        <span>Title</span>
        <input
          className={styles.control}
          value={draft.title}
          onChange={(event) => patch({ title: event.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span>Description</span>
        <textarea
          className={styles.textarea}
          rows={3}
          value={draft.description}
          onChange={(event) => patch({ description: event.target.value })}
        />
      </label>
      <div className={styles.landingActions}>
        <WuButton
          type="button"
          variant="secondary"
          onClick={() => setDraft(landing)}
        >
          Cancel
        </WuButton>
        <WuButton
          type="button"
          onClick={() => {
            onChange(draft);
            onSaved();
          }}
        >
          Save
        </WuButton>
        <button
          type="button"
          className={styles.reset}
          onClick={() => setDraft(DEFAULT_COLLECTOR_LANDING)}
        >
          Reset to default
        </button>
      </div>
    </div>
  );
}
