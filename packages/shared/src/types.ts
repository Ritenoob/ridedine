import { UserRole, OrderStatus, DeliveryMethod, ChefStatus, DeliveryStatus, PaymentStatus } from './enums';

/**
 * Base User Profile
 */
export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Chef Profile
 */
export interface Chef {
  id: string;
  profile_id: string;
  status: ChefStatus;
  connect_account_id?: string;
  payout_enabled: boolean;
  address?: string;
  lat?: number;
  lng?: number;
  cuisine_types?: string[];
  bio?: string;
  photo_url?: string;
  created_at: string;
}

/**
 * Menu
 */
export interface Menu {
  id: string;
  chef_id: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Menu Item
 */
export interface MenuItem {
  id: string;
  menu_id: string;
  name: string;
  description?: string;
  price_cents: number;
  is_available: boolean;
  photo_url?: string;
  dietary_tags?: string[];
  created_at: string;
}

/**
 * Order
 */
export interface Order {
  id: string;
  customer_id: string;
  chef_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  delivery_fee_cents: number;
  platform_fee_cents: number;
  total_cents: number;
  delivery_method: DeliveryMethod;
  scheduled_for?: string;
  address?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Order Item
 */
export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_cents: number;
  special_instructions?: string;
}

/**
 * Delivery
 */
export interface Delivery {
  id: string;
  order_id: string;
  driver_id?: string;
  status: DeliveryStatus;
  pickup_eta?: string;
  dropoff_eta?: string;
  proof_url?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Customer Cart
 */
export interface CartItem {
  menu_item_id: string;
  menu_item: MenuItem;
  quantity: number;
  special_instructions?: string;
}

/**
 * Availability Window
 */
export interface AvailabilityWindow {
  day: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
}

/**
 * Geo Location
 */
export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}
