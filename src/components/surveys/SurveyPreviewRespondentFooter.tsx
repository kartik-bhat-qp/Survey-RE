'use client';

import { useMemo, useState } from 'react';
import { RespondentAnonymityAssurancePopup } from '@/components/surveys/RespondentAnonymityAssurancePopup';
import { readRaaPopupCopy } from '@/data/mock-compliance';
import {
  getEnabledAnonymityFieldLabels,
  readSurveySettings,
} from '@/data/mock-survey-settings';
import styles from './SurveyPreviewRespondentFooter.module.css';

interface SurveyPreviewRespondentFooterProps {
  surveyId: number;
}

export function SurveyPreviewRespondentFooter({
  surveyId,
}: SurveyPreviewRespondentFooterProps) {
  const [raaOpen, setRaaOpen] = useState(false);
  const settings = useMemo(() => readSurveySettings(surveyId), [surveyId, raaOpen]);
  const popupCopy = useMemo(() => readRaaPopupCopy(), [raaOpen]);
  const raaEnabled = settings.security.respondentAnonymityAssurance;
  const enabledFieldLabels = useMemo(
    () => getEnabledAnonymityFieldLabels(settings.security.respondentAnonymity),
    [settings.security.respondentAnonymity]
  );

  return (
    <>
      <footer className={styles.footer}>
        <a href="#" className={styles.link} onClick={(event) => event.preventDefault()}>
          Powered by QuestionPro
        </a>
        <span className={styles.links}>
          <a href="#" className={styles.link} onClick={(event) => event.preventDefault()}>
            Privacy &amp; Data Security
          </a>
          {raaEnabled ? (
            <>
              <span className={styles.divider}>|</span>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setRaaOpen(true)}
              >
                Respondent Anonymity Assurance
              </button>
            </>
          ) : null}
        </span>
      </footer>
      <RespondentAnonymityAssurancePopup
        open={raaOpen}
        onOpenChange={setRaaOpen}
        copy={popupCopy}
        enabledFieldLabels={enabledFieldLabels}
      />
    </>
  );
}
