'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  advanceQuotaCustomGroupsKey,
  advanceQuotaGroupCheckOverridesKey,
  applyQuotaGroupCheckOverrides,
  DEFAULT_QUOTA_GROUP_HANDLING_TYPE,
  formatQuotaGroupCheckLabel,
  getCriteriaCountByQuotaGroup,
  mergeQuotaGroups,
  QUOTA_GROUP_HANDLING_TYPES,
  type QuotaGroup,
  type QuotaGroupCheckPoint,
  type QuotaGroupCheckOverrides,
  type QuotaGroupHandlingType,
  type QuotaGroupSelection,
} from '@/data/mock-quota-groups';
import {
  isRemovedDashboardQuota,
  MOCK_ADVANCE_QUOTAS,
  type AdvanceQuota,
} from '@/data/mock-advance-quotas';
import {
  getQuestionsBySurvey,
  type SurveyQuestion,
} from '@/data/mock-survey-questions';
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

function resolveCheckQuestionId(
  check: QuotaGroupCheckPoint | undefined,
  questions: SurveyQuestion[]
): number | null {
  if (!check) return null;
  const byId = questions.find((q) => q.id === check.questionId);
  if (byId) return byId.id;
  const byCode = questions.find((q) => q.code === check.questionCode);
  return byCode?.id ?? null;
}

interface EditableGroupQuotaChecksCellProps {
  group: QuotaGroup;
  questions: SurveyQuestion[];
  onUpdateChecks: (
    firstCheck: QuotaGroupCheckPoint | undefined,
    secondCheck: QuotaGroupCheckPoint | undefined
  ) => void;
}

function EditableGroupQuotaChecksCell({
  group,
  questions,
  onUpdateChecks,
}: EditableGroupQuotaChecksCellProps) {
  const firstCheckId = resolveCheckQuestionId(group.firstCheck, questions);
  const secondCheckId = resolveCheckQuestionId(group.secondCheck, questions);
  const firstCheckIndex =
    firstCheckId === null ? -1 : questions.findIndex((q) => q.id === firstCheckId);
  const secondCheckOptions =
    firstCheckIndex < 0 ? [] : questions.slice(firstCheckIndex);

  function toCheckPoint(questionId: number): QuotaGroupCheckPoint {
    const question = questions.find((q) => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }
    return {
      questionId: question.id,
      questionCode: question.code,
      questionText: question.text,
    };
  }

  function handleFirstChange(questionId: number): void {
    const firstCheck = toCheckPoint(questionId);
    let secondCheck = group.secondCheck;
    if (secondCheckId !== null) {
      const secondIndex = questions.findIndex((q) => q.id === secondCheckId);
      const newIndex = questions.findIndex((q) => q.id === questionId);
      if (secondIndex < newIndex) secondCheck = undefined;
    }
    onUpdateChecks(firstCheck, secondCheck);
  }

  function handleSecondChange(questionId: number): void {
    if (!group.firstCheck) return;
    onUpdateChecks(group.firstCheck, toCheckPoint(questionId));
  }

  function handleClearSecond(event: React.MouseEvent): void {
    event.stopPropagation();
    if (!group.firstCheck) return;
    onUpdateChecks(group.firstCheck, undefined);
  }

  function stopRowSelect(event: React.MouseEvent | React.KeyboardEvent): void {
    event.stopPropagation();
  }

  return (
    <div
      className={styles.groupOptionChecks}
      onClick={stopRowSelect}
      onKeyDown={stopRowSelect}
      role="presentation"
    >
      <div className={styles.groupOptionCheckLine}>
        <span className={styles.checkRoleLabel}>1st</span>
        <WuMenu
          Trigger={
            <button
              type="button"
              className={styles.inlineCheckTrigger}
              aria-label={`Edit first quota check for ${group.name}`}
              title={
                group.firstCheck
                  ? formatQuotaGroupCheckLabel(group.firstCheck)
                  : 'Select first quota check'
              }
            >
              {group.firstCheck ? (
                <>
                  <span className={styles.checkCode}>[{group.firstCheck.questionCode}]</span>
                  <span className={styles.checkText}>{group.firstCheck.questionText}</span>
                </>
              ) : (
                <span className={styles.inlineCheckPlaceholder}>Select question</span>
              )}
              <span className={`wm-edit ${styles.inlineCheckEditIcon}`} aria-hidden />
            </button>
          }
          align="start"
        >
          {questions.map((question) => (
            <WuMenuItem key={question.id} onSelect={() => handleFirstChange(question.id)}>
              {question.code} – {question.text}
            </WuMenuItem>
          ))}
        </WuMenu>
      </div>

      {group.firstCheck ? (
        <div className={styles.groupOptionCheckLine}>
          <span className={styles.checkRoleLabel}>2nd</span>
          <div className={styles.inlineSecondCheckRow}>
            <WuMenu
              Trigger={
                <button
                  type="button"
                  className={styles.inlineCheckTrigger}
                  aria-label={`Edit second quota check for ${group.name}`}
                  title={
                    group.secondCheck
                      ? formatQuotaGroupCheckLabel(group.secondCheck)
                      : 'Select second quota check (optional)'
                  }
                >
                  {group.secondCheck ? (
                    <>
                      <span className={styles.checkCode}>
                        [{group.secondCheck.questionCode}]
                      </span>
                      <span className={styles.checkText}>{group.secondCheck.questionText}</span>
                    </>
                  ) : (
                    <span className={styles.inlineCheckPlaceholder}>Add (optional)</span>
                  )}
                  <span className={`wm-edit ${styles.inlineCheckEditIcon}`} aria-hidden />
                </button>
              }
              align="start"
            >
              {secondCheckOptions.map((question) => (
                <WuMenuItem
                  key={question.id}
                  onSelect={() => handleSecondChange(question.id)}
                >
                  {question.code} – {question.text}
                </WuMenuItem>
              ))}
            </WuMenu>
            {group.secondCheck ? (
              <button
                type="button"
                className={styles.inlineCheckClear}
                aria-label={`Clear second quota check for ${group.name}`}
                onClick={handleClearSecond}
              >
                <span className="wm-close" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
  const [groupCheckOverrides, setGroupCheckOverrides] =
    usePersistedState<QuotaGroupCheckOverrides>(
      advanceQuotaGroupCheckOverridesKey(surveyId),
      {}
    );
  const [mode, setMode] = useState<GroupMode>('existing');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupHandlingType, setNewGroupHandlingType] = useState<QuotaGroupHandlingType>(
    DEFAULT_QUOTA_GROUP_HANDLING_TYPE
  );
  const [firstCheckId, setFirstCheckId] = useState<number | null>(null);
  const [secondCheckId, setSecondCheckId] = useState<number | null>(null);

  const [addedQuotas] = usePersistedState<AdvanceQuota[]>(
    `advance-quotas:${surveyId}:added`,
    []
  );

  const allGroups = useMemo(
    () => applyQuotaGroupCheckOverrides(mergeQuotaGroups(customGroups), groupCheckOverrides),
    [customGroups, groupCheckOverrides]
  );

  const criteriaCountByGroup = useMemo(() => {
    const allQuotas = [
      ...addedQuotas.filter((quota) => !isRemovedDashboardQuota(quota)),
      ...MOCK_ADVANCE_QUOTAS,
    ];
    return getCriteriaCountByQuotaGroup(allQuotas);
  }, [addedQuotas]);

  const questions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => q.parentQuestionId === undefined),
    [surveyId]
  );

  const firstCheckIndex =
    firstCheckId === null ? -1 : questions.findIndex((q) => q.id === firstCheckId);
  const secondCheckOptions =
    firstCheckIndex < 0 ? [] : questions.slice(firstCheckIndex);
  const firstCheckQuestion =
    firstCheckId === null ? null : questions.find((q) => q.id === firstCheckId) ?? null;
  const secondCheckQuestion =
    secondCheckId === null ? null : questions.find((q) => q.id === secondCheckId) ?? null;

  const resetForm = useCallback(() => {
    setMode('existing');
    setSelectedGroupId(null);
    setNewGroupName('');
    setNewGroupHandlingType(DEFAULT_QUOTA_GROUP_HANDLING_TYPE);
    setFirstCheckId(null);
    setSecondCheckId(null);
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
      : trimmedNewName.length > 0 && !newNameExists && firstCheckId !== null;

  function toCheckPoint(questionId: number): QuotaGroupCheckPoint | undefined {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return undefined;
    return {
      questionId: question.id,
      questionCode: question.code,
      questionText: question.text,
    };
  }

  function resolveStoredCheck(
    check: QuotaGroupCheckPoint | undefined
  ): QuotaGroupCheckPoint | undefined {
    if (!check) return undefined;
    const question = questions.find((q) => q.code === check.questionCode);
    if (!question) return check;
    return {
      questionId: question.id,
      questionCode: question.code,
      questionText: question.text,
    };
  }

  function handleFirstCheckChange(nextId: number): void {
    const newIndex = questions.findIndex((q) => q.id === nextId);
    setFirstCheckId(nextId);
    if (secondCheckId !== null) {
      const secondIndex = questions.findIndex((q) => q.id === secondCheckId);
      if (secondIndex < newIndex) setSecondCheckId(null);
    }
  }

  function updateGroupQuotaChecks(
    groupId: string,
    firstCheck: QuotaGroupCheckPoint | undefined,
    secondCheck: QuotaGroupCheckPoint | undefined
  ): void {
    setGroupCheckOverrides((prev) => ({
      ...prev,
      [groupId]: { firstCheck: firstCheck ?? null, secondCheck: secondCheck ?? null },
    }));

    if (groupId.startsWith('custom-')) {
      setCustomGroups((prev) =>
        prev.map((group) =>
          group.id === groupId ? { ...group, firstCheck, secondCheck } : group
        )
      );
    }

    showToast({
      message: 'Quota checks updated',
      variant: 'success',
    });
  }

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
      if (!selectedGroup.firstCheck) {
        showToast({
          message: 'Add a first quota check before continuing',
          variant: 'error',
        });
        return;
      }
      onConfirm({
        name: selectedGroup.name,
        handlingType: selectedGroup.handlingType,
        firstCheck: resolveStoredCheck(selectedGroup.firstCheck),
        secondCheck: resolveStoredCheck(selectedGroup.secondCheck),
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
      if (firstCheckId === null) {
        showToast({
          message: 'Select a first quota check for this group',
          variant: 'error',
        });
        return;
      }
      const firstCheck = toCheckPoint(firstCheckId);
      if (!firstCheck) {
        showToast({
          message: 'Selected first quota check is no longer available',
          variant: 'error',
        });
        return;
      }
      const secondCheck =
        secondCheckId !== null ? toCheckPoint(secondCheckId) : undefined;
      const created: QuotaGroup = {
        id: `custom-${Date.now()}`,
        name: trimmedNewName,
        description: 'Custom quota group',
        handlingType: newGroupHandlingType,
        firstCheck,
        secondCheck,
      };
      setCustomGroups((prev) => [...prev, created]);
      onConfirm({
        name: created.name,
        handlingType: created.handlingType,
        firstCheck: created.firstCheck,
        secondCheck: created.secondCheck,
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
                <span className={styles.groupListHeaderChecks}>Quota check</span>
                <span className={styles.groupListHeaderType}>Type</span>
              </div>
              <ul className={styles.groupList} role="radiogroup" aria-label="Quota groups">
                {allGroups.map((group) => {
                  const isSelected = selectedGroupId === group.id;
                  const criteriaCount = criteriaCountByGroup.get(group.name) ?? 0;
                  return (
                    <li
                      key={group.id}
                      className={`${styles.groupRow} ${
                        isSelected ? styles.groupRowSelected : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="quota-group"
                        id={`quota-group-${group.id}`}
                        className={styles.groupRadio}
                        checked={isSelected}
                        onChange={() => setSelectedGroupId(group.id)}
                      />
                      <label
                        htmlFor={`quota-group-${group.id}`}
                        className={styles.groupSelectLabel}
                      >
                        <span className={styles.groupOptionName}>{group.name}</span>
                      </label>
                      <span className={styles.groupOptionCriteriaCount}>
                        {criteriaCount}
                      </span>
                      <EditableGroupQuotaChecksCell
                        group={group}
                        questions={questions}
                        onUpdateChecks={(firstCheck, secondCheck) =>
                          updateGroupQuotaChecks(group.id, firstCheck, secondCheck)
                        }
                      />
                      <span className={styles.groupOptionTypeBadge}>
                        {group.handlingType}
                      </span>
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

              <div className={styles.checksSection}>
                <div className={styles.field}>
                  <label className={styles.label}>First quota check</label>
                  <p className={styles.checkHint}>
                    Quotas in this group will be checked after the respondent answers this
                    question.
                  </p>
                  <WuMenu
                    Trigger={
                      <button type="button" className={styles.questionMenuTrigger}>
                        <span className={styles.questionMenuLabel}>
                          {firstCheckQuestion
                            ? `${firstCheckQuestion.code} – ${firstCheckQuestion.text}`
                            : 'Select question'}
                        </span>
                        <span
                          className={`wm-keyboard-arrow-down ${styles.typeMenuCaret}`}
                          aria-hidden
                        />
                      </button>
                    }
                    align="start"
                  >
                    {questions.map((question) => (
                      <WuMenuItem
                        key={question.id}
                        onSelect={() => handleFirstCheckChange(question.id)}
                      >
                        {question.code} – {question.text}
                      </WuMenuItem>
                    ))}
                  </WuMenu>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    Second quota check{' '}
                    <span className={styles.optionalTag}>(Optional)</span>
                  </label>
                  <p className={styles.checkHint}>
                    Must be the same question or one that comes after the first quota check.
                  </p>
                  <div className={styles.menuTriggerGroup}>
                    <WuMenu
                      Trigger={
                        <button
                          type="button"
                          className={`${styles.questionMenuTrigger} ${styles.questionMenuTriggerInGroup}`}
                          disabled={firstCheckId === null}
                          aria-disabled={firstCheckId === null}
                        >
                          <span className={styles.questionMenuLabel}>
                            {secondCheckQuestion
                              ? `${secondCheckQuestion.code} – ${secondCheckQuestion.text}`
                              : firstCheckId === null
                                ? 'Select first quota check first'
                                : 'Select question (optional)'}
                          </span>
                          <span
                            className={`wm-keyboard-arrow-down ${styles.typeMenuCaret}`}
                            aria-hidden
                          />
                        </button>
                      }
                      align="start"
                    >
                      {secondCheckOptions.map((question) => (
                        <WuMenuItem
                          key={question.id}
                          onSelect={() => setSecondCheckId(question.id)}
                        >
                          {question.code} – {question.text}
                        </WuMenuItem>
                      ))}
                    </WuMenu>
                    {secondCheckQuestion ? (
                      <button
                        type="button"
                        className={styles.menuClearAdjacent}
                        aria-label="Clear second quota check"
                        onClick={() => setSecondCheckId(null)}
                      >
                        <span className="wm-close" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </div>
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
