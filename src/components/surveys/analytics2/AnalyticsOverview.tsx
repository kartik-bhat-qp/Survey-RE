'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ANALYTICS_2_DEVICES,
  ANALYTICS_2_DROPOUT_ROWS,
  ANALYTICS_2_FUNNEL,
  ANALYTICS_2_STAT_TILES,
  ANALYTICS_2_TIMELINE,
} from '@/data/mock-analytics-2';
import styles from './SurveyAnalyticsHub.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

const TIMELINE_RANGES = ['7 days', '30 days', '90 days'] as const;

function buildTimelinePath(values: number[]): { area: string; line: string; xs: number[] } {
  const xs = values.map((_, i) => 60 + i * ((700 - 60) / Math.max(values.length - 1, 1)));
  const ys = values.map((v) => 120 - (v / 300) * 110);
  const pts = xs.map((x, i) => `${x},${ys[i].toFixed(1)}`).join(' ');
  return { area: `60,120 ${pts} 700,120`, line: pts, xs };
}

interface AnalyticsOverviewProps {
  onGoResponses: () => void;
  onOpenFilter: () => void;
  onAction: (message: string) => void;
}

export function AnalyticsOverview({
  onGoResponses,
  onOpenFilter,
  onAction,
}: AnalyticsOverviewProps) {
  const [range, setRange] = useState<(typeof TIMELINE_RANGES)[number]>('30 days');
  const [blockwise, setBlockwise] = useState(false);
  const timeline = ANALYTICS_2_TIMELINE[range];
  const path = useMemo(() => buildTimelinePath(timeline.values), [timeline.values]);

  return (
    <div className={styles.screen}>
      <div className={styles.screenHeader}>
        <h1 className={styles.title}>Overview</h1>
        <span className={styles.meta}>
          Last refreshed Aug 14, 2026 01:14 ·{' '}
          <button type="button" className={styles.refreshLink} onClick={() => onAction('Statistics refreshed')}>
            Refresh
          </button>
        </span>
        <span className={styles.headerSpacer} />
        <button type="button" className={styles.ghostBtn} onClick={onOpenFilter}>
          <span className="wm-filter-alt" aria-hidden />
          All responses
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => onAction('Export started — you will get an email when ready')}
        >
          <span className="wm-download" aria-hidden />
          Export
        </button>
      </div>

      <div className={styles.statRow}>
        {ANALYTICS_2_STAT_TILES.map((tile) => (
          <div key={tile.label} className={`${styles.statTile} ${tile.accent ? styles.statAccent : ''}`}>
            <div className={styles.statValue}>{tile.value}</div>
            <div className={styles.statLabel}>
              <span className={tile.icon} aria-hidden />
              {tile.label}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.split}>
        <section className={styles.card} aria-labelledby="funnel-title">
          <div className={styles.cardHeader}>
            <h2 id="funnel-title" className={styles.cardTitle}>
              Participation funnel
            </h2>
            <button type="button" className={styles.linkBtn} onClick={onGoResponses}>
              View responses
            </button>
          </div>
          <div className={`${styles.cardBody} ${styles.stack}`}>
            {ANALYTICS_2_FUNNEL.map((row) => (
              <div key={row.label} className={styles.funnelRow}>
                <span className={styles.funnelLabel}>{row.label}</span>
                <div className={styles.funnelTrack}>
                  <div
                    className={styles.funnelFill}
                    style={{ width: row.width, background: row.color }}
                  />
                </div>
                <span className={styles.funnelValue}>{row.value}</span>
              </div>
            ))}
            <div className={styles.funnelMeta}>
              <span>
                Timed out <strong>0</strong>
              </span>
              <span>
                Quality terminates <strong>0</strong>
              </span>
              <span>
                Validation errors <strong className={styles.funnelMetaWarn}>16,227</strong>
              </span>
              <span>
                Last refreshed <strong>Aug 14, 2026 02:01 GMT+05:30</strong>
              </span>
            </div>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="devices-title">
          <div className={styles.cardHeader}>
            <h2 id="devices-title" className={styles.cardTitle}>
              Devices
            </h2>
          </div>
          <div className={`${styles.cardBody} ${styles.stack}`}>
            {ANALYTICS_2_DEVICES.map((device) => (
              <div key={device.label} className={styles.deviceRow}>
                <div className={styles.deviceHead}>
                  <span className={device.icon} aria-hidden />
                  <span className={styles.deviceLabel}>{device.label}</span>
                  <span className={styles.devicePct}>{device.pct}%</span>
                </div>
                <div className={styles.deviceTrack}>
                  <div className={styles.deviceFill} style={{ width: `${device.pct}%` }} />
                </div>
                <span className={styles.deviceDetail}>{device.detail}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.card} aria-labelledby="timeline-title">
        <div className={styles.cardHeader}>
          <h2 id="timeline-title" className={styles.cardTitle}>
            Response count timeline
          </h2>
          <div className={styles.rangeGroup} role="group" aria-label="Timeline range">
            {TIMELINE_RANGES.map((item) => (
              <button
                key={item}
                type="button"
                className={range === item ? styles.rangeBtnActive : styles.rangeBtn}
                onClick={() => setRange(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.cardBody}>
          <svg viewBox="0 0 720 150" className={styles.chart} aria-hidden>
            <line x1="36" y1="10" x2="36" y2="120" stroke="#eef2f6" strokeWidth="1" />
            <line x1="36" y1="120" x2="710" y2="120" stroke="#e2e8f0" strokeWidth="1" />
            <line x1="36" y1="65" x2="710" y2="65" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="36" y1="10" x2="710" y2="10" stroke="#f1f5f9" strokeWidth="1" />
            <text x="28" y="124" fontSize="9" fill="#94a3b8" textAnchor="end">
              0
            </text>
            <text x="28" y="69" fontSize="9" fill="#94a3b8" textAnchor="end">
              150
            </text>
            <text x="28" y="14" fontSize="9" fill="#94a3b8" textAnchor="end">
              300
            </text>
            <polyline points={path.area} fill="rgba(27,135,230,0.10)" stroke="none" />
            <polyline points={path.line} fill="none" stroke="#1b87e6" strokeWidth="2" />
            {timeline.labels.map((label, i) => (
              <text key={label} x={path.xs[i]} y="136" fontSize="9" fill="#94a3b8" textAnchor="middle">
                {label}
              </text>
            ))}
          </svg>
        </div>
      </section>

      <div className={styles.splitEqual}>
        <section className={styles.card} aria-labelledby="invite-title">
          <div className={styles.cardHeader}>
            <h2 id="invite-title" className={styles.cardTitle}>
              Email invitations
            </h2>
          </div>
          <div className={styles.emptyInvite}>
            <span className={`wm-email ${styles.emptyInviteIcon}`} aria-hidden />
            <span className={styles.emptyInviteTitle}>No email invitations sent</span>
            <span className={styles.emptyInviteCopy}>
              Delivery status and participation rates will appear here once you send an email batch.
            </span>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => onAction('Opens Distribute › Email')}
            >
              Send invitations
            </button>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="dropout-title">
          <div className={styles.cardHeader}>
            <h2 id="dropout-title" className={styles.cardTitle}>
              Drop-out analysis
            </h2>
            <div className={styles.toggleRow}>
              <WuToggle
                Label="Blockwise"
                labelPosition="left"
                checked={blockwise}
                onChange={setBlockwise}
              />
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Last completed question</th>
                <th scope="col" className={styles.right}>
                  Count
                </th>
                <th scope="col" className={styles.right}>
                  Cumulative %
                </th>
              </tr>
            </thead>
            <tbody>
              {(blockwise
                ? [
                    { label: 'Block 1 — Demographics', count: '312', cum: '36.2%' },
                    { label: 'Block 2 — Entertainment ratings', count: '289', cum: '69.8%' },
                    { label: 'Block 3 — Fighter attributes', count: '260', cum: '100%' },
                    { label: 'Total', count: '861', cum: '100%' },
                  ]
                : ANALYTICS_2_DROPOUT_ROWS
              ).map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className={styles.num}>{row.count}</td>
                  <td className={styles.right}>{row.cum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
