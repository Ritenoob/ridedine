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
  "draft": ["submitted", "cancelled"],
  "submitted": ["accepted", "cancelled"],
  "placed": ["accepted", "cancelled"],
  "accepted": ["preparing", "cancelled"],
  "preparing": ["ready", "out_for_delivery", "cancelled"],
  "ready": ["picked_up", "out_for_delivery", "cancelled"],
  "picked_up": ["out_for_delivery", "delivered"],
  "out_for_delivery": ["delivered"],
  "delivered": [],
  "cancelled": [],
  "refunded": [],
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

