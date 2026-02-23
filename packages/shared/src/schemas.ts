import { z } from 'zod';
import { UserRole, OrderStatus, DeliveryMethod, ChefStatus } from './enums';

/**
 * Auth Schemas
 */
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * Profile Schemas
 */
export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

/**
 * Chef Schemas
 */
export const CreateChefProfileSchema = z.object({
  bio: z.string().optional(),
  cuisine_types: z.array(z.string()).optional(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
});

export const UpdateChefStatusSchema = z.object({
  status: z.nativeEnum(ChefStatus),
});

/**
 * Menu Schemas
 */
export const CreateMenuSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const UpdateMenuSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

/**
 * Menu Item Schemas
 */
export const CreateMenuItemSchema = z.object({
  menu_id: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  price_cents: z.number().int().positive(),
  is_available: z.boolean().default(true),
  photo_url: z.string().url().optional(),
  dietary_tags: z.array(z.string()).optional(),
});

export const UpdateMenuItemSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price_cents: z.number().int().positive().optional(),
  is_available: z.boolean().optional(),
  photo_url: z.string().url().optional(),
  dietary_tags: z.array(z.string()).optional(),
});

/**
 * Order Schemas
 */
export const CreateOrderSchema = z.object({
  chef_id: z.string().uuid(),
  items: z.array(
    z.object({
      menu_item_id: z.string().uuid(),
      quantity: z.number().int().positive(),
      special_instructions: z.string().optional(),
    })
  ).min(1),
  delivery_method: z.nativeEnum(DeliveryMethod),
  scheduled_for: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

/**
 * Cart Schemas
 */
export const AddToCartSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  special_instructions: z.string().optional(),
});

/**
 * Checkout Schemas
 */
export const CheckoutAddressSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  delivery_address: z.string().optional(),
  delivery_method: z.nativeEnum(DeliveryMethod),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
}).refine(
  (data) => {
    // If delivery method is DELIVERY, address must be provided and at least 5 characters
    if (data.delivery_method === DeliveryMethod.DELIVERY) {
      return data.delivery_address && data.delivery_address.length >= 5;
    }
    return true;
  },
  {
    message: 'Delivery address is required and must be at least 5 characters for delivery orders',
    path: ['delivery_address'],
  }
);

/**
 * Review Schemas
 */
export const CreateReviewSchema = z.object({
  chef_id: z.string().uuid(),
  order_id: z.string().uuid(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
});

export const UpdateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

/**
 * Saved Address Schemas
 */
export const CreateSavedAddressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label must be less than 50 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  is_default: z.boolean().default(false),
});

export const UpdateSavedAddressSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  address: z.string().min(5).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  is_default: z.boolean().optional(),
});

/**
 * Favorite Schemas
 */
export const CreateFavoriteSchema = z.object({
  favoritable_type: z.enum(['chef', 'dish']),
  favoritable_id: z.string().uuid(),
});

/**
 * Dish Schemas
 */
export const CreateDishSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price_cents: z.number().int().positive('Price must be positive'),
  image_url: z.string().url().optional(),
  available: z.boolean().default(true),
  cuisine_type: z.string().optional(),
  dietary_tags: z.array(z.string()).optional(),
});

export const UpdateDishSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price_cents: z.number().int().positive().optional(),
  image_url: z.string().url().optional(),
  available: z.boolean().optional(),
  cuisine_type: z.string().optional(),
  dietary_tags: z.array(z.string()).optional(),
});

/**
 * Type exports for inference
 */
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateChefProfileInput = z.infer<typeof CreateChefProfileSchema>;
export type UpdateChefStatusInput = z.infer<typeof UpdateChefStatusSchema>;
export type CreateMenuInput = z.infer<typeof CreateMenuSchema>;
export type UpdateMenuInput = z.infer<typeof UpdateMenuSchema>;
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type CheckoutAddressInput = z.infer<typeof CheckoutAddressSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type CreateSavedAddressInput = z.infer<typeof CreateSavedAddressSchema>;
export type UpdateSavedAddressInput = z.infer<typeof UpdateSavedAddressSchema>;
export type CreateFavoriteInput = z.infer<typeof CreateFavoriteSchema>;
export type CreateDishInput = z.infer<typeof CreateDishSchema>;
export type UpdateDishInput = z.infer<typeof UpdateDishSchema>;
