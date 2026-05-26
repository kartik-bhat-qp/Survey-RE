'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { MatrixChartPreview } from '@/components/dashboards/MatrixChartPreview';
import type { SurveyQuestion } from '@/data/mock-survey-questions';
import {
  DEFAULT_MATRIX_CHART_TYPE_ID,
  MATRIX_CHART_TYPES,
  type MatrixChartTypeId,
} from '@/data/mock-matrix-chart-types';
import chartStyles from './AdvancedWidgetChartSelect.module.css';
import styles from './QuestionBasedChartSelect.module.css';
import matrixStyles from './QuestionBasedMatrixChartSelect.module.css';

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

interface QuestionBasedMatrixChartSelectProps {
  question: SurveyQuestion;
  widgetName: string;
  selectedChartTypeId: MatrixChartTypeId;
  onWidgetNameChange: (name: string) => void;
  onSelectChartType: (typeId: MatrixChartTypeId) => void;
}

export function QuestionBasedMatrixChartSelect({
  question,
  widgetName,
  selectedChartTypeId = DEFAULT_MATRIX_CHART_TYPE_ID,
  onWidgetNameChange,
  onSelectChartType,
}: QuestionBasedMatrixChartSelectProps) {
  const [hoveredTypeId, setHoveredTypeId] = useState<MatrixChartTypeId | null>(null);
  const displayChartTypeId = hoveredTypeId ?? selectedChartTypeId;
  const questionLabel = `${question.code} - ${question.text}`;

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
          className={`${chartStyles.chartGrid} ${matrixStyles.matrixGrid}`}
          onMouseLeave={() => setHoveredTypeId(null)}
        >
          {MATRIX_CHART_TYPES.map((chart) => {
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
          <MatrixChartPreview widgetName={widgetName} chartTypeId={displayChartTypeId} />
        </div>
      </div>
    </div>
  );
}
