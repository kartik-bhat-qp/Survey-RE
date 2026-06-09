'use client';

import { useMemo } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { SurveyAnalyticsPieChart } from '@/components/surveys/analytics/SurveyAnalyticsPieChart';
import { SurveyAnalyticsWorldMap } from '@/components/surveys/analytics/SurveyAnalyticsWorldMap';
import { useSurveyAnalyticsView } from '@/components/surveys/SurveyAnalyticsViewContext';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SurveyDetail } from '@/data/mock-survey-detail';
import {
  getAnalyticsViewLabel,
  getSurveyAnalyticsDashboardData,
  type SurveyAnalyticsQuestionCard,
} from '@/data/mock-survey-analytics';
import styles from './SurveyAnalyticsDashboard.module.css';

interface SurveyAnalyticsDashboardProps {
  detail: SurveyDetail;
}

function QuestionAnalyticsCard({
  question,
  onAction,
}: {
  question: SurveyAnalyticsQuestionCard;
  onAction: (label: string) => void;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.questionHeader}>
        <h3 className={styles.questionTitle}>{question.title}</h3>
        <div className={styles.questionActions}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Question info"
            onClick={() => onAction('Question info')}
          >
            <span className="wm-info" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Download"
            onClick={() => onAction('Download')}
          >
            <span className="wm-download" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Share"
            onClick={() => onAction('Share')}
          >
            <span className="wm-share" aria-hidden />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Settings"
            onClick={() => onAction('Settings')}
          >
            <span className="wm-settings" aria-hidden />
          </button>
        </div>
      </div>
      <div className={styles.questionBody}>
        <SurveyAnalyticsPieChart question={question} />
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Answer</th>
              <th scope="col">Count</th>
              <th scope="col">Percent</th>
              <th scope="col" className={`${styles.barCell} ${styles.barScaleHeader}`}>
                <span className={styles.barScaleTicks} aria-hidden>
                  20%&nbsp;&nbsp;&nbsp;40%&nbsp;&nbsp;&nbsp;60%&nbsp;&nbsp;&nbsp;80%&nbsp;&nbsp;&nbsp;100%
                </span>
                <span className={styles.srOnly}>Distribution scale</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {question.answers.map((row, index) => (
              <tr key={`${question.id}-${row.answer}`}>
                <td>{row.answer}</td>
                <td className={styles.countCell}>{row.count}</td>
                <td>{row.percent}%</td>
                <td className={styles.barCell}>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${
                        index === question.highlightIndex ? styles.barFillHighlight : ''
                      }`}
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            <tr className={styles.totalRow}>
              <td>Total</td>
              <td className={styles.countCell}>
                {question.answers.reduce((sum, row) => sum + row.count, 0)}
              </td>
              <td>100%</td>
              <td className={styles.barCell} />
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function SurveyAnalyticsDashboard({ detail }: SurveyAnalyticsDashboardProps) {
  const { showToast } = useWuShowToast();
  const { activeTab, activeSubView } = useSurveyAnalyticsView();
  const data = useMemo(() => getSurveyAnalyticsDashboardData(detail), [detail]);
  const activeViewLabel = getAnalyticsViewLabel(activeTab, activeSubView);
  const showDashboardContent = activeTab === 'dashboard' && activeSubView === 'dashboard';

  function handleAction(label: string) {
    showToast({ message: label, variant: 'info' });
  }

  const summaryMetrics = [
    { label: 'Viewed', value: data.summary.viewed, highlight: true },
    { label: 'Total Responses', value: data.summary.totalResponses, highlight: false },
    { label: 'Completed', value: data.summary.completed, highlight: false },
    { label: 'Completion Rate', value: `${data.summary.completionRate}%`, highlight: false },
    { label: 'Dropouts', value: data.summary.dropouts, highlight: false },
    { label: 'Average Time', value: data.summary.averageTimeLabel, highlight: false },
  ];

  if (!showDashboardContent) {
    return (
      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="My dashboards">
          <p className={styles.sidebarTitle}>My Dashboard</p>
          <button
            type="button"
            className={styles.newDashboardBtn}
            onClick={() => handleAction('New dashboard')}
          >
            <span aria-hidden>+</span> New Dashboard
          </button>
        </aside>

        <div className={styles.main}>
          <h1 className={styles.surveyTitle}>{detail.survey.name}</h1>
          <div className={styles.placeholderCard}>
            <EmptyState
              icon="wm-dashboard"
              title={activeViewLabel}
              description={`${activeViewLabel} is not available in this prototype.`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="My dashboards">
        <p className={styles.sidebarTitle}>My Dashboard</p>
        <button
          type="button"
          className={styles.newDashboardBtn}
          onClick={() => handleAction('New dashboard')}
        >
          <span aria-hidden>+</span> New Dashboard
        </button>
      </aside>

      <div className={styles.main}>
        <h1 className={styles.surveyTitle}>{detail.survey.name}</h1>
        <section className={styles.card} aria-labelledby="analytics-summary-title">
          <div className={styles.cardHeader}>
            <h2 id="analytics-summary-title" className={styles.cardTitle}>
              Summary
            </h2>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Summary settings"
              onClick={() => handleAction('Summary settings')}
            >
              <span className="wm-settings" aria-hidden />
            </button>
          </div>
          <div className={styles.summaryMetrics}>
            {summaryMetrics.map((metric) => (
              <div
                key={metric.label}
                className={`${styles.metric} ${metric.highlight ? styles.metricHighlight : ''}`}
              >
                <span className={styles.metricLabel}>{metric.label}</span>
                <span className={styles.metricValue}>{metric.value}</span>
              </div>
            ))}
          </div>
          <div className={styles.distributionBody}>
            <div className={styles.mapPanel}>
              <p className={styles.mapTitle}>Response Distribution</p>
              <SurveyAnalyticsWorldMap countries={data.countries} />
            </div>
            <table className={styles.countriesTable}>
              <thead>
                <tr>
                  <th scope="col">Countries</th>
                  <th scope="col">Responses</th>
                </tr>
              </thead>
              <tbody>
                {data.countries.map((row) => (
                  <tr key={row.country}>
                    <td>{row.country}</td>
                    <td>
                      {row.responses} ({row.percent}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {data.questions.map((question) => (
          <QuestionAnalyticsCard
            key={question.id}
            question={question}
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  );
}
