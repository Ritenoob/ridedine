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
