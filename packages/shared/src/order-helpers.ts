import { OrderStatus } from './enums';

/**
 * Order item for computing totals
 */
export interface OrderLineItem {
  price: number;
  qty: number;
}

/**
 * Compute order totals from line items.
 */
export function computeTotals(items: OrderLineItem[], deliveryFee = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal + deliveryFee;
  return { subtotal, deliveryFee, total };
}

/**
 * Allowed status transitions
 */
const TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.DRAFT]: [OrderStatus.SUBMITTED, OrderStatus.CANCELLED],
  [OrderStatus.SUBMITTED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

/**
 * Returns true when transitioning from â†’ to is a valid operation.
 */
export function canTransitionStatus(from: OrderStatus, to: OrderStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Returns the list of statuses that an order can move to from its current status.
 */
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  return TRANSITIONS[status] ?? [];
}


