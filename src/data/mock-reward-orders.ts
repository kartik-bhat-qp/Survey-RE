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
