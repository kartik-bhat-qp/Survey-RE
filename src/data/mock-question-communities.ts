export type CommunityId = 'my-community' | 'customer-advisory-panel' | 'beta-testers';

export type CommunityIdSelection = CommunityId | '';

export type CustomProfileFieldId =
  | ''
  | 'age-bracket'
  | 'department'
  | 'job-title'
  | 'membership-tier'
  | 'region';

export interface QuestionCommunitySettings {
  communityId: CommunityIdSelection;
  customProfileFieldId: CustomProfileFieldId;
}

export const DEFAULT_QUESTION_COMMUNITY_SETTINGS: QuestionCommunitySettings = {
  communityId: '',
  customProfileFieldId: '',
};

export const COMMUNITY_SETTINGS_OPTIONS: {
  value: CommunityIdSelection;
  label: string;
}[] = [
  { value: '', label: 'Select Community' },
  { value: 'my-community', label: 'My community' },
  { value: 'customer-advisory-panel', label: 'Customer Advisory Panel' },
  { value: 'beta-testers', label: 'Beta Testers' },
];

export const CUSTOM_PROFILE_FIELD_OPTIONS: {
  value: CustomProfileFieldId;
  label: string;
}[] = [
  { value: '', label: 'Select Custom Profile Field' },
  { value: 'age-bracket', label: 'Please select your age bracket' },
  { value: 'department', label: 'Department' },
  { value: 'job-title', label: 'Job Title' },
  { value: 'membership-tier', label: 'Membership Tier' },
  { value: 'region', label: 'Region' },
];

export function isCommunityMappingActive(
  settings: Pick<QuestionCommunitySettings, 'communityId' | 'customProfileFieldId'>
): boolean {
  return settings.communityId !== '' || settings.customProfileFieldId !== '';
}

export const AUTO_SELECT_COMMUNITY_MAPPING_CONFLICT_MESSAGE =
  'Turn off community mapping to use auto select shown options.';

export const COMMUNITY_MAPPING_AUTO_SELECT_CONFLICT_MESSAGE =
  'Turn off auto select shown options to map this question to a community.';

export interface LinkedCommunityDisplay {
  communityLabel: string;
  profileFieldLabel: string;
}

/** Returns breadcrumb segments when a community profile field is linked to the question. */
export function getLinkedCommunityDisplay(
  settings: QuestionCommunitySettings
): LinkedCommunityDisplay | null {
  if (!settings.communityId || !settings.customProfileFieldId) {
    return null;
  }

  const community = COMMUNITY_SETTINGS_OPTIONS.find(
    (option) => option.value === settings.communityId
  );
  const profileField = CUSTOM_PROFILE_FIELD_OPTIONS.find(
    (option) => option.value === settings.customProfileFieldId
  );

  if (!community?.value || !profileField?.value) {
    return null;
  }

  return {
    communityLabel: community.label,
    profileFieldLabel: profileField.label,
  };
}
