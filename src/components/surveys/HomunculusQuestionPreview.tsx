'use client';

import styles from './HomunculusQuestionPreview.module.css';

interface Hotspot {
  cx: number;
  cy: number;
  fill?: string;
}

const FRONT_HOTSPOTS: Hotspot[] = [
  { cx: 52, cy: 18 },
  { cx: 52, cy: 38 },
  { cx: 38, cy: 48 },
  { cx: 66, cy: 48 },
  { cx: 30, cy: 62 },
  { cx: 74, cy: 62 },
  { cx: 24, cy: 78 },
  { cx: 80, cy: 78 },
  { cx: 52, cy: 72 },
  { cx: 44, cy: 98 },
  { cx: 60, cy: 98 },
  { cx: 40, cy: 128 },
  { cx: 64, cy: 128 },
  { cx: 36, cy: 158 },
  { cx: 68, cy: 158 },
];

const BACK_HOTSPOTS: Hotspot[] = [
  { cx: 132, cy: 18 },
  { cx: 132, cy: 38 },
  { cx: 118, cy: 48 },
  { cx: 146, cy: 48 },
  { cx: 110, cy: 62 },
  { cx: 154, cy: 62 },
  { cx: 104, cy: 78 },
  { cx: 160, cy: 78 },
  { cx: 132, cy: 72 },
  { cx: 124, cy: 98 },
  { cx: 140, cy: 98 },
  { cx: 120, cy: 128 },
  { cx: 144, cy: 128 },
  { cx: 116, cy: 158 },
  { cx: 148, cy: 158 },
];

function BodySilhouette({ x }: { x: number }) {
  return (
    <g fill="none" stroke="#9ca3af" strokeWidth="1.2">
      <ellipse cx={x} cy={16} rx={11} ry={13} />
      <path d={`M ${x - 18} 32 Q ${x} 28 ${x + 18} 32 L ${x + 14} 72 Q ${x} 68 ${x - 14} 72 Z`} />
      <path d={`M ${x - 18} 36 L ${x - 30} 68`} />
      <path d={`M ${x + 18} 36 L ${x + 30} 68`} />
      <path d={`M ${x - 12} 72 L ${x - 16} 118`} />
      <path d={`M ${x + 12} 72 L ${x + 16} 118`} />
      <path d={`M ${x - 16} 118 L ${x - 20} 168`} />
      <path d={`M ${x + 16} 118 L ${x + 20} 168`} />
    </g>
  );
}

function HomunculusDiagram({
  interactive = false,
}: {
  interactive?: boolean;
}) {
  const frontHotspots = FRONT_HOTSPOTS.map((spot, index) =>
    interactive && index === 0 ? { ...spot, fill: '#ef4444' } : spot
  );
  const backHotspots = BACK_HOTSPOTS.map((spot, index) =>
    interactive && index === 0 ? { ...spot, fill: '#eab308' } : spot
  );

  return (
    <svg
      className={styles.diagramSvg}
      viewBox="0 0 184 180"
      role="img"
      aria-label={
        interactive
          ? 'Homunculus body map with head selected and pain level prompt'
          : 'Homunculus body map with selectable areas'
      }
    >
      <rect fill="#fafafa" height="180" width="184" />
      <BodySilhouette x={52} />
      <BodySilhouette x={132} />
      {[...frontHotspots, ...backHotspots].map((spot, index) => (
        <circle
          key={`${interactive ? 'active' : 'base'}-${index}`}
          cx={spot.cx}
          cy={spot.cy}
          fill={spot.fill ?? '#d1d5db'}
          r={spot.fill ? 5 : 4}
          stroke={spot.fill ? spot.fill : '#9ca3af'}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

export function HomunculusQuestionPreview() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.stack}>
        <div className={styles.diagram}>
          <HomunculusDiagram />
        </div>
        <div className={`${styles.diagram} ${styles.diagramInteractive}`}>
          <HomunculusDiagram interactive />
          <div className={styles.painPopover}>
            <p className={styles.painPrompt}>Please specify your pain level:</p>
            <div className={styles.painOptions}>
              <div className={styles.painOption}>
                <span className={`${styles.painDot} ${styles.painDotLow}`} />
                <span className={styles.painLabel}>Low</span>
              </div>
              <div className={styles.painOption}>
                <span className={`${styles.painDot} ${styles.painDotMedium}`} />
                <span className={styles.painLabel}>Medium</span>
              </div>
              <div className={styles.painOption}>
                <span className={`${styles.painDot} ${styles.painDotHigh}`} />
                <span className={styles.painLabel}>High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
