'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  filterSurveyCreationTemplates,
  SURVEY_CREATION_TEMPLATES,
  SURVEY_CREATION_TEMPLATES_PER_PAGE,
  type SurveyCreationTemplate,
} from '@/data/mock-survey-creation-flow';
import styles from './SurveyCreationTemplatePicker.module.css';

interface SurveyCreationTemplatePickerProps {
  disabled?: boolean;
  selectedTemplateId?: string | null;
  onSelect: (template: SurveyCreationTemplate) => void;
}

export function SurveyCreationTemplatePicker({
  disabled = false,
  selectedTemplateId = null,
  onSelect,
}: SurveyCreationTemplatePickerProps) {
  const [search, setSearch] = useState('');
  const [templatePage, setTemplatePage] = useState(0);

  const filteredTemplates = useMemo(
    () => filterSurveyCreationTemplates(SURVEY_CREATION_TEMPLATES, search),
    [search]
  );

  const templatePageCount = Math.max(
    1,
    Math.ceil(filteredTemplates.length / SURVEY_CREATION_TEMPLATES_PER_PAGE)
  );

  const visibleTemplates = filteredTemplates.slice(
    templatePage * SURVEY_CREATION_TEMPLATES_PER_PAGE,
    templatePage * SURVEY_CREATION_TEMPLATES_PER_PAGE + SURVEY_CREATION_TEMPLATES_PER_PAGE
  );

  const canGoToPrevTemplates = templatePage > 0;
  const canGoToNextTemplates = templatePage < templatePageCount - 1;
  const hasResults = filteredTemplates.length > 0;

  useEffect(() => {
    setTemplatePage(0);
  }, [search]);

  useEffect(() => {
    if (templatePage >= templatePageCount) {
      setTemplatePage(Math.max(0, templatePageCount - 1));
    }
  }, [templatePage, templatePageCount]);

  return (
    <div className={styles.block}>
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span className={`wm-search ${styles.searchIcon}`} aria-hidden />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search templates by name or goal…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={disabled}
            aria-label="Search survey templates"
          />
        </label>
      </div>

      <div className={styles.carousel} role="group" aria-label="Survey template categories">
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Previous templates"
          disabled={!canGoToPrevTemplates || disabled || !hasResults}
          onClick={() => setTemplatePage((page) => Math.max(0, page - 1))}
        >
          <span className="wm-chevron-left" aria-hidden />
        </button>

        {hasResults ? (
          <div className={styles.templateList}>
            {visibleTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`${styles.templatePill} ${
                  selectedTemplateId === template.id ? styles.templatePillSelected : ''
                }`}
                disabled={disabled}
                onClick={() => onSelect(template)}
              >
                {template.label}
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No templates match your search. Try another keyword.</p>
        )}

        <button
          type="button"
          className={styles.navBtn}
          aria-label="Next templates"
          disabled={!canGoToNextTemplates || disabled || !hasResults}
          onClick={() =>
            setTemplatePage((page) => Math.min(templatePageCount - 1, page + 1))
          }
        >
          <span className="wm-chevron-right" aria-hidden />
        </button>
      </div>

      {hasResults ? (
        <p className={styles.pagination} aria-live="polite">
          Page {templatePage + 1} of {templatePageCount}
        </p>
      ) : null}
    </div>
  );
}
