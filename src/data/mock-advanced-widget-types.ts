import { PUBLIC_IMAGES } from '@/lib/public-images';

export type AdvancedWidgetTypeId =
  | 'rich-textbox'
  | 'map'
  | 'response-timeline'
  | 'response-info'
  | 'comparative-bar'
  | 'heat-map'
  | 'cross-tab'
  | 'segment-trend'
  | 'segment-bar'
  | 'funnel-chart'
  | 'response-viewer';

export interface AdvancedWidgetType {
  id: AdvancedWidgetTypeId;
  name: string;
  imageSrc: string;
  showBetaBadge?: boolean;
  showDiamond?: boolean;
}

export const LICENSE_DIAMOND_TOOLTIP =
  'Not available with your current license. Will only show a maximum of 100 responses.';

const IMG = PUBLIC_IMAGES.advancedWidgets;

export const ADVANCED_WIDGET_TYPES: AdvancedWidgetType[] = [
  {
    id: 'rich-textbox',
    name: 'Rich textbox',
    imageSrc: IMG.textBox,
  },
  {
    id: 'map',
    name: 'Map',
    imageSrc: IMG.mapChart,
  },
  {
    id: 'response-timeline',
    name: 'Response timeline',
    imageSrc: IMG.responseTimeline,
  },
  {
    id: 'response-info',
    name: 'Response info',
    imageSrc: IMG.responseInfo,
  },
  {
    id: 'comparative-bar',
    name: 'Comparative bar',
    imageSrc: IMG.comparativeBar,
    showDiamond: true,
  },
  {
    id: 'heat-map',
    name: 'Heat map',
    imageSrc: IMG.heatMap,
    showDiamond: true,
  },
  {
    id: 'cross-tab',
    name: 'Cross-tab',
    imageSrc: IMG.crossTab,
  },
  {
    id: 'segment-trend',
    name: 'Segment trend',
    imageSrc: IMG.segmentTrendLine,
    showDiamond: true,
  },
  {
    id: 'segment-bar',
    name: 'Segment bar',
    imageSrc: IMG.barChart,
    showDiamond: true,
  },
  {
    id: 'funnel-chart',
    name: 'Funnel chart',
    imageSrc: IMG.funnel,
    showDiamond: true,
  },
  {
    id: 'response-viewer',
    name: 'Response viewer',
    imageSrc: IMG.responseViewer,
    showBetaBadge: true,
  },
];

export const DEFAULT_ADVANCED_WIDGET_TYPE_ID: AdvancedWidgetTypeId = 'rich-textbox';
