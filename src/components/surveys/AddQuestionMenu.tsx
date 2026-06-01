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
  getAddQuestionAdvancedLicenseTooltip,
  ADD_QUESTION_ADVANCED_LICENSE_PREVIEW_HEADER,
  type AddQuestionCategory,
  type AddQuestionTypeItem,
  type QuestionTypeTier,
} from '@/data/mock-add-question-types';
import {
  getQuestionTypePreview,
  type QuestionTypePreviewContent,
  type SmileyRatingPreviewTone,
  type ThumbsPreviewDirection,
} from '@/data/mock-add-question-previews';
import { BiDiamondIcon } from '@/components/ui/BiDiamondIcon';
import { useSurveyFooterBrand } from '@/components/surveys/useSurveyFooterBrand';
import { PushToSocialQuestionPreview } from '@/components/surveys/PushToSocialQuestionPreview';
import { NumericSliderQuestionPreview } from '@/components/surveys/NumericSliderQuestionPreview';
import { ConstantSumQuestionPreview } from '@/components/surveys/ConstantSumQuestionPreview';
import { CalendarQuestionPreview } from '@/components/surveys/CalendarQuestionPreview';
import { DateTimeQuestionPreview } from '@/components/surveys/DateTimeQuestionPreview';
import { DragDropQuestionPreview } from '@/components/surveys/DragDropQuestionPreview';
import { ImageChooserRatingQuestionPreview } from '@/components/surveys/ImageChooserRatingQuestionPreview';
import { MatrixMultiPointScalesQuestionPreview } from '@/components/surveys/MatrixMultiPointScalesQuestionPreview';
import { MatrixMultiSelectQuestionPreview } from '@/components/surveys/MatrixMultiSelectQuestionPreview';
import { MatrixSpreadsheetQuestionPreview } from '@/components/surveys/MatrixSpreadsheetQuestionPreview';
import { MapsQuestionPreview } from '@/components/surveys/MapsQuestionPreview';
import { NpsQuestionPreview } from '@/components/surveys/NpsQuestionPreview';
import { ImageChooserSelectManyQuestionPreview } from '@/components/surveys/ImageChooserSelectManyQuestionPreview';
import { ImageChooserSelectOneQuestionPreview } from '@/components/surveys/ImageChooserSelectOneQuestionPreview';
import { RankOrderQuestionPreview } from '@/components/surveys/RankOrderQuestionPreview';
import { HomunculusQuestionPreview } from '@/components/surveys/HomunculusQuestionPreview';
import { GaborGrangerQuestionPreview } from '@/components/surveys/GaborGrangerQuestionPreview';
import { LookupTableQuestionPreview } from '@/components/surveys/LookupTableQuestionPreview';
import { MultiTierLookupTableQuestionPreview } from '@/components/surveys/MultiTierLookupTableQuestionPreview';
import { TubePulseQuestionPreview } from '@/components/surveys/TubePulseQuestionPreview';
import { HeatmapQuestionPreview } from '@/components/surveys/HeatmapQuestionPreview';
import { HotSpotQuestionPreview } from '@/components/surveys/HotSpotQuestionPreview';
import { ConjointQuestionPreview } from '@/components/surveys/ConjointQuestionPreview';
import { TextHighlighterQuestionPreview } from '@/components/surveys/TextHighlighterQuestionPreview';
import { CardSortingQuestionPreview } from '@/components/surveys/CardSortingQuestionPreview';
import { MaxDiffQuestionPreview } from '@/components/surveys/MaxDiffQuestionPreview';
import { UploadFileQuestionPreview } from '@/components/surveys/UploadFileQuestionPreview';
import { SignatureQuestionPreview } from '@/components/surveys/SignatureQuestionPreview';
import { VideoAiQuestionPreview } from '@/components/surveys/VideoAiQuestionPreview';
import { CommunityRecruitmentQuestionPreview } from '@/components/surveys/CommunityRecruitmentQuestionPreview';
import { ReferenceDataQuestionPreview } from '@/components/surveys/ReferenceDataQuestionPreview';
import { VanWestendorpQuestionPreview } from '@/components/surveys/VanWestendorpQuestionPreview';
import { VerifiedSignatureQuestionPreview } from '@/components/surveys/VerifiedSignatureQuestionPreview';
import { TextSliderQuestionPreview } from '@/components/surveys/TextSliderQuestionPreview';
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

const SMILEY_ICON_BY_TONE: Record<SmileyRatingPreviewTone, string> = {
  'very-unsatisfied': 'wm-sentiment-very-dissatisfied',
  unsatisfied: 'wm-sentiment-dissatisfied',
  neutral: 'wm-sentiment-neutral',
  satisfied: 'wm-sentiment-satisfied',
  'very-satisfied': 'wm-sentiment-very-satisfied',
};

const SMILEY_FACE_CLASS_BY_TONE: Record<SmileyRatingPreviewTone, string> = {
  'very-unsatisfied': styles.previewSmileyFaceVeryUnsatisfied,
  unsatisfied: styles.previewSmileyFaceUnsatisfied,
  neutral: styles.previewSmileyFaceNeutral,
  satisfied: styles.previewSmileyFaceSatisfied,
  'very-satisfied': styles.previewSmileyFaceVerySatisfied,
};

const THUMB_ICON_BY_DIRECTION: Record<ThumbsPreviewDirection, string> = {
  up: 'wm-thumb-up',
  down: 'wm-thumb-down',
};

function QuestionTypeHoverPreview({
  content,
  typeId,
}: {
  content: QuestionTypePreviewContent;
  typeId: string;
}) {
  const footerBrand = useSurveyFooterBrand();
  const advancedLicenseTooltip = getAddQuestionAdvancedLicenseTooltip(typeId);
  const showAdvancedLicenseHeader =
    footerBrand === 'essentials' && Boolean(advancedLicenseTooltip);
  const isMatrixPreview =
    content.variant === 'matrix-multi-point' ||
    content.variant === 'matrix-multi-select' ||
    content.variant === 'matrix-spreadsheet' ||
    content.variant === 'maps';
  const isWidePreview =
    content.variant === 'push-to-social' ||
    content.variant === 'text-slider' ||
    content.variant === 'numeric-slider' ||
    content.variant === 'constant-sum' ||
    content.variant === 'image-chooser-select-one' ||
    content.variant === 'image-chooser-select-many' ||
    content.variant === 'image-chooser-rating' ||
    content.variant === 'nps' ||
    content.variant === 'verified-signature' ||
    content.variant === 'van-westendorp' ||
    content.variant === 'multi-tier-lookup' ||
    content.variant === 'tubepulse' ||
    content.variant === 'hotspot' ||
    content.variant === 'conjoint' ||
    content.variant === 'card-sorting' ||
    content.variant === 'max-diff' ||
    isMatrixPreview;

  const isHomunculusPreview = content.variant === 'homunculus';
  const isHeatmapPreview = content.variant === 'heatmap';
  const isTextHighlighterPreview = content.variant === 'text-highlighter';
  const isUploadFilePreview = content.variant === 'upload-file';
  const isSignaturePreview = content.variant === 'signature';
  const isVideoAiPreview = content.variant === 'video-ai';
  const isCommunityRecruitmentPreview = content.variant === 'community-recruitment';

  const previewCardClass = isMatrixPreview
    ? `${styles.previewCard} ${styles.previewCardWide} ${styles.previewCardMatrix}`
    : isWidePreview
      ? `${styles.previewCard} ${styles.previewCardWide}`
      : isHomunculusPreview
        ? `${styles.previewCard} ${styles.previewCardHomunculus}`
        : isHeatmapPreview
          ? `${styles.previewCard} ${styles.previewCardHeatmap}`
          : isTextHighlighterPreview
            ? `${styles.previewCard} ${styles.previewCardTextHighlighter}`
            : isUploadFilePreview
              ? `${styles.previewCard} ${styles.previewCardUploadFile}`
              : isSignaturePreview
                ? `${styles.previewCard} ${styles.previewCardSignature}`
                : isVideoAiPreview
                  ? `${styles.previewCard} ${styles.previewCardVideoAi}`
                  : isCommunityRecruitmentPreview
                    ? `${styles.previewCard} ${styles.previewCardCommunityRecruitment}`
                    : styles.previewCard;

  return (
    <div className={previewCardClass}>
      <div
        className={
          showAdvancedLicenseHeader
            ? `${styles.previewHeader} ${styles.previewHeaderAdvancedLicense}`
            : styles.previewHeader
        }
      >
        {showAdvancedLicenseHeader ? (
          <>
            <BiDiamondIcon
              tooltip={advancedLicenseTooltip}
              position="top"
              className={styles.previewHeaderDiamond}
            />
            <span>{ADD_QUESTION_ADVANCED_LICENSE_PREVIEW_HEADER}</span>
          </>
        ) : (
          <>
            <span className={`${content.headerIcon} ${styles.previewHeaderIcon}`} aria-hidden />
            <span>{content.headerLabel}</span>
          </>
        )}
      </div>
      <div className={styles.previewBody}>
        {content.question ? (
          <p className={styles.previewQuestion}>{content.question}</p>
        ) : null}

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
          <div
            className={
              content.inputIcon
                ? `${styles.previewFakeInputWrap} ${styles.previewFakeInputWrapWithIcon}`
                : styles.previewFakeInputWrap
            }
            aria-hidden
          >
            {content.inputIcon ? (
              <span className={`${content.inputIcon} ${styles.previewInputIcon}`} aria-hidden />
            ) : null}
            <div className={styles.previewFakeInput}>
              {content.inputPlaceholder ?? 'Type here…'}
            </div>
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

        {content.variant === 'contact-fields' && content.fields ? (
          <ul className={styles.previewContactFieldList}>
            {content.fields.map((label) => (
              <li key={label} className={styles.previewContactField}>
                <span className={styles.previewContactFieldLabel}>{label}</span>
                <div className={styles.previewContactFieldLine} aria-hidden />
              </li>
            ))}
          </ul>
        ) : null}

        {content.variant === 'star-rating' && content.hint ? (
          <p className={styles.previewHint}>{content.hint}</p>
        ) : null}

        {content.variant === 'smiley-rating' && content.smileyScale ? (
          <ul className={styles.previewSmileyScale} aria-hidden>
            {content.smileyScale.map((option) => (
              <li key={option.label} className={styles.previewSmileyItem}>
                <span
                  className={`${SMILEY_ICON_BY_TONE[option.tone]} ${styles.previewSmileyFace} ${SMILEY_FACE_CLASS_BY_TONE[option.tone]}`}
                />
                <span className={styles.previewSmileyLabel}>{option.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {content.variant === 'thumbs-up-down' && content.thumbsChoices ? (
          <ul className={styles.previewThumbsScale} aria-hidden>
            {content.thumbsChoices.map((choice) => (
              <li key={choice.label} className={styles.previewThumbsItem}>
                <span
                  className={`${THUMB_ICON_BY_DIRECTION[choice.direction]} ${styles.previewThumbsIcon}`}
                />
                <span className={styles.previewThumbsLabel}>{choice.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {content.variant === 'push-to-social' && content.pushToSocial ? (
          <PushToSocialQuestionPreview data={content.pushToSocial} />
        ) : null}

        {content.variant === 'text-slider' && content.textSlider ? (
          <TextSliderQuestionPreview data={content.textSlider} />
        ) : null}

        {content.variant === 'numeric-slider' && content.numericSlider ? (
          <NumericSliderQuestionPreview data={content.numericSlider} />
        ) : null}

        {content.variant === 'rank-order' && content.rankOrder ? (
          <RankOrderQuestionPreview data={content.rankOrder} />
        ) : null}

        {content.variant === 'constant-sum' && content.constantSum ? (
          <ConstantSumQuestionPreview data={content.constantSum} />
        ) : null}

        {content.variant === 'drag-drop' && content.dragDrop ? (
          <DragDropQuestionPreview data={content.dragDrop} />
        ) : null}

        {content.variant === 'image-chooser-select-one' && content.imageChooserSelectOne ? (
          <ImageChooserSelectOneQuestionPreview data={content.imageChooserSelectOne} />
        ) : null}

        {content.variant === 'image-chooser-select-many' && content.imageChooserSelectMany ? (
          <ImageChooserSelectManyQuestionPreview data={content.imageChooserSelectMany} />
        ) : null}

        {content.variant === 'image-chooser-rating' && content.imageChooserRating ? (
          <ImageChooserRatingQuestionPreview data={content.imageChooserRating} />
        ) : null}

        {content.variant === 'matrix-multi-point' && content.matrixMultiPoint ? (
          <MatrixMultiPointScalesQuestionPreview data={content.matrixMultiPoint} />
        ) : null}

        {content.variant === 'matrix-multi-select' && content.matrixMultiSelect ? (
          <MatrixMultiSelectQuestionPreview data={content.matrixMultiSelect} />
        ) : null}

        {content.variant === 'matrix-spreadsheet' && content.matrixSpreadsheet ? (
          <MatrixSpreadsheetQuestionPreview data={content.matrixSpreadsheet} />
        ) : null}

        {content.variant === 'date-time' && content.dateTime ? (
          <DateTimeQuestionPreview data={content.dateTime} />
        ) : null}

        {content.variant === 'calendar' && content.calendar ? (
          <CalendarQuestionPreview data={content.calendar} />
        ) : null}

        {content.variant === 'maps' ? <MapsQuestionPreview /> : null}

        {content.variant === 'nps' && content.nps ? (
          <NpsQuestionPreview data={content.nps} />
        ) : null}

        {content.variant === 'homunculus' ? <HomunculusQuestionPreview /> : null}

        {content.variant === 'verified-signature' && content.verifiedSignature ? (
          <VerifiedSignatureQuestionPreview data={content.verifiedSignature} />
        ) : null}

        {content.variant === 'van-westendorp' && content.vanWestendorp ? (
          <VanWestendorpQuestionPreview data={content.vanWestendorp} />
        ) : null}

        {content.variant === 'gabor-granger' && content.gaborGranger ? (
          <GaborGrangerQuestionPreview data={content.gaborGranger} />
        ) : null}

        {content.variant === 'reference-data' && content.referenceData ? (
          <ReferenceDataQuestionPreview data={content.referenceData} />
        ) : null}

        {content.variant === 'lookup-table' && content.lookupTable ? (
          <LookupTableQuestionPreview data={content.lookupTable} />
        ) : null}

        {content.variant === 'multi-tier-lookup' && content.multiTierLookup ? (
          <MultiTierLookupTableQuestionPreview data={content.multiTierLookup} />
        ) : null}

        {content.variant === 'tubepulse' && content.tubePulse ? (
          <TubePulseQuestionPreview data={content.tubePulse} />
        ) : null}

        {content.variant === 'heatmap' ? <HeatmapQuestionPreview /> : null}

        {content.variant === 'hotspot' ? <HotSpotQuestionPreview /> : null}

        {content.variant === 'conjoint' && content.conjoint ? (
          <ConjointQuestionPreview data={content.conjoint} />
        ) : null}

        {content.variant === 'text-highlighter' && content.textHighlighter ? (
          <TextHighlighterQuestionPreview data={content.textHighlighter} />
        ) : null}

        {content.variant === 'card-sorting' && content.cardSorting ? (
          <CardSortingQuestionPreview data={content.cardSorting} />
        ) : null}

        {content.variant === 'max-diff' && content.maxDiff ? (
          <MaxDiffQuestionPreview data={content.maxDiff} />
        ) : null}

        {content.variant === 'upload-file' && content.uploadFile ? (
          <UploadFileQuestionPreview data={content.uploadFile} />
        ) : null}

        {content.variant === 'signature' && content.signature ? (
          <SignatureQuestionPreview data={content.signature} />
        ) : null}

        {content.variant === 'video-ai' && content.videoAi ? (
          <VideoAiQuestionPreview data={content.videoAi} />
        ) : null}

        {content.variant === 'community-recruitment' && content.communityRecruitment ? (
          <CommunityRecruitmentQuestionPreview data={content.communityRecruitment} />
        ) : null}

        {content.variant === 'placeholder' && content.hint ? (
          <p className={styles.previewHint}>{content.hint}</p>
        ) : null}
      </div>
    </div>
  );
}

function CategoryBlock({
  category,
  tier,
  showLicenseDiamonds,
  hoveredTypeId,
  onSelectType,
  onTypePointerEnter,
  onTypePointerLeave,
}: {
  category: AddQuestionCategory;
  tier: QuestionTypeTier;
  showLicenseDiamonds: boolean;
  hoveredTypeId: string | null;
  onSelectType: (categoryTitle: string, typeLabel: string, typeId: string) => void;
  onTypePointerEnter: (
    categoryTitle: string,
    type: AddQuestionTypeItem,
    event: PointerEvent<HTMLButtonElement>
  ) => void;
  onTypePointerLeave: () => void;
}) {
  return (
    <div className={styles.categoryBlock}>
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
              onPointerEnter={(event) => onTypePointerEnter(category.title, type, event)}
              onPointerLeave={onTypePointerLeave}
            >
              <span
                className={`${type.icon} ${styles.typeIcon} ${
                  type.highlight ? styles.typeIconHighlight : ''
                }`}
                aria-hidden
              />
              <span className={styles.typeLabel}>{type.label}</span>
              {tier === 'advanced' && showLicenseDiamonds ? (
                <BiDiamondIcon
                  tooltip={getAddQuestionAdvancedLicenseTooltip(type.id)}
                  position="top"
                />
              ) : null}
            </button>
          </li>
        ))}
      </ul>
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
  const footerBrand = useSurveyFooterBrand();
  const showLicenseDiamonds = footerBrand === 'essentials';

  if (categories.length === 0) return null;

  const heading = tier === 'basic' ? 'Basic' : 'Advanced';
  const leftColumnCategories = categories.filter((_, index) => index % 2 === 0);
  const rightColumnCategories = categories.filter((_, index) => index % 2 === 1);

  const categoryBlockProps = {
    tier,
    showLicenseDiamonds,
    hoveredTypeId,
    onSelectType,
    onTypePointerEnter,
    onTypePointerLeave,
  };

  return (
    <section className={styles.tierSection} aria-label={`${heading} question types`}>
      <h3 className={styles.tierHeading}>{heading}</h3>
      <hr className={styles.tierRule} />
      <div className={styles.categoryColumns}>
        <div className={styles.categoryColumn}>
          {leftColumnCategories.map((category) => (
            <CategoryBlock key={category.id} category={category} {...categoryBlockProps} />
          ))}
        </div>
        <div className={styles.categoryColumn}>
          {rightColumnCategories.map((category) => (
            <CategoryBlock key={category.id} category={category} {...categoryBlockProps} />
          ))}
        </div>
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
                className={`${styles.hoverPreview} ${
                  hoveredType?.id === 'homunculus' ? styles.hoverPreviewHomunculus : ''
                } ${hoveredType?.id === 'heatmap' ? styles.hoverPreviewHeatmap : ''} ${
                  hoveredType?.id === 'text-highlighter' ? styles.hoverPreviewTextHighlighter : ''
                } ${hoveredType?.id === 'upload-file' ? styles.hoverPreviewUploadFile : ''} ${
                  hoveredType?.id === 'signature' ? styles.hoverPreviewSignature : ''
                } ${hoveredType?.id === 'video-ai' ? styles.hoverPreviewVideoAi : ''} ${
                  hoveredType?.id === 'community-recruitment'
                    ? styles.hoverPreviewCommunityRecruitment
                    : ''
                }`}
                aria-label="Question type preview"
                onPointerEnter={clearLeaveTimer}
                onPointerLeave={schedulePreviewLeave}
              >
                <QuestionTypeHoverPreview
                  content={previewContent}
                  typeId={hoveredType?.id ?? ''}
                />
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
