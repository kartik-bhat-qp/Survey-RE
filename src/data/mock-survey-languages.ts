export type SurveyLanguageTranslationStatus = 'default' | 'complete' | 'in-progress' | 'not-started';

export type SurveyLanguagesSidebarTab =
  | 'languages'
  | 'import-translations'
  | 'manual-translations';

export interface SurveyLanguageVersion {
  id: string;
  name: string;
  nativeName?: string;
  code: string;
  status: SurveyLanguageTranslationStatus;
  isDefault: boolean;
  /** Whether this language version is enabled for respondents. */
  enabled: boolean;
  /** Translation completion 0–100. */
  progressPercent: number;
}

export interface AddableSurveyLanguage {
  id: string;
  name: string;
  nativeName?: string;
  code: string;
  /** Featured languages shown above the divider in Add Language Version. */
  featured?: boolean;
}

export const LANGUAGE_VERSIONS_HELP =
  'Language versions let respondents take this survey in different languages. The default language is used when no other version is selected.';

export const SCREENER_QUESTION_LABEL = 'Select your preferred language:';

export const SURVEY_LANGUAGES_SIDEBAR_ITEMS: {
  id: SurveyLanguagesSidebarTab;
  label: string;
}[] = [
  { id: 'languages', label: 'Languages' },
  { id: 'import-translations', label: 'Import Translations' },
  { id: 'manual-translations', label: 'Manual Translations' },
];

/** Native-script labels used in the languages table for common locales. */
const NATIVE_NAME_BY_ID: Record<string, string> = {
  'ar': 'العربية',
  'ar-sa': 'العربية',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  'nl': 'Nederlands',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'es-mx': 'Español',
  'pt': 'Português',
  'pt-br': 'Português',
  'ja': '日本語',
  'ko': '한국어',
  'hi': 'हिन्दी',
  'ru': 'Русский',
};

export function getDefaultSurveyLanguages(): SurveyLanguageVersion[] {
  return [
    {
      id: 'en',
      name: 'English',
      code: 'en',
      status: 'default',
      isDefault: true,
      enabled: true,
      progressPercent: 100,
    },
  ];
}

export function getSurveyLanguageDisplayName(language: SurveyLanguageVersion): string {
  if (language.nativeName) {
    return `${language.name} (${language.nativeName})`;
  }
  return language.name;
}

export function getSurveyLanguageStatusLabel(
  status: SurveyLanguageTranslationStatus
): string {
  switch (status) {
    case 'default':
      return 'Default Language';
    case 'complete':
      return 'Complete';
    case 'in-progress':
      return 'In Progress';
    case 'not-started':
      return 'Not Started';
    default:
      return 'Not Started';
  }
}

/**
 * Featured languages shown in the top section of Add Language Version,
 * matching the product screenshot order.
 */
export const FEATURED_SURVEY_LANGUAGES: AddableSurveyLanguage[] = [
  { id: 'en', name: 'English', code: 'en', featured: true },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', code: 'ar', featured: true },
  { id: 'zh-cn', name: 'Chinese - Simplified', nativeName: '简体中文', code: 'zh-CN', featured: true },
  { id: 'zh-tw', name: 'Chinese - Traditional', nativeName: '繁體中文', code: 'zh-TW', featured: true },
  { id: 'nl', name: 'Dutch', nativeName: 'Nederlands', code: 'nl', featured: true },
  { id: 'fr', name: 'French', nativeName: 'Français', code: 'fr', featured: true },
  { id: 'de', name: 'German', nativeName: 'Deutsch', code: 'de', featured: true },
  { id: 'es', name: 'Spanish', nativeName: 'Español', code: 'es', featured: true },
  { id: 'pt', name: 'Portuguese', nativeName: 'Português', code: 'pt', featured: true },
  { id: 'es-mx', name: 'Spanish (Mexico)', nativeName: 'Español', code: 'es-MX', featured: true },
  { id: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português', code: 'pt-BR', featured: true },
];

/**
 * Full supported language catalog for Add Language Version (alphabetical section).
 * Labels match the product language picker.
 */
export const ALL_SURVEY_LANGUAGES: AddableSurveyLanguage[] = [
  { id: 'af', name: 'Afrikaans', code: 'af' },
  { id: 'sq', name: 'Albanian', code: 'sq' },
  { id: 'am', name: 'Amharic', code: 'am' },
  { id: 'ar-sa', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية', code: 'ar-SA' },
  { id: 'hy', name: 'Armenian', code: 'hy' },
  { id: 'as', name: 'Assamese', code: 'as' },
  { id: 'az', name: 'Azerbaijani', code: 'az' },
  { id: 'eu', name: 'Basque', code: 'eu' },
  { id: 'be', name: 'Belarusian', code: 'be' },
  { id: 'bn', name: 'Bengali', code: 'bn' },
  { id: 'bs', name: 'Bosnian', code: 'bs' },
  { id: 'bg', name: 'Bulgarian', code: 'bg' },
  { id: 'my', name: 'Burmese', code: 'my' },
  { id: 'ca', name: 'Catalan', code: 'ca' },
  { id: 'ceb', name: 'Cebuano', code: 'ceb' },
  { id: 'zh-hk', name: 'Chinese (Hong Kong)', code: 'zh-HK' },
  { id: 'co', name: 'Corsican', code: 'co' },
  { id: 'hr', name: 'Croatian', code: 'hr' },
  { id: 'cs', name: 'Czech', code: 'cs' },
  { id: 'da', name: 'Danish', code: 'da' },
  { id: 'eo', name: 'Esperanto', code: 'eo' },
  { id: 'et', name: 'Estonian', code: 'et' },
  { id: 'fil', name: 'Filipino', code: 'fil' },
  { id: 'fi', name: 'Finnish', code: 'fi' },
  { id: 'fy', name: 'Frisian', code: 'fy' },
  { id: 'gl', name: 'Galician', code: 'gl' },
  { id: 'ka', name: 'Georgian', code: 'ka' },
  { id: 'el', name: 'Greek', code: 'el' },
  { id: 'gu', name: 'Gujarati', code: 'gu' },
  { id: 'ht', name: 'Haitian Creole', code: 'ht' },
  { id: 'ha', name: 'Hausa', code: 'ha' },
  { id: 'haw', name: 'Hawaiian', code: 'haw' },
  { id: 'he', name: 'Hebrew', code: 'he' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', code: 'hi' },
  { id: 'hmn', name: 'Hmong', code: 'hmn' },
  { id: 'hu', name: 'Hungarian', code: 'hu' },
  { id: 'is', name: 'Icelandic', code: 'is' },
  { id: 'ig', name: 'Igbo', code: 'ig' },
  { id: 'id', name: 'Indonesian', code: 'id' },
  { id: 'ga', name: 'Irish', code: 'ga' },
  { id: 'it', name: 'Italian', code: 'it' },
  { id: 'ja', name: 'Japanese', nativeName: '日本語', code: 'ja' },
  { id: 'jv', name: 'Javanese', code: 'jv' },
  { id: 'kn', name: 'Kannada', code: 'kn' },
  { id: 'kk', name: 'Kazakh', code: 'kk' },
  { id: 'km', name: 'Khmer', code: 'km' },
  { id: 'rw', name: 'Kinyarwanda', code: 'rw' },
  { id: 'ko', name: 'Korean', nativeName: '한국어', code: 'ko' },
  { id: 'ku', name: 'Kurdish', code: 'ku' },
  { id: 'ky', name: 'Kyrgyz', code: 'ky' },
  { id: 'lo', name: 'Lao', code: 'lo' },
  { id: 'la', name: 'Latin', code: 'la' },
  { id: 'lv', name: 'Latvian', code: 'lv' },
  { id: 'lt', name: 'Lithuanian', code: 'lt' },
  { id: 'lb', name: 'Luxembourgish', code: 'lb' },
  { id: 'mk', name: 'Macedonian', code: 'mk' },
  { id: 'mg', name: 'Malagasy', code: 'mg' },
  { id: 'ms', name: 'Malay', code: 'ms' },
  { id: 'ml', name: 'Malayalam', code: 'ml' },
  { id: 'mt', name: 'Maltese', code: 'mt' },
  { id: 'mi', name: 'Maori', code: 'mi' },
  { id: 'mr', name: 'Marathi', code: 'mr' },
  { id: 'mn', name: 'Mongolian', code: 'mn' },
  { id: 'ne', name: 'Nepali', code: 'ne' },
  { id: 'no', name: 'Norwegian', code: 'no' },
  { id: 'ny', name: 'Nyanja (Chichewa)', code: 'ny' },
  { id: 'or', name: 'Odia (Oriya)', code: 'or' },
  { id: 'ps', name: 'Pashto', code: 'ps' },
  { id: 'fa', name: 'Persian', code: 'fa' },
  { id: 'pl', name: 'Polish', code: 'pl' },
  { id: 'pa', name: 'Punjabi', code: 'pa' },
  { id: 'ro', name: 'Romanian', code: 'ro' },
  { id: 'ru', name: 'Russian', nativeName: 'Русский', code: 'ru' },
  { id: 'sm', name: 'Samoan', code: 'sm' },
  { id: 'gd', name: 'Scots Gaelic', code: 'gd' },
  { id: 'sr', name: 'Serbian', code: 'sr' },
  { id: 'st', name: 'Sesotho', code: 'st' },
  { id: 'sn', name: 'Shona', code: 'sn' },
  { id: 'sd', name: 'Sindhi', code: 'sd' },
  { id: 'si', name: 'Sinhala (Sinhalese)', code: 'si' },
  { id: 'sk', name: 'Slovak', code: 'sk' },
  { id: 'sl', name: 'Slovenian', code: 'sl' },
  { id: 'so', name: 'Somali', code: 'so' },
  { id: 'su', name: 'Sundanese', code: 'su' },
  { id: 'sw', name: 'Swahili', code: 'sw' },
  { id: 'sv', name: 'Swedish', code: 'sv' },
  { id: 'tg', name: 'Tajik', code: 'tg' },
  { id: 'ta', name: 'Tamil', code: 'ta' },
  { id: 'tt', name: 'Tatar', code: 'tt' },
  { id: 'te', name: 'Telugu', code: 'te' },
  { id: 'th', name: 'Thai', code: 'th' },
  { id: 'tr', name: 'Turkish', code: 'tr' },
  { id: 'tk', name: 'Turkmen', code: 'tk' },
  { id: 'uk', name: 'Ukrainian', code: 'uk' },
  { id: 'ur', name: 'Urdu', code: 'ur' },
  { id: 'ug', name: 'Uyghur', code: 'ug' },
  { id: 'uz', name: 'Uzbek', code: 'uz' },
  { id: 'vi', name: 'Vietnamese', code: 'vi' },
  { id: 'cy', name: 'Welsh', code: 'cy' },
  { id: 'xh', name: 'Xhosa', code: 'xh' },
  { id: 'yi', name: 'Yiddish', code: 'yi' },
  { id: 'yo', name: 'Yoruba', code: 'yo' },
  { id: 'zu', name: 'Zulu', code: 'zu' },
];

/** Combined catalog used by the Add Language Version picker. */
export const ADDABLE_SURVEY_LANGUAGES: AddableSurveyLanguage[] = [
  ...FEATURED_SURVEY_LANGUAGES,
  ...ALL_SURVEY_LANGUAGES,
];

export function getAddableSurveyLanguageById(
  id: string
): AddableSurveyLanguage | undefined {
  return ADDABLE_SURVEY_LANGUAGES.find((language) => language.id === id);
}

export function createSurveyLanguageFromOption(
  option: AddableSurveyLanguage
): SurveyLanguageVersion {
  return {
    id: option.id,
    name: option.name,
    nativeName: option.nativeName ?? NATIVE_NAME_BY_ID[option.id],
    code: option.code,
    status: option.id === 'en' ? 'default' : 'not-started',
    isDefault: option.id === 'en',
    enabled: true,
    progressPercent: option.id === 'en' ? 100 : 0,
  };
}

export function filterAddableSurveyLanguages(
  languages: AddableSurveyLanguage[],
  search: string
): AddableSurveyLanguage[] {
  const term = search.trim().toLowerCase();
  if (!term) return languages;
  return languages.filter(
    (language) =>
      language.name.toLowerCase().includes(term) ||
      language.code.toLowerCase().includes(term) ||
      (language.nativeName?.toLowerCase().includes(term) ?? false)
  );
}
