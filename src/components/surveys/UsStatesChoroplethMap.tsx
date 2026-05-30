'use client';

import Image from 'next/image';
import { US_MAP_LABEL_POSITIONS } from '@/data/us-map-label-positions';
import styles from './UsStatesChoroplethMap.module.css';

const MAP_SRC = '/images/add-question-previews/us-states-map.svg';

export function UsStatesChoroplethMap() {
  return (
    <div className={styles.root} aria-hidden>
      <Image
        src={MAP_SRC}
        alt=""
        width={959}
        height={593}
        className={styles.mapImage}
        priority
      />
      <svg
        className={styles.labelLayer}
        viewBox="0 0 959 593"
        preserveAspectRatio="xMidYMid meet"
      >
        {US_MAP_LABEL_POSITIONS.map(({ code, x, y }) => (
          <text key={code} x={x} y={y} className={styles.label}>
            {code}
          </text>
        ))}
      </svg>
    </div>
  );
}
