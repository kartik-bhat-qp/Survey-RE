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
      { id: 'email', label: 'Email Address', icon: 'wm-email' },
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
      { id: 'image-select-many', label: 'Select Many', icon: 'wm-collections' },
      { id: 'image-rating', label: 'Rating', icon: 'wm-star-border' },
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
      { id: 'multi-point', label: 'Multi-Point Scales', icon: 'wm-grid-on' },
      { id: 'multi-select-matrix', label: 'Multi-Select', icon: 'wm-apps' },
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
