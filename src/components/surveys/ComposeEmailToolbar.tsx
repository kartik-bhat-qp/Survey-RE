'use client';

import dynamic from 'next/dynamic';
import {
  EMAIL_COMPOSE_FORMAT_TOOLBAR_ACTIONS,
  EMAIL_COMPOSE_SURVEY_TOOLBAR_ACTIONS,
  type EmailToolbarAction,
} from '@/data/mock-survey-distribute';
import { ComposeHelpMeWriteTrigger } from '@/components/surveys/ComposeHelpMeWrite';
import styles from './ComposeEmailToolbar.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface ComposeEmailToolbarProps {
  helpMeWriteOpen: boolean;
  helpMeWriteDisabled?: boolean;
  onHelpMeWriteToggle: () => void;
  onAction: (label: string) => void;
}

function ToolbarActionButton({
  action,
  onAction,
}: {
  action: EmailToolbarAction;
  onAction: (label: string) => void;
}) {
  let button: React.ReactNode;

  if (action.type === 'menu') {
    button = (
      <button
        type="button"
        className={styles.toolbarMenuBtn}
        aria-label={action.label}
        onClick={() => onAction(action.label)}
      >
        <span>{action.menuLabel}</span>
        <span className={`wm-arrow-drop-down ${styles.menuChevron}`} aria-hidden />
      </button>
    );
  } else if (action.type === 'text') {
    button = (
      <button
        type="button"
        className={`${styles.toolbarBtn} ${
          action.text === 'Source' ? styles.toolbarTextBtn : styles.toolbarLetterBtn
        }`}
        aria-label={action.label}
        onClick={() => onAction(action.label)}
      >
        {action.text}
      </button>
    );
  } else {
    button = (
      <button
        type="button"
        className={styles.toolbarBtn}
        aria-label={action.label}
        onClick={() => onAction(action.label)}
      >
        <span className={action.icon} aria-hidden />
      </button>
    );
  }

  return (
    <WuTooltip content={action.label} position="top">
      {button}
    </WuTooltip>
  );
}

export function ComposeEmailToolbar({
  helpMeWriteOpen,
  helpMeWriteDisabled = false,
  onHelpMeWriteToggle,
  onAction,
}: ComposeEmailToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Email formatting">
      <WuTooltip content="Help me write" position="top">
        <ComposeHelpMeWriteTrigger
          active={helpMeWriteOpen}
          disabled={helpMeWriteDisabled}
          onClick={onHelpMeWriteToggle}
        />
      </WuTooltip>

      <span className={styles.toolbarDivider} aria-hidden />

      <div className={styles.toolbarGroup}>
        {EMAIL_COMPOSE_SURVEY_TOOLBAR_ACTIONS.map((action) => (
          <ToolbarActionButton key={action.id} action={action} onAction={onAction} />
        ))}
      </div>

      <div className={styles.toolbarSpacer} aria-hidden />

      <div className={styles.toolbarGroup}>
        {EMAIL_COMPOSE_FORMAT_TOOLBAR_ACTIONS.map((action) => (
          <ToolbarActionButton key={action.id} action={action} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}
