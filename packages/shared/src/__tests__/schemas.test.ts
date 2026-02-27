import { describe, it, expect } from 'vitest';
import {
  SignUpSchema,
  SignInSchema,
  UpdateProfileSchema,
  CreateMenuItemSchema,
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  CreateChefProfileSchema,
} from '../schemas';
import { UserRole, DeliveryMethod, OrderStatus } from '../enums';

describe('Auth Schemas', () => {
  describe('SignUpSchema', () => {
    it('should validate valid signup data', () => {
      const valid = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
        phone: '555-1234',
        role: UserRole.CUSTOMER,
      };
      expect(() => SignUpSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'notanemail',
        password: 'password123',
        name: 'John',
        role: UserRole.CUSTOMER,
      };
      expect(() => SignUpSchema.parse(invalid)).toThrow();
    });

    it('should reject password less than 8 characters', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'short',
        name: 'John',
        role: UserRole.CUSTOMER,
      };
      expect(() => SignUpSchema.parse(invalid)).toThrow();
    });

    it('should reject name less than 2 characters', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'password123',
        name: 'J',
        role: UserRole.CUSTOMER,
      };
      expect(() => SignUpSchema.parse(invalid)).toThrow();
    });
  });

  describe('SignInSchema', () => {
    it('should validate valid signin data', () => {
      const valid = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(() => SignInSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'notanemail',
        password: 'password123',
      };
      expect(() => SignInSchema.parse(invalid)).toThrow();
    });
  });
});

describe('Profile Schemas', () => {
  describe('UpdateProfileSchema', () => {
    it('should validate valid profile update', () => {
      const valid = {
        name: 'Jane Doe',
        phone: '555-5678',
        address: '123 Main St',
      };
      expect(() => UpdateProfileSchema.parse(valid)).not.toThrow();
    });

    it('should allow empty update', () => {
      const valid = {};
      expect(() => UpdateProfileSchema.parse(valid)).not.toThrow();
    });

    it('should reject name less than 2 characters', () => {
      const invalid = {
        name: 'J',
      };
      expect(() => UpdateProfileSchema.parse(invalid)).toThrow();
    });
  });
});

describe('Chef Schemas', () => {
  describe('CreateChefProfileSchema', () => {
    it('should validate valid chef profile', () => {
      const valid = {
        bio: 'Passionate chef',
        cuisine_types: ['italian', 'french'],
        address: '123 Main St',
        lat: 40.7128,
        lng: -74.0060,
      };
      expect(() => CreateChefProfileSchema.parse(valid)).not.toThrow();
    });

    it('should require address and coordinates', () => {
      const invalid = {
        bio: 'Passionate chef',
      };
      expect(() => CreateChefProfileSchema.parse(invalid)).toThrow();
    });
  });
});

describe('Menu Item Schemas', () => {
  describe('CreateMenuItemSchema', () => {
    it('should validate valid menu item', () => {
      const valid = {
        menu_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Pasta Carbonara',
        description: 'Creamy pasta with bacon',
        price_cents: 1599,
        is_available: true,
        dietary_tags: ['gluten'],
      };
      expect(() => CreateMenuItemSchema.parse(valid)).not.toThrow();
    });

    it('should reject negative price', () => {
      const invalid = {
        menu_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Pasta',
        price_cents: -100,
      };
      expect(() => CreateMenuItemSchema.parse(invalid)).toThrow();
    });

    it('should reject zero price', () => {
      const invalid = {
        menu_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Pasta',
        price_cents: 0,
      };
      expect(() => CreateMenuItemSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid UUID', () => {
      const invalid = {
        menu_id: 'not-a-uuid',
        name: 'Pasta',
        price_cents: 1599,
      };
      expect(() => CreateMenuItemSchema.parse(invalid)).toThrow();
    });

    it('should reject short name', () => {
      const invalid = {
        menu_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'P',
        price_cents: 1599,
      };
      expect(() => CreateMenuItemSchema.parse(invalid)).toThrow();
    });
  });
});

describe('Order Schemas', () => {
  describe('CreateOrderSchema', () => {
    it('should validate valid order', () => {
      const valid = {
        chef_id: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            menu_item_id: '223e4567-e89b-12d3-a456-426614174000',
            quantity: 2,
            special_instructions: 'No onions',
          },
        ],
        delivery_method: DeliveryMethod.DELIVERY,
        address: '123 Main St',
        lat: 40.7128,
        lng: -74.0060,
        notes: 'Leave at door',
      };
      expect(() => CreateOrderSchema.parse(valid)).not.toThrow();
    });

    it('should reject empty items array', () => {
      const invalid = {
        chef_id: '123e4567-e89b-12d3-a456-426614174000',
        items: [],
        delivery_method: DeliveryMethod.DELIVERY,
      };
      expect(() => CreateOrderSchema.parse(invalid)).toThrow();
    });

    it('should reject negative quantity', () => {
      const invalid = {
        chef_id: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            menu_item_id: '223e4567-e89b-12d3-a456-426614174000',
            quantity: -1,
          },
        ],
        delivery_method: DeliveryMethod.DELIVERY,
      };
      expect(() => CreateOrderSchema.parse(invalid)).toThrow();
    });

    it('should reject zero quantity', () => {
      const invalid = {
        chef_id: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            menu_item_id: '223e4567-e89b-12d3-a456-426614174000',
            quantity: 0,
          },
        ],
        delivery_method: DeliveryMethod.DELIVERY,
      };
      expect(() => CreateOrderSchema.parse(invalid)).toThrow();
    });
  });

  describe('UpdateOrderStatusSchema', () => {
    it('should validate valid status update', () => {
      const valid = {
        status: OrderStatus.ACCEPTED,
      };
      expect(() => UpdateOrderStatusSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid status', () => {
      const invalid = {
        status: 'invalid_status',
      };
      expect(() => UpdateOrderStatusSchema.parse(invalid)).toThrow();
    });
  });
});
