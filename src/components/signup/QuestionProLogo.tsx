import Image from 'next/image';
import styles from './QuestionProLogo.module.css';

type QuestionProLogoProps = {
  centered?: boolean;
  compact?: boolean;
  /** Shows the QuestionPro AI sparkle beside the logo. */
  showAiStar?: boolean;
};

export function QuestionProLogo({ centered, compact, showAiStar }: QuestionProLogoProps) {
  const className = [
    styles.logo,
    centered && styles.logoCentered,
    compact && styles.logoCompact,
    showAiStar && styles.logoWithAiStar,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <Image
        src="/images/questionpro-logo.png"
        alt="QuestionPro"
        width={compact ? 160 : 220}
        height={compact ? 32 : 44}
        className={styles.image}
        priority
      />
      {showAiStar ? (
        <span
          className={`wc-ai ${styles.aiStar}`}
          aria-label="QuestionPro AI"
          title="QuestionPro AI"
        />
      ) : null}
    </div>
  );
}
