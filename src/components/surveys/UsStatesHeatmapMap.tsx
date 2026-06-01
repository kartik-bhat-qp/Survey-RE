'use client';

import Image from 'next/image';
import styles from './UsStatesHeatmapMap.module.css';

const MAP_SRC = '/images/add-question-previews/us-states-heatmap.svg';

export function UsStatesHeatmapMap() {
  return (
    <div className={styles.root} aria-hidden>
      <Image
        src={MAP_SRC}
        alt=""
        width={959}
        height={593}
        className={styles.mapImage}
        unoptimized
      />
    </div>
  );
}
