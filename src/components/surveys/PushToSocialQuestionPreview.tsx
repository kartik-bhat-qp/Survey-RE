'use client';

import type { PushToSocialPreviewData } from '@/data/mock-add-question-previews';
import styles from './PushToSocialQuestionPreview.module.css';

const PLATFORM_BRAND_CLASS = {
  facebook: styles.platformBrandFacebook,
  x: styles.platformBrandX,
  yelp: styles.platformBrandYelp,
} as const;

interface PushToSocialQuestionPreviewProps {
  data: PushToSocialPreviewData;
}

export function PushToSocialQuestionPreview({ data }: PushToSocialQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <p className={styles.ratingSubject}>{data.ratingSubject}</p>
      <div className={styles.starRow}>
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={`wm-star-border ${styles.star}`} />
        ))}
      </div>

      <p className={styles.ruleLine}>
        Push To Social if rating is{' '}
        <span className={styles.fakeSelect}>{data.pushIfRatingAtLeast}</span> stars or greater
      </p>

      <div className={styles.fieldBlock}>
        <span className={styles.fieldLabel}>Message to Survey Takers</span>
        <div className={styles.fakeInput}>{data.shareMessagePrompt}</div>
      </div>

      <div className={styles.platformBox}>
        <ul className={styles.platformList}>
          {data.platforms.map((platform) => (
            <li key={platform.id} className={styles.platformRow}>
              <span
                className={`${styles.platformBrand} ${PLATFORM_BRAND_CLASS[platform.brand]}`}
                aria-hidden
              >
                {platform.brandLetter}
              </span>
              <span className={styles.platformToggle} aria-hidden />
              <span className={styles.platformValue}>{platform.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.fieldBlock}>
        <span className={styles.fieldLabel}>Default Sharing Message</span>
        <div className={styles.fakeInput}>{data.defaultShareMessage}</div>
      </div>

      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={data.badReviewEnabled} disabled tabIndex={-1} />
        <span>
          Bad review? Enable comment box if rating is{' '}
          <span className={styles.fakeSelect}>{data.badReviewRatingAtMost}</span> stars or lower
        </span>
      </label>

      <div className={styles.fieldBlock}>
        <span className={styles.fieldLabel}>Comment Box Title</span>
        <div className={styles.fakeInput}>{data.commentBoxTitle}</div>
      </div>
    </div>
  );
}
