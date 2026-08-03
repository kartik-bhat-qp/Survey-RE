'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type {
  TextAiSummaryType,
  TextAiSummaryVariant,
  TextAiSummaryWidget,
} from '@/data/mock-text-ai-summary-widget';
import { TextAiWidgetMenu } from '@/components/text-ai/TextAiWidgetMenu';
import styles from './TextAiSummaryWidget.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuSelect })),
  { ssr: false }
);

interface TextAiSummaryWidgetCardProps {
  widget: TextAiSummaryWidget;
  onDelete?: () => void;
}

export function TextAiSummaryWidgetCard({
  widget,
  onDelete,
}: TextAiSummaryWidgetCardProps) {
  const reportBodyRef = useRef<HTMLDivElement>(null);
  const defaultSummaryType =
    widget.summaryTypes.find((summaryType) => summaryType.isDefault) ?? widget.summaryTypes[0];
  const [selectedSummaryType, setSelectedSummaryType] = useState<TextAiSummaryType>(
    defaultSummaryType.id
  );
  const activeSummary =
    widget.summaryTypes.find((summaryType) => summaryType.id === selectedSummaryType) ??
    defaultSummaryType;
  function handleSummaryTypeChange(nextSummaryType: TextAiSummaryType): void {
    setSelectedSummaryType(nextSummaryType);
    reportBodyRef.current?.scrollTo({ top: 0 });
  }

  return (
    <article className={styles.card}>
      <header className={`${styles.cardHeader} text-ai-widget-drag-handle`}>
        <div className={styles.cardHeaderMain}>
          <h2 className={styles.cardTitle}>{widget.question}</h2>
          <div className={styles.summaryTypeControl}>
            <WuSelect
              data={widget.summaryTypes}
              accessorKey={{ value: 'id', label: 'label' }}
              value={activeSummary}
              onSelect={(option) => {
                if (!option || Array.isArray(option)) return;
                handleSummaryTypeChange((option as TextAiSummaryVariant).id);
              }}
              variant="outlined"
              className={styles.summaryTypeSelect}
              aria-label="Summary type"
            />
          </div>
        </div>
        <TextAiWidgetMenu widgetTitle={widget.question} onDelete={onDelete} />
      </header>

      <div
        ref={reportBodyRef}
        className={styles.reportBody}
        role="region"
        aria-label={`${widget.question} ${activeSummary.label} report`}
        aria-live="polite"
        tabIndex={0}
      >
        {activeSummary.sections.map((section) => (
          <section className={styles.section} key={section.heading}>
            <h3 className={styles.sectionTitle}>{section.heading}</h3>
            {section.paragraphs.map((paragraph, index) => (
              <p
                className={paragraph === 'Standout topics:' ? styles.listLabel : undefined}
                key={`${section.heading}-paragraph-${index}`}
              >
                {paragraph}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {section.trailingParagraphs?.map((paragraph, index) => (
              <p key={`${section.heading}-trailing-paragraph-${index}`}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
