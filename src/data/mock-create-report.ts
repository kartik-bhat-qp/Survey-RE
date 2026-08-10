import { publicImage } from '@/lib/public-images';

export type CreateReportTypeId =
  | 'crosstab'
  | 'weighted-tabulation'
  | 'heatmaps'
  | 'gabor-granger'
  | 'van-westendorp'
  | 'conjoint'
  | 'maxdiff'
  | 'turf'
  | 'ranking'
  | 'regression'
  | 'key-driver'
  | 'segmentation'
  | 'nps'
  | 'text-analytics';

export type CreateReportCategory =
  | 'Tabulation'
  | 'Pricing'
  | 'Preference & trade-off'
  | 'Statistical'
  | 'Experience';

export interface CreateReportTypeOption {
  id: CreateReportTypeId;
  title: string;
  category: CreateReportCategory;
  description: string;
  iconSrc: string;
  /** Everything a researcher must have in the survey before the report can run. */
  needs: string[];
  comingSoon?: boolean;
  showHelp?: boolean;
  helpMessage?: string;
}

export const CREATE_REPORT_CATEGORIES: CreateReportCategory[] = [
  'Tabulation',
  'Pricing',
  'Preference & trade-off',
  'Statistical',
  'Experience',
];

export const CREATE_REPORT_TYPE_OPTIONS: CreateReportTypeOption[] = [
  {
    id: 'crosstab',
    title: 'Crosstab',
    category: 'Tabulation',
    description:
      'A Crosstab report displays the relationship between two or more variables by summarizing data in a matrix format using rows and columns.',
    iconSrc: publicImage('create-report', 'crosstab.svg'),
    needs: [
      'One or more banner (column) variables',
      'At least one stub (row) question',
      'Optional weighting scheme for the dataset',
    ],
    showHelp: true,
    helpMessage:
      'Use Crosstab to compare how responses break down across questions, segments, or custom variables.',
  },
  {
    id: 'weighted-tabulation',
    title: 'Weighted Tabulation',
    category: 'Tabulation',
    description:
      'Applies a saved weighting scheme to any tabulation so results reflect the target population rather than the raw sample.',
    iconSrc: publicImage('create-report', 'weighted-tabulation.svg'),
    needs: [
      'A published weighting scheme',
      'A dataset with the weighting variables',
      'Base definition for each table',
    ],
  },
  {
    id: 'heatmaps',
    title: 'Heatmaps',
    category: 'Tabulation',
    description:
      'A Heatmaps report visualizes response intensity across questions or segments so patterns and hotspots are easy to spot.',
    iconSrc: publicImage('create-report', 'heatmaps.svg'),
    needs: [
      'A matrix or grid question',
      'A segment variable for columns',
      'A colour scale threshold',
    ],
    comingSoon: true,
  },
  {
    id: 'gabor-granger',
    title: 'Gabor Granger',
    category: 'Pricing',
    description:
      'A Gabor Granger report estimates price sensitivity by asking respondents how likely they are to purchase at different price points.',
    iconSrc: publicImage('create-report', 'gabor-granger.svg'),
    needs: [
      'A price ladder question block',
      'Purchase intent scale',
      'Currency and price range',
    ],
    comingSoon: true,
  },
  {
    id: 'van-westendorp',
    title: 'Van Westendorp',
    category: 'Pricing',
    description:
      'A Van Westendorp report maps acceptable price ranges by capturing perceptions of cheap, expensive, and too expensive pricing.',
    iconSrc: publicImage('create-report', 'van-westendorp.svg'),
    needs: [
      'Four price perception questions',
      'Numeric open-ended responses',
      'Currency formatting',
    ],
    comingSoon: true,
  },
  {
    id: 'conjoint',
    title: 'Conjoint',
    category: 'Preference & trade-off',
    description:
      'A Conjoint report analyzes customer preferences by measuring how they value different features of a product or service through trade-off evaluations.',
    iconSrc: publicImage('create-report', 'conjoint.svg'),
    needs: [
      'A conjoint design with attributes and levels',
      'Completed choice tasks',
      'Utility estimation settings',
    ],
  },
  {
    id: 'maxdiff',
    title: 'MaxDiff',
    category: 'Preference & trade-off',
    description:
      'A MaxDiff report identifies the most and least preferred items by forcing respondents to make trade-offs across a set of options.',
    iconSrc: publicImage('create-report', 'maxdiff.svg'),
    needs: [
      'A MaxDiff exercise with item list',
      'Best and worst selections per set',
      'Minimum of 300 completes recommended',
    ],
    comingSoon: true,
  },
  {
    id: 'turf',
    title: 'TURF',
    category: 'Preference & trade-off',
    description:
      'A TURF report finds the combination of items that reaches the largest unduplicated audience, so you can size a portfolio or shortlist.',
    iconSrc: publicImage('create-report', 'turf.svg'),
    needs: [
      'A multi-select or MaxDiff item list',
      'Reach definition (top box, any selection)',
      'Maximum combination size',
    ],
    comingSoon: true,
  },
  {
    id: 'ranking',
    title: 'Ranking',
    category: 'Preference & trade-off',
    description:
      'A Ranking report summarizes ordered preferences, showing mean rank and top-position share across every item in the list.',
    iconSrc: publicImage('create-report', 'ranking.svg'),
    needs: [
      'A rank-order question',
      'Consistent item list across waves',
      'Optional segment breaks',
    ],
  },
  {
    id: 'regression',
    title: 'Regression',
    category: 'Statistical',
    description:
      'A Regression report models how strongly each independent variable predicts an outcome, with coefficients and significance tests.',
    iconSrc: publicImage('create-report', 'regression.svg'),
    needs: [
      'One numeric dependent variable',
      'Two or more predictor variables',
      'Clean, complete cases',
    ],
    comingSoon: true,
  },
  {
    id: 'key-driver',
    title: 'Key Driver',
    category: 'Statistical',
    description:
      'A Key Driver report ranks which attributes move an outcome metric the most, pairing derived importance with stated performance.',
    iconSrc: publicImage('create-report', 'key-driver.svg'),
    needs: [
      'An outcome metric such as NPS or satisfaction',
      'A battery of attribute ratings',
      'A performance threshold',
    ],
    comingSoon: true,
  },
  {
    id: 'segmentation',
    title: 'Segmentation',
    category: 'Statistical',
    description:
      'A Segmentation report clusters respondents into groups with similar attitudes or behaviours and profiles each group against the rest.',
    iconSrc: publicImage('create-report', 'segmentation.svg'),
    needs: [
      'A basis set of attitudinal variables',
      'Preferred cluster count or auto-solve',
      'Profiling variables for the tables',
    ],
    comingSoon: true,
  },
  {
    id: 'nps',
    title: 'NPS',
    category: 'Experience',
    description:
      'An NPS report tracks promoters, passives, and detractors over time and breaks the score down by any segment in the dataset.',
    iconSrc: publicImage('create-report', 'nps.svg'),
    needs: [
      'An 0–10 likelihood-to-recommend question',
      'A date variable for trending',
      'Optional segment breaks',
    ],
  },
  {
    id: 'text-analytics',
    title: 'Text Analytics',
    category: 'Experience',
    description:
      'A Text Analytics report extracts themes and sentiment from open-ended responses and links each theme back to the verbatims.',
    iconSrc: publicImage('create-report', 'text-analytics.svg'),
    needs: [
      'At least one open-ended question',
      '200+ verbatims for reliable themes',
      'A language selection',
    ],
    comingSoon: true,
  },
];

export function getCreateReportTypeOption(
  typeId: CreateReportTypeId | undefined
): CreateReportTypeOption {
  return (
    CREATE_REPORT_TYPE_OPTIONS.find((option) => option.id === typeId) ??
    CREATE_REPORT_TYPE_OPTIONS[0]
  );
}

export function getDefaultCreateReportName(existingCount: number): string {
  return `Report ${existingCount + 1}`;
}
