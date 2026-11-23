'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { textAiSharePath, TEXT_AI_SHARE_TOKEN, type TextAiSharedDashboard } from '@/data/text-ai-sharing';

interface ShareSettings {
  token: string;
  ownerKey: string;
  enabled: boolean;
  passwordEnabled: boolean;
  showOriginalResponses: boolean;
}

interface ShareUpdate {
  enabled?: boolean;
  showOriginalResponses?: boolean;
  password?: string | null;
}

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (value) => value.toString(16).padStart(2, '0')).join('');
}

export function useTextAiDashboardShare(dashboardId: number, dashboard: TextAiSharedDashboard | null) {
  const storageKey = `text-ai-dashboard-share:v1:${dashboardId}`;
  const [settings, setSettings] = useState<ShareSettings | null | undefined>(undefined);
  const ready = settings !== undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const publishedView = useRef<string | null>(null);
  const failedView = useRef<string | null>(null);

  useEffect(() => {
    function restore() {
      let restored: ShareSettings | null = null;
      try {
        const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as ShareSettings | null;
        if (value && TEXT_AI_SHARE_TOKEN.test(value.token) && /^[a-f0-9]{64}$/.test(value.ownerKey)) restored = value;
      } catch { /* A missing or invalid management record starts with sharing off. */ }
      setSettings(restored);
    }
    function onStorage(event: StorageEvent) {
      if (event.key === storageKey) {
        publishedView.current = null;
        restore();
      }
    }
    restore();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  const update = useCallback(async (patch: ShareUpdate): Promise<string | null> => {
    if (!ready || inFlight.current) return null;
    const enabled = patch.enabled ?? settings?.enabled ?? false;
    if (enabled && !dashboard) return null;
    inFlight.current = true;
    setBusy(true);
    setError('');
    let viewJson: string | null = null;
    try {
      const owner = settings ?? { token: randomHex(16), ownerKey: randomHex(32), enabled: false, passwordEnabled: false, showOriginalResponses: false };
      if (!settings) {
        // Keep the management key before publishing, including when a response is lost.
        localStorage.setItem(storageKey, JSON.stringify(owner));
        setSettings(owner);
      }
      const next: ShareSettings = {
        ...owner,
        enabled,
        passwordEnabled: patch.password === undefined ? owner.passwordEnabled : patch.password !== null,
        showOriginalResponses: patch.showOriginalResponses ?? owner.showOriginalResponses,
      };
      const view = enabled ? { dashboard, showOriginalResponses: next.showOriginalResponses } : undefined;
      viewJson = view ? JSON.stringify(view) : null;
      const response = await fetch(`/api/text-ai-shares/${owner.token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner.ownerKey}` },
        body: JSON.stringify({ enabled: patch.enabled, password: patch.password, view }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? 'Sharing settings could not be saved. Try again.');
      }
      publishedView.current = viewJson;
      failedView.current = null;
      setSettings(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return enabled ? new URL(textAiSharePath(next.token), window.location.origin).href : null;
    } catch (caught) {
      failedView.current = viewJson;
      setError(caught instanceof Error ? caught.message : 'Sharing settings could not be saved. Try again.');
      return null;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [dashboard, ready, settings, storageKey]);

  const currentView = useMemo(() => dashboard && settings?.enabled
    ? JSON.stringify({ dashboard, showOriginalResponses: settings.showOriginalResponses }) : null, [dashboard, settings]);
  useEffect(() => {
    if (busy || !currentView || currentView === publishedView.current || currentView === failedView.current) return;
    const timer = window.setTimeout(() => {
      // Hydration restores an editor session. Publish only subsequent edits or explicit sharing actions.
      if (!publishedView.current) publishedView.current = currentView;
      else void update({});
    }, 600);
    return () => window.clearTimeout(timer);
  }, [busy, currentView, update]);

  return {
    settings, ready: ready && !!dashboard, busy, error, update,
    link: settings?.enabled ? textAiSharePath(settings.token) : null,
  };
}
