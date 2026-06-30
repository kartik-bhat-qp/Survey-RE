'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { AiDataSourceSelection } from '@/components/dashboards/AiDataSourceSelection';
import { AiDashboardConfirmation } from '@/components/dashboards/AiDashboardConfirmation';
import { CreateDashboardStepBreadcrumb } from '@/components/dashboards/CreateDashboardStepBreadcrumb';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { WuLoaderWrapper } from '@/components/ui/WuLoaderWrapper';
import type { SurveyListItem } from '@/data/mock-survey-folders';
import { PUBLIC_IMAGES } from '@/lib/public-images';
import cardStyles from './DashboardTypeCard.module.css';
import styles from './CreateDashboardModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false }
);
const WuLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLabel })),
  { ssr: false }
);
const WuHelpButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHelpButton })),
  { ssr: false }
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false }
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

type DashboardType = 'blank' | 'ai';
type AiMethod = 'learn' | 'prompt';
type WizardStep = 'type' | 'method' | 'survey' | 'learn' | 'prompt' | 'confirmation';

type ReferenceDashboard = {
  id: number;
  name: string;
  updated: string;
  source: string;
};

export interface CreateDashboardSurvey {
  id: number;
  name: string;
}

interface CreateDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  onCreate: (name: string, type: DashboardType, survey?: CreateDashboardSurvey) => void;
}

interface DashboardTypeCardProps {
  selected: boolean;
  iconSrc: string;
  iconAlt: string;
  title: string;
  description: string;
  helpButton?: React.ReactNode;
  onSelect: () => void;
}

const REFERENCE_DASHBOARDS: ReferenceDashboard[] = [
  {
    id: 101,
    name: 'Executive Customer Health',
    updated: 'Updated 2 days ago',
    source: 'Customer Experience Tracker',
  },
  {
    id: 102,
    name: 'NPS Across Demographics',
    updated: 'Updated 3 days ago',
    source: 'Brand Loyalty Survey',
  },
  {
    id: 103,
    name: 'Guest Dining Preferences',
    updated: 'Updated 7 days ago',
    source: 'Hospitality Feedback Study',
  },
  {
    id: 104,
    name: 'Product Feedback Command Center',
    updated: 'Updated Apr 28 2026',
    source: 'Product Experience Program',
  },
  {
    id: 105,
    name: 'Market Segmentation Overview',
    updated: 'Updated Apr 20 2026',
    source: 'Market Insights Panel',
  },
  {
    id: 106,
    name: 'Employee Engagement Pulse',
    updated: 'Updated Apr 17 2026',
    source: 'People Operations Survey',
  },
];

function DashboardTypeCard({
  selected,
  iconSrc,
  iconAlt,
  title,
  description,
  helpButton,
  onSelect,
}: DashboardTypeCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`${cardStyles.card} ${selected ? cardStyles.cardSelected : ''}`}
    >
      <Image
        src={iconSrc}
        alt={iconAlt}
        width={64}
        height={64}
        className={cardStyles.icon}
      />
      <div className={cardStyles.textContainer}>
        <div className={cardStyles.title}>
          {title}
          {helpButton}
        </div>
        <p className={cardStyles.description}>{description}</p>
      </div>
    </div>
  );
}

function AiMethodSelection({
  selectedMethod,
  onSelectMethod,
}: {
  selectedMethod: AiMethod;
  onSelectMethod: (method: AiMethod) => void;
}) {
  const methods = [
    {
      id: 'learn' as const,
      icon: 'wm-school',
      title: 'Learn from Existing Dashboards',
      description:
        'Analyze layout structure, widget patterns, color themes, and reporting behavior from dashboards your team already trusts.',
    },
    {
      id: 'prompt' as const,
      icon: 'wm-edit-note',
      title: 'Create from Prompt',
      description:
        'Describe the dashboard you want and let AI propose widgets, filters, and data slicers.',
    },
  ];

  return (
    <div className={styles.methodGrid}>
      {methods.map((method) => {
        const isSelected = selectedMethod === method.id;

        return (
          <WuCard
            key={method.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectMethod(method.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectMethod(method.id);
              }
            }}
            className={`${styles.methodCard} ${isSelected ? styles.methodCardSelected : ''}`}
          >
            <span className={styles.methodIcon}>
              <span className={`${method.icon} text-[24px]`} aria-hidden="true" />
            </span>
            <span className={styles.methodText}>
              <span className={styles.methodTitle}>{method.title}</span>
              <span className={styles.methodDescription}>{method.description}</span>
            </span>
          </WuCard>
        );
      })}
    </div>
  );
}

function AiLearnFromDashboards({
  selectedReferences,
  onToggleReference,
}: {
  selectedReferences: number[];
  onToggleReference: (id: number) => void;
}) {
  const [search, setSearch] = useState('');

  const filteredReferences = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return REFERENCE_DASHBOARDS;
    }

    return REFERENCE_DASHBOARDS.filter((dashboard) =>
      `${dashboard.name} ${dashboard.source}`.toLowerCase().includes(normalizedSearch)
    );
  }, [search]);

  const columns: IWuTableColumnDef<ReferenceDashboard>[] = [
    {
      accessorKey: 'selected',
      header: '',
      size: 56,
      cellAlign: 'center',
      cell: ({ row }) => {
        const isSelected = selectedReferences.includes(row.original.id);
        const isDisabled = !isSelected && selectedReferences.length >= 5;

        return (
          <WuCheckbox
            checked={isSelected}
            disabled={isDisabled}
            onChange={() => onToggleReference(row.original.id)}
            aria-label={`Select ${row.original.name}`}
          />
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Dashboard',
      filterable: true,
      size: 260,
      cell: ({ row }) => (
        <span title={row.original.name} className={styles.referenceName}>
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Survey source',
      filterable: true,
      size: 220,
      cell: ({ row }) => (
        <span title={row.original.source} className={styles.referenceSource}>
          {row.original.source}
        </span>
      ),
    },
    {
      accessorKey: 'updated',
      header: 'Updated',
      filterable: true,
      size: 152,
      cell: ({ row }) => row.original.updated,
    },
  ];

  return (
    <div className={styles.aiStep}>
      <div className={styles.aiStepHeader}>
        <div>
          <h3 className={styles.aiStepTitle}>Learn from existing dashboards</h3>
          <p className={styles.aiStepDescription}>
            Select up to 5 dashboards for AI to learn layout, widgets, and styling.
          </p>
        </div>
        <span className={styles.referenceCount}>{selectedReferences.length}/5 selected</span>
      </div>

      <WuInput
        variant="outlined"
        placeholder="Search dashboards or survey sources"
        Icon={<span className="wm-search text-[14px]" aria-hidden="true" />}
        iconPosition="left"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className={styles.referenceSearch}
      />

      <div className={styles.referenceTable}>
        <WuTable
          data={filteredReferences as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="bordered"
          size="compact"
          sort={{ enabled: true }}
          tableLayout="fixed"
          NoDataContent="No dashboards match your search."
        />
      </div>
    </div>
  );
}

function AiPromptStep({
  prompt,
  onPromptChange,
  createFilters,
  onCreateFiltersChange,
  createDataSlicers,
  onCreateDataSlicersChange,
}: {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  createFilters: boolean;
  onCreateFiltersChange: (enabled: boolean) => void;
  createDataSlicers: boolean;
  onCreateDataSlicersChange: (enabled: boolean) => void;
}) {
  return (
    <div className={styles.aiStep}>
      <h3 className={styles.aiStepTitle}>Provide dashboard context</h3>
      <p className={styles.aiStepDescription}>
        Describe the dashboard you want AI to create from the selected survey.
      </p>
      <WuTextarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Example: Create an executive dashboard for the selected survey that highlights response volume, NPS, satisfaction trends, demographic differences, and key open-text themes."
        className={styles.promptTextarea}
      />
      <div className={styles.promptOptions}>
        <div className={styles.promptOptionRow}>
          <div>
            <span className={styles.promptOptionLabel}>Create filters</span>
            <span className={styles.promptOptionDescription}>
              Let AI generate dashboard-level filters from the selected survey fields.
            </span>
          </div>
          <WuToggle
            checked={createFilters}
            onChange={onCreateFiltersChange}
            aria-label="Create filters"
          />
        </div>
        <div className={styles.promptOptionRow}>
          <div>
            <span className={styles.promptOptionLabel}>Create data slicers</span>
            <span className={styles.promptOptionDescription}>
              Let AI add slicers for quick segment comparisons across widgets.
            </span>
          </div>
          <WuToggle
            checked={createDataSlicers}
            onChange={onCreateDataSlicersChange}
            aria-label="Create data slicers"
          />
        </div>
      </div>
    </div>
  );
}

function stepToBreadcrumb(step: WizardStep): 'dashboard' | 'survey' | 'confirmation' {
  if (step === 'type' || step === 'method') return 'dashboard';
  if (step === 'survey') return 'survey';
  return 'confirmation';
}

export function CreateDashboardModal({
  open,
  onOpenChange,
  defaultName,
  onCreate,
}: CreateDashboardModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<WizardStep>('type');
  const [dashboardType, setDashboardType] = useState<DashboardType>('blank');
  const [aiMethod, setAiMethod] = useState<AiMethod>('learn');
  const [name, setName] = useState('');
  const [isNameError, setIsNameError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyListItem | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<number[]>([]);
  const [prompt, setPrompt] = useState('');
  const [createFilters, setCreateFilters] = useState(true);
  const [createDataSlicers, setCreateDataSlicers] = useState(true);

  const resetWizard = useCallback(() => {
    setStep('type');
    setName('');
    setDashboardType('blank');
    setAiMethod('learn');
    setIsNameError(false);
    setSelectedSurvey(null);
    setSelectedReferences([]);
    setPrompt('');
    setCreateFilters(true);
    setCreateDataSlicers(true);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) resetWizard();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetWizard]
  );

  function handleClose() {
    handleOpenChange(false);
  }

  function getTrimmedName(): string {
    return (name.trim() || defaultName).trim();
  }

  function validateName(): boolean {
    const trimmed = getTrimmedName();
    if (!trimmed) {
      setIsNameError(true);
      return false;
    }
    return true;
  }

  async function handleTypeContinue() {
    if (!validateName()) return;

    if (dashboardType === 'blank') {
      setIsSaving(true);
      onCreate(getTrimmedName(), 'blank');
      setIsSaving(false);
      handleClose();
      return;
    }

    setStep('method');
  }

  function handleMethodNext() {
    setStep('survey');
  }

  function handleSurveyNext() {
    if (!selectedSurvey) {
      showToast({ message: 'Select a survey to continue', variant: 'error' });
      return;
    }
    setStep(aiMethod === 'learn' ? 'learn' : 'prompt');
  }

  function handleAiDetailNext() {
    if (step === 'learn' && selectedReferences.length === 0) {
      showToast({
        message: 'Select at least one dashboard to continue',
        variant: 'error',
      });
      return;
    }

    if (step === 'prompt' && !prompt.trim()) {
      showToast({
        message: 'Enter a prompt to continue',
        variant: 'error',
      });
      return;
    }

    setStep('confirmation');
  }

  function handleBreadcrumbClick(target: 'dashboard' | 'survey' | 'confirmation') {
    if (target === 'dashboard') setStep('type');
    if (target === 'survey' && step !== 'method') setStep('survey');
  }

  async function handleCreate() {
    if (!selectedSurvey) return;
    setIsSaving(true);
    onCreate(getTrimmedName(), 'ai', {
      id: selectedSurvey.id,
      name: selectedSurvey.name,
    });
    setIsSaving(false);
    handleClose();
  }

  function toggleReference(id: number) {
    setSelectedReferences((currentSelection) => {
      if (currentSelection.includes(id)) {
        return currentSelection.filter((selectedId) => selectedId !== id);
      }

      if (currentSelection.length >= 5) {
        return currentSelection;
      }

      return [...currentSelection, id];
    });
  }

  const modalClassName = step === 'type' ? styles.modal : styles.modalWide;

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={modalClassName}
      variant="action"
    >
      <WuModalHeader className={styles.modalTitle}>Create dashboard</WuModalHeader>

      <WuLoaderWrapper showLoader={isSaving} className="min-h-[200px]">
      {step === 'type' && (
        <WuModalContent className="!overflow-hidden !min-h-0">
          <WuFormGroup
            Label={<WuLabel>Name</WuLabel>}
            Error={isNameError ? 'Dashboard name is required' : undefined}
            Input={
              <WuInput
                variant="outlined"
                placeholder={defaultName}
                value={name}
                autoFocus
                maxLength={100}
                onChange={(e) => {
                  if (isNameError && e.target.value.trim()) setIsNameError(false);
                  setName(e.target.value);
                }}
              />
            }
          />

          <div className={styles.typeGrid}>
            <DashboardTypeCard
              selected={dashboardType === 'blank'}
              iconSrc={PUBLIC_IMAGES.createDashboard.blank}
              iconAlt="Blank dashboard"
              title="Blank dashboard"
              description="Fill your dashboard with customizable widgets"
              onSelect={() => setDashboardType('blank')}
            />
            <DashboardTypeCard
              selected={dashboardType === 'ai'}
              iconSrc={PUBLIC_IMAGES.createDashboard.qxbot}
              iconAlt="AI dashboard"
              title="AI dashboard"
              description="Create a dashboard using AI for your survey"
              helpButton={
                <span
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <WuHelpButton
                    idOrSlugOrUrl="ai-dashboard"
                    variant="primary"
                    onClick={() =>
                      showToast({
                        message: 'AI dashboard creates widgets from your survey data',
                        variant: 'success',
                      })
                    }
                  />
                </span>
              }
              onSelect={() => setDashboardType('ai')}
            />
          </div>
        </WuModalContent>
      )}

      {step === 'survey' && (
        <WuModalContent className={styles.surveyContent}>
          <AiDataSourceSelection
            selectedSurveyId={selectedSurvey?.id ?? null}
            onSelectSurvey={setSelectedSurvey}
          />
        </WuModalContent>
      )}

      {step === 'method' && (
        <WuModalContent className="!overflow-hidden !min-h-0">
          <AiMethodSelection
            selectedMethod={aiMethod}
            onSelectMethod={setAiMethod}
          />
        </WuModalContent>
      )}

      {step === 'learn' && (
        <WuModalContent className={styles.aiStepContent}>
          <AiLearnFromDashboards
            selectedReferences={selectedReferences}
            onToggleReference={toggleReference}
          />
        </WuModalContent>
      )}

      {step === 'prompt' && (
        <WuModalContent className={styles.aiStepContent}>
          <AiPromptStep
            prompt={prompt}
            onPromptChange={setPrompt}
            createFilters={createFilters}
            onCreateFiltersChange={setCreateFilters}
            createDataSlicers={createDataSlicers}
            onCreateDataSlicersChange={setCreateDataSlicers}
          />
        </WuModalContent>
      )}

      {step === 'confirmation' && selectedSurvey && (
        <WuModalContent className="!overflow-hidden !min-h-0">
          <AiDashboardConfirmation surveyName={selectedSurvey.name} />
        </WuModalContent>
      )}
      </WuLoaderWrapper>

      <WuModalFooter>
        {step === 'type' ? (
          <div className={styles.typeFooter}>
            <WuButton variant="secondary" onClick={handleClose}>
              Cancel
            </WuButton>
            <WuButton onClick={handleTypeContinue} disabled={isSaving}>
              Continue
            </WuButton>
          </div>
        ) : (
          <div className={styles.wizardFooter}>
            <CreateDashboardStepBreadcrumb
              currentStep={stepToBreadcrumb(step)}
              onStepClick={handleBreadcrumbClick}
            />
            <div className={styles.wizardActions}>
              <WuButton
                variant="secondary"
                onClick={() => {
                  if (step === 'confirmation') {
                    setStep(aiMethod === 'learn' ? 'learn' : 'prompt');
                    return;
                  }
                  if (step === 'learn' || step === 'prompt') {
                    setStep('survey');
                    return;
                  }
                  if (step === 'survey') {
                    setStep('method');
                    return;
                  }
                  setStep('type');
                }}
              >
                Back
              </WuButton>
              {step === 'method' && (
                <WuButton onClick={handleMethodNext}>Continue</WuButton>
              )}
              {step === 'survey' && (
                <WuButton onClick={handleSurveyNext}>Next</WuButton>
              )}
              {(step === 'learn' || step === 'prompt') && (
                <WuButton onClick={handleAiDetailNext}>Next</WuButton>
              )}
              {step === 'confirmation' && (
                <WuButton onClick={handleCreate} disabled={isSaving}>
                  Create
                </WuButton>
              )}
            </div>
          </div>
        )}
      </WuModalFooter>
    </WuModal>
  );
}
