'use client';

import { useMemo } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { CriteriaRulesExpanded } from '@/components/surveys/CriteriaRulesExpanded';
import {
  notificationCriteriaToDisplayBlocks,
  type SurveyNotificationItem,
} from '@/data/mock-survey-notifications';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import styles from './QuotaCriteriaViewModal.module.css';

interface NotificationCriteriaViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: SurveyNotificationItem | null;
  surveyId: number;
}

export function NotificationCriteriaViewModal({
  open,
  onOpenChange,
  notification,
  surveyId,
}: NotificationCriteriaViewModalProps) {
  const wick = useWickUILib();

  const blocks = useMemo(() => {
    if (!notification) return [];
    const questions = getQuestionsBySurvey(surveyId).filter(
      (question) => question.parentQuestionId === undefined
    );
    return notificationCriteriaToDisplayBlocks(notification.criteriaBlocks, questions);
  }, [notification, surveyId]);

  if (!wick || !open || !notification) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuModalClose } = wick;

  return (
    <WuModal open onOpenChange={onOpenChange} className={styles.modal} variant="action">
      <WuModalHeader className={styles.header}>{notification.name}</WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={`${styles.rulesSection} ${styles.rulesSectionFlush}`}>
          <h3 className={styles.rulesHeading}>Rules</h3>
          <CriteriaRulesExpanded
            blocks={blocks}
            showHeader
            variant="panel"
            orHint="Notification will be triggered when any criteria below is met."
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Close</WuModalClose>
      </WuModalFooter>
    </WuModal>
  );
}
