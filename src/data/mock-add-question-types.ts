import type { SurveyFooterBrand } from '@/lib/survey-suite-footer-brand';
import type { SurveySection } from '@/data/mock-survey-detail';
import { resolveAddQuestionTypeId } from '@/data/mock-survey-detail';

export type QuestionTypeTier = 'basic' | 'advanced';

export interface AddQuestionTypeItem {
  id: string;
  label: string;
  icon: string;
  highlight?: boolean;
}

export interface AddQuestionCategory {
  id: string;
  title: string;
  tier: QuestionTypeTier;
  types: AddQuestionTypeItem[];
}

export const ADD_QUESTION_CATEGORIES: AddQuestionCategory[] = [
  {
    id: 'multiple-choice',
    title: 'Multiple Choice',
    tier: 'basic',
    types: [
      { id: 'select-one', label: 'Select One', icon: 'wm-radio-button-checked' },
      { id: 'select-many', label: 'Select Many', icon: 'wm-check-box-outline-blank' },
      { id: 'dropdown', label: 'Drop-down Menu', icon: 'wm-arrow-drop-down' },
    ],
  },
  {
    id: 'text',
    title: 'Text',
    tier: 'basic',
    types: [
      { id: 'comment-box', label: 'Comment Box', icon: 'wm-notes' },
      { id: 'single-row', label: 'Single Row Text', icon: 'wm-short-text' },
      { id: 'email', label: 'Email Address', icon: 'wm-mail' },
      { id: 'contact', label: 'Contact Information', icon: 'wm-contact-page' },
    ],
  },
  {
    id: 'graphical-rating',
    title: 'Graphical Rating',
    tier: 'basic',
    types: [
      { id: 'star-rating', label: 'Star Rating', icon: 'wm-star' },
      { id: 'smiley-rating', label: 'Smiley - Rating', icon: 'wm-sentiment-satisfied' },
      { id: 'thumbs', label: 'Thumbs Up/Down', icon: 'wm-thumb-up' },
      { id: 'push-social', label: 'Push To Social', icon: 'wm-share' },
      { id: 'text-slider', label: 'Text Slider', icon: 'wm-tune' },
      { id: 'numeric-slider', label: 'Numeric Slider', icon: 'wm-linear-scale' },
    ],
  },
  {
    id: 'image-chooser',
    title: 'Image Chooser',
    tier: 'basic',
    types: [
      { id: 'image-select-one', label: 'Select One', icon: 'wm-panorama' },
      { id: 'image-select-many', label: 'Select Many', icon: 'wm-photo-library' },
      { id: 'image-rating', label: 'Rating', icon: 'wc-image-chooser-2' },
    ],
  },
  {
    id: 'ordering-basic',
    title: 'Ordering',
    tier: 'basic',
    types: [
      { id: 'rank-order', label: 'Rank Order', icon: 'wm-format-list-numbered' },
      { id: 'constant-sum', label: 'Constant Sum', icon: 'wm-functions' },
      { id: 'drag-drop', label: 'Drag and Drop', icon: 'wm-drag-indicator' },
    ],
  },
  {
    id: 'basic-matrix',
    title: 'Basic Matrix',
    tier: 'basic',
    types: [
      { id: 'multi-point', label: 'Multi-Point Scales', icon: 'wc-basic-matrix-1' },
      { id: 'multi-select-matrix', label: 'Multi-Select', icon: 'wc-basic-matrix-2' },
      { id: 'spreadsheet', label: 'Spreadsheet', icon: 'wm-table-chart' },
    ],
  },
  {
    id: 'static-content',
    title: 'Static Content',
    tier: 'basic',
    types: [
      { id: 'presentation', label: 'Presentation Text', icon: 'wm-article' },
      { id: 'section-heading', label: 'Section Heading', icon: 'wm-title' },
      { id: 'section-subheading', label: 'Section Sub-Heading', icon: 'wm-subtitles' },
    ],
  },
  {
    id: 'misc-basic',
    title: 'Misc',
    tier: 'basic',
    types: [
      { id: 'date-time', label: 'Date / Time', icon: 'wm-event' },
      { id: 'captcha', label: 'Captcha', icon: 'wm-verified-user' },
      { id: 'calendar', label: 'Calendar', icon: 'wm-calendar-month' },
      { id: 'maps', label: 'Maps', icon: 'wm-map' },
    ],
  },
  {
    id: 'customer-satisfaction',
    title: 'Customer Satisfaction',
    tier: 'advanced',
    types: [
      { id: 'nps', label: 'Net Promoter Score', icon: 'wm-speed' },
    ],
  },
  {
    id: 'health-care',
    title: 'Health Care',
    tier: 'advanced',
    types: [
      { id: 'homunculus', label: 'Homunculus Question', icon: 'wm-accessibility' },
      { id: 'verified-signature', label: 'Verified Signature', icon: 'wm-draw' },
    ],
  },
  {
    id: 'pricing-analysis',
    title: 'Pricing Analysis',
    tier: 'advanced',
    types: [
      { id: 'van-westendorp', label: 'Van Westendorp', icon: 'wm-attach-money' },
      { id: 'gabor-granger', label: 'Gabor Granger', icon: 'wm-analytics' },
    ],
  },
  {
    id: 'data-reference',
    title: 'Data Reference',
    tier: 'advanced',
    types: [
      { id: 'reference-data', label: 'Reference Data', icon: 'wm-storage' },
      { id: 'lookup-table', label: 'Lookup Table', icon: 'wm-table-view' },
      { id: 'multi-tier-lookup', label: 'Multi Tier Lookup Table', icon: 'wm-layers' },
      { id: 'store-locator', label: 'Store Locator', icon: 'wm-store' },
    ],
  },
  {
    id: 'image-multimedia',
    title: 'Image / Multimedia',
    tier: 'advanced',
    types: [
      { id: 'tubepulse', label: 'TubePulse™', icon: 'wm-play-circle' },
      { id: 'heatmap', label: 'Heatmap', icon: 'wm-whatshot' },
      { id: 'hotspot', label: 'HotSpot', icon: 'wm-touch-app' },
      { id: 'text-highlighter', label: 'Text Highlighter', icon: 'wm-format-color-fill' },
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile',
    tier: 'advanced',
    types: [
      { id: 'stop-watch', label: 'Stop Watch', icon: 'wm-timer' },
      { id: 'barcode', label: 'Barcode', icon: 'wm-qr-code-scanner' },
      { id: 'qr-reader', label: 'QR Code Reader', icon: 'wm-qr-code-2' },
    ],
  },
  {
    id: 'ordering-advanced',
    title: 'Ordering',
    tier: 'advanced',
    types: [{ id: 'card-sorting', label: 'Card Sorting', icon: 'wm-style' }],
  },
  {
    id: 'upload',
    title: 'Upload',
    tier: 'advanced',
    types: [
      { id: 'upload-file', label: 'Attach/Upload File', icon: 'wm-attach-file' },
      { id: 'signature', label: 'Signature', icon: 'wm-gesture' },
      { id: 'video-ai', label: 'VideoAI', icon: 'wm-videocam' },
    ],
  },
  {
    id: 'choice-models',
    title: 'Choice Models',
    tier: 'advanced',
    types: [
      { id: 'conjoint', label: 'Conjoint', icon: 'wm-account-tree' },
      { id: 'max-diff', label: 'Max-Diff', icon: 'wm-compare-arrows' },
    ],
  },
  {
    id: 'logic',
    title: 'Logic',
    tier: 'advanced',
    types: [
      { id: 'custom-logic', label: 'Custom Logic Engine', icon: 'wm-code' },
    ],
  },
  {
    id: 'advanced-matrix',
    title: 'Advanced Matrix',
    tier: 'advanced',
    types: [
      { id: 'flex-matrix', label: 'Complex Grid / Flex Matrix', icon: 'wm-view-module' },
      { id: 'side-by-side', label: 'Side-By-Side Matrix', icon: 'wm-view-column' },
    ],
  },
  {
    id: 'misc-advanced',
    title: 'Misc',
    tier: 'advanced',
    types: [
      {
        id: 'platform-connect',
        label: 'Platform Connect',
        icon: 'wm-lightbulb',
        highlight: true,
      },
      { id: 'timer', label: 'Timer', icon: 'wm-hourglass-empty' },
      { id: 'community-recruitment', label: 'Community Recruitment', icon: 'wm-groups' },
    ],
  },
];

/** Shown when hovering the diamond on select Advanced question types. */
export const ADD_QUESTION_ADVANCED_LICENSE_TOOLTIP =
  'This question is available with the Advanced license';

/** Shown when hovering the diamond on Research edition question types. */
export const ADD_QUESTION_RESEARCH_EDITION_LICENSE_TOOLTIP =
  'This question type is available with the Research edition license';

const ADD_QUESTION_ADVANCED_LICENSE_TYPE_IDS = new Set([
  'nps',
  'reference-data',
  'lookup-table',
  'multi-tier-lookup',
  'stop-watch',
  'barcode',
  'qr-reader',
  'upload-file',
  'signature',
]);

const ADD_QUESTION_RESEARCH_EDITION_LICENSE_TYPE_IDS = new Set([
  'van-westendorp',
  'gabor-granger',
]);

export function getAddQuestionAdvancedLicenseTooltip(typeId: string): string | undefined {
  if (ADD_QUESTION_RESEARCH_EDITION_LICENSE_TYPE_IDS.has(typeId)) {
    return ADD_QUESTION_RESEARCH_EDITION_LICENSE_TOOLTIP;
  }
  if (ADD_QUESTION_ADVANCED_LICENSE_TYPE_IDS.has(typeId)) {
    return ADD_QUESTION_ADVANCED_LICENSE_TOOLTIP;
  }
  return undefined;
}

export function getAddQuestionTypeTier(typeId: string): QuestionTypeTier | undefined {
  for (const category of ADD_QUESTION_CATEGORIES) {
    if (category.types.some((type) => type.id === typeId)) {
      return category.tier;
    }
  }
  return undefined;
}

export type SurveyPlanLicense = 'essentials' | 'research' | 'advanced';

export type QuestionLicenseRequirement = 'advanced' | 'research';

export interface SurveyLicenseConflict {
  sectionId: string;
  questionId: string;
  questionCode: string;
  typeLabel: string;
  requiredLicense: QuestionLicenseRequirement;
  requiredLicenseLabel: string;
}

const LICENSE_RANK: Record<SurveyPlanLicense, number> = {
  essentials: 0,
  research: 1,
  advanced: 2,
};

export function getUserPlanLicense(footerBrand: SurveyFooterBrand): SurveyPlanLicense {
  return footerBrand === 'essentials' ? 'essentials' : 'research';
}

export function getQuestionLicenseRequirement(
  typeId: string
): QuestionLicenseRequirement | undefined {
  if (ADD_QUESTION_RESEARCH_EDITION_LICENSE_TYPE_IDS.has(typeId)) {
    return 'research';
  }
  if (ADD_QUESTION_ADVANCED_LICENSE_TYPE_IDS.has(typeId)) {
    return 'advanced';
  }
  return undefined;
}

export function getLicenseRequirementLabel(requirement: QuestionLicenseRequirement): string {
  return requirement === 'advanced' ? 'Advanced' : 'Research edition';
}

export function isLicenseSufficient(
  userLicense: SurveyPlanLicense,
  required: QuestionLicenseRequirement
): boolean {
  const requiredRank = required === 'advanced' ? LICENSE_RANK.advanced : LICENSE_RANK.research;
  return LICENSE_RANK[userLicense] >= requiredRank;
}

export function getAddQuestionTypeLabel(typeId: string): string {
  for (const category of ADD_QUESTION_CATEGORIES) {
    const match = category.types.find((type) => type.id === typeId);
    if (match) return match.label;
  }
  return typeId;
}

export function collectSurveyLicenseConflicts(
  sections: SurveySection[],
  userLicense: SurveyPlanLicense
): SurveyLicenseConflict[] {
  const conflicts: SurveyLicenseConflict[] = [];

  for (const section of sections) {
    for (const question of section.questions) {
      const typeId = resolveAddQuestionTypeId(question);
      if (!typeId) continue;

      const required = getQuestionLicenseRequirement(typeId);
      if (!required || isLicenseSufficient(userLicense, required)) continue;

      conflicts.push({
        sectionId: section.id,
        questionId: question.id,
        questionCode: question.code,
        typeLabel: getAddQuestionTypeLabel(typeId),
        requiredLicense: required,
        requiredLicenseLabel: getLicenseRequirementLabel(required),
      });
    }
  }

  return conflicts;
}

/** Essentials plan: advanced question types show the license diamond in the workspace. */
export function shouldShowWorkspaceLicenseDiamond(
  typeId: string | undefined,
  footerBrand: SurveyFooterBrand
): boolean {
  if (!typeId || footerBrand !== 'essentials') return false;
  return getAddQuestionTypeTier(typeId) === 'advanced';
}

export function filterAddQuestionCategories(
  categories: ReadonlyArray<AddQuestionCategory>,
  searchTerm: string
): AddQuestionCategory[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return [...categories];

  return categories
    .map((category) => {
      const categoryMatches = category.title.toLowerCase().includes(term);
      const types = category.types.filter(
        (type) => categoryMatches || type.label.toLowerCase().includes(term)
      );
      return types.length > 0 ? { ...category, types } : null;
    })
    .filter((category): category is AddQuestionCategory => category !== null);
}
