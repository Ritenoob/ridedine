import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance, isValidCoordinate } from '../geo';

describe('geo utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // San Francisco to Los Angeles (approx 559 km)
      const sfLat = 37.7749;
      const sfLng = -122.4194;
      const laLat = 34.0522;
      const laLng = -118.2437;

      const distance = calculateDistance(sfLat, sfLng, laLat, laLng);

      // Allow 10km margin for Haversine approximation
      expect(distance).toBeGreaterThan(549);
      expect(distance).toBeLessThan(569);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBe(0);
    });

    it('should calculate short distances accurately', () => {
      // 1 block in San Francisco (approx 0.1 km)
      const distance = calculateDistance(37.7749, -122.4194, 37.7759, -122.4194);
      expect(distance).toBeLessThan(1);
      expect(distance).toBeGreaterThan(0);
    });

    it('should handle negative coordinates', () => {
      // Southern hemisphere coordinates
      const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(750);
    });

    it('should handle coordinates across international date line', () => {
      // East to west across date line
      const distance = calculateDistance(35.6762, 139.6503, 21.3099, -157.8581);
      expect(distance).toBeGreaterThan(6000);
      expect(distance).toBeLessThan(7000);
    });
  });

  describe('formatDistance', () => {
    it('should format distance under 1km in meters', () => {
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(0.123)).toBe('123 m');
      expect(formatDistance(0.999)).toBe('999 m');
    });

    it('should format distance 1km and above in km', () => {
      expect(formatDistance(1.0)).toBe('1.0 km');
      expect(formatDistance(5.234)).toBe('5.2 km');
      expect(formatDistance(10.789)).toBe('10.8 km');
      expect(formatDistance(100.5)).toBe('100.5 km');
    });

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0 m');
    });

    it('should handle very large distances', () => {
      expect(formatDistance(1234.567)).toBe('1234.6 km');
    });
  });

  describe('isValidCoordinate', () => {
    it('should validate correct latitude', () => {
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(37.7749, -122.4194)).toBe(true);
      expect(isValidCoordinate(-90, 180)).toBe(true);
      expect(isValidCoordinate(90, -180)).toBe(true);
    });

    it('should reject invalid latitude', () => {
      expect(isValidCoordinate(91, 0)).toBe(false);
      expect(isValidCoordinate(-91, 0)).toBe(false);
      expect(isValidCoordinate(100, 50)).toBe(false);
    });

    it('should reject invalid longitude', () => {
      expect(isValidCoordinate(0, 181)).toBe(false);
      expect(isValidCoordinate(0, -181)).toBe(false);
      expect(isValidCoordinate(45, 200)).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isValidCoordinate(null as unknown as number, 0)).toBe(false);
      expect(isValidCoordinate(0, undefined as unknown as number)).toBe(false);
      expect(isValidCoordinate(NaN, 0)).toBe(false);
    });
  });
});
