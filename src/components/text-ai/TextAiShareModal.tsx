'use client';

import { useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { useTextAiDashboardShare } from '@/hooks/useTextAiDashboardShare';
import styles from './TextAiSharing.module.css';

export function TextAiShareModal({ share, hasTextViewer, onClose }: {
  share: ReturnType<typeof useTextAiDashboardShare>;
  hasTextViewer: boolean;
  onClose: () => void;
}) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [enterPassword, setEnterPassword] = useState(false);
  const [password, setPassword] = useState('');

  if (!wick) return null;
  const { WuButton, WuInput, WuModal, WuModalContent, WuModalHeader, WuToggle } = wick;
  const { busy, ready, settings, link, error, update } = share;
  const shareUrl = link ? new URL(link, window.location.origin).href : null;

  async function copy(url: string, showError = true) {
    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: 'Link copied', variant: 'success' });
    } catch {
      if (showError) showToast({ message: 'Could not copy the link', variant: 'error' });
    }
  }

  async function setSharing(enabled: boolean) {
    const url = await update({ enabled });
    if (enabled && url) await copy(url, false);
    if (!enabled) { setEnterPassword(false); setPassword(''); }
  }

  return <WuModal open onOpenChange={open => { if (!open) onClose(); }}
    variant="action" maxWidth="560px" maxHeight="calc(100dvh - 40px)" className={styles.modal}>
    <WuModalHeader className={styles.modalHeader}>Share dashboard</WuModalHeader>
    <WuModalContent className={styles.modalContent}>
      <div className={styles.settingRow}>
        <span id="text-ai-enable-share-label">Enable dashboard sharing</span>
        <WuToggle aria-labelledby="text-ai-enable-share-label" checked={!!settings?.enabled}
          disabled={!ready || busy} onChange={value => { void setSharing(value); }} />
      </div>
      {shareUrl && <>
        <div className={styles.linkRow}>
          <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>
          <WuButton variant="iconOnly" size="sm" aria-label="Copy link" Icon={<span className="wm-link" aria-hidden />}
            disabled={busy} onClick={async () => {
              const url = await update({});
              if (url) await copy(url);
            }} />
        </div>
        <div className={styles.settingRow}>
          <span id="text-ai-share-password-label">Enable password</span>
          <WuToggle aria-labelledby="text-ai-share-password-label" checked={!!settings?.passwordEnabled || enterPassword}
            disabled={busy} onChange={value => {
              if (value) setEnterPassword(true);
              else {
                setEnterPassword(false);
                setPassword('');
                if (settings?.passwordEnabled) void update({ password: null });
              }
            }} />
        </div>
        {enterPassword && <form className={styles.passwordSettings} onSubmit={async event => {
          event.preventDefault();
          if (await update({ password })) { setEnterPassword(false); setPassword(''); }
        }}>
          <WuInput aria-label="Shared dashboard password" placeholder="Enter password" type="password"
            autoComplete="new-password" value={password} maxLength={128} onInput={event => setPassword(event.currentTarget.value)} />
          <WuButton type="submit" size="sm" disabled={!password.trim() || busy}>Save</WuButton>
        </form>}
        {settings?.passwordEnabled && !enterPassword && <button type="button" className={styles.textButton}
          disabled={busy} onClick={() => setEnterPassword(true)}>Change password</button>}
        {hasTextViewer && <div className={styles.settingRow}>
          <div className={styles.showSetting}><span>Show</span>
            <span id="text-ai-share-language-label">Responses in original language</span></div>
          <WuToggle aria-labelledby="text-ai-share-language-label" checked={!!settings?.showOriginalResponses}
            disabled={busy} onChange={value => { void update({ showOriginalResponses: value }); }} />
        </div>}
      </>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </WuModalContent>
  </WuModal>;
}
