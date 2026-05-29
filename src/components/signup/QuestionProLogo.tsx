import Image from 'next/image';
import styles from './QuestionProLogo.module.css';

type QuestionProLogoProps = {
  centered?: boolean;
  compact?: boolean;
};

export function QuestionProLogo({ centered, compact }: QuestionProLogoProps) {
  const className = [
    styles.logo,
    centered && styles.logoCentered,
    compact && styles.logoCompact,
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
    </div>
  );
}
