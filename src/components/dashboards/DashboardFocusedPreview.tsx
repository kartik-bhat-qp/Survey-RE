'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AI_DASHBOARD_WIDGETS,
  type AiWidgetConfig,
} from '@/data/mock-ai-widgets';
import {
  DEFAULT_DESIGN_TYPOGRAPHY,
  getDashboardTypographyCssVars,
  type DesignTypographyOptions,
} from '@/components/dashboards/DashboardDesignSettingsTab';
import { AiWidgetRenderer } from '@/components/dashboards/widgets/AiWidgetRenderer';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import styles from './DashboardFocusedPreview.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const CHART_BODY_FONT_SIZE_BY_DESIGN_SIZE: Record<string, number> = {
  'extra-small': 11,
  small: 13,
  medium: 15,
  large: 18,
  'extra-large': 21,
};

interface DashboardFocusedPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designTypography?: DesignTypographyOptions;
}

function shouldShowDiamond(widget: AiWidgetConfig) {
  return (
    widget.id === 'w-nps-benchmark' ||
    widget.id === 'w-mean' ||
    widget.id === 'w-comparative-bar' ||
    widget.id === 'w-segment-trend'
  );
}

export function DashboardFocusedPreview({
  open,
  onOpenChange,
  designTypography = DEFAULT_DESIGN_TYPOGRAPHY,
}: DashboardFocusedPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeWidget = AI_DASHBOARD_WIDGETS[activeIndex];

  const typographyStyle = useMemo(
    () => getDashboardTypographyCssVars(designTypography),
    [designTypography]
  );
  const chartTypography = useMemo<AmChartTypography>(
    () => ({
      fontFamily: designTypography.fontFamily.value,
      fontSize:
        CHART_BODY_FONT_SIZE_BY_DESIGN_SIZE[designTypography.fontSize.value] ?? 13,
      fontStyle: designTypography.fontStyle.value === 'italic' ? 'italic' : 'normal',
      fontWeight: designTypography.fontStyle.value === 'bold' ? '600' : '400',
    }),
    [designTypography]
  );

  const closePreview = useCallback(() => onOpenChange(false), [onOpenChange]);
  const goToPreviousWidget = useCallback(() => {
    setActiveIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }, []);
  const goToNextWidget = useCallback(() => {
    setActiveIndex((currentIndex) =>
      Math.min(AI_DASHBOARD_WIDGETS.length - 1, currentIndex + 1)
    );
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePreview();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousWidget();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextWidget();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closePreview, goToNextWidget, goToPreviousWidget, open]);

  useEffect(() => {
    if (!open) return;
    const resizeFrame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    return () => window.cancelAnimationFrame(resizeFrame);
  }, [activeIndex, open]);

  if (!open || !activeWidget) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${activeWidget.title} focused preview`}
      className={styles.overlay}
      style={typographyStyle}
    >
      <section className={styles.previewShell}>
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <h2 className={styles.title}>{activeWidget.title}</h2>
            <span className={styles.counter}>
              {activeIndex + 1} of {AI_DASHBOARD_WIDGETS.length}
            </span>
          </div>
          <div className={styles.headerActions}>
            <span className="wm-lightbulb text-[22px] text-[#536277]" aria-hidden="true" />
            {shouldShowDiamond(activeWidget) && (
              <span className="wm-diamond text-[20px] text-[#1b87e6]" aria-hidden="true" />
            )}
            <WuButton
              type="button"
              variant="iconOnly"
              aria-label="Close focused preview"
              onClick={closePreview}
              className={styles.closeButton}
            >
              <span className="wm-close text-[26px]" aria-hidden="true" />
            </WuButton>
          </div>
        </header>

        <div className={styles.widgetBody}>
          <AiWidgetRenderer
            widgetId={activeWidget.id}
            chartInstanceId={`${activeWidget.id}-focused-preview`}
            type={activeWidget.type}
            typography={chartTypography}
          />
        </div>
      </section>

      <WuButton
        type="button"
        variant="iconOnly"
        aria-label="Previous widget"
        disabled={activeIndex === 0}
        onClick={goToPreviousWidget}
        className={`${styles.navButton} ${styles.navButtonLeft}`}
      >
        <span className="wm-keyboard-arrow-left" aria-hidden="true" />
      </WuButton>

      <WuButton
        type="button"
        variant="iconOnly"
        aria-label="Next widget"
        disabled={activeIndex === AI_DASHBOARD_WIDGETS.length - 1}
        onClick={goToNextWidget}
        className={`${styles.navButton} ${styles.navButtonRight}`}
      >
        <span className="wm-keyboard-arrow-right" aria-hidden="true" />
      </WuButton>
    </div>
  );
}
