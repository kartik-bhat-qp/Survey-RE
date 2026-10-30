'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  actionAfterChallenge,
  evaluateIntegrity,
  isDisposableEmail,
  type IntegrityAction,
  type IntegrityDecision,
  type IntegrityEntry,
  type IntegrityMode,
  type LinkToken,
} from '@/lib/integrity/policy';
import {
  appendDecision,
  readFailureCount,
  readIdentityCount,
  readMode,
  readThresholds,
  readVisitCount,
  recordFailure,
  recordIdentity,
  recordVisit,
  writeMode,
  type IntegrityLogEntry,
} from '@/lib/integrity/session';
import { PageContainer } from '@/components/ui/PageContainer';
import styles from './IntegrityEntry.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);

const PRESENCE_PHRASE = 'clear harbor';

const COPY: Record<
  IntegrityEntry,
  { title: string; lede: string; submit: string; successTitle: string; successBody: string }
> = {
  survey: {
    title: 'Start the survey',
    lede:
      'Your survey opens as usual. A confirmation step appears only when this visit ' +
      'needs a second look.',
    submit: 'Start',
    successTitle: 'You can begin',
    successBody: 'Survey routing, quotas, embedded data, and link parameters are unchanged.',
  },
  registration: {
    title: 'Join the community',
    lede:
      'Create one account for this community. A shared home, workplace, or device is not ' +
      'a reason to stop you.',
    submit: 'Create account',
    successTitle: 'You can finish joining',
    successBody:
      'A confirmation message would go to that email. Your password is not stored by Integrity.',
  },
  login: {
    title: 'Community login',
    lede: 'Use the email and password for your community account.',
    submit: 'Sign in',
    successTitle: 'Signed in',
    successBody: 'This session uses the community sign-in you already have.',
  },
  recovery: {
    title: 'Recover access',
    lede: 'Ask for recovery steps. The reply is the same whether or not that email has an account.',
    submit: 'Send recovery steps',
    successTitle: 'Check your email',
    successBody: 'If an account uses that email, recovery steps are on the way.',
  },
  invitation: {
    title: 'Accept invitation',
    lede:
      'Open the invitation you were sent. A used or missing link can ask you to confirm ' +
      'before it continues.',
    submit: 'Accept invitation',
    successTitle: 'Invitation accepted',
    successBody: 'You can sign in with the email on the invitation.',
  },
};

const TOKEN_OPTIONS: { id: LinkToken; label: string }[] = [
  { id: 'valid', label: 'Valid link' },
  { id: 'reused', label: 'Reused link' },
  { id: 'missing', label: 'Missing link' },
];

export function IntegrityEntry({ entry }: { entry: IntegrityEntry }) {
  const copy = COPY[entry];
  const startedAt = useRef(0);
  const [step, setStep] = useState<'form' | 'challenge' | 'wait' | 'done'>('form');
  const [waitKind, setWaitKind] = useState<'delay' | 'restrict'>('delay');
  const [seconds, setSeconds] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phrase, setPhrase] = useState('');
  const [formError, setFormError] = useState('');
  const [challengeError, setChallengeError] = useState('');
  const [misses, setMisses] = useState(0);
  const [mode, setMode] = useState<IntegrityMode>('protect');
  const [token, setToken] = useState<LinkToken>('valid');
  const [extraAttempts, setExtraAttempts] = useState(0);
  const [rush, setRush] = useState(false);
  const [credentialsMatch, setCredentialsMatch] = useState(true);
  const [decision, setDecision] = useState<IntegrityDecision | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    setMode(readMode());
  }, []);

  useEffect(() => {
    if (step !== 'wait' || seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds, step]);

  function applyDecision(next: IntegrityDecision, credentialsOk: boolean): void {
    setDecision(next);
    const logged: IntegrityLogEntry = {
      at: new Date().toISOString(),
      entry,
      risk: next.risk,
      action: next.action,
      policyVersion: next.policyVersion,
    };
    appendDecision(logged);
    if (next.action === 'challenge') {
      setPhrase('');
      setChallengeError('');
      setStep('challenge');
      return;
    }
    if (next.action === 'delay' || next.action === 'restrict') {
      setWaitKind(next.action);
      setSeconds(next.retryAfterSeconds);
      setStep('wait');
      return;
    }
    if (entry === 'login' && !credentialsOk) {
      setFormError('Those details did not match. Try again or recover access.');
      setStep('form');
      return;
    }
    setStep('done');
  }

  function onSubmit(): void {
    const validation = validate(entry, email, password);
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError('');
    const visits = recordVisit(entry) + extraAttempts;
    const identityCount = email.trim()
      ? recordIdentity(entry, email)
      : readIdentityCount(entry, email);
    const failures = entry === 'login' && !credentialsMatch
      ? recordFailure(entry)
      : readFailureCount(entry);
    const elapsedMs = rush ? 120 : Date.now() - startedAt.current;
    const next = evaluateIntegrity({
      entry,
      mode,
      thresholds: readThresholds(),
      signals: {
        recentAttempts: visits,
        elapsedMs,
        token: entry === 'survey' || entry === 'invitation' ? token : 'valid',
        failedAttempts: failures,
        disposableEmail: isDisposableEmail(email),
        repeatedIdentity: identityCount >= 3,
      },
    });
    applyDecision(next, credentialsMatch);
  }

  function onChallenge(): void {
    if (!decision) return;
    const passed = phrase.trim().toLowerCase() === PRESENCE_PHRASE;
    const nextMisses = passed ? misses : misses + 1;
    setMisses(nextMisses);
    const action = actionAfterChallenge(decision, passed, nextMisses);
    if (action === 'challenge') {
      setChallengeError('That phrase did not match. You can try once more.');
      setPhrase('');
      return;
    }
    applyDecision({ ...decision, action, retryAfterSeconds: action === 'delay' ? 15 : 0 }, true);
  }

  const showToken = entry === 'survey' || entry === 'invitation';
  const showIdentity = entry === 'registration' || entry === 'login' || entry === 'recovery';
  const showPassword = entry === 'registration' || entry === 'login';

  return (
    <PageContainer>
      <div className={styles.wrap}>
        {step === 'form' ? (
          <section className={styles.card} aria-label={copy.title}>
            <h1 className={styles.title}>{copy.title}</h1>
            <p className={styles.lede}>{copy.lede}</p>
            <div className={styles.fields}>
              {entry === 'registration' ? (
                <Field label="Name" value={name} onChange={setName} autoComplete="name" />
              ) : null}
              {showIdentity ? (
                <Field
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  autoComplete="email"
                />
              ) : null}
              {showPassword ? (
                <Field
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  type="password"
                  autoComplete={entry === 'login' ? 'current-password' : 'new-password'}
                />
              ) : null}
            </div>
            {formError ? <p className={styles.error}>{formError}</p> : null}
            <div className={styles.actions}>
              <WuButton type="button" onClick={onSubmit}>
                {copy.submit}
              </WuButton>
            </div>
          </section>
        ) : null}

        {step === 'challenge' ? (
          <section className={styles.card} aria-label="Confirm you can continue">
            <h1 className={styles.title}>Confirm you can continue</h1>
            <p className={styles.lede}>
              Type the phrase below. This step is skipped on an ordinary visit.
            </p>
            <p className={styles.phrase}>{PRESENCE_PHRASE}</p>
            <Field label="Phrase" value={phrase} onChange={setPhrase} autoComplete="off" />
            {challengeError ? <p className={styles.error}>{challengeError}</p> : null}
            <div className={styles.actions}>
              <WuButton type="button" onClick={onChallenge}>
                Continue
              </WuButton>
              <WuButton type="button" variant="secondary" onClick={() => setStep('form')}>
                Back
              </WuButton>
            </div>
          </section>
        ) : null}

        {step === 'wait' ? (
          <section className={styles.outcome} aria-live="polite">
            <h1 className={styles.title}>
              {waitKind === 'restrict'
                ? 'This visit can’t continue right now'
                : 'Please wait a moment'}
            </h1>
            <p>
              {waitKind === 'restrict'
                ? 'You can try again after the hold ends, or ask the person who invited you ' +
                  'for a fresh link.'
                : 'Too many attempts arrived together. You can try again when the timer ends.'}
            </p>
            <p className={styles.hint}>
              {seconds > 0 ? `${seconds}s remaining` : 'You can try again.'}
            </p>
            <div className={styles.actions}>
              <WuButton type="button" disabled={seconds > 0} onClick={() => setStep('form')}>
                Try again
              </WuButton>
            </div>
          </section>
        ) : null}

        {step === 'done' ? (
          <section className={styles.outcome} aria-live="polite">
            <h1 className={styles.title}>{copy.successTitle}</h1>
            <p>{copy.successBody}</p>
            <div className={styles.actions}>
              <WuButton type="button" variant="secondary" onClick={() => setStep('form')}>
                Start over
              </WuButton>
            </div>
          </section>
        ) : null}

        <details className={styles.panel}>
          <summary>Prototype visit conditions</summary>
          <div className={styles.panelBody}>
            <div className={styles.choiceRow} role="group" aria-label="Protection mode">
              {(['protect', 'observe'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={mode === item ? styles.choiceOn : styles.choice}
                  onClick={() => {
                    setMode(item);
                    writeMode(item);
                  }}
                >
                  {item === 'protect' ? 'Protect' : 'Observe only'}
                </button>
              ))}
            </div>
            {showToken ? (
              <div className={styles.choiceRow} role="group" aria-label="Link token">
                {TOKEN_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={token === item.id ? styles.choiceOn : styles.choice}
                    onClick={() => setToken(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
            <label className={styles.check}>
              Earlier attempts
              <input
                className={styles.number}
                type="number"
                min={0}
                value={extraAttempts}
                onChange={(event) => setExtraAttempts(Number(event.target.value) || 0)}
              />
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={rush}
                onChange={(event) => setRush(event.target.checked)}
              />
              Submit immediately
            </label>
            {entry === 'login' ? (
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={credentialsMatch}
                  onChange={(event) => setCredentialsMatch(event.target.checked)}
                />
                Credentials match
              </label>
            ) : null}
            {decision ? (
              <p className={styles.log}>
                {decision.policyVersion} · risk {decision.risk} · action {decision.action}
                {decision.action === decision.would ? '' : ` · protect would ${decision.would}`}
                {decision.reasons.length ? ` · ${decision.reasons.join(', ')}` : ''}
              </p>
            ) : (
              <p className={styles.hint}>
                Decisions use visit frequency, link reuse, sign-in failures, and email patterns.
                Network reputation is not connected.
              </p>
            )}
          </div>
        </details>
      </div>
    </PageContainer>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete: string;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={`integrity-${label}`}>{label}</label>
      <WuInput
        id={`integrity-${label}`}
        variant="flat"
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-label={label}
        onInput={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

function validate(entry: IntegrityEntry, email: string, password: string): string {
  if (entry === 'registration' || entry === 'login' || entry === 'recovery') {
    if (!email.trim() || !email.includes('@')) return 'Enter an email address.';
  }
  if ((entry === 'registration' || entry === 'login') && password.length < 8) {
    return 'Use a password of at least 8 characters.';
  }
  return '';
}
