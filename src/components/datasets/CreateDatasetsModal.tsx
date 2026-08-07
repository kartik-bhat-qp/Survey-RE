'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { PUBLIC_IMAGES } from '@/lib/public-images';
import styles from './CreateDatasetsModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

export type DatasetCreateType = 'fresh' | 'map';

interface CreateDatasetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DatasetTypeCardProps {
  selected: boolean;
  iconSrc: string;
  iconAlt: string;
  title: string;
  description: string;
  onSelect: () => void;
}

function DatasetTypeCard({
  selected,
  iconSrc,
  iconAlt,
  title,
  description,
  onSelect,
}: DatasetTypeCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      aria-pressed={selected}
    >
      <Image
        src={iconSrc}
        alt={iconAlt}
        width={64}
        height={64}
        className={styles.icon}
      />
      <div className={styles.textContainer}>
        <div className={styles.title}>{title}</div>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}

export function CreateDatasetsModal({ open, onOpenChange }: CreateDatasetsModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [createType, setCreateType] = useState<DatasetCreateType>('fresh');

  useEffect(() => {
    if (open) {
      setCreateType('fresh');
    }
  }, [open]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose } = wick;

  function handleNext(): void {
    const label = createType === 'fresh' ? 'Fresh Data' : 'Map to survey';
    showToast({
      message: `${label} setup will be available in a future update.`,
      variant: 'info',
    });
    onOpenChange(false);
  }

  return (
    <WuModal open onOpenChange={onOpenChange} className={styles.modal} variant="action">
      <WuModalHeader className={styles.modalTitle}>Create Datasets</WuModalHeader>
      <WuModalContent className="!overflow-hidden !min-h-0">
        <div className={styles.typeGrid}>
          <DatasetTypeCard
            selected={createType === 'fresh'}
            iconSrc={PUBLIC_IMAGES.createDataset.freshData}
            iconAlt="Fresh Data"
            title="Fresh Data"
            description="Import an entirely new dataset"
            onSelect={() => setCreateType('fresh')}
          />
          <DatasetTypeCard
            selected={createType === 'map'}
            iconSrc={PUBLIC_IMAGES.createDataset.mapToSurvey}
            iconAlt="Map to survey"
            title="Map to survey"
            description="Map the survey responses with additional data"
            onSelect={() => setCreateType('map')}
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleNext}>Next</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
