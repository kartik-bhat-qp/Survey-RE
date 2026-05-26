'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { PageContainer } from '@/components/ui/PageContainer';
import {
  MOCK_ORGANIZATION_CREDIT_BALANCE,
  MOCK_QUESTIONPRO_AI_ENABLED,
} from '@/data/mock-organization-settings';
import { formatTextAiCredits } from '@/data/mock-utils';
import styles from './page.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const CREDIT_BALANCE_TOOLTIP =
  'To view the complete balance sheet, go to My Account → Usage.';

export default function SettingsPage() {
  const { showToast } = useWuShowToast();
  const [questionProAiEnabled, setQuestionProAiEnabled] = useState(MOCK_QUESTIONPRO_AI_ENABLED);

  return (
    <PageContainer>
      <h1 className={styles.pageTitle}>Organization settings</h1>

      <div className={styles.settingsList}>
        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>
            <span className={`wc-ai ${styles.settingIcon}`} aria-hidden />
            QuestionPro AI
          </span>
          <WuToggle
            checked={questionProAiEnabled}
            onChange={(checked) => {
              setQuestionProAiEnabled(checked);
              showToast({
                message: checked ? 'QuestionPro AI enabled' : 'QuestionPro AI disabled',
                variant: 'success',
              });
            }}
            aria-label="QuestionPro AI"
          />
        </div>

        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>
            Credit balance
            <WuTooltip content={CREDIT_BALANCE_TOOLTIP} position="bottom">
              <span className={styles.infoIconWrap} aria-label={CREDIT_BALANCE_TOOLTIP}>
                <span className="wm-info" />
              </span>
            </WuTooltip>
          </span>
          <span className={styles.creditValue}>
            {formatTextAiCredits(MOCK_ORGANIZATION_CREDIT_BALANCE)}
          </span>
        </div>
      </div>
    </PageContainer>
  );
}
