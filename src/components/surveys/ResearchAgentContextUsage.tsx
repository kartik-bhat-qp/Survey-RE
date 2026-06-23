import styles from './ResearchAgentContextUsage.module.css';

const RING_RADIUS = 8;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ResearchAgentContextUsageProps {
  usedTokens: number;
  maxTokens: number;
}

export function ResearchAgentContextUsage({
  usedTokens,
  maxTokens,
}: ResearchAgentContextUsageProps) {
  const usageRatio = Math.min(Math.max(usedTokens / maxTokens, 0), 1);
  const usagePercent = Math.round(usageRatio * 100);
  const strokeOffset = RING_CIRCUMFERENCE * (1 - usageRatio);

  return (
    <span
      className={styles.usage}
      role="img"
      aria-label={`Context usage ${usagePercent} percent`}
      title={`${usagePercent}% context used`}
    >
      <svg
        className={styles.ring}
        viewBox="0 0 20 20"
        width="20"
        height="20"
        aria-hidden
      >
        <circle
          className={styles.track}
          cx="10"
          cy="10"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="2"
        />
        <circle
          className={styles.fill}
          cx="10"
          cy="10"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="2"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={strokeOffset}
          transform="rotate(-90 10 10)"
        />
      </svg>
    </span>
  );
}
