'use client';

import dynamic from 'next/dynamic';
import styles from './SectionBlockOptionsButton.module.css';

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

export type SectionBlockMenuAction =
  | 'preview'
  | 'copy'
  | 'reorder'
  | 'randomize-questions'
  | 'looping'
  | 'block-flow'
  | 'delete';

interface SectionBlockOptionsButtonProps {
  sectionTitle: string;
  onAction: (action: SectionBlockMenuAction) => void;
}

function MenuItemWithIcon({
  iconClass,
  label,
  onSelect,
}: {
  iconClass: string;
  label: string;
  onSelect: (event: Event) => void;
}) {
  return (
    <WuMenuItem className={styles.menuItem} onSelect={onSelect}>
      <span className={styles.menuItemContent}>
        <span className={`${iconClass} ${styles.menuItemIcon}`} aria-hidden />
        <span>{label}</span>
      </span>
    </WuMenuItem>
  );
}

export function SectionBlockOptionsButton({
  sectionTitle,
  onAction,
}: SectionBlockOptionsButtonProps) {
  return (
    <div className={styles.blockOptionsWrap}>
      <WuMenu
        align="end"
        Trigger={
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={`${sectionTitle} block options`}
          >
            <span className="wm-more-vert" aria-hidden />
          </button>
        }
      >
        <MenuItemWithIcon
          iconClass="wm-visibility"
          label="Preview"
          onSelect={(event) => {
            event.preventDefault();
            onAction('preview');
          }}
        />
        <MenuItemWithIcon
          iconClass="wm-content-copy"
          label="Copy"
          onSelect={() => onAction('copy')}
        />
        <MenuItemWithIcon
          iconClass="wm-drag-indicator"
          label="Reorder"
          onSelect={() => onAction('reorder')}
        />
        <WuMenuSeparatorItem />
        <MenuItemWithIcon
          iconClass="wm-compare-arrows"
          label="Randomize Questions"
          onSelect={() => onAction('randomize-questions')}
        />
        <MenuItemWithIcon
          iconClass="wm-autorenew"
          label="Looping"
          onSelect={() => onAction('looping')}
        />
        <MenuItemWithIcon
          iconClass="wm-layers"
          label="Block Flow"
          onSelect={() => onAction('block-flow')}
        />
        <WuMenuSeparatorItem />
        <MenuItemWithIcon
          iconClass="wm-delete"
          label="Delete"
          onSelect={() => onAction('delete')}
        />
      </WuMenu>
    </div>
  );
}
