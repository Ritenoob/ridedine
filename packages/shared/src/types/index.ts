export type Role = "customer" | "chef" | "driver" | "admin" | "ops";

export type ChefStatus = "ACTIVE" | "PAUSED" | "SUSPENDED";
export type AvailabilityStatus = "OPEN" | "CLOSED";

export type OrderStatus =
  | "CREATED"
  | "PAID"
  | "ACCEPTED"
  | "PREPPING"
  | "READY"
  | "PICKED_UP"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "DISPUTED";

export type MoneyCents = number;

export type Chef = {
  id: string;
  displayName: string;
  status: ChefStatus;
  availability: AvailabilityStatus;
  updatedAt: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  chefId: string;
  customerId: string;
  totalCents: MoneyCents;
  updatedAt: string;
};
