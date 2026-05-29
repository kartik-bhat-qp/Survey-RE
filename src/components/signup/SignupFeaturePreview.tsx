import type { SignupFeatureSlide } from '@/data/mock-signup-page';
import styles from './SignupFeaturePreview.module.css';

function SurveyBuilderPreview() {
  return (
    <div className={styles.preview} aria-hidden>
      <div className={`${styles.scene} ${styles.builderScene}`}>
        <div className={styles.builderPalette}>
          <span className={styles.paletteItem} />
          <span className={`${styles.paletteItem} ${styles.paletteItemActive}`} />
          <span className={styles.paletteItem} />
        </div>

        <div className={styles.builderWorkspace}>
          <div className={styles.workspaceChrome}>
            <span className={styles.chromeDot} />
            <span className={styles.chromeDot} />
            <span className={styles.chromeDot} />
          </div>

          <div className={styles.dragGhost}>
            <span className={styles.dragGhostLabel} />
          </div>

          <svg className={styles.cursor} viewBox="0 0 16 16" fill="none">
            <path
              d="M3 2L3 12.5L6.2 9.8L8.5 14.5L10.5 13.5L8.2 8.8L12 8.5L3 2Z"
              fill="#fff"
              stroke="#0f172a"
              strokeWidth="1"
            />
          </svg>

          <div className={styles.questionBlock}>
            <span className={styles.questionText}>How would you rate your experience?</span>
            <div className={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={styles.ratingStar} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <div className={styles.preview} aria-hidden>
      <div className={`${styles.scene} ${styles.analyticsScene}`}>
        <div className={styles.donutPanel}>
          <span className={styles.panelLabel}>Sentiment</span>
          <div className={styles.donutWrap}>
            <svg className={styles.donutSvg} viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#2196f3"
                strokeWidth="4"
                strokeDasharray="62 88"
                strokeLinecap="round"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="4"
                strokeDasharray="28 122"
                strokeDashoffset="-62"
                strokeLinecap="round"
              />
            </svg>
            <span className={styles.donutCenter}>84%</span>
          </div>
        </div>

        <div className={styles.chartPanel}>
          <span className={styles.panelLabel}>Responses</span>
          <span className={styles.metricBadge}>+12% this week</span>
          <div className={styles.bars}>
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className={styles.bar} />
            ))}
          </div>
          <svg className={styles.sparkSvg} viewBox="0 0 120 24" preserveAspectRatio="none">
            <path className={styles.sparkPath} d="M0 18 L24 14 L48 16 L72 8 L96 10 L120 4" />
          </svg>
          <p className={styles.insightCard}>
            Positive sentiment rose after the product update — NPS comments mention faster checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

function DistributionPreview() {
  return (
    <div className={styles.preview} aria-hidden>
      <div className={`${styles.scene} ${styles.distributionScene}`}>
        <svg className={styles.distributionSvg} viewBox="0 0 280 176" preserveAspectRatio="xMidYMid meet">
          <path className={styles.flowLine} d="M 140 88 L 52 36" />
          <path className={styles.flowLine} d="M 140 88 L 228 36" />
          <path className={styles.flowLine} d="M 140 88 L 52 140" />
          <path className={styles.flowLine} d="M 140 88 L 228 140" />
        </svg>

        <span className={`${styles.flyingDot} ${styles.flyingDot1}`} />
        <span className={`${styles.flyingDot} ${styles.flyingDot2}`} />
        <span className={`${styles.flyingDot} ${styles.flyingDot3}`} />
        <span className={`${styles.flyingDot} ${styles.flyingDot4}`} />

        <div className={`${styles.channelCard} ${styles.channelEmail}`}>
          <span className={`wm-email ${styles.channelIcon}`} />
          <span className={styles.channelLabel}>Email</span>
          <span className={`wm-check ${styles.channelCheck}`} />
        </div>
        <div className={`${styles.channelCard} ${styles.channelLink}`}>
          <span className={`wm-link ${styles.channelIcon}`} />
          <span className={styles.channelLabel}>Link</span>
          <span className={`wm-check ${styles.channelCheck}`} />
        </div>
        <div className={`${styles.channelCard} ${styles.channelEmbed}`}>
          <span className={`wm-code ${styles.channelIcon}`} />
          <span className={styles.channelLabel}>Embed</span>
          <span className={`wm-check ${styles.channelCheck}`} />
        </div>
        <div className={`${styles.channelCard} ${styles.channelPanel}`}>
          <span className={`wm-group ${styles.channelIcon}`} />
          <span className={styles.channelLabel}>Panel</span>
          <span className={`wm-check ${styles.channelCheck}`} />
        </div>

        <div className={styles.surveyHub}>
          <span className={styles.hubTitle} />
          <span className={styles.hubLine} />
          <span className={`${styles.hubLine} ${styles.hubLineShort}`} />
        </div>
      </div>
    </div>
  );
}

function PrismAiPreview() {
  return (
    <div className={styles.preview} aria-hidden>
      <div className={`${styles.scene} ${styles.prismScene}`}>
        <div className={styles.prismPromptCard}>
          <span className={`wc-ai ${styles.prismPromptIcon}`} />
          <div className={styles.prismPromptLines}>
            <span className={styles.prismPromptLine} />
            <span className={`${styles.prismPromptLine} ${styles.prismPromptLineShort}`} />
          </div>
        </div>

        <div className={styles.prismConnector}>
          <span className={styles.prismConnectorDot} />
          <span className={styles.prismConnectorLine} />
          <span className={styles.prismConnectorDot} />
        </div>

        <div className={styles.prismOutputStack}>
          <div className={styles.prismQuestionStub}>
            <span className={styles.prismStubLabel} />
            <span className={styles.prismStubOption} />
            <span className={styles.prismStubOption} />
          </div>
          <div className={`${styles.prismQuestionStub} ${styles.prismQuestionStubDelayed}`}>
            <span className={styles.prismStubLabel} />
            <span className={styles.prismStubScale} />
          </div>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_BY_SLIDE: Record<SignupFeatureSlide['id'], () => React.ReactNode> = {
  'prism-ai': PrismAiPreview,
  surveys: SurveyBuilderPreview,
  insights: AnalyticsPreview,
  distribution: DistributionPreview,
};

export function SignupFeaturePreview({ slide }: { slide: SignupFeatureSlide }) {
  const Preview = PREVIEW_BY_SLIDE[slide.id];
  return Preview ? <Preview /> : null;
}
