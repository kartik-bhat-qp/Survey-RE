'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { contactHubPath } from '@/components/contacts/contactHubPaths';
import { useContactHubSession } from '@/hooks/useContactHubSession';
import {
  CONTACT_ACCESS_SCOPE_LABEL,
  GROUP_SHARE_MODE_LABEL,
  GROUP_SHARE_PERMISSION_LABEL,
  teamById,
  userById,
} from '@/data/mock-contact-hub-access';
import {
  contactDisplayName,
  contactIsSendable,
  formatContactDate,
  groupOwnership,
  groupSharing,
} from '@/data/mock-contact-hub';
import styles from './ContactHub.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);

export function ContactGroupDetailPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const groupId = String(params.groupId);
  const { showToast } = useWuShowToast();
  const { hub, canViewGroup, can } = useContactHubSession();
  const group = hub.groups.find((item) => item.id === groupId);
  const members = hub.contacts.filter((contact) => contact.groupIds.includes(groupId));
  const sendable = members.filter(contactIsSendable).length;

  if (!group || !canViewGroup(group)) {
    return (
      <EmptyState
        icon="wm-group"
        title="Group not available"
        description="This group is outside your sharing settings or may have been deleted."
        action={
          <Link href={contactHubPath(surveyId, 'groups')} className={styles.linkBtn}>
            Back to Groups
          </Link>
        }
      />
    );
  }

  const ownership = groupOwnership(group);
  const sharing = groupSharing(group);

  return (
    <>
      <div className={styles.backRow}>
        <Link href={contactHubPath(surveyId, 'groups')} className={styles.linkBtn}>
          ← Groups
        </Link>
      </div>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.cardTitle}>
            {group.name}{' '}
            <span className={styles.typeBadge}>
              {group.type === 'dynamic' ? 'Dynamic' : 'Static'}
            </span>
          </h2>
          <p className={styles.meta}>
            {group.description ?? 'Reusable contact group'} · Updated{' '}
            {formatContactDate(group.updatedAt)}
          </p>
        </div>
        <WuButton
          type="button"
          onClick={() =>
            showToast({
              message: `${sendable.toLocaleString('en-US')} sendable of ${members.length.toLocaleString('en-US')} in this group.`,
              variant: 'info',
            })
          }
        >
          Estimate recipients
        </WuButton>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Group size</span>
          <span className={styles.statValue}>{members.length.toLocaleString('en-US')}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Sendable</span>
          <span className={styles.statValue}>{sendable.toLocaleString('en-US')}</span>
          <span className={styles.statHint}>Excludes suppressed contacts</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Owner</span>
          <span className={styles.statValue} style={{ fontSize: 16 }}>
            {userById(ownership.createdBy)?.name ?? ownership.createdBy}
          </span>
          <span className={styles.statHint}>
            {CONTACT_ACCESS_SCOPE_LABEL[ownership.accessScope]}
            {ownership.owningTeamId
              ? ` · ${teamById(ownership.owningTeamId)?.name ?? ownership.owningTeamId}`
              : ''}
          </span>
        </div>
      </div>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Sharing</h3>
        <div className={styles.profileGrid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Visibility</span>
            <span className={styles.fieldValue}>{GROUP_SHARE_MODE_LABEL[sharing.mode]}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Shared teams</span>
            <span className={styles.fieldValue}>
              {sharing.teamIds.map((id) => teamById(id)?.name ?? id).join(', ') || '—'}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Shared users</span>
            <span className={styles.fieldValue}>
              {sharing.userIds.map((id) => userById(id)?.name ?? id).join(', ') || '—'}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Permissions</span>
            <span className={styles.fieldValue}>
              {sharing.permissions.map((item) => GROUP_SHARE_PERMISSION_LABEL[item]).join(', ')}
            </span>
          </div>
        </div>
        {!can('groups.share') ? (
          <p className={styles.meta}>Only owners and admins can change sharing settings.</p>
        ) : null}
      </section>

      {group.type === 'dynamic' ? (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>
            Rules ({(group.ruleOperator ?? 'and').toUpperCase()})
          </h3>
          {group.rules && group.rules.length > 0 ? (
            <ul className={styles.listQuiet}>
              {group.rules.map((rule) => (
                <li key={rule.id}>
                  <span>
                    {rule.field}
                    {rule.attributeId ? `:${rule.attributeId}` : ''} {rule.comparator}{' '}
                    {rule.value}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyInline}>No rules configured yet.</p>
          )}
        </section>
      ) : null}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Members</h3>
        <ul className={styles.listQuiet}>
          {members.map((contact) => (
            <li key={contact.id}>
              <div>
                <Link
                  href={contactHubPath(surveyId, 'contact', contact.id)}
                  className={styles.linkBtn}
                >
                  {contactDisplayName(contact)}
                </Link>
                <p className={styles.meta}>{contact.email ?? 'No email'}</p>
              </div>
              <span className={styles.meta}>
                {contactIsSendable(contact) ? 'Sendable' : 'Suppressed'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
