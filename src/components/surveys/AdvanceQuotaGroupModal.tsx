'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  advanceQuotaCustomGroupsKey,
  DEFAULT_QUOTA_GROUP_HANDLING_TYPE,
  getCriteriaCountByQuotaGroup,
  mergeQuotaGroups,
  QUOTA_GROUP_HANDLING_TYPES,
  type QuotaGroup,
  type QuotaGroupHandlingType,
  type QuotaGroupSelection,
} from '@/data/mock-quota-groups';
import { MOCK_ADVANCE_QUOTAS, type AdvanceQuota } from '@/data/mock-advance-quotas';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  QuotaStepBreadcrumb,
  type QuotaStep,
} from '@/components/surveys/QuotaStepBreadcrumb';
import styles from './AdvanceQuotaGroupModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

const GROUP_MODES = ['existing', 'create'] as const;
type GroupMode = (typeof GROUP_MODES)[number];

interface AdvanceQuotaGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  onBack?: () => void;
  onConfirm: (selection: QuotaGroupSelection) => void;
}

export function AdvanceQuotaGroupModal({
  open,
  onOpenChange,
  surveyId,
  onBack,
  onConfirm,
}: AdvanceQuotaGroupModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [customGroups, setCustomGroups] = usePersistedState<QuotaGroup[]>(
    advanceQuotaCustomGroupsKey(surveyId),
    []
  );
  const [mode, setMode] = useState<GroupMode>('existing');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupHandlingType, setNewGroupHandlingType] = useState<QuotaGroupHandlingType>(
    DEFAULT_QUOTA_GROUP_HANDLING_TYPE
  );

  const [addedQuotas] = usePersistedState<AdvanceQuota[]>(
    `advance-quotas:${surveyId}:added`,
    []
  );

  const allGroups = useMemo(
    () => mergeQuotaGroups(customGroups),
    [customGroups]
  );

  const criteriaCountByGroup = useMemo(() => {
    const allQuotas = [...addedQuotas, ...MOCK_ADVANCE_QUOTAS];
    return getCriteriaCountByQuotaGroup(allQuotas);
  }, [addedQuotas]);

  const resetForm = useCallback(() => {
    setMode('existing');
    setSelectedGroupId(null);
    setNewGroupName('');
    setNewGroupHandlingType(DEFAULT_QUOTA_GROUP_HANDLING_TYPE);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, resetForm]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetForm();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm]
  );

  const selectedGroup = selectedGroupId
    ? allGroups.find((g) => g.id === selectedGroupId)
    : undefined;

  const trimmedNewName = newGroupName.trim();
  const newNameExists = allGroups.some(
    (g) => g.name.toLowerCase() === trimmedNewName.toLowerCase()
  );

  const canContinue =
    mode === 'existing'
      ? selectedGroup !== undefined
      : trimmedNewName.length > 0 && !newNameExists;

  function handleBreadcrumbClick(step: QuotaStep): void {
    if (step === 'quota-type' || step === 'advanced') {
      if (onBack) {
        onBack();
        return;
      }
      handleOpenChange(false);
    }
  }

  function handleContinue(): void {
    if (!canContinue) return;

    if (mode === 'existing' && selectedGroup) {
      onConfirm({
        name: selectedGroup.name,
        handlingType: selectedGroup.handlingType,
      });
      handleOpenChange(false);
      return;
    }

    if (mode === 'create' && trimmedNewName) {
      if (newNameExists) {
        showToast({
          message: 'A quota group with this name already exists',
          variant: 'error',
        });
        return;
      }
      const created: QuotaGroup = {
        id: `custom-${Date.now()}`,
        name: trimmedNewName,
        description: 'Custom quota group',
        handlingType: newGroupHandlingType,
      };
      setCustomGroups((prev) => [...prev, created]);
      onConfirm({
        name: created.name,
        handlingType: created.handlingType,
      });
      showToast({
        message: `Quota group "${created.name}" created`,
        variant: 'success',
      });
      handleOpenChange(false);
    }
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuButton } = wick;

  return (
    <WuModal open onOpenChange={handleOpenChange} className={styles.modal} variant="action">
      <WuModalHeader className={styles.header}>Quota group</WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.body}>
          <p className={styles.instructions}>
            Select an existing quota group or create a new one to manage advance quotas.
          </p>

          <div
            className={styles.modeToggle}
            role="group"
            aria-label="Existing or new quota group"
          >
            {GROUP_MODES.map((option) => (
              <button
                key={option}
                type="button"
                className={
                  mode === option ? styles.modeToggleActive : styles.modeToggleInactive
                }
                onClick={() => setMode(option)}
                aria-pressed={mode === option}
              >
                {option === 'existing' ? 'Existing' : 'Create new'}
              </button>
            ))}
          </div>

          {mode === 'existing' ? (
            <div className={styles.groupPicker}>
              <div className={styles.groupListHeader} aria-hidden>
                <span className={styles.groupListHeaderName}>Quota group</span>
                <span className={styles.groupListHeaderCriteria}>No. of criteria</span>
                <span className={styles.groupListHeaderType}>Type</span>
              </div>
              <ul className={styles.groupList} role="radiogroup" aria-label="Quota groups">
                {allGroups.map((group) => {
                  const isSelected = selectedGroupId === group.id;
                  const criteriaCount = criteriaCountByGroup.get(group.name) ?? 0;
                  return (
                    <li key={group.id}>
                      <label
                        className={`${styles.groupOption} ${
                          isSelected ? styles.groupOptionSelected : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="quota-group"
                          className={styles.groupRadio}
                          checked={isSelected}
                          onChange={() => setSelectedGroupId(group.id)}
                        />
                        <span className={styles.groupOptionName}>{group.name}</span>
                        <span className={styles.groupOptionCriteriaCount}>
                          {criteriaCount}
                        </span>
                        <span className={styles.groupOptionTypeBadge}>
                          {group.handlingType}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className={styles.createFields}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="new-quota-group-name">
                  Quota group name
                </label>
                <WuInput
                  id="new-quota-group-name"
                  variant="outlined"
                  placeholder="e.g. Beer drinkers wave 2"
                  value={newGroupName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setNewGroupName(event.target.value)
                  }
                  className={styles.fieldInput}
                />
                {trimmedNewName.length > 0 && newNameExists ? (
                  <p className={styles.instructions}>
                    A group with this name already exists. Choose it from Existing or use a
                    different name.
                  </p>
                ) : null}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Type</label>
                <WuMenu
                  Trigger={
                    <button type="button" className={styles.typeMenuTrigger}>
                      <span>{newGroupHandlingType}</span>
                      <span
                        className={`wm-keyboard-arrow-down ${styles.typeMenuCaret}`}
                        aria-hidden
                      />
                    </button>
                  }
                  align="start"
                >
                  {QUOTA_GROUP_HANDLING_TYPES.map((handlingType) => (
                    <WuMenuItem
                      key={handlingType}
                      onSelect={() => setNewGroupHandlingType(handlingType)}
                    >
                      {handlingType}
                    </WuMenuItem>
                  ))}
                </WuMenu>
              </div>
            </div>
          )}
        </div>
      </WuModalContent>
      <WuModalFooter className={styles.modalFooter}>
        <div className={styles.footerActions}>
          <QuotaStepBreadcrumb
            steps={['quota-type', 'advanced', 'quota-group']}
            currentStep="quota-group"
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.footerButtons}>
            <WuButton variant="secondary" onClick={() => handleOpenChange(false)}>
              Back
            </WuButton>
            <WuButton onClick={handleContinue} disabled={!canContinue}>
              Continue
            </WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
