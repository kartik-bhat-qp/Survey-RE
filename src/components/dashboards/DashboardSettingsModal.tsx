'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { DashboardDataSlicersTab } from '@/components/dashboards/DashboardDataSlicersTab';
import { DashboardSharedUrlTab } from '@/components/dashboards/DashboardSharedUrlTab';
import { DashboardGlobalSettingsTab } from '@/components/dashboards/DashboardGlobalSettingsTab';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './DashboardSettingsModal.module.css';

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface DashboardSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardName: string;
  onNameChange: (name: string) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

function SettingsPlaceholder({ label }: { label: string }) {
  return (
    <p className={styles.placeholder}>
      Configure {label.toLowerCase()} for this dashboard. Settings are saved automatically in
      this prototype.
    </p>
  );
}

function GeneralTab({
  dashboardName,
  onNameChange,
  onDuplicate,
  onDeleteRequest,
}: {
  dashboardName: string;
  onNameChange: (name: string) => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
}) {
  const { showToast } = useWuShowToast();
  const [name, setName] = useState(dashboardName);

  useEffect(() => {
    setName(dashboardName);
  }, [dashboardName]);

  const handleNameBlur = (): void => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(dashboardName);
      return;
    }
    if (trimmed !== dashboardName) {
      onNameChange(trimmed);
      showToast({
        message: `Dashboard renamed to '${trimmed}'`,
        variant: 'success',
      });
    }
  };

  return (
    <div className={styles.generalPanel}>
      <WuInput
        Label="Dashboard name"
        variant="outlined"
        value={name}
        maxLength={100}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleNameBlur}
      />
      <div className={styles.actions}>
        <WuButton
          variant="secondary"
          className={styles.duplicateBtn}
          Icon={<span className="wm-content-copy" />}
          onClick={onDuplicate}
        >
          Duplicate dashboard
        </WuButton>
        <WuButton
          variant="secondary"
          className={styles.deleteBtn}
          Icon={<span className="wm-delete" />}
          onClick={onDeleteRequest}
        >
          Delete dashboard
        </WuButton>
      </div>
    </div>
  );
}

export function DashboardSettingsModal({
  open,
  onOpenChange,
  dashboardName,
  onNameChange,
  onDuplicate,
  onDelete,
}: DashboardSettingsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setDeleteConfirmOpen(false);
        setActiveTab('general');
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  const handleApplyGlobalSettings = useCallback(() => {
    showToast({
      message: 'Global settings applied to existing widgets',
      variant: 'success',
    });
  }, [showToast]);

  const handleDuplicate = useCallback(() => {
    const copyName = `${dashboardName.trim() || 'Untitled'} (Copy)`;
    onDuplicate?.();
    showToast({
      message: `'${dashboardName}' copied successfully to '${copyName}'`,
      variant: 'success',
    });
    handleOpenChange(false);
  }, [dashboardName, handleOpenChange, onDuplicate, showToast]);

  const handleDeleteConfirm = useCallback(() => {
    onDelete?.();
    handleOpenChange(false);
  }, [handleOpenChange, onDelete]);

  const tabs: IWuTabItem[] = useMemo(
    () => [
      {
        value: 'general',
        Trigger: 'General',
        Content: (
          <GeneralTab
            dashboardName={dashboardName}
            onNameChange={onNameChange}
            onDuplicate={handleDuplicate}
            onDeleteRequest={() => setDeleteConfirmOpen(true)}
          />
        ),
      },
      {
        value: 'global-settings',
        Trigger: 'Global settings',
        Content: <DashboardGlobalSettingsTab />,
      },
      {
        value: 'data-slicers',
        Trigger: 'Data slicers',
        Content: <DashboardDataSlicersTab />,
      },
      {
        value: 'design',
        Trigger: 'Design',
        Content: <SettingsPlaceholder label="Design" />,
      },
      {
        value: 'weightings',
        Trigger: 'Weightings',
        Content: <SettingsPlaceholder label="Weightings" />,
      },
      {
        value: 'ai-settings',
        Trigger: 'AI settings',
        Content: <SettingsPlaceholder label="AI settings" />,
      },
      {
        value: 'filters',
        Trigger: 'Filters',
        Content: <SettingsPlaceholder label="Filters" />,
      },
      {
        value: 'shared-url',
        Trigger: 'Shared URL',
        Content: <DashboardSharedUrlTab />,
      },
    ],
    [dashboardName, handleDuplicate, onNameChange]
  );

  if (!wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;

  return (
    <>
      {open ? (
        <WuModal
          open
          onOpenChange={handleOpenChange}
          className={styles.modal}
          variant="action"
        >
          <WuModalHeader className={`${styles.header} ${styles.modalTitle}`}>
            Dashboard settings
          </WuModalHeader>

          <WuModalContent className={styles.content}>
            <div className={styles.tabRoot}>
              <WuTab
                items={tabs}
                value={activeTab}
                onValueChange={setActiveTab}
              />
            </div>
          </WuModalContent>

          {activeTab === 'global-settings' ? (
            <WuModalFooter className={styles.globalFooter}>
              <WuButton onClick={handleApplyGlobalSettings}>
                Apply to existing widgets
              </WuButton>
            </WuModalFooter>
          ) : null}
        </WuModal>
      ) : null}

      <ConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete dashboard"
        description={`Are you sure you want to delete this dashboard '${dashboardName}'?`}
        confirmLabel="Delete"
        variant="critical"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
