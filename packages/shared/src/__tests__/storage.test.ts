import { describe, it, expect } from 'vitest';
import {
  STORAGE_BUCKETS,
  getChefPhotoUrl,
  getDishPhotoUrl,
  getDeliveryProofUrl,
  getStoragePath,
  isValidImageFile,
  resizeImage,
} from '../storage';

describe('Storage Utilities', () => {
  describe('STORAGE_BUCKETS', () => {
    it('should define all required bucket names', () => {
      expect(STORAGE_BUCKETS.CHEF_PHOTOS).toBe('chef-photos');
      expect(STORAGE_BUCKETS.DISH_PHOTOS).toBe('dish-photos');
      expect(STORAGE_BUCKETS.DELIVERY_PROOF).toBe('delivery-proof');
    });
  });

  describe('getChefPhotoUrl', () => {
    it('should generate correct URL for chef photo', () => {
      const url = getChefPhotoUrl('https://example.supabase.co', 'chef-123', 'profile.jpg');
      expect(url).toBe(
        'https://example.supabase.co/storage/v1/object/public/chef-photos/chef-123/profile.jpg'
      );
    });

    it('should return null for missing parameters', () => {
      expect(getChefPhotoUrl('', 'chef-123', 'profile.jpg')).toBeNull();
      expect(getChefPhotoUrl('https://example.supabase.co', '', 'profile.jpg')).toBeNull();
      expect(getChefPhotoUrl('https://example.supabase.co', 'chef-123', '')).toBeNull();
    });
  });

  describe('getDishPhotoUrl', () => {
    it('should generate correct URL for dish photo', () => {
      const url = getDishPhotoUrl('https://example.supabase.co', 'dish-456', 'photo.jpg');
      expect(url).toBe(
        'https://example.supabase.co/storage/v1/object/public/dish-photos/dish-456/photo.jpg'
      );
    });

    it('should return null for missing parameters', () => {
      expect(getDishPhotoUrl('', 'dish-456', 'photo.jpg')).toBeNull();
      expect(getDishPhotoUrl('https://example.supabase.co', '', 'photo.jpg')).toBeNull();
      expect(getDishPhotoUrl('https://example.supabase.co', 'dish-456', '')).toBeNull();
    });
  });

  describe('getDeliveryProofUrl', () => {
    it('should generate correct URL for delivery proof', () => {
      const url = getDeliveryProofUrl(
        'https://example.supabase.co',
        'order-789',
        'proof.jpg'
      );
      expect(url).toBe(
        'https://example.supabase.co/storage/v1/object/public/delivery-proof/order-789/proof.jpg'
      );
    });

    it('should return null for missing parameters', () => {
      expect(getDeliveryProofUrl('', 'order-789', 'proof.jpg')).toBeNull();
      expect(getDeliveryProofUrl('https://example.supabase.co', '', 'proof.jpg')).toBeNull();
      expect(getDeliveryProofUrl('https://example.supabase.co', 'order-789', '')).toBeNull();
    });
  });

  describe('getStoragePath', () => {
    it('should generate storage path with timestamp', () => {
      const path = getStoragePath('chef-123', 'profile.jpg');
      expect(path).toMatch(/^chef-123\/\d+-profile\.jpg$/);
    });

    it('should generate unique filename with timestamp', async () => {
      const path1 = getStoragePath('chef-123', 'photo.jpg');
      // Wait 1ms to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));
      const path2 = getStoragePath('chef-123', 'photo.jpg');

      expect(path1).toMatch(/^chef-123\/\d+-photo\.jpg$/);
      expect(path2).toMatch(/^chef-123\/\d+-photo\.jpg$/);
      expect(path1).not.toBe(path2); // Different timestamps
    });
  });

  describe('isValidImageFile', () => {
    it('should accept valid image MIME types', () => {
      expect(isValidImageFile('image/jpeg')).toBe(true);
      expect(isValidImageFile('image/jpg')).toBe(true);
      expect(isValidImageFile('image/png')).toBe(true);
      expect(isValidImageFile('image/webp')).toBe(true);
      expect(isValidImageFile('image/gif')).toBe(true);
    });

    it('should reject invalid MIME types', () => {
      expect(isValidImageFile('text/plain')).toBe(false);
      expect(isValidImageFile('application/pdf')).toBe(false);
      expect(isValidImageFile('video/mp4')).toBe(false);
      expect(isValidImageFile('')).toBe(false);
    });
  });

  describe('resizeImage', () => {
    it('should return null for non-browser environment', async () => {
      // In Node.js test environment (no canvas API)
      const result = await resizeImage(new File([], 'test.jpg'), 1200);
      expect(result).toBeNull();
    });
  });
});
