export type PathSimulatorNodeKind =
  | 'question'
  | 'terminated'
  | 'completed'
  | 'unreachable';

export type PathSimulatorNodeStatus =
  | 'selected'
  | 'next'
  | 'completed'
  | 'off-path'
  | 'terminated'
  | 'unreachable'
  | 'on-path'
  | 'alt-route';

export type PathSimulatorRouteOutcome = 'completed' | 'terminated';

export type PathSimulatorRouteFilter =
  | 'completed'
  | 'terminated'
  | 'all'
  | 'unreachable';

export interface PathSimulatorNode {
  id: string;
  label: string;
  kind: PathSimulatorNodeKind;
  /** Optional question code shown in the starting-question dropdown. */
  code?: string;
  /** Truncated question text for dropdown / tooltips. */
  text?: string;
  x: number;
  y: number;
  /** Number of outbound branches from this node. */
  branchCount: number;
}

export interface PathSimulatorEdge {
  id: string;
  from: string;
  to: string;
  /** Midpoint control offset for curved paths (SVG). */
  curve?: number;
  hasBranchLogic?: boolean;
  /** Extra visual-only edge used when comparing all routes. */
  compareOnly?: boolean;
}

export interface PathSimulatorRoute {
  id: string;
  /** Display name, e.g. Path 1. */
  name: string;
  /** Question/end labels shown in the sidebar card sequence. */
  steps: string[];
  nodeIds: string[];
  outcome: PathSimulatorRouteOutcome;
  isMain?: boolean;
}

/** A question adjacent to an unreachable question in survey order. */
export interface PathSimulatorNeighborQuestion {
  code: string;
  text: string;
  /** True when this neighbour is itself unreachable. */
  unreachable?: boolean;
}

export interface PathSimulatorUnreachableQuestion {
  /** Graph node id, so selecting a card can highlight the node. */
  id: string;
  code: string;
  text: string;
  previousQuestion: PathSimulatorNeighborQuestion | null;
  nextQuestion: PathSimulatorNeighborQuestion | null;
}

export interface PathSimulatorGraph {
  branchPointCount: number;
  nodes: PathSimulatorNode[];
  edges: PathSimulatorEdge[];
  /** Default starting question node id. */
  defaultStartId: string;
  routes: PathSimulatorRoute[];
  unreachableQuestions: PathSimulatorUnreachableQuestion[];
  routeCounts: {
    completed: number;
    terminated: number;
    all: number;
  };
}

export const PATH_SIMULATOR_LEGEND = [
  { id: 'selected', label: 'On the selected question', swatch: 'selected' as const },
  { id: 'next', label: 'Next possible branch', swatch: 'next' as const },
  { id: 'off-path', label: 'Not on this path', swatch: 'off-path' as const },
  { id: 'completed', label: 'Completed', swatch: 'completed' as const },
  { id: 'terminated', label: 'Terminated', swatch: 'terminated' as const },
  { id: 'unreachable', label: 'Unreachable question', swatch: 'unreachable' as const },
  { id: 'branch', label: 'Branching logic - click to view', swatch: 'branch' as const },
  {
    id: 'branch-selected',
    label: 'Branching logic on the selected path',
    swatch: 'branch-selected' as const,
  },
  { id: 'info', label: 'Question information', swatch: 'info' as const },
] as const;

export const PATH_SIMULATOR_COMPARE_LEGEND = [
  { id: 'on-path', label: 'On the selected path', swatch: 'on-path' as const },
  { id: 'alt-route', label: 'Alternative route', swatch: 'alt-route' as const },
  { id: 'completed', label: 'Completed', swatch: 'completed' as const },
  { id: 'terminated', label: 'Terminated', swatch: 'terminated' as const },
  { id: 'unreachable', label: 'Unreachable question', swatch: 'unreachable' as const },
  { id: 'branch', label: 'Branching logic - click to view', swatch: 'branch' as const },
  {
    id: 'branch-selected',
    label: 'Branching logic on the selected path',
    swatch: 'branch-selected' as const,
  },
  { id: 'info', label: 'Question information', swatch: 'info' as const },
] as const;

export type PathSimulatorLegendSwatch =
  | (typeof PATH_SIMULATOR_LEGEND)[number]['swatch']
  | (typeof PATH_SIMULATOR_COMPARE_LEGEND)[number]['swatch'];

export const PATH_SIMULATOR_COMPARE_HINT = 'Select a path to highlight it';

export const PATH_SIMULATOR_UNREACHABLE_HINT =
  'No path reaches these questions. Select one to highlight it.';

/** Canonical demo graph matching the Path Simulator screenshot layout. */
export const PATH_SIMULATOR_GRAPH: PathSimulatorGraph = {
  branchPointCount: 41,
  defaultStartId: 'q1',
  routeCounts: {
    completed: 67,
    terminated: 64,
    all: 131,
  },
  nodes: [
    {
      id: 'q1',
      code: 'Q1',
      label: 'Q1',
      text: 'Hello, my name is William with Las Vegas Field and Focus. We have an upcoming product test for women...',
      kind: 'question',
      x: 420,
      y: 48,
      branchCount: 2,
    },
    {
      id: 'terminated',
      label: 'Terminated',
      kind: 'terminated',
      x: 280,
      y: 168,
      branchCount: 0,
    },
    {
      id: 'q2',
      code: 'Q2',
      label: 'Q2',
      text: 'Which of the following best describes your current product usage?',
      kind: 'question',
      x: 520,
      y: 168,
      branchCount: 2,
    },
    {
      id: 'q3',
      code: 'Q3',
      label: 'Q3',
      text: 'How often do you purchase this category?',
      kind: 'question',
      x: 420,
      y: 280,
      branchCount: 2,
    },
    {
      id: 'q4',
      code: 'Q4',
      label: 'Q4',
      text: 'What is your primary reason for choosing this brand?',
      kind: 'question',
      x: 620,
      y: 280,
      branchCount: 1,
    },
    {
      id: 'q5',
      code: 'Q5',
      label: 'Q5',
      text: 'Please rate your overall satisfaction.',
      kind: 'question',
      x: 340,
      y: 400,
      branchCount: 2,
    },
    {
      id: 'q6',
      code: 'Q6',
      label: 'Q6',
      text: 'Would you recommend this product to a friend?',
      kind: 'question',
      x: 520,
      y: 400,
      branchCount: 2,
    },
    {
      id: 'q7',
      code: 'Q7',
      label: 'Q7',
      text: 'Which features matter most to you?',
      kind: 'question',
      x: 700,
      y: 400,
      branchCount: 1,
    },
    {
      id: 'q8',
      code: 'Q8',
      label: 'Q8',
      text: 'How likely are you to repurchase?',
      kind: 'question',
      x: 280,
      y: 520,
      branchCount: 1,
    },
    {
      id: 'q9',
      code: 'Q9',
      label: 'Q9',
      text: 'What price range feels fair for this product?',
      kind: 'question',
      x: 440,
      y: 520,
      branchCount: 2,
    },
    {
      id: 'q10',
      code: 'Q10',
      label: 'Q10',
      text: 'Have you seen advertising for this brand recently?',
      kind: 'question',
      x: 600,
      y: 520,
      branchCount: 1,
    },
    {
      id: 'q11',
      code: 'Q11',
      label: 'Q11',
      text: 'Which retailers do you typically shop?',
      kind: 'question',
      x: 760,
      y: 520,
      branchCount: 1,
    },
    {
      id: 'q12',
      code: 'Q12',
      label: 'Q12',
      text: 'Any additional comments about your experience?',
      kind: 'question',
      x: 360,
      y: 640,
      branchCount: 1,
    },
    {
      id: 'q13',
      code: 'Q13',
      label: 'Q13',
      text: 'Would you participate in a follow-up interview?',
      kind: 'question',
      x: 540,
      y: 640,
      branchCount: 1,
    },
    {
      id: 'q14',
      code: 'Q14',
      label: 'Q14',
      text: 'Thank you — please confirm your contact preference.',
      kind: 'question',
      x: 700,
      y: 640,
      branchCount: 1,
    },
    {
      id: 'completed',
      label: 'Completed',
      kind: 'completed',
      x: 700,
      y: 740,
      branchCount: 0,
    },
    {
      id: 'q15',
      label: 'Q15',
      code: 'Q15',
      text: 'Legacy screener — which region do you live in?',
      kind: 'unreachable',
      x: 140,
      y: 300,
      branchCount: 0,
    },
    {
      id: 'q16',
      label: 'Q16',
      code: 'Q16',
      text: 'How many household members participate in product tests?',
      kind: 'unreachable',
      x: 140,
      y: 400,
      branchCount: 0,
    },
    {
      id: 'q17',
      label: 'Q17',
      code: 'Q17',
      text: 'Which of these product categories have you tested in the last 12 months, including any at-home use tests you completed for another research company?',
      kind: 'unreachable',
      x: 140,
      y: 500,
      branchCount: 0,
    },
    {
      id: 'q18',
      label: 'Q18',
      code: 'Q18',
      text: 'Please confirm your availability for the in-person session.',
      kind: 'unreachable',
      x: 140,
      y: 600,
      branchCount: 0,
    },
  ],
  edges: [
    { id: 'e-q1-term', from: 'q1', to: 'terminated', curve: -40, hasBranchLogic: true },
    { id: 'e-q1-q2', from: 'q1', to: 'q2', curve: 40, hasBranchLogic: true },
    { id: 'e-q2-q3', from: 'q2', to: 'q3', curve: -30, hasBranchLogic: true },
    { id: 'e-q2-q4', from: 'q2', to: 'q4', curve: 30, hasBranchLogic: true },
    { id: 'e-q3-q5', from: 'q3', to: 'q5', curve: -20 },
    { id: 'e-q3-q6', from: 'q3', to: 'q6', curve: 20 },
    { id: 'e-q4-q7', from: 'q4', to: 'q7', curve: 10 },
    { id: 'e-q5-q8', from: 'q5', to: 'q8', curve: -15 },
    { id: 'e-q5-q9', from: 'q5', to: 'q9', curve: 15, hasBranchLogic: true },
    { id: 'e-q6-q9', from: 'q6', to: 'q9', curve: -10 },
    { id: 'e-q6-q10', from: 'q6', to: 'q10', curve: 20 },
    { id: 'e-q7-q11', from: 'q7', to: 'q11', curve: 10 },
    { id: 'e-q8-q12', from: 'q8', to: 'q12', curve: 0 },
    { id: 'e-q9-q12', from: 'q9', to: 'q12', curve: -20 },
    { id: 'e-q9-q13', from: 'q9', to: 'q13', curve: 20, hasBranchLogic: true },
    { id: 'e-q10-q13', from: 'q10', to: 'q13', curve: 0 },
    { id: 'e-q11-q14', from: 'q11', to: 'q14', curve: 0 },
    { id: 'e-q12-q14', from: 'q12', to: 'q14', curve: 30 },
    { id: 'e-q13-q14', from: 'q13', to: 'q14', curve: 0 },
    { id: 'e-q14-completed', from: 'q14', to: 'completed', curve: 0 },
    // Dense alternative arcs shown when Compare all routes is on
    { id: 'c-q1-q3', from: 'q1', to: 'q3', curve: -90, compareOnly: true },
    { id: 'c-q1-q4', from: 'q1', to: 'q4', curve: 110, compareOnly: true },
    { id: 'c-q2-q5', from: 'q2', to: 'q5', curve: -120, compareOnly: true },
    { id: 'c-q2-q6', from: 'q2', to: 'q6', curve: 80, compareOnly: true },
    { id: 'c-q2-term', from: 'q2', to: 'terminated', curve: -70, compareOnly: true, hasBranchLogic: true },
    { id: 'c-q3-q7', from: 'q3', to: 'q7', curve: 100, compareOnly: true },
    { id: 'c-q3-term', from: 'q3', to: 'terminated', curve: -100, compareOnly: true },
    { id: 'c-q4-q6', from: 'q4', to: 'q6', curve: -60, compareOnly: true },
    { id: 'c-q4-q9', from: 'q4', to: 'q9', curve: 40, compareOnly: true },
    { id: 'c-q5-q10', from: 'q5', to: 'q10', curve: 90, compareOnly: true },
    { id: 'c-q5-term', from: 'q5', to: 'terminated', curve: -80, compareOnly: true },
    { id: 'c-q6-q8', from: 'q6', to: 'q8', curve: -50, compareOnly: true },
    { id: 'c-q6-q11', from: 'q6', to: 'q11', curve: 70, compareOnly: true },
    { id: 'c-q7-q10', from: 'q7', to: 'q10', curve: -40, compareOnly: true },
    { id: 'c-q7-q13', from: 'q7', to: 'q13', curve: 50, compareOnly: true },
    { id: 'c-q8-q13', from: 'q8', to: 'q13', curve: 60, compareOnly: true },
    { id: 'c-q8-completed', from: 'q8', to: 'completed', curve: -110, compareOnly: true },
    { id: 'c-q9-q11', from: 'q9', to: 'q11', curve: 55, compareOnly: true },
    { id: 'c-q9-term', from: 'q9', to: 'terminated', curve: -140, compareOnly: true },
    { id: 'c-q10-q12', from: 'q10', to: 'q12', curve: -45, compareOnly: true },
    { id: 'c-q10-completed', from: 'q10', to: 'completed', curve: 90, compareOnly: true },
    { id: 'c-q11-q12', from: 'q11', to: 'q12', curve: -70, compareOnly: true },
    { id: 'c-q12-completed', from: 'q12', to: 'completed', curve: -30, compareOnly: true },
    { id: 'c-q13-completed', from: 'q13', to: 'completed', curve: 20, compareOnly: true },
    { id: 'c-q3-q12', from: 'q3', to: 'q12', curve: -130, compareOnly: true },
    { id: 'c-q4-q14', from: 'q4', to: 'q14', curve: 120, compareOnly: true },
  ],
  routes: [
    {
      id: 'route-main',
      name: 'Path 1',
      isMain: true,
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q3', 'Q5', 'Q9', 'Q13', 'Q14', 'Completed'],
      nodeIds: ['q1', 'q2', 'q3', 'q5', 'q9', 'q13', 'q14', 'completed'],
    },
    {
      id: 'route-c2',
      name: 'Path 2',
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q4', 'Q7', 'Q11', 'Q14', 'Completed'],
      nodeIds: ['q1', 'q2', 'q4', 'q7', 'q11', 'q14', 'completed'],
    },
    {
      id: 'route-c3',
      name: 'Path 3',
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q3', 'Q6', 'Q10', 'Q13', 'Q14', 'Completed'],
      nodeIds: ['q1', 'q2', 'q3', 'q6', 'q10', 'q13', 'q14', 'completed'],
    },
    {
      id: 'route-c4',
      name: 'Path 4',
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q3', 'Q5', 'Q8', 'Q12', 'Q14', 'Completed'],
      nodeIds: ['q1', 'q2', 'q3', 'q5', 'q8', 'q12', 'q14', 'completed'],
    },
    {
      id: 'route-c5',
      name: 'Path 5',
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q3', 'Q6', 'Q9', 'Q12', 'Q14', 'Completed'],
      nodeIds: ['q1', 'q2', 'q3', 'q6', 'q9', 'q12', 'q14', 'completed'],
    },
    {
      id: 'route-c6',
      name: 'Path 6',
      outcome: 'completed',
      steps: ['Q2', 'Q3', 'Q4', 'Q5', 'Q9', 'Q13', 'Completed'],
      nodeIds: ['q2', 'q3', 'q4', 'q5', 'q9', 'q13', 'completed'],
    },
    {
      id: 'route-c7',
      name: 'Path 7',
      outcome: 'completed',
      steps: ['Q2', 'Q4', 'Q7', 'Q10', 'Q13', 'Completed'],
      nodeIds: ['q2', 'q4', 'q7', 'q10', 'q13', 'completed'],
    },
    {
      id: 'route-c8',
      name: 'Path 8',
      outcome: 'completed',
      steps: ['Q3', 'Q5', 'Q8', 'Q12', 'Q14', 'Completed'],
      nodeIds: ['q3', 'q5', 'q8', 'q12', 'q14', 'completed'],
    },
    {
      id: 'route-t1',
      name: 'Path 9',
      outcome: 'terminated',
      steps: ['Q1', 'Terminated'],
      nodeIds: ['q1', 'terminated'],
    },
    {
      id: 'route-t2',
      name: 'Path 10',
      outcome: 'terminated',
      steps: ['Q1', 'Q2', 'Terminated'],
      nodeIds: ['q1', 'q2', 'terminated'],
    },
    {
      id: 'route-t3',
      name: 'Path 11',
      outcome: 'terminated',
      steps: ['Q1', 'Q2', 'Q3', 'Terminated'],
      nodeIds: ['q1', 'q2', 'q3', 'terminated'],
    },
    {
      id: 'route-t4',
      name: 'Path 12',
      outcome: 'terminated',
      steps: ['Q1', 'Q2', 'Q3', 'Q5', 'Terminated'],
      nodeIds: ['q1', 'q2', 'q3', 'q5', 'terminated'],
    },
    {
      id: 'route-t5',
      name: 'Path 13',
      outcome: 'terminated',
      steps: ['Q1', 'Q2', 'Q4', 'Q7', 'Terminated'],
      nodeIds: ['q1', 'q2', 'q4', 'q7', 'terminated'],
    },
    {
      id: 'route-t6',
      name: 'Path 14',
      outcome: 'terminated',
      steps: ['Q2', 'Q3', 'Q6', 'Q9', 'Terminated'],
      nodeIds: ['q2', 'q3', 'q6', 'q9', 'terminated'],
    },
    {
      id: 'route-t7',
      name: 'Path 15',
      outcome: 'terminated',
      steps: ['Q3', 'Q5', 'Q9', 'Terminated'],
      nodeIds: ['q3', 'q5', 'q9', 'terminated'],
    },
    {
      id: 'route-c9',
      name: 'Path 16',
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q3', 'Q6', 'Q9', 'Q13', 'Completed'],
      nodeIds: ['q1', 'q2', 'q3', 'q6', 'q9', 'q13', 'completed'],
    },
    {
      id: 'route-c10',
      name: 'Path 17',
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q4', 'Q7', 'Q11', 'Q13', 'Q14', 'Completed'],
      nodeIds: ['q1', 'q2', 'q4', 'q7', 'q11', 'q13', 'q14', 'completed'],
    },
    {
      id: 'route-t8',
      name: 'Path 18',
      outcome: 'terminated',
      steps: ['Q1', 'Q2', 'Q3', 'Q6', 'Terminated'],
      nodeIds: ['q1', 'q2', 'q3', 'q6', 'terminated'],
    },
    {
      id: 'route-c11',
      name: 'Path 19',
      outcome: 'completed',
      steps: ['Q2', 'Q3', 'Q5', 'Q8', 'Q12', 'Completed'],
      nodeIds: ['q2', 'q3', 'q5', 'q8', 'q12', 'completed'],
    },
    {
      id: 'route-c12',
      name: 'Path 20',
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q3', 'Q5', 'Q9', 'Q12', 'Q14', 'Completed'],
      nodeIds: ['q1', 'q2', 'q3', 'q5', 'q9', 'q12', 'q14', 'completed'],
    },
    {
      id: 'route-t9',
      name: 'Path 21',
      outcome: 'terminated',
      steps: ['Q2', 'Q4', 'Q7', 'Terminated'],
      nodeIds: ['q2', 'q4', 'q7', 'terminated'],
    },
    {
      id: 'route-c13',
      name: 'Path 22',
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q3', 'Q6', 'Q10', 'Q13', 'Q14', 'Completed'],
      nodeIds: ['q1', 'q2', 'q3', 'q6', 'q10', 'q13', 'q14', 'completed'],
    },
    {
      id: 'route-c14',
      name: 'Path 23',
      outcome: 'completed',
      steps: ['Q1', 'Q2', 'Q4', 'Q6', 'Q9', 'Q12', 'Completed'],
      nodeIds: ['q1', 'q2', 'q4', 'q6', 'q9', 'q12', 'completed'],
    },
    {
      id: 'route-t10',
      name: 'Path 24',
      outcome: 'terminated',
      steps: ['Q1', 'Q2', 'Q5', 'Q8', 'Terminated'],
      nodeIds: ['q1', 'q2', 'q5', 'q8', 'terminated'],
    },
    {
      id: 'route-c15',
      name: 'Path 25',
      outcome: 'completed',
      steps: ['Q3', 'Q6', 'Q10', 'Q13', 'Q14', 'Completed'],
      nodeIds: ['q3', 'q6', 'q10', 'q13', 'q14', 'completed'],
    },
  ],
  unreachableQuestions: [
    {
      id: 'q15',
      code: 'Q15',
      text: 'Legacy screener — which region do you live in?',
      previousQuestion: {
        code: 'Q14',
        text: 'Thank you — please confirm your contact preference.',
      },
      nextQuestion: {
        code: 'Q16',
        text: 'How many household members participate in product tests?',
        unreachable: true,
      },
    },
    {
      id: 'q16',
      code: 'Q16',
      text: 'How many household members participate in product tests?',
      previousQuestion: {
        code: 'Q15',
        text: 'Legacy screener — which region do you live in?',
        unreachable: true,
      },
      nextQuestion: {
        code: 'Q17',
        text: 'Which of these product categories have you tested in the last 12 months, including any at-home use tests you completed for another research company?',
        unreachable: true,
      },
    },
    {
      id: 'q17',
      code: 'Q17',
      text: 'Which of these product categories have you tested in the last 12 months, including any at-home use tests you completed for another research company?',
      previousQuestion: {
        code: 'Q16',
        text: 'How many household members participate in product tests?',
        unreachable: true,
      },
      nextQuestion: {
        code: 'Q18',
        text: 'Please confirm your availability for the in-person session.',
        unreachable: true,
      },
    },
    {
      id: 'q18',
      code: 'Q18',
      text: 'Please confirm your availability for the in-person session.',
      previousQuestion: {
        code: 'Q17',
        text: 'Which of these product categories have you tested in the last 12 months, including any at-home use tests you completed for another research company?',
        unreachable: true,
      },
      nextQuestion: null,
    },
  ],
};

export function getPathSimulatorStartingOptions(
  graph: PathSimulatorGraph = PATH_SIMULATOR_GRAPH
): { value: string; label: string }[] {
  return graph.nodes
    .filter((node) => node.kind === 'question')
    .map((node) => {
      const code = node.code ?? node.label;
      const text = node.text ?? node.label;
      const truncated = text.length > 28 ? `${text.slice(0, 28)}...` : text;
      return {
        value: node.id,
        label: `[${code}] ${truncated}`,
      };
    });
}

export function getOutboundEdges(
  graph: PathSimulatorGraph,
  nodeId: string
): PathSimulatorEdge[] {
  return graph.edges.filter((edge) => edge.from === nodeId && !edge.compareOnly);
}

export function getNodeById(
  graph: PathSimulatorGraph,
  nodeId: string
): PathSimulatorNode | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

export function truncatePathLabel(text: string, max = 36): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

export type PathSimulatorRouteSort = 'questions-asc' | 'questions-desc';

export const PATH_SIMULATOR_DEFAULT_ROUTE_SORT: PathSimulatorRouteSort = 'questions-desc';

export const PATH_SIMULATOR_ROUTE_SORT_OPTIONS: {
  value: PathSimulatorRouteSort;
  label: string;
}[] = [
  { value: 'questions-desc', label: 'Most questions' },
  { value: 'questions-asc', label: 'Fewest questions' },
];

export function getRouteQuestionCount(route: PathSimulatorRoute): number {
  return route.nodeIds.filter((id) => {
    const lower = id.toLowerCase();
    return lower !== 'terminated' && lower !== 'completed';
  }).length;
}

export function formatRouteQuestionCount(count: number): string {
  return `${count} question${count === 1 ? '' : 's'}`;
}

export function filterPathSimulatorRoutes(
  routes: PathSimulatorRoute[],
  filter: PathSimulatorRouteFilter
): PathSimulatorRoute[] {
  if (filter === 'all') return routes;
  if (filter === 'unreachable') return [];
  return routes.filter((route) => route.outcome === filter);
}

/** Match "22", "path 22", "Path 22", or partial name text. */
export function filterRoutesByPathQuery(
  routes: PathSimulatorRoute[],
  query: string
): PathSimulatorRoute[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return routes;

  const numeric = trimmed.replace(/^path\s*/i, '').trim();
  const isNumericOnly = /^\d+$/.test(numeric);

  return routes.filter((route) => {
    const name = route.name.toLowerCase();
    if (name.includes(trimmed)) return true;
    if (isNumericOnly) {
      const match = /^path\s+(\d+)$/i.exec(route.name);
      return match?.[1] === numeric;
    }
    return false;
  });
}

export function sortPathSimulatorRoutes(
  routes: PathSimulatorRoute[],
  sort: PathSimulatorRouteSort
): PathSimulatorRoute[] {
  const sorted = [...routes];
  sorted.sort((a, b) => {
    const diff = getRouteQuestionCount(a) - getRouteQuestionCount(b);
    return sort === 'questions-asc' ? diff : -diff;
  });
  return sorted;
}

export function formatRouteSequence(steps: string[]): string {
  return steps.join(' → ');
}

export function getDefaultCompareRoute(
  graph: PathSimulatorGraph = PATH_SIMULATOR_GRAPH
): PathSimulatorRoute {
  return graph.routes.find((route) => route.isMain) ?? graph.routes[0];
}

export function getRouteEdgeIds(
  graph: PathSimulatorGraph,
  route: PathSimulatorRoute
): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < route.nodeIds.length - 1; i += 1) {
    const from = route.nodeIds[i];
    const to = route.nodeIds[i + 1];
    const edge = graph.edges.find(
      (item) => item.from === from && item.to === to && !item.compareOnly
    );
    if (edge) ids.add(edge.id);
  }
  return ids;
}
