'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  CONTACT_HUB_NAV,
  contactHubBasePath,
  contactHubPath,
  contactHubSectionFromPathname,
} from '@/components/contacts/contactHubPaths';
import { useContactHubSession } from '@/hooks/useContactHubSession';
import { teamById } from '@/data/mock-contact-hub-access';
import styles from './ContactHub.module.css';

export function ContactHubShell({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const surveyId = Number(params.id);
  const active = contactHubSectionFromPathname(pathname, surveyId);
  const base = contactHubBasePath(surveyId);
  const { currentUser, role, visibleContacts, visibleGroups } = useContactHubSession();

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contacts</h1>
        <p className={styles.lede}>
          Organization contact repository — one identity per person, shared across users, teams,
          surveys, and communities.
        </p>
        <nav className={styles.nav} aria-label="Contacts">
          {CONTACT_HUB_NAV.map((item) => {
            const href = `${base}${item.path}`;
            const isActive = active === item.id;
            return (
              <Link
                key={item.id}
                href={href}
                className={isActive ? styles.navLinkActive : styles.navLink}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className={styles.sessionBar}>
        <span>
          Acting as <strong>{currentUser.name}</strong> · {role.label} ·{' '}
          {currentUser.teamIds.map((id) => teamById(id)?.name ?? id).join(', ') || 'No team'}
        </span>
        <span className={styles.meta}>
          {visibleContacts.length} contacts · {visibleGroups.length} groups visible ·{' '}
          <Link href={contactHubPath(surveyId, 'access')} className={styles.linkBtn}>
            Switch user / Access
          </Link>
        </span>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
