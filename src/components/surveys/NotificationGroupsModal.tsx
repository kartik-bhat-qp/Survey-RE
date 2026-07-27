'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  createNotificationGroup,
  createNotificationGroupMember,
  type SurveyNotificationGroup,
  type SurveyNotificationGroupMember,
} from '@/data/mock-survey-notifications';
import { isValidEmailAddress, normalizeEmailAddress } from '@/data/mock-survey-distribute';
import styles from './NotificationGroupsModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

interface NotificationGroupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: SurveyNotificationGroup[];
  onChange: (groups: SurveyNotificationGroup[]) => void;
}

type EditorMode = 'list' | 'create' | 'edit';

function memberCountLabel(count: number): string {
  return `${count} member${count === 1 ? '' : 's'}`;
}

function emptyMemberDraft(): SurveyNotificationGroupMember {
  return createNotificationGroupMember();
}

export function NotificationGroupsModal({
  open,
  onOpenChange,
  groups,
  onChange,
}: NotificationGroupsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [mode, setMode] = useState<EditorMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<SurveyNotificationGroupMember[]>([emptyMemberDraft()]);
  const [deleteTarget, setDeleteTarget] = useState<SurveyNotificationGroup | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode('list');
    setEditingId(null);
    setGroupName('');
    setMembers([emptyMemberDraft()]);
    setDeleteTarget(null);
  }, [open]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose } = wick;

  function resetEditor(): void {
    setMode('list');
    setEditingId(null);
    setGroupName('');
    setMembers([emptyMemberDraft()]);
  }

  function startCreate(): void {
    setMode('create');
    setEditingId(null);
    setGroupName('');
    setMembers([emptyMemberDraft()]);
  }

  function startEdit(group: SurveyNotificationGroup): void {
    setMode('edit');
    setEditingId(group.id);
    setGroupName(group.name);
    setMembers(
      group.members.length > 0
        ? group.members.map((member) => ({ ...member }))
        : [emptyMemberDraft()]
    );
  }

  function updateMember(
    memberId: string,
    patch: Partial<SurveyNotificationGroupMember>
  ): void {
    setMembers((prev) =>
      prev.map((member) => (member.id === memberId ? { ...member, ...patch } : member))
    );
  }

  function addMemberRow(): void {
    setMembers((prev) => [...prev, emptyMemberDraft()]);
  }

  function removeMemberRow(memberId: string): void {
    setMembers((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((member) => member.id !== memberId);
    });
  }

  function handleSaveGroup(): void {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      showToast({ message: 'Enter a notification group name', variant: 'error' });
      return;
    }

    const cleanedMembers: SurveyNotificationGroupMember[] = [];
    const seenEmails = new Set<string>();

    for (const member of members) {
      const email = normalizeEmailAddress(member.email);
      const firstName = member.firstName.trim();
      const lastName = member.lastName.trim();
      const hasAny = email || firstName || lastName;
      if (!hasAny) continue;

      if (!email || !isValidEmailAddress(email)) {
        showToast({ message: 'Enter a valid email address for each member', variant: 'error' });
        return;
      }
      if (seenEmails.has(email)) {
        showToast({ message: 'Duplicate email addresses are not allowed', variant: 'error' });
        return;
      }
      seenEmails.add(email);
      cleanedMembers.push({
        id: member.id,
        email,
        firstName,
        lastName,
      });
    }

    if (cleanedMembers.length === 0) {
      showToast({ message: 'Add at least one member with an email address', variant: 'error' });
      return;
    }

    if (mode === 'edit' && editingId) {
      onChange(
        groups.map((group) =>
          group.id === editingId
            ? { ...group, name: trimmedName, members: cleanedMembers }
            : group
        )
      );
      showToast({ message: 'Notification group updated', variant: 'success' });
    } else {
      onChange([
        createNotificationGroup({ name: trimmedName, members: cleanedMembers }),
        ...groups,
      ]);
      showToast({ message: 'Notification group created', variant: 'success' });
    }

    resetEditor();
  }

  function handleConfirmDelete(): void {
    if (!deleteTarget) return;
    onChange(groups.filter((group) => group.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast({ message: 'Notification group deleted', variant: 'success' });
  }

  const headerTitle =
    mode === 'create'
      ? 'New Notification Group'
      : mode === 'edit'
        ? 'Edit Notification Group'
        : 'Notification Groups';

  return (
    <>
      <WuModal open onOpenChange={onOpenChange} className={styles.modal} variant="action" size="lg">
        <WuModalHeader className={styles.header}>{headerTitle}</WuModalHeader>
        <WuModalContent className={styles.content}>
          {mode === 'list' ? (
            <>
              <div className={styles.listToolbar}>
                <WuButton onClick={startCreate}>+ New Notification Group</WuButton>
              </div>

              {groups.length === 0 ? (
                <EmptyState
                  icon="wm-notifications"
                  title="No notification groups"
                  description="Create a group of email addresses for report and data schedulers."
                />
              ) : (
                <div className={styles.groupList}>
                  {groups.map((group) => (
                    <div key={group.id} className={styles.groupRow}>
                      <div className={styles.groupInfo}>
                        <button
                          type="button"
                          className={styles.groupNameLink}
                          onClick={() => startEdit(group)}
                        >
                          {group.name}
                        </button>
                        <span className={styles.groupMeta}>
                          {memberCountLabel(group.members.length)}
                        </span>
                      </div>
                      <div className={styles.groupActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label={`Edit ${group.name}`}
                          onClick={() => startEdit(group)}
                        >
                          <span className="wm-edit" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          aria-label={`Delete ${group.name}`}
                          onClick={() => setDeleteTarget(group)}
                        >
                          <span className="wm-delete" aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.editor}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Group name</span>
                <WuInput
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Enter group name"
                  aria-label="Group name"
                />
              </label>

              <div className={styles.membersSection}>
                <div className={styles.membersHeader}>
                  <span className={styles.fieldLabel}>Members</span>
                  <button type="button" className={styles.addMemberBtn} onClick={addMemberRow}>
                    + Add member
                  </button>
                </div>

                <div className={styles.membersTable}>
                  <div className={styles.membersTableHeader}>
                    <div>Email</div>
                    <div>First name</div>
                    <div>Last name</div>
                    <div aria-hidden />
                  </div>
                  {members.map((member) => (
                    <div key={member.id} className={styles.membersTableRow}>
                      <WuInput
                        value={member.email}
                        onChange={(event) =>
                          updateMember(member.id, { email: event.target.value })
                        }
                        placeholder="name@example.com"
                        aria-label="Email"
                      />
                      <WuInput
                        value={member.firstName}
                        onChange={(event) =>
                          updateMember(member.id, { firstName: event.target.value })
                        }
                        placeholder="First name"
                        aria-label="First name"
                      />
                      <WuInput
                        value={member.lastName}
                        onChange={(event) =>
                          updateMember(member.id, { lastName: event.target.value })
                        }
                        placeholder="Last name"
                        aria-label="Last name"
                      />
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        aria-label="Remove member"
                        disabled={members.length <= 1}
                        onClick={() => removeMemberRow(member.id)}
                      >
                        <span className="wm-delete" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </WuModalContent>
        <WuModalFooter>
          {mode === 'list' ? (
            <WuModalClose variant="secondary">Close</WuModalClose>
          ) : (
            <div className={styles.footerActions}>
              <WuButton variant="secondary" onClick={resetEditor}>
                Back
              </WuButton>
              <WuButton onClick={handleSaveGroup}>
                {mode === 'edit' ? 'Save Group' : 'Create Group'}
              </WuButton>
            </div>
          )}
        </WuModalFooter>
      </WuModal>

      <ConfirmModal
        open={deleteTarget != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteTarget(null);
        }}
        title="Delete notification group"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
            : 'Are you sure you want to delete this notification group?'
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
