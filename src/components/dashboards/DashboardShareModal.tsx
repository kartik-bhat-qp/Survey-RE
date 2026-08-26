'use client';

import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { DashboardShareSettingsFields } from './DashboardShareSettingsFields';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { sharedDashboardPath, shareSettingsError, type SharedLinkSettings } from '@/data/mock-shared-urls';
import styles from './DashboardShareModal.module.css';

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false });
const WuToggle = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })), { ssr: false });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId: number;
  dashboardName: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  settings: SharedLinkSettings;
  onSettingsChange: (settings: SharedLinkSettings) => void;
  onOpenSharedLinks: () => void;
}

export function DashboardShareModal({ open, onOpenChange, dashboardId, dashboardName, enabled, onEnabledChange, settings, onSettingsChange, onOpenSharedLinks }: Props) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  if (!wick || !open) return null;
  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;
  const shareUrl = new URL(sharedDashboardPath(dashboardId), window.location.origin).href;
  const error = enabled ? shareSettingsError(settings) : null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast({ message: 'Link copied to clipboard', variant: 'success' });
    } catch {
      showToast({ message: 'Could not copy link', variant: 'error' });
    }
  }

  return <WuModal open onOpenChange={onOpenChange} variant="action" maxWidth="600px" maxHeight="calc(100dvh - 64px)" className={styles.modal}>
    <WuModalHeader className={styles.header}>Share dashboard</WuModalHeader>
    <WuModalContent className={styles.content}>
      <div className={styles.sharingRow}>
        <span>Dashboard sharing</span>
        <WuToggle checked={enabled} onChange={onEnabledChange} aria-label="Dashboard sharing" />
      </div>
      {enabled && <>
        <div className={styles.linkRow}>
          <span className="wm-link" aria-hidden />
          <a className={styles.link} href={shareUrl} target="_blank" rel="noreferrer" title="Open shared dashboard">{shareUrl}</a>
          <WuButton variant="iconOnly" size="sm" aria-label="Copy to clipboard" Icon={<span className="wm-content-copy" />} onClick={() => void copyLink()} />
        </div>
        <DashboardShareSettingsFields layout="default" dashboardName={dashboardName} settings={settings} onChange={onSettingsChange} />
      </>}
      <p className={styles.note}>This is the default sharing profile. To create additional sharing profiles with custom permissions, go to{' '}
        <button type="button" onClick={onOpenSharedLinks}>Shared Links</button>.
      </p>
    </WuModalContent>
    <WuModalFooter className={styles.footer}>
      {error && <p className={styles.error} role="status">{error}</p>}
      <WuButton variant="link" disabled={!!error} onClick={() => onOpenChange(false)}>Done</WuButton>
    </WuModalFooter>
  </WuModal>;
}
