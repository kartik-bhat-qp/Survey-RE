'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  BLANK_SURVEY_CREATE_IMPORT_OPTIONS,
  type BlankSurveyCreateOption,
} from '@/data/mock-survey-creation-flow';
import styles from './BlankSurveyCreateModal.module.css';

interface BlankSurveyCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWithPrompt: (prompt: string) => void;
  onSelectImport: (option: BlankSurveyCreateOption) => void;
}

export function BlankSurveyCreateModal({
  open,
  onOpenChange,
  onCreateWithPrompt,
  onSelectImport,
}: BlankSurveyCreateModalProps) {
  const wick = useWickUILib();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (!open) return;
    setPrompt('');
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  function handleCreate() {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onCreateWithPrompt(trimmed);
    handleModalOpenChange(false);
  }

  function handleImport(option: BlankSurveyCreateOption) {
    onSelectImport(option);
    handleModalOpenChange(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleCreate();
    }
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;
  const canCreate = prompt.trim().length > 0;

  return (
    <WuModal open onOpenChange={handleModalOpenChange} variant="action" size="md">
      <WuModalHeader>What would you like to create?</WuModalHeader>
      <WuModalContent>
        <div className={styles.content}>
          <label className={styles.label} htmlFor="blank-survey-create-prompt">
            Describe your survey, or import from a document
          </label>
          <textarea
            ref={inputRef}
            id="blank-survey-create-prompt"
            className={styles.textarea}
            rows={4}
            value={prompt}
            placeholder="e.g. A short customer satisfaction survey with NPS and a few open-ended questions…"
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
          />

          <p className={styles.importLabel}>Import from</p>
          <div className={styles.importOptions}>
            {BLANK_SURVEY_CREATE_IMPORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.importOption}
                onClick={() => handleImport(option)}
              >
                <span
                  className={`${option.icon} ${styles.importIcon} ${
                    option.iconClassName === 'word'
                      ? styles.importIconWord
                      : option.iconClassName === 'pdf'
                        ? styles.importIconPdf
                        : ''
                  }`}
                  aria-hidden
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Skip</WuModalClose>
        <WuButton onClick={handleCreate} disabled={!canCreate}>
          Create
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
