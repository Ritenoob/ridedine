import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../../lib/CartContext';
import { ReactNode } from 'react';

// Helper to wrap components in CartProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  it('should start with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.chefId).toBeNull();
  });

  it('should add an item to the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const testItem = {
      id: 'dish-1',
      name: 'Pasta Carbonara',
      price: 15.99,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    act(() => {
      result.current.addItem(testItem);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      ...testItem,
      quantity: 1,
    });
    expect(result.current.total).toBeCloseTo(15.99, 2);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.chefId).toBe('chef-1');
  });

  it('should increment quantity when adding the same item twice', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const testItem = {
      id: 'dish-1',
      name: 'Pasta Carbonara',
      price: 15.99,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    act(() => {
      result.current.addItem(testItem);
      result.current.addItem(testItem);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.total).toBeCloseTo(31.98, 2); // 15.99 * 2
    expect(result.current.totalItems).toBe(2);
  });

  it('should remove an item from the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const testItem = {
      id: 'dish-1',
      name: 'Pasta Carbonara',
      price: 15.99,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    act(() => {
      result.current.addItem(testItem);
    });

    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.removeItem('dish-1');
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.totalItems).toBe(0);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const testItem = {
      id: 'dish-1',
      name: 'Pasta Carbonara',
      price: 15.99,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    act(() => {
      result.current.addItem(testItem);
      result.current.updateQty('dish-1', 3);
    });

    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.total).toBeCloseTo(47.97, 2); // 15.99 * 3
    expect(result.current.totalItems).toBe(3);
  });

  it('should remove item when quantity is updated to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const testItem = {
      id: 'dish-1',
      name: 'Pasta Carbonara',
      price: 15.99,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    act(() => {
      result.current.addItem(testItem);
      result.current.updateQty('dish-1', 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should clear the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const testItem1 = {
      id: 'dish-1',
      name: 'Pasta Carbonara',
      price: 15.99,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    const testItem2 = {
      id: 'dish-2',
      name: 'Pizza Margherita',
      price: 12.50,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    act(() => {
      result.current.addItem(testItem1);
      result.current.addItem(testItem2);
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.chefId).toBeNull();
  });

  it('should calculate total correctly with multiple items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const testItem1 = {
      id: 'dish-1',
      name: 'Pasta Carbonara',
      price: 15.99,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    const testItem2 = {
      id: 'dish-2',
      name: 'Pizza Margherita',
      price: 12.50,
      chefId: 'chef-1',
      chefName: 'Chef Mario',
    };

    act(() => {
      result.current.addItem(testItem1);
      result.current.addItem(testItem1); // quantity: 2
      result.current.addItem(testItem2); // quantity: 1
    });

    expect(result.current.totalItems).toBe(3);
    expect(result.current.total).toBeCloseTo(44.48, 2); // (15.99 * 2) + (12.50 * 1) - use toBeCloseTo for floats
  });
});
