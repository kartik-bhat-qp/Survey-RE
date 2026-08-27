'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import {
  CREDIT_TYPE_FILTER_OPTIONS,
  CREDIT_USER_FILTER_OPTIONS,
  CREDITS_DEFAULT_DATE_END,
  CREDITS_DEFAULT_DATE_START,
  CREDITS_WALLET_NAV,
  MOCK_CREDIT_BALANCES,
  MOCK_CREDIT_TRANSACTIONS,
  type CreditTransaction,
  type CreditsFilterOption,
  type CreditsWalletNavId,
} from '@/data/mock-credits-wallet';
import { formatDate } from '@/data/mock-utils';
import styles from './CreditsWalletPage.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDatePicker })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

function parseDateInput(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatSignedAmount(value: number): string {
  const abs = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `- ${abs}` : `+ ${abs}`;
}

function formatBalanceAmount(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCreditValue(value: number, fractionDigits: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function isInDateRange(iso: string, start: string, end: string): boolean {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return true;
  if (start) {
    const startTime = new Date(`${start}T00:00:00`).getTime();
    if (time < startTime) return false;
  }
  if (end) {
    const endTime = new Date(`${end}T23:59:59`).getTime();
    if (time > endTime) return false;
  }
  return true;
}

const PLACEHOLDER_COPY: Record<Exclude<CreditsWalletNavId, 'credits'>, { title: string; description: string }> =
  {
    overall: {
      title: 'Overall',
      description: 'Organization-wide usage and wallet summary will appear here.',
    },
    statistics: {
      title: 'Statistics',
      description: 'Credit usage statistics will appear here.',
    },
    'email-statistics': {
      title: 'Email Statistics',
      description: 'Email credit usage statistics will appear here.',
    },
  };

export function CreditsWalletPage() {
  const { showToast } = useWuShowToast();
  const [navId, setNavId] = useState<CreditsWalletNavId>('credits');
  const [creditFilter, setCreditFilter] = useState<CreditsFilterOption>(CREDIT_TYPE_FILTER_OPTIONS[0]);
  const [userFilter, setUserFilter] = useState<CreditsFilterOption>(CREDIT_USER_FILTER_OPTIONS[0]);
  const [startDate, setStartDate] = useState(CREDITS_DEFAULT_DATE_START);
  const [endDate, setEndDate] = useState(CREDITS_DEFAULT_DATE_END);
  const [dateOpen, setDateOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return MOCK_CREDIT_TRANSACTIONS.filter((txn) => {
      if (creditFilter.value !== 'all' && txn.creditType !== creditFilter.value) return false;
      if (userFilter.value !== 'all' && txn.userEmail !== userFilter.value) return false;
      return isInDateRange(txn.occurredAt, startDate, endDate);
    });
  }, [creditFilter, userFilter, startDate, endDate]);

  const dateRangeLabel = `${formatDate(startDate)} - ${formatDate(endDate)}`;

  const columns: IWuTableColumnDef<CreditTransaction>[] = useMemo(
    () => [
      {
        accessorKey: 'timestampLabel',
        header: 'Timestamp',
        size: 200,
        cell: ({ row }) => <span className={styles.timestampCell}>{row.original.timestampLabel}</span>,
      },
      {
        accessorKey: 'creditTypeLabel',
        header: 'Credit Type',
        size: 110,
      },
      {
        accessorKey: 'details',
        header: 'Details',
        size: 260,
        cell: ({ row }) => <span className={styles.detailsCell}>{row.original.details}</span>,
      },
      {
        accessorKey: 'userEmail',
        header: 'User (Role)',
        size: 240,
        cell: ({ row }) => (
          <span className={styles.userCell}>
            {row.original.userEmail} ({row.original.userRole})
          </span>
        ),
      },
      {
        accessorKey: 'usage',
        header: 'Usage',
        size: 120,
        headerAlign: 'right',
        cellAlign: 'right',
        cell: ({ row }) => (
          <span className={row.original.usage < 0 ? styles.usageNegative : styles.usagePositive}>
            {formatSignedAmount(row.original.usage)}
          </span>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        size: 120,
        headerAlign: 'right',
        cellAlign: 'right',
        cell: ({ row }) => (
          <span className={styles.balanceCell}>{formatBalanceAmount(row.original.balance)}</span>
        ),
      },
    ],
    []
  );

  function resetFilters(): void {
    setCreditFilter(CREDIT_TYPE_FILTER_OPTIONS[0]);
    setUserFilter(CREDIT_USER_FILTER_OPTIONS[0]);
    setStartDate(CREDITS_DEFAULT_DATE_START);
    setEndDate(CREDITS_DEFAULT_DATE_END);
    setDateOpen(false);
  }

  const placeholder = navId === 'credits' ? null : PLACEHOLDER_COPY[navId];

  return (
    <div className={styles.page}>
      <nav className={styles.sideNav} aria-label="Wallet">
        <ul className={styles.sideNavList}>
          {CREDITS_WALLET_NAV.map((item) => {
            const active = item.id === navId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={active ? styles.sideNavBtnActive : styles.sideNavBtn}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setNavId(item.id)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.main}>
        <div className={styles.tabBar}>
          <button type="button" className={styles.tabActive}>
            Organization Wallet
          </button>
        </div>

        <div className={styles.body}>
          {placeholder ? (
            <section className={styles.placeholder}>
              <h1 className={styles.placeholderTitle}>{placeholder.title}</h1>
              <p className={styles.placeholderCopy}>{placeholder.description}</p>
              <WuButton
                variant="outline"
                onClick={() => showToast({ message: `${placeholder.title} coming soon`, variant: 'info' })}
              >
                View details
              </WuButton>
            </section>
          ) : (
            <>
              <section className={styles.card} aria-labelledby="credits-balance-heading">
                <div className={styles.cardHeader}>
                  <h1 id="credits-balance-heading" className={styles.cardTitle}>
                    Credits Balance
                  </h1>
                  <button
                    type="button"
                    className={styles.addBalanceBtn}
                    onClick={() => showToast({ message: 'Add balance', variant: 'info' })}
                  >
                    Add balance
                  </button>
                </div>
                <div className={styles.balances}>
                  {MOCK_CREDIT_BALANCES.map((item) => (
                    <div key={item.id} className={styles.balanceItem}>
                      <span className={styles.balanceValue}>
                        {formatCreditValue(item.value, item.fractionDigits)}
                      </span>
                      <span className={styles.balanceMeta}>
                        <span className={`${item.icon} ${styles.balanceIcon}`} aria-hidden />
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.card} aria-labelledby="transactions-heading">
                <div className={styles.cardHeader}>
                  <h2 id="transactions-heading" className={styles.cardTitle}>
                    Transactions
                  </h2>
                </div>

                <div className={styles.toolbar}>
                  <div className={styles.filterSelect}>
                    <WuSelect
                      data={CREDIT_TYPE_FILTER_OPTIONS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={creditFilter}
                      onSelect={(option) => {
                        if (option) setCreditFilter(option as CreditsFilterOption);
                      }}
                      variant="outlined"
                      aria-label="Credit type"
                    />
                  </div>
                  <div className={styles.filterSelect}>
                    <WuSelect
                      data={CREDIT_USER_FILTER_OPTIONS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={userFilter}
                      onSelect={(option) => {
                        if (option) setUserFilter(option as CreditsFilterOption);
                      }}
                      variant="outlined"
                      aria-label="User"
                    />
                  </div>
                  <div className={styles.dateRangeWrap}>
                    <div className={styles.dateRangeBtn}>
                      <button
                        type="button"
                        className={styles.dateRangeToggle}
                        aria-expanded={dateOpen}
                        aria-label="Date range"
                        onClick={() => setDateOpen((open) => !open)}
                      >
                        <span className={`wm-calendar-today ${styles.dateRangeIcon}`} aria-hidden />
                        {dateRangeLabel}
                      </button>
                      <button
                        type="button"
                        className={styles.dateRangeClear}
                        aria-label="Reset date range"
                        onClick={() => {
                          setStartDate(CREDITS_DEFAULT_DATE_START);
                          setEndDate(CREDITS_DEFAULT_DATE_END);
                        }}
                      >
                        <span className="wm-close" aria-hidden />
                      </button>
                    </div>
                    {dateOpen ? (
                      <div className={styles.datePopover}>
                        <div className={styles.dateField}>
                          <span className={styles.dateFieldLabel}>Start date</span>
                          <WuDatePicker
                            value={parseDateInput(startDate)}
                            onChange={(date) => {
                              if (date) setStartDate(toDateInputValue(date));
                            }}
                            formatString="MMM d, yyyy"
                            placeholder="Start date"
                            variant="outlined"
                            aria-label="Start date"
                          />
                        </div>
                        <div className={styles.dateField}>
                          <span className={styles.dateFieldLabel}>End date</span>
                          <WuDatePicker
                            value={parseDateInput(endDate)}
                            onChange={(date) => {
                              if (date) setEndDate(toDateInputValue(date));
                            }}
                            formatString="MMM d, yyyy"
                            placeholder="End date"
                            variant="outlined"
                            aria-label="End date"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.toolbarSpacer} />
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="Refresh"
                    onClick={() => {
                      resetFilters();
                      showToast({ message: 'Transactions refreshed', variant: 'success' });
                    }}
                  >
                    <span className="wm-refresh" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="Download"
                    onClick={() => showToast({ message: 'Transactions downloaded', variant: 'success' })}
                  >
                    <span className="wm-download" aria-hidden />
                  </button>
                </div>

                <p className={styles.itemCount}>
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'item' : 'items'}
                </p>

                <TableScrollWrap className={styles.tableWrap}>
                  <WuTable
                    data={filteredTransactions as unknown[]}
                    columns={columns as unknown as IWuTableColumnDef<unknown>[]}
                    variant="unstyled"
                    sort={{ enabled: true }}
                    NoDataContent={
                      <EmptyState
                        icon="wm-search-off"
                        title="No transactions found"
                        description="Try adjusting the credit type, user, or date range"
                      />
                    }
                  />
                </TableScrollWrap>
              </section>

              <div className={styles.pageFooter}>
                <span>QuestionPro Admin ©2026 QuestionPro</span>
                <button
                  type="button"
                  className={styles.logsLink}
                  onClick={() =>
                    showToast({ message: 'Query Performance Logs', variant: 'info' })
                  }
                >
                  Query Performance Logs
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
