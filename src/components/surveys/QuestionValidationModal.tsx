'use client';

import { useEffect, useState } from 'react';
import { HelpFileLink } from '@/components/surveys/HelpFileLink';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  createDefaultQuestionValidation,
  QUESTION_VALIDATION_TYPE_OPTIONS,
  type QuestionValidationState,
  type QuestionValidationType,
} from '@/data/mock-question-validation';
import styles from './QuestionValidationModal.module.css';

type ValidationTab = 'type' | 'messages';

export interface QuestionValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  required?: boolean;
  initialState?: QuestionValidationState;
  onApply?: (state: QuestionValidationState) => void;
}

export function QuestionValidationModal({
  open,
  onOpenChange,
  required = false,
  initialState,
  onApply,
}: QuestionValidationModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [activeTab, setActiveTab] = useState<ValidationTab>('type');
  const [state, setState] = useState<QuestionValidationState>(() =>
    createDefaultQuestionValidation(required)
  );

  useEffect(() => {
    if (!open) return;
    setState(initialState ?? createDefaultQuestionValidation(required));
    setActiveTab('type');
  }, [open, initialState, required]);

  function handleApply() {
    onApply?.(state);
    onOpenChange(false);
    showToast({ message: 'Validation applied', variant: 'success' });
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      size="md"
      className={styles.modal}
      variant="action"
    >
      <WuModalHeader>
        <div className={styles.modalTitleRow}>
          <span>Validation</span>
          <HelpFileLink topic="validation" label="Validation help" />
        </div>
      </WuModalHeader>

      <WuModalContent className={styles.content}>
        <div className={styles.tabList} role="tablist" aria-label="Validation settings">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'type'}
            className={`${styles.tabBtn} ${activeTab === 'type' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('type')}
          >
            Validation Type
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'messages'}
            className={`${styles.tabBtn} ${activeTab === 'messages' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            Validation Messages
          </button>
        </div>

        <div className={styles.panel} role="tabpanel">
          {activeTab === 'type' ? (
            <ul className={styles.radioList}>
              {QUESTION_VALIDATION_TYPE_OPTIONS.map((option) => (
                <li key={option.value}>
                  <label className={styles.radioItem}>
                    <input
                      type="radio"
                      name="validation-type"
                      checked={state.validationType === option.value}
                      onChange={() =>
                        setState((prev) => ({
                          ...prev,
                          validationType: option.value as QuestionValidationType,
                        }))
                      }
                    />
                    {option.label}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <>
              {state.validationType === 'force-response' ? (
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="force-response-message">
                    Force response message
                  </label>
                  <input
                    id="force-response-message"
                    type="text"
                    className={styles.textInput}
                    value={state.forceResponseMessage}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        forceResponseMessage: event.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}
              {state.validationType === 'request-response' ? (
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="request-response-message">
                    Request response message
                  </label>
                  <input
                    id="request-response-message"
                    type="text"
                    className={styles.textInput}
                    value={state.requestResponseMessage}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        requestResponseMessage: event.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}
              {state.validationType === 'none' ? (
                <p className={styles.placeholder}>
                  No validation messages are shown when validation type is set to None.
                </p>
              ) : null}
            </>
          )}
        </div>
      </WuModalContent>

      <WuModalFooter className={styles.modalFooter}>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton variant="primary" onClick={handleApply}>
          Apply
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
