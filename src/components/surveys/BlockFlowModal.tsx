'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { useSurveyWorkspaceSections } from '@/components/surveys/SurveyWorkspaceSectionsContext';
import styles from './BlockFlowModal.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface BlockFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.125;

export function BlockFlowModal({ open, onOpenChange }: BlockFlowModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const { sections } = useSurveyWorkspaceSections();
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
  }, [open]);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  function handleSave(): void {
    showToast({ message: 'Block flow saved', variant: 'success' });
    handleModalOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      className={styles.modal}
      variant="action"
      size="md"
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>Block Flow</span>
        <WuTooltip
          content="Reorder blocks and configure randomizer and logic flow for your survey."
          position="bottom"
        >
          <button type="button" className={styles.helpBtn} aria-label="Help">
            <span className="wm-help-outline" aria-hidden />
          </button>
        </WuTooltip>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.toolbarBtn}
            aria-label="Download PDF"
            onClick={() => showToast({ message: 'PDF download started', variant: 'success' })}
          >
            <span className="wm-picture-as-pdf" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.zoomBtn}
            aria-label="Zoom in"
            onClick={() => setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP))}
          >
            <span className="wm-add" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.zoomBtn}
            aria-label="Zoom out"
            onClick={() => setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP))}
          >
            <span className="wm-remove" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.resetLink}
            onClick={() => setZoom(1)}
          >
            Reset
          </button>
        </div>

        <div className={styles.flowCanvas} style={{ transform: `scale(${zoom})` }}>
          {sections.length === 0 ? (
            <p className={styles.emptyState}>No blocks available.</p>
          ) : (
            <div className={styles.blockList}>
              {sections.map((section) => (
                <div key={section.id} className={styles.blockRow}>
                  <span className={styles.blockTitle}>{section.title}</span>
                  <div className={styles.blockActions}>
                    <button
                      type="button"
                      className={styles.blockActionBtn}
                      onClick={() =>
                        showToast({
                          message: `${section.title} randomizer settings opened`,
                          variant: 'info',
                        })
                      }
                    >
                      <span className="wm-autorenew" aria-hidden />
                      Randomizer
                    </button>
                    <button
                      type="button"
                      className={styles.blockActionBtn}
                      onClick={() =>
                        showToast({
                          message: `${section.title} logic flow opened`,
                          variant: 'info',
                        })
                      }
                    >
                      <span className="wm-call-split" aria-hidden />
                      Logic
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuButton onClick={handleSave}>Save</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
