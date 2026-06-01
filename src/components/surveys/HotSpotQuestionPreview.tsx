'use client';

import Image from 'next/image';
import styles from './HotSpotQuestionPreview.module.css';

const CAR_IMAGE_SRC = '/images/add-question-previews/hotspot-car.svg';

export function HotSpotQuestionPreview() {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.scene}>
        <Image
          src={CAR_IMAGE_SRC}
          alt=""
          width={320}
          height={200}
          className={styles.carImage}
          priority
        />
        <span className={`${styles.region} ${styles.regionDislike}`}>
          <span className={`wm-thumb-down ${styles.regionIcon}`} />
        </span>
        <span className={`${styles.region} ${styles.regionLike}`}>
          <span className={`wm-thumb-up ${styles.regionIcon}`} />
        </span>
      </div>
    </div>
  );
}
