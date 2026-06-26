'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  getVideoAiQuestionDetail,
  type SentimentValue,
  type VideoAiResponse,
} from '@/data/mock-video-ai-detail';
import {
  MOCK_HIGHLIGHT_REEL,
  RESPONSE_VIDEO_URLS,
  type ReelClip,
} from '@/data/mock-video-ai-reel';
import { VideoPlayerModal } from './VideoPlayerModal';
import {
  videoAiListHref,
} from './videoAiNavigation';
import {
  SENTIMENT_BADGE_COLORS,
  SENTIMENT_CHART_COLORS,
} from '@/data/sentiment-colors';
import styles from './VideoAiQuestionDetail.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const PAGE_SIZE = 5;

type SentimentFilter = 'all' | 'Positive' | 'Neutral' | 'Negative';
type ViewFilter = 'all' | 'viewed' | 'not-viewed';
type SortOrder = 'newest' | 'oldest' | 'longest' | 'shortest';

const SENTIMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All sentiments' },
  { value: 'Positive', label: 'Positive' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Negative', label: 'Negative' },
];
const VIEW_FILTER_OPTIONS = [
  { value: 'all', label: 'All responses' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'not-viewed', label: 'Not viewed' },
];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'longest', label: 'Longest first' },
  { value: 'shortest', label: 'Shortest first' },
];

const SENTIMENT_CONFIG: Record<
  SentimentValue,
  { barColor: string; badgeBg: string; badgeText: string }
> = {
  Positive: {
    barColor: SENTIMENT_CHART_COLORS.Positive,
    badgeBg: SENTIMENT_BADGE_COLORS.Positive.bg,
    badgeText: SENTIMENT_BADGE_COLORS.Positive.text,
  },
  Neutral: {
    barColor: SENTIMENT_CHART_COLORS.Neutral,
    badgeBg: SENTIMENT_BADGE_COLORS.Neutral.bg,
    badgeText: SENTIMENT_BADGE_COLORS.Neutral.text,
  },
  Negative: {
    barColor: SENTIMENT_CHART_COLORS.Negative,
    badgeBg: SENTIMENT_BADGE_COLORS.Negative.bg,
    badgeText: SENTIMENT_BADGE_COLORS.Negative.text,
  },
};

// ── Pie chart helpers ─────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(
  cx: number, cy: number, outer: number, inner: number,
  start: number, end: number,
) {
  const sweep = Math.min(end - start, 359.99);
  const large = sweep > 180 ? 1 : 0;
  const os  = polarToCartesian(cx, cy, outer, start);
  const oe  = polarToCartesian(cx, cy, outer, start + sweep);
  const ie  = polarToCartesian(cx, cy, inner, start + sweep);
  const is_ = polarToCartesian(cx, cy, inner, start);
  return [
    `M ${os.x} ${os.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${is_.x} ${is_.y}`,
    'Z',
  ].join(' ');
}

// ── Sentiment donut widget ────────────────────────────────────────────────────

function SentimentDonut({
  positive, neutral, negative, activeFilter, onSegmentClick,
}: {
  positive: number; neutral: number; negative: number;
  activeFilter: SentimentFilter;
  onSegmentClick: (s: SentimentFilter) => void;
}) {
  const cx = 44; const cy = 44; const outer = 36; const inner = 22;
  const total = positive + neutral + negative || 1;
  const segments: { key: SentimentFilter; pct: number }[] = [
    { key: 'Positive', pct: positive / total },
    { key: 'Neutral',  pct: neutral  / total },
    { key: 'Negative', pct: negative / total },
  ];
  let cursor = 0;
  const slices = segments.map(({ key, pct }) => {
    const start = cursor * 360;
    const sweep = pct * 360;
    cursor += pct;
    return { key, start, sweep, isActive: activeFilter === key, color: SENTIMENT_CONFIG[key as SentimentValue].barColor };
  });

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 88 88" className={styles.donutSvg} aria-hidden>
        {slices.map(({ key, start, sweep, isActive, color }) =>
          sweep > 0 ? (
            <path
              key={key}
              d={donutSlicePath(cx, cy, outer, inner, start, start + sweep)}
              fill={color}
              className={styles.donutSlice}
              data-active={isActive}
              onClick={() => onSegmentClick(key)}
              role="button"
              aria-label={`${key} — click to filter`}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSegmentClick(key); }}
            />
          ) : null
        )}
      </svg>
      <div className={styles.sentimentLegend}>
        {(['Positive', 'Neutral', 'Negative'] as SentimentValue[]).map((s) => {
          const pct = s === 'Positive' ? positive : s === 'Neutral' ? neutral : negative;
          const cfg = SENTIMENT_CONFIG[s];
          const isActive = activeFilter === s;
          return (
            <button
              key={s}
              type="button"
              className={`${styles.legendItem} ${isActive ? styles.legendItemActive : ''}`}
              style={isActive ? { color: cfg.badgeText, borderColor: cfg.barColor, background: cfg.badgeBg } : {}}
              onClick={() => onSegmentClick(s)}
            >
              <span className={styles.legendDot} style={{ background: cfg.barColor }} />
              {pct}% {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sentiment badge ───────────────────────────────────────────────────────────

function SentimentBadge({ sentiment }: { sentiment: SentimentValue }) {
  const cfg = SENTIMENT_CONFIG[sentiment];
  return (
    <span className={styles.sentimentBadge} style={{ background: cfg.badgeBg, color: cfg.badgeText }}>
      {sentiment}
    </span>
  );
}

// ── Kebab menu ────────────────────────────────────────────────────────────────

function KebabMenu({ onEdit }: { onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [open]);

  return (
    <div className={styles.kebabWrap} ref={ref}>
      <button
        type="button"
        className={`${styles.kebabBtn} ${open ? styles.kebabBtnActive : ''}`}
        aria-label="More actions"
        title="More actions"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      >
        <span className="wm-more-vert" aria-hidden />
      </button>
      {open && (
        <div className={styles.kebabMenu}>
          <button
            type="button"
            className={styles.kebabItem}
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
          >
            <span className="wm-edit" aria-hidden />
            Edit AI content
          </button>
        </div>
      )}
    </div>
  );
}

// ── Edit AI content popover ───────────────────────────────────────────────────

function EditAiPopover({
  responseId,
  initialSummary,
  initialTranscript,
  onSave,
  onClose,
}: {
  responseId: string;
  initialSummary: string;
  initialTranscript: string;
  onSave: (summary: string, transcript: string) => void;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [transcript, setTranscript] = useState(initialTranscript);

  return createPortal(
    <div className={styles.editModalOverlay} onClick={onClose}>
      <div className={styles.editModalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.editModalHeader}>
          <p className={styles.editPopoverTitle}>Edit AI content</p>
          <button type="button" className={styles.editModalClose} onClick={onClose} aria-label="Close">
            <span className="wm-close" aria-hidden />
          </button>
        </div>
        <div className={styles.editSection}>
          <label className={styles.editLabel} htmlFor={`summary-${responseId}`}>Summary</label>
          <textarea
            id={`summary-${responseId}`}
            className={styles.editTextarea}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
          />
        </div>
        <div className={styles.editSection}>
          <label className={styles.editLabel} htmlFor={`transcript-${responseId}`}>Transcript</label>
          <textarea
            id={`transcript-${responseId}`}
            className={styles.editTextarea}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
          />
        </div>
        <div className={styles.editPopoverActions}>
          <button type="button" className={styles.editCancelBtn} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.editSaveBtn} onClick={() => onSave(summary, transcript)}>Save changes</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ResponseFocusModal removed — replaced by VideoPlayerModal

// ── Response card ─────────────────────────────────────────────────────────────

function ResponseCard({
  response,
  sentimentOverride,
  textOverrides,
  onSentimentOverride,
  onTextOverride,
  onOpenModal,
}: {
  response: VideoAiResponse;
  sentimentOverride: SentimentValue | null;
  textOverrides: { summary?: string; transcript?: string };
  onSentimentOverride: (id: string, s: SentimentValue) => void;
  onTextOverride: (id: string, field: 'summary' | 'transcript', value: string) => void;
  onOpenModal: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const [editOpen, setEditOpen] = useState(false);
  const [votes, setVotes] = useState<{ summary: boolean | null; transcript: boolean | null }>({
    summary: null,
    transcript: null,
  });
  const { showToast } = useWuShowToast();

  const effectiveSentiment = sentimentOverride ?? response.sentiment;
  const displaySummary    = textOverrides.summary    ?? response.summary;
  const displayTranscript = textOverrides.transcript ?? response.transcript;

  function handleVote(value: boolean) {
    setVotes((prev) => {
      const current = prev[activeTab];
      const next = current === value ? null : value;
      showToast({ message: next === true ? 'Liked' : next === false ? 'Disliked' : 'Vote removed', variant: 'success' });
      return { ...prev, [activeTab]: next };
    });
  }

  function handleSave(sum: string, trans: string) {
    onTextOverride(response.id, 'summary', sum);
    onTextOverride(response.id, 'transcript', trans);
    setEditOpen(false);
    showToast({ message: 'AI content updated', variant: 'success' });
  }

  const currentVote = votes[activeTab];

  return (
    <>
      <article
        className={styles.responseCard}
        onClick={onOpenModal}
        role="button"
        tabIndex={0}
        aria-label={`Open response ${response.id}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenModal(); } }}
      >
        {/* Left: video thumbnail */}
        <div className={styles.videoThumb}>
          <svg className={styles.videoThumbSvg} viewBox="0 0 140 95" fill="none" aria-hidden>
            <rect width="140" height="95" rx="6" fill="#1e293b" />
            <circle cx="70" cy="44" r="18" fill="rgba(255,255,255,0.15)" />
            <polygon points="64,36 64,52 80,44" fill="white" />
          </svg>
          <span className={styles.durationBadge}>{response.duration}</span>
        </div>

        {/* Center: content */}
        <div className={styles.cardContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.cardHeader}>
            <span className={styles.respondentId}>{response.id}</span>
            <span className={styles.cardDate}>{response.date}</span>
            <span className={styles.langTag}>{response.language}</span>
          </div>

          <div className={styles.tabRow} role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'summary'}
              className={`${styles.tabBtn} ${activeTab === 'summary' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'transcript'}
              className={`${styles.tabBtn} ${activeTab === 'transcript' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>
          </div>

          <p className={styles.cardText}>
            {activeTab === 'summary' ? displaySummary : displayTranscript}
          </p>
        </div>

        {/* Right: sentiment badge + like/dislike + kebab */}
        <div className={styles.cardRight} onClick={(e) => e.stopPropagation()}>
          <div className={styles.sentimentRow}>
            <SentimentBadge sentiment={effectiveSentiment} />
            <button
              type="button"
              className={`${styles.actionBtn} ${currentVote === true ? styles.actionBtnActive : ''}`}
              aria-label="Like"
              title={`Like ${activeTab}`}
              onClick={() => handleVote(true)}
            >
              <span className="wm-thumb-up" aria-hidden />
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${currentVote === false ? styles.actionBtnActive : ''}`}
              aria-label="Dislike"
              title={`Dislike ${activeTab}`}
              onClick={() => handleVote(false)}
            >
              <span className="wm-thumb-down" aria-hidden />
            </button>
            <KebabMenu onEdit={() => setEditOpen(true)} />
          </div>
        </div>
      </article>

      {editOpen && (
        <EditAiPopover
          responseId={response.id}
          initialSummary={displaySummary}
          initialTranscript={displayTranscript}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function VideoAiQuestionDetail({ questionId }: { questionId: string }) {
  const router = useRouter();
  const detail = getVideoAiQuestionDetail(questionId);
  const { showToast } = useWuShowToast();

  function handleBreadcrumbBack() {
    router.push(videoAiListHref());
  }

  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [sentimentOverrides, setSentimentOverrides] = useState<Record<string, SentimentValue>>({});
  const [textOverrides, setTextOverrides]   = useState<Record<string, { summary?: string; transcript?: string }>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'responses' | 'reels'>('responses');
  const [reels, setReels] = useState<ReelClip[]>(MOCK_HIGHLIGHT_REEL.clips);

  function handleSaveClip(clip: ReelClip) {
    setReels((prev) => [...prev, { ...clip, clipNumber: prev.length + 1 }]);
    setActiveTab('reels');
    showToast({ message: 'Clip saved to Reels', variant: 'success' });
  }

  function handleDeleteClip(clipNumber: number) {
    setReels((prev) => prev.filter((c) => c.clipNumber !== clipNumber));
    showToast({ message: 'Clip removed', variant: 'info' });
  }

  useEffect(() => {
    if (!downloadOpen) return;
    function onOutside(e: MouseEvent) {
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) setDownloadOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [downloadOpen]);


  const sentimentFilterOpt = SENTIMENT_FILTER_OPTIONS.find((o) => o.value === sentimentFilter)!;
  const viewFilterOpt      = VIEW_FILTER_OPTIONS.find((o) => o.value === viewFilter)!;
  const sortOpt            = SORT_OPTIONS.find((o) => o.value === sort)!;
  const isFiltered = sentimentFilter !== 'all' || viewFilter !== 'all' || search.trim() !== '';

  function applyFilter<T>(setter: (v: T) => void, value: T) { setter(value); setPage(1); }
  function handleSegmentClick(s: SentimentFilter) { applyFilter(setSentimentFilter, sentimentFilter === s ? 'all' : s); }
  function handleSentimentOverride(id: string, s: SentimentValue) { setSentimentOverrides((p) => ({ ...p, [id]: s })); }
  function handleTextOverride(id: string, field: 'summary' | 'transcript', value: string) {
    setTextOverrides((p) => ({ ...p, [id]: { ...p[id], [field]: value } }));
  }
  function handleRefreshAi() {
    setAiRefreshing(true);
    setTimeout(() => { setAiRefreshing(false); showToast({ message: 'AI summary refreshed', variant: 'success' }); }, 1400);
  }

  const filtered = useMemo(() => {
    if (!detail) return [];
    let result = detail.responses.map((r) => ({ ...r, sentiment: sentimentOverrides[r.id] ?? r.sentiment }));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.id.includes(q) || r.summary.toLowerCase().includes(q) || r.transcript.toLowerCase().includes(q));
    }
    if (sentimentFilter !== 'all') result = result.filter((r) => r.sentiment === sentimentFilter);
    if (viewFilter === 'viewed')     result = result.filter((r) => r.viewed);
    if (viewFilter === 'not-viewed') result = result.filter((r) => !r.viewed);
    result = [...result].sort((a, b) => {
      if (sort === 'newest')  return new Date(b.date).getTime() - new Date(a.date).getTime() || b.durationSeconds - a.durationSeconds;
      if (sort === 'oldest')  return new Date(a.date).getTime() - new Date(b.date).getTime() || a.durationSeconds - b.durationSeconds;
      if (sort === 'longest') return b.durationSeconds - a.durationSeconds;
      return a.durationSeconds - b.durationSeconds;
    });
    return result;
  }, [detail, search, sentimentFilter, viewFilter, sort, sentimentOverrides]);

  // Safe to return null here — all hooks have been called unconditionally above.
  if (!detail) return null;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startItem  = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem    = Math.min(page * PAGE_SIZE, filtered.length);
  const { positive, neutral, negative } = detail.sentiment;


  return (
    <div className={styles.page}>

      {/* ── Page header row: breadcrumb + download ─────────────────── */}
      <div className={styles.pageHeaderRow}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <button type="button" className={styles.breadcrumbLink} onClick={handleBreadcrumbBack}>
            <span className="wm-arrow-back" aria-hidden />
            VideoAI Analysis
          </button>
          <span className={styles.breadcrumbSep} aria-hidden>›</span>
          <span className={styles.breadcrumbCurrent} title={detail.question}>{detail.question}</span>
        </nav>

        {/* Download dropdown */}
        <div className={styles.downloadWrap} ref={downloadRef}>
          <button
            type="button"
            className={`${styles.downloadBtn} ${downloadOpen ? styles.downloadBtnActive : ''}`}
            aria-label="Download report"
            title="Download"
            onClick={() => setDownloadOpen((v) => !v)}
          >
            <span className="wm-download" aria-hidden />
          </button>
          {downloadOpen && (
            <div className={styles.downloadMenu}>
              <button
                type="button"
                className={styles.downloadItem}
                onClick={() => {
                  setDownloadOpen(false);
                  showToast({ message: 'Downloading Video + CSV Report…', variant: 'info' });
                }}
              >
                <span className="wm-videocam" aria-hidden />
                Video + CSV Report
              </button>
              <button
                type="button"
                className={styles.downloadItem}
                onClick={() => {
                  setDownloadOpen(false);
                  showToast({ message: 'Downloading CSV Report…', variant: 'info' });
                }}
              >
                <span className="wm-table-chart" aria-hidden />
                CSV Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary widgets (3 cards) ───────────────────────────────── */}
      <div className={styles.widgetsRow}>
        <div className={styles.widget}>
          <div className={styles.widgetLabel}><span className="wm-group" aria-hidden />Responses</div>
          <div className={styles.widgetValue}>{detail.totalResponses}</div>
          <div className={styles.widgetSub}>{detail.analyzedResponses} analyzed · {detail.totalResponses - detail.analyzedResponses} pending</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetLabel}><span className="wm-pie-chart" aria-hidden />Sentiment</div>
          <SentimentDonut positive={positive} neutral={neutral} negative={negative}
            activeFilter={sentimentFilter} onSegmentClick={handleSegmentClick} />
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetLabel}><span className="wm-schedule" aria-hidden />Avg. duration</div>
          <div className={styles.widgetValue}>{detail.avgDuration}</div>
          <div className={styles.widgetSub}>Range: {detail.durationRange.min} – {detail.durationRange.max}</div>
        </div>
      </div>

      {/* ── AI summary ──────────────────────────────────────────────── */}
      <div className={styles.aiCard}>
        <div className={styles.aiCardHeader}>
          <span className={styles.aiCardTitle}>
            <span className="wc-ai" aria-hidden />
            AI summary
          </span>
          <div className={styles.aiCardActions}>
            <button
              type="button"
              className={`${styles.aiRefreshBtn} ${aiRefreshing ? styles.aiRefreshBtnSpinning : ''}`}
              aria-label="Refresh AI summary"
              title="Refresh AI summary"
              onClick={handleRefreshAi}
              disabled={aiRefreshing}
            >
              <span className="wm-refresh" aria-hidden />
            </button>
            <button type="button" className={styles.aiToggleBtn} onClick={() => setAiExpanded((v) => !v)}>
              {aiExpanded ? 'Show less' : 'Show more'}
              <span className={`wm-expand-more ${styles.aiToggleIcon} ${aiExpanded ? styles.aiToggleIconExpanded : ''}`} aria-hidden />
            </button>
          </div>
        </div>
        <p className={`${styles.aiText} ${!aiExpanded ? styles.aiTextClamped : ''}`}>
          {aiRefreshing ? 'Refreshing AI summary…' : detail.aiSummary}
        </p>
      </div>

      {/* ── Page tabs: Responses / Reels ──────────────────────────── */}
      <div className={styles.pageTabs} role="tablist">
        {(['responses', 'reels'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`${styles.pageTab} ${activeTab === tab ? styles.pageTabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'responses' && <span className="wm-videocam" aria-hidden />}
            {tab === 'reels' && <span className="wm-movie" aria-hidden />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'reels' && <span className={`wc-ai ${styles.pageTabAiIcon}`} aria-hidden />}
            {tab === 'reels' && (
              <span className={styles.pageTabComingSoon}>Coming Soon</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Responses tab ───────────────────────────────────────────── */}
      {activeTab === 'responses' ? (
        <div className={styles.responsesSection}>
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <WuInput
              variant="outlined"
              placeholder="Search by ID, summary or transcript…"
              Icon={<span className="wm-search" />}
              iconPosition="left"
              value={search}
              onChange={(e) => applyFilter(setSearch, e.target.value)}
            />
          </div>
          <WuSelect data={SENTIMENT_FILTER_OPTIONS} accessorKey={{ value: 'value', label: 'label' }} value={sentimentFilterOpt}
            onSelect={(opt) => {
              if (!opt) return;
              applyFilter(setSentimentFilter, (opt as { value: SentimentFilter }).value);
            }}
            variant="outlined" className={styles.filterSelect} />
          <WuSelect data={VIEW_FILTER_OPTIONS} accessorKey={{ value: 'value', label: 'label' }} value={viewFilterOpt}
            onSelect={(opt) => {
              if (!opt) return;
              applyFilter(setViewFilter, (opt as { value: ViewFilter }).value);
            }}
            variant="outlined" className={styles.filterSelect} />
          <WuSelect data={SORT_OPTIONS} accessorKey={{ value: 'value', label: 'label' }} value={sortOpt}
            onSelect={(opt) => {
              if (!opt) return;
              applyFilter(setSort, (opt as { value: SortOrder }).value);
            }}
            variant="outlined" className={styles.filterSelect} />
        </div>

        <div className={styles.sectionDivider} />

        <p className={styles.responseCount}>
          {filtered.length} {filtered.length === 1 ? 'response' : 'responses'}
          {isFiltered && <span className={styles.responseCountFiltered}> (filtered)</span>}
        </p>

        <div className={styles.cardList}>
          {paginated.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={`wm-videocam ${styles.emptyIcon}`} aria-hidden />
              <p className={styles.emptyTitle}>No responses match your filters</p>
              <p className={styles.emptyDesc}>Try adjusting or clearing the search and filter options.</p>
            </div>
          ) : (
            paginated.map((r) => (
              <ResponseCard
                key={r.id}
                response={r}
                sentimentOverride={sentimentOverrides[r.id] ?? null}
                textOverrides={textOverrides[r.id] ?? {}}
                onSentimentOverride={handleSentimentOverride}
                onTextOverride={handleTextOverride}
                onOpenModal={() => setFocusedId(r.id)}
              />
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>Showing {startItem}–{endItem} of {filtered.length}</span>
            <div className={styles.paginationControls}>
              <WuButton variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</WuButton>
              <WuButton variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</WuButton>
            </div>
          </div>
        )}
        </div>
      ) : null}

      {/* ── Reels tab ───────────────────────────────────────────────── */}
      {activeTab === 'reels' ? (
        <div className={styles.reelsSection}>
          {reels.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={`wm-movie ${styles.emptyIcon}`} aria-hidden />
              <p className={styles.emptyTitle}>No reels yet</p>
              <p className={styles.emptyDesc}>
                Open a response and click <strong>Create Reels</strong> in the video player to clip a highlight.
              </p>
            </div>
          ) : (
            <div className={styles.reelsGrid}>
              {reels.map((clip) => {
                const videoUrl = RESPONSE_VIDEO_URLS[clip.responseId]
                  ?? 'https://assets.mixkit.co/videos/41290/41290-720.mp4';
                const sc = SENTIMENT_BADGE_COLORS[clip.sentiment];
                return (
                  <div key={`${clip.responseId}-${clip.clipNumber}`} className={styles.reelCard}>
                    {/* Thumbnail */}
                    <div className={styles.reelThumb}>
                      <video
                        src={videoUrl}
                        muted playsInline
                        className={styles.reelThumbVideo}
                        aria-hidden
                      />
                      <div className={styles.reelThumbOverlay}>
                        <span className={styles.reelDuration}>{clip.duration}</span>
                        <div className={styles.reelPlayIcon} aria-hidden>
                          <svg viewBox="0 0 24 24" width="28" height="28">
                            <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.45)" />
                            <polygon points="10,8 10,16 17,12" fill="white" />
                          </svg>
                        </div>
                        <span className={styles.reelRange}>{clip.start}s – {clip.end}s</span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className={styles.reelMeta}>
                      <div className={styles.reelMetaTop}>
                        <span className={styles.reelRespondent}>{clip.responseId}</span>
                        <button
                          type="button"
                          className={styles.reelDeleteBtn}
                          aria-label="Remove clip"
                          title="Remove clip"
                          onClick={() => handleDeleteClip(clip.clipNumber)}
                        >
                          <span className="wm-delete-outline" aria-hidden />
                        </button>
                      </div>
                      {clip.theme && (
                        <p className={styles.reelTheme}>{clip.theme}</p>
                      )}
                      <div className={styles.reelMetaBottom}>
                        <span className={styles.reelSentiment} style={{ background: sc.bg, color: sc.text }}>
                          {clip.sentiment}
                        </span>
                        {clip.language && (
                          <span className={styles.reelLang}>{clip.language}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ── Video player modal ──────────────────────────────────────── */}
      {focusedId && (
        <VideoPlayerModal
          responses={detail.responses.map((r) => ({
            ...r,
            sentiment: sentimentOverrides[r.id] ?? r.sentiment,
          }))}
          initialResponseId={focusedId}
          sentimentOverrides={sentimentOverrides}
          textOverrides={textOverrides}
          onSaveClip={handleSaveClip}
          onClose={() => setFocusedId(null)}
        />
      )}
    </div>
  );
}
