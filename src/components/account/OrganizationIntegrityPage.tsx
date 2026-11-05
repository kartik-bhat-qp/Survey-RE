'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  EMPTY_INTEGRITY_COVERAGE,
  INTEGRITY_COVERAGE_KEY,
  SURVEY_CHECKS,
  normalizeCheckActions,
  normalizeFlagAction,
  normalizeSurveyChecks,
  normalizeTerminateAfterFlags,
  normalizeTolerance,
  terminateFlagCapacity,
  type CheckFlagActions,
  type IntegrityFlagAction,
  type SurveyCheckId,
} from '@/lib/integrity/coverage';
import { IntegrityCheckToggles } from '@/components/integrity/IntegrityCheckToggles';
import { IntegrityFlagActionControls } from '@/components/integrity/IntegrityFlagActionControls';
import editorStyles from '@/components/integrity/IntegrityCoverage.module.css';
import styles from './OrganizationSettingsPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);

export function OrganizationIntegrityPage() {
  const { showToast } = useWuShowToast();
  const [coverage, setCoverage] = usePersistedState(
    INTEGRITY_COVERAGE_KEY,
    EMPTY_INTEGRITY_COVERAGE,
  );
  const [enabled, setEnabled] = useState(false);
  const [checks, setChecks] = useState<SurveyCheckId[]>([]);
  const [tolerance, setTolerance] = useState<Partial<Record<string, number>>>({});
  const [checkActions, setCheckActions] = useState<CheckFlagActions<SurveyCheckId>>({});
  const [flagAction, setFlagAction] = useState<IntegrityFlagAction>('flag');
  const [terminateAfterFlags, setTerminateAfterFlags] = useState(1);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (dirtyRef.current) return;
    const defaults = coverage.newSurveys;
    const nextChecks = normalizeSurveyChecks(defaults?.checks ?? []);
    const nextActions = normalizeCheckActions(
      nextChecks,
      defaults?.checkActions,
      defaults?.flagAction,
    );
    setEnabled(Boolean(defaults?.enabled) && nextChecks.length > 0);
    setChecks(nextChecks);
    setTolerance(defaults?.tolerance ?? {});
    setCheckActions(nextActions);
    setFlagAction(normalizeFlagAction(defaults?.flagAction));
    setTerminateAfterFlags(
      normalizeTerminateAfterFlags(
        defaults?.terminateAfterFlags,
        terminateFlagCapacity(nextChecks, nextActions),
      ),
    );
  }, [coverage]);

  function clampTerminate(nextChecks: SurveyCheckId[], nextActions: CheckFlagActions) {
    setTerminateAfterFlags((value) =>
      normalizeTerminateAfterFlags(value, terminateFlagCapacity(nextChecks, nextActions)),
    );
  }

  function toggleCheck(id: SurveyCheckId, checked: boolean) {
    dirtyRef.current = true;
    setChecks((current) => {
      const next = checked
        ? normalizeSurveyChecks([...current, id])
        : current.filter((item) => item !== id);
      setEnabled(next.length > 0);
      const nextActions = checked
        ? normalizeCheckActions(next, { ...checkActions, [id]: 'flag' })
        : normalizeCheckActions(next, checkActions);
      setCheckActions(nextActions);
      if (checked) {
        setTolerance((stored) => normalizeTolerance(next, stored, SURVEY_CHECKS));
      }
      clampTerminate(next, nextActions);
      return next;
    });
  }

  function setAction(id: SurveyCheckId, action: IntegrityFlagAction) {
    dirtyRef.current = true;
    setCheckActions((current) => {
      const next = { ...current, [id]: action };
      clampTerminate(checks, next);
      return next;
    });
  }

  function turnOn(checked: boolean) {
    dirtyRef.current = true;
    if (!checked) {
      setEnabled(false);
      setChecks([]);
      setCheckActions({});
      setFlagAction('flag');
      setTerminateAfterFlags(1);
      return;
    }
    const next = checks.length > 0 ? checks : (['fingerprint', 'connection'] as SurveyCheckId[]);
    const normalized = normalizeSurveyChecks(next);
    const nextActions = normalizeCheckActions(normalized, checkActions);
    setEnabled(true);
    setChecks(normalized);
    setTolerance((stored) => normalizeTolerance(normalized, stored, SURVEY_CHECKS));
    setCheckActions(nextActions);
  }

  function save() {
    dirtyRef.current = false;
    const nextChecks = enabled ? normalizeSurveyChecks(checks) : [];
    const actions =
      nextChecks.length > 0 ? normalizeCheckActions(nextChecks, checkActions) : undefined;
    setCoverage((current) => ({
      ...current,
      newSurveys: {
        enabled: nextChecks.length > 0,
        checks: nextChecks,
        tolerance: normalizeTolerance(nextChecks, tolerance, SURVEY_CHECKS),
        checkActions: actions,
        flagAction: nextChecks.length > 0 ? flagAction : undefined,
        terminateAfterFlags:
          nextChecks.length > 0 && flagAction === 'terminate'
            ? normalizeTerminateAfterFlags(
                terminateAfterFlags,
                terminateFlagCapacity(nextChecks, actions),
              )
            : undefined,
      },
    }));
    showToast({
      message:
        nextChecks.length === 0
          ? 'New surveys will not be protected.'
          : 'New surveys will use these checks.',
      variant: 'success',
    });
  }

  const maxFlags = terminateFlagCapacity(checks, checkActions);

  return (
    <div className={styles.page}>
      <div className={editorStyles.editor}>
        <h2>Respondent integrity</h2>
        <p className={editorStyles.hint}>
          Turn this on to protect surveys created after you save. Surveys you already have stay
          as they are until you turn protection on while editing that survey.
        </p>
        <div className={editorStyles.row}>
          <span className={editorStyles.copy}>
            <strong>Protect new surveys</strong>
            <span className={editorStyles.hint}>
              Each survey created from now on starts with the checks below.
            </span>
          </span>
          <WuToggle
            checked={enabled}
            onChange={turnOn}
            aria-label="Protect new surveys"
          />
        </div>
        {enabled ? (
          <>
            <IntegrityCheckToggles
              items={SURVEY_CHECKS}
              selected={checks}
              tolerances={tolerance}
              checkActions={checkActions}
              onToggle={toggleCheck}
              onTolerance={(id, value) => {
                dirtyRef.current = true;
                setTolerance((current) => ({ ...current, [id]: value }));
              }}
              onCheckAction={setAction}
            />
            <IntegrityFlagActionControls
              flagAction={flagAction}
              terminateAfterFlags={terminateAfterFlags}
              maxFlags={maxFlags}
              onFlagActionChange={(action) => {
                dirtyRef.current = true;
                setFlagAction(action);
              }}
              onTerminateAfterChange={(count) => {
                dirtyRef.current = true;
                setTerminateAfterFlags(normalizeTerminateAfterFlags(count, maxFlags));
              }}
            />
          </>
        ) : null}
        <div className={editorStyles.actions}>
          <WuButton type="button" onClick={save}>
            Save
          </WuButton>
        </div>
      </div>
    </div>
  );
}
