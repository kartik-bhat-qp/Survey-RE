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
  | 'rank-order'
  | 'constant-sum'
  | 'drag-drop'
  | 'image-chooser-select-one'
  | 'image-chooser-select-many'
  | 'image-chooser-rating'
  | 'matrix-multi-point'
  | 'matrix-multi-select'
  | 'matrix-spreadsheet'
  | 'date-time'
  | 'calendar'
  | 'maps'
  | 'nps'
  | 'homunculus'
  | 'verified-signature'
  | 'van-westendorp'
  | 'gabor-granger'
  | 'reference-data'
  | 'lookup-table'
  | 'multi-tier-lookup'
  | 'tubepulse'
  | 'placeholder';

export interface TextSliderPreviewData {
  scaleLabels: string[];
  rows: string[];
}

export type MatrixMultiPointPreviewData = TextSliderPreviewData;

export type MatrixMultiSelectPreviewData = TextSliderPreviewData;

export type MatrixSpreadsheetPreviewData = TextSliderPreviewData;

export interface DateTimeFieldPreview {
  label: string;
}

export interface DateTimePreviewData {
  fields: DateTimeFieldPreview[];
}

export interface CalendarPreviewData {
  inputIcon: string;
}

/** Maps preview uses {@link UsStatesChoroplethMap} — no extra data required. */
export type MapsPreviewData = Record<string, never>;

export interface NpsPreviewData {
  minLabel: string;
  maxLabel: string;
  scores?: number[];
}

/** Homunculus body-map preview — rendered by {@link HomunculusQuestionPreview}. */
export type HomunculusPreviewData = Record<string, never>;

export interface VerifiedSignaturePreviewData {
  declaration: string;
  fullNameLabel: string;
  emailLabel: string;
  signaturePrompt: string;
  signaturePlaceholder: string;
  agreeLabel: string;
}

export interface VanWestendorpPriceRow {
  id: string;
  prompt: string;
}

export interface VanWestendorpPreviewData {
  title: string;
  priceLabel: string;
  rows: VanWestendorpPriceRow[];
}

export interface GaborGrangerPreviewData {
  priceDisplay: string;
  choices: string[];
}

export interface ReferenceDataPreviewData {
  inputPlaceholder: string;
}

export interface LookupTablePreviewData {
  question: string;
  selectedValue: string;
}

export interface MultiTierLookupPreviewData {
  instructions: string;
  selectPlaceholder: string;
}

export interface TubePulsePreviewData {
  scaleLabels: [string, string, string];
  /** Slider thumb position along the track (0–100). */
  thumbPositionPercent: number;
}

export interface NumericSliderPreviewData {
  leftAnchor: string;
  rightAnchor: string;
  rows: string[];
  valuePlaceholder: string;
}

export interface RankOrderPreviewData {
  items: string[];
  selectPlaceholder: string;
}

export interface ConstantSumPreviewRow {
  label: string;
  value: string;
}

export interface ConstantSumPreviewData {
  rows: ConstantSumPreviewRow[];
}

export interface DragDropPreviewItem {
  label: string;
  rank: number;
}

export interface DragDropPreviewData {
  items: DragDropPreviewItem[];
  leftAnchor: string;
  rightAnchor: string;
}

export interface ImageChooserOptionPreview {
  label: string;
  imageSrc: string;
  imageAlt: string;
}

export interface ImageChooserSelectOnePreviewData {
  options: ImageChooserOptionPreview[];
}

export type ImageChooserSelectManyPreviewData = ImageChooserSelectOnePreviewData;

export interface ImageChooserRatingOptionPreview {
  imageSrc: string;
  imageAlt: string;
}

export interface ImageChooserRatingPreviewData {
  options: ImageChooserRatingOptionPreview[];
  ratingPlaceholder: string;
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
  /** Rank order rows with rank dropdowns. */
  rankOrder?: RankOrderPreviewData;
  /** Constant sum sliders with point inputs. */
  constantSum?: ConstantSumPreviewData;
  /** Drag-and-drop ranked cards with anchors. */
  dragDrop?: DragDropPreviewData;
  /** Image chooser select-one options. */
  imageChooserSelectOne?: ImageChooserSelectOnePreviewData;
  /** Image chooser select-many options. */
  imageChooserSelectMany?: ImageChooserSelectManyPreviewData;
  /** Image chooser rating options with scale dropdowns. */
  imageChooserRating?: ImageChooserRatingPreviewData;
  /** Basic matrix multi-point scale grid. */
  matrixMultiPoint?: MatrixMultiPointPreviewData;
  /** Basic matrix multi-select checkbox grid. */
  matrixMultiSelect?: MatrixMultiSelectPreviewData;
  /** Basic matrix spreadsheet text-entry grid. */
  matrixSpreadsheet?: MatrixSpreadsheetPreviewData;
  /** Date / time dropdown fields (e.g. Month, Day, Year). */
  dateTime?: DateTimePreviewData;
  /** Calendar single-line picker with trailing icon. */
  calendar?: CalendarPreviewData;
  /** US choropleth map image. */
  maps?: MapsPreviewData;
  /** Net Promoter Score 0–10 scale. */
  nps?: NpsPreviewData;
  /** Health care homunculus body map. */
  homunculus?: HomunculusPreviewData;
  /** Verified signature declaration and capture fields. */
  verifiedSignature?: VerifiedSignaturePreviewData;
  /** Van Westendorp price sensitivity meter rows. */
  vanWestendorp?: VanWestendorpPreviewData;
  /** Gabor Granger price point with yes/no purchase intent. */
  gaborGranger?: GaborGrangerPreviewData;
  /** Reference data zip / lookup text field. */
  referenceData?: ReferenceDataPreviewData;
  /** Lookup table dropdown field. */
  lookupTable?: LookupTablePreviewData;
  /** Multi-tier cascading lookup dropdowns. */
  multiTierLookup?: MultiTierLookupPreviewData;
  /** TubePulse video player and sentiment slider. */
  tubePulse?: TubePulsePreviewData;
  /** Secondary line under question (e.g. rating scale) */
  hint?: string;
  /** Leading icon inside a text input preview (e.g. email). */
  inputIcon?: string;
  /** Placeholder for text input previews. */
  inputPlaceholder?: string;
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
    headerIcon: 'wm-mail',
    headerLabel: 'Email Address',
    question: 'What email address should we use to send your receipt?',
    inputIcon: 'wm-mail',
    inputPlaceholder: 'name@example.com',
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
    variant: 'image-chooser-select-one',
    headerIcon: 'wm-panorama',
    headerLabel: 'Image Chooser (Select One)',
    question: 'Please choose your favorite ice-cream flavor ?',
    imageChooserSelectOne: {
      options: [
        {
          label: 'Strawberry',
          imageSrc: '/images/add-question-previews/ice-cream-strawberry.svg',
          imageAlt: 'Strawberry sundae',
        },
        {
          label: 'Butterscotch',
          imageSrc: '/images/add-question-previews/ice-cream-butterscotch.svg',
          imageAlt: 'Butterscotch ice cream',
        },
      ],
    },
  },
  'image-select-many': {
    variant: 'image-chooser-select-many',
    headerIcon: 'wm-photo-library',
    headerLabel: 'Image Chooser (Select Many)',
    question: 'Select all the flavors of icecream you like',
    imageChooserSelectMany: {
      options: [
        {
          label: 'Strawberry',
          imageSrc: '/images/add-question-previews/ice-cream-strawberry.svg',
          imageAlt: 'Strawberry sundae',
        },
        {
          label: 'Butterscotch',
          imageSrc: '/images/add-question-previews/ice-cream-butterscotch.svg',
          imageAlt: 'Butterscotch ice cream',
        },
        {
          label: 'Chocolate',
          imageSrc: '/images/add-question-previews/ice-cream-chocolate.svg',
          imageAlt: 'Chocolate ice cream',
        },
        {
          label: 'Vanilla',
          imageSrc: '/images/add-question-previews/ice-cream-vanilla.svg',
          imageAlt: 'Vanilla ice cream',
        },
      ],
    },
  },
  'image-rating': {
    variant: 'image-chooser-rating',
    headerIcon: 'wc-image-chooser-2',
    headerLabel: 'Image Chooser (Rating)',
    question: 'Please rate the ice cream flavors',
    imageChooserRating: {
      ratingPlaceholder: 'Very Dissatisfied',
      options: [
        {
          imageSrc: '/images/add-question-previews/ice-cream-strawberry.svg',
          imageAlt: 'Strawberry sundae',
        },
        {
          imageSrc: '/images/add-question-previews/ice-cream-butterscotch.svg',
          imageAlt: 'Butterscotch ice cream',
        },
        {
          imageSrc: '/images/add-question-previews/ice-cream-chocolate.svg',
          imageAlt: 'Chocolate ice cream',
        },
        {
          imageSrc: '/images/add-question-previews/ice-cream-vanilla.svg',
          imageAlt: 'Vanilla ice cream',
        },
      ],
    },
  },
  'rank-order': {
    variant: 'rank-order',
    headerIcon: 'wm-format-list-numbered',
    headerLabel: 'Ordering (Rank Order)',
    question: 'Please rank (1-3) the following in order of interest',
    rankOrder: {
      items: ['Skiing', 'Snowboarding', 'Biking'],
      selectPlaceholder: '-- Select --',
    },
  },
  'constant-sum': {
    variant: 'constant-sum',
    headerIcon: 'wm-functions',
    headerLabel: 'Ordering (Constant Sum)',
    question: 'Please allocate 100 points on how you spend your income',
    constantSum: {
      rows: [
        { label: 'Essentials (Gas, Grocery etc.)', value: '0' },
        { label: 'Entertainment (Movies, Clubs etc.)', value: '0' },
        { label: 'Other', value: '0' },
      ],
    },
  },
  'drag-drop': {
    variant: 'drag-drop',
    headerIcon: 'wm-drag-indicator',
    headerLabel: 'Ordering (Drag and Drop)',
    question: 'Please rank (1-3) the following in order of interest',
    dragDrop: {
      items: [
        { label: 'Skiing', rank: 1 },
        { label: 'Snowboarding', rank: 2 },
        { label: 'Biking', rank: 3 },
      ],
      leftAnchor: 'Left Anchor',
      rightAnchor: 'Right Anchor',
    },
  },
  'multi-point': {
    variant: 'matrix-multi-point',
    headerIcon: 'wc-basic-matrix-1',
    headerLabel: 'Basic Matrix (Multi-Point Scales)',
    question: 'How satisfied are you with the following',
    matrixMultiPoint: {
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
  'multi-select-matrix': {
    variant: 'matrix-multi-select',
    headerIcon: 'wc-basic-matrix-2',
    headerLabel: 'Basic Matrix (Multi-Select)',
    question: 'How satisfied are you with the following',
    matrixMultiSelect: {
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
  spreadsheet: {
    variant: 'matrix-spreadsheet',
    headerIcon: 'wm-table-chart',
    headerLabel: 'Basic Matrix (Spreadsheet)',
    question: 'How satisfied are you with the following',
    matrixSpreadsheet: {
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
    variant: 'date-time',
    headerIcon: 'wm-event',
    headerLabel: 'Misc (Date / Time)',
    question: 'What is your date of birth?',
    dateTime: {
      fields: [{ label: 'Month' }, { label: 'Day' }, { label: 'Year' }],
    },
  },
  captcha: {
    variant: 'placeholder',
    headerIcon: 'wm-verified-user',
    headerLabel: 'Captcha',
    question: 'Bot verification challenge before continuing.',
  },
  calendar: {
    variant: 'calendar',
    headerIcon: 'wm-calendar-month',
    headerLabel: 'Misc (Calendar)',
    question: 'What is your date of birth?',
    calendar: {
      inputIcon: 'wm-calendar-month',
    },
  },
  maps: {
    variant: 'maps',
    headerIcon: 'wm-map',
    headerLabel: 'Misc (Maps)',
    question: 'What state were you born in?',
    maps: {},
  },
  nps: {
    variant: 'nps',
    headerIcon: 'wm-speed',
    headerLabel: 'Customer Satisfaction (Net Promoter Score)',
    question:
      'Considering your complete experience with our company, how likely would you be to recommend our products to a friend or colleague?',
    nps: {
      minLabel: 'Very Unlikely',
      maxLabel: 'Very Likely',
    },
  },
  homunculus: {
    variant: 'homunculus',
    headerIcon: 'wm-local-hospital',
    headerLabel: 'Health Care (Homunculus Question)',
    question: 'Please click/tap on any areas of discomfort',
    homunculus: {},
  },
  'verified-signature': {
    variant: 'verified-signature',
    headerIcon: 'wm-verified-user',
    headerLabel: 'Health Care (Verified Signature)',
    question: '',
    verifiedSignature: {
      declaration:
        'I hereby declare that above mentioned information is correct to the best of my knowledge and I bear the responsibility for the correctness of above mentioned particulars',
      fullNameLabel: 'Full Name',
      emailLabel: 'Email Address',
      signaturePrompt: 'Please type your signature in the box',
      signaturePlaceholder: 'Type your signature here',
      agreeLabel: 'I Agree',
    },
  },
  'van-westendorp': {
    variant: 'van-westendorp',
    headerIcon: 'wm-local-offer',
    headerLabel: 'Pricing Analysis (Van Westendorp)',
    question: '',
    vanWestendorp: {
      title: 'At what price would you consider the Product',
      priceLabel: 'Price',
      rows: [
        {
          id: 'too-expensive',
          prompt:
            'At what price would you consider the product to be so expensive that you would not consider buying it? (Too Expensive)',
        },
        {
          id: 'expensive',
          prompt:
            'At what price would you consider the product starting to get expensive, so that it is not out of the question, but you would have to give some thought to buying it? (Expensive/High Side)',
        },
        {
          id: 'cheap',
          prompt:
            'At what price would you consider the product to be a bargain - a great buy for the money? (Cheap/Good Value)',
        },
        {
          id: 'too-cheap',
          prompt:
            "At what price would you consider the product to be priced so low that you would feel the quality couldn't be very good? (Too Cheap)",
        },
      ],
    },
  },
  'gabor-granger': {
    variant: 'gabor-granger',
    headerIcon: 'wm-attach-money',
    headerLabel: 'Pricing Analysis (Gabor Granger)',
    question: "Would you buy 'Product Name' at :",
    gaborGranger: {
      priceDisplay: '$ 300 USD',
      choices: ['Yes', 'No'],
    },
  },
  'reference-data': {
    variant: 'reference-data',
    headerIcon: 'wm-folder',
    headerLabel: 'Data Reference (Reference Data)',
    question: '',
    referenceData: {
      inputPlaceholder: 'Enter a valid zip code',
    },
  },
  'lookup-table': {
    variant: 'lookup-table',
    headerIcon: 'wm-manage-search',
    headerLabel: 'Data Reference (Lookup Table)',
    question: '',
    lookupTable: {
      question: 'Please select the state you live in',
      selectedValue: 'Alabama',
    },
  },
  'multi-tier-lookup': {
    variant: 'multi-tier-lookup',
    headerIcon: 'wm-layers',
    headerLabel: 'Data Reference (Multi Tier Lookup Table)',
    question: '',
    multiTierLookup: {
      instructions:
        'Please select an option from the drop down menu below. After selecting an option, another drop down list will be displayed below. Select an appropriate option from that list as well.',
      selectPlaceholder: '- Select -',
    },
  },
  'store-locator': {
    variant: 'placeholder',
    headerIcon: 'wm-store',
    headerLabel: 'Store Locator',
    question: 'Find nearby locations from a store database.',
  },
  tubepulse: {
    variant: 'tubepulse',
    headerIcon: 'wm-play-circle',
    headerLabel: 'Image / Multimedia (TubePulse™)',
    question: 'Please rate your views',
    tubePulse: {
      scaleLabels: ['Bad', 'Good', 'Excellent'],
      thumbPositionPercent: 10,
    },
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
