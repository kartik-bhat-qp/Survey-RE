'use client';

import { useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CommunitySettingsPage } from '@/components/communities/CommunitySettingsPage';
import { getCommunityHome, type CommunityListItem } from '@/data/mock-communities';
import styles from './CommunityInterior.module.css';

const AREAS = [
  { id: 'community', label: 'Community', icon: 'wm-groups' },
  { id: 'send', label: 'Send', icon: 'wm-send' },
  { id: 'incentive', label: 'Incentive', icon: 'wm-redeem' },
  { id: 'modules', label: 'Modules', icon: 'wm-widgets' },
  { id: 'analytics', label: 'Analytics', icon: 'wm-insert-chart' },
] as const;

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'wm-dashboard' },
  { id: 'settings', label: 'Settings', icon: 'wm-settings' },
  { id: 'content', label: 'Content', icon: 'wm-article' },
  { id: 'languages', label: 'Languages', icon: 'wm-language' },
  { id: 'media', label: 'Media library', icon: 'wm-perm-media' },
  { id: 'profile', label: 'Profile', icon: 'wm-badge' },
  { id: 'members', label: 'Members', icon: 'wm-group' },
  { id: 'recruitment', label: 'Recruitment', icon: 'wm-public' },
] as const;

type AreaId = (typeof AREAS)[number]['id'];
type SectionId = (typeof SECTIONS)[number]['id'];

const POLL_OPTIONS = [
  { label: 'Option 1', value: 0.35 },
  { label: 'Option 2', value: 0.08 },
  { label: 'Other', value: 0.04 },
];

export function CommunityInterior({ community }: { community: CommunityListItem }) {
  const { showToast } = useWuShowToast();
  const home = getCommunityHome(community);
  const [area, setArea] = useState<AreaId>('community');
  const [section, setSection] = useState<SectionId>('dashboard');

  async function copyPortalLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(home.portalUrl);
      showToast({ message: 'Portal link copied', variant: 'success' });
    } catch {
      showToast({ message: 'Unable to copy portal link', variant: 'error' });
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.primary} role="tablist" aria-label="Community">
        {AREAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={area === item.id}
            className={area === item.id ? styles.primaryOn : styles.primaryTab}
            onClick={() => setArea(item.id)}
          >
            <span className={item.icon} aria-hidden />
            {item.label}
          </button>
        ))}
      </div>

      {area === 'community' ? (
        <div className={styles.subbar}>
          <nav className={styles.subnav} aria-label="Community sections">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={section === item.id ? styles.subOn : styles.subTab}
                aria-current={section === item.id ? 'page' : undefined}
                onClick={() => setSection(item.id)}
              >
                <span className={item.icon} aria-hidden />
                {item.label}
              </button>
            ))}
          </nav>
          <div className={styles.portal}>
            <button
              type="button"
              className={styles.portalMenu}
              onClick={() => showToast({ message: 'Portal Link', variant: 'success' })}
            >
              Portal Link
              <span className="wm-expand-more" aria-hidden />
            </button>
            <input className={styles.portalUrl} readOnly value={home.portalUrl} aria-label="Portal link" />
            <button type="button" className={styles.portalIcon} aria-label="Copy portal link" onClick={() => void copyPortalLink()}>
              <span className="wm-content-copy" aria-hidden />
            </button>
            <button
              type="button"
              className={styles.portalIcon}
              aria-label="Open portal link"
              onClick={() => window.open(home.portalUrl, '_blank', 'noopener,noreferrer')}
            >
              <span className="wm-open-in-new" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.content}>
        {area === 'community' && section === 'dashboard' ? (
          <CommunityDashboard community={community} />
        ) : null}
        {area === 'community' && section === 'settings' ? (
          <CommunitySettingsPage community={community} />
        ) : null}
        {area === 'community' && section !== 'dashboard' && section !== 'settings' ? (
          <SectionPlaceholder
            label={SECTIONS.find((item) => item.id === section)?.label ?? 'Community'}
            onOpen={() =>
              showToast({
                message: `${SECTIONS.find((item) => item.id === section)?.label} for ${community.name}`,
                variant: 'success',
              })
            }
          />
        ) : null}
        {area !== 'community' ? (
          <SectionPlaceholder
            label={AREAS.find((item) => item.id === area)?.label ?? 'Community'}
            onOpen={() =>
              showToast({
                message: `${AREAS.find((item) => item.id === area)?.label} for ${community.name}`,
                variant: 'success',
              })
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function SectionPlaceholder({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <div className={styles.placeholder}>
      <h2>{label}</h2>
      <button type="button" className={styles.placeholderBtn} onClick={onOpen}>
        Open {label}
      </button>
    </div>
  );
}

function CommunityDashboard({ community }: { community: CommunityListItem }) {
  const home = getCommunityHome(community);
  return (
    <div className={styles.dashboard}>
      <div className={styles.stats}>
        <article className={`${styles.stat} ${styles.members}`}>
          <span className={`wm-group ${styles.statIcon}`} aria-hidden />
          <div>
            <h2>Members</h2>
            <p className={styles.statValue}>{home.verifiedMembers.toLocaleString()}</p>
            <p>Total verified members</p>
            <p className={styles.statMeta}>▲ {home.newSignups.toLocaleString()} New signups</p>
          </div>
        </article>
        <article className={`${styles.stat} ${styles.topics}`}>
          <span className={`wm-forum ${styles.statIcon}`} aria-hidden />
          <div>
            <h2>Topics</h2>
            <p className={styles.statValue}>{home.newTopics.toLocaleString()}</p>
            <p>New topics</p>
            <p className={styles.statMeta}>
              ◆ {home.topicCategories.toLocaleString()} Categories
              <span>{home.topicComments.toLocaleString()} New comments</span>
            </p>
          </div>
        </article>
        <article className={`${styles.stat} ${styles.ideas}`}>
          <span className={`wm-lightbulb ${styles.statIcon}`} aria-hidden />
          <div>
            <h2>Ideas</h2>
            <p className={styles.statValue}>{home.newIdeas.toLocaleString()}</p>
            <p>New ideas</p>
            <p className={styles.statMeta}>
              ◆ {home.ideaCampaigns.toLocaleString()} Campaigns
              <span>{home.ideaComments.toLocaleString()} New comments</span>
            </p>
          </div>
        </article>
      </div>

      <div className={styles.panels}>
        <section className={styles.panel} aria-label="Surveys">
          <h2>Surveys</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Surveys</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </section>
        <section className={styles.panel} aria-label="Poll">
          <h2>Poll</h2>
          <p className={styles.pollName}>sd</p>
          <div className={styles.poll}>
            {POLL_OPTIONS.map((option) => (
              <div key={option.label} className={styles.pollRow}>
                <span>{option.label}</span>
                <span className={styles.pollTrack}>
                  <span className={styles.pollBar} style={{ height: `${Math.max(option.value * 100, 4)}%` }} />
                </span>
              </div>
            ))}
          </div>
          <div className={styles.pollScale} aria-hidden>
            <span>0</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </div>
        </section>
        <section className={styles.panel} aria-label="New member sign ups">
          <h2>New member sign ups</h2>
          <p className={styles.emptyNote}>{home.signupNote}</p>
        </section>
      </div>
    </div>
  );
}
