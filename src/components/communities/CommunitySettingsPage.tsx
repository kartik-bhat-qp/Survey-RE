'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { IntegrityCheckToggles } from '@/components/integrity/IntegrityCheckToggles';
import { usePersistedState } from '@/hooks/usePersistedState';
import type { CommunityListItem } from '@/data/mock-communities';
import { getCommunityHome } from '@/data/mock-communities';
import type { CommunityId } from '@/data/mock-question-communities';
import {
  COMMUNITY_CHECKS,
  EMPTY_INTEGRITY_COVERAGE,
  INTEGRITY_COVERAGE_KEY,
  communityIsProtected,
  findCommunityProtection,
  normalizeCommunityChecks,
  normalizeTolerance,
  type CommunityCheckId,
  type CommunityProtectionRecord,
  type LoginCheck,
} from '@/lib/integrity/coverage';
import styles from './CommunitySettingsPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);

const LOGIN_CHOICES: { id: LoginCheck; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'sporadic', label: 'Sporadically' },
  { id: 'every', label: 'Every login' },
];

interface CommunitySettingsForm {
  name: string;
  status: string;
  description: string;
  language: string;
  timeZone: string;
  signUp: boolean;
  verifyEmail: boolean;
  moderateMembers: boolean;
  captcha: boolean;
  memberDirectory: boolean;
  ideas: boolean;
  topics: boolean;
  polls: boolean;
  header: boolean;
  footer: boolean;
  bannerUrl: string;
  customCss: string;
  welcomeEmail: boolean;
  invitationEmail: boolean;
  digest: boolean;
  profilePhoto: boolean;
  showPoints: boolean;
  termsUrl: string;
}

function defaultForm(community: CommunityListItem): CommunitySettingsForm {
  const home = getCommunityHome(community);
  return {
    name: community.name,
    status: community.status === 'Closed' ? 'Inactive' : 'Active',
    description: '',
    language: 'English',
    timeZone: '(GMT-08:00) Pacific Time',
    signUp: true,
    verifyEmail: true,
    moderateMembers: false,
    captcha: false,
    memberDirectory: true,
    ideas: true,
    topics: true,
    polls: false,
    header: true,
    footer: true,
    bannerUrl: '',
    customCss: '',
    welcomeEmail: true,
    invitationEmail: false,
    digest: false,
    profilePhoto: true,
    showPoints: false,
    termsUrl: home.portalUrl,
  };
}

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

export function CommunitySettingsPage({ community }: { community: CommunityListItem }) {
  const { showToast } = useWuShowToast();
  const [form, setForm] = usePersistedState(
    `community-settings-${community.id}`,
    defaultForm(community),
  );
  const [coverage, setCoverage] = usePersistedState(
    INTEGRITY_COVERAGE_KEY,
    EMPTY_INTEGRITY_COVERAGE,
  );
  const [draft, setDraft] = useState<CommunityProtectionRecord | null>(null);
  const record =
    draft ?? findCommunityProtection(coverage, community.id) ?? blankRecord(community.id);

  function patchForm(partial: Partial<CommunitySettingsForm>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function patchIntegrity(partial: Partial<CommunityProtectionRecord>) {
    setDraft({ ...record, ...partial });
  }

  function toggleCheck(id: CommunityCheckId, checked: boolean) {
    const current = record.checks ?? [];
    patchIntegrity({
      checks: normalizeCommunityChecks(
        checked ? [...current, id] : current.filter((item) => item !== id),
      ),
    });
  }

  function save() {
    const loginEvery = Math.max(2, Math.floor(record.loginEvery) || 10);
    const next = {
      ...record,
      loginEvery,
      checks: normalizeCommunityChecks(record.checks ?? []),
      tolerance: normalizeTolerance(
        normalizeCommunityChecks(record.checks ?? []),
        record.tolerance,
        COMMUNITY_CHECKS,
      ),
    };
    setCoverage((current) => ({
      ...current,
      communities: communityIsProtected(next)
        ? [...current.communities.filter((item) => item.communityId !== community.id), next]
        : current.communities.filter((item) => item.communityId !== community.id),
    }));
    setDraft(null);
    showToast({ message: 'Settings saved', variant: 'success' });
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <WuButton type="button" variant="secondary" onClick={save}>
          Save Changes
        </WuButton>
      </div>

      <Section title="Community settings">
        <Field label="Name">
          <WuInput
            variant="outlined"
            value={form.name}
            aria-label="Name"
            onChange={(event) => patchForm({ name: event.target.value })}
          />
        </Field>
        <Field label="Status">
          <select
            className={styles.select}
            value={form.status}
            aria-label="Status"
            onChange={(event) => patchForm({ status: event.target.value })}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </Field>
        <Field label="Description">
          <textarea
            className={styles.area}
            value={form.description}
            aria-label="Description"
            onChange={(event) => patchForm({ description: event.target.value })}
          />
        </Field>
        <Field label="Language">
          <select
            className={styles.select}
            value={form.language}
            aria-label="Language"
            onChange={(event) => patchForm({ language: event.target.value })}
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </Field>
        <Field label="Time zone">
          <select
            className={styles.select}
            value={form.timeZone}
            aria-label="Time zone"
            onChange={(event) => patchForm({ timeZone: event.target.value })}
          >
            <option>(GMT-08:00) Pacific Time</option>
            <option>(GMT-05:00) Eastern Time</option>
            <option>(GMT+00:00) UTC</option>
            <option>(GMT+05:30) India Standard Time</option>
          </select>
        </Field>
      </Section>

      <Section title="Sign up">
        <ToggleField label="Enable sign up" checked={form.signUp} onChange={(signUp) => patchForm({ signUp })} />
        <ToggleField label="Verify email" checked={form.verifyEmail} onChange={(verifyEmail) => patchForm({ verifyEmail })} />
        <ToggleField
          label="Moderate new members"
          checked={form.moderateMembers}
          onChange={(moderateMembers) => patchForm({ moderateMembers })}
        />
        <ToggleField label="Captcha" checked={form.captcha} onChange={(captcha) => patchForm({ captcha })} />
      </Section>

      <Section title="Modules">
        <ToggleField
          label="Member directory"
          checked={form.memberDirectory}
          onChange={(memberDirectory) => patchForm({ memberDirectory })}
        />
        <ToggleField label="Ideas" checked={form.ideas} onChange={(ideas) => patchForm({ ideas })} />
        <ToggleField label="Topics" checked={form.topics} onChange={(topics) => patchForm({ topics })} />
        <ToggleField label="Polls" checked={form.polls} onChange={(polls) => patchForm({ polls })} />
      </Section>

      <Section title="Theme">
        <ToggleField label="Header" checked={form.header} onChange={(header) => patchForm({ header })} />
        <ToggleField label="Footer" checked={form.footer} onChange={(footer) => patchForm({ footer })} />
        <Field label="Banner URL">
          <input
            className={styles.wide}
            value={form.bannerUrl}
            aria-label="Banner URL"
            onChange={(event) => patchForm({ bannerUrl: event.target.value })}
          />
        </Field>
        <Field label="Custom CSS">
          <input
            className={styles.wide}
            value={form.customCss}
            aria-label="Custom CSS"
            onChange={(event) => patchForm({ customCss: event.target.value })}
          />
        </Field>
      </Section>

      <Section title="Email">
        <ToggleField
          label="Welcome email"
          checked={form.welcomeEmail}
          onChange={(welcomeEmail) => patchForm({ welcomeEmail })}
        />
        <ToggleField
          label="Invitation email"
          checked={form.invitationEmail}
          onChange={(invitationEmail) => patchForm({ invitationEmail })}
        />
        <ToggleField label="Weekly digest" checked={form.digest} onChange={(digest) => patchForm({ digest })} />
      </Section>

      <Section title="Profile">
        <ToggleField
          label="Profile photo"
          checked={form.profilePhoto}
          onChange={(profilePhoto) => patchForm({ profilePhoto })}
        />
        <ToggleField label="Show points" checked={form.showPoints} onChange={(showPoints) => patchForm({ showPoints })} />
        <Field label="Terms of use URL">
          <input
            className={styles.wide}
            value={form.termsUrl}
            aria-label="Terms of use URL"
            onChange={(event) => patchForm({ termsUrl: event.target.value })}
          />
        </Field>
      </Section>

      <Section title="Integrity">
        <ToggleField
          label="Protect signups"
          checked={record.signups}
          onChange={(signups) => patchIntegrity({ signups })}
        />
        <Field label="Check logins">
          <div className={styles.choices} role="group" aria-label="Check logins">
            {LOGIN_CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={record.loginCheck === choice.id ? styles.choiceOn : styles.choice}
                onClick={() => patchIntegrity({ loginCheck: choice.id })}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </Field>
        <ToggleField
          label="Account recovery"
          checked={record.recovery}
          onChange={(recovery) => patchIntegrity({ recovery })}
        />
        <ToggleField
          label="Invitations"
          checked={record.invitations}
          onChange={(invitations) => patchIntegrity({ invitations })}
        />
        <div className={styles.checks}>
          <IntegrityCheckToggles
            items={COMMUNITY_CHECKS}
            selected={normalizeCommunityChecks(record.checks ?? [])}
            tolerances={record.tolerance}
            onToggle={toggleCheck}
            onTolerance={(id, value) =>
              patchIntegrity({ tolerance: { ...(record.tolerance ?? {}), [id]: value } })
            }
          />
        </div>
      </Section>

      <div className={styles.footer}>
        <WuButton type="button" onClick={save}>
          Save
        </WuButton>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.fields}>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.control}>{children}</div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Field label={label}>
      <WuToggle checked={checked} aria-label={label} onChange={onChange} />
    </Field>
  );
}
