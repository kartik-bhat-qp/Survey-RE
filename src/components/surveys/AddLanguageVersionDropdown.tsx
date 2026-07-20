'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ALL_SURVEY_LANGUAGES,
  FEATURED_SURVEY_LANGUAGES,
  filterAddableSurveyLanguages,
  getAddableSurveyLanguageById,
  type AddableSurveyLanguage,
} from '@/data/mock-survey-languages';
import styles from './AddLanguageVersionDropdown.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const DEFAULT_LANGUAGE_ID = 'en';

interface AddLanguageVersionDropdownProps {
  /** Language ids already on the survey (including default). These are hidden from the list. */
  addedIds: string[];
  onSave: (languages: AddableSurveyLanguage[]) => void;
}

export function AddLanguageVersionDropdown({
  addedIds,
  onSave,
}: AddLanguageVersionDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draftIds, setDraftIds] = useState<string[]>([]);

  const addedIdSet = useMemo(
    () => new Set([...addedIds, DEFAULT_LANGUAGE_ID]),
    [addedIds]
  );
  const draftIdSet = useMemo(() => new Set(draftIds), [draftIds]);

  const availableFeatured = useMemo(
    () =>
      FEATURED_SURVEY_LANGUAGES.filter((language) => !addedIdSet.has(language.id)),
    [addedIdSet]
  );
  const availableAll = useMemo(
    () => ALL_SURVEY_LANGUAGES.filter((language) => !addedIdSet.has(language.id)),
    [addedIdSet]
  );

  const filteredFeatured = useMemo(
    () => filterAddableSurveyLanguages(availableFeatured, search),
    [availableFeatured, search]
  );
  const filteredAll = useMemo(
    () => filterAddableSurveyLanguages(availableAll, search),
    [availableAll, search]
  );
  const hasResults = filteredFeatured.length > 0 || filteredAll.length > 0;
  const hasAvailableLanguages = availableFeatured.length > 0 || availableAll.length > 0;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleToggleOpen(): void {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setSearch('');
        setDraftIds([]);
      }
      return next;
    });
  }

  function handleToggleLanguage(language: AddableSurveyLanguage): void {
    if (addedIdSet.has(language.id)) return;
    setDraftIds((prev) =>
      prev.includes(language.id)
        ? prev.filter((id) => id !== language.id)
        : [...prev, language.id]
    );
  }

  function handleClearSelection(): void {
    setDraftIds([]);
  }

  function handleSave(): void {
    if (draftIds.length === 0) return;
    const languages = draftIds
      .map((id) => getAddableSurveyLanguageById(id))
      .filter(
        (language): language is AddableSurveyLanguage =>
          language != null && !addedIdSet.has(language.id)
      );
    if (languages.length === 0) return;
    onSave(languages);
    setOpen(false);
  }

  function renderLanguageButton(language: AddableSurveyLanguage): React.ReactNode {
    const isSelected = draftIdSet.has(language.id);
    return (
      <button
        key={language.id}
        type="button"
        className={`${styles.languageItem} ${isSelected ? styles.languageItemSelected : ''}`}
        aria-pressed={isSelected}
        onClick={() => handleToggleLanguage(language)}
      >
        {isSelected ? (
          <span className={`wm-check ${styles.checkIcon}`} aria-hidden />
        ) : (
          <span className={styles.checkPlaceholder} aria-hidden />
        )}
        <span className={styles.languageName}>{language.name}</span>
      </button>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <WuButton
        Icon={<span className="wm-add" aria-hidden />}
        onClick={handleToggleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={!hasAvailableLanguages}
      >
        Add Languages
      </WuButton>

      {open ? (
        <div className={styles.dropdown} role="dialog" aria-label="Add languages">
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
              autoFocus
            />
          </div>

          {hasResults ? (
            <div className={styles.languageScroller}>
              {filteredFeatured.length > 0 ? (
                <div className={styles.languageList}>
                  {filteredFeatured.map(renderLanguageButton)}
                </div>
              ) : null}

              {filteredFeatured.length > 0 && filteredAll.length > 0 ? (
                <div className={styles.sectionDivider} role="separator" />
              ) : null}

              {filteredAll.length > 0 ? (
                <div className={styles.languageList}>
                  {filteredAll.map(renderLanguageButton)}
                </div>
              ) : null}
            </div>
          ) : (
            <p className={styles.emptySearch}>
              {search.trim()
                ? `No languages match \u201c${search.trim()}\u201d.`
                : 'All available languages have been added.'}
            </p>
          )}

          <div className={styles.footer}>
            <p className={styles.selectionCount} aria-live="polite">
              {draftIds.length === 0
                ? 'No languages selected'
                : `${draftIds.length} language${draftIds.length === 1 ? '' : 's'} selected`}
            </p>
            <div className={styles.footerActions}>
              <WuButton variant="secondary" onClick={handleClearSelection}>
                Clear Selection
              </WuButton>
              <WuButton onClick={handleSave} disabled={draftIds.length === 0}>
                Save
              </WuButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
