'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  PATH_SIMULATOR_COMPARE_HINT,
  PATH_SIMULATOR_COMPARE_LEGEND,
  PATH_SIMULATOR_DEFAULT_ROUTE_SORT,
  PATH_SIMULATOR_GRAPH,
  PATH_SIMULATOR_LEGEND,
  PATH_SIMULATOR_UNREACHABLE_HINT,
  filterPathSimulatorRoutes,
  filterRoutesByPathQuery,
  formatRouteQuestionCount,
  formatRouteSequence,
  getDefaultCompareRoute,
  getNodeById,
  getOutboundEdges,
  getPathSimulatorStartingOptions,
  getRouteEdgeIds,
  getRouteQuestionCount,
  sortPathSimulatorRoutes,
  truncatePathLabel,
  type PathSimulatorEdge,
  type PathSimulatorLegendSwatch,
  type PathSimulatorNode,
  type PathSimulatorNodeStatus,
  type PathSimulatorRoute,
  type PathSimulatorRouteFilter,
  type PathSimulatorRouteSort,
} from '@/data/mock-path-simulator';
import styles from './PathSimulatorDashboard.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface PathSimulatorDashboardProps {
  surveyId: number;
}

const CANVAS_WIDTH = 920;
const CANVAS_HEIGHT = 820;
const NODE_R = 28;

function resolveNodeStatus(
  node: PathSimulatorNode,
  pathIds: string[],
  selectedId: string,
  nextIds: Set<string>
): PathSimulatorNodeStatus {
  if (node.kind === 'terminated') {
    if (nextIds.has(node.id) || pathIds.includes(node.id)) return 'terminated';
    return 'off-path';
  }
  if (node.kind === 'completed') {
    if (pathIds.includes(node.id)) return 'completed';
    return 'off-path';
  }
  if (node.kind === 'unreachable') return 'unreachable';
  if (node.id === selectedId) return 'selected';
  if (nextIds.has(node.id)) return 'next';
  const pathIndex = pathIds.indexOf(node.id);
  if (pathIndex >= 0 && pathIndex < pathIds.length - 1) return 'completed';
  if (pathIds.includes(node.id)) return 'selected';
  return 'off-path';
}

function resolveCompareNodeStatus(
  node: PathSimulatorNode,
  routeNodeIds: Set<string>
): PathSimulatorNodeStatus {
  if (node.kind === 'unreachable') return 'unreachable';
  if (node.kind === 'terminated') {
    return routeNodeIds.has(node.id) ? 'terminated' : 'alt-route';
  }
  if (node.kind === 'completed') {
    return routeNodeIds.has(node.id) ? 'completed' : 'alt-route';
  }
  if (routeNodeIds.has(node.id)) return 'on-path';
  return 'alt-route';
}

function edgePath(from: PathSimulatorNode, to: PathSimulatorNode, curve = 0): string {
  const mx = (from.x + to.x) / 2 + curve;
  const my = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

function edgeMidpoint(
  from: PathSimulatorNode,
  to: PathSimulatorNode,
  curve = 0
): { x: number; y: number } {
  const mx = (from.x + to.x) / 2 + curve * 0.5;
  const my = (from.y + to.y) / 2;
  return { x: mx, y: my };
}

function LegendSwatch({ swatch }: { swatch: PathSimulatorLegendSwatch }) {
  if (swatch === 'info') {
    return <span className={`${styles.legendSwatch} ${styles.legendInfo}`} aria-hidden />;
  }
  if (swatch === 'branch' || swatch === 'branch-selected') {
    return (
      <span
        className={`${styles.legendSwatch} ${
          swatch === 'branch' ? styles.legendBranch : styles.legendBranchSelected
        }`}
        aria-hidden
      />
    );
  }
  return (
    <span
      className={`${styles.legendSwatch} ${styles[`legend_${swatch}`]}`}
      aria-hidden
    />
  );
}

function GraphNode({
  node,
  status,
  onSelect,
  clickable,
  emphasized = false,
}: {
  node: PathSimulatorNode;
  status: PathSimulatorNodeStatus;
  onSelect: (nodeId: string) => void;
  clickable: boolean;
  emphasized?: boolean;
}) {
  const isPill =
    node.kind === 'terminated' ||
    node.kind === 'unreachable' ||
    node.kind === 'completed';

  const className = [
    styles.node,
    isPill ? styles.nodePill : styles.nodeCircle,
    styles[`node_${status}`],
    clickable ? styles.nodeClickable : '',
    emphasized ? styles.nodeEmphasized : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className={className}
      onClick={() => {
        if (clickable) onSelect(node.id);
      }}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(event) => {
        if (!clickable) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(node.id);
        }
      }}
      aria-label={node.label}
    >
      {isPill ? <ellipse rx={52} ry={22} /> : <circle r={NODE_R} />}
      <text className={styles.nodeLabel} textAnchor="middle" dominantBaseline="central">
        {node.label}
      </text>
      {status === 'selected' || status === 'on-path' ? (
        node.kind === 'question' ? (
          <g
            className={styles.infoIcon}
            transform={`translate(${NODE_R + 8}, ${-(NODE_R + 2)})`}
            onClick={(event) => event.stopPropagation()}
          >
            <title>Question information</title>
            <circle r={10} className={styles.infoIconBg} />
            <foreignObject x={-7} y={-7} width={14} height={14}>
              <span className={`wm-visibility ${styles.infoEye}`} aria-hidden />
            </foreignObject>
          </g>
        ) : null
      ) : null}
    </g>
  );
}

function RouteSequence({ steps }: { steps: string[] }) {
  const visible =
    steps.length <= 6
      ? steps
      : [...steps.slice(0, 4), '…', ...steps.slice(-1)];

  return (
    <span className={styles.routeSequence}>
      {visible.map((step, index) => (
        <span key={`${step}-${index}`} className={styles.routeStepWrap}>
          {index > 0 ? <span className={styles.routeArrow}>→</span> : null}
          <span
            className={
              step === 'Completed'
                ? styles.routeStepComplete
                : step === 'Terminated'
                  ? styles.routeStepTerminated
                  : styles.routeStep
            }
          >
            {step}
          </span>
        </span>
      ))}
    </span>
  );
}

export function PathSimulatorDashboard({ surveyId }: PathSimulatorDashboardProps) {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const graph = PATH_SIMULATOR_GRAPH;
  const startingOptions = useMemo(() => getPathSimulatorStartingOptions(graph), [graph]);
  const defaultRoute = useMemo(() => getDefaultCompareRoute(graph), [graph]);

  const [startId, setStartId] = useState(graph.defaultStartId);
  const [pathIds, setPathIds] = useState<string[]>([graph.defaultStartId]);
  const [compareAllRoutes, setCompareAllRoutes] = useState(false);
  const [routeFilter, setRouteFilter] = useState<PathSimulatorRouteFilter>('all');
  const [routeSort, setRouteSort] = useState<PathSimulatorRouteSort>(
    PATH_SIMULATOR_DEFAULT_ROUTE_SORT
  );
  const [pathQuery, setPathQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(defaultRoute.id);
  const [selectedUnreachableId, setSelectedUnreachableId] = useState(
    graph.unreachableQuestions[0]?.id ?? null
  );
  const [zoom, setZoom] = useState(1);
  const [legendOpen, setLegendOpen] = useState(true);

  const selectedRoute =
    graph.routes.find((route) => route.id === selectedRouteId) ?? defaultRoute;

  const filteredRoutes = useMemo(() => {
    const byOutcome = filterPathSimulatorRoutes(graph.routes, routeFilter);
    const byQuery = filterRoutesByPathQuery(byOutcome, pathQuery);
    return sortPathSimulatorRoutes(byQuery, routeSort);
  }, [graph.routes, pathQuery, routeFilter, routeSort]);

  const sortTooltip = 'Sort by number of questions';
  const showUnreachable = routeFilter === 'unreachable';

  const selectedId = pathIds[pathIds.length - 1] ?? startId;
  const selectedNode = getNodeById(graph, selectedId);
  const nextEdges = getOutboundEdges(graph, selectedId);
  const nextIds = useMemo(
    () => new Set(nextEdges.map((edge) => edge.to)),
    [nextEdges]
  );

  const pathEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < pathIds.length - 1; i += 1) {
      const from = pathIds[i];
      const to = pathIds[i + 1];
      const edge = graph.edges.find(
        (item) => item.from === from && item.to === to && !item.compareOnly
      );
      if (edge) ids.add(edge.id);
    }
    return ids;
  }, [graph.edges, pathIds]);

  const compareRouteNodeIds = useMemo(
    () => new Set(selectedRoute.nodeIds),
    [selectedRoute.nodeIds]
  );
  const compareRouteEdgeIds = useMemo(
    () => getRouteEdgeIds(graph, selectedRoute),
    [graph, selectedRoute]
  );

  const questionsVisited = pathIds.filter((id) => {
    const node = getNodeById(graph, id);
    return node?.kind === 'question';
  }).length;

  const branchesAhead = nextEdges.length;
  const statusLabel =
    selectedNode?.kind === 'terminated'
      ? 'Terminated'
      : selectedNode?.kind === 'completed' || nextEdges.length === 0
        ? 'Complete'
        : 'In progress';

  const startOption =
    startingOptions.find((option) => option.value === startId) ?? startingOptions[0];

  const legendItems = compareAllRoutes
    ? PATH_SIMULATOR_COMPARE_LEGEND
    : PATH_SIMULATOR_LEGEND;

  const resetFromStart = useCallback((nextStartId: string) => {
    setStartId(nextStartId);
    setPathIds([nextStartId]);
  }, []);

  const handleStartOver = useCallback(() => {
    setPathIds([startId]);
    showToast({ message: 'Simulation restarted', variant: 'success' });
  }, [showToast, startId]);

  const handleBack = useCallback(() => {
    if (pathIds.length <= 1) return;
    setPathIds((prev) => prev.slice(0, -1));
  }, [pathIds.length]);

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      if (compareAllRoutes) {
        if (graph.unreachableQuestions.some((question) => question.id === nodeId)) {
          setRouteFilter('unreachable');
          setSelectedUnreachableId(nodeId);
          return;
        }
        const matching = graph.routes.find((route) => route.nodeIds.includes(nodeId));
        if (matching) setSelectedRouteId(matching.id);
        return;
      }
      if (nodeId === selectedId) return;
      if (nextIds.has(nodeId)) {
        setPathIds((prev) => [...prev, nodeId]);
        return;
      }
      const pathIndex = pathIds.indexOf(nodeId);
      if (pathIndex >= 0) {
        setPathIds((prev) => prev.slice(0, pathIndex + 1));
      }
    },
    [
      compareAllRoutes,
      graph.routes,
      graph.unreachableQuestions,
      nextIds,
      pathIds,
      selectedId,
    ]
  );

  const handleSelectRoute = useCallback((route: PathSimulatorRoute) => {
    setSelectedRouteId(route.id);
  }, []);

  const handleSelectUnreachable = useCallback((nodeId: string) => {
    setSelectedUnreachableId(nodeId);
  }, []);

  const handleBranchClick = useCallback(
    (edge: PathSimulatorEdge) => {
      if (compareAllRoutes) {
        const matching = graph.routes.find((route) => {
          for (let i = 0; i < route.nodeIds.length - 1; i += 1) {
            if (route.nodeIds[i] === edge.from && route.nodeIds[i + 1] === edge.to) {
              return true;
            }
          }
          return false;
        });
        if (matching) {
          setSelectedRouteId(matching.id);
          return;
        }
        showToast({ message: 'Branch highlighted on alternative routes', variant: 'success' });
        return;
      }
      if (edge.from !== selectedId) {
        showToast({
          message: 'Select the upstream question first to follow this branch',
          variant: 'error',
        });
        return;
      }
      handleSelectNode(edge.to);
    },
    [compareAllRoutes, graph.routes, handleSelectNode, selectedId, showToast]
  );

  const handleCompareChange = useCallback(
    (checked: boolean) => {
      setCompareAllRoutes(checked);
      if (checked) {
        setSelectedRouteId(defaultRoute.id);
        setRouteFilter('all');
        setRouteSort(PATH_SIMULATOR_DEFAULT_ROUTE_SORT);
        setPathQuery('');
      }
    },
    [defaultRoute.id]
  );

  const handleRouteFilterChange = useCallback(
    (filter: PathSimulatorRouteFilter) => {
      setRouteFilter(filter);
      const nextRoutes = sortPathSimulatorRoutes(
        filterRoutesByPathQuery(
          filterPathSimulatorRoutes(graph.routes, filter),
          pathQuery
        ),
        routeSort
      );
      if (!nextRoutes.some((route) => route.id === selectedRouteId) && nextRoutes[0]) {
        setSelectedRouteId(nextRoutes[0].id);
      }
    },
    [graph.routes, pathQuery, routeSort, selectedRouteId]
  );

  const syncSelectedRoute = useCallback(
    (routes: PathSimulatorRoute[]) => {
      if (!routes.some((route) => route.id === selectedRouteId) && routes[0]) {
        setSelectedRouteId(routes[0].id);
      }
    },
    [selectedRouteId]
  );

  const handleToggleSort = useCallback(() => {
    const next: PathSimulatorRouteSort =
      routeSort === 'questions-desc' ? 'questions-asc' : 'questions-desc';
    setRouteSort(next);
    syncSelectedRoute(
      sortPathSimulatorRoutes(
        filterRoutesByPathQuery(
          filterPathSimulatorRoutes(graph.routes, routeFilter),
          pathQuery
        ),
        next
      )
    );
  }, [graph.routes, pathQuery, routeFilter, routeSort, syncSelectedRoute]);

  const handlePathQueryChange = useCallback(
    (value: string) => {
      setPathQuery(value);
      const nextRoutes = sortPathSimulatorRoutes(
        filterRoutesByPathQuery(
          filterPathSimulatorRoutes(graph.routes, routeFilter),
          value
        ),
        routeSort
      );
      syncSelectedRoute(nextRoutes);
    },
    [graph.routes, routeFilter, routeSort, syncSelectedRoute]
  );

  const instruction =
    pathIds.length <= 1
      ? `Click a branch from ${selectedNode?.label ?? 'Q1'} to begin`
      : `Continue from ${selectedNode?.label ?? 'this question'}`;

  const visibleEdges = compareAllRoutes
    ? graph.edges
    : graph.edges.filter((edge) => !edge.compareOnly);

  return (
    <div className={styles.root}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h1 className={styles.pageTitle}>Path simulator</h1>
          <label className={styles.startLabel} htmlFor="path-sim-start">
            Starting question
          </label>
          <div className={styles.startSelect}>
            <WuSelect
              data={startingOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={startOption}
              onSelect={(item) => {
                const next = item as { value: string; label: string } | null;
                if (!next) return;
                resetFromStart(next.value);
              }}
              variant="outlined"
            />
          </div>
          <span className={styles.branchBadge}>
            {graph.branchPointCount} branch points
          </span>
          <div className={styles.compareRow}>
            <WuToggle
              Label="Compare all paths"
              labelPosition="left"
              checked={compareAllRoutes}
              onChange={handleCompareChange}
            />
          </div>
        </div>
        <div className={styles.toolbarRight}>
          {!compareAllRoutes ? (
            <>
              <WuButton
                variant="secondary"
                disabled={pathIds.length <= 1}
                onClick={handleBack}
              >
                <span className={`wm-arrow-back ${styles.btnIcon}`} aria-hidden />
                Back
              </WuButton>
              <WuButton variant="primary" onClick={handleStartOver}>
                <span className={`wm-refresh ${styles.btnIcon}`} aria-hidden />
                Start over
              </WuButton>
            </>
          ) : null}
          <WuButton
            variant="secondary"
            onClick={() => router.push(`/surveys/${surveyId}`)}
          >
            <span className={`wm-arrow-back ${styles.btnIcon}`} aria-hidden />
            Back to survey
          </WuButton>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={`${styles.sidebar} ${compareAllRoutes ? styles.sidebarCompare : ''}`}>
          {compareAllRoutes ? (
            <section className={styles.sideSection}>
              <p className={styles.sideHint}>
                {showUnreachable
                  ? PATH_SIMULATOR_UNREACHABLE_HINT
                  : PATH_SIMULATOR_COMPARE_HINT}
              </p>
              <div className={styles.routeTabs} role="tablist" aria-label="Route filters">
                <button
                  type="button"
                  role="tab"
                  aria-selected={routeFilter === 'completed'}
                  className={`${styles.routeTab} ${styles.routeTabCompleted} ${
                    routeFilter === 'completed' ? styles.routeTabActive : ''
                  }`}
                  onClick={() => handleRouteFilterChange('completed')}
                >
                  Completed {graph.routeCounts.completed}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={routeFilter === 'terminated'}
                  className={`${styles.routeTab} ${styles.routeTabTerminated} ${
                    routeFilter === 'terminated' ? styles.routeTabActive : ''
                  }`}
                  onClick={() => handleRouteFilterChange('terminated')}
                >
                  Terminated {graph.routeCounts.terminated}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={routeFilter === 'all'}
                  className={`${styles.routeTab} ${
                    routeFilter === 'all' ? styles.routeTabActive : ''
                  }`}
                  onClick={() => handleRouteFilterChange('all')}
                >
                  All {graph.routeCounts.all}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={routeFilter === 'unreachable'}
                  className={`${styles.routeTab} ${styles.routeTabUnreachable} ${
                    routeFilter === 'unreachable' ? styles.routeTabActive : ''
                  }`}
                  onClick={() => handleRouteFilterChange('unreachable')}
                >
                  Unreachable questions {graph.unreachableQuestions.length}
                </button>
              </div>
              {showUnreachable ? (
                <ul className={styles.unreachableList}>
                  {graph.unreachableQuestions.length === 0 ? (
                    <li className={styles.routeEmpty}>
                      Every question is reachable on at least one path.
                    </li>
                  ) : null}
                  {graph.unreachableQuestions.map((question) => {
                    const isSelected = question.id === selectedUnreachableId;
                    return (
                      <li key={question.id}>
                        <button
                          type="button"
                          className={`${styles.routeCard} ${
                            isSelected ? styles.routeCardActive : ''
                          }`}
                          onClick={() => handleSelectUnreachable(question.id)}
                          aria-label={`${question.code}: ${question.text}`}
                        >
                          <div className={styles.routeCardHeader}>
                            <span className={styles.unreachableCode}>{question.code}</span>
                          </div>
                          <span className={styles.unreachableText}>
                            {truncatePathLabel(question.text, 70)}
                          </span>
                          <dl className={styles.neighborList}>
                            <div className={styles.neighborRow}>
                              <dt className={styles.neighborLabel}>Previous</dt>
                              <dd className={styles.neighborValue}>
                                {question.previousQuestion ? (
                                  <>
                                    <span
                                      className={
                                        question.previousQuestion.unreachable
                                          ? styles.neighborCodeUnreachable
                                          : styles.neighborCode
                                      }
                                    >
                                      {question.previousQuestion.code}
                                    </span>{' '}
                                    {truncatePathLabel(question.previousQuestion.text, 34)}
                                  </>
                                ) : (
                                  'First question in the survey'
                                )}
                              </dd>
                            </div>
                            <div className={styles.neighborRow}>
                              <dt className={styles.neighborLabel}>Next</dt>
                              <dd className={styles.neighborValue}>
                                {question.nextQuestion ? (
                                  <>
                                    <span
                                      className={
                                        question.nextQuestion.unreachable
                                          ? styles.neighborCodeUnreachable
                                          : styles.neighborCode
                                      }
                                    >
                                      {question.nextQuestion.code}
                                    </span>{' '}
                                    {truncatePathLabel(question.nextQuestion.text, 34)}
                                  </>
                                ) : (
                                  'Last question in the survey'
                                )}
                              </dd>
                            </div>
                          </dl>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <>
              <div className={styles.routeControls}>
                <div className={styles.routeFind}>
                  <WuInput
                    variant="outlined"
                    value={pathQuery}
                    placeholder="Find path, e.g. 22"
                    aria-label="Find path by name or number"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      handlePathQueryChange(event.target.value)
                    }
                  />
                </div>
                <WuTooltip content={sortTooltip} position="top">
                  <button
                    type="button"
                    className={styles.routeSortBtn}
                    aria-label={sortTooltip}
                    onClick={handleToggleSort}
                  >
                    <span
                      className={
                        routeSort === 'questions-desc'
                          ? 'wm-arrow-downward'
                          : 'wm-arrow-upward'
                      }
                      aria-hidden
                    />
                  </button>
                </WuTooltip>
              </div>
              <ul className={styles.routeList}>
                {filteredRoutes.length === 0 ? (
                  <li className={styles.routeEmpty}>No paths match this search.</li>
                ) : null}
                {filteredRoutes.map((route) => {
                  const isSelected = route.id === selectedRoute.id;
                  const questionCount = getRouteQuestionCount(route);
                  return (
                    <li key={route.id}>
                      <button
                        type="button"
                        className={`${styles.routeCard} ${
                          isSelected ? styles.routeCardActive : ''
                        }`}
                        onClick={() => handleSelectRoute(route)}
                        aria-label={`${route.name}: ${formatRouteSequence(route.steps)}`}
                      >
                        <div className={styles.routeCardHeader}>
                          <span className={styles.routeName}>{route.name}</span>
                          {route.isMain ? (
                            <span className={styles.mainBadge}>MAIN</span>
                          ) : null}
                        </div>
                        <RouteSequence steps={route.steps} />
                        <span className={styles.routeQuestionCount}>
                          {formatRouteQuestionCount(questionCount)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
                </>
              )}
            </section>
          ) : (
            <>
              <section className={styles.sideSection}>
                <h2 className={styles.sideHeading}>Simulation path</h2>
                <p className={styles.sideHint}>{instruction}</p>
                <ul className={styles.pathList}>
                  {pathIds.map((id) => {
                    const node = getNodeById(graph, id);
                    if (!node) return null;
                    const isCurrent = id === selectedId;
                    const branchLabel =
                      node.kind === 'terminated' || node.kind === 'completed'
                        ? 'End'
                        : `${node.branchCount} branch${node.branchCount === 1 ? '' : 'es'}`;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className={`${styles.pathItem} ${
                            isCurrent ? styles.pathItemActive : ''
                          }`}
                          onClick={() => handleSelectNode(id)}
                        >
                          <span className={styles.pathItemCode}>{node.label}</span>
                          <span className={styles.pathItemMeta}>{branchLabel}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className={styles.thisPath}>
                <h2 className={styles.sideHeading}>This path</h2>
                <dl className={styles.stats}>
                  <div className={styles.statRow}>
                    <dt>Questions visited</dt>
                    <dd>{questionsVisited}</dd>
                  </div>
                  <div className={styles.statRow}>
                    <dt>Branches ahead</dt>
                    <dd>{branchesAhead}</dd>
                  </div>
                  <div className={styles.statRow}>
                    <dt>Status</dt>
                    <dd
                      className={
                        statusLabel === 'In progress'
                          ? styles.statusProgress
                          : statusLabel === 'Terminated'
                            ? styles.statusTerminated
                            : styles.statusComplete
                      }
                    >
                      {statusLabel}
                    </dd>
                  </div>
                </dl>
              </section>
            </>
          )}
        </aside>

        <div className={styles.canvasWrap}>
          <div className={styles.canvas} style={{ ['--zoom' as string]: zoom }}>
            <svg
              className={styles.graph}
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              role="img"
              aria-label="Survey path graph"
            >
              <defs>
                <pattern
                  id="path-sim-dots"
                  width="16"
                  height="16"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1.5" cy="1.5" r="1.2" fill="#d4d8e0" />
                </pattern>
              </defs>
              <rect
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="url(#path-sim-dots)"
              />

              {visibleEdges.map((edge) => {
                const from = getNodeById(graph, edge.from);
                const to = getNodeById(graph, edge.to);
                if (!from || !to) return null;

                const onPath = compareAllRoutes
                  ? compareRouteEdgeIds.has(edge.id)
                  : pathEdgeIds.has(edge.id);
                const isNext =
                  !compareAllRoutes &&
                  edge.from === selectedId &&
                  nextIds.has(edge.to);
                const isAlt = compareAllRoutes && !onPath;
                const dimmed = !compareAllRoutes && !onPath && !isNext;
                const mid = edgeMidpoint(from, to, edge.curve ?? 0);

                return (
                  <g key={edge.id}>
                    <path
                      d={edgePath(from, to, edge.curve ?? 0)}
                      className={`${styles.edge} ${
                        onPath
                          ? styles.edgeOnPath
                          : isNext
                            ? styles.edgeNext
                            : isAlt
                              ? styles.edgeAlt
                              : dimmed
                                ? styles.edgeDim
                                : styles.edgeDefault
                      }`}
                      fill="none"
                    />
                    {edge.hasBranchLogic ? (
                      <g
                        className={styles.branchDot}
                        transform={`translate(${mid.x}, ${mid.y})`}
                        onClick={() => handleBranchClick(edge)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleBranchClick(edge);
                          }
                        }}
                        aria-label={`Branch from ${from.label} to ${to.label}`}
                      >
                        <circle
                          r={7}
                          className={
                            onPath || isNext
                              ? styles.branchDotActive
                              : styles.branchDotIdle
                          }
                        />
                      </g>
                    ) : null}
                  </g>
                );
              })}

              {graph.nodes.map((node) => {
                const status = compareAllRoutes
                  ? resolveCompareNodeStatus(node, compareRouteNodeIds)
                  : resolveNodeStatus(node, pathIds, selectedId, nextIds);
                const clickable = compareAllRoutes
                  ? node.kind !== 'unreachable' ||
                    graph.unreachableQuestions.some((item) => item.id === node.id)
                  : status === 'next' ||
                    status === 'selected' ||
                    status === 'completed';
                return (
                  <GraphNode
                    key={node.id}
                    node={node}
                    status={status}
                    onSelect={handleSelectNode}
                    clickable={clickable}
                    emphasized={
                      compareAllRoutes &&
                      showUnreachable &&
                      node.id === selectedUnreachableId
                    }
                  />
                );
              })}
            </svg>
          </div>

          <div className={styles.zoomControls}>
            <button
              type="button"
              className={styles.zoomBtn}
              aria-label="Zoom in"
              onClick={() =>
                setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))))
              }
            >
              +
            </button>
            <button
              type="button"
              className={styles.zoomBtn}
              aria-label="Zoom out"
              onClick={() =>
                setZoom((value) => Math.max(0.6, Number((value - 0.1).toFixed(2))))
              }
            >
              −
            </button>
          </div>

          {legendOpen ? (
            <aside className={styles.legend} aria-label="Path legend">
              <div className={styles.legendHeader}>
                <span className={styles.legendTitle}>Legend</span>
                <button
                  type="button"
                  className={styles.legendClose}
                  aria-label="Hide legend"
                  onClick={() => setLegendOpen(false)}
                >
                  <span className="wm-close" aria-hidden />
                </button>
              </div>
              <ul className={styles.legendList}>
                {legendItems.map((item) => (
                  <li key={item.id} className={styles.legendItem}>
                    <LegendSwatch swatch={item.swatch} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : (
            <button
              type="button"
              className={styles.legendReopen}
              onClick={() => setLegendOpen(true)}
            >
              Legend
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
