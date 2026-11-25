'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
  parseISO,
} from 'date-fns';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { DateRangeCalendar } from '@/components/dashboards/SharedDashboardDateFilter';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  COMMUNITY_INVITATION_STATUSES,
  COMMUNITY_INVITATIONS,
  type CommunityInvitation,
  type CommunityInvitationStatus,
} from '@/data/mock-community-invitation-history';
import styles from './CommunityInvitationHistory.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
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

const DEFAULT_RANGE_START = '2016-06-01';

type SortKey = 'surveyName' | 'sentAt' | 'status' | 'initialSent' | 'successCount' | 'completed';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | CommunityInvitationStatus;

interface InvitationRow extends CommunityInvitation {
  accessRemoved: boolean;
  automaticClosure: boolean;
}

interface CommunityInvitationHistoryProps {
  onNewProject: () => void;
  onSendReminder: (invitation: {
    id: string;
    surveyName: string;
    initialSent: number;
    successCount: number;
    completed: number;
  }) => void;
}

const MENU_ITEM_CLASS =
  'flex w-full items-center justify-start gap-2 rounded-[2px] px-3 py-2 text-left text-[13px] font-normal text-[#3c4654] hover:bg-[#f4f6f8]';

function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function formatInvitationDate(sentAt: string): string {
  const date = parseISO(sentAt);
  if (date.getTime() <= Date.now() && differenceInMinutes(new Date(), date) < 60) {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
  return format(date, 'MM/dd/yyyy');
}

function formatRangeLabel(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM dd, yyyy');
}

function dateKey(sentAt: string): string {
  return format(parseISO(sentAt), 'yyyy-MM-dd');
}

function completionLabel(row: CommunityInvitation): string {
  const percent = row.successCount > 0 ? (row.completed / row.successCount) * 100 : 0;
  return `${row.completed.toLocaleString('en-US')} (${percent.toFixed(1)}%)`;
}

function statusDetail(row: InvitationRow): string | null {
  if (row.accessRemoved) return 'Access removed';
  if (row.status === 'Delivery successful') {
    return row.invitedEmail ? `invited: ${row.invitedEmail}` : null;
  }
  if (row.status === 'Failed') {
    return row.invitedEmail ? `bounced: ${row.invitedEmail}` : 'Delivery failed';
  }
  if (row.status === 'Scheduled') return 'Scheduled to send';
  if (row.status === 'Closed') return 'Project closed';
  return null;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function CommunityInvitationHistory({
  onNewProject,
  onSendReminder,
}: CommunityInvitationHistoryProps) {
  const { showToast } = useWuShowToast();
  const [rows, setRows] = useState<InvitationRow[]>(() =>
    COMMUNITY_INVITATIONS.map((item) => ({
      ...item,
      accessRemoved: false,
      automaticClosure: false,
    }))
  );
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(DEFAULT_RANGE_START);
  const [endDate, setEndDate] = useState(todayKey);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'sentAt',
    direction: 'desc',
  });
  const [statsId, setStatsId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; action: 'close' | 'remove' } | null>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rangeOpen && !filterOpen) return;
    function handlePointer(event: MouseEvent): void {
      const target = event.target as Node;
      if (rangeOpen && rangeRef.current && !rangeRef.current.contains(target)) {
        setRangeOpen(false);
      }
      if (filterOpen && filterRef.current && !filterRef.current.contains(target)) {
        setFilterOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setRangeOpen(false);
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [rangeOpen, filterOpen]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const key = dateKey(row.sentAt);
      if (startDate && key < startDate) return false;
      if (endDate && key > endDate) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!query) return true;
      return (
        row.surveyName.toLowerCase().includes(query) ||
        (row.invitedEmail ?? '').toLowerCase().includes(query)
      );
    });
    const direction = sort.direction === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      let result = 0;
      if (sort.key === 'surveyName' || sort.key === 'status') {
        result = a[sort.key].localeCompare(b[sort.key]);
      } else if (sort.key === 'sentAt') {
        result = parseISO(a.sentAt).getTime() - parseISO(b.sentAt).getTime();
      } else {
        result = a[sort.key] - b[sort.key];
      }
      if (result === 0) result = a.id.localeCompare(b.id);
      return result * direction;
    });
  }, [rows, search, startDate, endDate, statusFilter, sort]);

  const statsRow = rows.find((row) => row.id === statsId) ?? null;
  const pendingRow = rows.find((row) => row.id === pending?.id) ?? null;
  const filtersActive =
    search.trim().length > 0 ||
    statusFilter !== 'all' ||
    startDate !== DEFAULT_RANGE_START ||
    endDate !== todayKey();

  function toggleSort(key: SortKey): void {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'surveyName' || key === 'status' ? 'asc' : 'desc' }
    );
  }

  function sortIcon(key: SortKey): string {
    if (sort.key !== key) return 'wm-swap-vert';
    return sort.direction === 'asc' ? 'wm-arrow-upward' : 'wm-arrow-downward';
  }

  function patchRow(id: string, patch: Partial<InvitationRow>): void {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function clearFilters(): void {
    setSearch('');
    setStatusFilter('all');
    setStartDate(DEFAULT_RANGE_START);
    setEndDate(todayKey());
  }

  function downloadHistory(): void {
    if (visibleRows.length === 0) {
      showToast({ message: 'Nothing to download', variant: 'error' });
      return;
    }
    const header = [
      'Survey name',
      'Date',
      'Status',
      'Invited',
      'Initial sent',
      'Success count',
      'Completed',
    ];
    const lines = visibleRows.map((row) => [
      row.surveyName,
      formatInvitationDate(row.sentAt),
      row.status,
      row.invitedEmail ?? '',
      String(row.initialSent),
      String(row.successCount),
      String(row.completed),
    ]);
    const csv = [header, ...lines]
      .map((columns) => columns.map(escapeCsv).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'invitation-history.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Invitation history downloaded', variant: 'success' });
  }

  function handleReminder(row: InvitationRow): void {
    if (row.status === 'Closed' || row.status === 'Failed' || row.accessRemoved) {
      showToast({
        message: `Can’t send a reminder for “${row.surveyName}”`,
        variant: 'error',
      });
      return;
    }
    onSendReminder(row);
  }

  function handleAutomaticClosure(row: InvitationRow): void {
    const next = !row.automaticClosure;
    patchRow(row.id, { automaticClosure: next });
    showToast({
      message: next
        ? `Automatic closure turned on for “${row.surveyName}”`
        : `Automatic closure turned off for “${row.surveyName}”`,
      variant: 'success',
    });
  }

  function requestRemove(row: InvitationRow): void {
    if (row.accessRemoved) {
      showToast({ message: `Access already removed for “${row.surveyName}”`, variant: 'info' });
      return;
    }
    setPending({ id: row.id, action: 'remove' });
  }

  function requestClose(row: InvitationRow): void {
    if (row.status === 'Closed') {
      showToast({ message: `“${row.surveyName}” is already closed`, variant: 'info' });
      return;
    }
    setPending({ id: row.id, action: 'close' });
  }

  function confirmPending(): void {
    if (!pending || !pendingRow) return;
    if (pending.action === 'close') {
      patchRow(pending.id, { status: 'Closed' });
      showToast({ message: `Closed “${pendingRow.surveyName}”`, variant: 'success' });
    } else {
      patchRow(pending.id, { accessRemoved: true });
      showToast({ message: `Removed access to “${pendingRow.surveyName}”`, variant: 'success' });
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Invitation history
          <WuTooltip
            content="Invitations sent from this community, with delivery and completion counts."
            position="top"
          >
            <button type="button" className={styles.help} aria-label="About invitation history">
              <span className="wm-help" aria-hidden />
            </button>
          </WuTooltip>
        </h1>
        <div className={styles.tools}>
          <label className={styles.search}>
            <span className="wm-search" aria-hidden />
            <input
              type="search"
              value={search}
              placeholder="Search survey or invitation"
              aria-label="Search survey or invitation"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className={styles.range} ref={rangeRef}>
            <button
              type="button"
              className={styles.rangeButton}
              aria-expanded={rangeOpen}
              aria-haspopup="dialog"
              onClick={() => setRangeOpen((open) => !open)}
            >
              <span>
                {formatRangeLabel(startDate)} - {formatRangeLabel(endDate)}
              </span>
              <span className="wm-calendar-month" aria-hidden />
            </button>
            {rangeOpen ? (
              <div className={styles.rangePopover} role="dialog" aria-label="Date range">
                <DateRangeCalendar
                  key={`${startDate}|${endDate}`}
                  startDate={startDate}
                  endDate={endDate}
                  hidePresets
                  onChange={(range) => {
                    if (range.startDate) setStartDate(range.startDate);
                    if (range.endDate) setEndDate(range.endDate);
                    setRangeOpen(false);
                  }}
                  onReset={() => {
                    setStartDate(DEFAULT_RANGE_START);
                    setEndDate(todayKey());
                  }}
                />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Download invitation history"
            onClick={downloadHistory}
          >
            <span className="wm-download" aria-hidden />
          </button>
        </div>
      </div>

      <div className={styles.bar}>
        <WuButton
          size="sm"
          Icon={<span className="wm-add" aria-hidden />}
          onClick={onNewProject}
        >
          New project
        </WuButton>
        <p className={styles.count}>
          {visibleRows.length.toLocaleString('en-US')}{' '}
          {visibleRows.length === 1 ? 'invite' : 'invites'}
        </p>
      </div>

      {visibleRows.length === 0 ? (
        <EmptyState
          icon="wm-history"
          title="No invitations found"
          description="Try a different survey, status, or date range."
          action={
            filtersActive ? (
              <button type="button" className={styles.clear} onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <WuButton size="sm" onClick={onNewProject}>
                New project
              </WuButton>
            )
          }
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.caption}>Invitation history</caption>
            <thead>
              <tr>
                <SortHeader
                  label="Survey name"
                  sortKey="surveyName"
                  sort={sort}
                  icon={sortIcon('surveyName')}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Date"
                  sortKey="sentAt"
                  sort={sort}
                  icon={sortIcon('sentAt')}
                  onSort={toggleSort}
                />
                <th scope="col" aria-sort={sort.key === 'status' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <div className={styles.statusHead} ref={filterRef}>
                    <button type="button" className={styles.sortButton} onClick={() => toggleSort('status')}>
                      Status
                      <span className={sortIcon('status')} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={styles.filterButton}
                      aria-label="Filter by status"
                      aria-expanded={filterOpen}
                      aria-haspopup="listbox"
                      onClick={() => setFilterOpen((open) => !open)}
                    >
                      <span className="wm-arrow-drop-down" aria-hidden />
                    </button>
                    {filterOpen ? (
                      <ul className={styles.filterMenu} role="listbox" aria-label="Status">
                        <li>
                          <button
                            type="button"
                            role="option"
                            aria-selected={statusFilter === 'all'}
                            className={statusFilter === 'all' ? styles.filterOn : styles.filterItem}
                            onClick={() => {
                              setStatusFilter('all');
                              setFilterOpen(false);
                            }}
                          >
                            All statuses
                          </button>
                        </li>
                        {COMMUNITY_INVITATION_STATUSES.map((status) => (
                          <li key={status}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={statusFilter === status}
                              className={statusFilter === status ? styles.filterOn : styles.filterItem}
                              onClick={() => {
                                setStatusFilter(status);
                                setFilterOpen(false);
                              }}
                            >
                              {status}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </th>
                <SortHeader
                  label="Initial sent"
                  sortKey="initialSent"
                  sort={sort}
                  icon={sortIcon('initialSent')}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Success count"
                  sortKey="successCount"
                  sort={sort}
                  icon={sortIcon('successCount')}
                  onSort={toggleSort}
                />
                <th
                  scope="col"
                  aria-sort={
                    sort.key === 'completed'
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div className={styles.completedHead}>
                    <button type="button" className={styles.sortButton} onClick={() => toggleSort('completed')}>
                      Completed
                      <span className={sortIcon('completed')} aria-hidden />
                    </button>
                    <WuTooltip
                      content="Completed responses and the percent of successful deliveries."
                      position="top"
                    >
                      <span className={`wm-info ${styles.info}`} aria-label="About completed" />
                    </WuTooltip>
                  </div>
                </th>
                <th scope="col">
                  <span className={styles.caption}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className={styles.survey} title={row.surveyName}>
                      {row.surveyName}
                    </span>
                  </td>
                  <td className={styles.date}>{formatInvitationDate(row.sentAt)}</td>
                  <td>
                    <div className={styles.status}>
                      <span>{row.status}</span>
                      {statusDetail(row) ? (
                        <span className={styles.detail} title={statusDetail(row) ?? undefined}>
                          {statusDetail(row)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>{row.initialSent.toLocaleString('en-US')}</td>
                  <td>{row.successCount.toLocaleString('en-US')}</td>
                  <td>{completionLabel(row)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.chartButton}
                        aria-label={`Delivery stats for ${row.surveyName}`}
                        onClick={() => setStatsId(row.id)}
                      >
                        <span className="wm-insert-chart" aria-hidden />
                      </button>
                      <InvitationMenu
                        row={row}
                        onReminder={() => handleReminder(row)}
                        onAutomaticClosure={() => handleAutomaticClosure(row)}
                        onRemoveAccess={() => requestRemove(row)}
                        onCloseProject={() => requestClose(row)}
                        onDeliveryStats={() => setStatsId(row.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeliveryStatsModal
        invitation={statsRow}
        open={statsRow !== null}
        onOpenChange={(open) => {
          if (!open) setStatsId(null);
        }}
      />

      <ConfirmModal
        open={pending?.action === 'close'}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Close project?"
        description={
          pendingRow
            ? `Close “${pendingRow.surveyName}”? Members will no longer be able to take this survey.`
            : ''
        }
        confirmLabel="Close project"
        variant="critical"
        onConfirm={confirmPending}
      />
      <ConfirmModal
        open={pending?.action === 'remove'}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Remove access?"
        description={
          pendingRow
            ? `Remove member access to “${pendingRow.surveyName}”? Invited members will no longer be able to open this survey.`
            : ''
        }
        confirmLabel="Remove access"
        variant="critical"
        onConfirm={confirmPending}
      />
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  icon,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; direction: SortDirection };
  icon: string;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={
        sort.key === sortKey ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button type="button" className={styles.sortButton} onClick={() => onSort(sortKey)}>
        {label}
        <span className={icon} aria-hidden />
      </button>
    </th>
  );
}

function InvitationMenu({
  row,
  onReminder,
  onAutomaticClosure,
  onRemoveAccess,
  onCloseProject,
  onDeliveryStats,
}: {
  row: InvitationRow;
  onReminder: () => void;
  onAutomaticClosure: () => void;
  onRemoveAccess: () => void;
  onCloseProject: () => void;
  onDeliveryStats: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <WuMenu
      open={open}
      onOpenChange={setOpen}
      align="end"
      side="bottom"
      sideOffset={4}
      className="w-[210px] rounded-[2px] border border-[#e6e8eb] bg-white p-1 shadow-lg"
      Trigger={
        <button
          type="button"
          className={styles.kebab}
          aria-label={`Actions for ${row.surveyName}`}
        >
          <span className="wm-more-vert" aria-hidden />
        </button>
      }
    >
      <WuMenuItem
        Icon={<span className="wm-history text-[18px] text-[#607080]" aria-hidden />}
        onClick={onReminder}
        className={MENU_ITEM_CLASS}
      >
        Send Reminder
      </WuMenuItem>
      <WuMenuItem
        Icon={<span className="wm-schedule text-[18px] text-[#607080]" aria-hidden />}
        onClick={onAutomaticClosure}
        className={MENU_ITEM_CLASS}
      >
        Automatic Closure
      </WuMenuItem>
      <WuMenuItem
        Icon={<span className="wm-visibility-off text-[18px] text-[#607080]" aria-hidden />}
        onClick={onRemoveAccess}
        className={MENU_ITEM_CLASS}
      >
        Remove Access
      </WuMenuItem>
      <WuMenuItem
        Icon={<span className="wm-cancel text-[18px] text-[#607080]" aria-hidden />}
        onClick={onCloseProject}
        className={MENU_ITEM_CLASS}
      >
        Close Project
      </WuMenuItem>
      <WuMenuItem
        Icon={
          <span className={styles.statsIcon}>
            <span className="wm-insert-chart" aria-hidden />
            <span className={styles.badge} aria-hidden />
          </span>
        }
        onClick={onDeliveryStats}
        className={MENU_ITEM_CLASS}
      >
        Delivery Stats
      </WuMenuItem>
    </WuMenu>
  );
}

function DeliveryStatsModal({
  invitation,
  open,
  onOpenChange,
}: {
  invitation: InvitationRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const wick = useWickUILib();
  if (!open || !wick || !invitation) return null;
  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton: ModalButton } = wick;
  const detail = statusDetail(invitation);

  return (
    <WuModal open onOpenChange={onOpenChange} size="sm">
      <WuModalHeader>Delivery stats</WuModalHeader>
      <WuModalContent>
        <p className={styles.statsSurvey}>{invitation.surveyName}</p>
        <dl className={styles.statsList}>
          <div>
            <dt>Date</dt>
            <dd>{formatInvitationDate(invitation.sentAt)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{invitation.status}</dd>
          </div>
          {detail ? (
            <div>
              <dt>Detail</dt>
              <dd>{detail}</dd>
            </div>
          ) : null}
          <div>
            <dt>Initial sent</dt>
            <dd>{invitation.initialSent.toLocaleString('en-US')}</dd>
          </div>
          <div>
            <dt>Success count</dt>
            <dd>{invitation.successCount.toLocaleString('en-US')}</dd>
          </div>
          <div>
            <dt>Completed</dt>
            <dd>{completionLabel(invitation)}</dd>
          </div>
          <div>
            <dt>Automatic closure</dt>
            <dd>{invitation.automaticClosure ? 'On' : 'Off'}</dd>
          </div>
        </dl>
      </WuModalContent>
      <WuModalFooter>
        <ModalButton onClick={() => onOpenChange(false)}>Close</ModalButton>
      </WuModalFooter>
    </WuModal>
  );
}
