import styles from './SearchReplaceIcon.module.css';

interface SearchReplaceIconProps {
  className?: string;
}

/** Search & replace — sync/replace ring with magnifying glass (secondary nav). */
export function SearchReplaceIcon({ className }: SearchReplaceIconProps) {
  return (
    <span className={`${styles.root} ${className ?? ''}`} aria-hidden>
      <span className={`wm-sync ${styles.sync}`} />
      <span className={`wm-search ${styles.glass}`} />
    </span>
  );
}
