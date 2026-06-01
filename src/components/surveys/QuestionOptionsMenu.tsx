'use client';

import dynamic from 'next/dynamic';
import styles from './QuestionOptionsMenu.module.css';

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);

const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

const WuMenuSeparatorItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuSeparatorItem })),
  { ssr: false }
);

export type QuestionMenuAction =
  | 'preview'
  | 'copy'
  | 'save-to-library'
  | 'reorder'
  | 'delete';

interface QuestionOptionsMenuProps {
  onAction: (action: QuestionMenuAction) => void;
  triggerClassName?: string;
}

function MenuItemWithIcon({
  iconClass,
  label,
  onSelect,
}: {
  iconClass: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <WuMenuItem onSelect={onSelect}>
      <span className={styles.menuItemContent}>
        <span className={`${iconClass} ${styles.menuItemIcon}`} aria-hidden />
        <span>{label}</span>
      </span>
    </WuMenuItem>
  );
}

export function QuestionOptionsMenu({ onAction, triggerClassName }: QuestionOptionsMenuProps) {
  const triggerClass = triggerClassName ?? styles.menuBtn;

  return (
    <WuMenu
      Trigger={
        <button type="button" className={triggerClass} aria-label="Question options">
          <span className="wm-more-vert" />
        </button>
      }
      align="end"
    >
      <MenuItemWithIcon
        iconClass="wm-visibility"
        label="Preview"
        onSelect={() => onAction('preview')}
      />
      <MenuItemWithIcon
        iconClass="wm-content-copy"
        label="Copy"
        onSelect={() => onAction('copy')}
      />
      <MenuItemWithIcon
        iconClass="wm-cloud-upload"
        label="Save To Library"
        onSelect={() => onAction('save-to-library')}
      />
      <MenuItemWithIcon
        iconClass="wm-drag-indicator"
        label="Reorder"
        onSelect={() => onAction('reorder')}
      />
      <WuMenuSeparatorItem />
      <MenuItemWithIcon
        iconClass="wm-delete"
        label="Delete"
        onSelect={() => onAction('delete')}
      />
    </WuMenu>
  );
}
