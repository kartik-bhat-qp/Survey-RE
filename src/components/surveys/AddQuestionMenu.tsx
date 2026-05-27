'use client';

import { createPortal } from 'react-dom';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import dynamic from 'next/dynamic';
import {
  ADD_QUESTION_CATEGORIES,
  filterAddQuestionCategories,
  type AddQuestionCategory,
  type AddQuestionTypeItem,
  type QuestionTypeTier,
} from '@/data/mock-add-question-types';
import {
  getQuestionTypePreview,
  type QuestionTypePreviewContent,
} from '@/data/mock-add-question-previews';
import styles from './AddQuestionMenu.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

export interface AddQuestionMenuProps {
  onSelect: (category: string, typeLabel: string, typeId: string) => void;
}

type DrawerTab = 'all' | 'library';

interface HoveredTypeState {
  id: string;
  categoryTitle: string;
  typeLabel: string;
}

const PREVIEW_LEAVE_MS = 140;

function QuestionTypeHoverPreview({ content }: { content: QuestionTypePreviewContent }) {
  return (
    <div className={styles.previewCard}>
      <div className={styles.previewHeader}>
        <span className={`${content.headerIcon} ${styles.previewHeaderIcon}`} aria-hidden />
        <span>{content.headerLabel}</span>
      </div>
      <div className={styles.previewBody}>
        <p className={styles.previewQuestion}>{content.question}</p>

        {content.variant === 'checkboxes' && content.options ? (
          <ul className={styles.previewOptionList}>
            {content.options.map((label) => (
              <li key={label} className={styles.previewOption}>
                <input type="checkbox" disabled tabIndex={-1} aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {content.variant === 'radios' && content.options ? (
          <ul className={styles.previewOptionList}>
            {content.options.map((label) => (
              <li key={label} className={styles.previewOption}>
                <input type="radio" disabled tabIndex={-1} aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {content.variant === 'dropdown' && content.options ? (
          <select className={styles.previewFakeSelect} disabled aria-hidden value="">
            <option value="">Select an option…</option>
            {content.options.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        ) : null}

        {content.variant === 'text-single' ? (
          <div className={styles.previewFakeInput} aria-hidden>
            Type here…
          </div>
        ) : null}

        {content.variant === 'text-area' ? (
          <textarea
            className={styles.previewFakeTextarea}
            readOnly
            rows={4}
            aria-hidden
            defaultValue=""
            placeholder="Respondents type their answer here…"
          />
        ) : null}

        {content.variant === 'star-rating' && content.hint ? (
          <p className={styles.previewHint}>{content.hint}</p>
        ) : null}

        {content.variant === 'placeholder' && content.hint ? (
          <p className={styles.previewHint}>{content.hint}</p>
        ) : null}
      </div>
    </div>
  );
}

function TierSection({
  tier,
  categories,
  onSelectType,
  hoveredTypeId,
  onTypePointerEnter,
  onTypePointerLeave,
}: {
  tier: QuestionTypeTier;
  categories: AddQuestionCategory[];
  onSelectType: (categoryTitle: string, typeLabel: string, typeId: string) => void;
  hoveredTypeId: string | null;
  onTypePointerEnter: (
    categoryTitle: string,
    type: AddQuestionTypeItem,
    event: PointerEvent<HTMLButtonElement>
  ) => void;
  onTypePointerLeave: () => void;
}) {
  if (categories.length === 0) return null;

  const heading = tier === 'basic' ? 'Basic' : 'Advanced';

  return (
    <section className={styles.tierSection} aria-label={`${heading} question types`}>
      <h3 className={styles.tierHeading}>{heading}</h3>
      <hr className={styles.tierRule} />
      <div className={styles.categoryGrid}>
        {categories.map((category) => (
          <div key={category.id} className={styles.categoryBlock}>
            <h4 className={styles.categoryTitle}>{category.title}</h4>
            <ul className={styles.typeList}>
              {category.types.map((type) => (
                <li key={type.id}>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${
                      hoveredTypeId === type.id ? styles.typeBtnHovered : ''
                    }`}
                    onClick={() => onSelectType(category.title, type.label, type.id)}
                    onPointerEnter={(event) =>
                      onTypePointerEnter(category.title, type, event)
                    }
                    onPointerLeave={onTypePointerLeave}
                  >
                    <span
                      className={`${type.icon} ${styles.typeIcon} ${
                        type.highlight ? styles.typeIconHighlight : ''
                      }`}
                      aria-hidden
                    />
                    <span className={styles.typeLabel}>{type.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AddQuestionMenu({ onSelect }: AddQuestionMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<DrawerTab>('all');
  const [mounted, setMounted] = useState(false);
  const [hoveredType, setHoveredType] = useState<HoveredTypeState | null>(null);
  const leaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setTab('all');
      setHoveredType(null);
    }
  }, [open]);

  const filteredCategories = useMemo(
    () => filterAddQuestionCategories(ADD_QUESTION_CATEGORIES, search),
    [search]
  );

  const basicCategories = useMemo(
    () => filteredCategories.filter((category) => category.tier === 'basic'),
    [filteredCategories]
  );

  const advancedCategories = useMemo(
    () => filteredCategories.filter((category) => category.tier === 'advanced'),
    [filteredCategories]
  );

  const hasResults = basicCategories.length > 0 || advancedCategories.length > 0;

  const previewContent = useMemo(() => {
    if (!hoveredType) return null;
    return getQuestionTypePreview(
      hoveredType.id,
      hoveredType.categoryTitle,
      hoveredType.typeLabel
    );
  }, [hoveredType]);

  function clearLeaveTimer(): void {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => clearLeaveTimer();
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  function handleTypePointerEnter(
    categoryTitle: string,
    type: AddQuestionTypeItem,
    _event: PointerEvent<HTMLButtonElement>
  ): void {
    clearLeaveTimer();
    setHoveredType({
      id: type.id,
      categoryTitle,
      typeLabel: type.label,
    });
  }

  function schedulePreviewLeave(): void {
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      setHoveredType(null);
      leaveTimerRef.current = null;
    }, PREVIEW_LEAVE_MS);
  }

  function closeDrawer(): void {
    setOpen(false);
  }

  function handleSelect(category: string, typeLabel: string, typeId: string): void {
    onSelect(category, typeLabel, typeId);
    closeDrawer();
  }

  function handleToggle(): void {
    setOpen((prev) => !prev);
  }

  const drawer =
    open && mounted ? (
      <div className={styles.portalShell}>
        <button
          type="button"
          className={styles.overlay}
          aria-label="Close add question panel"
          onClick={closeDrawer}
        />
        <div className={styles.drawerCluster}>
          <div
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Add question"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.drawerInner}>
              <div className={styles.drawerHeader}>
                <div className={styles.tabs} role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'all'}
                    className={`${styles.tab} ${tab === 'all' ? styles.tabActive : ''}`}
                    onClick={() => setTab('all')}
                  >
                    All Questions
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'library'}
                    className={`${styles.tab} ${tab === 'library' ? styles.tabActive : ''}`}
                    onClick={() => setTab('library')}
                  >
                    Question Library
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  aria-label="Close"
                  onClick={closeDrawer}
                >
                  <span className="wm-close" aria-hidden />
                </button>
              </div>

              <div className={styles.searchRow}>
                <div className={styles.searchField}>
                  <span className={`wm-search ${styles.searchIcon}`} aria-hidden />
                  <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Find question type"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    autoFocus={tab === 'all'}
                    aria-label="Find question type"
                    disabled={tab === 'library'}
                  />
                </div>
              </div>

              <div className={styles.scrollBody}>
                {tab === 'library' ? (
                  <>
                    <p className={styles.libraryHint}>
                      Reuse questions from your team library. Search and insert a saved question
                      into this block.
                    </p>
                    <p className={styles.emptyState}>
                      No library items match your filters in this prototype.
                    </p>
                  </>
                ) : !hasResults ? (
                  <p className={styles.emptyState}>No question types match your search.</p>
                ) : (
                  <>
                    <TierSection
                      tier="basic"
                      categories={basicCategories}
                      onSelectType={handleSelect}
                      hoveredTypeId={hoveredType?.id ?? null}
                      onTypePointerEnter={handleTypePointerEnter}
                      onTypePointerLeave={schedulePreviewLeave}
                    />
                    <TierSection
                      tier="advanced"
                      categories={advancedCategories}
                      onSelectType={handleSelect}
                      hoveredTypeId={hoveredType?.id ?? null}
                      onTypePointerEnter={handleTypePointerEnter}
                      onTypePointerLeave={schedulePreviewLeave}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {tab === 'all' && previewContent ? (
            <div className={styles.previewRegion}>
              <aside
                className={styles.hoverPreview}
                aria-label="Question type preview"
                onPointerEnter={clearLeaveTimer}
                onPointerLeave={schedulePreviewLeave}
              >
                <QuestionTypeHoverPreview content={previewContent} />
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    ) : null;

  return (
    <div className={styles.root}>
      <WuButton
        size="sm"
        variant="primary"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        Add Question
        <span className="wm-arrow-drop-down" aria-hidden />
      </WuButton>
      {drawer && typeof document !== 'undefined'
        ? createPortal(drawer, document.body)
        : null}
    </div>
  );
}
