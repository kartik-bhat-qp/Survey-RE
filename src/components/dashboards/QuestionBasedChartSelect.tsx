'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { AdvancedWidgetBetaBadge } from '@/components/dashboards/AdvancedWidgetBetaBadge';
import { SingleSelectChartPreview } from '@/components/dashboards/SingleSelectChartPreview';
import type { SurveyQuestion } from '@/data/mock-survey-questions';
import {
  SINGLE_SELECT_CHART_TYPES,
  type SingleSelectChartTypeId,
} from '@/data/mock-single-select-chart-types';
import chartStyles from './AdvancedWidgetChartSelect.module.css';
import styles from './QuestionBasedChartSelect.module.css';

const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false }
);
const WuLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLabel })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
interface QuestionBasedChartSelectProps {
  question: SurveyQuestion;
  /** Matrix sub-row label when a logical row was selected in the picker. */
  matrixRowLabel?: string | null;
  widgetName: string;
  selectedChartTypeId: SingleSelectChartTypeId;
  onWidgetNameChange: (name: string) => void;
  onSelectChartType: (typeId: SingleSelectChartTypeId) => void;
}

export function QuestionBasedChartSelect({
  question,
  matrixRowLabel = null,
  widgetName,
  selectedChartTypeId,
  onWidgetNameChange,
  onSelectChartType,
}: QuestionBasedChartSelectProps) {
  const [hoveredTypeId, setHoveredTypeId] = useState<SingleSelectChartTypeId | null>(
    null
  );

  const displayChartTypeId = hoveredTypeId ?? selectedChartTypeId;
  const questionLabel = matrixRowLabel
    ? `${question.code} - ${question.text} (${matrixRowLabel})`
    : `${question.code} - ${question.text}`;

  return (
    <div className={chartStyles.root}>
      <p className={styles.questionContext}>{questionLabel}</p>

      <div className={chartStyles.nameField}>
        <WuFormGroup
          Label={<WuLabel>Name</WuLabel>}
          Input={
            <WuInput
              variant="outlined"
              placeholder={question.text}
              value={widgetName}
              maxLength={100}
              onChange={(e) => onWidgetNameChange(e.target.value)}
            />
          }
        />
      </div>

      <div className={chartStyles.chartLayout}>
        <div
          className={`${chartStyles.chartGrid} ${styles.singleSelectGrid}`}
          onMouseLeave={() => setHoveredTypeId(null)}
        >
          {SINGLE_SELECT_CHART_TYPES.map((chart) => {
            const isSelected = chart.id === selectedChartTypeId;
            return (
              <div
                key={chart.id}
                role="button"
                tabIndex={0}
                className={`${chartStyles.chartCard} ${isSelected ? chartStyles.chartCardSelected : ''}`}
                onClick={() => onSelectChartType(chart.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectChartType(chart.id);
                  }
                }}
                onMouseEnter={() => setHoveredTypeId(chart.id)}
              >
                {chart.showBetaBadge ? <AdvancedWidgetBetaBadge /> : null}
                <Image
                  src={chart.imageSrc}
                  alt={chart.name}
                  width={80}
                  height={70}
                  className={chartStyles.chartImage}
                />
                <span className={chartStyles.chartName}>{chart.name}</span>
              </div>
            );
          })}
        </div>

        <div className={chartStyles.previewColumn}>
          <SingleSelectChartPreview
            widgetName={widgetName}
            chartTypeId={displayChartTypeId}
          />
        </div>
      </div>
    </div>
  );
}
