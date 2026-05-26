'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
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

type DashboardType = 'blank' | 'ai';
type WizardStep = 'type' | 'survey' | 'confirmation';

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

function stepToBreadcrumb(step: WizardStep): 'dashboard' | 'survey' | 'confirmation' {
  if (step === 'type') return 'dashboard';
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
  const [name, setName] = useState('');
  const [isNameError, setIsNameError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyListItem | null>(null);

  const resetWizard = useCallback(() => {
    setStep('type');
    setName('');
    setDashboardType('blank');
    setIsNameError(false);
    setSelectedSurvey(null);
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

    setStep('survey');
  }

  function handleSurveyNext() {
    if (!selectedSurvey) {
      showToast({ message: 'Select a survey to continue', variant: 'error' });
      return;
    }
    setStep('confirmation');
  }

  function handleBreadcrumbClick(target: 'dashboard' | 'survey' | 'confirmation') {
    if (target === 'dashboard') setStep('type');
    if (target === 'survey') setStep('survey');
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
                onClick={() => setStep(step === 'confirmation' ? 'survey' : 'type')}
              >
                Back
              </WuButton>
              {step === 'survey' ? (
                <WuButton onClick={handleSurveyNext}>Next</WuButton>
              ) : (
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
