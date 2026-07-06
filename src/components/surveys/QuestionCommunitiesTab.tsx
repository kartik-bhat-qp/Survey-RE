'use client';

import dynamic from 'next/dynamic';
import {
  COMMUNITY_MAPPING_AUTO_SELECT_CONFLICT_MESSAGE,
  COMMUNITY_SETTINGS_OPTIONS,
  CUSTOM_PROFILE_FIELD_OPTIONS,
  type CommunityIdSelection,
  type CustomProfileFieldId,
} from '@/data/mock-question-communities';
import styles from './QuestionSettingsPanel.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

export interface QuestionCommunitiesTabProps {
  communityId: CommunityIdSelection;
  customProfileFieldId: CustomProfileFieldId;
  onCommunityChange: (communityId: CommunityIdSelection) => void;
  onCustomProfileFieldChange: (fieldId: CustomProfileFieldId) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function QuestionCommunitiesTab({
  communityId,
  customProfileFieldId,
  onCommunityChange,
  onCustomProfileFieldChange,
  disabled = false,
  disabledReason = COMMUNITY_MAPPING_AUTO_SELECT_CONFLICT_MESSAGE,
}: QuestionCommunitiesTabProps) {
  const communityValue =
    COMMUNITY_SETTINGS_OPTIONS.find((option) => option.value === communityId) ??
    COMMUNITY_SETTINGS_OPTIONS[0];
  const profileFieldValue =
    CUSTOM_PROFILE_FIELD_OPTIONS.find((option) => option.value === customProfileFieldId) ??
    CUSTOM_PROFILE_FIELD_OPTIONS[0];

  return (
    <div
      role="tabpanel"
      className={disabled ? styles.tabPanelDisabled : undefined}
      aria-disabled={disabled || undefined}
    >
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Community Settings</span>
        <WuTooltip content={disabled ? disabledReason : undefined} position="top">
          <div className={styles.selectWrap}>
            <WuSelect
              data={COMMUNITY_SETTINGS_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={communityValue}
              onSelect={(item) =>
                onCommunityChange((item as { value: CommunityIdSelection }).value)
              }
              variant="outlined"
              disabled={disabled}
            />
          </div>
        </WuTooltip>
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Question Text</span>
        <WuTooltip content={disabled ? disabledReason : undefined} position="top">
          <div className={styles.selectWrap}>
            <WuSelect
              data={CUSTOM_PROFILE_FIELD_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={profileFieldValue}
              onSelect={(item) =>
                onCustomProfileFieldChange((item as { value: CustomProfileFieldId }).value)
              }
              variant="outlined"
              disabled={disabled}
            />
          </div>
        </WuTooltip>
      </div>
    </div>
  );
}
