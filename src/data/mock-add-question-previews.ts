export type QuestionPreviewVariant =
  | 'checkboxes'
  | 'radios'
  | 'dropdown'
  | 'text-single'
  | 'text-area'
  | 'star-rating'
  | 'contact-fields'
  | 'smiley-rating'
  | 'thumbs-up-down'
  | 'push-to-social'
  | 'text-slider'
  | 'numeric-slider'
  | 'placeholder';

export interface TextSliderPreviewData {
  scaleLabels: string[];
  rows: string[];
}

export interface NumericSliderPreviewData {
  leftAnchor: string;
  rightAnchor: string;
  rows: string[];
  valuePlaceholder: string;
}

export type PushToSocialPlatformBrand = 'facebook' | 'x' | 'yelp';

export interface PushToSocialPlatformPreview {
  id: string;
  brand: PushToSocialPlatformBrand;
  brandLetter: string;
  value: string;
}

export interface PushToSocialPreviewData {
  ratingSubject: string;
  pushIfRatingAtLeast: number;
  shareMessagePrompt: string;
  platforms: PushToSocialPlatformPreview[];
  defaultShareMessage: string;
  badReviewEnabled: boolean;
  badReviewRatingAtMost: number;
  commentBoxTitle: string;
}

export type SmileyRatingPreviewTone =
  | 'very-unsatisfied'
  | 'unsatisfied'
  | 'neutral'
  | 'satisfied'
  | 'very-satisfied';

export interface SmileyRatingPreviewOption {
  label: string;
  tone: SmileyRatingPreviewTone;
}

export type ThumbsPreviewDirection = 'up' | 'down';

export interface ThumbsPreviewChoice {
  label: string;
  direction: ThumbsPreviewDirection;
}

export interface QuestionTypePreviewContent {
  variant: QuestionPreviewVariant;
  headerIcon: string;
  headerLabel: string;
  question: string;
  options?: string[];
  /** Labeled underline fields (e.g. Contact Information). */
  fields?: string[];
  /** Five-point smiley scale (Smiley - Rating). */
  smileyScale?: SmileyRatingPreviewOption[];
  /** Thumbs up / down choices. */
  thumbsChoices?: ThumbsPreviewChoice[];
  /** Push To Social configuration preview. */
  pushToSocial?: PushToSocialPreviewData;
  /** Text slider matrix preview. */
  textSlider?: TextSliderPreviewData;
  /** Numeric slider matrix preview. */
  numericSlider?: NumericSliderPreviewData;
  /** Secondary line under question (e.g. rating scale) */
  hint?: string;
}

const SELECT_MANY: QuestionTypePreviewContent = {
  variant: 'checkboxes',
  headerIcon: 'wm-check-box-outline-blank',
  headerLabel: 'Multiple Choice (Select Many)',
  question: 'What types of credit cards do you have (Select all that apply)?',
  options: ['Visa', 'Mastercard', 'American Express', 'Discover', 'Diners Club'],
};

const PREVIEWS: Partial<Record<string, QuestionTypePreviewContent>> = {
  'select-many': SELECT_MANY,
  'select-one': {
    variant: 'radios',
    headerIcon: 'wm-radio-button-checked',
    headerLabel: 'Multiple Choice (Select One)',
    question: 'Which region do you live in?',
    options: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'],
  },
  dropdown: {
    variant: 'dropdown',
    headerIcon: 'wm-arrow-drop-down',
    headerLabel: 'Drop-down Menu',
    question: 'Select your preferred shipping method.',
    options: ['Standard (5–7 days)', 'Express (2–3 days)', 'Overnight', 'Pick up in store'],
  },
  'comment-box': {
    variant: 'text-area',
    headerIcon: 'wm-notes',
    headerLabel: 'Comment Box',
    question: 'Please describe your experience with our support team in as much detail as you like.',
    hint: 'Respondents type an open-ended answer in a multi-line text area.',
  },
  'single-row': {
    variant: 'text-single',
    headerIcon: 'wm-short-text',
    headerLabel: 'Single Row Text',
    question: 'What is your employee ID number?',
    hint: 'Single line of text input.',
  },
  email: {
    variant: 'text-single',
    headerIcon: 'wm-email',
    headerLabel: 'Email Address',
    question: 'What email address should we use to send your receipt?',
    hint: 'Validated email format.',
  },
  contact: {
    variant: 'contact-fields',
    headerIcon: 'wm-contact-page',
    headerLabel: 'Text (Contact Information)',
    question: 'Contact Information',
    fields: ['First Name', 'Last Name', 'Phone', 'Email Address'],
  },
  'star-rating': {
    variant: 'star-rating',
    headerIcon: 'wm-star',
    headerLabel: 'Star Rating',
    question: 'How would you rate the quality of our onboarding materials?',
    hint: '★ ★ ★ ★ ★',
  },
  'smiley-rating': {
    variant: 'smiley-rating',
    headerIcon: 'wm-sentiment-satisfied',
    headerLabel: 'Graphical Rating (Smiley - Rating)',
    question: 'How satisfied are you with our services?',
    smileyScale: [
      { label: 'Very Unsatisfied', tone: 'very-unsatisfied' },
      { label: 'Unsatisfied', tone: 'unsatisfied' },
      { label: 'Neutral', tone: 'neutral' },
      { label: 'Satisfied', tone: 'satisfied' },
      { label: 'Very Satisfied', tone: 'very-satisfied' },
    ],
  },
  thumbs: {
    variant: 'thumbs-up-down',
    headerIcon: 'wm-thumb-up',
    headerLabel: 'Graphical Rating (Thumbs Up/Down)',
    question: 'What do you think of Starbucks?',
    thumbsChoices: [
      { label: 'Love it', direction: 'up' },
      { label: 'Hate it', direction: 'down' },
    ],
  },
  'push-social': {
    variant: 'push-to-social',
    headerIcon: 'wm-share',
    headerLabel: 'Graphical Rating (Push To Social)',
    question: 'How satisfied are you with the following ?',
    pushToSocial: {
      ratingSubject: 'Customer Experience',
      pushIfRatingAtLeast: 4,
      shareMessagePrompt: 'Thanks for the great rating, please share with',
      platforms: [
        {
          id: 'facebook',
          brand: 'facebook',
          brandLetter: 'f',
          value: 'https://www.facebook.com/questionpro/',
        },
        {
          id: 'x',
          brand: 'x',
          brandLetter: 'X',
          value: '@questionpro',
        },
        {
          id: 'yelp',
          brand: 'yelp',
          brandLetter: 'yelp',
          value: 'https://www.yelp.com/yourcompany/',
        },
      ],
      defaultShareMessage:
        '[Your company] is great! I give them [#rating] stars. Check them',
      badReviewEnabled: true,
      badReviewRatingAtMost: 2,
      commentBoxTitle: 'Please let us know what we could',
    },
  },
  'text-slider': {
    variant: 'text-slider',
    headerIcon: 'wm-tune',
    headerLabel: 'Graphical Rating (Text Slider)',
    question: 'How satisfied are you with the following',
    textSlider: {
      scaleLabels: [
        'Very Dissatisfied',
        'Unsatisfied',
        'Neutral',
        'Satisfied',
        'Very Satisfied',
      ],
      rows: ['Website', 'Customer Service', 'Overall'],
    },
  },
  'numeric-slider': {
    variant: 'numeric-slider',
    headerIcon: 'wm-linear-scale',
    headerLabel: 'Graphical Rating (Numeric Slider)',
    question: 'How satisfied are you with the following',
    numericSlider: {
      leftAnchor: 'Left Anchor',
      rightAnchor: 'Right Anchor',
      rows: ['Row 1', 'Row 2'],
      valuePlaceholder: '--',
    },
  },
  'image-select-one': {
    variant: 'radios',
    headerIcon: 'wm-panorama',
    headerLabel: 'Image Chooser — Select One',
    question: 'Which package design do you prefer?',
    options: ['Design A', 'Design B', 'Design C'],
  },
  'image-select-many': {
    variant: 'checkboxes',
    headerIcon: 'wm-collections',
    headerLabel: 'Image Chooser — Select Many',
    question: 'Which flavors would you consider purchasing? (Select all that apply)',
    options: ['Classic', 'Spicy', 'Sweet', 'Savory', 'Seasonal'],
  },
  'image-rating': {
    variant: 'star-rating',
    headerIcon: 'wm-star-border',
    headerLabel: 'Image Chooser — Rating',
    question: 'Rate how appealing this product photo is.',
    hint: '★ ★ ★ ★ ★',
  },
  'rank-order': {
    variant: 'placeholder',
    headerIcon: 'wm-format-list-numbered',
    headerLabel: 'Rank Order',
    question: 'Drag items into order from most to least important.',
  },
  'constant-sum': {
    variant: 'placeholder',
    headerIcon: 'wm-functions',
    headerLabel: 'Constant Sum',
    question: 'Distribute 100 points across the options below.',
  },
  'drag-drop': {
    variant: 'placeholder',
    headerIcon: 'wm-drag-indicator',
    headerLabel: 'Drag and Drop',
    question: 'Drag choices into buckets or a ranked list.',
  },
  'multi-point': {
    variant: 'placeholder',
    headerIcon: 'wm-grid-on',
    headerLabel: 'Basic Matrix — Multi-Point Scales',
    question: 'Rows and columns with a shared scale (e.g. satisfaction 1–5).',
  },
  'multi-select-matrix': {
    variant: 'checkboxes',
    headerIcon: 'wm-apps',
    headerLabel: 'Basic Matrix — Multi-Select',
    question: 'For each row, select all columns that apply.',
    options: ['Option A', 'Option B', 'Option C'],
  },
  spreadsheet: {
    variant: 'placeholder',
    headerIcon: 'wm-table-chart',
    headerLabel: 'Spreadsheet',
    question: 'Grid-style entry similar to a spreadsheet.',
  },
  presentation: {
    variant: 'placeholder',
    headerIcon: 'wm-article',
    headerLabel: 'Presentation Text',
    question: 'Non-interactive text and images shown to respondents.',
  },
  'section-heading': {
    variant: 'placeholder',
    headerIcon: 'wm-title',
    headerLabel: 'Section Heading',
    question: 'Large heading to break the survey into sections.',
  },
  'section-subheading': {
    variant: 'placeholder',
    headerIcon: 'wm-subtitles',
    headerLabel: 'Section Sub-Heading',
    question: 'Secondary heading within a section.',
  },
  'date-time': {
    variant: 'placeholder',
    headerIcon: 'wm-event',
    headerLabel: 'Date / Time',
    question: 'Pick a date, time, or both using a calendar control.',
  },
  captcha: {
    variant: 'placeholder',
    headerIcon: 'wm-verified-user',
    headerLabel: 'Captcha',
    question: 'Bot verification challenge before continuing.',
  },
  calendar: {
    variant: 'placeholder',
    headerIcon: 'wm-calendar-month',
    headerLabel: 'Calendar',
    question: 'Calendar-based scheduling or availability.',
  },
  maps: {
    variant: 'placeholder',
    headerIcon: 'wm-map',
    headerLabel: 'Maps',
    question: 'Location capture or map-based interaction.',
  },
  nps: {
    variant: 'placeholder',
    headerIcon: 'wm-speed',
    headerLabel: 'Net Promoter Score',
    question: 'How likely are you to recommend us? (0–10 scale)',
  },
  homunculus: {
    variant: 'placeholder',
    headerIcon: 'wm-accessibility',
    headerLabel: 'Homunculus Question',
    question: 'Body map selection for health-related surveys.',
  },
  'verified-signature': {
    variant: 'placeholder',
    headerIcon: 'wm-draw',
    headerLabel: 'Verified Signature',
    question: 'Legally captured signature with verification.',
  },
  'van-westendorp': {
    variant: 'placeholder',
    headerIcon: 'wm-attach-money',
    headerLabel: 'Van Westendorp',
    question: 'Price sensitivity analysis (too cheap / cheap / expensive / too expensive).',
  },
  'gabor-granger': {
    variant: 'placeholder',
    headerIcon: 'wm-analytics',
    headerLabel: 'Gabor Granger',
    question: 'Willingness to pay at increasing price points.',
  },
  'reference-data': {
    variant: 'placeholder',
    headerIcon: 'wm-storage',
    headerLabel: 'Reference Data',
    question: 'Pull answers from a reference list or database.',
  },
  'lookup-table': {
    variant: 'placeholder',
    headerIcon: 'wm-table-view',
    headerLabel: 'Lookup Table',
    question: 'Look up values from a configured table.',
  },
  'multi-tier-lookup': {
    variant: 'placeholder',
    headerIcon: 'wm-layers',
    headerLabel: 'Multi Tier Lookup Table',
    question: 'Cascading lookups across multiple tiers.',
  },
  'store-locator': {
    variant: 'placeholder',
    headerIcon: 'wm-store',
    headerLabel: 'Store Locator',
    question: 'Find nearby locations from a store database.',
  },
  tubepulse: {
    variant: 'placeholder',
    headerIcon: 'wm-play-circle',
    headerLabel: 'TubePulse™',
    question: 'Video clip with timed questions or reactions.',
  },
  heatmap: {
    variant: 'placeholder',
    headerIcon: 'wm-whatshot',
    headerLabel: 'Heatmap',
    question: 'Click intensity on an image.',
  },
  hotspot: {
    variant: 'placeholder',
    headerIcon: 'wm-touch-app',
    headerLabel: 'HotSpot',
    question: 'Clickable regions on an image.',
  },
  'text-highlighter': {
    variant: 'placeholder',
    headerIcon: 'wm-format-color-fill',
    headerLabel: 'Text Highlighter',
    question: 'Highlight phrases in a passage.',
  },
  'stop-watch': {
    variant: 'placeholder',
    headerIcon: 'wm-timer',
    headerLabel: 'Stop Watch',
    question: 'Timed task or response window.',
  },
  barcode: {
    variant: 'placeholder',
    headerIcon: 'wm-qr-code-scanner',
    headerLabel: 'Barcode',
    question: 'Scan a barcode with the device camera.',
  },
  'qr-reader': {
    variant: 'placeholder',
    headerIcon: 'wm-qr-code-2',
    headerLabel: 'QR Code Reader',
    question: 'Read QR codes in the survey flow.',
  },
  'card-sorting': {
    variant: 'placeholder',
    headerIcon: 'wm-style',
    headerLabel: 'Card Sorting',
    question: 'Sort cards into categories.',
  },
  'upload-file': {
    variant: 'placeholder',
    headerIcon: 'wm-attach-file',
    headerLabel: 'Attach/Upload File',
    question: 'Allow respondents to upload a file.',
  },
  signature: {
    variant: 'placeholder',
    headerIcon: 'wm-gesture',
    headerLabel: 'Signature',
    question: 'Draw or type a signature.',
  },
  'video-ai': {
    variant: 'placeholder',
    headerIcon: 'wm-videocam',
    headerLabel: 'VideoAI',
    question: 'Video response with AI-assisted analysis.',
  },
  conjoint: {
    variant: 'placeholder',
    headerIcon: 'wm-account-tree',
    headerLabel: 'Conjoint',
    question: 'Choice-based conjoint profiles.',
  },
  'max-diff': {
    variant: 'placeholder',
    headerIcon: 'wm-compare-arrows',
    headerLabel: 'Max-Diff',
    question: 'Best / worst scaling across sets.',
  },
  'custom-logic': {
    variant: 'placeholder',
    headerIcon: 'wm-code',
    headerLabel: 'Custom Logic Engine',
    question: 'Advanced scripted logic and validation.',
  },
  'flex-matrix': {
    variant: 'placeholder',
    headerIcon: 'wm-view-module',
    headerLabel: 'Complex Grid / Flex Matrix',
    question: 'Flexible grid with mixed question types.',
  },
  'side-by-side': {
    variant: 'placeholder',
    headerIcon: 'wm-view-column',
    headerLabel: 'Side-By-Side Matrix',
    question: 'Compare attributes in adjacent columns.',
  },
  'platform-connect': {
    variant: 'placeholder',
    headerIcon: 'wm-lightbulb',
    headerLabel: 'Platform Connect',
    question: 'Integrate with external platforms and data sources.',
  },
  timer: {
    variant: 'placeholder',
    headerIcon: 'wm-hourglass-empty',
    headerLabel: 'Timer',
    question: 'Countdown or elapsed time per page or question.',
  },
  'community-recruitment': {
    variant: 'placeholder',
    headerIcon: 'wm-groups',
    headerLabel: 'Community Recruitment',
    question: 'Invite respondents to join a community or panel.',
  },
};

export function getQuestionTypePreview(
  typeId: string,
  categoryTitle: string,
  typeLabel: string
): QuestionTypePreviewContent {
  const specific = PREVIEWS[typeId];
  if (specific) return specific;
  return {
    variant: 'placeholder',
    headerIcon: 'wm-help-outline',
    headerLabel: `${categoryTitle}: ${typeLabel}`,
    question: `Sample layout for “${typeLabel}”. Respondents will see controls appropriate to this question type.`,
  };
}
