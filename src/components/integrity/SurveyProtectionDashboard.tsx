'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { MOCK_SURVEY_FOLDERS, MOCK_SURVEYS } from '@/data/mock-surveys';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  EMPTY_INTEGRITY_COVERAGE,
  INTEGRITY_COVERAGE_KEY,
  SURVEY_CHECKS,
  findSurveyProtection,
  normalizeSurveyChecks,
  normalizeTolerance,
  protectionsForSurveyChecks,
  surveyCheckSummary,
  surveyProtectionSummary,
  toleranceSummary,
  type SurveyCheckId,
} from '@/lib/integrity/coverage';
import { IntegrityCheckToggles } from './IntegrityCheckToggles';
import styles from './IntegrityCoverage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false },
);
const WuCombobox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCombobox })),
  { ssr: false },
);

type SurveyOption = { value: string; label: string };

type SurveySelectGroup = {
  type: 'group';
  label: string;
  options: SurveyOption[];
};

export function SurveyProtectionDashboard() {
  const { showToast } = useWuShowToast();
  const searchParams = useSearchParams();
  const [coverage, setCoverage] = usePersistedState(
    INTEGRITY_COVERAGE_KEY,
    EMPTY_INTEGRITY_COVERAGE,
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [scrollTick, setScrollTick] = useState(0);
  const [surveyId, setSurveyId] = useState('');
  const [checks, setChecks] = useState<SurveyCheckId[]>([]);
  const [tolerance, setTolerance] = useState<Partial<Record<string, number>>>({});
  const [removeId, setRemoveId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const appliedQuery = useRef(false);

  const options = useMemo<SurveySelectGroup[]>(
    () =>
      MOCK_SURVEY_FOLDERS.map((folder) => ({
        type: 'group' as const,
        label: folder.name,
        options: MOCK_SURVEYS.filter((survey) => survey.folderId === folder.id).map((survey) => ({
          value: String(survey.id),
          label: survey.name,
        })),
      })),
    [],
  );
  const selected =
    options.flatMap((group) => group.options).find((option) => option.value === surveyId) ?? null;
  const rows = coverage.surveys
    .map((record) => {
      const survey = MOCK_SURVEYS.find((item) => item.id === record.surveyId);
      return survey ? { survey, record } : null;
    })
    .filter((row) => row !== null);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || appliedQuery.current) return;
    appliedQuery.current = true;
    const requested = searchParams.get('survey');
    if (!requested) return;
    const survey = MOCK_SURVEYS.find((item) => String(item.id) === requested);
    if (!survey) return;
    const existing = findSurveyProtection(coverage, survey.id);
    setSurveyId(String(survey.id));
    setChecks(normalizeSurveyChecks(existing?.checks ?? []));
    setTolerance(existing?.tolerance ?? {});
    setEditorOpen(true);
    setScrollTick((tick) => tick + 1);
  }, [coverage, ready, searchParams]);

  useEffect(() => {
    if (!editorOpen) return;
    document.getElementById('survey-checks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editorOpen, scrollTick]);

  function openNew(): void {
    setSurveyId('');
    setChecks([]);
    setTolerance({});
    setEditorOpen(true);
    setScrollTick((tick) => tick + 1);
  }

  function openExisting(id: number): void {
    const existing = findSurveyProtection(coverage, id);
    setSurveyId(String(id));
    setChecks(normalizeSurveyChecks(existing?.checks ?? []));
    setTolerance(existing?.tolerance ?? {});
    setEditorOpen(true);
    setScrollTick((tick) => tick + 1);
  }

  function toggleCheck(id: SurveyCheckId, checked: boolean): void {
    setChecks((current) =>
      normalizeSurveyChecks(checked ? [...current, id] : current.filter((item) => item !== id)),
    );
  }

  function save(): void {
    const id = Number(surveyId);
    const survey = MOCK_SURVEYS.find((item) => item.id === id);
    if (!survey) {
      showToast({ message: 'Select a survey.', variant: 'error' });
      return;
    }
    if (checks.length === 0) {
      showToast({ message: 'Turn on at least one check.', variant: 'error' });
      return;
    }
    const savedChecks = normalizeSurveyChecks(checks);
    setCoverage((current) => ({
      ...current,
      surveys: [
        ...current.surveys.filter((item) => item.surveyId !== id),
        {
          surveyId: id,
          protections: protectionsForSurveyChecks(savedChecks),
          checks: savedChecks,
          tolerance: normalizeTolerance(savedChecks, tolerance, SURVEY_CHECKS),
        },
      ],
    }));
    setSurveyId('');
    setChecks([]);
    setTolerance({});
    setEditorOpen(false);
    showToast({ message: `Protection saved for ${survey.name}.`, variant: 'success' });
  }

  function remove(): void {
    if (removeId === null) return;
    const survey = MOCK_SURVEYS.find((item) => item.id === removeId);
    setCoverage((current) => ({
      ...current,
      surveys: current.surveys.filter((item) => item.surveyId !== removeId),
    }));
    showToast({
      message: survey ? `Protection turned off for ${survey.name}.` : 'Protection turned off.',
      variant: 'success',
    });
    setRemoveId(null);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Surveys"
        description={
          'Turn on Respondent Integrity for a survey you already have in Surveys. ' +
          'Choose what Integrity looks for. Each check runs on its own schedule.'
        }
        action={
          <WuButton type="button" onClick={openNew}>
            Protect a survey
          </WuButton>
        }
      />
      {editorOpen ? (
      <section className={styles.editor} id="survey-checks" aria-label="What will be checked">
        <h2>Checks</h2>
        <p className={styles.hint}>
          {selected
            ? `Turn on what Integrity should look for in ${selected.label}.`
            : 'Select a survey, then turn on what Integrity should look for.'}
        </p>
        <div className={styles.select}>
            <WuCombobox
              data={options}
              hasGroup
              enableSearch
              accessorKey={{ value: 'value', label: 'label' }}
              value={selected}
              placeholder="Search surveys"
              noDataContent="No surveys match that search."
              variant="outlined"
              aria-label="Survey"
              onSelect={(item) => {
                const next = item as SurveyOption | null;
                const id = next?.value ?? '';
                setSurveyId(id);
                const existing = findSurveyProtection(coverage, Number(id));
                setChecks(normalizeSurveyChecks(existing?.checks ?? []));
                setTolerance(existing?.tolerance ?? {});
              }}
            />
          </div>
          <h3 className={styles.groupTitle}>What will be checked</h3>
          <IntegrityCheckToggles
            items={SURVEY_CHECKS}
            selected={checks}
            tolerances={tolerance}
            onToggle={toggleCheck}
            onTolerance={(id, value) =>
              setTolerance((current) => ({ ...current, [id]: value }))
            }
          />
        <div className={styles.actions}>
          <WuButton type="button" variant="secondary" onClick={() => setEditorOpen(false)}>
            Cancel
          </WuButton>
          <WuButton type="button" onClick={save}>
            Save protection
          </WuButton>
        </div>
      </section>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState
          icon="wm-verified-user"
          title="No surveys are protected"
          description="Choose a survey from Surveys and turn on the checks you need."
          action={
            <WuButton type="button" onClick={openNew}>
              Protect a survey
            </WuButton>
          }
        />
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Survey</th>
              <th scope="col">Protection</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.survey.id}>
                <td>
                  <button
                    type="button"
                    className={`${styles.name} ${styles.link}`}
                    onClick={() => openExisting(row.survey.id)}
                  >
                    {row.survey.name}
                  </button>
                  <p className={styles.meta}>{row.survey.status}</p>
                </td>
                <td>
                  <div>
                    {(row.record.checks?.length ?? 0) > 0
                      ? surveyCheckSummary(row.record.checks)
                      : surveyProtectionSummary(row.record.protections)}
                  </div>
                  <p className={styles.meta}>
                    {(row.record.checks?.length ?? 0) > 0
                      ? toleranceSummary(row.record.checks, row.record.tolerance, SURVEY_CHECKS)
                      : ''}
                  </p>
                </td>
                <td>
                  <div className={styles.actions}>
                    {((row.record.checks?.length ?? 0) > 0
                      ? protectionsForSurveyChecks(row.record.checks).includes('start')
                      : row.record.protections?.includes('start')) ? (
                      <WuTooltip content="Try survey start" position="top">
                        <Link
                          className={`${styles.link} ${styles.action}`}
                          href={`/integrity/check?entry=survey&survey=${row.survey.id}`}
                          aria-label="Try survey start"
                        >
                          <span className={`wm-play-arrow ${styles.actionIcon}`} aria-hidden />
                        </Link>
                      </WuTooltip>
                    ) : null}
                    <WuTooltip content="Turn off" position="top">
                      <button
                        type="button"
                        className={`${styles.link} ${styles.action}`}
                        aria-label="Turn off"
                        onClick={() => setRemoveId(row.survey.id)}
                      >
                        <span className={`wm-toggle-off ${styles.actionIcon}`} aria-hidden />
                      </button>
                    </WuTooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ConfirmModal
        open={removeId !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveId(null);
        }}
        title="Turn off protection?"
        description="This survey will open without Respondent Integrity checks."
        confirmLabel="Turn off"
        variant="critical"
        onConfirm={remove}
      />
    </PageContainer>
  );
}
