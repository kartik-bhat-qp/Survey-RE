'use client';

import styles from './DynamicTextCommentsOptionIcon.module.css';

export function DynamicTextCommentsOptionIcon() {
  return (
    <span
      className={styles.icon}
      title="Dynamic text comment box enabled"
      aria-label="Dynamic text comment box enabled"
      role="img"
    >
      <span className="wm-chat" aria-hidden />
    </span>
  );
}
