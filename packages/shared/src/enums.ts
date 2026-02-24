/**
 * User Roles
 */
export enum UserRole {
  CUSTOMER = 'customer',
  CHEF = 'chef',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

/**
 * Order Statuses
 */
export enum OrderStatus {
  PLACED = 'placed',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Delivery Methods
 */
export enum DeliveryMethod {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

/**
 * Chef Status
 */
export enum ChefStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

/**
 * Delivery Status
 */
export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  EN_ROUTE_TO_PICKUP = 'en_route_to_pickup',
  ARRIVED_AT_PICKUP = 'arrived_at_pickup',
  PICKED_UP = 'picked_up',
  EN_ROUTE_TO_DROPOFF = 'en_route_to_dropoff',
  ARRIVED_AT_DROPOFF = 'arrived_at_dropoff',
  DELIVERED = 'delivered',
}

/**
 * Payment Status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
