'use client';

import { useContactHubSession } from '@/hooks/useContactHubSession';
import {
  contactDisplayName,
  contactsInMultipleGroups,
  countByStatus,
  formatContactRelative,
  newContactsThisMonth,
} from '@/data/mock-contact-hub';
import styles from './ContactHub.module.css';

export function ContactOverview() {
  const { hub, visibleContacts, can } = useContactHubSession();
  const scoped = can('activity.view-org') ? hub.contacts : visibleContacts;
  const total = scoped.length;
  const active = countByStatus(scoped, 'active');
  const unsubscribed = countByStatus(scoped, 'unsubscribed');
  const bounced = countByStatus(scoped, 'bounced');
  const multiGroup = contactsInMultipleGroups(scoped);
  const addedThisMonth = newContactsThisMonth(scoped);
  const maxGrowth = Math.max(...hub.growth.map((point) => point.total), 1);

  const recentActivity = scoped
    .flatMap((contact) =>
      contact.activity.map((item) => ({
        ...item,
        contactName: contactDisplayName(contact),
      })),
    )
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total contacts</span>
          <span className={styles.statValue}>{total.toLocaleString('en-US')}</span>
          <span className={styles.statHint}>Organization directory</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Active contacts</span>
          <span className={styles.statValue}>{active.toLocaleString('en-US')}</span>
          <span className={styles.statHint}>Eligible for distribution</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>New this month</span>
          <span className={styles.statValue}>{addedThisMonth.toLocaleString('en-US')}</span>
          <span className={styles.statHint}>Added in the current month</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Unsubscribed</span>
          <span className={styles.statValue}>{unsubscribed.toLocaleString('en-US')}</span>
          <span className={styles.statHint}>Blocked from email sends</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Bounced</span>
          <span className={styles.statValue}>{bounced.toLocaleString('en-US')}</span>
          <span className={styles.statHint}>Hard bounces</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>In multiple groups</span>
          <span className={styles.statValue}>{multiGroup.toLocaleString('en-US')}</span>
          <span className={styles.statHint}>Belong to 2+ groups</span>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <section className={styles.card} aria-label="Contact growth">
          <h2 className={styles.cardTitle}>Contact growth</h2>
          <div className={styles.chart}>
            {hub.growth.map((point) => (
              <div key={point.month} className={styles.chartBarWrap}>
                <div
                  className={styles.chartBar}
                  style={{ height: `${Math.max(8, (point.total / maxGrowth) * 100)}%` }}
                  title={`${point.total.toLocaleString('en-US')} contacts`}
                />
                <span className={styles.chartLabel}>{point.month}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card} aria-label="Recent imports">
          <h2 className={styles.cardTitle}>Recent imports</h2>
          <ul className={styles.listQuiet}>
            {hub.imports.slice(0, 5).map((job) => (
              <li key={job.id}>
                <div>
                  <div>{job.fileName}</div>
                  <p className={styles.meta}>
                    {job.status === 'completed'
                      ? `${job.added} added · ${job.updated} updated · ${job.skipped} skipped`
                      : `${job.errors} row errors`}
                  </p>
                </div>
                <span className={styles.meta}>{formatContactRelative(job.importedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={styles.card} aria-label="Recent contact activity">
        <h2 className={styles.cardTitle}>Recent contact activity</h2>
        <ul className={styles.listQuiet}>
          {recentActivity.map((item) => (
            <li key={`${item.id}-${item.at}`}>
              <div>
                <div>
                  {item.contactName} · {item.label}
                </div>
                {item.detail ? <p className={styles.meta}>{item.detail}</p> : null}
              </div>
              <span className={styles.meta}>{formatContactRelative(item.at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
