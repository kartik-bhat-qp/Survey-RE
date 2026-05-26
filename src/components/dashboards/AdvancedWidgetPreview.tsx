'use client';

import {
  ADVANCED_WIDGET_TYPES,
  type AdvancedWidgetType,
  type AdvancedWidgetTypeId,
} from '@/data/mock-advanced-widget-types';
import styles from './AdvancedWidgetPreview.module.css';

interface AdvancedWidgetPreviewProps {
  widgetName: string;
  widgetType: AdvancedWidgetType;
  hoveredTypeId?: AdvancedWidgetTypeId | null;
}

export function AdvancedWidgetPreview({
  widgetName,
  widgetType,
  hoveredTypeId,
}: AdvancedWidgetPreviewProps) {
  const displayTypeId = hoveredTypeId ?? widgetType.id;
  const displayName =
    (hoveredTypeId
      ? ADVANCED_WIDGET_TYPES.find((t) => t.id === hoveredTypeId)?.name
      : null) ?? widgetType.name;
  const headerLabel = widgetName.trim() || 'Name';

  return (
    <div className={styles.preview}>
      <div className={styles.header}>
        <div className={styles.title}>{headerLabel}</div>
        <div className={styles.headerActions}>
          <span className="wm-lightbulb-outline" aria-hidden />
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.body}>
        {displayTypeId === 'rich-textbox' ? (
          <>
            <h3 className={styles.richTextTitle}>Hello Dashboard</h3>
            <p className={styles.richTextBody}>You can write anything over here.</p>
          </>
        ) : (
          <div className={styles.placeholder}>
            <span className={`wm-bar-chart ${styles.placeholderIcon}`} aria-hidden />
            <span>{displayName} preview</span>
          </div>
        )}
      </div>
    </div>
  );
}
