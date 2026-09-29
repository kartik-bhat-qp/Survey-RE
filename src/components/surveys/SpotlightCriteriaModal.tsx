'use client';

import { useMemo, useState } from 'react';
import { CriteriaEngineEditor } from '@/components/surveys/CriteriaEngineEditor';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { hasCompleteConditions, newCriterion, type Criterion } from '@/data/mock-criteria-engine';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import styles from './SpotlightCriteriaModal.module.css';

interface SpotlightCriteriaModalProps {
  surveyId: number;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}

export function SpotlightCriteriaModal({
  surveyId,
  onOpenChange,
  onCreate,
}: SpotlightCriteriaModalProps) {
  const wick = useWickUILib();
  const [name, setName] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>(() => [newCriterion()]);
  const [collapsedCriterionIds, setCollapsedCriterionIds] = useState<Set<string>>(() => new Set());

  const questions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => q.parentQuestionId === undefined),
    [surveyId]
  );

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && criteria.every(hasCompleteConditions);

  if (!wick) return null;

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton, WuInput } =
    wick;

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" size="lg">
      <WuModalHeader>Create New Criteria</WuModalHeader>
      <WuModalContent className={styles.content}>
        <label className={styles.field}>
          <span className={styles.label}>Criteria name</span>
          <WuInput
            variant="outlined"
            placeholder="e.g. Promoters in North America"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <CriteriaEngineEditor
          criteria={criteria}
          collapsedCriterionIds={collapsedCriterionIds}
          questions={questions}
          variant="quota"
          showAddCriteria={false}
          onChange={(next) => {
            setCriteria(next.criteria);
            setCollapsedCriterionIds(next.collapsedCriterionIds);
          }}
        />
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton disabled={!canSave} onClick={() => onCreate(trimmedName)}>
          Save
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
