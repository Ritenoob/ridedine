import { UserRole, OrderStatus, DeliveryMethod, ChefStatus, DeliveryStatus, RecipientType } from "./enums";

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
  day: number;
  start_time: string;
  end_time: string;
}

/**
 * Geo Location
 */
export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Favorite
 */
export interface Favorite {
  id: string;
  user_id: string;
  favoritable_type: "chef" | "dish";
  favoritable_id: string;
  created_at: string;
}

/**
 * Dish (Menu Item alias used by customer-facing screens)
 */
export interface Dish {
  id: string;
  menu_id: string;
  name: string;
  description?: string;
  price_cents: number;
  is_available: boolean;
  image_url?: string;
  photo_url?: string;
  dietary_tags?: string[];
  created_at: string;
}

/**
 * Saved Address
 */
export interface SavedAddress {
  id: string;
  user_id: string;
  label?: string;
  address: string;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Review
 */
export interface Review {
  id: string;
  customer_id: string;
  chef_id: string;
  order_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Driver Profile
 */
export interface Driver {
  id: string;
  profile_id: string;
  vehicle_type?: string;
  license_number?: string;
  is_available: boolean;
  is_verified: boolean;
  current_lat?: number;
  current_lng?: number;
  total_deliveries: number;
  rating: number;
  connect_account_id?: string;
  payout_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Payment Transfer (multi-party payment distribution tracking)
 */
export interface PaymentTransfer {
  id: string;
  order_id: string;
  recipient_type: RecipientType;
  recipient_id: string;
  stripe_transfer_id?: string;
  amount_cents: number;
  status: "pending" | "succeeded" | "failed" | "skipped";
  failure_reason?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * CoCo Partner Configuration
 */
export interface CocoConfig {
  id: string;
  stripe_account_id?: string;
  payout_enabled: boolean;
  created_at: string;
  updated_at?: string;
}
