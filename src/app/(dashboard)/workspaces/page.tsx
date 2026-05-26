'use client';

import dynamic from 'next/dynamic';
import { PageContainer } from '@/components/ui/PageContainer';
import { WorkspaceCard } from '@/components/workspaces/WorkspaceCard';
import { MOCK_MY_WORKSPACES, MOCK_SHARED_WORKSPACES } from '@/data/mock-workspaces';
import styles from './page.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const SHARED_WORKSPACE_TOOLTIP =
  'Workspaces shared with you by other team members appear here.';

export default function WorkspacesPage() {
  return (
    <PageContainer>
      <div className={styles.page}>
        <section className={styles.section} aria-labelledby="my-workspace-heading">
          <h2 id="my-workspace-heading" className={styles.sectionTitle}>
            My workspace
          </h2>
          <div className={styles.cardList}>
            {MOCK_MY_WORKSPACES.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="shared-workspace-heading">
          <div className={styles.sectionHeader}>
            <h2 id="shared-workspace-heading" className={styles.sectionTitle}>
              Shared workspace
            </h2>
            <WuTooltip content={SHARED_WORKSPACE_TOOLTIP} position="bottom">
              <span className={styles.sharedBadge} aria-label={SHARED_WORKSPACE_TOOLTIP}>
                <span className="wm-science" />
              </span>
            </WuTooltip>
          </div>
          <div className={styles.cardList}>
            {MOCK_SHARED_WORKSPACES.map((workspace) => (
              <WorkspaceCard key={`shared-${workspace.id}`} workspace={workspace} />
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
