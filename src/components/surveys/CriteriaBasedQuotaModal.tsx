'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  QuotaStepBreadcrumb,
  type QuotaStep,
} from '@/components/surveys/QuotaStepBreadcrumb';
import {
  buildCriteriaRuleRows,
  CriteriaRulesExpanded,
} from '@/components/surveys/CriteriaRulesExpanded';
import { CriteriaEngineEditor } from '@/components/surveys/CriteriaEngineEditor';
import {
  getQuestionsBySurvey,
  type SurveyQuestion,
} from '@/data/mock-survey-questions';
import type { QuotaGroupSelection } from '@/data/mock-quota-groups';
import type { AdvanceQuota, AdvanceQuotaCriterionBlock } from '@/data/mock-advance-quotas';
import { getQuotaDisplayRules } from '@/data/mock-advance-quotas';
import {
  isBetweenOperator,
  newCriterion,
  systemVariableOperatorNeedsValue,
  uniqueId,
  type ConditionConnector,
  type ConditionSource,
  type Criterion,
} from '@/data/mock-criteria-engine';
import styles from './CriteriaBasedQuotaModal.module.css';

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

interface QuotaBlock {
  id: string;
  name: string;
  target: number;
  criteria: Criterion[];
  collapsedCriterionIds: Set<string>;
  firstCheckId: number | null;
  secondCheckId: number | null;
  collapsed: boolean;
}

export interface CriteriaQuotaCheck {
  questionId: number;
  questionCode: string;
  questionText: string;
}

export interface CriteriaQuotaCondition {
  source: ConditionSource;
  questionCode: string;
  questionText: string;
  /** Display label for the condition subject (question text or system variable name). */
  subject: string;
  operator: string;
  value: string;
  valueEnd?: string;
  /** Logical connector to the previous condition. Ignored for the first condition. */
  connector: ConditionConnector;
}

export interface CriteriaQuotaCriterion {
  name: string;
  conditions: CriteriaQuotaCondition[];
}

export interface CriteriaQuotaSubmit {
  name: string;
  target: number;
  criteria: CriteriaQuotaCriterion[];
  firstCheck: CriteriaQuotaCheck;
  secondCheck?: CriteriaQuotaCheck;
}

export type CriteriaQuotaFlow = 'standalone' | 'advanced-group';

interface CriteriaBasedQuotaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  flow?: CriteriaQuotaFlow;
  quotaGroupSelection?: QuotaGroupSelection | null;
  /** Advanced flow: quotas already in the selected group (shown read-only on the criteria step). */
  existingQuotasInSelectedGroup?: AdvanceQuota[];
  editQuota?: AdvanceQuota | null;
  onBack?: () => void;
  onBackToQuotaGroup?: () => void;
  onSave?: (quotas: CriteriaQuotaSubmit[]) => void;
  onUpdate?: (quotaId: string, quotas: CriteriaQuotaSubmit[]) => void;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US');
}

function parseFormattedNumber(raw: string): number {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') return 0;
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function newQuotaBlock(checks?: {
  firstCheckId?: number | null;
  secondCheckId?: number | null;
}): QuotaBlock {
  return {
    id: uniqueId('quota'),
    name: '',
    target: 100,
    criteria: [newCriterion()],
    collapsedCriterionIds: new Set(),
    firstCheckId: checks?.firstCheckId ?? null,
    secondCheckId: checks?.secondCheckId ?? null,
    collapsed: false,
  };
}

function quotaBlockFromAdvanceQuota(quota: AdvanceQuota, questions: SurveyQuestion[]): QuotaBlock {
  const firstCheck = quota.quotaChecks?.[0];
  const secondCheck = quota.quotaChecks?.[1];
  const firstCheckId = firstCheck
    ? (questions.find((q) => q.code === firstCheck.questionCode)?.id ?? null)
    : null;
  const secondCheckId = secondCheck
    ? (questions.find((q) => q.code === secondCheck.questionCode)?.id ?? null)
    : null;

  const criteria: Criterion[] = (quota.criterionBlocks ?? [])
    .map((block) => ({
      id: uniqueId('crit'),
      name: block.name,
      mode: 'new' as const,
      existingCriteriaId: null,
      existingConditionsSnapshot: null,
      requiresRename: false,
      conditions: block.conditions
        .filter((cond) => cond.source !== 'Summary')
        .map((cond) => ({
          id: uniqueId('cond'),
          source: cond.source as ConditionSource,
          questionId: cond.questionCode
            ? (questions.find((q) => q.code === cond.questionCode)?.id ?? null)
            : null,
          systemVariable: cond.source === 'System Variable' ? cond.subject : null,
          operator: cond.operator,
          value: cond.value,
          valueEnd: cond.valueEnd ?? '',
          connector: cond.connector ?? 'AND',
        })),
    }))
    .filter((criterion) => criterion.conditions.length > 0);

  return {
    id: uniqueId('quota'),
    name: quota.name,
    target: quota.target,
    criteria: criteria.length > 0 ? criteria : [newCriterion()],
    collapsedCriterionIds: new Set(),
    firstCheckId,
    secondCheckId,
    collapsed: false,
  };
}

function quotaBlockFromGroupSelection(
  selection: QuotaGroupSelection | null | undefined
): QuotaBlock {
  if (!selection?.firstCheck) {
    return newQuotaBlock();
  }
  return newQuotaBlock({
    firstCheckId: selection.firstCheck.questionId,
    secondCheckId: selection.secondCheck?.questionId ?? null,
  });
}

function groupCheckToQuotaCheck(
  check: QuotaGroupSelection['firstCheck'],
  questions: SurveyQuestion[]
): CriteriaQuotaCheck | null {
  if (!check) return null;
  const question =
    questions.find((q) => q.id === check.questionId) ??
    questions.find((q) => q.code === check.questionCode);
  if (question) {
    return {
      questionId: question.id,
      questionCode: question.code,
      questionText: question.text,
    };
  }
  return {
    questionId: check.questionId,
    questionCode: check.questionCode,
    questionText: check.questionText,
  };
}

function validateBlock(
  block: QuotaBlock,
  questions: SurveyQuestion[],
  groupSelection?: QuotaGroupSelection | null
): CriteriaQuotaSubmit | null {
  const trimmedName = block.name.trim();
  if (trimmedName.length === 0) return null;
  if (block.target <= 0) return null;

  const groupFirstCheck = groupSelection?.firstCheck
    ? groupCheckToQuotaCheck(groupSelection.firstCheck, questions)
    : null;
  const groupSecondCheck = groupSelection?.secondCheck
    ? groupCheckToQuotaCheck(groupSelection.secondCheck, questions)
    : undefined;

  let firstCheck: CriteriaQuotaCheck | null = groupFirstCheck;
  let secondCheck: CriteriaQuotaCheck | undefined = groupSecondCheck ?? undefined;

  if (!firstCheck) {
    if (block.firstCheckId === null) return null;
    const firstCheckQuestion = questions.find((q) => q.id === block.firstCheckId);
    if (!firstCheckQuestion) return null;
    firstCheck = {
      questionId: firstCheckQuestion.id,
      questionCode: firstCheckQuestion.code,
      questionText: firstCheckQuestion.text,
    };
    const secondCheckQuestion =
      block.secondCheckId !== null
        ? questions.find((q) => q.id === block.secondCheckId)
        : undefined;
    secondCheck = secondCheckQuestion
      ? {
          questionId: secondCheckQuestion.id,
          questionCode: secondCheckQuestion.code,
          questionText: secondCheckQuestion.text,
        }
      : undefined;
  }
  const criteria: CriteriaQuotaCriterion[] = block.criteria
    .map((crit) => {
      const conditions: CriteriaQuotaCondition[] = crit.conditions
        .filter((cond) => {
          if (cond.source === 'Question') {
            return cond.questionId !== null && cond.value.trim() !== '';
          }
          if (cond.source === 'System Variable') {
            if (cond.systemVariable === null) return false;
            if (!systemVariableOperatorNeedsValue(cond.operator)) return true;
            if (isBetweenOperator(cond.operator)) {
              return cond.value.trim() !== '' && cond.valueEnd.trim() !== '';
            }
            return cond.value.trim() !== '';
          }
          return cond.value.trim() !== '';
        })
        .map((cond) => {
          const question =
            cond.questionId !== null
              ? questions.find((q) => q.id === cond.questionId)
              : undefined;
          const subject =
            cond.source === 'Question'
              ? question?.text ?? ''
              : cond.source === 'System Variable'
                ? cond.systemVariable ?? ''
                : cond.source;
          return {
            source: cond.source,
            questionCode: question?.code ?? '',
            questionText: question?.text ?? '',
            subject,
            operator: cond.operator,
            value: cond.value.trim(),
            valueEnd: isBetweenOperator(cond.operator) ? cond.valueEnd.trim() : undefined,
            connector: cond.connector,
          };
        });
      return { name: crit.name.trim(), conditions };
    })
    // Criteria name is optional in the prototype; we still want to keep the
    // conditions so advanced-group quotas can show the actual rules.
    .filter((crit) => crit.conditions.length > 0);
  return {
    name: trimmedName,
    target: block.target,
    criteria,
    firstCheck,
    secondCheck,
  };
}

function getReadOnlyDisplayBlocks(quota: AdvanceQuota): AdvanceQuotaCriterionBlock[] {
  const { blocks } = getQuotaDisplayRules(quota);
  return blocks
    .map((block) => ({
      ...block,
      conditions: block.conditions.filter((c) => c.source !== 'Summary'),
    }))
    .filter((block) => block.conditions.length > 0);
}

function formatGroupQuotaChecksHint(sel: QuotaGroupSelection): string | null {
  if (!sel.firstCheck?.questionCode) return null;
  const first = sel.firstCheck.questionCode;
  const second = sel.secondCheck?.questionCode;
  if (!second) return `Checked after [${first}]`;
  return `Checked after [${first}], re-checked after [${second}]`;
}

function ExistingGroupQuotasReadOnly({
  quotas,
  groupSelection,
}: {
  quotas: AdvanceQuota[];
  groupSelection: QuotaGroupSelection;
}) {
  const checksHint = formatGroupQuotaChecksHint(groupSelection);

  return (
    <section
      className={styles.existingGroupSection}
      aria-labelledby="existing-group-criteria-heading"
    >
      <div className={styles.existingGroupSectionHeader}>
        <h3 id="existing-group-criteria-heading" className={styles.existingGroupHeading}>
          Quotas already in this group
        </h3>
        <span className={styles.readOnlyPill}>Read-only</span>
      </div>
      {checksHint ? (
        <p className={styles.groupChecksHint} role="note">
          {checksHint}
        </p>
      ) : null}
      <p className={styles.existingGroupHint}>
        These criteria cannot be edited here. Use the dashboard to manage existing quotas, or add
        a new quota below.
      </p>

      {quotas.length === 0 ? (
        <p className={styles.existingGroupEmpty}>No quotas in this group yet.</p>
      ) : (
        <ul className={styles.existingQuotaList}>
          {quotas.map((quota) => {
            const blocks = getReadOnlyDisplayBlocks(quota);
            const rowCount = buildCriteriaRuleRows(blocks).length;
            return (
              <li key={quota.id} className={styles.existingQuotaCard}>
                <div className={styles.existingQuotaCardHeader}>
                  <span className={styles.existingQuotaName}>{quota.name}</span>
                  <span className={styles.existingQuotaMeta}>
                    {quota.quotaType}
                    {typeof quota.target === 'number' ? ` · Target ${quota.target}` : ''}
                  </span>
                </div>
                <div
                  className={styles.readonlyCriteriaShell}
                  aria-readonly="true"
                  tabIndex={-1}
                >
                  {rowCount > 0 ? (
                    <CriteriaRulesExpanded blocks={blocks} showHeader variant="panel" />
                  ) : (
                    <p className={styles.readonlyDescriptionFallback}>
                      {quota.description?.trim() || 'No criteria defined.'}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

interface QuotaBlockEditorProps {
  block: QuotaBlock;
  blockIndex: number;
  questions: SurveyQuestion[];
  removable: boolean;
  hideQuotaChecks?: boolean;
  onChange: (next: QuotaBlock) => void;
  onRemove: () => void;
}

function QuotaBlockEditor({
  block,
  blockIndex,
  questions,
  removable,
  hideQuotaChecks = false,
  onChange,
  onRemove,
}: QuotaBlockEditorProps) {
  const firstCheckIndex =
    block.firstCheckId === null
      ? -1
      : questions.findIndex((q) => q.id === block.firstCheckId);
  const secondCheckOptions =
    firstCheckIndex < 0 ? [] : questions.slice(firstCheckIndex);
  const firstCheckQuestion =
    block.firstCheckId === null
      ? null
      : questions.find((q) => q.id === block.firstCheckId) ?? null;
  const secondCheckQuestion =
    block.secondCheckId === null
      ? null
      : questions.find((q) => q.id === block.secondCheckId) ?? null;

  const update = (patch: Partial<QuotaBlock>) => onChange({ ...block, ...patch });

  const handleFirstCheckChange = (nextId: number) => {
    const newIndex = questions.findIndex((q) => q.id === nextId);
    let nextSecond = block.secondCheckId;
    if (nextSecond !== null) {
      const currentIdx = questions.findIndex((q) => q.id === nextSecond);
      if (currentIdx < newIndex) nextSecond = null;
    }
    update({ firstCheckId: nextId, secondCheckId: nextSecond });
  };

  const blockTitle = block.name.trim() || `Quota ${blockIndex + 1}`;

  return (
    <section className={styles.quotaBlock}>
      <header className={styles.quotaBlockHeader}>
        <div className={styles.quotaBlockHeaderLeft}>
          <span className={styles.quotaBlockBadge}>Quota {blockIndex + 1}</span>
          {block.name.trim() ? (
            <span className={styles.quotaBlockTitle} title={blockTitle}>
              · {block.name.trim()}
            </span>
          ) : null}
        </div>
        <div className={styles.quotaBlockHeaderRight}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => update({ collapsed: !block.collapsed })}
            aria-label={block.collapsed ? 'Expand quota' : 'Collapse quota'}
            aria-expanded={!block.collapsed}
          >
            <span
              className={`wm-keyboard-arrow-up ${styles.collapseIcon} ${
                block.collapsed ? styles.collapseIconCollapsed : ''
              }`}
              aria-hidden
            />
          </button>
          {removable ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onRemove}
              aria-label={`Remove ${blockTitle}`}
            >
              <span className="wm-delete" aria-hidden />
            </button>
          ) : null}
        </div>
      </header>

      {!block.collapsed ? (
        <div className={styles.quotaBlockBody}>
          <div className={styles.field}>
            <label className={styles.label}>Quota name</label>
            <WuInput
              variant="outlined"
              placeholder="e.g. Female non-drinkers"
              value={block.name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                update({ name: event.target.value })
              }
              className={styles.fieldInput}
            />
          </div>

          <div className={styles.targetRow}>
            <div className={styles.field}>
              <label className={styles.label}>Target (count)</label>
              <input
                type="text"
                inputMode="numeric"
                className={styles.numberInput}
                value={formatNumber(block.target)}
                onChange={(event) =>
                  update({ target: parseFormattedNumber(event.target.value) })
                }
                aria-label="Target count"
              />
            </div>
          </div>

          <CriteriaEngineEditor
            criteria={block.criteria}
            collapsedCriterionIds={block.collapsedCriterionIds}
            questions={questions}
            onChange={({ criteria, collapsedCriterionIds }) =>
              update({ criteria, collapsedCriterionIds })
            }
          />

          {!hideQuotaChecks ? (
          <div className={styles.checksSection}>
            <div className={styles.field}>
              <label className={styles.label}>First quota check</label>
              <p className={styles.checkHint}>
                The quota will be checked after the respondent answers this question.
              </p>
              <WuMenu
                Trigger={
                  <button type="button" className={styles.menuTrigger}>
                    <span className={styles.menuTriggerLabel}>
                      {firstCheckQuestion
                        ? `${firstCheckQuestion.code} – ${firstCheckQuestion.text}`
                        : 'Select question'}
                    </span>
                    <span
                      className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
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
                      className={`${styles.menuTrigger} ${styles.menuTriggerInGroup}`}
                      disabled={block.firstCheckId === null}
                      aria-disabled={block.firstCheckId === null}
                    >
                      <span className={styles.menuTriggerLabel}>
                        {secondCheckQuestion
                          ? `${secondCheckQuestion.code} – ${secondCheckQuestion.text}`
                          : block.firstCheckId === null
                            ? 'Select first quota check first'
                            : 'Select question (optional)'}
                      </span>
                      <span
                        className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                        aria-hidden
                      />
                    </button>
                  }
                  align="start"
                >
                  {secondCheckOptions.map((question) => (
                    <WuMenuItem
                      key={question.id}
                      onSelect={() => update({ secondCheckId: question.id })}
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
                    onClick={() => update({ secondCheckId: null })}
                  >
                    <span className="wm-close" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function CriteriaBasedQuotaModal({
  open,
  onOpenChange,
  surveyId,
  flow = 'standalone',
  quotaGroupSelection = null,
  existingQuotasInSelectedGroup,
  editQuota = null,
  onBack,
  onBackToQuotaGroup,
  onSave,
  onUpdate,
}: CriteriaBasedQuotaModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [blocks, setBlocks] = useState<QuotaBlock[]>(() => [newQuotaBlock()]);

  const isAdvancedGroupFlow = flow === 'advanced-group' && quotaGroupSelection !== null;
  const breadcrumbSteps: QuotaStep[] = isAdvancedGroupFlow
    ? ['quota-type', 'advanced', 'quota-group', 'criteria']
    : ['quota-type', 'criteria'];

  const questions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => q.parentQuestionId === undefined),
    [surveyId]
  );

  const resetState = useCallback(() => {
    if (editQuota) {
      setBlocks([quotaBlockFromAdvanceQuota(editQuota, questions)]);
      return;
    }
    if (flow === 'advanced-group' && quotaGroupSelection) {
      setBlocks([quotaBlockFromGroupSelection(quotaGroupSelection)]);
      return;
    }
    setBlocks([newQuotaBlock()]);
  }, [editQuota, flow, questions, quotaGroupSelection]);

  useEffect(() => {
    if (!open) {
      setBlocks([newQuotaBlock()]);
      return;
    }
    resetState();
  }, [open, resetState]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setBlocks([newQuotaBlock()]);
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  function handleBack(): void {
    if (isAdvancedGroupFlow && onBackToQuotaGroup) {
      resetState();
      onBackToQuotaGroup();
      return;
    }
    if (onBack) {
      resetState();
      onBack();
      return;
    }
    handleOpenChange(false);
  }

  function handleBreadcrumbClick(step: QuotaStep): void {
    if (step === 'criteria') return;
    if (isAdvancedGroupFlow) {
      if (step === 'quota-group' && onBackToQuotaGroup) {
        resetState();
        onBackToQuotaGroup();
        return;
      }
      if (step === 'quota-type' || step === 'advanced') {
        if (onBack) {
          resetState();
          onBack();
        }
      }
      return;
    }
    if (step === 'quota-type') {
      handleBack();
    }
  }

  function handleAddBlock(): void {
    setBlocks((prev) => [
      ...prev.map((b) => ({ ...b, collapsed: true })),
      quotaBlockFromGroupSelection(
        isAdvancedGroupFlow ? quotaGroupSelection : null
      ),
    ]);
  }

  function handleUpdateBlock(blockId: string, next: QuotaBlock): void {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? next : b)));
  }

  function handleRemoveBlock(blockId: string): void {
    setBlocks((prev) => (prev.length > 1 ? prev.filter((b) => b.id !== blockId) : prev));
  }

  const validatedBlocks = useMemo(
    () =>
      blocks.map((b) => ({
        block: b,
        submit: validateBlock(
          b,
          questions,
          isAdvancedGroupFlow ? quotaGroupSelection : null
        ),
      })),
    [blocks, isAdvancedGroupFlow, questions, quotaGroupSelection]
  );
  const validQuotas = validatedBlocks
    .map((entry) => entry.submit)
    .filter((s): s is CriteriaQuotaSubmit => s !== null);
  const canSave = validQuotas.length === blocks.length && validQuotas.length > 0;

  function handleSave(): void {
    if (!canSave) return;
    if (editQuota) {
      onUpdate?.(editQuota.id, validQuotas);
      showToast({
        message: `Quota "${validQuotas[0]?.name ?? editQuota.name}" updated`,
        variant: 'success',
      });
    } else {
      onSave?.(validQuotas);
      const groupLabel = quotaGroupSelection?.name;
      showToast({
        message:
          validQuotas.length === 1
            ? isAdvancedGroupFlow && groupLabel
              ? `Quota "${validQuotas[0].name}" added to ${groupLabel}`
              : `Criteria based quota "${validQuotas[0].name}" created`
            : isAdvancedGroupFlow && groupLabel
              ? `${validQuotas.length} quotas added to ${groupLabel}`
              : `${validQuotas.length} criteria based quotas created`,
        variant: 'success',
      });
    }
    resetState();
    onOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={styles.modal}
      variant="action"
    >
      <WuModalHeader className={styles.header}>
        {editQuota ? 'Edit Quota' : 'Criteria Based Quota'}
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.body}>
          <p className={styles.instructions}>
            {isAdvancedGroupFlow && quotaGroupSelection ? (
              <>
                Define one or more criteria quotas for{' '}
                <strong>{quotaGroupSelection.name}</strong> ({quotaGroupSelection.handlingType}
                ). Quota checks are set at the group level. Existing quotas in the group are listed
                below (read-only). Add your new quota under <strong>New quota</strong>.
              </>
            ) : (
              <>
                Define one or more criteria based quotas. Each quota has its own name, target,
                criteria, and check points.
              </>
            )}
          </p>

            {isAdvancedGroupFlow &&
            quotaGroupSelection &&
            existingQuotasInSelectedGroup !== undefined ? (
              <>
                <ExistingGroupQuotasReadOnly
                  quotas={existingQuotasInSelectedGroup}
                  groupSelection={quotaGroupSelection}
                />
                <div className={styles.newQuotaDivider} role="separator" />
                <p className={styles.newQuotaLabel}>New quota</p>
              </>
            ) : null}

          <div className={styles.quotaList}>
            {blocks.map((block, index) => (
              <QuotaBlockEditor
                key={block.id}
                block={block}
                blockIndex={index}
                questions={questions}
                removable={blocks.length > 1}
                hideQuotaChecks={isAdvancedGroupFlow}
                onChange={(next) => handleUpdateBlock(block.id, next)}
                onRemove={() => handleRemoveBlock(block.id)}
              />
            ))}
          </div>

          <button
            type="button"
            className={styles.addQuotaBtn}
            onClick={handleAddBlock}
          >
            <span className="wm-add" aria-hidden />
            <span>Add another quota</span>
          </button>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <QuotaStepBreadcrumb
            steps={breadcrumbSteps}
            currentStep="criteria"
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.footerButtons}>
            <WuButton variant="secondary" onClick={handleBack}>
              Back
            </WuButton>
            <WuButton onClick={handleSave} disabled={!canSave}>
              {blocks.length === 1 ? 'Save' : `Save ${blocks.length} quotas`}
            </WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
