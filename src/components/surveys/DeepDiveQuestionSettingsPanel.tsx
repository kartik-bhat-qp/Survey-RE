'use client';

import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import type { DeepDiveFollowUpQuestionConfig } from '@/data/mock-deepdive-question-settings';
import { DeepDiveSettingsForm } from '@/components/surveys/DeepDiveSettingsForm';
import panelStyles from './QuestionSettingsPanel.module.css';
import styles from './DeepDiveQuestionSettingsPanel.module.css';

export interface DeepDiveQuestionSettingsPanelProps {
  question: SurveyQuestion;
  sections: SurveySection[];
  config: DeepDiveFollowUpQuestionConfig;
  onChange: (config: DeepDiveFollowUpQuestionConfig) => void;
  onClose: () => void;
}

export function DeepDiveQuestionSettingsPanel({
  sections,
  config,
  onChange,
  onClose,
}: DeepDiveQuestionSettingsPanelProps) {
  function patch(partial: Partial<DeepDiveFollowUpQuestionConfig>): void {
    onChange({ ...config, ...partial });
  }

  return (
    <aside
      className={`${panelStyles.panel} ${styles.panel}`}
      aria-label="DeepDive settings"
    >
      <DeepDiveSettingsForm
        settings={config}
        sections={sections}
        probeTargetSectionId={config.targetSectionId}
        probeTargetQuestionId={config.targetQuestionId}
        onChange={patch}
        showHeader
        onClose={onClose}
      />
    </aside>
  );
}
