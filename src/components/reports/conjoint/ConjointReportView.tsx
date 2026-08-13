'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { forwardRef, useState, type ButtonHTMLAttributes } from 'react';
import {
  CONJOINT_BASE_ATTRIBUTES,
  CONJOINT_COLORS,
  CONJOINT_DEFAULT_CONCEPTS,
  CONJOINT_ELASTICITY_SERIES,
  CONJOINT_FILTERS,
  CONJOINT_PRICES,
  CONJOINT_SECTION_NAV,
  CONJOINT_TOTAL_RESPONDENTS,
  bestPicksForModel,
  buildConjointBaseFromFilters,
  conceptShares,
  formatUtility,
  getConjointInsights,
  rankedProfiles,
  utilityForPicks,
  type ConjointConcept,
  type ConjointFilter,
  type ConjointFilterId,
  type ConjointSectionId,
} from '@/data/mock-conjoint-report';
import {
  createDefaultBaseFilterState,
  type BaseFilterState,
} from '@/data/mock-report-base-filters';
import { BaseFilterForm } from '@/components/reports/BaseFilterForm';
import styles from './ConjointReportView.module.css';
import { useWickUILib } from '@/components/ui/useWickUILib';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);
const WuMenuSeparatorItem = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({
      default: m.WuMenuSeparatorItem,
    })),
  { ssr: false }
);

const BaseMenuTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(function BaseMenuTrigger({ label, className, ...buttonProps }, ref) {
  return (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      className={`${styles.select} ${className ?? ''}`}
    >
      <span className={styles.baseMenuLabel}>{label}</span>
    </button>
  );
});

export interface ConjointReportViewProps {
  reportName: string;
  questionLabel: string;
  surveyName: string;
  reportsHref: string;
  onExport?: () => void;
  onShare?: () => void;
}

const PRESETS = [
  { id: 'best', label: 'Optimal vs current' },
  { id: 'price', label: 'Good / better / best' },
  { id: 'brand', label: 'Brand head-to-head' },
] as const;

const PROFILE_COLS = [
  { label: '#', align: 'left' as const },
  { label: 'Brand', align: 'left' as const },
  { label: 'Price', align: 'left' as const },
  { label: 'Processor', align: 'left' as const },
  { label: 'RAM', align: 'left' as const },
  { label: 'Storage', align: 'left' as const },
  { label: 'Graphics', align: 'left' as const },
  { label: 'Total part-worth', align: 'right' as const },
];

function colorFor(index: number): string {
  return CONJOINT_COLORS[index % CONJOINT_COLORS.length];
}

function clonePicks(picks: Record<string, string>): Record<string, string> {
  return { ...picks };
}

function defaultPicks(): Record<string, string> {
  return CONJOINT_BASE_ATTRIBUTES.reduce<Record<string, string>>((acc, attribute) => {
    acc[attribute.key] = attribute.levels[0].name;
    return acc;
  }, {});
}

export default function ConjointReportView({
  reportName,
  questionLabel,
  surveyName,
  reportsHref,
  onExport,
  onShare,
}: ConjointReportViewProps) {
  const [section, setSection] = useState<ConjointSectionId>('overview');
  const [filterId, setFilterId] = useState<string>('all');
  const [profileBrand, setProfileBrand] = useState('all');
  const [concepts, setConcepts] = useState<ConjointConcept[]>(() =>
    CONJOINT_DEFAULT_CONCEPTS.map((concept) => ({
      ...concept,
      picks: clonePicks(concept.picks),
    }))
  );
  const [nextId, setNextId] = useState(4);
  const [sensConceptId, setSensConceptId] = useState(1);
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [premiumAttr, setPremiumAttr] = useState('brand');

  type CustomConjointFilter = Omit<ConjointFilter, 'id'> & { id: string };
  const [customFilters, setCustomFilters] = useState<CustomConjointFilter[]>([]);
  const [isCreateBaseOpen, setIsCreateBaseOpen] = useState(false);
  const [nextCustomBaseNum, setNextCustomBaseNum] = useState(1);
  const [baseDraftName, setBaseDraftName] = useState('Custom base');
  const [baseDraftFilters, setBaseDraftFilters] = useState<BaseFilterState>(
    createDefaultBaseFilterState
  );

  const wick = useWickUILib();

  const presetFilter = CONJOINT_FILTERS.find((f) => f.id === filterId);
  const activeFilter =
    customFilters.find((f) => f.id === filterId) ??
    presetFilter ??
    CONJOINT_FILTERS[0];

  function getScaledModelForFilter(k: ConjointFilter['k']) {
    return CONJOINT_BASE_ATTRIBUTES.map((attribute) => {
      const multiplier = k[attribute.key] ?? 1;
      const levels = attribute.levels.map((level) => ({
        name: level.name,
        u: Math.round(level.u * multiplier * 100) / 100,
      }));
      const values = levels.map((level) => level.u);
      return {
        ...attribute,
        levels,
        range: Math.max(...values) - Math.min(...values),
      };
    });
  }

  const model = getScaledModelForFilter(activeFilter.k);
  const filter = activeFilter;

  const totalRange = model.reduce((sum, attribute) => sum + attribute.range, 0) || 1;
  const maxAbs =
    Math.max(...model.flatMap((attribute) => attribute.levels.map((level) => Math.abs(level.u)))) ||
    1;
  const maxPct = Math.max(...model.map((attribute) => attribute.range / totalRange)) || 1;

  const attrs = model.map((attribute, index) => {
    const pct = (attribute.range / totalRange) * 100;
    return {
      key: attribute.key,
      name: attribute.name,
      type: attribute.type,
      color: colorFor(index),
      pct,
      pctLabel: `${Math.round(pct)}%`,
      barW: `${((pct / (maxPct * 100)) * 100).toFixed(1)}%`,
      levelCount: attribute.levels.length,
      rangeLabel: attribute.range.toFixed(2),
      levels: attribute.levels.map((level) => ({
        name: level.name,
        u: level.u,
        uLabel: formatUtility(level.u),
        color: level.u >= 0 ? '#2e8b6b' : '#c0553b',
        negW: level.u < 0 ? `${((Math.abs(level.u) / maxAbs) * 100).toFixed(1)}%` : '0%',
        posW: level.u > 0 ? `${((level.u / maxAbs) * 100).toFixed(1)}%` : '0%',
      })),
    };
  });

  const bestPicks = bestPicksForModel(model);
  const worstPicks = model.reduce<Record<string, string>>((picks, attribute) => {
    const worst = [...attribute.levels].sort((a, b) => a.u - b.u)[0];
    picks[attribute.key] = worst.name;
    return picks;
  }, {});

  const fieldsFor = (picks: Record<string, string>) =>
    model.map((attribute) => {
      const level = attribute.levels.find((item) => item.name === picks[attribute.key]);
      const u = level?.u ?? 0;
      return {
        attr: attribute.name,
        value: picks[attribute.key],
        uLabel: formatUtility(u),
        uColor: u >= 0 ? '#2e8b6b' : '#c0553b',
      };
    });

  const bestFields = fieldsFor(bestPicks);
  const worstFields = fieldsFor(worstPicks);
  const bestTotal = utilityForPicks(bestPicks, model).toFixed(2);
  const worstTotal = utilityForPicks(worstPicks, model).toFixed(2);

  const ranked = rankedProfiles(model, profileBrand, 25);
  const topMax = ranked.length ? Number(ranked[0].total) : 1;
  const profileRows = ranked.map((row) => ({
    rank: row.rank,
    brand: String(row.brand),
    price: String(row.price),
    processor: String(row.processor),
    ram: String(row.ram),
    storage: String(row.storage),
    graphics: String(row.graphics),
    total: String(row.total),
    barW: `${Math.max(4, (Number(row.total) / topMax) * 100).toFixed(0)}%`,
  }));

  const profileCount = model.reduce((count, attribute) => count * attribute.levels.length, 1);

  const sim = conceptShares(concepts, model);
  const even = concepts.length ? 100 / concepts.length : 0;

  const conceptViews = concepts.map((concept, index) => {
    const share = sim.shares[index] ?? 0;
    const delta = share - even;
    return {
      ...concept,
      color: colorFor(index),
      share,
      shareLabel: `${share.toFixed(1)}%`,
      shareW: `${share.toFixed(1)}%`,
      deltaLabel: `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)} pts vs even split`,
      deltaColor: delta >= 0 ? '#2e8b6b' : '#c0553b',
      utilLabel: formatUtility(sim.utilities[index] ?? 0),
      votes: Math.round((share / 100) * filter.n),
      fields: model.map((attribute) => {
        const level = attribute.levels.find((item) => item.name === concept.picks[attribute.key]);
        const u = level?.u ?? 0;
        return {
          attrKey: attribute.key,
          label: attribute.name,
          value: concept.picks[attribute.key],
          options: attribute.levels,
          uLabel: `Part-worth ${formatUtility(u)}`,
          uColor: u >= 0 ? '#7b8490' : '#c0553b',
        };
      }),
    };
  });

  const topAttr = [...attrs].sort((a, b) => b.pct - a.pct)[0];
  const priceAttr = attrs.find((attribute) => attribute.key === 'price');
  const leader = [...conceptViews].sort((a, b) => b.share - a.share)[0];

  const insights = getConjointInsights(
    topAttr?.name ?? 'Brand',
    Math.round(topAttr?.pct ?? 0),
    Math.round(priceAttr?.pct ?? 0)
  );

  const statCards = [
    {
      label: 'Top driver',
      value: topAttr?.pctLabel ?? '—',
      sub: `${topAttr?.name ?? '—'} of the decision`,
    },
    {
      label: 'Price importance',
      value: priceAttr?.pctLabel ?? '—',
      sub: 'Sweet spot at USD 800–1500',
    },
    {
      label: 'Best profile share',
      value: leader?.shareLabel ?? '—',
      sub: 'Against current simulator set',
    },
    {
      label: 'Base',
      value: filter.n.toLocaleString(),
      sub: filter.label,
    },
  ];

  const activeSensId = concepts.some((concept) => concept.id === sensConceptId)
    ? sensConceptId
    : (concepts[0]?.id ?? 1);
  const sensIndex = concepts.findIndex((concept) => concept.id === activeSensId);
  const sensTarget = concepts.find((concept) => concept.id === activeSensId);
  const baseShare = sim.shares[sensIndex] ?? 0;

  const sensitivity = CONJOINT_PRICES.map((price) => {
    const alt = concepts.map((concept) =>
      concept.id === activeSensId
        ? { ...concept, picks: { ...concept.picks, price } }
        : concept
    );
    const share = conceptShares(alt, model).shares[sensIndex] ?? 0;
    const delta = share - baseShare;
    const isCurrent = price === sensTarget?.picks.price;
    return {
      price,
      share: `${share.toFixed(1)}%`,
      delta: isCurrent
        ? 'Current'
        : `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)} pts`,
      deltaColor: isCurrent ? '#8b949f' : delta >= 0 ? '#2e8b6b' : '#c0553b',
      isCurrent,
    };
  });

  // Price elasticity chart — use mock series for Brand (simple + polished)
  const elasticitySeries = CONJOINT_ELASTICITY_SERIES;
  const rawMax = Math.max(...elasticitySeries.flatMap((series) => series.values));
  const steps = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50];
  const step = steps.find((value) => value >= rawMax / 4) || Math.ceil(rawMax / 4);
  const yMax = step * 4;
  const xAt = (i: number) => 90 + i * ((960 - 90) / (CONJOINT_PRICES.length - 1 || 1));
  const yAt = (v: number) => 290 - (v / yMax) * 250;

  const chartSeries = elasticitySeries.map((series) => {
    const off = !!hiddenSeries[series.name];
    return {
      ...series,
      off,
      opacity: off ? 0.18 : 1,
      width: off ? 1.5 : 2.5,
      points: series.values.map((value, index) => `${xAt(index)},${yAt(value)}`).join(' '),
      dots: series.values.map((value, index) => ({ x: xAt(index), y: yAt(value) })),
      chipBg: off ? '#f7f8f9' : '#fff',
      chipBorder: off ? '#e6e9ec' : '#cfd4da',
    };
  });

  const visibleSeries = chartSeries.filter((series) => !series.off);
  const hi =
    hoverIdx === null || hoverIdx >= CONJOINT_PRICES.length ? null : hoverIdx;

  const pointLabels: Array<{
    left: string;
    top: string;
    transform: string;
    color: string;
    label: string;
  }> = [];
  CONJOINT_PRICES.forEach((_, i) => {
    const last = i === CONJOINT_PRICES.length - 1;
    const placed: number[] = [];
    [...visibleSeries]
      .sort((a, b) => b.values[i] - a.values[i])
      .forEach((series) => {
        if (placed.length >= 3) return;
        const yy = yAt(series.values[i]);
        if (placed.some((p) => Math.abs(p - yy) < 30)) return;
        placed.push(yy);
        pointLabels.push({
          left: `${(((xAt(i) + (last ? -9 : 9)) / 1000) * 100).toFixed(2)}%`,
          top: `${((yy / 360) * 100).toFixed(2)}%`,
          transform: last ? 'translate(-100%,-50%)' : 'translate(0,-50%)',
          color: series.color,
          label: `${series.values[i].toFixed(1)}%`,
        });
      });
  });

  const gridLines = [0, 1, 2, 3, 4].map((k) => ({
    y: yAt(step * k),
    topPct: `${((yAt(step * k) / 360) * 100).toFixed(2)}%`,
    label: `${step * k}%`,
  }));

  const xTicks = CONJOINT_PRICES.map((price, i) => ({
    leftPct: `${((xAt(i) / 1000) * 100).toFixed(2)}%`,
    topPct: `${((318 / 360) * 100).toFixed(2)}%`,
    label: price,
  }));

  const hoverBands = CONJOINT_PRICES.map((_, i) => {
    const half = (xAt(1) - xAt(0)) / 2;
    return { i, x: Math.max(0, xAt(i) - half), w: xAt(1) - xAt(0) };
  });

  const tooltip =
    hi === null
      ? null
      : {
          price: CONJOINT_PRICES[hi],
          left: `${((xAt(hi) / 1000) * 100).toFixed(2)}%`,
          top: '8%',
          transform:
            hi >= CONJOINT_PRICES.length - 2
              ? 'translateX(-100%)'
              : hi <= 1
                ? 'translateX(0)'
                : 'translateX(-50%)',
          rows: [...visibleSeries]
            .sort((a, b) => b.values[hi] - a.values[hi])
            .map((series) => ({
              color: series.color,
              name: series.name,
              value: `${series.values[hi].toFixed(1)}%`,
            })),
        };

  const brandLevels = model.find((attribute) => attribute.key === 'brand')?.levels ?? [];

  function updateConceptName(id: number, name: string) {
    setConcepts((prev) => prev.map((concept) => (concept.id === id ? { ...concept, name } : concept)));
  }

  function updateConceptLevel(id: number, attrKey: string, value: string) {
    setConcepts((prev) =>
      prev.map((concept) =>
        concept.id === id
          ? { ...concept, picks: { ...concept.picks, [attrKey]: value } }
          : concept
      )
    );
  }

  function removeConcept(id: number) {
    setConcepts((prev) => (prev.length > 2 ? prev.filter((concept) => concept.id !== id) : prev));
  }

  function addConcept() {
    const id = nextId;
    setNextId((n) => n + 1);
    setConcepts((prev) => [
      ...prev,
      { id, name: `Concept ${prev.length + 1}`, picks: defaultPicks() },
    ]);
    setSensConceptId(id);
  }

  function openCreateBase(): void {
    setBaseDraftName(`Custom base ${nextCustomBaseNum}`);
    setBaseDraftFilters(createDefaultBaseFilterState());
    setIsCreateBaseOpen(true);
  }

  function handleCreateBase(): void {
    const base = buildConjointBaseFromFilters(baseDraftName, baseDraftFilters);
    const next: CustomConjointFilter = { ...base, id: `custom-${nextCustomBaseNum}` };
    setCustomFilters((prev) => [next, ...prev]);
    setFilterId(next.id);
    setNextCustomBaseNum((n) => n + 1);
    setIsCreateBaseOpen(false);
  }

  function applyPreset(presetId: (typeof PRESETS)[number]['id']) {
    const best = bestPicksForModel(model);
    if (presetId === 'best') {
      setConcepts([
        { id: 91, name: 'Optimal profile', picks: clonePicks(best) },
        {
          id: 92,
          name: 'Current flagship',
          picks: { ...clonePicks(best), brand: 'Samsung', price: 'USD 2500' },
        },
      ]);
      setNextId(93);
      setSensConceptId(91);
      return;
    }
    if (presetId === 'price') {
      setConcepts([
        {
          id: 81,
          name: 'Good — USD 1200',
          picks: {
            ...clonePicks(best),
            price: 'USD 1200',
            ram: '8GB DDR4 2400MHz',
            storage: '512GB SSD PCIe',
          },
        },
        { id: 82, name: 'Better — USD 1500', picks: { ...clonePicks(best), price: 'USD 1500' } },
        { id: 83, name: 'Best — USD 2500', picks: { ...clonePicks(best), price: 'USD 2500' } },
      ]);
      setNextId(84);
      setSensConceptId(81);
      return;
    }
    const brands = ['Apple', 'Lenovo', 'Dell'];
    setConcepts(
      brands.map((brand, index) => ({
        id: 71 + index,
        name: `${brand} equivalent`,
        picks: { ...clonePicks(best), brand, price: 'USD 1500' },
      }))
    );
    setNextId(74);
    setSensConceptId(71);
  }

  function toggleSeries(name: string) {
    setHiddenSeries((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <Link href={reportsHref} className={styles.backLink}>
            ← Reports
          </Link>
          <div className={styles.divider} />
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{reportName || 'Conjoint analysis'}</h1>
            <span className={styles.subtitle}>{questionLabel}</span>
          </div>
          <div className={styles.spacer} />
          <div className={styles.headerActions}>
            <span className={styles.metaLabel}>Base</span>
            <WuMenu
              Trigger={<BaseMenuTrigger label={filter.label} aria-label="Base filter" />}
              align="start"
            >
              {[...CONJOINT_FILTERS, ...customFilters].map((item) => (
                <WuMenuItem
                  key={item.id}
                  className={styles.baseMenuItem}
                  onSelect={() => setFilterId(item.id)}
                >
                  <span
                    className={`${styles.baseMenuCheck} ${
                      filterId === item.id ? styles.baseMenuCheckVisible : ''
                    }`}
                    aria-hidden
                  >
                    {filterId === item.id ? '✓' : ''}
                  </span>
                  <span>{item.label}</span>
                </WuMenuItem>
              ))}
              <WuMenuSeparatorItem />
              <WuMenuItem
                className={styles.baseMenuCreateItem}
                onSelect={() => openCreateBase()}
              >
                <span className={`wm-add ${styles.baseMenuCreateIcon}`} aria-hidden />
                Create new base
              </WuMenuItem>
            </WuMenu>
            <span className={styles.metaLabel}>n = {filter.n.toLocaleString()}</span>
            <div className={styles.divider} style={{ margin: '0 4px' }} />
            <WuButton variant="secondary" onClick={() => onExport?.()}>
              Export
            </WuButton>
            <WuButton onClick={() => onShare?.()}>Share report</WuButton>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Conjoint sections">
          {CONJOINT_SECTION_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navBtn} ${section === item.id ? styles.navBtnActive : ''}`}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <div className={styles.body}>
        <main className={styles.main}>
          {section === 'overview' && (
            <div className={styles.stack}>
              <div className={styles.statGrid}>
                {statCards.map((card) => (
                  <div key={card.label} className={`${styles.card} ${styles.cardPad}`}>
                    <div className={styles.statLabel}>{card.label}</div>
                    <div className={styles.statValue}>{card.value}</div>
                    <div className={styles.statSub}>{card.sub}</div>
                  </div>
                ))}
              </div>

              <div className={styles.overviewSplit}>
                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>What drives choice</h2>
                    <button
                      type="button"
                      className={styles.cardLink}
                      onClick={() => setSection('importance')}
                    >
                      Open detail ›
                    </button>
                  </div>
                  <div className={styles.barList}>
                    {attrs.map((attribute) => (
                      <div key={attribute.key} className={styles.barRow}>
                        <span className={styles.barName}>{attribute.name}</span>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{ background: attribute.color, width: attribute.barW }}
                          />
                        </div>
                        <span className={styles.barPct}>{attribute.pctLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>Read of the data</h2>
                  </div>
                  <div className={styles.insights}>
                    {insights.map((insight) => (
                      <div key={insight.title} className={styles.insight}>
                        <div
                          className={styles.insightAccent}
                          style={{ background: insight.accent }}
                        />
                        <div>
                          <div className={styles.insightTitle}>{insight.title}</div>
                          <div className={styles.insightBody}>{insight.body}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>Winning configuration</h2>
                  <button
                    type="button"
                    className={styles.cardLink}
                    onClick={() => setSection('profiles')}
                  >
                    All profiles ›
                  </button>
                </div>
                <div className={styles.winGrid}>
                  {bestFields.map((field) => (
                    <div key={field.attr} className={styles.winCell}>
                      <div className={styles.winAttr}>{field.attr}</div>
                      <div className={styles.winValue}>{field.value}</div>
                      <div className={styles.winUtil} style={{ color: field.uColor }}>
                        {field.uLabel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'importance' && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardHeadLeft}>
                  <h2 className={styles.cardTitle}>Attribute importance &amp; part-worths</h2>
                  <div className={styles.cardSub}>
                    Importance is the utility range of each attribute, as a share of all ranges.
                  </div>
                </div>
                <div className={styles.legend}>
                  <span className={styles.legendItem}>
                    <span className={styles.swatch} style={{ background: '#2e8b6b' }} />
                    Above average
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.swatch} style={{ background: '#c0553b' }} />
                    Below average
                  </span>
                </div>
              </div>
              {attrs.map((attribute) => (
                <div key={attribute.key} className={styles.attrRow}>
                  <div>
                    <div className={styles.attrName}>{attribute.name}</div>
                    <div className={styles.attrPct}>{attribute.pctLabel}</div>
                    <div className={styles.attrBarTrack}>
                      <div
                        className={styles.attrBarFill}
                        style={{ background: attribute.color, width: attribute.barW }}
                      />
                    </div>
                    <div className={styles.attrMeta}>
                      {attribute.levelCount} levels · range {attribute.rangeLabel}
                    </div>
                  </div>
                  <div className={styles.levelList}>
                    {attribute.levels.map((level) => (
                      <div key={level.name} className={styles.levelRow}>
                        <span className={styles.levelName}>{level.name}</span>
                        <div className={styles.negWrap}>
                          <div className={styles.negBar} style={{ width: level.negW }} />
                        </div>
                        <div className={styles.zeroLine} />
                        <div>
                          <div className={styles.posBar} style={{ width: level.posW }} />
                        </div>
                        <span className={styles.levelUtil} style={{ color: level.color }}>
                          {level.uLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'profiles' && (
            <div className={styles.stack}>
              <div className={styles.profilePair}>
                <div className={styles.bestCard}>
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>Best profile</h2>
                    <span className={styles.partWorthGood}>Part-worth {bestTotal}</span>
                  </div>
                  {bestFields.map((field) => (
                    <div key={field.attr} className={styles.profileField}>
                      <span className={styles.profileAttr}>{field.attr}</span>
                      <span className={styles.profileValue}>{field.value}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.worstCard}>
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>Worst profile</h2>
                    <span className={styles.partWorthBad}>Part-worth {worstTotal}</span>
                  </div>
                  {worstFields.map((field) => (
                    <div key={field.attr} className={styles.profileField}>
                      <span className={styles.profileAttr}>{field.attr}</span>
                      <span className={styles.profileValue}>{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.cardHeadLeft}>
                    <h2 className={styles.cardTitle}>Ranked profiles</h2>
                    <div className={styles.cardSub}>
                      {profileCount.toLocaleString()} possible configurations · showing top 25
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={styles.metaLabel}>Must include</span>
                    <select
                      className={styles.select}
                      value={profileBrand}
                      onChange={(e) => setProfileBrand(e.target.value)}
                      aria-label="Brand filter"
                    >
                      <option value="all">Any brand</option>
                      {brandLevels.map((level) => (
                        <option key={level.name} value={level.name}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {PROFILE_COLS.map((col) => (
                          <th key={col.label} style={{ textAlign: col.align }}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {profileRows.map((row) => (
                        <tr key={String(row.rank)}>
                          <td className={styles.rankCell}>{row.rank}</td>
                          <td className={styles.brandCell}>{row.brand}</td>
                          <td className={styles.priceCell}>{row.price}</td>
                          <td className={styles.specCell}>{row.processor}</td>
                          <td className={styles.specCell}>{row.ram}</td>
                          <td className={styles.specCell}>{row.storage}</td>
                          <td className={styles.specCell}>{row.graphics}</td>
                          <td className={styles.totalCell}>
                            <span className={styles.totalInner}>
                              <span className={styles.miniTrack}>
                                <span className={styles.miniFill} style={{ width: row.barW }} />
                              </span>
                              <b className={styles.totalNum}>{row.total}</b>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === 'simulator' && (
            <div className={styles.stack}>
              <div className={styles.simToolbar}>
                <div className={styles.simToolbarMain}>
                  <h2 className={styles.cardTitle}>Market share simulator</h2>
                  <div className={styles.cardSub}>
                    Every edit re-runs the model instantly — no setup step.
                  </div>
                </div>
                <div className={styles.simActions}>
                  <span className={styles.metaLabel}>Start from</span>
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={styles.chipBtn}
                      onClick={() => applyPreset(preset.id)}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <div className={styles.divider} />
                  <button type="button" className={styles.primaryBtn} onClick={addConcept}>
                    + Add concept
                  </button>
                </div>
              </div>

              <div className={styles.conceptRow}>
                {conceptViews.map((concept) => (
                  <div
                    key={concept.id}
                    className={styles.conceptCard}
                    style={{ borderTop: `3px solid ${concept.color}` }}
                  >
                    <div className={styles.conceptHead}>
                      <div className={styles.conceptTitleRow}>
                        <input
                          className={styles.conceptName}
                          value={concept.name}
                          onChange={(e) => updateConceptName(concept.id, e.target.value)}
                          aria-label="Concept name"
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          title="Remove concept"
                          onClick={() => removeConcept(concept.id)}
                        >
                          ×
                        </button>
                      </div>
                      <div className={styles.shareRow}>
                        <span className={styles.sharePct}>{concept.shareLabel}</span>
                        <span className={styles.shareDelta} style={{ color: concept.deltaColor }}>
                          {concept.deltaLabel}
                        </span>
                      </div>
                      <div className={styles.shareTrack}>
                        <div
                          className={styles.shareFill}
                          style={{ background: concept.color, width: concept.shareW }}
                        />
                      </div>
                      <div className={styles.shareMeta}>
                        Total part-worth {concept.utilLabel} · {concept.votes} of{' '}
                        {filter.n.toLocaleString()} respondents
                      </div>
                    </div>
                    <div className={styles.conceptFields}>
                      {concept.fields.map((field) => (
                        <label key={field.attrKey} className={styles.fieldLabel}>
                          <span className={styles.fieldKey}>{field.label}</span>
                          <select
                            className={styles.selectBlock}
                            value={field.value}
                            onChange={(e) =>
                              updateConceptLevel(concept.id, field.attrKey, e.target.value)
                            }
                          >
                            {field.options.map((option) => (
                              <option key={option.name} value={option.name}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                          <span className={styles.fieldUtil} style={{ color: field.uColor }}>
                            {field.uLabel}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>Price sensitivity of the selected concept</h2>
                  <select
                    className={styles.select}
                    value={activeSensId}
                    onChange={(e) => setSensConceptId(Number(e.target.value))}
                    aria-label="Sensitivity concept"
                  >
                    {concepts.map((concept) => (
                      <option key={concept.id} value={concept.id}>
                        {concept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.sensGrid}>
                  {sensitivity.map((item) => (
                    <div
                      key={item.price}
                      className={`${styles.sensCell} ${item.isCurrent ? styles.sensCellCurrent : ''}`}
                    >
                      <div className={styles.sensPrice}>{item.price}</div>
                      <div className={styles.sensShare}>{item.share}</div>
                      <div className={styles.sensDelta} style={{ color: item.deltaColor }}>
                        {item.delta}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'premium' && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardHeadLeft} style={{ flex: 1, minWidth: 280 }}>
                  <h2 className={styles.cardTitle}>Price elasticity against Brand</h2>
                  <div className={styles.cardSub}>
                    Share of preference across every brand × price combination — flatter lines hold
                    their share as price rises.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={styles.metaLabel}>Elasticity against</span>
                  <select
                    className={styles.select}
                    value={premiumAttr}
                    onChange={(e) => {
                      setPremiumAttr(e.target.value);
                      setHiddenSeries({});
                      setHoverIdx(null);
                    }}
                    aria-label="Elasticity attribute"
                  >
                    <option value="brand">Brand</option>
                  </select>
                </div>
              </div>
              <div className={styles.chartPad}>
                <div className={styles.chartWrap}>
                  <svg viewBox="0 0 1000 360" className={styles.chartSvg} role="img" aria-label="Price elasticity chart">
                    {gridLines.map((line) => (
                      <line
                        key={line.label}
                        x1={90}
                        x2={960}
                        y1={line.y}
                        y2={line.y}
                        stroke="#eef1f4"
                        strokeWidth={1}
                      />
                    ))}
                    {chartSeries.map((series) => (
                      <g key={series.name} opacity={series.opacity}>
                        <polyline
                          points={series.points}
                          fill="none"
                          stroke={series.color}
                          strokeWidth={series.width}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        {series.dots.map((dot, index) => (
                          <circle
                            key={`${series.name}-${index}`}
                            cx={dot.x}
                            cy={dot.y}
                            r={3.5}
                            fill="#fff"
                            stroke={series.color}
                            strokeWidth={2}
                          />
                        ))}
                      </g>
                    ))}
                    {hi !== null && (
                      <line
                        x1={xAt(hi)}
                        x2={xAt(hi)}
                        y1={40}
                        y2={290}
                        stroke="#c3ccd4"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                    )}
                    {hoverBands.map((band) => (
                      <rect
                        key={band.i}
                        x={band.x}
                        y={30}
                        width={band.w}
                        height={270}
                        fill="transparent"
                        onMouseEnter={() => setHoverIdx(band.i)}
                        onMouseLeave={() => setHoverIdx(null)}
                      />
                    ))}
                  </svg>

                  {tooltip && (
                    <div
                      className={styles.chartTooltip}
                      style={{
                        left: tooltip.left,
                        top: tooltip.top,
                        transform: tooltip.transform,
                      }}
                    >
                      <div className={styles.tooltipPrice}>{tooltip.price}</div>
                      {tooltip.rows.map((row) => (
                        <div key={row.name} className={styles.tooltipRow}>
                          <span
                            className={styles.tooltipDot}
                            style={{ background: row.color }}
                          />
                          <span className={styles.tooltipName}>{row.name}</span>
                          <b className={styles.tooltipVal}>{row.value}</b>
                        </div>
                      ))}
                    </div>
                  )}

                  {pointLabels.map((label, index) => (
                    <div
                      key={`${label.label}-${index}`}
                      className={styles.pointLabel}
                      style={{
                        left: label.left,
                        top: label.top,
                        transform: label.transform,
                        color: label.color,
                      }}
                    >
                      {label.label}
                    </div>
                  ))}

                  {gridLines.map((line) => (
                    <div
                      key={`y-${line.label}`}
                      className={styles.yLabel}
                      style={{ top: line.topPct }}
                    >
                      {line.label}
                    </div>
                  ))}

                  {xTicks.map((tick) => (
                    <div
                      key={tick.label}
                      className={styles.xLabel}
                      style={{ left: tick.leftPct, top: tick.topPct }}
                    >
                      {tick.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.seriesChips}>
                {chartSeries.map((series) => (
                  <button
                    key={series.name}
                    type="button"
                    className={`${styles.seriesChip} ${series.off ? styles.seriesChipOff : ''}`}
                    onClick={() => toggleSeries(series.name)}
                  >
                    <span className={styles.seriesSwatch} style={{ background: series.color }} />
                    {series.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === 'setup' && (
            <div className={styles.stack}>
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.cardHeadLeft}>
                    <h2 className={styles.cardTitle}>Attributes &amp; levels</h2>
                    <div className={styles.cardSub}>
                      {surveyName} · Hierarchical Bayes · 6 attributes · 28 levels · fit R² 0.81 ·
                      last run 12 Mar
                    </div>
                  </div>
                </div>
                {CONJOINT_BASE_ATTRIBUTES.map((attribute) => (
                  <div key={attribute.key} className={styles.setupAttr}>
                    <div>
                      <div className={styles.setupAttrName}>{attribute.name}</div>
                      <div className={styles.setupAttrMeta}>
                        {attribute.type} · {attribute.levels.length} levels
                      </div>
                    </div>
                    <div className={styles.chips}>
                      {attribute.levels.map((level) => (
                        <span key={level.name} className={styles.levelChip}>
                          {level.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.cardHeadLeft}>
                    <h2 className={styles.cardTitle}>Base</h2>
                    <div className={styles.cardSub}>
                      Filter the model to a respondent subset. Importance and shares update live.
                    </div>
                  </div>
                </div>
                <div className={styles.filterGrid}>
                  {[...CONJOINT_FILTERS, ...customFilters].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.filterCard} ${
                        filterId === item.id ? styles.filterCardActive : ''
                      }`}
                      onClick={() => setFilterId(item.id)}
                    >
                      <div className={styles.filterCardLabel}>{item.label}</div>
                      <div className={styles.filterCardN}>{item.n.toLocaleString()}</div>
                      <div className={styles.filterCardNote}>{item.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>Model meta</h2>
                </div>
                <div className={styles.metaStrip}>
                  <div className={styles.metaCell}>
                    <div className={styles.metaKey}>Estimation</div>
                    <div className={styles.metaVal}>Hierarchical Bayes</div>
                  </div>
                  <div className={styles.metaCell}>
                    <div className={styles.metaKey}>Attributes</div>
                    <div className={styles.metaVal}>6</div>
                  </div>
                  <div className={styles.metaCell}>
                    <div className={styles.metaKey}>Levels</div>
                    <div className={styles.metaVal}>28</div>
                  </div>
                  <div className={styles.metaCell}>
                    <div className={styles.metaKey}>Fit R²</div>
                    <div className={styles.metaVal}>0.81</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {wick && (
        (() => {
          const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;
          return (
            <WuModal
              open={isCreateBaseOpen}
              onOpenChange={setIsCreateBaseOpen}
              variant="action"
              size="lg"
              maxWidth="min(980px, calc(100vw - 2rem))"
              className={styles.baseModal}
            >
              <WuModalHeader className={styles.baseModalHeader}>
                Create new base
              </WuModalHeader>
              <WuModalContent className={styles.baseModalContent}>
                <div className={styles.baseModalGrid}>
                  <div className={styles.baseField}>
                    <div className={styles.baseFieldLabel}>Base name</div>
                    <input
                      className={styles.baseInput}
                      value={baseDraftName}
                      onChange={(e) => setBaseDraftName(e.target.value)}
                      aria-label="Base name"
                    />
                  </div>
                  <div className={styles.baseFieldHint}>
                    Filter respondents the same way you would in a dashboard. Every report
                    section recalculates against the new base.
                  </div>
                </div>

                <BaseFilterForm
                  values={baseDraftFilters}
                  onChange={setBaseDraftFilters}
                  totalRespondents={CONJOINT_TOTAL_RESPONDENTS}
                />
              </WuModalContent>
              <WuModalFooter className={styles.baseModalFooter}>
                <WuButton variant="secondary" onClick={() => setIsCreateBaseOpen(false)}>
                  Cancel
                </WuButton>
                <WuButton onClick={handleCreateBase}>Create base</WuButton>
              </WuModalFooter>
            </WuModal>
          );
        })()
      )}
    </div>
  );
}
