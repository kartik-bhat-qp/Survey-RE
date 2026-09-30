'use client';

import { useReducer, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { PageContainer } from '@/components/ui/PageContainer';
import { WorkspaceCard } from '@/components/workspaces/WorkspaceCard';
import { MOCK_MY_WORKSPACES, MOCK_SHARED_WORKSPACES } from '@/data/mock-workspaces';
import { CSM_WORKSPACE_MESSAGE, createIndividualWorkspace, deleteIndividualWorkspace, workspaceCapacity, workspaceDeleteError, type WorkspaceQuotaState } from '@/data/workspace-quota';
import styles from './page.module.css';

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => m.WuButton), { ssr: false });
const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => m.WuInput), { ssr: false });
const WuTooltip = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => m.WuTooltip), { ssr: false });
interface WorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  critical?: boolean;
  children: ReactNode;
  footer: ReactNode;
}
// Load the dialog and its title together so the first render is accessible.
const WorkspaceModal = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({
  default: function WorkspaceModalContent({ open, onOpenChange, title, critical, children, footer }: WorkspaceModalProps) {
    return <m.WuModal open={open} onOpenChange={onOpenChange} size="sm" variant={critical ? 'critical' : 'action'}>
      <m.WuModalHeader>{title}</m.WuModalHeader>
      <m.WuModalContent>{children}</m.WuModalContent>
      <m.WuModalFooter>{footer}</m.WuModalFooter>
    </m.WuModal>;
  },
})), { ssr: false });

const INITIAL_QUOTA: WorkspaceQuotaState = {
  purchasedSlots: 3, quotaStatus: 'ready',
  workspaces: [
    ...MOCK_MY_WORKSPACES.map((workspace) => ({ ...workspace, ownerId: 'kartik', kind: 'individual' as const })),
    { id: 100, name: 'Alex Morgan', ownerId: 'alex', kind: 'individual', scope: 'mine', updatedAt: '2026-09-30', stats: { dashboards: 0, surveyStacks: 0, biVariables: 0, reports: 0 } },
    { id: 101, name: 'Organization workspace', ownerId: null, kind: 'organization', scope: 'shared', updatedAt: '2026-09-30', stats: { dashboards: 8, surveyStacks: 2, biVariables: 4, reports: 3 } },
  ],
};
type State = { quota: WorkspaceQuotaState; message: string; error: string; modal: 'create' | number | null };
type Action =
  | { type: 'open'; modal: State['modal'] }
  | { type: 'create'; userId: string; name: string }
  | { type: 'delete'; userId: string; id: number }
  | { type: 'scenario'; scenario: 'grant' | 'full' | 'loading' | 'error' | 'ready' | 'reset' };
function reducer(state: State, action: Action): State {
  if (action.type === 'open') return { ...state, modal: action.modal, error: '' };
  if (action.type === 'create' || action.type === 'delete') {
    const result = action.type === 'create'
      ? createIndividualWorkspace(state.quota, action.userId, action.name, new Date().toISOString().slice(0, 10))
      : deleteIndividualWorkspace(state.quota, action.userId, action.id);
    return { ...state, quota: result.state, error: result.error ?? '', modal: result.error ? state.modal : null,
      message: result.error ? '' : action.type === 'create' ? 'Workspace created.' : 'Workspace deleted. One additional workspace slot is available again.' };
  }
  if (action.scenario === 'reset') return { quota: INITIAL_QUOTA, message: '', error: '', modal: null };
  let quota = { ...state.quota };
  if (action.scenario === 'grant') quota = { ...quota, purchasedSlots: quota.purchasedSlots + 1, quotaStatus: 'ready' };
  else if (action.scenario === 'full') {
    quota = { ...quota, quotaStatus: 'ready' };
    while (workspaceCapacity(quota).available > 0) quota = createIndividualWorkspace(quota, 'alex', `Team project ${quota.workspaces.length}`, '2026-09-30').state;
  } else quota.quotaStatus = action.scenario;
  return { ...state, quota, error: '', message: '' };
}

export default function WorkspacesPage() {
  const [state, dispatch] = useReducer(reducer, { quota: INITIAL_QUOTA, message: '', error: '', modal: null });
  const [userId, setUserId] = useState('kartik');
  const [name, setName] = useState('');
  const capacity = workspaceCapacity(state.quota);
  const mine = state.quota.workspaces.filter((workspace) => workspace.ownerId === userId);
  const organization = state.quota.workspaces.find((workspace) => workspace.kind === 'organization')!;
  const isReady = state.quota.quotaStatus === 'ready';
  const createReason = !isReady
    ? state.quota.quotaStatus === 'loading' ? 'Checking workspace availability…' : 'Workspace availability could not be verified. Please try again.'
    : capacity.available === 0 ? CSM_WORKSPACE_MESSAGE : '';
  const deleting = typeof state.modal === 'number' ? state.quota.workspaces.find((workspace) => workspace.id === state.modal) : null;
  const deletionReason = deleting ? workspaceDeleteError(state.quota, deleting.id, userId) : null;
  return (
    <PageContainer>
      <div className={styles.page}>
        <header className={styles.header}>
          <div><h1 className={styles.title}>Workspaces</h1><p className={styles.helper}>Organize your BI projects in individual workspaces.</p></div>
          <WuTooltip content={createReason || 'Create an individual workspace'} position="bottom">
            <span className={styles.actionTrigger} tabIndex={createReason ? 0 : undefined} aria-label={createReason || undefined}>
              <WuButton disabled={!!createReason} onClick={() => { setName(''); dispatch({ type: 'open', modal: 'create' }); }}>Create Workspace</WuButton>
            </span>
          </WuTooltip>
        </header>
        <div className={styles.quotaBanner}>
          <div><strong>{isReady ? `${capacity.available} additional workspace${capacity.available === 1 ? '' : 's'} available` : state.quota.quotaStatus === 'loading' ? 'Checking workspace availability…' : 'Workspace availability is unavailable'}</strong>
            <p className={styles.helper}>{isReady ? `${capacity.used} of ${capacity.total} purchased slots in use across your organization. Each user also retains one included individual workspace.` : 'Your existing workspaces remain accessible.'}</p>
            {isReady && capacity.available === 0 && <p className={styles.helper}>{CSM_WORKSPACE_MESSAGE}</p>}
          </div>
          {!isReady && state.quota.quotaStatus === 'error' && <WuButton variant="secondary" onClick={() => dispatch({ type: 'scenario', scenario: 'ready' })}>Retry</WuButton>}
        </div>
        {state.message && <p className={styles.success} role="status">{state.message}</p>}
        <section className={styles.section} aria-labelledby="my-workspace-heading">
          <h2 id="my-workspace-heading" className={styles.sectionTitle}>My workspaces <span className={styles.count}>{mine.length}</span></h2>
          <div className={styles.cardList}>{mine.map((workspace) => {
            const reason = workspaceDeleteError(state.quota, workspace.id, userId);
            return <div key={workspace.id} className={styles.workspaceRow}>
              <WorkspaceCard workspace={workspace} />
              <WuTooltip content={reason || `Delete ${workspace.name}`} position="left">
                <span className={styles.actionTrigger} tabIndex={reason ? 0 : undefined} aria-label={reason || undefined}>
                  <WuButton variant="link" color="error" disabled={!!reason} aria-label={`Delete ${workspace.name}`} onClick={() => dispatch({ type: 'open', modal: workspace.id })}>Delete</WuButton>
                </span>
              </WuTooltip>
            </div>;
          })}</div>
          {mine.length === 1 && <p className={styles.helper}>You must keep at least one individual workspace.</p>}
        </section>
        <section className={styles.section} aria-labelledby="organization-workspace-heading">
          <h2 id="organization-workspace-heading" className={styles.sectionTitle}>Organization workspace</h2>
          <p className={styles.helper}>One shared workspace for your organization. Additional organization workspaces cannot be purchased.</p>
          <WorkspaceCard workspace={organization} />
        </section>
        <section className={styles.section} aria-labelledby="shared-workspace-heading">
          <h2 id="shared-workspace-heading" className={styles.sectionTitle}>Shared with me</h2>
          <p className={styles.helper}>Individual workspaces shared by other people. Sharing does not consume another slot.</p>
          {MOCK_SHARED_WORKSPACES.map((workspace) => <WorkspaceCard key={workspace.id} workspace={workspace} />)}
        </section>
        <details className={styles.demo}>
          <summary>Prototype scenarios</summary>
          <p>Synthetic, page-local data. These controls simulate the admin API and other users; no purchase or external deletion occurs.</p>
          <div className={styles.demoActions}>
            <label>View as <select value={userId} onChange={(event) => { setUserId(event.target.value); dispatch({ type: 'open', modal: null }); }}><option value="kartik">Kartik Bhat</option><option value="alex">Alex Morgan</option></select></label>
            <WuButton variant="secondary" onClick={() => dispatch({ type: 'scenario', scenario: 'grant' })}>Simulate purchase: +1 slot</WuButton>
            <WuButton variant="secondary" onClick={() => dispatch({ type: 'scenario', scenario: 'full' })}>Another user takes available slots</WuButton>
            <WuButton variant="secondary" onClick={() => dispatch({ type: 'scenario', scenario: 'loading' })}>API loading</WuButton>
            <WuButton variant="secondary" onClick={() => dispatch({ type: 'scenario', scenario: 'error' })}>API unavailable</WuButton>
            <WuButton variant="secondary" onClick={() => dispatch({ type: 'scenario', scenario: 'ready' })}>Refresh quota</WuButton>
            <WuButton variant="secondary" onClick={() => { setUserId('kartik'); dispatch({ type: 'scenario', scenario: 'reset' }); }}>Reset demo</WuButton>
          </div>
        </details>
      </div>
      <WorkspaceModal title="Create Workspace" open={state.modal === 'create'} onOpenChange={(open) => { if (!open) dispatch({ type: 'open', modal: null }); }} footer={<><WuButton variant="secondary" onClick={() => dispatch({ type: 'open', modal: null })}>Cancel</WuButton><WuButton type="submit" form="create-workspace" disabled={!name.trim() || !!createReason}>Create</WuButton></>}>
          <form id="create-workspace" onSubmit={(event) => { event.preventDefault(); dispatch({ type: 'create', userId, name }); }} className={styles.form}>
            <label htmlFor="workspace-name">Workspace name</label>
            <WuInput id="workspace-name" autoFocus variant="outlined" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} aria-describedby="workspace-create-help" />
            <p id="workspace-create-help" className={styles.helper}>This individual workspace belongs to you and uses one of your organization’s additional workspace slots.</p>
            {(state.error || createReason) && <p role="alert" className={styles.error}>{state.error || createReason}</p>}
          </form>
      </WorkspaceModal>
      <WorkspaceModal title="Delete workspace?" critical open={!!deleting} onOpenChange={(open) => { if (!open) dispatch({ type: 'open', modal: null }); }} footer={<><WuButton variant="secondary" onClick={() => dispatch({ type: 'open', modal: null })}>Cancel</WuButton><WuButton color="error" disabled={!!deletionReason} onClick={() => { if (deleting) dispatch({ type: 'delete', userId, id: deleting.id }); }}>Delete workspace</WuButton></>}><p>Delete “{deleting?.name}” and its contents? This action cannot be undone. One slot will become available to anyone in your organization after deletion succeeds.</p>
          {(state.error || deletionReason) && <p role="alert" className={styles.error}>{state.error || deletionReason}</p>}
      </WorkspaceModal>
    </PageContainer>
  );
}
