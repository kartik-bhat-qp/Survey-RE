'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  COMMUNITY_SETTINGS_OPTIONS,
  type CommunityId,
} from '@/data/mock-question-communities';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  COMMUNITY_CHECKS,
  COMMUNITY_HELP,
  EMPTY_INTEGRITY_COVERAGE,
  INTEGRITY_COVERAGE_KEY,
  LOGIN_CHECK_HELP,
  communityIsProtected,
  communityProtectionSummary,
  findCommunityProtection,
  loginIsSampled,
  normalizeCommunityChecks,
  normalizeTolerance,
  type CommunityCheckId,
  type CommunityProtectionRecord,
  type LoginCheck,
} from '@/lib/integrity/coverage';
import { IntegrityCheckToggles } from './IntegrityCheckToggles';
import { IntegrityHelpTip } from './IntegrityHelpTip';
import styles from './IntegrityCoverage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);

const COMMUNITIES = COMMUNITY_SETTINGS_OPTIONS.filter(
  (option): option is { value: CommunityId; label: string } => option.value !== '',
);

const LOGIN_CHOICES: { id: LoginCheck; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'sporadic', label: 'Sporadically' },
  { id: 'every', label: 'Every login' },
];

function blankRecord(communityId: CommunityId): CommunityProtectionRecord {
  return {
    communityId,
    signups: false,
    loginCheck: 'off',
    loginEvery: 10,
    recovery: false,
    invitations: false,
    checks: [],
  };
}

export function CommunityProtectionDashboard() {
  const { showToast } = useWuShowToast();
  const [coverage, setCoverage] = usePersistedState(
    INTEGRITY_COVERAGE_KEY,
    EMPTY_INTEGRITY_COVERAGE,
  );
  const [drafts, setDrafts] = useState<Partial<Record<CommunityId, CommunityProtectionRecord>>>({});
  const [samples, setSamples] = useState<Record<string, number>>({});
  const [sampleNote, setSampleNote] = useState<Record<string, string>>({});

  function recordFor(communityId: CommunityId): CommunityProtectionRecord {
    return (
      drafts[communityId] ??
      findCommunityProtection(coverage, communityId) ??
      blankRecord(communityId)
    );
  }

  function patch(communityId: CommunityId, partial: Partial<CommunityProtectionRecord>): void {
    setDrafts((current) => ({
      ...current,
      [communityId]: { ...recordFor(communityId), ...partial },
    }));
  }

  function toggleCheck(communityId: CommunityId, id: CommunityCheckId, checked: boolean): void {
    const record = recordFor(communityId);
    const current = record.checks ?? [];
    patch(communityId, {
      checks: normalizeCommunityChecks(
        checked ? [...current, id] : current.filter((item) => item !== id),
      ),
    });
  }

  function save(communityId: CommunityId, label: string): void {
    const draft = recordFor(communityId);
    const loginEvery = Math.max(2, Math.floor(draft.loginEvery) || 10);
    const next = {
      ...draft,
      loginEvery,
      checks: normalizeCommunityChecks(draft.checks ?? []),
      tolerance: normalizeTolerance(
        normalizeCommunityChecks(draft.checks ?? []),
        draft.tolerance,
        COMMUNITY_CHECKS,
      ),
    };
    setCoverage((current) => ({
      ...current,
      communities: communityIsProtected(next)
        ? [...current.communities.filter((item) => item.communityId !== communityId), next]
        : current.communities.filter((item) => item.communityId !== communityId),
    }));
    setDrafts((current) => {
      const rest = { ...current };
      delete rest[communityId];
      return rest;
    });
    showToast({
      message: communityIsProtected(next)
        ? `Protection saved for ${label}.`
        : `Protection turned off for ${label}.`,
      variant: 'success',
    });
  }

  function runLogin(communityId: CommunityId, label: string): void {
    const record = recordFor(communityId);
    if (record.loginCheck === 'off') {
      setSampleNote((current) => ({
        ...current,
        [communityId]: `${label} does not check logins.`,
      }));
      return;
    }
    const visit = (samples[communityId] ?? 0) + 1;
    setSamples((current) => ({ ...current, [communityId]: visit }));
    const sampled =
      record.loginCheck === 'every' || loginIsSampled(visit, record.loginEvery);
    const checked = `Sign-in ${visit} was checked. A normal member continues.`;
    const skipped = `Sign-in ${visit} was not in the sample. The member continues without a check.`;
    setSampleNote((current) => ({
      ...current,
      [communityId]: sampled ? `${checked} A risky sign-in is asked to confirm.` : skipped,
    }));
  }

  return (
    <PageContainer>
      <PageHeader
        title="Communities"
        description={
          'Protect the communities you already run. Signups can be checked every time. ' +
          'Logins can stay open, be checked every time, or be sampled.'
        }
      />
      <div className={styles.stack}>
        {COMMUNITIES.map((community) => {
          const record = recordFor(community.value);
          const saved = findCommunityProtection(coverage, community.value);
          return (
            <section key={community.value} className={styles.card} aria-label={community.label}>
              <div className={styles.row}>
                <div className={styles.copy}>
                  <h2>{community.label}</h2>
                  <p className={styles.hint}>{communityProtectionSummary(saved)}</p>
                </div>
              </div>
              <section className={styles.checks} aria-label={`Checks for ${community.label}`}>
                <h3>When to check</h3>
              <div className={styles.row}>
                <div className={styles.copy}>
                  <span className={styles.labelRow}>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => patch(community.value, { signups: !record.signups })}
                    >
                      <strong>Protect signups</strong>
                    </button>
                    <IntegrityHelpTip
                      label="About signup protection"
                      content={COMMUNITY_HELP.signups}
                    />
                  </span>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => patch(community.value, { signups: !record.signups })}
                  >
                    <span className={styles.hint}>
                      Check new accounts before they join this community.
                    </span>
                  </button>
                </div>
                <WuToggle
                  checked={record.signups}
                  aria-label={`Protect signups for ${community.label}`}
                  onChange={(checked) => patch(community.value, { signups: checked })}
                />
              </div>
              <div className={styles.copy}>
                <span className={styles.labelRow}>
                  <strong>Check logins</strong>
                  <IntegrityHelpTip label="About login checks" content={COMMUNITY_HELP.logins} />
                </span>
                <span className={styles.hint}>
                  Sporadic checks leave most members alone and review a sample of sign-ins.
                </span>
              </div>
              <div
                className={styles.choiceRow}
                role="group"
                aria-label={`Logins for ${community.label}`}
              >
                {LOGIN_CHOICES.map((choice) => (
                  <span key={choice.id} className={styles.choiceItem}>
                    <button
                      type="button"
                      className={record.loginCheck === choice.id ? styles.choiceOn : styles.choice}
                      onClick={() => patch(community.value, { loginCheck: choice.id })}
                    >
                      {choice.label}
                    </button>
                    {choice.id === 'sporadic' ? (
                      <IntegrityHelpTip
                        label="About Sporadically"
                        content={LOGIN_CHECK_HELP.sporadic}
                      />
                    ) : null}
                  </span>
                ))}
              </div>
              {record.loginCheck === 'sporadic' ? (
                <label className={styles.sample}>
                  <span className={styles.labelRow}>
                    Check 1 in
                    <IntegrityHelpTip
                      label="About the login sample"
                      content={COMMUNITY_HELP.sample}
                    />
                  </span>
                  <input
                    className={styles.number}
                    inputMode="numeric"
                    aria-label={`Sample rate for ${community.label}`}
                    value={String(record.loginEvery)}
                    onChange={(event) =>
                      patch(community.value, { loginEvery: Number(event.target.value) || 0 })
                    }
                  />
                  logins
                </label>
              ) : null}
              <div className={styles.row}>
                <div className={styles.copy}>
                  <span className={styles.labelRow}>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => patch(community.value, { recovery: !record.recovery })}
                    >
                      <strong>Account recovery</strong>
                    </button>
                    <IntegrityHelpTip
                      label="About account recovery"
                      content={COMMUNITY_HELP.recovery}
                    />
                  </span>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => patch(community.value, { recovery: !record.recovery })}
                  >
                    <span className={styles.hint}>
                      Limit repeated recovery requests without saying whether the email has an
                      account.
                    </span>
                  </button>
                </div>
                <WuToggle
                  checked={record.recovery}
                  aria-label={`Account recovery for ${community.label}`}
                  onChange={(checked) => patch(community.value, { recovery: checked })}
                />
              </div>
              <div className={styles.row}>
                <div className={styles.copy}>
                  <span className={styles.labelRow}>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => patch(community.value, { invitations: !record.invitations })}
                    >
                      <strong>Invitations</strong>
                    </button>
                    <IntegrityHelpTip
                      label="About invitations"
                      content={COMMUNITY_HELP.invitations}
                    />
                  </span>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => patch(community.value, { invitations: !record.invitations })}
                  >
                    <span className={styles.hint}>
                      Check invitation links before they are accepted.
                    </span>
                  </button>
                </div>
                <WuToggle
                  checked={record.invitations}
                  aria-label={`Invitations for ${community.label}`}
                  onChange={(checked) => patch(community.value, { invitations: checked })}
                />
              </div>
              </section>
              <section className={styles.checks} aria-label={`Signals for ${community.label}`}>
                <h3>What will be checked</h3>
                <IntegrityCheckToggles
                  items={COMMUNITY_CHECKS}
                  selected={normalizeCommunityChecks(record.checks ?? [])}
                  tolerances={record.tolerance}
                  onToggle={(id, checked) => toggleCheck(community.value, id, checked)}
                  onTolerance={(id, value) =>
                    patch(community.value, {
                      tolerance: { ...(record.tolerance ?? {}), [id]: value },
                    })
                  }
                />
              </section>
              <div className={styles.actions}>
                <WuButton type="button" onClick={() => save(community.value, community.label)}>
                  Save protection
                </WuButton>
                <WuButton
                  type="button"
                  variant="secondary"
                  onClick={() => runLogin(community.value, community.label)}
                >
                  Try a login
                </WuButton>
                {saved?.signups ? (
                  <Link
                    className={styles.link}
                    href={`/integrity/check?entry=registration&community=${community.value}`}
                  >
                    Try a signup
                  </Link>
                ) : null}
              </div>
              {sampleNote[community.value] ? (
                <p className={styles.result}>{sampleNote[community.value]}</p>
              ) : null}
            </section>
          );
        })}
      </div>
    </PageContainer>
  );
}
