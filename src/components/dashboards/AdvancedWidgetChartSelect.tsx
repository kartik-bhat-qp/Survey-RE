'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { AdvancedWidgetBetaBadge } from '@/components/dashboards/AdvancedWidgetBetaBadge';
import { AdvancedWidgetPreview } from '@/components/dashboards/AdvancedWidgetPreview';
import {
  ADVANCED_WIDGET_TYPES,
  DEFAULT_ADVANCED_WIDGET_TYPE_ID,
  type AdvancedWidgetType,
  type AdvancedWidgetTypeId,
} from '@/data/mock-advanced-widget-types';
import styles from './AdvancedWidgetChartSelect.module.css';

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
interface AdvancedWidgetChartSelectProps {
  widgetName: string;
  selectedTypeId: AdvancedWidgetTypeId;
  onWidgetNameChange: (name: string) => void;
  onSelectType: (typeId: AdvancedWidgetTypeId) => void;
}

export function AdvancedWidgetChartSelect({
  widgetName,
  selectedTypeId,
  onWidgetNameChange,
  onSelectType,
}: AdvancedWidgetChartSelectProps) {
  const [hoveredTypeId, setHoveredTypeId] = useState<AdvancedWidgetTypeId | null>(null);

  const selectedType = useMemo(
    () =>
      ADVANCED_WIDGET_TYPES.find((t) => t.id === selectedTypeId) ??
      ADVANCED_WIDGET_TYPES.find((t) => t.id === DEFAULT_ADVANCED_WIDGET_TYPE_ID)!,
    [selectedTypeId]
  );

  const hoveredType = useMemo((): AdvancedWidgetType | null => {
    if (!hoveredTypeId) return null;
    return ADVANCED_WIDGET_TYPES.find((t) => t.id === hoveredTypeId) ?? null;
  }, [hoveredTypeId]);

  return (
    <div className={styles.root}>
      <div className={styles.nameField}>
        <WuFormGroup
          Label={<WuLabel>Name</WuLabel>}
          Input={
            <WuInput
              variant="outlined"
              placeholder="Please enter widget name"
              value={widgetName}
              maxLength={100}
              autoFocus
              onChange={(e) => onWidgetNameChange(e.target.value)}
            />
          }
        />
      </div>

      <div className={styles.chartLayout}>
        <div
          className={styles.chartGrid}
          onMouseLeave={() => setHoveredTypeId(null)}
        >
          {ADVANCED_WIDGET_TYPES.map((chart) => {
            const isSelected = chart.id === selectedTypeId;
            const isHovered = chart.id === hoveredTypeId;
            return (
              <div
                key={chart.id}
                role="button"
                tabIndex={0}
                className={`${styles.chartCard} ${isSelected || isHovered ? styles.chartCardSelected : ''}`}
                onClick={() => onSelectType(chart.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectType(chart.id);
                  }
                }}
                onMouseEnter={() => setHoveredTypeId(chart.id)}
              >
                {chart.showBetaBadge && <AdvancedWidgetBetaBadge />}
                <Image
                  src={chart.imageSrc}
                  alt={chart.name}
                  width={80}
                  height={70}
                  className={styles.chartImage}
                />
                <span className={styles.chartName}>{chart.name}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.previewColumn}>
          <AdvancedWidgetPreview
            widgetName={widgetName}
            widgetType={hoveredType ?? selectedType}
            hoveredTypeId={hoveredTypeId}
          />
        </div>
      </div>
    </div>
  );
}
