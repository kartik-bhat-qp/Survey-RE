'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  ADD_LANGUAGE_VERSION_HELP,
  ALL_SURVEY_LANGUAGES,
  FEATURED_SURVEY_LANGUAGES,
  filterAddableSurveyLanguages,
  type AddableSurveyLanguage,
} from '@/data/mock-survey-languages';
import styles from './AddLanguageVersionModal.module.css';

interface AddLanguageVersionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Language ids already on the survey (including default English). */
  selectedIds: string[];
  onSave: (selectedIds: string[]) => void;
}

const DEFAULT_LANGUAGE_ID = 'en';

export function AddLanguageVersionModal({
  open,
  onOpenChange,
  selectedIds,
  onSave,
}: AddLanguageVersionModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');
  const [draftSelectedIds, setDraftSelectedIds] = useState<Set<string>>(
    () => new Set(selectedIds)
  );

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setDraftSelectedIds(new Set(selectedIds));
  }, [open, selectedIds]);

  const filteredFeatured = useMemo(
    () => filterAddableSurveyLanguages(FEATURED_SURVEY_LANGUAGES, search),
    [search]
  );
  const filteredAll = useMemo(
    () => filterAddableSurveyLanguages(ALL_SURVEY_LANGUAGES, search),
    [search]
  );

  const hasResults = filteredFeatured.length > 0 || filteredAll.length > 0;

  function toggleLanguage(language: AddableSurveyLanguage): void {
    if (language.id === DEFAULT_LANGUAGE_ID) return;
    setDraftSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(language.id)) {
        next.delete(language.id);
      } else {
        next.add(language.id);
      }
      return next;
    });
  }

  function handleSave(): void {
    const nextIds = Array.from(draftSelectedIds);
    if (!nextIds.includes(DEFAULT_LANGUAGE_ID)) {
      nextIds.unshift(DEFAULT_LANGUAGE_ID);
    }
    onSave(nextIds);
    const addedCount = nextIds.filter((id) => !selectedIds.includes(id)).length;
    const removedCount = selectedIds.filter((id) => !nextIds.includes(id)).length;
    if (addedCount === 0 && removedCount === 0) {
      showToast({ message: 'No language changes', variant: 'info' });
    } else {
      const parts: string[] = [];
      if (addedCount > 0) {
        parts.push(`${addedCount} language${addedCount === 1 ? '' : 's'} added`);
      }
      if (removedCount > 0) {
        parts.push(`${removedCount} language${removedCount === 1 ? '' : 's'} removed`);
      }
      showToast({ message: parts.join(', '), variant: 'success' });
    }
    onOpenChange(false);
  }

  function renderLanguageButton(language: AddableSurveyLanguage): React.ReactNode {
    const isDefault = language.id === DEFAULT_LANGUAGE_ID;
    const isSelected = draftSelectedIds.has(language.id);
    return (
      <button
        key={language.id}
        type="button"
        className={`${styles.languageItem} ${
          isSelected ? (isDefault ? styles.languageItemDefault : styles.languageItemSelected) : ''
        }`}
        aria-pressed={isSelected}
        disabled={isDefault}
        onClick={() => toggleLanguage(language)}
      >
        {isSelected ? (
          <span
            className={`wm-check ${styles.checkIcon} ${
              isDefault ? styles.checkIconDefault : ''
            }`}
            aria-hidden
          />
        ) : (
          <span className={styles.checkPlaceholder} aria-hidden />
        )}
        <span className={styles.languageName}>{language.name}</span>
      </button>
    );
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton, WuInput, WuTooltip } =
    wick;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      variant="action"
      size="lg"
      className={styles.modal}
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>
          Add Language Version
          <WuTooltip content={ADD_LANGUAGE_VERSION_HELP} position="bottom">
            <button
              type="button"
              className={styles.helpBtn}
              aria-label={ADD_LANGUAGE_VERSION_HELP}
            >
              <span className="wm-help-outline" aria-hidden />
            </button>
          </WuTooltip>
        </span>
      </WuModalHeader>

      <WuModalContent className={styles.content}>
        <div className={styles.searchRow}>
          <WuInput
            variant="outlined"
            placeholder="Search Language"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(event.target.value)
            }
            className={styles.searchInput}
          />
        </div>

        {hasResults ? (
          <div className={styles.languageScroller}>
            {filteredFeatured.length > 0 ? (
              <div className={styles.languageGrid}>{filteredFeatured.map(renderLanguageButton)}</div>
            ) : null}

            {filteredFeatured.length > 0 && filteredAll.length > 0 ? (
              <div className={styles.sectionDivider} role="separator" />
            ) : null}

            {filteredAll.length > 0 ? (
              <div className={styles.languageGrid}>{filteredAll.map(renderLanguageButton)}</div>
            ) : null}
          </div>
        ) : (
          <p className={styles.emptySearch}>
            No languages match &ldquo;{search.trim()}&rdquo;.
          </p>
        )}
      </WuModalContent>

      <WuModalFooter className={styles.footer}>
        <WuButton onClick={handleSave}>Save Changes</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
