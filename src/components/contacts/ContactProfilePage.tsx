'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { contactHubPath } from '@/components/contacts/contactHubPaths';
import { useContactHubSession } from '@/hooks/useContactHubSession';
import {
  CONTACT_ACCESS_SCOPE_LABEL,
  teamById,
  userById,
} from '@/data/mock-contact-hub-access';
import {
  ATTRIBUTE_TYPE_LABEL,
  CONTACT_STATUS_LABEL,
  SUPPRESSION_REASON_LABEL,
  contactDisplayName,
  contactOwnership,
  formatContactDate,
  formatContactRelative,
} from '@/data/mock-contact-hub';
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

type ProfileTab = 'profile' | 'groups' | 'activity' | 'preferences';

const MEMBERSHIP_LABEL = {
  manual: 'Manually assigned',
  dynamic: 'Dynamically calculated',
  import: 'Added by import',
} as const;

export function ContactProfilePage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const contactId = String(params.contactId);
  const { showToast } = useWuShowToast();
  const { hub, setHub, visibleGroups, can, canViewContact } = useContactHubSession();
  const [tab, setTab] = useState<ProfileTab>('profile');
  const [groupToAdd, setGroupToAdd] = useState<{ value: string; label: string } | null>(null);

  const contact = hub.contacts.find((item) => item.id === contactId);
  const availableGroups = useMemo(
    () =>
      visibleGroups
        .filter((group) => !contact?.groupIds.includes(group.id))
        .map((group) => ({ value: group.id, label: group.name })),
    [visibleGroups, contact],
  );

  if (!contact || !canViewContact(contact)) {
    return (
      <EmptyState
        icon="wm-person"
        title="Contact not available"
        description="This contact is outside your access scope or may have been deleted."
        action={
          <Link href={contactHubPath(surveyId, 'contacts')} className={styles.linkBtn}>
            Back to All Contacts
          </Link>
        }
      />
    );
  }

  const ownership = contactOwnership(contact);

  function addGroup() {
    if (!can('groups.edit') && !can('contacts.edit')) {
      showToast({ message: 'Your role cannot change group membership.', variant: 'error' });
      return;
    }
    if (!groupToAdd) {
      showToast({ message: 'Choose a group.', variant: 'error' });
      return;
    }
    setHub((current) => ({
      ...current,
      contacts: current.contacts.map((item) => {
        if (item.id !== contactId) return item;
        return {
          ...item,
          groupIds: [...item.groupIds, groupToAdd.value],
          memberships: [
            ...item.memberships,
            {
              groupId: groupToAdd.value,
              source: 'manual' as const,
              addedAt: new Date().toISOString(),
            },
          ],
          audit: [
            {
              id: `au-${Date.now()}`,
              label: `Added to ${groupToAdd.label}`,
              at: new Date().toISOString(),
              actor: 'Admin',
            },
            ...item.audit,
          ],
        };
      }),
    }));
    setGroupToAdd(null);
    showToast({ message: `Added to ${groupToAdd.label}.`, variant: 'success' });
  }

  function removeGroup(groupId: string, groupName: string) {
    setHub((current) => ({
      ...current,
      contacts: current.contacts.map((item) => {
        if (item.id !== contactId) return item;
        return {
          ...item,
          groupIds: item.groupIds.filter((id) => id !== groupId),
          memberships: item.memberships.filter((entry) => entry.groupId !== groupId),
          audit: [
            {
              id: `au-${Date.now()}`,
              label: `Removed from ${groupName}`,
              at: new Date().toISOString(),
              actor: 'Admin',
            },
            ...item.audit,
          ],
        };
      }),
    }));
    showToast({ message: `Removed from ${groupName}.`, variant: 'success' });
  }

  return (
    <>
      <div className={styles.backRow}>
        <Link href={contactHubPath(surveyId, 'contacts')} className={styles.linkBtn}>
          ← All Contacts
        </Link>
      </div>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.cardTitle}>{contactDisplayName(contact)}</h2>
          <p className={styles.meta}>
            {contact.email ?? 'No email'} · {CONTACT_STATUS_LABEL[contact.status]}
          </p>
        </div>
        <span
          className={`${styles.status} ${
            contact.status === 'active'
              ? styles.statusActive
              : contact.status === 'bounced' || contact.status === 'invalid'
                ? styles.statusBounced
                : styles.statusUnsubscribed
          }`}
        >
          {CONTACT_STATUS_LABEL[contact.status]}
        </span>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Contact profile">
        {(
          [
            ['profile', 'Profile'],
            ['groups', 'Groups'],
            ['activity', 'Activity'],
            ['preferences', 'Preferences'],
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

      {tab === 'profile' ? (
        <div className={styles.card}>
          <div className={styles.profileGrid}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Name</span>
              <span className={styles.fieldValue}>{contactDisplayName(contact)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Email</span>
              <span className={styles.fieldValue}>{contact.email ?? '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Phone</span>
              <span className={styles.fieldValue}>{contact.phone ?? '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Organization</span>
              <span className={styles.fieldValue}>{contact.organization ?? '—'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Country</span>
              <span className={styles.fieldValue}>{contact.country}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Date created</span>
              <span className={styles.fieldValue}>{formatContactDate(contact.dateAdded)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Last updated</span>
              <span className={styles.fieldValue}>{formatContactDate(contact.lastUpdated)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Organization identity</span>
              <span className={styles.fieldValue}>
                {contact.organizationIdentity ?? contact.email ?? contact.id}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Created By</span>
              <span className={styles.fieldValue}>
                {userById(ownership.createdBy)?.name ?? ownership.createdBy}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Last Modified By</span>
              <span className={styles.fieldValue}>
                {userById(ownership.lastModifiedBy)?.name ?? ownership.lastModifiedBy}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Owning Team</span>
              <span className={styles.fieldValue}>
                {ownership.owningTeamId
                  ? (teamById(ownership.owningTeamId)?.name ?? ownership.owningTeamId)
                  : '—'}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Access Scope</span>
              <span className={styles.fieldValue}>
                {CONTACT_ACCESS_SCOPE_LABEL[ownership.accessScope]}
              </span>
            </div>
          </div>
          <h3 className={styles.cardTitle}>Custom attributes</h3>
          <div className={styles.profileGrid}>
            {hub.attributes.map((attr) => {
              const value = contact.attributes[attr.id];
              const display = Array.isArray(value)
                ? value.join(', ')
                : value === undefined || value === ''
                  ? '—'
                  : String(value);
              return (
                <div key={attr.id} className={styles.field}>
                  <span className={styles.fieldLabel}>
                    {attr.name} · {ATTRIBUTE_TYPE_LABEL[attr.type]}
                  </span>
                  <span className={styles.fieldValue}>{display}</span>
                </div>
              );
            })}
          </div>
          <h3 className={styles.cardTitle}>Audit history</h3>
          {contact.audit.length === 0 ? (
            <p className={styles.emptyInline}>No audited changes yet.</p>
          ) : (
            <ul className={styles.listQuiet}>
              {contact.audit.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <div>{entry.label}</div>
                    <p className={styles.meta}>{entry.actor}</p>
                  </div>
                  <span className={styles.meta}>{formatContactRelative(entry.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'groups' ? (
        <div className={styles.card}>
          <div className={styles.toolbar}>
            <h3 className={styles.cardTitle}>Group membership</h3>
            <div className={styles.toolbarRight}>
              <WuSelect
                data={availableGroups}
                accessorKey={{ value: 'value', label: 'label' }}
                value={groupToAdd}
                onSelect={(item) =>
                  setGroupToAdd((item as { value: string; label: string } | null) ?? null)
                }
                placeholder="Add to group"
                variant="outlined"
              />
              <WuButton type="button" onClick={addGroup}>
                Add
              </WuButton>
            </div>
          </div>
          <ul className={styles.listQuiet}>
            {contact.memberships.map((entry) => {
              const group = hub.groups.find((item) => item.id === entry.groupId);
              if (!group) return null;
              return (
                <li key={`${entry.groupId}-${entry.addedAt}`}>
                  <div>
                    <div>
                      {group.name}{' '}
                      <span className={styles.typeBadge}>
                        {group.type === 'dynamic' ? 'Dynamic' : 'Static'}
                      </span>
                    </div>
                    <p className={styles.meta}>
                      {MEMBERSHIP_LABEL[entry.source]} · Added{' '}
                      {formatContactDate(entry.addedAt)}
                    </p>
                  </div>
                  {entry.source !== 'dynamic' ? (
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => removeGroup(group.id, group.name)}
                    >
                      Remove
                    </button>
                  ) : (
                    <span className={styles.meta}>Managed by rules</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {tab === 'activity' ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Activity</h3>
          <ul className={styles.listQuiet}>
            {contact.activity.map((item) => (
              <li key={item.id}>
                <div>
                  <div>{item.label}</div>
                  {item.detail ? <p className={styles.meta}>{item.detail}</p> : null}
                </div>
                <span className={styles.meta}>{formatContactRelative(item.at)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.meta}>
            Last interaction {formatContactRelative(contact.lastActivity)}
          </p>
        </div>
      ) : null}

      {tab === 'preferences' ? (
        <div className={styles.card}>
          <div className={styles.profileGrid}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Email subscription</span>
              <WuToggle
                checked={contact.consent.emailSubscribed}
                onChange={(checked) => {
                  setHub((current) => ({
                    ...current,
                    contacts: current.contacts.map((item) =>
                      item.id === contactId
                        ? {
                            ...item,
                            consent: {
                              ...item.consent,
                              emailSubscribed: checked,
                              unsubscribedAt: checked
                                ? undefined
                                : new Date().toISOString(),
                            },
                            status: checked && item.status === 'unsubscribed' ? 'active' : item.status,
                          }
                        : item,
                    ),
                  }));
                  showToast({
                    message: checked ? 'Email subscription enabled.' : 'Contact unsubscribed.',
                    variant: 'success',
                  });
                }}
                aria-label="Email subscription"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>SMS opt-in</span>
              <WuToggle
                checked={contact.consent.smsOptIn}
                onChange={(checked) => {
                  setHub((current) => ({
                    ...current,
                    contacts: current.contacts.map((item) =>
                      item.id === contactId
                        ? { ...item, consent: { ...item.consent, smsOptIn: checked } }
                        : item,
                    ),
                  }));
                  showToast({ message: 'Communication preference saved.', variant: 'success' });
                }}
                aria-label="SMS opt-in"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Unsubscribe date</span>
              <span className={styles.fieldValue}>
                {contact.consent.unsubscribedAt
                  ? formatContactDate(contact.consent.unsubscribedAt)
                  : '—'}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Suppression status</span>
              <span className={styles.fieldValue}>
                {contact.suppression
                  ? SUPPRESSION_REASON_LABEL[contact.suppression.reason]
                  : 'Not suppressed'}
              </span>
            </div>
            {contact.suppression ? (
              <>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Suppressed on</span>
                  <span className={styles.fieldValue}>
                    {formatContactDate(contact.suppression.at)}
                  </span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Reason detail</span>
                  <span className={styles.fieldValue}>
                    {contact.suppression.note ?? '—'}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
