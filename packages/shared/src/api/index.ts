import type { Chef, Order } from "../types";

// These are the canonical API route paths the apps should use.
// If you change them, you change them here once.
export const API = {
  chefs: {
    list: "/api/chefs",
    updateAvailability: (chefId: string) => `/api/chefs/${chefId}/availability`
  },
  orders: {
    list: "/api/orders",
    updateStatus: (orderId: string) => `/api/orders/${orderId}/status`
  }
} as const;

export type ListChefsResponse = { chefs: Chef[] };
export type ListOrdersResponse = { orders: Order[] };

export type UpdateChefAvailabilityBody = { availability: "OPEN" | "CLOSED" };
export type UpdateOrderStatusBody = { status: Order["status"] };
