export const FULFILMENT_FEE_RATE = 0.05;

export type RewardOrderStatus = 'processing' | 'added';

export interface RewardCardOrder {
  ticketId: string;
  rewardId: string;
  rewardLabel: string;
  unitValue: number;
  cardCount: number;
  subtotal: number;
  fulfilmentFee: number;
  total: number;
  orderedAt: string;
  addedAt: string;
  approvalComment: string;
  status: RewardOrderStatus;
}

export function rewardOrderStorageKey(surveyId: number): string {
  return `survey-reward-order-${surveyId}`;
}

export type RewardInventoryEvent = 'added' | 'refunded';

export interface RewardInventoryEntry {
  ticketId: string;
  rewardId: string;
  rewardLabel: string;
  unitValue: number;
  cardCount: number;
  total: number;
  orderedAt: string;
  addedAt: string;
  approvalComment: string;
  event?: RewardInventoryEvent;
}

export interface RewardInventoryBalance {
  rewardId: string;
  rewardLabel: string;
  unitValue: number;
  cardCount: number;
  amount: number;
}

export const SAMPLE_REDEEMED_GIFT_CARD_LOG = {
  ticketId: 'TKT-184203',
  when: '2026-10-12T15:40:00.000Z',
  event: 'Gift card redeemed',
  detail: '1 card of $25.00 for Amazon.com Gift Card redeemed by response id 10482.',
};

export function rewardInventoryStorageKey(surveyId: number): string {
  return `survey-reward-inventory-${surveyId}`;
}

export function inventoryEntryFromOrder(order: RewardCardOrder): RewardInventoryEntry {
  return {
    ticketId: order.ticketId,
    rewardId: order.rewardId,
    rewardLabel: order.rewardLabel,
    unitValue: order.unitValue,
    cardCount: order.cardCount,
    total: order.total,
    orderedAt: order.orderedAt,
    addedAt: order.addedAt,
    approvalComment: order.approvalComment,
    event: 'added',
  };
}

export function isRewardInventoryEntry(value: unknown): value is RewardInventoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as RewardInventoryEntry;
  return (
    typeof entry.ticketId === 'string' &&
    typeof entry.rewardLabel === 'string' &&
    typeof entry.unitValue === 'number' &&
    typeof entry.cardCount === 'number' &&
    typeof entry.addedAt === 'string' &&
    (entry.event === undefined || entry.event === 'added' || entry.event === 'refunded')
  );
}

export function rewardInventoryBalances(entries: RewardInventoryEntry[]): RewardInventoryBalance[] {
  const grouped = new Map<string, RewardInventoryBalance>();
  for (const entry of entries) {
    const key = `${entry.rewardId}:${entry.unitValue}`;
    const sign = entry.event === 'refunded' ? -1 : 1;
    const cardCount = sign * entry.cardCount;
    const amount = sign * entry.unitValue * entry.cardCount;
    const current = grouped.get(key);
    if (current) {
      current.cardCount += cardCount;
      current.amount = roundMoney(current.amount + amount);
    } else {
      grouped.set(key, {
        rewardId: entry.rewardId,
        rewardLabel: entry.rewardLabel,
        unitValue: entry.unitValue,
        cardCount,
        amount: roundMoney(amount),
      });
    }
  }
  return [...grouped.values()]
    .filter((row) => row.cardCount > 0)
    .sort((left, right) => {
    if (left.rewardLabel === right.rewardLabel) return left.unitValue - right.unitValue;
    return left.rewardLabel.localeCompare(right.rewardLabel);
  });
}

export function parseGiftCardAmount(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return roundMoney(amount);
}

export function parseGiftCardCount(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const count = Number(value);
  if (!Number.isInteger(count) || count <= 0) return null;
  return count;
}

export function buildRewardCharge(
  unitValue: number,
  cardCount: number
): { subtotal: number; fulfilmentFee: number; total: number } {
  const subtotal = roundMoney(unitValue * cardCount);
  const fulfilmentFee = roundMoney(subtotal * FULFILMENT_FEE_RATE);
  return { subtotal, fulfilmentFee, total: roundMoney(subtotal + fulfilmentFee) };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function createRewardTicketId(): string {
  const number = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${number}`;
}

export function formatRewardOrderWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function isRewardCardOrder(value: unknown): value is RewardCardOrder {
  if (!value || typeof value !== 'object') return false;
  const order = value as RewardCardOrder;
  return (
    typeof order.ticketId === 'string' &&
    typeof order.rewardId === 'string' &&
    typeof order.addedAt === 'string' &&
    (order.status === 'processing' || order.status === 'added') &&
    (order.approvalComment === undefined || typeof order.approvalComment === 'string') &&
    typeof order.total === 'number'
  );
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
