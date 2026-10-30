'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  EMPTY_INTEGRITY_COVERAGE,
  INTEGRITY_COVERAGE_KEY,
  SURVEY_CHECKS,
  findSurveyProtection,
  normalizeSurveyChecks,
  normalizeTolerance,
  surveyCheckSummary,
  surveyRecordFromChecks,
  type SurveyCheckId,
} from '@/lib/integrity/coverage';
import { IntegrityCheckToggles } from './IntegrityCheckToggles';
import styles from './IntegrityCoverage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);

export function SurveyIntegrityEditor({
  surveyId,
  surveyName,
  embedded = false,
}: {
  surveyId: number;
  surveyName: string;
  embedded?: boolean;
}) {
  const { showToast } = useWuShowToast();
  const [coverage, setCoverage] = usePersistedState(
    INTEGRITY_COVERAGE_KEY,
    EMPTY_INTEGRITY_COVERAGE,
  );
  const saved = findSurveyProtection(coverage, surveyId);
  const [enabled, setEnabled] = useState(false);
  const [checks, setChecks] = useState<SurveyCheckId[]>([]);
  const [tolerance, setTolerance] = useState<Partial<Record<string, number>>>({});
  const [synced, setSynced] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (dirtyRef.current) return;
    const record = findSurveyProtection(coverage, surveyId);
    const nextChecks = normalizeSurveyChecks(record?.checks ?? []);
    setEnabled(nextChecks.length > 0);
    setChecks(nextChecks);
    setTolerance(record?.tolerance ?? {});
    setSynced(true);
  }, [coverage, surveyId]);

  function toggleCheck(id: SurveyCheckId, checked: boolean) {
    dirtyRef.current = true;
    setChecks((current) => {
      const next = checked
        ? normalizeSurveyChecks([...current, id])
        : current.filter((item) => item !== id);
      setEnabled(next.length > 0);
      if (checked) {
        setTolerance((stored) => normalizeTolerance(next, stored, SURVEY_CHECKS));
      }
      return next;
    });
  }

  function turnOn(checked: boolean) {
    dirtyRef.current = true;
    if (!checked) {
      setEnabled(false);
      setChecks([]);
      return;
    }
    const fromOrg = normalizeSurveyChecks(coverage.newSurveys?.checks ?? []);
    const next = fromOrg.length > 0 ? fromOrg : (['fingerprint'] as SurveyCheckId[]);
    setEnabled(true);
    setChecks(next);
    setTolerance(normalizeTolerance(next, coverage.newSurveys?.tolerance, SURVEY_CHECKS));
  }

  function save() {
    dirtyRef.current = false;
    const nextChecks = enabled ? normalizeSurveyChecks(checks) : [];
    setCoverage((current) => {
      const others = current.surveys.filter((item) => item.surveyId !== surveyId);
      if (nextChecks.length === 0) return { ...current, surveys: others };
      return {
        ...current,
        surveys: [...others, surveyRecordFromChecks(surveyId, nextChecks, tolerance)],
      };
    });
    showToast({
      message:
        nextChecks.length === 0
          ? `Respondent integrity is off for ${surveyName}.`
          : `Respondent integrity saved for ${surveyName}.`,
      variant: 'success',
    });
  }

  return (
    <div className={embedded ? styles.embedded : styles.editor}>
      <p className={styles.hint}>
        {synced && saved
          ? `${surveyCheckSummary(saved.checks)} on this survey.`
          : `${surveyName} is not protected.`}{' '}
        This applies only to this survey.
      </p>
      <div className={styles.row}>
        <span className={styles.copy}>
          <strong>Protect this survey</strong>
          <span className={styles.hint}>
            Turn checks on for people taking {surveyName}. Other surveys stay as they are.
          </span>
        </span>
        <WuToggle
          checked={enabled}
          onChange={turnOn}
          aria-label="Protect this survey"
        />
      </div>
      {enabled ? (
        <IntegrityCheckToggles
          items={SURVEY_CHECKS}
          selected={checks}
          tolerances={tolerance}
          onToggle={toggleCheck}
          onTolerance={(id, value) => {
            dirtyRef.current = true;
            setTolerance((current) => ({ ...current, [id]: value }));
          }}
        />
      ) : null}
      <div className={styles.actions}>
        <WuButton type="button" onClick={save}>
          Save
        </WuButton>
      </div>
    </div>
  );
}
