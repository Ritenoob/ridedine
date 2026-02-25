import { describe, it, expect } from 'bun:test';
import { calculateDistance } from '@home-chef/shared';

describe('calculateDistance', () => {
  it('should return 0 for same coordinates', () => {
    const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
    expect(distance).toBe(0);
  });

  it('should calculate distance between New York and Los Angeles (approx 3944 km)', () => {
    const distance = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });

  it('should calculate distance between London and Paris (approx 344 km)', () => {
    const distance = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(distance).toBeGreaterThan(340);
    expect(distance).toBeLessThan(350);
  });

  it('should handle negative coordinates (southern/western hemispheres)', () => {
    const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(distance).toBeGreaterThan(700);
    expect(distance).toBeLessThan(730);
  });

  it('should calculate short distances accurately (within 15km)', () => {
    const distance = calculateDistance(40.7128, -74.006, 40.8028, -74.006);
    expect(distance).toBeGreaterThan(9);
    expect(distance).toBeLessThan(11);
  });

  it('should be symmetric (distance A->B equals B->A)', () => {
    const dist1 = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
    const dist2 = calculateDistance(34.0522, -118.2437, 40.7128, -74.006);
    expect(dist1).toBe(dist2);
  });
});
