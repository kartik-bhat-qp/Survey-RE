'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  CONTACT_HUB_STORAGE_KEY,
  EMPTY_CONTACT_HUB,
  formatContactRelative,
  type ContactImportJob,
} from '@/data/mock-contact-hub';
import styles from './ContactHub.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);

type ImportStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type DuplicateHandling = 'update' | 'skip' | 'create-if-new';

const STEPS: { id: ImportStep; label: string }[] = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Map fields' },
  { id: 3, label: 'Map attributes' },
  { id: 4, label: 'Validate' },
  { id: 5, label: 'Duplicates' },
  { id: 6, label: 'Summary' },
  { id: 7, label: 'Confirm' },
];

const SAMPLE_COLUMNS = ['Email', 'First Name', 'Last Name', 'Company', 'Country', 'Customer Type'];

const FIELD_TARGETS = [
  { value: 'email', label: 'Email' },
  { value: 'firstName', label: 'First name' },
  { value: 'lastName', label: 'Last name' },
  { value: 'organization', label: 'Organization' },
  { value: 'country', label: 'Country' },
  { value: 'phone', label: 'Phone' },
  { value: 'skip', label: 'Do not import' },
];

const DUPLICATE_OPTIONS = [
  { value: 'update', label: 'Update existing contact' },
  { value: 'skip', label: 'Skip existing contact' },
  { value: 'create-if-new', label: 'Create only when no matching identity exists' },
];

export function ContactImportPage() {
  const { showToast } = useWuShowToast();
  const [hub, setHub] = usePersistedState(CONTACT_HUB_STORAGE_KEY, EMPTY_CONTACT_HUB);
  const [step, setStep] = useState<ImportStep>(1);
  const [fileName, setFileName] = useState('');
  const [mappings, setMappings] = useState<Record<string, { value: string; label: string }>>({
    Email: FIELD_TARGETS[0],
    'First Name': FIELD_TARGETS[1],
    'Last Name': FIELD_TARGETS[2],
    Company: FIELD_TARGETS[3],
    Country: FIELD_TARGETS[4],
    'Customer Type': { value: 'attr-customer-type', label: 'Customer Type' },
  });
  const [duplicateHandling, setDuplicateHandling] = useState<(typeof DUPLICATE_OPTIONS)[number]>(
    DUPLICATE_OPTIONS[0],
  );

  const attributeTargets = [
    ...hub.attributes.map((attr) => ({ value: attr.id, label: attr.name })),
    { value: 'skip', label: 'Do not import' },
  ];

  function goNext() {
    if (step === 1 && !fileName) {
      showToast({ message: 'Upload a CSV or Excel file first.', variant: 'error' });
      return;
    }
    if (step < 7) setStep((current) => (current + 1) as ImportStep);
  }

  function confirmImport() {
    const job: ContactImportJob = {
      id: `imp-${Date.now()}`,
      fileName: fileName || 'contacts-upload.csv',
      status: 'completed',
      importedAt: new Date().toISOString(),
      added: 36,
      updated: duplicateHandling.value === 'update' ? 12 : 0,
      skipped: duplicateHandling.value === 'skip' ? 12 : 2,
      errors: 1,
    };
    setHub((current) => ({
      ...current,
      imports: [job, ...current.imports],
      growth: current.growth.map((point, index, list) =>
        index === list.length - 1 ? { ...point, total: point.total + job.added } : point,
      ),
    }));
    showToast({
      message: `Import complete: ${job.added} added, ${job.updated} updated, ${job.skipped} skipped.`,
      variant: 'success',
    });
    setStep(1);
    setFileName('');
  }

  return (
    <>
      <div className={styles.steps} aria-label="Import steps">
        {STEPS.map((item) => (
          <span
            key={item.id}
            className={
              item.id === step ? styles.stepOn : item.id < step ? styles.stepDone : styles.step
            }
          >
            {item.id}. {item.label}
          </span>
        ))}
      </div>

      <section className={styles.card}>
        {step === 1 ? (
          <div className={styles.formStack}>
            <h2 className={styles.cardTitle}>Upload CSV or Excel</h2>
            <p className={styles.meta}>
              Use email as the default unique identifier when present. Contacts without email are
              still supported.
            </p>
            <WuButton
              type="button"
              Icon={<span className="wm-upload" aria-hidden />}
              onClick={() => {
                setFileName('contacts-upload.csv');
                showToast({ message: 'File selected: contacts-upload.csv', variant: 'success' });
              }}
            >
              Choose file
            </WuButton>
            {fileName ? <p className={styles.meta}>Selected: {fileName}</p> : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className={styles.formStack}>
            <h2 className={styles.cardTitle}>Map columns to contact fields</h2>
            {SAMPLE_COLUMNS.slice(0, 5).map((column) => (
              <div key={column} className={styles.mapRow}>
                <span>{column}</span>
                <WuSelect
                  data={FIELD_TARGETS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={mappings[column] ?? FIELD_TARGETS[6]}
                  onSelect={(item) =>
                    setMappings((current) => ({
                      ...current,
                      [column]:
                        (item as { value: string; label: string } | null) ?? FIELD_TARGETS[6],
                    }))
                  }
                  variant="outlined"
                />
              </div>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className={styles.formStack}>
            <h2 className={styles.cardTitle}>Map custom attributes</h2>
            <div className={styles.mapRow}>
              <span>Customer Type</span>
              <WuSelect
                data={attributeTargets}
                accessorKey={{ value: 'value', label: 'label' }}
                value={mappings['Customer Type']}
                onSelect={(item) =>
                  setMappings((current) => ({
                    ...current,
                    'Customer Type':
                      (item as { value: string; label: string } | null) ?? attributeTargets[0],
                  }))
                }
                variant="outlined"
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className={styles.formStack}>
            <h2 className={styles.cardTitle}>Validate data</h2>
            <div className={styles.summaryList}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Rows checked</span>
                <span className={styles.statValue}>148</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Valid</span>
                <span className={styles.statValue}>147</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Errors</span>
                <span className={styles.statValue}>1</span>
              </div>
            </div>
            <div className={styles.errorBox}>
              Row 42: invalid email “noah@bad”. Identity can still be created without email if
              phone or external id is provided.
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className={styles.formStack}>
            <h2 className={styles.cardTitle}>Duplicate handling</h2>
            <p className={styles.meta}>12 contacts match an existing email identity.</p>
            <WuSelect
              data={DUPLICATE_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={duplicateHandling}
              onSelect={(item) =>
                setDuplicateHandling(
                  (item as (typeof DUPLICATE_OPTIONS)[number] | null) ?? DUPLICATE_OPTIONS[0],
                )
              }
              variant="outlined"
            />
          </div>
        ) : null}

        {step === 6 ? (
          <div className={styles.formStack}>
            <h2 className={styles.cardTitle}>Import summary</h2>
            <div className={styles.summaryList}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Will add</span>
                <span className={styles.statValue}>36</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Will update</span>
                <span className={styles.statValue}>
                  {duplicateHandling.value === 'update' ? 12 : 0}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Will skip</span>
                <span className={styles.statValue}>
                  {duplicateHandling.value === 'skip' ? 12 : 2}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Row errors</span>
                <span className={styles.statValue}>1</span>
              </div>
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className={styles.formStack}>
            <h2 className={styles.cardTitle}>Confirm import</h2>
            <p className={styles.meta}>
              File {fileName || 'contacts-upload.csv'} will be imported using email as the default
              identity when available.
            </p>
            <WuButton type="button" onClick={confirmImport}>
              Confirm import
            </WuButton>
          </div>
        ) : null}

        {step < 7 ? (
          <div className={styles.toolbarRight}>
            {step > 1 ? (
              <WuButton
                type="button"
                variant="secondary"
                onClick={() => setStep((current) => (current - 1) as ImportStep)}
              >
                Back
              </WuButton>
            ) : null}
            <WuButton type="button" onClick={goNext}>
              Continue
            </WuButton>
          </div>
        ) : null}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Recent imports</h2>
        <ul className={styles.listQuiet}>
          {hub.imports.map((job) => (
            <li key={job.id}>
              <div>
                <div>{job.fileName}</div>
                <p className={styles.meta}>
                  {job.status} · {job.added} added · {job.updated} updated · {job.errors} errors
                </p>
              </div>
              <span className={styles.meta}>{formatContactRelative(job.importedAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
