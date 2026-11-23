'use client';

import { useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { textAiSharePath, type TextAiSharingState } from '@/data/text-ai-sharing';
import styles from './TextAiSharing.module.css';

export function TextAiShareModal({ dashboardId, dashboard, sharing, onChange, hasTextViewer, onClose }: {
  dashboardId: number;
  dashboard: TextAiSharingState['dashboard'];
  sharing: TextAiSharingState;
  onChange: (settings: TextAiSharingState) => void;
  hasTextViewer: boolean;
  onClose: () => void;
}) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [enterPassword, setEnterPassword] = useState(false);
  const [password, setPassword] = useState('');

  if (!wick) return null;
  const { WuButton, WuInput, WuModal, WuModalContent, WuModalHeader, WuToggle } = wick;
  const shareUrl = new URL(textAiSharePath(dashboardId), window.location.origin).href;
  const enabled = sharing.enabled && !!sharing.dashboard;

  async function copy(url: string, showError = true) {
    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: 'Link copied', variant: 'success' });
    } catch {
      if (showError) showToast({ message: 'Could not copy the link', variant: 'error' });
    }
  }

  function setSharing(nextEnabled: boolean) {
    onChange({ ...sharing, enabled: nextEnabled, dashboard: nextEnabled ? dashboard : null });
    if (nextEnabled) void copy(shareUrl, false);
    else { setEnterPassword(false); setPassword(''); }
  }

  return <WuModal open onOpenChange={open => { if (!open) onClose(); }}
    variant="action" maxWidth="560px" maxHeight="calc(100dvh - 40px)" className={styles.modal}>
    <WuModalHeader className={styles.modalHeader}>Share dashboard</WuModalHeader>
    <WuModalContent className={styles.modalContent}>
      <div className={styles.settingRow}>
        <span id="text-ai-enable-share-label">Enable dashboard sharing</span>
        <WuToggle aria-labelledby="text-ai-enable-share-label" checked={enabled}
          disabled={!dashboard} onChange={setSharing} />
      </div>
      {enabled && <>
        <div className={styles.linkRow}>
          <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>
          <WuButton variant="iconOnly" size="sm" aria-label="Copy link" Icon={<span className="wm-link" aria-hidden />}
            onClick={() => { void copy(shareUrl); }} />
        </div>
        <div className={styles.settingRow}>
          <span id="text-ai-share-password-label">Enable password</span>
          <WuToggle aria-labelledby="text-ai-share-password-label" checked={!!sharing.password || enterPassword}
            onChange={value => {
              if (value) setEnterPassword(true);
              else {
                setEnterPassword(false);
                setPassword('');
                onChange({ ...sharing, password: '' });
              }
            }} />
        </div>
        {enterPassword && <form className={styles.passwordSettings} onSubmit={event => {
          event.preventDefault();
          if (!password.trim()) return;
          onChange({ ...sharing, password });
          setEnterPassword(false);
          setPassword('');
        }}>
          <WuInput aria-label="Shared dashboard password" placeholder="Enter password" type="password"
            autoComplete="new-password" value={password} maxLength={128} onInput={event => setPassword(event.currentTarget.value)} />
          <WuButton type="submit" size="sm" disabled={!password.trim()}>Save</WuButton>
        </form>}
        {sharing.password && !enterPassword && <button type="button" className={styles.textButton}
          onClick={() => setEnterPassword(true)}>Change password</button>}
        {hasTextViewer && <div className={styles.settingRow}>
          <span id="text-ai-share-language-label">Show responses in original language</span>
          <WuToggle aria-labelledby="text-ai-share-language-label" checked={sharing.showOriginalResponses}
            onChange={value => onChange({ ...sharing, showOriginalResponses: value })} />
        </div>}
      </>}
    </WuModalContent>
  </WuModal>;
}
