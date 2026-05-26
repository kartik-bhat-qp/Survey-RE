import { PUBLIC_IMAGES } from '@/lib/public-images';

export type MatrixChartTypeId =
  | 'matrix-stackbar'
  | 'matrix-bar'
  | 'matrix-spider'
  | 'matrix-heatmap';

export interface MatrixChartType {
  id: MatrixChartTypeId;
  name: string;
  imageSrc: string;
}

export const DEFAULT_MATRIX_CHART_TYPE_ID: MatrixChartTypeId = 'matrix-stackbar';

/** Chart types for Matrix Uni choice questions (whole matrix). */
export const MATRIX_CHART_TYPES: MatrixChartType[] = [
  {
    id: 'matrix-stackbar',
    name: 'Matrix stackbar',
    imageSrc: PUBLIC_IMAGES.matrixWidgets.stackbar,
  },
  {
    id: 'matrix-bar',
    name: 'Matrix bar',
    imageSrc: PUBLIC_IMAGES.matrixWidgets.bar,
  },
  {
    id: 'matrix-spider',
    name: 'Spider',
    imageSrc: PUBLIC_IMAGES.matrixWidgets.spider,
  },
  {
    id: 'matrix-heatmap',
    name: 'Matrix heatmap',
    imageSrc: PUBLIC_IMAGES.matrixWidgets.heatmap,
  },
];
