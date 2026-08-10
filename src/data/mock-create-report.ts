import { publicImage } from '@/lib/public-images';

export type CreateReportTypeId =
  | 'crosstab'
  | 'conjoint'
  | 'maxdiff'
  | 'gabor-granger'
  | 'van-westendorp'
  | 'heatmaps';

export interface CreateReportTypeOption {
  id: CreateReportTypeId;
  title: string;
  description: string;
  iconSrc: string;
  comingSoon?: boolean;
  showHelp?: boolean;
  helpMessage?: string;
}

export const CREATE_REPORT_TYPE_OPTIONS: CreateReportTypeOption[] = [
  {
    id: 'crosstab',
    title: 'Crosstab',
    description:
      'A Crosstab report displays the relationship between two or more variables by summarizing data in a matrix format using rows and columns.',
    iconSrc: publicImage('create-report', 'crosstab.svg'),
    showHelp: true,
    helpMessage:
      'Use Crosstab to compare how responses break down across questions, segments, or custom variables.',
  },
  {
    id: 'conjoint',
    title: 'Conjoint',
    description:
      'A Conjoint report analyzes customer preferences by measuring how they value different features of a product or service through trade-off evaluations.',
    iconSrc: publicImage('create-report', 'conjoint.svg'),
  },
  {
    id: 'maxdiff',
    title: 'MaxDiff',
    description:
      'A MaxDiff report identifies the most and least preferred items by forcing respondents to make trade-offs across a set of options.',
    iconSrc: publicImage('create-report', 'maxdiff.svg'),
    comingSoon: true,
  },
  {
    id: 'gabor-granger',
    title: 'Gabor Granger',
    description:
      'A Gabor Granger report estimates price sensitivity by asking respondents how likely they are to purchase at different price points.',
    iconSrc: publicImage('create-report', 'gabor-granger.svg'),
    comingSoon: true,
  },
  {
    id: 'van-westendorp',
    title: 'Van Westendorp',
    description:
      'A Van Westendorp report maps acceptable price ranges by capturing perceptions of cheap, expensive, and too expensive pricing.',
    iconSrc: publicImage('create-report', 'van-westendorp.svg'),
    comingSoon: true,
  },
  {
    id: 'heatmaps',
    title: 'Heatmaps',
    description:
      'A Heatmaps report visualizes response intensity across questions or segments so patterns and hotspots are easy to spot.',
    iconSrc: publicImage('create-report', 'heatmaps.svg'),
    comingSoon: true,
  },
];

export function getDefaultCreateReportName(existingCount: number): string {
  return `Report ${existingCount + 1}`;
}
