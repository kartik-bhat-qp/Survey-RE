'use client';

import Image from 'next/image';
import type { VideoAiPreviewData } from '@/data/mock-add-question-previews';
import styles from './VideoAiQuestionPreview.module.css';

interface VideoAiQuestionPreviewProps {
  data: VideoAiPreviewData;
}

export function VideoAiQuestionPreview({ data }: VideoAiQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.videoFrame}>
        <Image
          src={data.previewImageSrc}
          alt=""
          width={640}
          height={480}
          className={styles.previewImage}
          unoptimized
        />
        <div className={styles.recordControl}>
          <span className={styles.recordStop} />
        </div>
      </div>
    </div>
  );
}
