import { ADD_QUESTION_CATEGORIES } from '@/data/mock-add-question-types';
import { getQuestionTypePreview } from '@/data/mock-add-question-previews';
import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import {
  DEFAULT_CAPTCHA_QUESTION_TEXT,
  DEFAULT_COMMENT_BOX_QUESTION_TEXT,
  DEFAULT_CONTACT_INFORMATION_QUESTION_TEXT,
  DEFAULT_DROPDOWN_QUESTION_TEXT,
  DEFAULT_IMAGE_CHOOSER_RATING_QUESTION_TEXT,
  DEFAULT_IMAGE_CHOOSER_SELECT_MANY_QUESTION_TEXT,
  DEFAULT_IMAGE_CHOOSER_SELECT_ONE_QUESTION_TEXT,
  DEFAULT_LOOKUP_TABLE_QUESTION_TEXT,
  DEFAULT_MATRIX_MULTI_SELECT_QUESTION_TEXT,
  DEFAULT_MATRIX_SPREADSHEET_QUESTION_TEXT,
  DEFAULT_MULTI_POINT_QUESTION_TEXT,
  DEFAULT_NPS_MAX_LABEL,
  DEFAULT_NPS_MIN_LABEL,
  DEFAULT_NUMERIC_SLIDER_QUESTION_TEXT,
  DEFAULT_RANK_ORDER_QUESTION_TEXT,
  DEFAULT_SINGLE_ROW_QUESTION_TEXT,
  DEFAULT_SMILEY_RATING_QUESTION_TEXT,
  DEFAULT_STAR_RATING_QUESTION_TEXT,
  DEFAULT_TEXT_SLIDER_QUESTION_TEXT,
  DEFAULT_THUMBS_QUESTION_TEXT,
  DEFAULT_VAN_WESTENDORP_QUESTION_TEXT,
  createDefaultContactInformationOptions,
  createDefaultConstantSumOptions,
  createDefaultDragDropMatrix,
  createDefaultDropdownOptions,
  createDefaultImageChooserRatingMatrix,
  createDefaultImageChooserSelectManyOptions,
  createDefaultImageChooserSelectOneOptions,
  createDefaultLookupTableData,
  createDefaultLookupTableOptions,
  createDefaultMatrixMultiSelectMatrix,
  createDefaultMatrixSpreadsheetMatrix,
  createDefaultMultiPointMatrix,
  createDefaultNumericSliderMatrix,
  createDefaultRankOrderOptions,
  createDefaultSmileyRatingData,
  createDefaultStarRatingMatrix,
  createDefaultTextSliderMatrix,
  createDefaultThumbsUpDownData,
  createDefaultVanWestendorpData,
} from '@/data/mock-survey-detail';

export const SURVEY_MENU_SURVEY_ID = 15;

const SURVEY_MENU_RANDOM_SEED = 20260623;
const SURVEY_MENU_QUESTION_COUNT = 10;

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0;

  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = Math.floor((state / 4294967296) * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function getAllAddQuestionTypeIds(): string[] {
  return ADD_QUESTION_CATEGORIES.flatMap((category) => category.types.map((type) => type.id));
}

function getAddQuestionCategoryTitle(typeId: string): string {
  for (const category of ADD_QUESTION_CATEGORIES) {
    if (category.types.some((type) => type.id === typeId)) {
      return category.title;
    }
  }
  return 'Misc';
}

function getAddQuestionTypeLabel(typeId: string): string {
  for (const category of ADD_QUESTION_CATEGORIES) {
    const match = category.types.find((type) => type.id === typeId);
    if (match) return match.label;
  }
  return typeId;
}

export function pickRandomSurveyMenuQuestionTypeIds(
  count = SURVEY_MENU_QUESTION_COUNT,
  seed = SURVEY_MENU_RANDOM_SEED
): string[] {
  return seededShuffle(getAllAddQuestionTypeIds(), seed).slice(0, count);
}

function buildSurveyMenuQuestion(typeId: string, number: number): SurveyQuestion {
  const questionKey = `q-menu-${number}`;
  const base = {
    id: questionKey,
    code: `Q${number}`,
    number,
    required: true,
    addQuestionTypeId: typeId,
  } as const;

  switch (typeId) {
    case 'select-one':
      return {
        ...base,
        text: `Question ${number}`,
        inputKind: 'radio',
        options: [
          { id: `${questionKey}-opt-1`, label: 'Option 1' },
          { id: `${questionKey}-opt-2`, label: 'Option 2' },
        ],
      };
    case 'select-many':
      return {
        ...base,
        text: `Question ${number}`,
        inputKind: 'checkbox',
        options: [
          { id: `${questionKey}-opt-1`, label: 'Option 1' },
          { id: `${questionKey}-opt-2`, label: 'Option 2' },
        ],
      };
    case 'dropdown':
      return {
        ...base,
        text: DEFAULT_DROPDOWN_QUESTION_TEXT,
        inputKind: 'radio',
        options: createDefaultDropdownOptions().map((option, index) => ({
          ...option,
          id: `${questionKey}-opt-${index + 1}`,
        })),
      };
    case 'comment-box':
      return {
        ...base,
        text: DEFAULT_COMMENT_BOX_QUESTION_TEXT,
        options: [],
      };
    case 'single-row':
      return {
        ...base,
        text: DEFAULT_SINGLE_ROW_QUESTION_TEXT,
        options: [],
      };
    case 'email':
      return {
        ...base,
        text: `Question ${number}`,
        options: [],
      };
    case 'contact':
      return {
        ...base,
        text: DEFAULT_CONTACT_INFORMATION_QUESTION_TEXT,
        options: createDefaultContactInformationOptions().map((option, index) => ({
          ...option,
          id: `${questionKey}-field-${index + 1}`,
        })),
      };
    case 'star-rating':
      return {
        ...base,
        text: DEFAULT_STAR_RATING_QUESTION_TEXT,
        kind: 'star-rating',
        options: [],
        matrix: createDefaultStarRatingMatrix(),
      };
    case 'smiley-rating':
      return {
        ...base,
        text: DEFAULT_SMILEY_RATING_QUESTION_TEXT,
        kind: 'smiley-rating',
        options: [],
        smileyRating: createDefaultSmileyRatingData(),
      };
    case 'thumbs':
      return {
        ...base,
        text: DEFAULT_THUMBS_QUESTION_TEXT,
        kind: 'thumbs-up-down',
        options: [],
        thumbsUpDown: createDefaultThumbsUpDownData(),
      };
    case 'text-slider':
      return {
        ...base,
        text: DEFAULT_TEXT_SLIDER_QUESTION_TEXT,
        kind: 'text-slider',
        options: [],
        matrix: createDefaultTextSliderMatrix(),
      };
    case 'numeric-slider':
      return {
        ...base,
        text: DEFAULT_NUMERIC_SLIDER_QUESTION_TEXT,
        kind: 'numeric-slider',
        options: [],
        matrix: createDefaultNumericSliderMatrix(),
      };
    case 'image-select-one':
      return {
        ...base,
        text: DEFAULT_IMAGE_CHOOSER_SELECT_ONE_QUESTION_TEXT,
        kind: 'image-chooser-select-one',
        options: createDefaultImageChooserSelectOneOptions(),
      };
    case 'image-select-many':
      return {
        ...base,
        text: DEFAULT_IMAGE_CHOOSER_SELECT_MANY_QUESTION_TEXT,
        kind: 'image-chooser-select-many',
        options: createDefaultImageChooserSelectManyOptions(),
      };
    case 'image-rating':
      return {
        ...base,
        text: DEFAULT_IMAGE_CHOOSER_RATING_QUESTION_TEXT,
        kind: 'image-chooser-rating',
        options: [],
        matrix: createDefaultImageChooserRatingMatrix(),
      };
    case 'rank-order':
      return {
        ...base,
        text: DEFAULT_RANK_ORDER_QUESTION_TEXT,
        kind: 'rank-order',
        options: createDefaultRankOrderOptions(),
      };
    case 'constant-sum':
      return {
        ...base,
        text: 'How much do you spend monthly on -',
        kind: 'constant-sum',
        options: createDefaultConstantSumOptions(),
      };
    case 'drag-drop':
      return {
        ...base,
        text: 'Drag and drop the following in the order of your preference',
        kind: 'drag-drop',
        options: [],
        matrix: createDefaultDragDropMatrix(),
      };
    case 'presentation':
    case 'section-heading':
    case 'section-subheading':
      return {
        ...base,
        text: '',
        required: false,
        kind: typeId,
        options: [],
      };
    case 'multi-point':
      return {
        ...base,
        text: DEFAULT_MULTI_POINT_QUESTION_TEXT,
        kind: 'multi-point-scales',
        options: [],
        matrix: createDefaultMultiPointMatrix(),
      };
    case 'multi-select-matrix':
      return {
        ...base,
        text: DEFAULT_MATRIX_MULTI_SELECT_QUESTION_TEXT,
        kind: 'matrix-multi-select',
        options: [],
        matrix: createDefaultMatrixMultiSelectMatrix(),
      };
    case 'spreadsheet':
      return {
        ...base,
        text: DEFAULT_MATRIX_SPREADSHEET_QUESTION_TEXT,
        kind: 'matrix-spreadsheet',
        options: [],
        matrix: createDefaultMatrixSpreadsheetMatrix(),
      };
    case 'nps':
      return {
        ...base,
        text: `Question ${number}`,
        kind: 'nps',
        options: [],
        nps: {
          minLabel: DEFAULT_NPS_MIN_LABEL,
          maxLabel: DEFAULT_NPS_MAX_LABEL,
        },
      };
    case 'lookup-table':
      return {
        ...base,
        text: DEFAULT_LOOKUP_TABLE_QUESTION_TEXT,
        kind: 'lookup-table',
        options: createDefaultLookupTableOptions(),
        lookupTable: createDefaultLookupTableData(),
      };
    case 'van-westendorp':
      return {
        ...base,
        text: DEFAULT_VAN_WESTENDORP_QUESTION_TEXT,
        kind: 'van-westendorp',
        options: [],
        vanWestendorp: createDefaultVanWestendorpData(),
      };
    case 'captcha':
      return {
        ...base,
        text: DEFAULT_CAPTCHA_QUESTION_TEXT,
        options: [],
      };
    default: {
      const categoryTitle = getAddQuestionCategoryTitle(typeId);
      const typeLabel = getAddQuestionTypeLabel(typeId);
      const preview = getQuestionTypePreview(typeId, categoryTitle, typeLabel);
      return {
        ...base,
        text: preview.question,
        options: (preview.options ?? []).map((label, index) => ({
          id: `${questionKey}-opt-${index + 1}`,
          label,
        })),
      };
    }
  }
}

export function createSurveyMenuSections(): SurveySection[] {
  const selectedTypeIds = pickRandomSurveyMenuQuestionTypeIds();

  return [
    {
      id: 'section-survey-menu',
      title: 'Block 1',
      questions: selectedTypeIds.map((typeId, index) =>
        buildSurveyMenuQuestion(typeId, index + 1)
      ),
    },
  ];
}
