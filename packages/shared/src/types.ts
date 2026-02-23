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
 * Dish - Chef's catalog item
 */
export interface Dish {
  id: string;
  chef_id: string;
  name: string;
  description?: string;
  price_cents: number;
  image_url?: string;
  available: boolean;
  cuisine_type?: string;
  dietary_tags?: string[];
  created_at: string;
  updated_at?: string;
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
 * Driver Profile
 */
export interface Driver {
  id: string;
  profile_id: string;
  vehicle_type?: 'car' | 'bike' | 'scooter' | 'truck';
  license_number?: string;
  is_available: boolean;
  is_verified: boolean;
  current_lat?: number;
  current_lng?: number;
  last_location_update?: string;
  total_deliveries: number;
  rating: number;
  created_at: string;
  updated_at?: string;
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
  driver_lat?: number;
  driver_lng?: number;
  driver_last_update?: string;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address?: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
  delivery_fee_cents: number;
  distance_km?: number;
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

/**
 * Favorite (chef or dish)
 */
export interface Favorite {
  id: string;
  user_id: string;
  favoritable_type: 'chef' | 'dish';
  favoritable_id: string;
  created_at: string;
}

/**
 * Saved Delivery Address
 */
export interface SavedAddress {
  id: string;
  user_id: string;
  label: string; // "Home", "Work", etc.
  address: string;
  lat?: number;
  lng?: number;
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
  rating: number; // 1-5
  comment?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Push Token
 */
export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_type: 'ios' | 'android' | 'web';
  device_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}
