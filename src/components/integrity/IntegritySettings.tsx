'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  DEFAULT_THRESHOLDS,
  INTEGRITY_POLICY_VERSION,
  type IntegrityMode,
  type IntegrityThresholds,
} from '@/lib/integrity/policy';
import {
  readDecisionLog,
  readMode,
  readThresholds,
  writeMode,
  writeThresholds,
  type IntegrityLogEntry,
} from '@/lib/integrity/session';
import styles from './IntegritySettings.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);

const ENTRY_LABEL: Record<IntegrityLogEntry['entry'], string> = {
  survey: 'Survey start',
  registration: 'Community registration',
  login: 'Community login',
  recovery: 'Account recovery',
  invitation: 'Invitation',
};

export function IntegritySettings() {
  const { showToast } = useWuShowToast();
  const [mode, setMode] = useState<IntegrityMode>('protect');
  const [thresholds, setThresholds] = useState<IntegrityThresholds>(DEFAULT_THRESHOLDS);
  const [log, setLog] = useState<IntegrityLogEntry[]>([]);
  const [mediumText, setMediumText] = useState(String(DEFAULT_THRESHOLDS.medium));
  const [highText, setHighText] = useState(String(DEFAULT_THRESHOLDS.high));

  useEffect(() => {
    const storedMode = readMode();
    const storedThresholds = readThresholds();
    setMode(storedMode);
    setThresholds(storedThresholds);
    setMediumText(String(storedThresholds.medium));
    setHighText(String(storedThresholds.high));
    setLog(readDecisionLog());
  }, []);

  function save(): void {
    const medium = Number(mediumText);
    const high = Number(highText);
    if (!Number.isInteger(medium) || !Number.isInteger(high) || medium < 1 || high <= medium) {
      showToast({
        message: 'High must be a whole number above medium, and medium must be at least 1.',
        variant: 'error',
      });
      return;
    }
    const next = { medium, high };
    writeMode(mode);
    writeThresholds(next);
    setThresholds(next);
    showToast({ message: 'Protection settings saved.', variant: 'success' });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Protection settings"
        description={
          'Observe records each visit without stopping anyone. Protect adds a confirmation, ' +
          'a short wait, or a hold only when more than one signal agrees.'
        }
      />
      <div className={styles.stack}>
        <section className={styles.card}>
          <h2>Mode</h2>
          <div className={styles.choiceRow} role="group" aria-label="Protection mode">
            {(['protect', 'observe'] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={mode === item ? styles.choiceOn : styles.choice}
                onClick={() => setMode(item)}
              >
                {item === 'protect' ? 'Protect' : 'Observe only'}
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            Policy {INTEGRITY_POLICY_VERSION}. Current medium {thresholds.medium}, high{' '}
            {thresholds.high}.
          </p>
        </section>
        <section className={styles.card}>
          <h2>Risk thresholds</h2>
          <div className={styles.fields}>
            <label>
              Medium from
              <input
                className={styles.number}
                inputMode="numeric"
                value={mediumText}
                onChange={(event) => setMediumText(event.target.value)}
              />
            </label>
            <label>
              High from
              <input
                className={styles.number}
                inputMode="numeric"
                value={highText}
                onChange={(event) => setHighText(event.target.value)}
              />
            </label>
          </div>
          <p className={styles.hint}>
            One signal can ask for a confirmation. A hold needs two different signals, such as a
            reused link and a burst of attempts. A shared network is not one of those signals.
          </p>
          <WuButton type="button" onClick={save}>
            Save changes
          </WuButton>
        </section>
        <section className={styles.card}>
          <h2>Decision log</h2>
          <p className={styles.hint}>
            Stored in this browser session. Entries keep the entry point, risk, and action. They
            do not keep passwords, email addresses, or device identifiers.
          </p>
          {log.length === 0 ? (
            <p className={styles.hint}>No decisions yet. Open an entry point and continue.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Entry</th>
                  <th scope="col">Risk</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {log.map((item) => (
                  <tr key={`${item.at}-${item.entry}`}>
                    <td>{formatWhen(item.at)}</td>
                    <td>{ENTRY_LABEL[item.entry]}</td>
                    <td>{item.risk}</td>
                    <td>{item.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </PageContainer>
  );
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
