'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useContactHubSession } from '@/hooks/useContactHubSession';
import {
  CONTACT_ACCESS_SCOPE_LABEL,
  CONTACT_HUB_ROLES,
  CONTACT_HUB_TEAMS,
  CONTACT_PERMISSION_LABEL,
  GROUP_SHARE_MODE_LABEL,
  teamById,
  userById,
  type ContactAccessScope,
  type ContactHubRoleId,
  type GroupShareMode,
} from '@/data/mock-contact-hub-access';
import styles from './ContactHub.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);

type AccessTab = 'session' | 'roles' | 'teams' | 'policy';

const SCOPE_OPTIONS = (Object.keys(CONTACT_ACCESS_SCOPE_LABEL) as ContactAccessScope[]).map(
  (value) => ({ value, label: CONTACT_ACCESS_SCOPE_LABEL[value] }),
);

const SHARE_OPTIONS = (Object.keys(GROUP_SHARE_MODE_LABEL) as GroupShareMode[]).map((value) => ({
  value,
  label: GROUP_SHARE_MODE_LABEL[value],
}));

export function ContactAccessPage() {
  const { showToast } = useWuShowToast();
  const { hub, setHub, currentUser, role, users, can, switchUser } = useContactHubSession();
  const [tab, setTab] = useState<AccessTab>('session');
  const canManage = can('access.manage');

  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.name} · ${CONTACT_HUB_ROLES.find((item) => item.id === user.roleId)?.label}`,
  }));
  const selectedUser =
    userOptions.find((option) => option.value === currentUser.id) ?? userOptions[0];

  return (
    <>
      <p className={styles.meta}>
        Contacts belong to the organization. Access, ownership, and group sharing are assigned to
        users and teams — without duplicating contact records.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="Access">
        {(
          [
            ['session', 'Acting as'],
            ['roles', 'Roles'],
            ['teams', 'Teams'],
            ['policy', 'Org policy'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? styles.tabOn : styles.tab}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'session' ? (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Prototype session</h2>
          <p className={styles.meta}>
            Switch users to preview Contact Hub through each role. Permissions update immediately.
          </p>
          <div className={styles.formStack}>
            <WuSelect
              data={userOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedUser}
              onSelect={(item) => {
                const next = item as { value: string; label: string } | null;
                if (!next) return;
                switchUser(next.value);
                showToast({
                  message: `Now acting as ${next.label}.`,
                  variant: 'success',
                });
              }}
              variant="outlined"
            />
            <div className={styles.profileGrid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Role</span>
                <span className={styles.fieldValue}>{role.label}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Teams</span>
                <span className={styles.fieldValue}>
                  {currentUser.teamIds
                    .map((id) => teamById(id)?.name ?? id)
                    .join(', ') || '—'}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <span className={styles.fieldValue}>{currentUser.email}</span>
              </div>
            </div>
            <div>
              <h3 className={styles.cardTitle}>Permissions for this role</h3>
              <ul className={styles.listQuiet}>
                {role.permissions.map((permission) => (
                  <li key={permission}>
                    <span>{CONTACT_PERMISSION_LABEL[permission]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'roles' ? (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>System roles</h2>
          <p className={styles.meta}>
            Initial roles for Contact Hub. Custom roles and granular permissions can be configured
            later without changing the contact repository.
          </p>
          <ul className={styles.listQuiet}>
            {CONTACT_HUB_ROLES.map((item) => (
              <li key={item.id}>
                <div>
                  <div>{item.label}</div>
                  <p className={styles.meta}>{item.description}</p>
                  <p className={styles.meta}>
                    {item.permissions.length} permissions ·{' '}
                    {users.filter((user) => user.roleId === item.id).length} users
                  </p>
                </div>
                <span className={styles.typeBadge}>{item.id}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'teams' ? (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Teams</h2>
          <p className={styles.meta}>
            Teams own groups and receive team-scoped contacts. Membership never duplicates contacts.
          </p>
          <ul className={styles.listQuiet}>
            {CONTACT_HUB_TEAMS.map((team) => (
              <li key={team.id}>
                <div>
                  <div>{team.name}</div>
                  <p className={styles.meta}>{team.description}</p>
                  <p className={styles.meta}>
                    Members:{' '}
                    {team.memberIds
                      .map((id) => userById(id)?.name ?? id)
                      .join(', ')}
                  </p>
                </div>
                <span className={styles.meta}>{team.memberIds.length} people</span>
              </li>
            ))}
          </ul>
          {!can('teams.manage') ? (
            <p className={styles.meta}>Only Organization Admins can manage team membership.</p>
          ) : null}
        </section>
      ) : null}

      {tab === 'policy' ? (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Organization access policy</h2>
          {!canManage ? (
            <p className={styles.meta}>
              You can view policy settings. Organization Admins can change defaults.
            </p>
          ) : null}
          <div className={styles.formStack}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Default contact access scope</span>
              <WuSelect
                data={SCOPE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={SCOPE_OPTIONS.find(
                  (item) => item.value === hub.accessPolicy.defaultContactScope,
                )}
                onSelect={(item) => {
                  if (!canManage) return;
                  const next = item as { value: ContactAccessScope; label: string } | null;
                  if (!next) return;
                  setHub((current) => ({
                    ...current,
                    accessPolicy: {
                      ...current.accessPolicy,
                      defaultContactScope: next.value,
                    },
                  }));
                  showToast({ message: 'Default contact scope saved.', variant: 'success' });
                }}
                variant="outlined"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Default group sharing</span>
              <WuSelect
                data={SHARE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={SHARE_OPTIONS.find(
                  (item) => item.value === hub.accessPolicy.defaultGroupShareMode,
                )}
                onSelect={(item) => {
                  if (!canManage) return;
                  const next = item as { value: GroupShareMode; label: string } | null;
                  if (!next) return;
                  setHub((current) => ({
                    ...current,
                    accessPolicy: {
                      ...current.accessPolicy,
                      defaultGroupShareMode: next.value,
                    },
                  }));
                  showToast({ message: 'Default group sharing saved.', variant: 'success' });
                }}
                variant="outlined"
              />
            </div>
            <div className={styles.row}>
              <span className={styles.copy}>
                <strong>Import does not transfer ownership</strong>
                <span className={styles.hint}>
                  Matching an existing organization identity updates the shared record without
                  changing Created By.
                </span>
              </span>
              <WuToggle
                checked={hub.accessPolicy.importDoesNotTransferOwnership}
                disabled={!canManage}
                onChange={(checked) => {
                  setHub((current) => ({
                    ...current,
                    accessPolicy: {
                      ...current.accessPolicy,
                      importDoesNotTransferOwnership: checked,
                    },
                  }));
                  showToast({ message: 'Import ownership policy saved.', variant: 'success' });
                }}
                aria-label="Import does not transfer ownership"
              />
            </div>
            <div className={styles.profileGrid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Unique identity</span>
                <span className={styles.fieldValue}>Email (when available)</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Custom roles</span>
                <span className={styles.fieldValue}>
                  Architecture ready — configure later
                </span>
              </div>
            </div>
            {canManage ? (
              <WuButton
                type="button"
                onClick={() =>
                  showToast({
                    message: 'Organization access policy saved.',
                    variant: 'success',
                  })
                }
              >
                Save policy
              </WuButton>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function roleLabel(roleId: ContactHubRoleId): string {
  return CONTACT_HUB_ROLES.find((role) => role.id === roleId)?.label ?? roleId;
}
